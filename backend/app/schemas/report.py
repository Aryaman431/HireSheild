from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import enum
from app.models.report import ReportStatus

class ReportCategory(str, enum.Enum):
    SUSPICIOUS_JOB = "SUSPICIOUS_JOB"
    SUSPICIOUS_RECRUITER = "SUSPICIOUS_RECRUITER"
    COMPANY_IMPERSONATION = "COMPANY_IMPERSONATION"
    UPFRONT_PAYMENT = "UPFRONT_PAYMENT"
    PHISHING = "PHISHING"
    PERSONAL_INFORMATION_SCAM = "PERSONAL_INFORMATION_SCAM"
    FAKE_JOB_POSTING = "FAKE_JOB_POSTING"
    MISLEADING_RECRUITMENT = "MISLEADING_RECRUITMENT"
    OTHER = "OTHER"

class ReportCreate(BaseModel):
    job_posting_id: Optional[str] = None
    company_id: Optional[str] = None
    recruiter_id: Optional[str] = None
    reason: ReportCategory
    description: str = Field(..., min_length=10, max_length=2000)
    evidence: Optional[str] = Field(None, max_length=5000)

class ReportModerate(BaseModel):
    status: ReportStatus

from app.models.community_confirmation import ConfirmationResponse

class CommunityConfirmationRequest(BaseModel):
    response: ConfirmationResponse

class ReportResponse(BaseModel):
    id: str
    company_id: Optional[str] = None
    recruiter_id: Optional[str] = None
    job_posting_id: Optional[str] = None
    reason: str
    description: str
    evidence: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class CommunityReportSummary(BaseModel):
    id: str
    company_name: Optional[str] = None
    category: str
    risk_level: Optional[str] = None
    created_at: datetime
    confirmations_count: int

class CommunityIntelligenceList(BaseModel):
    reports: List[CommunityReportSummary]
    total: int
    page: int
