from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from .base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from .report import Report
    from .community_confirmation import CommunityConfirmation

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    auth_provider: Mapped[str] = mapped_column(String, default="supabase")

    reports: Mapped[List["Report"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    confirmations: Mapped[List["CommunityConfirmation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
