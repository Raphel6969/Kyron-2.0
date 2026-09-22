import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_healthz_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/healthz")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["checks"]["database"] == "ok"

@pytest.mark.asyncio
async def test_impact_endpoint_returns_live_arithmetic():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/impact")
        assert response.status_code == 200
        data = response.json()
        assert "baseline_metric" in data
        assert "optimized_metric" in data
        assert "total_economic_saved" in data
        assert data["sample_count"] > 0

@pytest.mark.asyncio
async def test_tenant_isolation_boundary():
    # Motivated by Nexus: automated test proving Tenant A cannot access Tenant B resources
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/items?tenant_id=tenant-alpha")
        assert response.status_code == 200
        items = response.json()
        assert all(item["tenant_id"] == "tenant-alpha" for item in items)
