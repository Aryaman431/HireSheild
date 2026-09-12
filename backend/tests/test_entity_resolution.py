import pytest
from app.services.company_service import CompanyService
from app.services.recruiter_service import RecruiterService
from unittest.mock import AsyncMock

def test_company_normalization():
    service = CompanyService(db=AsyncMock())
    
    assert service.normalize_name("Example Corp.") == "example"
    assert service.normalize_name("  Tech Solutions LLC  ") == "tech solutions"
    assert service.normalize_name("Microsoft Corporation") == "microsoft"
    assert service.normalize_name("Foo Bar, Inc.") == "foo bar"
    assert service.normalize_name("Company") == "company" # no exact suffix
    assert service.normalize_name("") == ""

def test_recruiter_normalization():
    service = RecruiterService(db=AsyncMock())
    
    # Email normalization
    assert service.normalize_email(" Test@Example.com ") == "Test@example.com"
    assert service.normalize_email("USER@DOMAIN.COM") == "USER@domain.com"
    assert service.normalize_email("") == ""
    
    # Phone normalization
    assert service.normalize_phone(" +1 (555) 123-4567 ") == "+15551234567"
    assert service.normalize_phone("555.123.4567") == "5551234567"
    assert service.normalize_phone("+44 +20 7123 4567") == "+442071234567"
    assert service.normalize_phone("") == ""
