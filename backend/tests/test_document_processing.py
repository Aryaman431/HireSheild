import base64
import io
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient, ASGITransport
from pypdf import PdfWriter
from app.main import app
from app.core.config import settings


VALID_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def make_pdf(page_count: int = 1) -> bytes:
    writer = PdfWriter()
    for _ in range(page_count):
        writer.add_blank_page(width=72, height=72)
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


async def upload(auth_client, filename: str, content: bytes, content_type: str):
    return await auth_client.post(
        "/api/v1/jobs/analyze-file",
        files={"file": (filename, io.BytesIO(content), content_type)},
    )

@pytest.mark.asyncio
async def test_analyze_file_requires_auth(db_session):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        with open("requirements.txt", "rb") as f:
            response = await ac.post("/api/v1/jobs/analyze-file", files={"file": ("requirements.txt", f, "text/plain")})
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_analyze_file_invalid_mime(auth_client):
    with open("requirements.txt", "rb") as f:
        response = await auth_client.post("/api/v1/jobs/analyze-file", files={"file": ("requirements.txt", f, "text/plain")})
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]

@pytest.mark.asyncio
async def test_analyze_file_size_limit(auth_client, monkeypatch):
    # Mock settings max size to 0
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 0)
    
    # Create a small dummy file
    with open("dummy.png", "wb") as f:
        f.write(b"0" * 1024)
        
    try:
        with open("dummy.png", "rb") as f:
            response = await auth_client.post("/api/v1/jobs/analyze-file", files={"file": ("dummy.png", f, "image/png")})
        assert response.status_code == 413
        assert "exceeds maximum size" in response.json()["detail"]
    finally:
        import os
        os.remove("dummy.png")


@pytest.mark.asyncio
async def test_valid_pdf_reaches_analysis_pipeline(auth_client):
    with patch("app.api.jobs.GeminiProvider"), patch("app.api.jobs.AnalysisService") as mock_service:
        mock_service.return_value.analyze_job_file = AsyncMock(return_value="pdf-job-id")

        response = await upload(auth_client, "job.pdf", make_pdf(), "application/pdf")

    assert response.status_code == 200
    assert response.json() == {"job_id": "pdf-job-id"}
    mock_service.return_value.analyze_job_file.assert_awaited_once()
    assert mock_service.return_value.analyze_job_file.await_args.args[2] == "application/pdf"


@pytest.mark.asyncio
async def test_valid_image_reaches_analysis_pipeline(auth_client):
    with patch("app.api.jobs.GeminiProvider"), patch("app.api.jobs.AnalysisService") as mock_service:
        mock_service.return_value.analyze_job_file = AsyncMock(return_value="image-job-id")

        response = await upload(auth_client, "job.png", VALID_PNG, "image/png")

    assert response.status_code == 200
    assert response.json() == {"job_id": "image-job-id"}
    mock_service.return_value.analyze_job_file.assert_awaited_once()
    assert mock_service.return_value.analyze_job_file.await_args.args[2] == "image/png"


@pytest.mark.asyncio
async def test_pdf_page_limit_is_rejected_before_analysis(auth_client, monkeypatch):
    monkeypatch.setattr(settings, "MAX_PDF_PAGES", 1)

    with patch("app.api.jobs.AnalysisService") as mock_service:
        response = await upload(auth_client, "many-pages.pdf", make_pdf(2), "application/pdf")

    assert response.status_code == 400
    assert response.json()["detail"] == "PDF exceeds the maximum allowed page count."
    mock_service.assert_not_called()


@pytest.mark.asyncio
async def test_pdf_content_type_mismatch_is_rejected(auth_client):
    response = await upload(auth_client, "job.pdf", b"plain text", "application/pdf")

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_malformed_pdf_is_rejected(auth_client):
    response = await upload(auth_client, "broken.pdf", b"%PDF-not-a-real-pdf", "application/pdf")

    assert response.status_code == 400
    assert response.json()["detail"] == "Uploaded PDF is invalid or unreadable."


@pytest.mark.asyncio
async def test_malformed_image_is_rejected(auth_client):
    response = await upload(auth_client, "broken.png", b"\x89PNG\r\n\x1a\n", "image/png")

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_client_mime_type_cannot_disguise_unsupported_file(auth_client):
    response = await upload(auth_client, "notes.txt", b"not an image or pdf", "image/png")

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]
