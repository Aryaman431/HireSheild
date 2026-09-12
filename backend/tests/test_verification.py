import pytest
from app.services.verification_service import VerificationService, SafeURLFetcher

def test_extract_domain():
    # Mock db is not needed for extract_domain as it doesn't use self.db
    vs = VerificationService(None)
    
    assert vs.extract_domain("http://company.com") == "company.com"
    assert vs.extract_domain("https://www.company.com/jobs") == "company.com"
    assert vs.extract_domain("HTTPS://WWW.COMPANY.COM") == "company.com"
    assert vs.extract_domain("company.com") == "company.com"
    assert vs.extract_domain("recruiter@company.com") == "company.com"
    assert vs.extract_domain("user@gmail.com") == "gmail.com"
    assert vs.extract_domain("http://company.com:8080/path") == "company.com"
    
@pytest.mark.asyncio
async def test_safe_url_fetcher_safe_ips():
    # Using SafeURLFetcher static methods
    assert await SafeURLFetcher.is_safe_ip("8.8.8.8") == True
    assert await SafeURLFetcher.is_safe_ip("localhost") == False
    assert await SafeURLFetcher.is_safe_ip("127.0.0.1") == False
    assert await SafeURLFetcher.is_safe_ip("10.0.0.1") == False
    assert await SafeURLFetcher.is_safe_ip("192.168.1.1") == False
    
@pytest.mark.asyncio
async def test_safe_url_fetcher_invalid_protocols():
    resp, err = await SafeURLFetcher.fetch("file:///etc/passwd")
    assert resp is None
    assert "Unsupported protocol" in err
    
    resp, err = await SafeURLFetcher.fetch("ftp://example.com")
    assert resp is None
    assert "Unsupported protocol" in err

@pytest.mark.asyncio
async def test_safe_url_fetcher_internal_ip():
    resp, err = await SafeURLFetcher.fetch("http://localhost:8000")
    assert resp is None
    assert "Unsafe or unresolvable hostname" in err

