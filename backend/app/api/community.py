from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.report import CommunityIntelligenceList, CommunityConfirmationRequest
from app.services.community_service import CommunityService
from app.core.rate_limit import limiter

router = APIRouter()

@router.get("", response_model=CommunityIntelligenceList)
@limiter.limit("20/minute")
async def get_community_feed(
    request: Request,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated public community intelligence.
    Only returns APPROVED reports, never exposes reporter identity.
    """
    reports, total = await CommunityService.get_approved_reports(db, page=page, limit=limit)
    return {
        "reports": reports,
        "total": total,
        "page": page
    }

@router.get("/reports/{report_id}")
async def get_report_intelligence(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed intelligence for a specific approved report.
    Never exposes reporter identity.
    """
    intel = await CommunityService.get_report_intelligence(db, report_id)
    report = intel["report"]
    return {
        "id": report.id,
        "company_id": None,
        "recruiter_id": None,
        "job_posting_id": None,
        "reason": report.reason,
        "description": report.description,
        "evidence": report.evidence,
        "created_at": report.created_at,
        "confirmations": intel["confirmations"]
    }

@router.post("/reports/{report_id}/confirm")
@limiter.limit("10/minute")
async def confirm_report(
    request: Request,
    report_id: str,
    confirmation_request: CommunityConfirmationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a confirmation for an approved community report.
    1 response per user per report enforced by DB constraint.
    """
    confirmation = await CommunityService.add_confirmation(db, report_id, current_user.id, confirmation_request.response)
    return {"status": "success", "response": confirmation.response.value}
