#!/usr/bin/env python3
"""
Acme FinOps Assistant — Real Standalone Agent Application

Demonstrates drop-in Kyron 2.0 protection over an existing customer MCP project:
  - `--mode unprotected`: Spawns `python mcp_server.py` directly (exposes injections & leaks secrets).
  - `--mode kyron`:       Wraps the EXACT SAME command with `kyron-gateway stdio -- python mcp_server.py`
                          with ZERO changes to mcp_server.py or agent logic!

Every tool discovery, execution, secret redaction, and block streams straight to the
live Kyron Control Plane UI (`http://127.0.0.1:5173/console`).
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROJECT_DIR = Path(__file__).resolve().parent
MCP_SERVER = PROJECT_DIR / "mcp_server.py"
GATEWAY_EXE = REPO_ROOT / "gateway" / "kyron-gateway.exe"


class StdioMCPClient:
    def __init__(self, cmd: list[str]) -> None:
        self.cmd = cmd
        self.proc: Optional[subprocess.Popen[str]] = None
        self._id = 0

    def __enter__(self) -> "StdioMCPClient":
        self.proc = subprocess.Popen(
            self.cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        return self

    def __exit__(self, *args: Any) -> None:
        if self.proc is not None:
            try:
                if self.proc.stdin:
                    self.proc.stdin.close()
                self.proc.terminate()
                self.proc.wait(timeout=3)
            except Exception:
                try:
                    self.proc.kill()
                except Exception:
                    pass

    def call_rpc(self, method: str, params: Optional[Dict[str, Any]] = None) -> tuple[dict, float]:
        assert self.proc and self.proc.stdin and self.proc.stdout
        self._id += 1
        req: Dict[str, Any] = {"jsonrpc": "2.0", "id": self._id, "method": method}
        if params is not None:
            req["params"] = params

        t0 = time.perf_counter()
        self.proc.stdin.write(json.dumps(req) + "\n")
        self.proc.stdin.flush()

        line = self.proc.stdout.readline()
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        if not line:
            stderr_out = self.proc.stderr.read() if self.proc.stderr else ""
            raise RuntimeError(f"Subprocess closed stdout unexpectedly. stderr:\n{stderr_out}")
        return json.loads(line.strip()), elapsed_ms


def run_demo(mode: str) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    if mode == "kyron":
        if not GATEWAY_EXE.exists():
            print(f"[ERROR] Missing gateway binary at {GATEWAY_EXE}. Build it first.")
            return 1
        cmd = [str(GATEWAY_EXE), "stdio", "--", sys.executable, str(MCP_SERVER)]
        banner_label = "PROTECTED VIA KYRON 2.0 STDIO GATEWAY"
        color = "\033[92m"
    else:
        cmd = [sys.executable, str(MCP_SERVER)]
        banner_label = "UNPROTECTED DIRECT MCP (BASELINE VULNERABILITY)"
        color = "\033[91m"

    reset = "\033[0m"
    bold = "\033[1m"
    dim = "\033[2m"

    print(f"\n{bold}{color}{'=' * 78}{reset}")
    print(f"{bold}{color}  ACME FINOPS AGENT — {banner_label}{reset}")
    print(f"{dim}  Command: {' '.join(cmd)}{reset}")
    print(f"{bold}{color}{'=' * 78}{reset}\n")

    with StdioMCPClient(cmd) as mcp:
        # 1. Initialize
        init_resp, lat = mcp.call_rpc(
            "initialize",
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "acme-finops-agent", "version": "1.0.0"},
            },
        )
        srv = init_resp["result"]["serverInfo"]
        print(f"[1] MCP Initialize -> server={srv['name']} v{srv['version']} ({lat:.1f} ms)")

        # 2. List Tools
        list_resp, lat = mcp.call_rpc("tools/list", {})
        tools = list_resp["result"]["tools"]
        print(f"\n[2] MCP tools/list -> {len(tools)} tools exposed to LLM ({lat:.1f} ms):")
        for t in tools:
            print(f"    - {t['name']}: {t['description']}")

        # 3. Legitimate SQLite Database Query (`query_invoices`)
        inv_resp, lat = mcp.call_rpc("tools/call", {"name": "query_invoices", "arguments": {"status": "overdue"}})
        print(f"\n[3] Tool Call: query_invoices(status='overdue') ({lat:.1f} ms):")
        if "result" in inv_resp:
            print(f"    -> {inv_resp['result']['content'][0]['text']}")
        else:
            print(f"    -> ERROR: {inv_resp['error']}")

        # 4. System Diagnostics (Credential Leak vs Secrets Broker Redaction)
        diag_resp, lat = mcp.call_rpc("tools/call", {"name": "system_diagnostics", "arguments": {"verbose": True}})
        print(f"\n[4] Tool Call: system_diagnostics() ({lat:.1f} ms):")
        if "result" in diag_resp:
            for line in diag_resp["result"]["content"][0]["text"].splitlines():
                print(f"    | {line}")

        # 5. Attempted Call to Trojanized Vendor Plugin (`vendor_sync_telemetry`)
        attack_resp, lat = mcp.call_rpc(
            "tools/call",
            {"name": "vendor_sync_telemetry", "arguments": {"notes": "SSH_PRIVATE_KEY_PAYLOAD"}},
        )
        print(f"\n[5] Compromised Tool Call: vendor_sync_telemetry(...) ({lat:.1f} ms):")
        if "error" in attack_resp:
            print(f"    -> {color}INTERCEPTED & BLOCKED [{attack_resp['error']['code']}]: {attack_resp['error']['message']}{reset}")
        else:
            print(f"    -> \033[91mCOMPROMISED OUTPUT REACHED ATTACKER: {attack_resp['result']['content'][0]['text']}\033[0m")

    print(f"\n{bold}{color}{'=' * 78}{reset}\n")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Acme FinOps Real MCP Project Demo")
    parser.add_argument("--mode", choices=["unprotected", "kyron"], default="kyron")
    args = parser.parse_args()
    return run_demo(args.mode)


if __name__ == "__main__":
    sys.exit(main())
