import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from app.main import app
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.ai.schemas import JobExtraction

# Create a mock user
mock_user = User(id="test-user-id", email="test@example.com", name="Test")

# Dependency override
async def override_get_current_user():
    return mock_user

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

@pytest.fixture
def mock_gemini():
    with patch('app.api.jobs.GeminiProvider') as MockGemini:
        instance = MockGemini.return_value
        # Mock extract_job_information to return a dummy JobExtraction
        instance.extract_job_information = AsyncMock(return_value=JobExtraction(
            job_title="Software Engineer",
            suspicious_signals=[],
            missing_information=[]
        ))
        yield instance

@pytest.mark.asyncio
async def test_analyze_job_authenticated(mock_gemini, db_session):
    # This requires overriding the db dependency as well if we hit the actual DB.
    # We can patch the AnalysisService instead for a pure API test.
    with patch('app.api.jobs.AnalysisService') as MockService:
        service_instance = MockService.return_value
        service_instance.analyze_job_text = AsyncMock(return_value="mock-job-id")
        
        response = client.post("/api/v1/jobs/analyze", json={
            "text": "This is a job opportunity that looks normal."
        })
        
        assert response.status_code == 200
        assert response.json()["job_id"] == "mock-job-id"
        service_instance.analyze_job_text.assert_called_once_with("This is a job opportunity that looks normal.")

def test_analyze_job_unauthenticated():
    # Remove the dependency override to test actual auth
    app.dependency_overrides.pop(get_current_user, None)
    
    response = client.post("/api/v1/jobs/analyze", json={
        "text": "This is a job opportunity."
    })
    
    # Should be 401 Unauthorized because no credentials provided
    assert response.status_code == 401
    
    # Restore for other tests
    app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.mark.asyncio
async def test_analyze_job_ai_failure(mock_gemini, db_session):
    with patch('app.api.jobs.AnalysisService') as MockService:
        service_instance = MockService.return_value
        service_instance.analyze_job_text = AsyncMock(side_effect=RuntimeError("Analysis failed: Gemini API unavailable"))
        
        response = client.post("/api/v1/jobs/analyze", json={
            "text": "This is a job opportunity."
        })
        
        assert response.status_code == 500
        assert "Analysis failed: Gemini API unavailable" in response.json()["detail"]
