from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.embedding import Embedding, ReferenceType
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
    for job in similar_jobs:
        # Distance metric is attached dynamically by the service
        distance = getattr(job, "_similarity_distance", None)
        relevance = "RELATED"
        if distance is not None:
            if distance <= 0.1:
                relevance = "VERY SIMILAR"
            elif distance <= 0.15:
                relevance = "SIMILAR"
                
        formatted_jobs.append({
            "id": job.id,
            "title": job.title,
            "company": job.company.name if job.company else "Unknown",
            "risk_score": job.risk_score,
            "risk_level": job.risk_level.value if job.risk_level else "UNKNOWN",
            "relevance": relevance,
            "created_at": job.created_at.isoformat() if job.created_at else None
        })
        
    return {
        "available": True,
        "similar_opportunities": formatted_jobs,
        "pattern_summary": patterns
    }
