"""Case 4: Zero-Token Memoized Recovery, JSON-Path Provenance & Declarative Policy (C5 + C7 + C3).

Demonstrates:
1. Retrieving a precomputed recovery plan (`tokens_consumed: 0`) for a quarantined tool violation.
2. Pruning restricted PII fields (`$.customer.ssn`, `$.customer.api_secret`) via JSON-path provenance filtering.
3. Compiling & validating a strict declarative TOML policy live via POST /v1/policies/compile.
"""

from __future__ import annotations

from demo.cases.common import PAYLOADS_DIR, banner, blocked, fail, http_json, info, ok, step


def run(api_url: str, gateway_url: str) -> bool:
    banner(
        4,
        "Zero-Token Memoized Recovery, Provenance Filtering & Policy Compiler (C5 + C7 + C3)",
        "Proves blocked agents self-heal with 0 LLM tokens and PII fields are pruned deterministically.",
    )
    api = api_url.rstrip("/")

    # 1. Zero-Token Recovery Lookup
    step("Requesting deterministic remediation plan for quarantined tool 's1_poison' (POST /v1/recovery/lookup)")
    status, rec_resp, lat = http_json(
        "POST",
        f"{api}/v1/recovery/lookup",
        {
            "tool_id": "s1_poison",
            "error_code": "KYRON_QUARANTINED_TOOL",
            "rule_violated": "RULE_REGISTRY_TRUST",
            "policy_version": 1,
            "role": "agent",
        },
    )
    if status != 200 or rec_resp.get("tokens_consumed") != 0:
        fail(f"Expected 0-token recovery plan, got status={status}: {rec_resp}")
        return False

    ok(
        f"Recovery strategy='{rec_resp['strategy']}' | tokens_consumed={rec_resp['tokens_consumed']} | "
        f"alternatives={rec_resp['alternative_tools']}",
        lat,
    )
    info(f"Action returned to agent: {rec_resp['primary_action']}")

    # 2. JSON-Path Field Provenance Pruning (C7)
    step("Applying JSON-Path field-level provenance filter for 'external_analytics_agent' (POST /v1/provenance/filter)")
    raw_payload = {
        "order_id": "ORD-2026-8841",
        "amount_usd": 149.50,
        "customer": {
            "region": "eu-west-1",
            "ssn": "123-45-6789",
            "api_secret": "sk_live_kyron_secret_9911",
        },
    }
    status, prov_resp, lat = http_json(
        "POST",
        f"{api}/v1/provenance/filter",
        {
            "payload": raw_payload,
            "target_reader": "external_analytics_agent",
            "field_labels": [
                {"path": "$.customer.ssn", "readers": ["sec-admin"]},
                {"path": "$.customer.api_secret", "readers": ["secrets-broker"]},
            ],
        },
    )
    if status != 200:
        fail(f"Provenance filter failed: {prov_resp}")
        return False

    pruned = prov_resp.get("pruned_paths", [])
    filtered = prov_resp.get("filtered_payload", {})
    if "$.customer.ssn" not in pruned or "$.customer.api_secret" not in pruned:
        fail(f"Expected sensitive fields to be pruned, got: {prov_resp}")
        return False

    blocked(f"Pruned restricted fields from agent payload: {pruned}", lat)
    ok(f"Safe sanitized payload delivered: {filtered}")

    # 3. Declarative TOML Policy Compilation (C3)
    step("Compiling declarative TOML security policy via POST /v1/policies/compile")
    toml_text = (PAYLOADS_DIR / "strict_policy_demo.toml").read_text(encoding="utf-8")
    status, comp_resp, lat = http_json(
        "POST",
        f"{api}/v1/policies/compile",
        {"toml_content": toml_text},
    )
    if status != 200 or comp_resp.get("status") != "valid":
        fail(f"Policy compilation failed: {comp_resp}")
        return False

    ok(
        f"Policy compiled valid (v{comp_resp['version']} '{comp_resp['name']}', "
        f"mode={comp_resp['mode']}, tools={comp_resp['tools_count']}, "
        f"egress_blocked={comp_resp['egress_blocked_count']})",
        lat,
    )
    return True
