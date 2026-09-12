from sqlalchemy import String, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, TimestampMixin, generate_uuid
from datetime import datetime
from sqlalchemy.sql import func
import enum

class EntityType(str, enum.Enum):
    COMPANY = "COMPANY"
    RECRUITER = "RECRUITER"
    JOB = "JOB"
    URL = "URL"

class CheckType(str, enum.Enum):
    COMPANY_DOMAIN = "COMPANY_DOMAIN"
    RECRUITER_EMAIL_DOMAIN = "RECRUITER_EMAIL_DOMAIN"
    APPLICATION_URL = "APPLICATION_URL"
    HTTPS = "HTTPS"
    OFFICIAL_JOB_POSTING = "OFFICIAL_JOB_POSTING"
    COMPANY_RECRUITER_RELATIONSHIP = "COMPANY_RECRUITER_RELATIONSHIP"

class CheckResult(str, enum.Enum):
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    SUSPICIOUS = "SUSPICIOUS"
    FAILED = "FAILED"

class VerificationCheck(Base, TimestampMixin):
    __tablename__ = "verification_checks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    entity_type: Mapped[EntityType] = mapped_column(Enum(EntityType), index=True)
    entity_id: Mapped[str] = mapped_column(String, index=True) # polymorphic ID, not a strict foreign key
    
    check_type: Mapped[CheckType] = mapped_column(Enum(CheckType))
    result: Mapped[CheckResult] = mapped_column(Enum(CheckResult))
    evidence: Mapped[str | None] = mapped_column(String, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
