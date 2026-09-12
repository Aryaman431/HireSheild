import pytest
from fastapi import HTTPException
import jwt
from unittest.mock import MagicMock
from app.auth.dependencies import get_jwt_payload, get_current_user_id, get_current_user
from fastapi.security import HTTPAuthorizationCredentials
from app.core.config import settings

SECRET = "super-secret-test-key-for-supabase-jwt"

# Patch the settings for tests
@pytest.fixture(autouse=True)
def override_settings(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", SECRET)

def generate_token(payload: dict) -> str:
    return jwt.encode(payload, SECRET, algorithm="HS256")

def test_get_jwt_payload_valid():
    token = generate_token({"sub": "123", "aud": "authenticated"})
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    payload = get_jwt_payload(creds)
    assert payload["sub"] == "123"

def test_get_jwt_payload_invalid():
    # signed with wrong secret
    token = jwt.encode({"sub": "123", "aud": "authenticated"}, "wrong-secret", algorithm="HS256")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    with pytest.raises(HTTPException) as exc:
        get_jwt_payload(creds)
    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid authentication token"

def test_get_jwt_payload_expired():
    import time
    # Expired token (exp in the past)
    token = jwt.encode({"sub": "123", "aud": "authenticated", "exp": time.time() - 3600}, SECRET, algorithm="HS256")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    with pytest.raises(HTTPException) as exc:
        get_jwt_payload(creds)
    assert exc.value.status_code == 401
    assert "Token has expired" in exc.value.detail

def test_get_jwt_payload_missing():
    # Simulate missing token - FastAPI's HTTPBearer handles the missing part,
    # but if creds is None:
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
        "sub": "mock-uuid-1",
        "email": "agent@hireshield.app",
        "user_metadata": {"full_name": "Test Agent"}
    }
    
    # First time: should create user
    user = await get_current_user(payload=payload, db=db_session)
    assert user.id == "mock-uuid-1"
    assert user.email == "agent@hireshield.app"
    assert user.name == "Test Agent"
    
    # Second time: should retrieve existing user
    user2 = await get_current_user(payload=payload, db=db_session)
    assert user2.id == "mock-uuid-1"
    assert user2.email == "agent@hireshield.app" # not recreated
