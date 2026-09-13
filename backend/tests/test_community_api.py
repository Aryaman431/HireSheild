import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_community_feed(async_client: AsyncClient, override_auth):
    override_auth("user_123")
    response = await async_client.get("/api/v1/community")
    assert response.status_code == 200
    data = response.json()
    assert "reports" in data
    assert "total" in data

@pytest.mark.asyncio
async def test_create_and_moderate_report(async_client: AsyncClient, override_auth):
    override_auth("user_123")
    
    # 1. Create Report
    response = await async_client.post("/api/v1/reports", json={
        "reason": "UPFRONT_PAYMENT",
        "description": "They asked for 500 dollars.",
        "company_id": "00000000-0000-0000-0000-000000000000"
    })
    assert response.status_code == 201
    report = response.json()
    assert report["status"] == "PENDING"
    
    # 2. Verify it's not in community feed
    feed_resp = await async_client.get("/api/v1/community")
    feed = feed_resp.json()
    assert len([r for r in feed["reports"] if r["id"] == report["id"]]) == 0
    
    # 3. Moderate Report
    override_auth("admin_123", is_admin=True)
    mod_resp = await async_client.post(f"/api/v1/reports/{report['id']}/moderate", json={
        "status": "APPROVED"
    })
    assert mod_resp.status_code == 200
    assert mod_resp.json()["status"] == "APPROVED"
    
    # 4. Verify it's in community feed now
    feed_resp2 = await async_client.get("/api/v1/community")
    feed2 = feed_resp2.json()
    assert len([r for r in feed2["reports"] if r["id"] == report["id"]]) == 1

@pytest.mark.asyncio
async def test_community_intelligence_privacy(async_client: AsyncClient, override_auth):
    override_auth("user_123")
    
    # Create report
    create_resp = await async_client.post("/api/v1/reports", json={
        "reason": "PHISHING",
        "description": "Phishing test privacy check.",
        "company_id": "00000000-0000-0000-0000-000000000000"
    })
    report_id = create_resp.json()["id"]
    
    # Moderate
    override_auth("admin_123", is_admin=True)
    await async_client.post(f"/api/v1/reports/{report_id}/moderate", json={"status": "APPROVED"})
    
    # Fetch details
    detail_resp = await async_client.get(f"/api/v1/community/reports/{report_id}")
    assert detail_resp.status_code == 200
    data = detail_resp.json()
    
    # Ensure user_id or reporter identity is NOT exposed
    assert "user_id" not in data
    assert "reporter" not in data
    assert "reason" in data
    assert "confirmations" in data
