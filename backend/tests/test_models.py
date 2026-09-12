import pytest
from app.models.user import User
from app.models.company import Company, VerificationStatus
from app.models.recruiter import Recruiter
from app.models.job_posting import JobPosting
from app.models.report import Report
from app.models.community_confirmation import CommunityConfirmation, ConfirmationResponse

@pytest.mark.asyncio
async def test_user_creation(db_session):
    user = User(email="test@example.com", name="Test User")
    db_session.add(user)
    await db_session.commit()
    assert user.id is not None
    assert user.email == "test@example.com"

@pytest.mark.asyncio
async def test_company_creation(db_session):
    company = Company(name="Acme Corp", normalized_name="acme_corp", verification_status=VerificationStatus.VERIFIED)
    db_session.add(company)
    await db_session.commit()
    assert company.id is not None
    assert company.verification_status == VerificationStatus.VERIFIED

@pytest.mark.asyncio
async def test_relationships(db_session):
    company = Company(name="Tech Inc", normalized_name="tech_inc")
    db_session.add(company)
    await db_session.flush()

    recruiter = Recruiter(email="recruiter@tech.inc", company_id=company.id)
    db_session.add(recruiter)
    await db_session.flush()

    job = JobPosting(title="Software Engineer", company_id=company.id, recruiter_id=recruiter.id)
    db_session.add(job)
    await db_session.commit()

    assert job.company_id == company.id
    assert job.recruiter_id == recruiter.id

@pytest.mark.asyncio
async def test_community_confirmation_uniqueness(db_session):
    from sqlalchemy.exc import IntegrityError
    user = User(email="unique@test.com", name="U1")
    db_session.add(user)
    await db_session.flush()

    report = Report(user_id=user.id, reason="Scam", description="Fake job")
    db_session.add(report)
    await db_session.flush()

    conf1 = CommunityConfirmation(report_id=report.id, user_id=user.id, response=ConfirmationResponse.HAPPENED_TO_ME)
    db_session.add(conf1)
    await db_session.commit()

    conf2 = CommunityConfirmation(report_id=report.id, user_id=user.id, response=ConfirmationResponse.DID_NOT_HAPPEN_TO_ME)
    db_session.add(conf2)
    
    with pytest.raises(Exception):
        await db_session.commit()
