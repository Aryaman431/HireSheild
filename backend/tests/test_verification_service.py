import pytest
from app.services.verification_service import VerificationService
from unittest.mock import AsyncMock

def test_domain_extraction():
    service = VerificationService(db=AsyncMock())
    
    assert service.extract_domain("https://www.example.com/jobs") == "example.com"
    assert service.extract_domain("http://example.com/careers") == "example.com"
    assert service.extract_domain("example.com") == "example.com"
    assert service.extract_domain("recruiter@example.com") == "example.com"
    assert service.extract_domain("foo@sub.example.com") == "sub.example.com"
    assert service.extract_domain("https://example.com:8080") == "example.com"
    assert service.extract_domain("") is None

@pytest.mark.asyncio
async def test_ssrf_protection_safe_ip(monkeypatch):
    from app.services.verification_service import SafeURLFetcher
    # Public IPs should be safe
    assert await SafeURLFetcher.is_safe_ip("8.8.8.8") is True
    # Keep hostname validation deterministic: it must not depend on external DNS.
    with monkeypatch.context() as context:
        context.setattr(
            "app.services.verification_service.socket.gethostbyname",
            lambda _: "8.8.8.8",
        )
        assert await SafeURLFetcher.is_safe_ip("google.com") is True
    
    # Private / Reserved IPs should be blocked
    assert await SafeURLFetcher.is_safe_ip("127.0.0.1") is False
    assert await SafeURLFetcher.is_safe_ip("localhost") is False
    assert await SafeURLFetcher.is_safe_ip("10.0.0.1") is False
    assert await SafeURLFetcher.is_safe_ip("192.168.1.1") is False
    assert await SafeURLFetcher.is_safe_ip("172.16.0.1") is False
    assert await SafeURLFetcher.is_safe_ip("0.0.0.0") is False

@pytest.mark.asyncio
async def test_safe_url_fetcher_blocks_unsafe():
    from app.services.verification_service import SafeURLFetcher
    
    resp, err = await SafeURLFetcher.fetch("http://localhost:8000")
    assert resp is None
    assert "Unsafe or unresolvable hostname" in err
    
    resp, err = await SafeURLFetcher.fetch("http://127.0.0.1")
    assert resp is None
    assert "Unsafe or unresolvable hostname" in err
