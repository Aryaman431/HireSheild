from sqlalchemy import String, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from .base import Base, TimestampMixin, generate_uuid
import enum

if TYPE_CHECKING:
    from .user import User
    from .company import Company
    from .recruiter import Recruiter
    from .job_posting import JobPosting
    from .community_confirmation import CommunityConfirmation

class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"

class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    company_id: Mapped[str | None] = mapped_column(String, ForeignKey("companies.id", ondelete="SET NULL"), index=True, nullable=True)
    recruiter_id: Mapped[str | None] = mapped_column(String, ForeignKey("recruiters.id", ondelete="SET NULL"), index=True, nullable=True)
    job_posting_id: Mapped[str | None] = mapped_column(String, ForeignKey("job_postings.id", ondelete="SET NULL"), index=True, nullable=True)
    
    reason: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    evidence: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[ReportStatus] = mapped_column(Enum(ReportStatus), default=ReportStatus.PENDING, index=True)

    user: Mapped["User"] = relationship(back_populates="reports")
    company: Mapped["Company"] = relationship(back_populates="reports")
    recruiter: Mapped["Recruiter"] = relationship(back_populates="reports")
    job_posting: Mapped["JobPosting"] = relationship(back_populates="reports")
    confirmations: Mapped[List["CommunityConfirmation"]] = relationship(back_populates="report", cascade="all, delete-orphan")
