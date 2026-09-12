from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.company import Company, RiskLevel
from app.models.job_posting import JobPosting
from app.models.risk_signal import RiskSignal

router = APIRouter()

@router.get("/{company_id}")
async def get_company(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get basic company intelligence.
    """
    result = await db.execute(
        select(Company)
        .options(
            selectinload(Company.jobs),
            selectinload(Company.recruiters)
        )
        .where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    return {
        "id": company.id,
        "name": company.name,
        "domain": company.official_domain,
        "verification_status": company.verification_status.value if company.verification_status else "UNVERIFIED",
        "risk_score": company.risk_score,
        "risk_level": company.risk_level.value if company.risk_level else "UNKNOWN",
        "related_jobs_count": len(company.jobs),
        "recruiter_count": len(company.recruiters)
    }

@router.get("/{company_id}/intelligence")
async def get_company_intelligence(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get deep company intelligence dossier.
    """
    result = await db.execute(
        select(Company)
        .options(
            selectinload(Company.jobs).selectinload(JobPosting.risk_signals),
            selectinload(Company.recruiters)
        )
        .where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    from app.models.verification_check import VerificationCheck
    res_checks = await db.execute(
        select(VerificationCheck)
        .where(VerificationCheck.entity_id == company.id)
        .order_by(VerificationCheck.created_at.desc())
    )
    checks = res_checks.scalars().all()
        
    jobs = []
    high_risk_count = 0
    signal_counts = {}
    
    for job in company.jobs:
        if job.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            high_risk_count += 1
            
        for sig in job.risk_signals:
            signal_counts[sig.signal_type.value] = signal_counts.get(sig.signal_type.value, 0) + 1
            
        jobs.append({
            "id": job.id,
            "title": job.title,
            "risk_score": job.risk_score,
            "risk_level": job.risk_level.value if job.risk_level else "UNKNOWN"
        })
        
    common_signals = [sig for sig, count in signal_counts.items() if count > 0]
        
    recruiters = []
    for rec in company.recruiters:
        recruiters.append({
            "id": rec.id,
            "name": rec.name,
            "verification_status": rec.verification_status.value if rec.verification_status else "UNVERIFIED"
        })
        
    return {
        "company": {
            "id": company.id,
            "name": company.name,
            "domain": company.official_domain,
        },
        "verification": {
            "status": company.verification_status.value if company.verification_status else "UNVERIFIED",
            "checks": [
                {
                    "id": c.id,
                    "check_type": c.check_type.value,
                    "result": c.result.value,
                    "evidence": c.evidence,
                    "checked_at": c.checked_at.isoformat() if c.checked_at else None
                }
                for c in checks
            ]
        },
        "risk": {
            "score": company.risk_score,
            "level": company.risk_level.value if company.risk_level else "UNKNOWN",
            "historical_opportunities_count": len(jobs),
            "high_risk_opportunities_count": high_risk_count,
            "recurring_risk_signals": common_signals
        },
        "related_jobs": jobs,
        "associated_recruiters": recruiters,
        "reports": [] # Phase 9 placeholder
    }
