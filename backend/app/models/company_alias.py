from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin, generate_uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .company import Company

class CompanyAlias(Base, TimestampMixin):
    __tablename__ = "company_aliases"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    company_id: Mapped[str] = mapped_column(String, ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    alias: Mapped[str] = mapped_column(String)
    normalized_alias: Mapped[str] = mapped_column(String, index=True)

    company: Mapped["Company"] = relationship(back_populates="aliases")
