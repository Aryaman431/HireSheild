from sqlalchemy import String, Integer, ForeignKey, Enum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from .base import Base, TimestampMixin, generate_uuid
from .company import VerificationStatus

if TYPE_CHECKING:
    from .company import Company
    from .job_posting import JobPosting
    from .report import Report

class Recruiter(Base, TimestampMixin):
    __tablename__ = "recruiters"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    company_id: Mapped[str | None] = mapped_column(String, ForeignKey("companies.id", ondelete="SET NULL"), index=True, nullable=True)
    
    verification_status: Mapped[VerificationStatus] = mapped_column(Enum(VerificationStatus), default=VerificationStatus.UNVERIFIED)
    risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    company: Mapped["Company"] = relationship(back_populates="recruiters")
    jobs: Mapped[List["JobPosting"]] = relationship(back_populates="recruiter")
    reports: Mapped[List["Report"]] = relationship(back_populates="recruiter")

    __table_args__ = (
        CheckConstraint('risk_score >= 0 AND risk_score <= 100', name='check_recruiter_risk_score'),
    )
