import pytest
from app.embeddings.service import EmbeddingService
from app.models.job_posting import JobPosting
from unittest.mock import AsyncMock

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
