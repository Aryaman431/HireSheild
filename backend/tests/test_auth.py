import pytest
from fastapi import HTTPException
import jwt
from unittest.mock import patch, MagicMock
from app.auth.dependencies import get_jwt_payload, get_current_user_id, get_current_user, require_admin
from fastapi.security import HTTPAuthorizationCredentials
from app.core.config import settings
from app.models.user import User

@pytest.fixture(autouse=True)
def override_settings(monkeypatch):
    monkeypatch.setattr(settings, "CLERK_JWKS_URL", "https://clerk.com/jwks")

def test_get_jwt_payload_valid():
    with patch("app.auth.dependencies.decode_clerk_jwt") as mock_decode:
        mock_decode.return_value = {"sub": "123", "email": "test@clerk.com"}
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid_token")
        payload = get_jwt_payload(creds)
        assert payload["sub"] == "123"

def test_get_jwt_payload_invalid():
    with patch("app.auth.dependencies.decode_clerk_jwt") as mock_decode:
        mock_decode.side_effect = jwt.InvalidTokenError("Invalid token")
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad_token")
        with pytest.raises(HTTPException) as exc:
            get_jwt_payload(creds)
        assert exc.value.status_code == 401

def test_get_jwt_payload_expired():
    with patch("app.auth.dependencies.decode_clerk_jwt") as mock_decode:
        mock_decode.side_effect = jwt.ExpiredSignatureError("Token has expired")
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="expired_token")
        with pytest.raises(HTTPException) as exc:
            get_jwt_payload(creds)
        assert exc.value.status_code == 401
        assert "Token has expired" in exc.value.detail

def test_get_jwt_payload_missing():
    with pytest.raises(HTTPException) as exc:
        get_jwt_payload(None)
    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid authentication credentials"

def test_get_current_user_id():
    user_id = get_current_user_id({"sub": "user-uuid-1234"})
    assert user_id == "user-uuid-1234"
    
    with pytest.raises(HTTPException):
        get_current_user_id({"email": "no-sub@example.com"})

@pytest.mark.asyncio
async def test_get_current_user_sync(db_session):
    payload = {
        "sub": "mock-clerk-id-1",
        "email": "agent@hireshield.app",
        "name": "Test Agent"
    }
    
    # First time: should create user with clerk_user_id
    user = await get_current_user(payload=payload, db=db_session)
    assert user.clerk_user_id == "mock-clerk-id-1"
    assert user.email == "agent@hireshield.app"
    assert user.name == "Test Agent"
    assert user.is_admin is False
    
    # Second time: should retrieve existing user
    user2 = await get_current_user(payload=payload, db=db_session)
    assert user2.id == user.id
    assert user2.clerk_user_id == "mock-clerk-id-1"

@pytest.mark.asyncio
async def test_require_admin():
    user = User(is_admin=True)
    assert await require_admin(user) == user

    user2 = User(is_admin=False)
    with pytest.raises(HTTPException) as exc:
        await require_admin(user2)
    assert exc.value.status_code == 403
