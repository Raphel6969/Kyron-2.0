import pytest
from fastapi.testclient import TestClient
from control.app.main import app

client = TestClient(app)

def test_healthz_endpoint():
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "2.0.0"
    assert "checks" in data
    assert data["checks"]["database"] == "ok"
    assert data["checks"]["policy_engine"] == "ok"

def test_impact_endpoint():
    response = client.get("/impact")
    assert response.status_code == 200
    data = response.json()
    assert data["attack_exposure_reduction_pct"] >= 70.0
    assert "MCPTox" in data["disparity_baseline_source"]
    assert len(data["honest_limits"]) > 0
