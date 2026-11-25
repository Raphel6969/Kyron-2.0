#!/usr/bin/env python3
"""
Kyron 2.0 — Master 3-4 Minute Live Product Demo & Pitch Runner

Executes live, end-to-end deterministic security scenarios against Kyron's running
Control Plane API and Go MCP Protocol Gateway (locally or deployed on Render).

Usage:
    # Interactive mode for video recording (pauses cleanly between beats):
    python demo/run_live_demo.py --interactive

    # Fast automated verification across all 5 cases:
    python demo/run_live_demo.py --auto

    # Run against your deployed Render Web Service URL:
    python demo/run_live_demo.py --base-url https://kyron-web.onrender.com --interactive

    # Run a single case (1..5):
    python demo/run_live_demo.py --case 2
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

# Ensure repository root is importable regardless of cwd
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from demo.cases import (
    case1_semantic_drift_and_trustdesc,
    case2_toctou_and_capability_lease,
    case3_egress_and_sharded_exfil,
    case4_zero_token_recovery_provenance,
    case5_audit_chain_eu_ai_act,
)
from demo.cases.common import Ansi, configure_utf8_stdout, fail, http_json, ok

CASES = {
    1: ("Semantic Drift Firewall & TRUSTDESC (S1/S2)", case1_semantic_drift_and_trustdesc.run),
    2: ("TOCTOU Resource Swap & Capability Lease (S5/C6)", case2_toctou_and_capability_lease.run),
    3: ("Source-Attributed Egress & Sharded Exfil (S3/S4)", case3_egress_and_sharded_exfil.run),
    4: ("0-Token Recovery, Provenance & Policy Compile (C5/C7/C3)", case4_zero_token_recovery_provenance.run),
    5: ("Cryptographic Audit Trail & Live MCP SSE (C11/C1)", case5_audit_chain_eu_ai_act.run),
}


def print_header(api_url: str, gateway_url: str) -> None:
    print(f"\n{Ansi.BOLD}{Ansi.BLUE}{'#' * 78}{Ansi.RESET}")
    print(f"{Ansi.BOLD}{Ansi.BLUE}  KYRON 2.0 — DETERMINISTIC TRUST LAYER LIVE PRODUCT DEMO{Ansi.RESET}")
    print(f"{Ansi.DIM}  Control Plane : {api_url}{Ansi.RESET}")
    print(f"{Ansi.DIM}  MCP Gateway   : {gateway_url}{Ansi.RESET}")
    print(f"{Ansi.BOLD}{Ansi.BLUE}{'#' * 78}{Ansi.RESET}")


def preflight(api_url: str) -> bool:
    status, data, lat = http_json("GET", f"{api_url.rstrip('/')}/healthz", timeout=5.0)
    if status != 200 or data.get("status") not in ("healthy", "ok"):
        fail(f"Control Plane unreachable or unhealthy at {api_url}/healthz (status={status}): {data}")
        return False
    db_info = data.get("database", {})
    ok(
        f"Pre-flight check passed: Control API {data.get('status')} | "
        f"DB={db_info.get('provider', 'configured')} ({db_info.get('engine_dialect', 'sql')})",
        lat,
    )
    return True


def main() -> int:
    configure_utf8_stdout()

    parser = argparse.ArgumentParser(description="Kyron 2.0 Live Demo & Pitch Runner")
    parser.add_argument(
        "--base-url",
        default=None,
        help="Single unified URL (e.g. Render https://kyron-web.onrender.com) for both API & Gateway.",
    )
    parser.add_argument("--api-url", default="http://127.0.0.1:8001", help="Control Plane API base URL")
    parser.add_argument("--gateway-url", default="http://127.0.0.1:8080", help="Go MCP Gateway base URL")
    parser.add_argument("--interactive", action="store_true", help="Pause between cases for presenter narration")
    parser.add_argument("--auto", action="store_true", help="Run all cases continuously without pausing")
    parser.add_argument("--case", type=int, choices=list(CASES.keys()), help="Run only one specific case (1-5)")
    args = parser.parse_args()

    api_url = args.base_url.rstrip("/") if args.base_url else args.api_url.rstrip("/")
    gateway_url = args.base_url.rstrip("/") if args.base_url else args.gateway_url.rstrip("/")

    print_header(api_url, gateway_url)
    if not preflight(api_url):
        return 1

    selected = [args.case] if args.case else sorted(CASES.keys())
    t_start = time.perf_counter()
    passed = 0

    for idx, case_id in enumerate(selected):
        name, runner = CASES[case_id]
        if args.interactive:
            prompt = f"\n{Ansi.BOLD}[READY]{Ansi.RESET} Press Enter to run Case {case_id}: {name} (or Ctrl+C to stop)..."
            try:
                input(prompt)
            except EOFError:
                pass

        if not runner(api_url, gateway_url):
            fail(f"Case {case_id} ({name}) failed!")
            return 1
        passed += 1

    elapsed = time.perf_counter() - t_start
    print(f"\n{Ansi.BOLD}{Ansi.GREEN}{'=' * 78}{Ansi.RESET}")
    print(f"{Ansi.BOLD}{Ansi.GREEN}  DEMO COMPLETE: {passed}/{len(selected)} LIVE SECURITY CASES PASSED IN {elapsed:.2f}s{Ansi.RESET}")
    print(f"{Ansi.BOLD}{Ansi.GREEN}  0 Model Tokens Consumed on Security · Sub-4ms Hot Path · EU AI Act Ready{Ansi.RESET}")
    print(f"{Ansi.BOLD}{Ansi.GREEN}{'=' * 78}{Ansi.RESET}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
