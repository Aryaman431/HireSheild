from sqlalchemy import String, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from .base import Base, TimestampMixin, generate_uuid
import enum

if TYPE_CHECKING:
    from .company_alias import CompanyAlias
    from .recruiter import Recruiter
    from .job_posting import JobPosting
    from .report import Report

class VerificationStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    SUSPICIOUS = "SUSPICIOUS"

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    SUSPICIOUS = "SUSPICIOUS"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, index=True)
    normalized_name: Mapped[str] = mapped_column(String, index=True)
    official_domain: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    website: Mapped[str | None] = mapped_column(String, nullable=True)
    
    verification_status: Mapped[VerificationStatus] = mapped_column(Enum(VerificationStatus), default=VerificationStatus.UNVERIFIED)
    risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    risk_level: Mapped[RiskLevel | None] = mapped_column(Enum(RiskLevel), nullable=True)

    aliases: Mapped[List["CompanyAlias"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    recruiters: Mapped[List["Recruiter"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    jobs: Mapped[List["JobPosting"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    reports: Mapped[List["Report"]] = relationship(back_populates="company", cascade="all, delete-orphan")
