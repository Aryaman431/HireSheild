import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.user import User
from app.models.company import Company
from app.models.report import Report, ReportStatus
from app.models.community_confirmation import ConfirmationResponse, CommunityConfirmation
from app.schemas.report import ReportCreate, ReportCategory
from app.services.report_service import ReportService
from app.services.community_service import CommunityService

@pytest_asyncio.fixture
async def users(db_session: AsyncSession):
    import uuid
    u1 = User(email=f"rep1_{uuid.uuid4()}@test.com", auth_provider="supabase", name="Reporter", id=f"uid1_{uuid.uuid4()}")
    u2 = User(email=f"rep2_{uuid.uuid4()}@test.com", auth_provider="supabase", name="Reporter", id=f"uid2_{uuid.uuid4()}")
    db_session.add_all([u1, u2])
    await db_session.commit()
    await db_session.refresh(u1)
    await db_session.refresh(u2)
    return u1, u2

@pytest_asyncio.fixture
async def report(db_session: AsyncSession, users):
    c = Company(name="Test Company", normalized_name="test_company")
    db_session.add(c)
    await db_session.commit()
    
    rep = await ReportService.create_report(
        db_session, users[0].id, 
        ReportCreate(
            company_id=c.id, 
            reason=ReportCategory.PHISHING, 
            description="Phishing test"
        )
    )
    return rep

@pytest.mark.asyncio
async def test_add_confirmation_requires_approved(db_session: AsyncSession, report: Report, users):
    u1, u2 = users
    assert report.status == ReportStatus.PENDING
    
    with pytest.raises(HTTPException) as excinfo:
        await CommunityService.add_confirmation(db_session, report.id, u2.id, ConfirmationResponse.HAPPENED_TO_ME)
    assert excinfo.value.status_code == 400

@pytest.mark.asyncio
async def test_add_confirmation_success_and_upsert(db_session: AsyncSession, report: Report, users):
    u1, u2 = users
    await ReportService.moderate_report(db_session, report.id, ReportStatus.APPROVED)
    
    # First confirmation
    conf1 = await CommunityService.add_confirmation(db_session, report.id, u2.id, ConfirmationResponse.HAPPENED_TO_ME)
    assert conf1.response == ConfirmationResponse.HAPPENED_TO_ME
    
    # Update confirmation (should not throw unique constraint error, should update)
    conf2 = await CommunityService.add_confirmation(db_session, report.id, u2.id, ConfirmationResponse.DID_NOT_HAPPEN_TO_ME)
    assert conf2.id == conf1.id
    assert conf2.response == ConfirmationResponse.DID_NOT_HAPPEN_TO_ME

@pytest.mark.asyncio
async def test_get_approved_reports(db_session: AsyncSession, report: Report, users):
    reports, count = await CommunityService.get_approved_reports(db_session)
    assert count == 0 # because report is PENDING
    
    await ReportService.moderate_report(db_session, report.id, ReportStatus.APPROVED)
    
    reports, count = await CommunityService.get_approved_reports(db_session)
    assert count == 1
    assert reports[0]["category"] == ReportCategory.PHISHING.value
    assert reports[0]["company_name"] == "Test Company"
