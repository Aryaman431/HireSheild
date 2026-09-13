from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
import mimetypes

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.job_posting import JobPosting
from app.ai.gemini import GeminiProvider
from app.services.analysis_service import AnalysisService
from app.core.config import settings
from .schemas import AnalyzeJobRequest, AnalyzeJobResponse
from app.core.rate_limit import limiter

router = APIRouter()

ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"]

@router.post("/analyze-file", response_model=AnalyzeJobResponse)
@limiter.limit("10/hour")
async def analyze_job_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze job opportunity from an uploaded document (image or PDF).
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
        
    file_bytes = await file.read()
    
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB")
        
    try:
        ai_provider = GeminiProvider()
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI Provider initialization failed")
        
    service = AnalysisService(ai_provider, db)
    
    try:
        job_id = await service.analyze_job_file(file_bytes, file.filename, file.content_type)
        # Assign ownership to the created job
        job = await db.get(JobPosting, job_id)
        if job:
            job.user_id = current_user.id
            await db.commit()
        return AnalyzeJobResponse(job_id=job_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during file analysis."
        )

@router.post("/analyze", response_model=AnalyzeJobResponse)
@limiter.limit("10/hour")
async def analyze_job(
    request: Request,
    analyze_request: AnalyzeJobRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze job opportunity text for suspicious risk signals.
    Requires authentication.
    """
    # Initialize the provider and service inside the route so they use the scoped db session
    try:
        ai_provider = GeminiProvider()
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI Provider initialization failed")
        
    service = AnalysisService(ai_provider, db)
    
    try:
        job_id = await service.analyze_job_text(analyze_request.text)
        job = await db.get(JobPosting, job_id)
        if job:
            job.user_id = current_user.id
            await db.commit()
        return AnalyzeJobResponse(job_id=job_id)
    except Exception as e:
        import logging
        import traceback
        logging.error(f"Analysis Error: {e}")
        logging.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during text analysis: {e}"
        )

@router.get("/{job_id}/result")
async def get_job_result(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch the result of a job analysis.
    """
    # Note: In a full system, we should enforce ownership here. 
    # For Phase 6 MVP, we fetch the result.
    service = AnalysisService(GeminiProvider(), db)
    result = await service.get_analysis_result(job_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Analysis result not found")
        
    job = await db.get(JobPosting, job_id)
    if job and job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis result not found")
        
    return result

from app.models.verification_check import VerificationCheck
from sqlalchemy.future import select

@router.get("/{job_id}/verification")
async def get_job_verification(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch the verification checks for a job, its company, and recruiter.
    """
    from app.models.job_posting import JobPosting
    result = await db.execute(select(JobPosting).where(JobPosting.id == job_id))
    job = result.scalar_one_or_none()
    
    if not job or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis result not found")
        
    entity_ids = [job.id]
    if job.company_id:
        entity_ids.append(job.company_id)
    if job.recruiter_id:
        entity_ids.append(job.recruiter_id)
        
    res = await db.execute(
        select(VerificationCheck)
        .where(VerificationCheck.entity_id.in_(entity_ids))
        .order_by(VerificationCheck.created_at.desc())
    )
    checks = res.scalars().all()
    
    # We could format this better, but returning the list of checks is sufficient for the MVP frontend.
    return {
        "job_id": job.id,
        "company_id": job.company_id,
        "recruiter_id": job.recruiter_id,
        "checks": [
            {
                "id": c.id,
                "entity_type": c.entity_type.value,
                "entity_id": c.entity_id,
                "check_type": c.check_type.value,
                "result": c.result.value,
                "evidence": c.evidence,
                "checked_at": c.checked_at.isoformat() if c.checked_at else None
            }
            for c in checks
        ]
    }

@router.post("/{job_id}/verification/recheck")
async def recheck_job_verification(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger a fresh verification check.
    """
    from app.services.verification_service import VerificationService
    service = VerificationService(db)
    try:
        job = await db.get(JobPosting, job_id)
        if not job or job.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Job not found")
            
        await service.perform_verification_for_job(job_id, force_recheck=True)
        return {"status": "success", "message": "Verification completed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Verification failed.")
