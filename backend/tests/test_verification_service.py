import pytest
import httpx
import socket
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
            "app.services.verification_service.socket.getaddrinfo",
            lambda *_args, **_kwargs: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("8.8.8.8", 0))],
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


@pytest.mark.asyncio
async def test_ssrf_protection_blocks_ipv6_and_mapped_addresses():
    from app.services.verification_service import SafeURLFetcher

    for address in ("::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1"):
        assert await SafeURLFetcher.is_safe_ip(address) is False


@pytest.mark.asyncio
async def test_safe_url_fetcher_validates_redirects_and_redirect_limit(monkeypatch):
    from app.services.verification_service import SafeURLFetcher

    async def public_dns(hostname: str):
        return hostname == "example.com"

    monkeypatch.setattr(SafeURLFetcher, "is_safe_ip", public_dns)
    redirect_count = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal redirect_count
        redirect_count += 1
        return httpx.Response(302, headers={"location": "https://example.com/next"})

    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(
        SafeURLFetcher,
        "client_factory",
        lambda **kwargs: httpx.AsyncClient(transport=transport, **kwargs),
        raising=False,
    )

    response, error = await SafeURLFetcher.fetch("https://example.com/start")

    assert response is None
    assert error == "Too many redirects."
    assert redirect_count == SafeURLFetcher.MAX_REDIRECTS + 1


@pytest.mark.asyncio
async def test_safe_url_fetcher_blocks_redirect_to_localhost(monkeypatch):
    from app.services.verification_service import SafeURLFetcher

    async def public_only(hostname: str):
        return hostname != "127.0.0.1"

    monkeypatch.setattr(SafeURLFetcher, "is_safe_ip", public_only)

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(302, headers={"location": "http://127.0.0.1:8000"})

    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(
        SafeURLFetcher,
        "client_factory",
        lambda **kwargs: httpx.AsyncClient(transport=transport, **kwargs),
        raising=False,
    )

    response, error = await SafeURLFetcher.fetch("https://example.com")

    assert response is None
    assert error == "Unsafe or unresolvable hostname."


@pytest.mark.asyncio
async def test_safe_url_fetcher_blocks_redirect_to_private_ip(monkeypatch):
    from app.services.verification_service import SafeURLFetcher

    async def public_only(hostname: str):
        return hostname not in {"10.0.0.1", "192.168.1.1"}

    monkeypatch.setattr(SafeURLFetcher, "is_safe_ip", public_only)

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(302, headers={"location": "http://10.0.0.1/internal"})

    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(
        SafeURLFetcher,
        "client_factory",
        lambda **kwargs: httpx.AsyncClient(transport=transport, **kwargs),
        raising=False,
    )

    response, error = await SafeURLFetcher.fetch("https://example.com")

    assert response is None
    assert error == "Unsafe or unresolvable hostname."


@pytest.mark.asyncio
async def test_safe_url_fetcher_rejects_oversized_response(monkeypatch):
    from app.services.verification_service import SafeURLFetcher

    monkeypatch.setattr(SafeURLFetcher, "is_safe_ip", AsyncMock(return_value=True))

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=b"x" * (SafeURLFetcher.MAX_RESPONSE_BYTES + 1))

    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(
        SafeURLFetcher,
        "client_factory",
        lambda **kwargs: httpx.AsyncClient(transport=transport, **kwargs),
        raising=False,
    )

    response, error = await SafeURLFetcher.fetch("https://example.com")

    assert response is None
    assert error == "Verification response is too large."


@pytest.mark.asyncio
async def test_safe_url_fetcher_accepts_public_http_and_https(monkeypatch):
    from app.services.verification_service import SafeURLFetcher

    monkeypatch.setattr(SafeURLFetcher, "is_safe_ip", AsyncMock(return_value=True))

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="ok")

    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(
        SafeURLFetcher,
        "client_factory",
        lambda **kwargs: httpx.AsyncClient(transport=transport, **kwargs),
        raising=False,
    )

    for url in ("http://example.com", "https://example.com"):
        response, error = await SafeURLFetcher.fetch(url)
        assert response is not None
        assert response.status_code == 200
        assert error == ""


@pytest.mark.asyncio
async def test_safe_url_fetcher_rejects_invalid_schemes_and_urls():
    from app.services.verification_service import SafeURLFetcher

    for url in ("file:///etc/passwd", "ftp://example.com", "javascript:alert(1)", "https://user:pass@example.com", "https://"):
        response, error = await SafeURLFetcher.fetch(url)
        assert response is None
        assert error in {"Unsupported protocol.", "Invalid URL."}


@pytest.mark.asyncio
async def test_safe_url_fetcher_handles_network_failure(monkeypatch):
    from app.services.verification_service import SafeURLFetcher

    monkeypatch.setattr(SafeURLFetcher, "is_safe_ip", AsyncMock(return_value=True))

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timeout", request=request)

    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(
        SafeURLFetcher,
        "client_factory",
        lambda **kwargs: httpx.AsyncClient(transport=transport, **kwargs),
        raising=False,
    )

    response, error = await SafeURLFetcher.fetch("https://example.com")

    assert response is None
    assert error == "Network error while fetching URL."
