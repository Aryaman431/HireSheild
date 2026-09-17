import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from app.main import app
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.job_posting import JobPosting
from app.models.company import Company
from app.models.recruiter import Recruiter
from app.ai.schemas import JobExtraction
from app.services.analysis_service import AnalysisService
from app.ai.gemini import GeminiProvider
from types import SimpleNamespace

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
async def test_analyze_job_authenticated(mock_gemini, auth_client):
    # We can patch the AnalysisService instead for a pure API test.
    with patch('app.api.jobs.AnalysisService') as MockService:
        service_instance = MockService.return_value
        service_instance.analyze_job_text = AsyncMock(return_value="mock-job-id")
        
        response = await auth_client.post("/api/v1/jobs/analyze", json={
            "text": "This is a job opportunity that looks normal."
        })
        
        assert response.status_code == 200
        assert response.json()["job_id"] == "mock-job-id"
        service_instance.analyze_job_text.assert_called_once_with("This is a job opportunity that looks normal.")

@pytest.mark.asyncio
async def test_analyze_job_unauthenticated(async_client):
    response = await async_client.post("/api/v1/jobs/analyze", json={
        "text": "This is a job opportunity."
    })
    
    # Should be 401 Unauthorized because no credentials provided
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_analyze_job_ai_failure(mock_gemini, auth_client):
    with patch('app.api.jobs.AnalysisService') as MockService:
        service_instance = MockService.return_value
        service_instance.analyze_job_text = AsyncMock(side_effect=RuntimeError("Analysis failed: Gemini API unavailable"))
        
        response = await auth_client.post("/api/v1/jobs/analyze", json={
            "text": "This is a job opportunity."
        })
        
        assert response.status_code == 500
        assert "An error occurred during text analysis." in response.json()["detail"]

@pytest.mark.asyncio
async def test_analyze_job_text_uses_shared_pipeline(db_session):
    provider = AsyncMock()
    provider.extract_job_information = AsyncMock(return_value=JobExtraction(
        job_title="Software Engineer",
        description="Build the platform.",
        company="Acme Corp",
        recruiter="Jane Smith",
        recruiter_email="jane@acme.com",
        application_url="https://acme.com/jobs",
        suspicious_signals=[],
        missing_information=[]
    ))

    service = AnalysisService(provider, db_session)
    service._process_extraction = AsyncMock()

    job_id = await service.analyze_job_text("This is an engineering role at Acme Corp.")

    assert job_id is not None
    service._process_extraction.assert_awaited_once()
    job, run, extraction = service._process_extraction.await_args.args
    assert job.id == job_id
    assert run.job_posting_id == job_id
    assert extraction.job_title == "Software Engineer"


@pytest.mark.asyncio
async def test_gemini_provider_does_not_short_circuit_on_fake_key(monkeypatch):
    monkeypatch.setattr('app.ai.gemini.settings.GEMINI_API_KEY', 'AQ.Ab8test-key')

    mock_model = AsyncMock()
    mock_model.generate_content_async.return_value = SimpleNamespace(
        text='{"job_title":"Software Engineer","company":"Acme Corp","claims":[],"suspicious_signals":[],"missing_information":[]}'
    )

    with patch('app.ai.gemini.genai.configure'), patch('app.ai.gemini.genai.GenerativeModel', return_value=mock_model):
        provider = GeminiProvider()
        extraction = await provider.extract_job_information('This is an engineering role at Acme Corp.')

    assert extraction.job_title == 'Software Engineer'
    mock_model.generate_content_async.assert_awaited_once()


@pytest.mark.asyncio
async def test_gemini_provider_rejects_unknown_risk_signal_type(monkeypatch):
    monkeypatch.setattr('app.ai.gemini.settings.GEMINI_API_KEY', 'real-key')

    mock_model = AsyncMock()
    mock_model.generate_content_async.return_value = SimpleNamespace(
        text='{"job_title":"Security Engineer","company":"Acme Corp","claims":[],"suspicious_signals":[{"signal_type":"FAKE_SIGNAL","evidence":"Urgent hiring","confidence":90,"reasoning":"Not a known risk type."}],"missing_information":[]}'
    )

    with patch('app.ai.gemini.genai.configure'), patch('app.ai.gemini.genai.GenerativeModel', return_value=mock_model):
        provider = GeminiProvider()

        with pytest.raises(ValueError, match='Unknown risk signal type'):
            await provider.extract_job_information('Urgent hiring for a security engineer.')

