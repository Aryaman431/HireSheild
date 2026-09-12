from sqlalchemy import String, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from .base import Base, TimestampMixin, generate_uuid
import enum

if TYPE_CHECKING:
    from .report import Report
    from .user import User

class ConfirmationResponse(str, enum.Enum):
    HAPPENED_TO_ME = "HAPPENED_TO_ME"
    DID_NOT_HAPPEN_TO_ME = "DID_NOT_HAPPEN_TO_ME"

class CommunityConfirmation(Base, TimestampMixin):
    __tablename__ = "community_confirmations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    report_id: Mapped[str] = mapped_column(String, ForeignKey("reports.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    response: Mapped[ConfirmationResponse] = mapped_column(Enum(ConfirmationResponse))

    report: Mapped["Report"] = relationship(back_populates="confirmations")
    user: Mapped["User"] = relationship(back_populates="confirmations")

    __table_args__ = (
        UniqueConstraint('report_id', 'user_id', name='uq_report_user_confirmation'),
    )
