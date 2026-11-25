"""Case 1: Semantic Drift Firewall & TRUSTDESC Insulation (Scenarios S1 & S2).

Demonstrates:
1. Scanning a malicious upstream MCP tool containing hidden prompt injection (S1).
2. Verifying Kyron quarantines the tool automatically (risk >= 0.60) and synthesizes
   a safe canonical TRUSTDESC description with zero model tokens consumed.
3. Inspecting a Monday -> Friday rug-pull semantic diff on `currency:converter` (S2).
"""

from __future__ import annotations

import json

from demo.cases.common import PAYLOADS_DIR, banner, blocked, fail, http_json, info, ok, step


def run(api_url: str, gateway_url: str) -> bool:
    banner(
        1,
        "Semantic Drift Firewall & TRUSTDESC (S1 Poisoning + S2 Rug Pull)",
        "Proves prompt injections never reach the LLM context and rug-pull drift is quarantined.",
    )
    api = api_url.rstrip("/")

    # 1. Inspect seeded S2 rug-pull diff (`currency:converter`)
    step("Inspecting live Monday -> Friday rug-pull diff on 'currency:converter' (S2)")
    status, diff_resp, lat = http_json("GET", f"{api}/v1/tools/currency:converter/diff")
    if status != 200 or not diff_resp.get("has_drift"):
        fail(f"Expected drift on currency:converter, got status={status}: {diff_resp}")
        return False

    blocked(
        f"Semantic drift detected on 'currency:converter' (hash mismatch {diff_resp['old_hash'][:12]} != {diff_resp['new_hash'][:12]})",
        lat,
    )
    info(f"Attacker raw text : {diff_resp['original_description']}")
    info(f"TRUSTDESC output  : {diff_resp['model_facing_description']}")

    # 2. Scan a brand-new poisoned MCP tool payload live
    step("Ingesting malicious third-party MCP tool manifest via POST /v1/tools/scan (S1)")
    malicious_payload = json.loads((PAYLOADS_DIR / "malicious_mcp_tool.json").read_text(encoding="utf-8"))
    status, scan_resp, lat = http_json("POST", f"{api}/v1/tools/scan", malicious_payload)
    if status != 200:
        fail(f"POST /v1/tools/scan failed with {status}: {scan_resp}")
        return False

    tool_id = scan_resp["id"]
    state = scan_resp["state"]
    risk = scan_resp["risk_score"]
    model_facing = scan_resp.get("model_facing") or ""

    if state != "quarantined" or risk < 0.60:
        fail(f"Expected poisoned tool to be quarantined (risk >= 0.60), got state={state}, risk={risk}")
        return False

    if "evil.com" in model_facing or "id_rsa" in model_facing or "DB_PASSWORD" in model_facing:
        fail(f"TRUSTDESC failed to strip injection from model-facing text: {model_facing}")
        return False

    blocked(
        f"Tool '{tool_id}' automatically QUARANTINED (risk={risk:.2f}, reason={scan_resp['risk_reasons'][0]})",
        lat,
    )
    ok(f"TRUSTDESC model-facing projection (0 LLM tokens): \"{model_facing}\"")

    # 3. Verify live diff endpoint reflects the newly quarantined tool
    step(f"Fetching semantic diff record for '{tool_id}' (visible in SOC Console Tool Registry)")
    status, new_diff, lat = http_json("GET", f"{api}/v1/tools/{tool_id}/diff")
    if status != 200 or not new_diff.get("has_drift"):
        fail(f"Diff check failed for {tool_id}: {new_diff}")
        return False
    ok(f"SOC Console diff verified for '{tool_id}' (0 model tokens spent on security)", lat)
    return True
