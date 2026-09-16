import pytest
from app.embeddings.service import EmbeddingService
from app.models.job_posting import JobPosting
from unittest.mock import AsyncMock
from app.models.embedding import Embedding, ReferenceType

def test_construct_job_text():
    # Setup mock provider and DB
    service = EmbeddingService(provider=AsyncMock(), db=AsyncMock())
    
    job = JobPosting(
        title="Software Intern",
        description="Write code.",
        salary="$20/hr"
    )
    
    text = service.construct_job_text(job, [], "Test Company")
    
    assert "JOB TITLE:\nSoftware Intern" in text
    assert "COMPANY:\nTest Company" in text
    assert "DESCRIPTION:\nWrite code." in text
    assert "COMPENSATION:\n$20/hr" in text
    assert "RISK SIGNALS" not in text


def test_embedding_schema_requires_768_dimensions_and_unique_reference():
    vector_column = Embedding.__table__.c.vector

    assert vector_column.type.dim == 768
    assert vector_column.nullable is False
    assert any(
        constraint.name == "uq_embedding_reference"
        and {column.name for column in constraint.columns} == {"reference_type", "reference_id"}
        for constraint in Embedding.__table__.constraints
    )
    assert ReferenceType.JOB.value == "JOB"
