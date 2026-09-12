import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from app.models.report import Report, ReportStatus
from app.schemas.report import ReportCreate, ReportCategory

logger = logging.getLogger(__name__)

class ReportService:
    @staticmethod
    async def create_report(db: AsyncSession, user_id: str, report_data: ReportCreate) -> Report:
        """
        Create a new community report.
        """
        # 1. Validation (must reference at least one entity)
        if not report_data.job_posting_id and not report_data.company_id and not report_data.recruiter_id:
            raise HTTPException(status_code=400, detail="Report must reference a job, company, or recruiter.")

        # 2. Duplicate Detection
        # A simple check: same user, same reason, same job (if provided)
        query = select(Report).where(
            Report.user_id == user_id,
            Report.reason == report_data.reason.value
        )
        if report_data.job_posting_id:
            query = query.where(Report.job_posting_id == report_data.job_posting_id)
        
        result = await db.execute(query)
        existing = result.scalars().first()
        
        if existing:
            # Check description similarity (naive length check for simplicity in MVP)
            if abs(len(existing.description) - len(report_data.description)) < 50:
                raise HTTPException(status_code=409, detail="A similar report has already been submitted by this user.")

        # 3. Create Report (Default status: PENDING)
        new_report = Report(
            user_id=user_id,
            job_posting_id=report_data.job_posting_id,
            company_id=report_data.company_id,
            recruiter_id=report_data.recruiter_id,
            reason=report_data.reason.value,
            description=report_data.description.strip(),
            evidence=report_data.evidence.strip() if report_data.evidence else None,
            status=ReportStatus.PENDING
        )
        
        db.add(new_report)
        await db.commit()
        await db.refresh(new_report)
        return new_report

    @staticmethod
    async def moderate_report(db: AsyncSession, report_id: str, new_status: ReportStatus) -> Report:
        """
        Admin operation to moderate a report.
        """
        result = await db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
        report.status = new_status
        await db.commit()
        await db.refresh(report)
        return report

    @staticmethod
    async def get_report_by_id(db: AsyncSession, report_id: str, user_id: str = None) -> Report:
        result = await db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if user_id and report.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this report")
        return report
