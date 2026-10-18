"""
Idempotency Verification Test for Database Seeder (data-integrity DoD)
Verifies that running seed_database three times in succession produces identical row counts.
"""

import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from control.app.db import init_db, SessionLocal
from scripts.seed import seed_database


def test_idempotent_seeding():
    init_db()
    db = SessionLocal()

    try:
        # Pass 1
        tools_1, pols_1, leases_1, appr_1, ev_1 = seed_database(db)
        assert tools_1 >= 30, f"Expected >= 30 tools, got {tools_1}"
        assert pols_1 >= 3, f"Expected >= 3 policies, got {pols_1}"
        assert leases_1 >= 5, f"Expected >= 5 leases, got {leases_1}"
        assert appr_1 >= 6, f"Expected >= 6 approvals, got {appr_1}"
        assert ev_1 >= 40, f"Expected >= 40 audit events, got {ev_1}"

        # Pass 2
        tools_2, pols_2, leases_2, appr_2, ev_2 = seed_database(db)
        assert tools_2 == tools_1, f"Idempotency failed: tools count changed from {tools_1} to {tools_2}"
        assert pols_2 == pols_1, f"Idempotency failed: policies count changed from {pols_1} to {pols_2}"
        assert leases_2 == leases_1, f"Idempotency failed: leases count changed from {leases_1} to {leases_2}"
        assert appr_2 == appr_1, f"Idempotency failed: approvals count changed from {appr_1} to {appr_2}"
        assert ev_2 == ev_1, f"Idempotency failed: events count changed from {ev_1} to {ev_2}"

        # Pass 3
        tools_3, pols_3, leases_3, appr_3, ev_3 = seed_database(db)
        assert tools_3 == tools_1, f"Idempotency failed: tools count changed on pass 3"
        assert pols_3 == pols_1, f"Idempotency failed: policies count changed on pass 3"
        assert leases_3 == leases_1, f"Idempotency failed: leases count changed on pass 3"
        assert appr_3 == appr_1, f"Idempotency failed: approvals count changed on pass 3"
        assert ev_3 == ev_1, f"Idempotency failed: events count changed on pass 3"

        print("\n[PASS] Strict 3x Idempotency Test PASSED.")
    finally:
        db.close()


if __name__ == "__main__":
    test_idempotent_seeding()
