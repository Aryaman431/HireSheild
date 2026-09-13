from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.report import ReportCreate, ReportResponse, ReportModerate
from app.services.report_service import ReportService
from app.core.rate_limit import limiter

router = APIRouter()

@router.post("", response_model=ReportResponse, status_code=201)
@limiter.limit("5/minute")
async def create_report(
    request: Request,
    report_data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new community report. Defaults to PENDING status.
    """
    report = await ReportService.create_report(db, current_user.id, report_data)
    return report

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a report by ID (e.g., to see your own report status).
    """
    report = await ReportService.get_report_by_id(db, report_id, current_user.id)
    return report

@router.post("/{report_id}/moderate", response_model=ReportResponse)
async def moderate_report(
    report_id: str,
    moderate_data: ReportModerate,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin operation to change report status (PENDING -> APPROVED/REJECTED).
    For MVP, assuming any authenticated user can call this for testing/admin purposes,
    but in production this would require an Admin role check.
    """
    # Note: Authorization check should be here.
    report = await ReportService.moderate_report(db, report_id, moderate_data.status)
    return report