@pytest.mark.asyncio
async def test_other_user_cannot_access_private_job_data(async_client, db_session):
    user_a = User(id="user-a", email="a@example.com", name="User A", clerk_user_id="user-a", auth_provider="clerk")
    user_b = User(id="user-b", email="b@example.com", name="User B", clerk_user_id="user-b", auth_provider="clerk")
    db_session.add_all([user_a, user_b])
    await db_session.commit()

    company = Company(
        id="company-1",
        name="Acme Corp",
        normalized_name="acmecorp",
        official_domain="acme.com"
    )
    recruiter = Recruiter(
        id="recruiter-1",
        name="Jane Smith",
        email="jane@acme.com",
        phone="+15551234567",
        company_id="company-1"
    )
    job = JobPosting(
        id="job-1",
        title="Software Engineer",
        description="Private detail",
        source_url="https://acme.com/jobs",
        company_id="company-1",
        recruiter_id="recruiter-1",
        user_id="user-a",
        risk_score=80,
        risk_level="HIGH",
        confidence=90
    )
    db_session.add_all([company, recruiter, job])
    await db_session.commit()

    async def override_get_current_user():
        return user_b
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        response = await async_client.get("/api/v1/jobs/job-1/result")
        assert response.status_code == 404

        response = await async_client.get("/api/v1/jobs/job-1/verification")
        assert response.status_code == 404

        response = await async_client.get("/api/v1/jobs/job-1/historical-intelligence")
        assert response.status_code == 404

        response = await async_client.get("/api/v1/companies/company-1/intelligence")
        assert response.status_code == 200
        payload = response.json()
        assert payload["related_jobs"] == []
        assert "job-1" not in str(payload)

        response = await async_client.get("/api/v1/recruiters/recruiter-1")
        assert response.status_code == 200
        payload = response.json()
        assert payload["email"] == "jane@acme.com"
        assert payload["phone"] == "+15551234567"
        assert payload["related_jobs"] == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_company_and_recruiter_intelligence_with_string_signals(async_client, db_session):
    from app.models.risk_signal import RiskSignal
    from app.models.company import RiskLevel

    user = User(id="user-owner", email="owner@example.com", name="Owner", clerk_user_id="user-owner", auth_provider="clerk")
    company = Company(id="comp-sig-test", name="SignalTech", normalized_name="signaltech", official_domain="signaltech.com")
    recruiter = Recruiter(id="rec-sig-test", name="Alex Recruiter", email="alex@signaltech.com", phone="+1234567890", company_id="comp-sig-test")
    job = JobPosting(
        id="job-sig-test",
        title="Frontend Lead",
        company_id="comp-sig-test",
        recruiter_id="rec-sig-test",
        user_id="user-owner",
        risk_score=75,
        risk_level=RiskLevel.HIGH
    )
    sig = RiskSignal(
        id="sig-test-1",
        job_posting_id="job-sig-test",
        signal_type="UPFRONT_PAYMENT",  # stored as raw string!
        severity=RiskLevel.HIGH,
        confidence=90,
        reasoning="Upfront equipment fee requested",
        score_contribution=30
    )
    db_session.add_all([user, company, recruiter, job, sig])
    await db_session.commit()

    async def override_user():
        return user
    app.dependency_overrides[get_current_user] = override_user

    try:
        # 1. Company intelligence test (verifies getattr fix)
        resp_comp = await async_client.get(f"/api/v1/companies/{company.id}/intelligence")
        assert resp_comp.status_code == 200
        data_comp = resp_comp.json()
        assert "UPFRONT_PAYMENT" in data_comp["risk"]["recurring_risk_signals"]

        # 2. Recruiter intelligence test (verifies getattr fix + email/phone return)
        resp_rec = await async_client.get(f"/api/v1/recruiters/{recruiter.id}")
        assert resp_rec.status_code == 200
        data_rec = resp_rec.json()
        assert data_rec["email"] == "alex@signaltech.com"
        assert data_rec["phone"] == "+1234567890"
        assert "UPFRONT_PAYMENT" in data_rec["recurring_risk_signals"]

        # 3. Read-only job result test (verifies Gemini is NOT called)
        resp_res = await async_client.get(f"/api/v1/jobs/{job.id}/result")
        assert resp_res.status_code == 200
        data_res = resp_res.json()
        assert data_res["id"] == job.id
        assert data_res["title"] == "Frontend Lead"
        assert len(data_res["signals"]) == 1
        assert data_res["signals"][0]["type"] == "UPFRONT_PAYMENT"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_community_report_intelligence_returns_entity_ids(async_client, db_session):
    from app.models.report import Report, ReportStatus

    user = User(id="reporter-1", email="rep@example.com", name="Rep", clerk_user_id="reporter-1", auth_provider="clerk")
    report = Report(
        id="report-entity-test",
        user_id="reporter-1",
        company_id="comp-assoc-123",
        recruiter_id="rec-assoc-456",
        job_posting_id="job-assoc-789",
        reason="SUSPICIOUS_JOB",
        description="Suspicious job posting detected with fake credentials.",
        status=ReportStatus.APPROVED
    )
    db_session.add_all([user, report])
    await db_session.commit()

    async def override_user():
        return user
    app.dependency_overrides[get_current_user] = override_user

    try:
        resp = await async_client.get(f"/api/v1/community/reports/{report.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["company_id"] == "comp-assoc-123"
        assert data["recruiter_id"] == "rec-assoc-456"
        assert data["job_posting_id"] == "job-assoc-789"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
