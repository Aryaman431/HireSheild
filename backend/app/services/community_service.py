import logging
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from fastapi import HTTPException

from app.models.report import Report, ReportStatus
from app.models.community_confirmation import CommunityConfirmation, ConfirmationResponse
from app.models.company import Company

logger = logging.getLogger(__name__)

class CommunityService:
    @staticmethod
    async def add_confirmation(db: AsyncSession, report_id: str, user_id: str, response: ConfirmationResponse) -> CommunityConfirmation:
        """
        Add or update a community confirmation for a report.
        Uses INSERT ... ON CONFLICT DO UPDATE to enforce 1 confirmation per user per report.
        """
        # First ensure report exists and is APPROVED
        result = await db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
        if report.status != ReportStatus.APPROVED:
            raise HTTPException(status_code=400, detail="Can only confirm approved reports")

        # Check if confirmation already exists
        conf_result = await db.execute(
            select(CommunityConfirmation)
            .where(CommunityConfirmation.report_id == report_id)
            .where(CommunityConfirmation.user_id == user_id)
        )
        confirmation = conf_result.scalar_one_or_none()
        
        if confirmation:
            confirmation.response = response
        else:
            confirmation = CommunityConfirmation(
                report_id=report_id,
                user_id=user_id,
                response=response
            )
            db.add(confirmation)
            
        await db.commit()
        await db.refresh(confirmation)
        return confirmation

    @staticmethod
    async def get_approved_reports(db: AsyncSession, page: int = 1, limit: int = 20) -> Tuple[List[dict], int]:
        """
        Get paginated approved reports for the community feed.
        Returns a list of dicts mapped to CommunityReportSummary schema.
        """
        offset = (page - 1) * limit
        
        # Count total
        count_result = await db.execute(select(func.count()).where(Report.status == ReportStatus.APPROVED))
        total = count_result.scalar() or 0
        
        # Fetch reports with company and confirmation count
        query = (
            select(
                Report.id,
                Company.name.label("company_name"),
                Report.reason.label("category"),
                Report.created_at,
                func.count(CommunityConfirmation.id).label("confirmations_count")
            )
            .outerjoin(Company, Report.company_id == Company.id)
            .outerjoin(CommunityConfirmation, Report.id == CommunityConfirmation.report_id)
            .where(Report.status == ReportStatus.APPROVED)
            .group_by(Report.id, Company.name)
            .order_by(Report.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        
        result = await db.execute(query)
        rows = result.all()
        
        reports = []
        for row in rows:
            reports.append({
                "id": row.id,
                "company_name": row.company_name,
                "category": row.category,
                "created_at": row.created_at,
                "confirmations_count": row.confirmations_count
            })
            
        return reports, total

    @staticmethod
    async def get_report_intelligence(db: AsyncSession, report_id: str) -> dict:
        """
        Get detailed report intelligence including confirmations.
        Does NOT return user information.
        """
        result = await db.execute(select(Report).where(Report.id == report_id, Report.status == ReportStatus.APPROVED))
        report = result.scalar_one_or_none()
        
        if not report:
            raise HTTPException(status_code=404, detail="Approved report not found")
            
        # Count confirmations
        conf_result = await db.execute(
            select(
                CommunityConfirmation.response,
                func.count()
            )
            .where(CommunityConfirmation.report_id == report_id)
            .group_by(CommunityConfirmation.response)
        )
        conf_rows = conf_result.all()
        
        confirmations = {
            "happened_to_me": 0,
            "did_not_happen_to_me": 0
        }
        for row in conf_rows:
            if row.response == ConfirmationResponse.HAPPENED_TO_ME:
                confirmations["happened_to_me"] = row.count
            elif row.response == ConfirmationResponse.DID_NOT_HAPPEN_TO_ME:
                confirmations["did_not_happen_to_me"] = row.count

        return {
            "report": report,
            "confirmations": confirmations
        }

    @staticmethod
    async def get_entity_approved_reports(db: AsyncSession, entity_type: str, entity_id: str) -> List[Report]:
        """
        Get all APPROVED reports associated with a company, recruiter, or job.
        entity_type should be 'company', 'recruiter', or 'job'.
        """
        query = select(Report).where(Report.status == ReportStatus.APPROVED)
        
        if entity_type == 'company':
            query = query.where(Report.company_id == entity_id)
        elif entity_type == 'recruiter':
            query = query.where(Report.recruiter_id == entity_id)
        elif entity_type == 'job':
            query = query.where(Report.job_posting_id == entity_id)
        else:
            return []
            
        result = await db.execute(query)
        return list(result.scalars().all())
