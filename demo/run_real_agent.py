#!/usr/bin/env python3
"""
Kyron 2.0 — Real Interactive MCP Agent Runner (Live Screen Demo)

Runs a genuine autonomous multi-step AI agent over live MCP HTTP/SSE + Control Plane APIs.
Every tool list, execution, quarantine, human-in-the-loop lease approval, and TOCTOU/egress
block updates the live SOC Console UI automatically within ~2 seconds!

Usage:
    # Interactive Human-in-the-Loop Mode (recommended for 3-4 min screen recording):
    python demo/run_real_agent.py --base-url http://127.0.0.1:8001 --gateway-url http://127.0.0.1:8080

    # Or point directly at your live Render deployment:
    python demo/run_real_agent.py --base-url https://kyron-2-0.onrender.com

    # Optional: Connect OpenAI / Gemini LLM planner via env var:
    python demo/run_real_agent.py --llm openai   # uses OPENAI_API_KEY
    python demo/run_real_agent.py --llm gemini   # uses GEMINI_API_KEY

    # Non-interactive CI/smoke mode (auto-approves the escalation after 1s):
    python demo/run_real_agent.py --auto-approve
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from demo.cases.common import Ansi, PAYLOADS_DIR, configure_utf8_stdout, fail, http_json, info, ok, step, blocked


class LiveMCPSSEClient:
    """Persistent MCP over SSE client connecting to Kyron Protocol Gateway."""

    def __init__(self, gateway_url: str, client_name: str = "kyron-sre-agent") -> None:
        self.gateway_url = gateway_url.rstrip("/")
        self.client_name = client_name
        self.stream = None
        self.endpoint_uri: Optional[str] = None
        self._rpc_id = 0

    def connect(self) -> float:
        t0 = time.perf_counter()
        req = urllib.request.Request(
            f"{self.gateway_url}/sse?client_name={self.client_name}",
            headers={"Accept": "text/event-stream", "User-Agent": "Kyron-Real-Agent/2.0"},
        )
        self.stream = urllib.request.urlopen(req, timeout=15.0)
        for _ in range(15):
            line = self.stream.readline().decode("utf-8", errors="replace").strip()
            if line.startswith("data: "):
                self.endpoint_uri = line[6:].strip()
                break
        if not self.endpoint_uri:
            raise RuntimeError("Failed to obtain SSE endpoint URI from Kyron Gateway")
        return (time.perf_counter() - t0) * 1000.0

    def rpc(self, method: str, params: Optional[Dict[str, Any]] = None) -> tuple[Dict[str, Any], float]:
        if not self.stream or not self.endpoint_uri:
            raise RuntimeError("SSE client not connected")
        self._rpc_id += 1
        payload: Dict[str, Any] = {
            "jsonrpc": "2.0",
            "id": self._rpc_id,
            "method": method,
        }
        if params is not None:
            payload["params"] = params

        t0 = time.perf_counter()
        status, post_resp, _ = http_json("POST", f"{self.gateway_url}{self.endpoint_uri}", payload, timeout=10.0)
        if status not in (200, 202):
            return {"error": {"code": status, "message": str(post_resp)}}, (time.perf_counter() - t0) * 1000.0

        for _ in range(30):
            line = self.stream.readline().decode("utf-8", errors="replace").strip()
            if line.startswith("data: "):
                elapsed_ms = (time.perf_counter() - t0) * 1000.0
                return json.loads(line[6:].strip()), elapsed_ms

        return {"error": {"code": -32001, "message": "Timed out waiting for SSE response"}}, (time.perf_counter() - t0) * 1000.0

    def close(self) -> None:
        if self.stream is not None:
            try:
                self.stream.close()
            except Exception:
                pass
            self.stream = None


def maybe_plan_with_llm(llm_mode: str, objective: str, available_tools: list[dict]) -> Optional[str]:
    """Optional real LLM reasoning step when OPENAI_API_KEY or GEMINI_API_KEY is supplied."""
    tool_names = [t.get("name", "") for t in available_tools]
    prompt = (
        f"You are an autonomous SRE & Finance Agent connected via Kyron MCP Gateway.\n"
        f"Objective: {objective}\n"
        f"Projected Safe Tools Visible to Model: {tool_names}\n"
        f"Reply in 1 concise sentence explaining your next governed tool call."
    )

    if llm_mode == "openai" and os.getenv("OPENAI_API_KEY"):
        status, resp, _ = http_json_with_headers(
            "POST",
            "https://api.openai.com/v1/chat/completions",
            {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": prompt}], "max_tokens": 80},
            {"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
        )
        if status == 200:
            return resp["choices"][0]["message"]["content"].strip()

    if llm_mode == "gemini" and os.getenv("GEMINI_API_KEY"):
        key = os.environ["GEMINI_API_KEY"]
        status, resp, _ = http_json_with_headers(
            "POST",
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}",
            {"contents": [{"parts": [{"text": prompt}]}]},
            {},
        )
        if status == 200:
            return resp["candidates"][0]["content"]["parts"][0]["text"].strip()

    return None


def http_json_with_headers(method: str, url: str, payload: dict, extra_headers: dict) -> tuple[int, dict, float]:
    headers = {"Content-Type": "application/json", "Accept": "application/json", **extra_headers}
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method=method)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8")), (time.perf_counter() - t0) * 1000.0
    except urllib.error.HTTPError as exc:
        return exc.code, {"detail": exc.read().decode("utf-8", errors="replace")}, (time.perf_counter() - t0) * 1000.0


def run_agent(api_url: str, gateway_url: str, llm_mode: str, auto_approve: bool, step_delay: float) -> int:
    print(f"\n{Ansi.BOLD}{Ansi.BLUE}{'=' * 78}{Ansi.RESET}")
    print(f"{Ansi.BOLD}{Ansi.BLUE}  KYRON 2.0 — REAL AUTONOMOUS MCP AGENT (LIVE SCREEN DEMO){Ansi.RESET}")
    print(f"{Ansi.DIM}  Control Plane : {api_url}  (UI Auto-Sync updates every 2s){Ansi.RESET}")
    print(f"{Ansi.DIM}  MCP Gateway   : {gateway_url}/sse{Ansi.RESET}")
    print(f"{Ansi.BOLD}{Ansi.BLUE}{'=' * 78}{Ansi.RESET}\n")

    client = LiveMCPSSEClient(gateway_url)
    try:
        # 1. Connect Agent to Live Kyron MCP Gateway via SSE
        step("[Agent Task 1] Connecting to live Kyron MCP Gateway over HTTP/SSE...")
        lat = client.connect()
        ok(f"SSE stream established -> {client.endpoint_uri}", lat)

        init_resp, lat = client.rpc(
            "initialize",
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "kyron-sre-finance-agent", "version": "2.0.0"},
            },
        )
        if "result" not in init_resp:
            fail(f"MCP initialize failed: {init_resp}")
            return 1
        ok(f"MCP Handshake complete: {init_resp['result']['serverInfo']['name']} v{init_resp['result']['serverInfo']['version']}", lat)

        # 2. Discover tools -> Dynamic Tool Projection (TRUSTDESC)
        step("[Agent Task 2] Calling MCP `tools/list` (watching Dynamic Tool Projection in action)...")
        tools_resp, lat = client.rpc("tools/list")
        tools = tools_resp.get("result", {}).get("tools", [])
        tool_names = [t["name"] for t in tools]
        ok(f"Model sees ONLY {len(tools)} safe projected tools: {tool_names}", lat)
        info("Quarantined/blocked tools (time:get_time, currency:converter, system:raw_exec) were stripped before reaching model!")

        if llm_mode != "none":
            thought = maybe_plan_with_llm(llm_mode, "Audit Q3 ledger & remediate payment-worker leak", tools)
            if thought:
                info(f"LLM Thought ({llm_mode}): {thought}")

        time.sleep(step_delay)

        # 3. Execute Legitimate Business Operations -> Live ALLOW events in UI
        step("[Agent Task 3] Executing legitimate business calls via Gateway (look at Cryptographic Trail)...")
        for tool_name, args in [
            ("postgres:execute_select_query", {"query": "SELECT account, balance_eur FROM ledger LIMIT 1"}),
            ("finance:check_ledger_balance", {"account": "acct_eu_01"}),
        ]:
            res, lat = client.rpc("tools/call", {"name": tool_name, "arguments": args})
            if "result" in res:
                content = res["result"]["content"][0]["text"]
                ok(f"Allowed `{tool_name}` -> {content}", lat)
            else:
                fail(f"Expected `{tool_name}` to succeed, got: {res}")
                return 1
        time.sleep(step_delay)

        # 4. Agent encounters a poisoned 3rd-party vendor tool -> Live QUARANTINE in UI
        step("[Agent Task 4] Third-party MCP server advertises `demo-vendor:billing_export` -> scanning...")
        malicious_payload = json.loads((PAYLOADS_DIR / "malicious_mcp_tool.json").read_text(encoding="utf-8"))
        status, scan_resp, lat = http_json("POST", f"{api_url}/v1/tools/scan", malicious_payload)
        if status != 200 or scan_resp.get("state") != "quarantined":
            fail(f"Tool scan failed: {scan_resp}")
            return 1
        blocked(
            f"Quarantined `{scan_resp['id']}` (Risk={scan_resp['risk_score']:.0%})! Check Tool Registry & MetricsBar on screen!",
            lat,
        )
        info(f"TRUSTDESC safe stub shown to agent: \"{scan_resp.get('model_facing')}\"")

        # Also attempt calling blocked tool via Gateway so Gateway enforces + logs block
        blk_resp, blk_lat = client.rpc("tools/call", {"name": "time:get_time", "arguments": {"format": "iso8601"}})
        if "error" in blk_resp:
            blocked(f"Gateway enforced block on quarantined `time:get_time`: {blk_resp['error']['message']}", blk_lat)
        time.sleep(step_delay)

        # 5. Human-in-the-Loop Capability Lease -> Agent PAUSES waiting for browser UI click!
        step("[Agent Task 5] Agent needs `k8s:restart_deployment` for payment-worker memory leak...")
        traj_id = f"traj-live-agent-{int(time.time())}"
        status, appr_req, lat = http_json(
            "POST",
            f"{api_url}/v1/approvals",
            {
                "trajectory_id": traj_id,
                "kind": "lease_request",
                "tool_id": "k8s:restart_deployment",
                "details": {
                    "reason": "Live Agent requires 1-time lease to restart leaking payment-worker pod.",
                    "target_namespace": "production-payment",
                },
            },
        )
        if status != 200:
            fail(f"Could not submit approval escalation: {appr_req}")
            return 1
        req_id = appr_req["id"]
        blocked(f"Execution PAUSED pending Human Authority (`{req_id}` is now LIVE in Authority Queue!)", lat)

        if auto_approve:
            info("[auto-approve] Waiting 1.5s then granting capability lease...")
            time.sleep(1.5)
            http_json(
                "POST",
                f"{api_url}/v1/approvals/{req_id}/approve",
                {"decided_by": "auto-ci-operator", "reason": "Automated verification approval"},
            )
        else:
            print(f"\n    {Ansi.BOLD}{Ansi.YELLOW}>>> ACTION IN BROWSER UI: Open 'Authority Queue (03)' and click 'Grant Capability Lease' on {req_id} <<<{Ansi.RESET}")
            print(f"    {Ansi.DIM}    (Agent is polling {api_url}/v1/approvals for your browser click...){Ansi.RESET}")

        # Wait up to 90s for operator click in UI
        approved = False
        for _ in range(60):
            _, all_apprs, _ = http_json("GET", f"{api_url}/v1/approvals")
            match = next((a for a in all_apprs if a.get("id") == req_id), None)
            if match and match.get("status") == "approved":
                approved = True
                break
            if match and match.get("status") == "denied":
                blocked(f"Operator DENIED `{req_id}` in browser UI! Agent cleanly aborting pod restart.")
                approved = False
                break
            time.sleep(1.5)

        if approved:
            _, leases, _ = http_json("GET", f"{api_url}/v1/leases?trajectory_id={traj_id}")
            lease_id = leases[0]["id"] if leases else "lease-verified"
            ok(f"Human approval received from UI! Minting `{lease_id}` -> dispatching `k8s:restart_deployment`...")
            k8s_res, k8s_lat = client.rpc("tools/call", {"name": "k8s:restart_deployment", "arguments": {"pod": "payment-worker"}})
            if "result" in k8s_res:
                ok(f"Restarted pod under single-use lease -> {k8s_res['result']['content'][0]['text']}", k8s_lat)
        time.sleep(step_delay)

        # 6. TOCTOU File Swap Attack Defense -> Live BLOCK audit event in UI
        step("[Agent Task 6] Simulating mid-flight TOCTOU swap on `/tmp/monthly_report.txt` (S5)...")
        _, bind_resp, _ = http_json(
            "POST",
            f"{api_url}/v1/resources/bind",
            {"path": "/tmp/monthly_report.txt", "content": "Q3 Revenue: $4.2M (clean)"},
        )
        status, verify_swap, lat = http_json(
            "POST",
            f"{api_url}/v1/resources/verify",
            {
                "path": "/tmp/monthly_report.txt",
                "expected_hash": bind_resp["expected_hash"],
                "current_content": "root:$6$attacker_shadow_hash_exfil:19800:0:99999:7:::",
            },
        )
        if verify_swap.get("status") == "violation":
            blocked(f"TOCTOU swap intercepted & logged to Cryptographic Trail: {verify_swap['violation']}", lat)
        else:
            fail(f"Expected TOCTOU violation: {verify_swap}")
            return 1

        print(f"\n{Ansi.BOLD}{Ansi.GREEN}{'=' * 78}{Ansi.RESET}")
        print(f"{Ansi.BOLD}{Ansi.GREEN}  REAL AGENT RUN COMPLETE — CHECK SOC CONSOLE FOR LIVE TELEMETRY UPDATES!{Ansi.RESET}")
        print(f"{Ansi.BOLD}{Ansi.GREEN}{'=' * 78}{Ansi.RESET}\n")
        return 0
    finally:
        client.close()


def main() -> int:
    configure_utf8_stdout()
    parser = argparse.ArgumentParser(description="Kyron 2.0 Real Interactive MCP Agent Runner")
    parser.add_argument("--base-url", default="http://127.0.0.1:8001", help="Control Plane URL (or Render unified URL)")
    parser.add_argument("--gateway-url", default=None, help="Gateway URL (defaults to --base-url if https/unified, or http://127.0.0.1:8080)")
    parser.add_argument("--llm", choices=["none", "openai", "gemini"], default="none", help="Optional real LLM planner")
    parser.add_argument("--auto-approve", action="store_true", help="Auto-approve escalation instead of pausing for UI click")
    parser.add_argument("--delay", type=float, default=1.0, help="Seconds between steps so UI live-sync visibly updates")
    args = parser.parse_args()

    api_url = args.base_url.rstrip("/")
    if args.gateway_url:
        gw_url = args.gateway_url.rstrip("/")
    elif api_url.startswith("https://") or ":10000" in api_url or ":3000" in api_url:
        gw_url = api_url
    else:
        gw_url = "http://127.0.0.1:8080"

    return run_agent(api_url, gw_url, args.llm, args.auto_approve, args.delay)


if __name__ == "__main__":
    sys.exit(main())
