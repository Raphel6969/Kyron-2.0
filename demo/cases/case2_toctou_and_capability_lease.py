"""Case 2: TOCTOU Resource Content Binding & Single-Use Capability Lease (Scenario S5 + C6).

Demonstrates:
1. Cryptographically binding a file path `/tmp/monthly_report.txt` to its SHA-256 content hash.
2. Passing verification when content matches, then catching a simulated post-approval
   swap to `/etc/shadow` content deterministically at execution time (S5 TOCTOU).
3. Submitting an operator approval request and minting an expiring, single-use capability lease.
"""

from __future__ import annotations

import time

from demo.cases.common import banner, blocked, fail, http_json, info, ok, step


def run(api_url: str, gateway_url: str) -> bool:
    banner(
        2,
        "TOCTOU Resource Swap Defense & Single-Use Capability Lease (S5 + C6)",
        "Proves runtime resource swaps fail deterministically and privileged calls require single-use leases.",
    )
    api = api_url.rstrip("/")

    # 1. Bind approved resource content hash
    step("Binding approved financial report hash via POST /v1/resources/bind")
    clean_content = "Monthly financial summary: Q3 revenue $4.2M, all balances reconciled."
    status, bind_resp, lat = http_json(
        "POST",
        f"{api}/v1/resources/bind",
        {"path": "/tmp/monthly_report.txt", "content": clean_content},
    )
    if status != 200 or bind_resp.get("status") != "bound":
        fail(f"Resource bind failed: {bind_resp}")
        return False

    expected_hash = bind_resp["expected_hash"]
    ok(f"Bound '/tmp/monthly_report.txt' -> SHA-256 {expected_hash[:24]}...", lat)

    # 2. Verify unmodified content passes
    step("Re-verifying unmodified resource at execution time (POST /v1/resources/verify)")
    status, verify_ok, lat = http_json(
        "POST",
        f"{api}/v1/resources/verify",
        {
            "path": "/tmp/monthly_report.txt",
            "expected_hash": expected_hash,
            "current_content": clean_content,
        },
    )
    if status != 200 or not verify_ok.get("match"):
        fail(f"Expected unmodified verify to pass: {verify_ok}")
        return False
    ok("Execution-time integrity check matched (dispatch allowed)", lat)

    # 3. Simulate S5 TOCTOU attack (attacker swaps file with shadow hashes post-approval)
    step("Simulating S5 TOCTOU attack: attacker swaps target file to /etc/shadow post-approval")
    swapped_content = "root:$6$saltedhash$compromised_shadow_entry:19800:0:99999:7:::"
    status, verify_swap, lat = http_json(
        "POST",
        f"{api}/v1/resources/verify",
        {
            "path": "/tmp/monthly_report.txt",
            "expected_hash": expected_hash,
            "current_content": swapped_content,
        },
    )
    if status != 200 or verify_swap.get("match") is not False or verify_swap.get("status") != "violation":
        fail(f"Expected TOCTOU swap violation, got: {verify_swap}")
        return False
    blocked(f"TOCTOU violation caught: {verify_swap.get('violation')}", lat)

    # 4. Issue call-scoped single-use capability lease via approval workflow
    step("Submitting & approving single-use capability lease (C6 Authority Service)")
    traj_id = f"traj-demo-{int(time.time())}"
    status, req_resp, lat = http_json(
        "POST",
        f"{api}/v1/approvals",
        {
            "trajectory_id": traj_id,
            "kind": "lease_request",
            "tool_id": "k8s:restart_deployment",
            "details": {
                "reason": "Demo walkthrough: payment-worker memory leak remediation",
                "resource_path": "/tmp/monthly_report.txt",
                "expected_hash": expected_hash,
            },
        },
    )
    if status != 200 or "id" not in req_resp:
        fail(f"Approval creation failed: {req_resp}")
        return False

    req_id = req_resp["id"]
    status, appr_resp, lat2 = http_json(
        "POST",
        f"{api}/v1/approvals/{req_id}/approve",
        {"decided_by": "demo-security-lead", "reason": "Verified during live showcase"},
    )
    if status != 200 or appr_resp.get("status") != "approved":
        fail(f"Approval decision failed: {appr_resp}")
        return False

    status, leases_resp, _ = http_json("GET", f"{api}/v1/leases?trajectory_id={traj_id}")
    if status != 200 or not leases_resp:
        fail(f"Expected issued lease for {traj_id}, got: {leases_resp}")
        return False

    lease = leases_resp[0]
    ok(
        f"Minted single-use lease '{lease['id']}' (max_calls={lease['max_calls']}, sig={lease['signature'][:16]}...)",
        lat + lat2,
    )
    info(f"Bound constraints attached to lease: {lease.get('constraints')}")
    return True
