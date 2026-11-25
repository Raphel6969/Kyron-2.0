"""Case 3: Network Egress Broker, Sharded Exfiltration & Adaptive Red-Team (S3 + S4 + RQ6).

Demonstrates:
1. Checking the live Go MCP Gateway `/healthz` confirming `egress_broker` and `secrets_broker`.
2. Replaying a recorded trace with covert sharded exfiltration & poisoned tool calls through
   `POST /v1/policies/simulate` (dry-run delta before policy activation).
3. Executing the live RQ6 Adaptive Red-Team suite (`GET /v1/eval/adaptive-redteam`) proving
   homoglyphs, base64 smuggling, and 16-byte sharded micro-egress (AA-6) are blocked structurally.
4. Querying live `/impact` telemetry metrics.
"""

from __future__ import annotations

from demo.cases.common import banner, blocked, fail, http_json, info, ok, step


def run(api_url: str, gateway_url: str) -> bool:
    banner(
        3,
        "Egress Broker, Sharded Exfiltration & Adaptive Red-Team (S3 + S4 + RQ6)",
        "Proves multi-call sharded exfiltration, SSRF, and scanner-evasion vectors are stopped structurally.",
    )
    api = api_url.rstrip("/")
    gw = gateway_url.rstrip("/")

    # 1. Verify live Gateway health & active brokers
    step(f"Checking live Go Protocol Gateway ({gw}/healthz)")
    status, gw_health, lat = http_json("GET", f"{gw}/healthz")
    if status == 200 and gw_health.get("status") == "healthy":
        checks = gw_health.get("checks", {})
        ok(
            f"Go Gateway healthy (egress_broker={checks.get('egress_broker')}, secrets_broker={checks.get('secrets_broker')})",
            lat,
        )
    else:
        info(f"Gateway HTTP health check returned status={status}; continuing with Control Plane verification.")

    # 2. Trace replay simulation via POST /v1/policies/simulate
    step("Replaying mixed normal + adversarial call trace via POST /v1/policies/simulate")
    trace_events = [
        {"tool_id": "github:read_file", "bytes": 120},
        {"tool_id": "postgres:execute_select_query", "bytes": 240},
        {"tool_id": "s1_poison", "bytes": 64},
        {"tool_id": "poison_exfil_sharded_41", "bytes": 32},
    ]
    status, sim_resp, lat = http_json(
        "POST",
        f"{api}/v1/policies/simulate",
        {
            "policy_content": "[meta]\nmode='enforce'\nquarantined='block'",
            "trace_events": trace_events,
        },
    )
    if status != 200 or sim_resp.get("would_block_count", 0) < 2:
        fail(f"Policy simulation failed: status={status}, resp={sim_resp}")
        return False

    blocked(
        f"Trace Replay: {sim_resp['would_allow_count']} allowed, "
        f"{sim_resp['would_block_count']} blocked ({sim_resp['blocked_tools']})",
        lat,
    )

    # 3. Live RQ6 Adaptive Red-Team Evaluation (Homoglyphs, Paraphrase, Base64, TOCTOU, Sharded Egress)
    step("Executing live RQ6 Adaptive Red-Team Evaluation (GET /v1/eval/adaptive-redteam)")
    status, rq6, lat = http_json("GET", f"{api}/v1/eval/adaptive-redteam")
    if status != 200:
        fail(f"GET /v1/eval/adaptive-redteam failed: status={status}, resp={rq6}")
        return False

    metrics = rq6.get("metrics", {})
    scanner_asr = metrics.get("scanner_only", {}).get("attack_success_rate_pct")
    kyron_asr = metrics.get("kyron_full_stack", {}).get("attack_success_rate_pct")
    if not rq6.get("hypothesis_confirmed") or kyron_asr != 0.0:
        fail(f"Expected 0.0% Kyron attack success rate in RQ6, got {metrics}")
        return False

    ok(
        f"RQ6 Adaptive Evasion Benchmark: Scanner-Only Attack Success={scanner_asr}% vs Kyron 7-Stage={kyron_asr}%",
        lat,
    )
    for atk in rq6.get("attacks", []):
        sc_out = atk.get("scanner_only", {}).get("attack_outcome")
        ky_out = atk.get("kyron_full_stack", {}).get("attack_outcome")
        layer = atk.get("kyron_full_stack", {}).get("defense_layer")
        info(f"{atk.get('id')}: {atk.get('name')} -> Scanner={sc_out} | Kyron={ky_out} ({layer})")

    # 4. Query live /impact metrics endpoint
    step("Querying live quantified impact telemetry (GET /impact)")
    status, impact, lat = http_json("GET", f"{api}/impact")
    if status != 200:
        fail(f"GET /impact failed: {impact}")
        return False
    ok(
        f"Impact Telemetry: attacks_blocked={impact['attacks_blocked']:,}, "
        f"sharded_exfils_prevented={impact['sharded_exfiltrations_prevented']}, "
        f"tokens_consumed_on_security={impact['tokens_consumed_on_security']}",
        lat,
    )
    return True
