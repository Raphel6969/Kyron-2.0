"""
Scenario S4: Sharded Exfiltration Fixture
Simulates an attack chunking a stolen secret across 40+ micro-requests to an allowed host.
"""

SECRET_TO_EXFILTRATE = "COMPANY_CONFIDENTIAL_CUSTOMER_DATABASE_DUMP_CHUNKED_DATA"

def generate_shards(secret: str, shard_count: int = 40) -> list:
    chunk_size = max(1, len(secret) // shard_count)
    shards = []
    for i in range(shard_count):
        start = i * chunk_size
        end = min(len(secret), (i + 1) * chunk_size)
        shards.append(secret[start:end])
    return shards
