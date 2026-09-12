from sqlalchemy import String, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, TimestampMixin, generate_uuid

class RiskRule(Base, TimestampMixin):
    __tablename__ = "risk_rules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    signal_type: Mapped[str] = mapped_column(String, unique=True, index=True)
    score: Mapped[int] = mapped_column(Integer) # positive for risk, negative for verified
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
