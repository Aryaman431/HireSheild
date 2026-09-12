from datetime import datetime
from typing import Any
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func
import uuid

class Base(DeclarativeBase):
    id: Any
    __name__: str

class TimestampMixin:
    """Mixin to add created_at and updated_at columns"""
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

def generate_uuid() -> str:
    return str(uuid.uuid4())
