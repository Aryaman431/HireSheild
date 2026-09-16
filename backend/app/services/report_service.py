import logging
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from app.models.report import Report, ReportStatus
from app.schemas.report import ReportCreate, ReportCategory
from app.models.company import Company
from app.models.recruiter import Recruiter
from app.models.job_posting import JobPosting

logger = logging.getLogger(__name__)

class ReportService:
    @staticmethod
    def _normalize_text(value: str | None) -> str:
        return re.sub(r"\s+", " ", (value or "").strip().lower())

    @staticmethod
    async def create_report(db: AsyncSession, user_id: str, report_data: ReportCreate) -> Report:
        """
        Create a new community report.
        """
        # 1. Validation (must reference at least one entity)
        if not report_data.job_posting_id and not report_data.company_id and not report_data.recruiter_id:
            raise HTTPException(status_code=400, detail="Report must reference a job, company, or recruiter.")

        references = (
            ("job", JobPosting, report_data.job_posting_id),
            ("company", Company, report_data.company_id),
            ("recruiter", Recruiter, report_data.recruiter_id),
        )
        for label, model, reference_id in references:
            if reference_id:
                result = await db.execute(select(model.id).where(model.id == reference_id))
                if result.scalar_one_or_none() is None:
                    raise HTTPException(status_code=404, detail=f"Referenced {label} was not found.")

        # 2. Duplicate Detection: same reporter, category, entity set, and content.
        query = select(Report).where(
            Report.user_id == user_id,
            Report.reason == report_data.reason.value,
            Report.job_posting_id == report_data.job_posting_id,
            Report.company_id == report_data.company_id,
            Report.recruiter_id == report_data.recruiter_id,
        )
        result = await db.execute(query)
        existing_reports = result.scalars().all()
        normalized_description = ReportService._normalize_text(report_data.description)
        normalized_evidence = ReportService._normalize_text(report_data.evidence)

        for existing in existing_reports:
            if (
                ReportService._normalize_text(existing.evidence) == normalized_evidence
                or ReportService._normalize_text(existing.description) == normalized_description
                or abs(len(existing.description) - len(report_data.description)) < 50
            ):
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
