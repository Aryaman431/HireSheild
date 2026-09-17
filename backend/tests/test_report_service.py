import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.user import User
from app.models.report import Report, ReportStatus
from app.models.company import Company
from app.models.job_posting import JobPosting
from app.schemas.report import ReportCreate, ReportCategory
from app.services.report_service import ReportService

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession):
    import uuid
    user = User(email=f"reporter_{uuid.uuid4()}@test.com", auth_provider="clerk", name="Reporter", id=f"rep_{uuid.uuid4()}")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.mark.asyncio
async def test_create_report_success(db_session: AsyncSession, test_user: User):
    db_session.add(Company(id="comp_123", name="Acme", normalized_name="acme"))
    await db_session.commit()
    report_data = ReportCreate(
        company_id="comp_123",
        reason=ReportCategory.UPFRONT_PAYMENT,
        description="They asked me to pay 5000 INR."
    )
    
    report = await ReportService.create_report(db_session, test_user.id, report_data)
    
    assert report is not None
    assert report.status == ReportStatus.PENDING
    assert report.reason == ReportCategory.UPFRONT_PAYMENT.value
    assert report.description == "They asked me to pay 5000 INR."
    assert report.company_id == "comp_123"

@pytest.mark.asyncio
async def test_create_report_no_entity(db_session: AsyncSession, test_user: User):
    report_data = ReportCreate(
        reason=ReportCategory.PHISHING,
        description="Just sending a report."
    )
    
    with pytest.raises(HTTPException) as excinfo:
        await ReportService.create_report(db_session, test_user.id, report_data)
    assert excinfo.value.status_code == 400


@pytest.mark.asyncio
async def test_create_report_rejects_missing_entity_reference(db_session: AsyncSession, test_user: User):
    report_data = ReportCreate(
        company_id="does-not-exist",
        reason=ReportCategory.PHISHING,
        description="This report references nothing real.",
    )

    with pytest.raises(HTTPException) as excinfo:
        await ReportService.create_report(db_session, test_user.id, report_data)

    assert excinfo.value.status_code == 404

@pytest.mark.asyncio
async def test_duplicate_report(db_session: AsyncSession, test_user: User):
    db_session.add(JobPosting(id="job_1"))
    await db_session.commit()
    report_data = ReportCreate(
        job_posting_id="job_1",
        reason=ReportCategory.FAKE_JOB_POSTING,
        description="This looks like a fake job."
    )
    
    # First report
    await ReportService.create_report(db_session, test_user.id, report_data)
    
    # Duplicate report (normalized whitespace/case)
    report_data_2 = ReportCreate(
        job_posting_id="job_1",
        reason=ReportCategory.FAKE_JOB_POSTING,
        description="  this looks like a fake job.  "
    )
    
    with pytest.raises(HTTPException) as excinfo:
        await ReportService.create_report(db_session, test_user.id, report_data_2)
    assert excinfo.value.status_code == 409


@pytest.mark.asyncio
async def test_different_report_with_similar_length_is_allowed(db_session: AsyncSession, test_user: User):
    db_session.add(JobPosting(id="job_2"))
    await db_session.commit()
    report_data_1 = ReportCreate(
        job_posting_id="job_2",
        reason=ReportCategory.FAKE_JOB_POSTING,
        description="This job posting requires payment for tools."
    )
    await ReportService.create_report(db_session, test_user.id, report_data_1)

    # Different report on same job with similar length (within 50 chars)
    report_data_2 = ReportCreate(
        job_posting_id="job_2",
        reason=ReportCategory.FAKE_JOB_POSTING,
        description="Recruiter demanded my full SSN over WhatsApp."
    )
    second_report = await ReportService.create_report(db_session, test_user.id, report_data_2)
    assert second_report is not None
    assert second_report.id is not None


@pytest.mark.asyncio
async def test_duplicate_company_report_is_rejected(db_session: AsyncSession, test_user: User):
    db_session.add(Company(id="company-duplicate", name="Acme", normalized_name="acme"))
    await db_session.commit()
    report_data = ReportCreate(
        company_id="company-duplicate",
        reason=ReportCategory.PHISHING,
        description="The same company phishing report.",
        evidence="contacted from a fake domain",
    )

    await ReportService.create_report(db_session, test_user.id, report_data)

    with pytest.raises(HTTPException) as excinfo:
        await ReportService.create_report(
            db_session,
            test_user.id,
            ReportCreate(
                company_id="company-duplicate",
                reason=ReportCategory.PHISHING,
                description="  The same company phishing report.  ",
                evidence="CONTACTED   FROM A FAKE DOMAIN",
            ),
        )
    assert excinfo.value.status_code == 409

@pytest.mark.asyncio
async def test_moderate_report(db_session: AsyncSession, test_user: User):
    db_session.add(Company(id="comp_1", name="Acme", normalized_name="acme"))
    await db_session.commit()
    report_data = ReportCreate(
        company_id="comp_1",
        reason=ReportCategory.OTHER,
        description="Test description."
    )
    report = await ReportService.create_report(db_session, test_user.id, report_data)
    assert report.status == ReportStatus.PENDING
    
    moderated = await ReportService.moderate_report(db_session, report.id, ReportStatus.APPROVED)
    assert moderated.status == ReportStatus.APPROVED
