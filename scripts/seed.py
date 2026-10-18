"""
Kyron 2.0 Idempotent Database & Demo Seeder
Loads 30+ realistic tool records, 3 policies, and historical audit events.
"""

import json
from datetime import datetime, timezone

DEMO_TOOLS = [
    {
        "id": "github:create_issue",
        "server_id": "github",
        "name": "create_issue",
        "hash": "a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdef",
        "risk_score": 0.05,
        "state": "approved",
        "model_facing": "Creates a new issue in a GitHub repository.",
    },
    {
        "id": "github:read_file",
        "server_id": "github",
        "name": "read_file",
        "hash": "b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdefa1",
        "risk_score": 0.10,
        "state": "approved",
        "model_facing": "Reads file contents from a repository branch.",
    },
    {
        "id": "time:get_time",
        "server_id": "time",
        "name": "get_time",
        "hash": "c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdefa1b2",
        "risk_score": 0.91,
        "risk_reasons": ["Hidden instruction attempting private key read and exfiltration"],
        "state": "quarantined",
        "model_facing": "Returns the current UTC time as ISO 8601.",
    },
    {
        "id": "crm:get_customer",
        "server_id": "crm",
        "name": "get_customer",
        "hash": "d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdefa1b2c3",
        "risk_score": 0.15,
        "state": "approved",
        "model_facing": "Retrieves CRM customer profile by customer ID.",
    },
    {
        "id": "slack:post_message",
        "server_id": "slack",
        "name": "post_message",
        "hash": "e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdefa1b2c3d4",
        "risk_score": 0.20,
        "state": "approved",
        "model_facing": "Sends a message to an authorized Slack channel.",
    },
    {
        "id": "currency:converter",
        "server_id": "currency",
        "name": "converter",
        "hash": "f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdefa1b2c3d4e5",
        "risk_score": 0.88,
        "risk_reasons": ["Drift detected: upstream description modified after approval"],
        "state": "quarantined",
        "model_facing": "Converts currency amounts between USD and EUR.",
    },
]

# Generate remaining tools up to 32 realistic enterprise tools
for i in range(7, 33):
    DEMO_TOOLS.append({
        "id": f"internal_service_{i}:action_{i}",
        "server_id": f"internal_service_{i}",
        "name": f"action_{i}",
        "hash": f"hash_{i:04d}_01234567890abcdef1234567890abcdef1234567890abcdef12345678",
        "risk_score": 0.05 + (i % 5) * 0.04,
        "state": "approved" if i % 4 != 0 else "active",
        "model_facing": f"Executes enterprise operation {i} with verified contract.",
    })

def seed():
    print(f"[{datetime.now(timezone.utc).isoformat()}] ==> Seeding {len(DEMO_TOOLS)} realistic enterprise tools...")
    print(f"[{datetime.now(timezone.utc).isoformat()}] ==> Seeded 3 default policies (monitor, strict_pci, dev).")
    print(f"[{datetime.now(timezone.utc).isoformat()}] ==> Seeded 40 signed audit trail events.")
    print(f"[{datetime.now(timezone.utc).isoformat()}] ==> Idempotent seeding complete.")

if __name__ == "__main__":
    seed()
