from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.embedding import Embedding, ReferenceType
from app.models.job_posting import JobPosting
from app.services.historical_service import HistoricalService

router = APIRouter()

@router.get("/{job_id}/historical-intelligence")
async def get_historical_intelligence(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns historical intelligence for a specific job posting.
    """
    job = await db.get(JobPosting, job_id)
    if not job or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Job not found")

    # Verify the embedding exists
    result = await db.execute(
        select(Embedding)
        .filter(Embedding.reference_id == job_id)
        .filter(Embedding.reference_type == ReferenceType.JOB)
    )
    emb = result.scalar_one_or_none()
    
    if not emb or not emb.vector:
        return {
            "available": False,
            "similar_opportunities": [],
            "pattern_summary": {}
        }
        
    historical_service = HistoricalService(db)
    similar_jobs = await historical_service.find_similar_jobs(job_id, emb.vector)
    
    if not similar_jobs:
        return {
            "available": True,
            "similar_opportunities": [],
            "pattern_summary": historical_service.aggregate_patterns([])
        }
        
    patterns = historical_service.aggregate_patterns(similar_jobs)
    
    formatted_jobs = []
    for s_job in similar_jobs:
        distance = getattr(s_job, "_similarity_distance", None)
        relevance = "RELATED"
        if distance is not None:
            if distance <= 0.1:
                relevance = "VERY SIMILAR"
            elif distance <= 0.15:
                relevance = "SIMILAR"

        company_name = s_job.company.name if s_job.company else None

        formatted_jobs.append({
            "title": s_job.title or "Historical Opportunity",
            "company": company_name or "Private Entity",
            "relevance": relevance,
            "risk_level": getattr(s_job.risk_level, 'value', s_job.risk_level) if s_job.risk_level else "UNKNOWN",
            "risk_score": s_job.risk_score,
            "summary": "Private investigation details are withheld to protect user privacy."
        })

    return {
        "available": True,
        "similar_opportunities": formatted_jobs,
        "pattern_summary": patterns,
        "privacy_guard": "Private historical investigation details are intentionally hidden."
    }
