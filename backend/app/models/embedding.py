from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from .base import Base, TimestampMixin, generate_uuid
import enum

class ReferenceType(str, enum.Enum):
    JOB = "JOB"
    REPORT = "REPORT"
    EVIDENCE = "EVIDENCE"
    MESSAGE = "MESSAGE"
    CASE = "CASE"

class Embedding(Base, TimestampMixin):
    __tablename__ = "embeddings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    reference_id: Mapped[str] = mapped_column(String, index=True) # polymorphic ID
    reference_type: Mapped[ReferenceType] = mapped_column(Enum(ReferenceType), index=True)
    
    # We will use Gemini's text-embedding-004 model (768 dimensions)
    vector: Mapped[list[float] | None] = mapped_column(Vector(768), nullable=True)
