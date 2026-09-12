from sqlalchemy import String, Integer, ForeignKey, Enum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from .base import Base, TimestampMixin, generate_uuid
import enum

if TYPE_CHECKING:
    from .risk_signal import RiskSignal

class SourceType(str, enum.Enum):
    TEXT_INPUT = "TEXT_INPUT"
    SCREENSHOT = "SCREENSHOT"
    IMAGE = "IMAGE"
    PDF = "PDF"
    URL = "URL"
    WEB_VERIFICATION = "WEB_VERIFICATION"
    COMMUNITY_REPORT = "COMMUNITY_REPORT"
    HISTORICAL_CASE = "HISTORICAL_CASE"

class EvidenceItem(Base, TimestampMixin):
    __tablename__ = "evidence_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    risk_signal_id: Mapped[str] = mapped_column(String, ForeignKey("risk_signals.id", ondelete="CASCADE"), index=True)
    
    source_type: Mapped[SourceType] = mapped_column(Enum(SourceType))
    quote: Mapped[str | None] = mapped_column(String, nullable=True)
    source_reference: Mapped[str | None] = mapped_column(String, nullable=True)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)

    risk_signal: Mapped["RiskSignal"] = relationship(back_populates="evidence_items")

    __table_args__ = (
        CheckConstraint('confidence >= 0 AND confidence <= 100', name='check_evidence_confidence'),
    )
