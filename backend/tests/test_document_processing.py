import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_analyze_file_requires_auth(db_session):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        with open("requirements.txt", "rb") as f:
            response = await ac.post("/api/v1/jobs/analyze-file", files={"file": ("requirements.txt", f, "text/plain")})
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_analyze_file_invalid_mime(auth_client):
    with open("requirements.txt", "rb") as f:
        response = await auth_client.post("/api/v1/jobs/analyze-file", files={"file": ("requirements.txt", f, "text/plain")})
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]

@pytest.mark.asyncio
async def test_analyze_file_size_limit(auth_client, monkeypatch):
    # Mock settings max size to 0
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 0)
    
    # Create a small dummy file
    with open("dummy.png", "wb") as f:
        f.write(b"0" * 1024)
        
    try:
        with open("dummy.png", "rb") as f:
            response = await auth_client.post("/api/v1/jobs/analyze-file", files={"file": ("dummy.png", f, "image/png")})
        assert response.status_code == 413
        assert "exceeds maximum size" in response.json()["detail"]
    finally:
        import os
        os.remove("dummy.png")
