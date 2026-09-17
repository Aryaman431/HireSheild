from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from io import BytesIO

from pypdf import PdfReader

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
CHUNK_SIZE = 1024 * 1024


async def _read_upload_with_limit(file: UploadFile, max_bytes: int) -> bytes:
    """Read at most max_bytes + 1 so oversized uploads are never fully buffered."""
    chunks = []
    bytes_read = 0

    while bytes_read <= max_bytes:
        chunk = await file.read(min(CHUNK_SIZE, max_bytes - bytes_read + 1))
        if not chunk:
            break
        chunks.append(chunk)
        bytes_read += len(chunk)

    if bytes_read > max_bytes:
        raise HTTPException(status_code=413, detail="Uploaded file exceeds maximum size.")

    return b"".join(chunks)


def _detect_file_type(file_bytes: bytes) -> str | None:
    if file_bytes.startswith(b"%PDF-"):
        return "application/pdf"
    if file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if file_bytes.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if len(file_bytes) >= 12 and file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP":
        return "image/webp"
    return None


def _validate_image(file_bytes: bytes, detected_type: str) -> None:
    if detected_type == "image/png":
        if len(file_bytes) < 33 or file_bytes[12:16] != b"IHDR" or file_bytes[16:24] == b"\x00" * 8:
            raise HTTPException(status_code=400, detail="Unsupported file type or invalid file contents.")
    elif detected_type == "image/jpeg":
        if len(file_bytes) < 4 or not file_bytes.endswith(b"\xff\xd9"):
            raise HTTPException(status_code=400, detail="Unsupported file type or invalid file contents.")
    elif detected_type == "image/webp":
        if len(file_bytes) < 16 or file_bytes[12:16] not in {b"VP8 ", b"VP8L", b"VP8X"}:
            raise HTTPException(status_code=400, detail="Unsupported file type or invalid file contents.")


def _validate_pdf(file_bytes: bytes) -> None:
    try:
        reader = PdfReader(BytesIO(file_bytes), strict=True)
        if reader.is_encrypted or len(reader.pages) == 0:
            raise ValueError
        if len(reader.pages) > settings.MAX_PDF_PAGES:
            raise HTTPException(status_code=400, detail="PDF exceeds the maximum allowed page count.")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Uploaded PDF is invalid or unreadable.")

@router.post("/analyze-file", response_model=AnalyzeJobResponse)
@limiter.limit("60/hour")
async def analyze_job_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze job opportunity from an uploaded document (image or PDF).
    """
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    file_bytes = await _read_upload_with_limit(file, max_bytes)
    detected_type = _detect_file_type(file_bytes)

    if detected_type not in ALLOWED_MIME_TYPES or detected_type != file.content_type:
        raise HTTPException(status_code=400, detail="Unsupported file type or invalid file contents.")

    if detected_type == "application/pdf":
        _validate_pdf(file_bytes)
    else:
        _validate_image(file_bytes, detected_type)
        
    try:
        ai_provider = GeminiProvider()
    except Exception:
        raise HTTPException(status_code=500, detail="AI Provider initialization failed")
        
    service = AnalysisService(ai_provider, db)
    
    try:
        job_id = await service.analyze_job_file(file_bytes, file.filename, detected_type)
        # Assign ownership to the created job
        job = await db.get(JobPosting, job_id)
        if job:
            job.user_id = current_user.id
            await db.commit()
        return AnalyzeJobResponse(job_id=job_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during file analysis."
        )

@router.post("/analyze", response_model=AnalyzeJobResponse)
@limiter.limit("60/hour")
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
            detail=f"An error occurred during text analysis. ({str(e)})"
        )

@router.get("/{job_id}/result")
async def get_job_result(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch the result of a job analysis without initializing AI models.
    """
    job = await db.get(JobPosting, job_id)
    if not job or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Analysis result not found")

    result = await AnalysisService.get_analysis_result(db, job_id)
    if not result:
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
                "entity_type": getattr(c.entity_type, 'value', c.entity_type),
                "entity_id": c.entity_id,
                "check_type": getattr(c.check_type, 'value', c.check_type),
                "result": getattr(c.result, 'value', c.result),
                "evidence": c.evidence,
                "checked_at": c.checked_at.isoformat() if c.checked_at else None
            }
            for c in checks
        ]
    }

@router.post("/{job_id}/verification/recheck")
@limiter.limit("5/minute")
async def recheck_job_verification(
    request: Request,
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
