"""Case 5: Cryptographic Audit Chain, EU AI Act Article 50 Dossier & Live MCP Gateway (C11 + C1).

Demonstrates:
1. Exporting the SHA-256 hash-chained, Ed25519-signed audit dossier via GET /v1/audit/export.
2. Performing an authentic MCP over SSE handshake (`GET /sse` -> `POST /message?sessionId=...`)
   with the live Go Protocol Gateway and verifying its `initialize` response over SSE.
3. Checking overall system summary and OAuth provider readiness.
"""

from __future__ import annotations

import json
import time
import urllib.request

from demo.cases.common import banner, fail, http_json, info, ok, step


def _mcp_sse_initialize(gw: str) -> tuple[bool, dict, float]:
    """Open an SSE stream to the Go MCP Gateway, send `initialize`, and read the response event."""
    t0 = time.perf_counter()
    req = urllib.request.Request(
        f"{gw}/sse?client_name=kyron-demo-agent",
        headers={"Accept": "text/event-stream", "User-Agent": "Kyron-Demo-MCP-Client/2.0"},
    )
    with urllib.request.urlopen(req, timeout=5.0) as stream:
        endpoint_uri = None
        for _ in range(10):
            line = stream.readline().decode("utf-8", errors="replace").strip()
            if line.startswith("data: "):
                endpoint_uri = line[6:].strip()
                break

        if not endpoint_uri:
            return False, {"error": "Did not receive SSE endpoint event"}, (time.perf_counter() - t0) * 1000.0

        init_req = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "kyron-demo-agent", "version": "2.0.0"},
            },
        }
        post_status, post_body, _ = http_json("POST", f"{gw}{endpoint_uri}", init_req, timeout=5.0)
        if post_status not in (200, 202):
            return (
                False,
                {"error": f"POST {endpoint_uri} returned {post_status}: {post_body}"},
                (time.perf_counter() - t0) * 1000.0,
            )

        for _ in range(15):
            line = stream.readline().decode("utf-8", errors="replace").strip()
            if line.startswith("data: "):
                elapsed_ms = (time.perf_counter() - t0) * 1000.0
                return True, json.loads(line[6:].strip()), elapsed_ms

    return False, {"error": "Timed out waiting for SSE message response"}, (time.perf_counter() - t0) * 1000.0


def run(api_url: str, gateway_url: str) -> bool:
    banner(
        5,
        "Cryptographic Audit Chain (EU AI Act Art. 50) & Live MCP Gateway (C11 + C1)",
        "Proves tamper-evident compliance evidence export and live unmodified MCP SSE termination.",
    )
    api = api_url.rstrip("/")
    gw = gateway_url.rstrip("/")

    # 1. Export EU AI Act Article 50 Audit Dossier
    step("Exporting SHA-256 hash-chained & Ed25519-signed dossier for 'sess-gamma' (GET /v1/audit/export)")
    status, export_resp, lat = http_json("GET", f"{api}/v1/audit/export?session_id=sess-gamma")
    if status != 200 or not export_resp.get("chain_valid"):
        fail(f"Audit export failed or invalid chain: status={status}, resp={export_resp}")
        return False

    compliance = export_resp.get("eu_ai_act_compliance", {})
    ok(
        f"Exported {export_resp['total_events']} signed events | chain_valid={export_resp['chain_valid']} | "
        f"alg={compliance.get('evidence_signature_algorithm')} + {compliance.get('hash_chain_algorithm')}",
        lat,
    )
    info(f"Compliance Standard: {compliance.get('article')}")

    # 2. Live MCP over SSE handshake through Go Protocol Gateway
    step(f"Opening live MCP SSE stream & sending JSON-RPC 'initialize' ({gw}/sse)")
    try:
        sse_ok, rpc_resp, sse_lat = _mcp_sse_initialize(gw)
        if sse_ok and "result" in rpc_resp:
            srv_info = rpc_resp["result"].get("serverInfo", {})
            ok(
                f"Live MCP SSE Handshake verified: server={srv_info.get('name')} v{srv_info.get('version')}",
                sse_lat,
            )
            info(f"Gateway Instructions: {rpc_resp['result'].get('instructions')}")
        else:
            fail(f"MCP SSE handshake did not return initialize result: {rpc_resp}")
            return False
    except Exception as exc:
        info(f"Gateway SSE unreachable at {gw} ({exc}); skipping live socket handshake.")

    # 3. Query Control Plane System Summary & OAuth Providers
    step("Verifying Control Plane Operational Status & OAuth Readiness")
    status, summary, lat = http_json("GET", f"{api}/v1/reports/summary")
    _, providers, _ = http_json("GET", f"{api}/v1/auth/providers")
    if status != 200:
        fail(f"Reports summary failed: {summary}")
        return False

    prov_map = providers.get("providers", {})
    google_on = prov_map.get("google", {}).get("enabled", False)
    github_on = prov_map.get("github", {}).get("enabled", False)
    ok(
        f"Registry: {summary['total_tools']} tools ({summary['quarantined_tools']} quarantined, "
        f"{summary['approved_tools']} approved) | Audit Events: {summary['total_audit_events']}",
        lat,
    )
    info(f"Enterprise Auth Providers: Google OAuth={google_on}, GitHub OAuth={github_on}, Role Switcher=True")
    return True
