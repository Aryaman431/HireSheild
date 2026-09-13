from sqlalchemy import String, Integer, ForeignKey, Enum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from .base import Base, TimestampMixin, generate_uuid
from .company import RiskLevel
import enum

class InputSource(str, enum.Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    PDF = "PDF"

if TYPE_CHECKING:
    from .company import Company
    from .recruiter import Recruiter
    from .analysis_run import AnalysisRun
    from .risk_signal import RiskSignal
    from .report import Report

class JobPosting(Base, TimestampMixin):
    __tablename__ = "job_postings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    company_id: Mapped[str | None] = mapped_column(String, ForeignKey("companies.id", ondelete="SET NULL"), index=True, nullable=True)
    recruiter_id: Mapped[str | None] = mapped_column(String, ForeignKey("recruiters.id", ondelete="SET NULL"), index=True, nullable=True)
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    salary: Mapped[str | None] = mapped_column(String, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    source_url: Mapped[str | None] = mapped_column(String, nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(String, nullable=True)
    input_source: Mapped[InputSource] = mapped_column(Enum(InputSource), default=InputSource.TEXT, server_default='TEXT')
    
    risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    risk_level: Mapped[RiskLevel | None] = mapped_column(Enum(RiskLevel), nullable=True)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)

    company: Mapped["Company"] = relationship(back_populates="jobs")
    recruiter: Mapped["Recruiter"] = relationship(back_populates="jobs")
    user: Mapped["User"] = relationship()
    analysis_runs: Mapped[List["AnalysisRun"]] = relationship(back_populates="job_posting", cascade="all, delete-orphan")
    risk_signals: Mapped[List["RiskSignal"]] = relationship(back_populates="job_posting", cascade="all, delete-orphan")
    reports: Mapped[List["Report"]] = relationship(back_populates="job_posting")

    __table_args__ = (
        CheckConstraint('risk_score >= 0 AND risk_score <= 100', name='check_job_risk_score'),
        CheckConstraint('confidence >= 0 AND confidence <= 100', name='check_job_confidence'),
    )
