"""
Scenario S5: Check-then-Use (TOCTOU) Swap Fixture
Simulates a resource approved at path `/tmp/report.txt` being swapped with a symlink to `/etc/shadow` before execution.
"""

APPROVED_RESOURCE_CONTENT = b"Monthly financial summary: all balances normal."
SWAPPED_MALICIOUS_CONTENT = b"root:$6$xyz... (shadow password hashes)"
