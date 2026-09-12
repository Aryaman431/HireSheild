from sqlalchemy import String, Integer, ForeignKey, Enum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from .base import Base, TimestampMixin, generate_uuid
from .company import RiskLevel
import enum

if TYPE_CHECKING:
    from .job_posting import JobPosting
    from .analysis_run import AnalysisRun
    from .evidence_item import EvidenceItem

class RiskSignal(Base, TimestampMixin):
    __tablename__ = "risk_signals"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    job_posting_id: Mapped[str] = mapped_column(String, ForeignKey("job_postings.id", ondelete="CASCADE"), index=True)
    analysis_run_id: Mapped[str | None] = mapped_column(String, ForeignKey("analysis_runs.id", ondelete="SET NULL"), index=True, nullable=True)
    
    signal_type: Mapped[str] = mapped_column(String, index=True)
    severity: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel))
    confidence: Mapped[int] = mapped_column(Integer)
    reasoning: Mapped[str | None] = mapped_column(String, nullable=True)
    score_contribution: Mapped[int] = mapped_column(Integer)

    job_posting: Mapped["JobPosting"] = relationship(back_populates="risk_signals")
    analysis_run: Mapped["AnalysisRun"] = relationship(back_populates="risk_signals")
    evidence_items: Mapped[List["EvidenceItem"]] = relationship(back_populates="risk_signal", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint('confidence >= 0 AND confidence <= 100', name='check_signal_confidence'),
    )
