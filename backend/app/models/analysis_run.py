from sqlalchemy import String, Integer, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from .base import Base, TimestampMixin, generate_uuid
import enum

if TYPE_CHECKING:
    from .job_posting import JobPosting
    from .risk_signal import RiskSignal

class AnalysisStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AnalysisRun(Base, TimestampMixin):
    __tablename__ = "analysis_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    job_posting_id: Mapped[str] = mapped_column(String, ForeignKey("job_postings.id", ondelete="CASCADE"), index=True)
    status: Mapped[AnalysisStatus] = mapped_column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING)
    provider: Mapped[str | None] = mapped_column(String, nullable=True)
    model: Mapped[str | None] = mapped_column(String, nullable=True)
    
    started_at: Mapped[str | None] = mapped_column(String, nullable=True) # store as ISO string or datetime
    completed_at: Mapped[str | None] = mapped_column(String, nullable=True)
    processing_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    job_posting: Mapped["JobPosting"] = relationship(back_populates="analysis_runs")
    risk_signals: Mapped[List["RiskSignal"]] = relationship(back_populates="analysis_run")
