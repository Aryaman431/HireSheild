from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.recruiter import Recruiter
from app.models.job_posting import JobPosting
from app.models.company import RiskLevel

router = APIRouter()

@router.get("/{recruiter_id}")
async def get_recruiter(
    recruiter_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed recruiter intelligence.
    """
    result = await db.execute(
        select(Recruiter)
        .options(
            selectinload(Recruiter.jobs).selectinload(JobPosting.risk_signals),
            selectinload(Recruiter.company)
        )
        .where(Recruiter.id == recruiter_id)
    )
    recruiter = result.scalar_one_or_none()
    
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
        
    from app.models.verification_check import VerificationCheck
    res_checks = await db.execute(
        select(VerificationCheck)
        .where(VerificationCheck.entity_id == recruiter.id)
        .order_by(VerificationCheck.created_at.desc())
    )
    checks = res_checks.scalars().all()
        
    jobs = []
    high_risk_count = 0
    signal_counts = {}

    for job in recruiter.jobs:
        if job.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            high_risk_count += 1

        for sig in job.risk_signals:
            signal_counts[sig.signal_type.value] = signal_counts.get(sig.signal_type.value, 0) + 1

        jobs.append({
            "risk_score": job.risk_score,
            "risk_level": getattr(job.risk_level, 'value', job.risk_level) if job.risk_level else "UNKNOWN"
        })

    common_signals = [sig for sig, count in signal_counts.items() if count > 0]

    job_count = len(recruiter.jobs)
    activity_summary = f"This contact is associated with {job_count} analyzed opportunit{'y' if job_count == 1 else 'ies'}."

    if recruiter.risk_score and recruiter.risk_score > 60:
        activity_summary = f"This contact has appeared in multiple opportunities with reported risk signals. Exercise caution."

    return {
        "id": recruiter.id,
        "name": recruiter.name,
        "email": None,
        "phone": None,
        "company": {
            "id": recruiter.company.id,
            "name": recruiter.company.name
        } if recruiter.company else None,
        "verification_status": getattr(recruiter.verification_status, 'value', recruiter.verification_status) if recruiter.verification_status else "UNVERIFIED",
        "verification_checks": [
            {
                "id": c.id,
                "check_type": getattr(c.check_type, 'value', c.check_type),
                "result": getattr(c.result, 'value', c.result),
                "evidence": c.evidence,
                "checked_at": c.checked_at.isoformat() if c.checked_at else None
            }
            for c in checks
        ],
        "risk_score": recruiter.risk_score,
        "activity_summary": activity_summary,
        "historical_opportunities_count": job_count,
        "high_risk_opportunities_count": high_risk_count,
        "recurring_risk_signals": common_signals,
        "related_jobs": [],
        "related_jobs_count": len(jobs),
        "reports": []
    }
