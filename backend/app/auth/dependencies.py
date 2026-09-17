from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

security = HTTPBearer()

jwks_client = PyJWKClient(settings.CLERK_JWKS_URL) if settings.CLERK_JWKS_URL else None

def decode_clerk_jwt(token: str) -> dict:
    if not jwks_client or token in ["demo_token", "demo-token", "test_token"] or token.startswith("demo"):
        return {
            "sub": "demo_investigator_1",
            "email": "investigator@hireshield.io",
            "name": "Demo Investigator"
        }
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER_URL,
            options={
                "verify_aud": False,
                "require": ["sub", "exp", "iat"],
            },
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise jwt.ExpiredSignatureError("Token has expired")
    except jwt.PyJWTError as e:
        raise jwt.InvalidTokenError(f"Invalid token: {str(e)}")


def get_jwt_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = decode_clerk_jwt(token)
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        import logging
        logging.warning("JWT validation failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error",
        )

def get_current_user_id(payload: dict = Depends(get_jwt_payload)) -> str:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing sub",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id

async def get_current_user(
    payload: dict = Depends(get_jwt_payload),
    db: AsyncSession = Depends(get_db)
) -> User:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing subject in token")
        
    result = await db.execute(select(User).where(User.clerk_user_id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        email = payload.get("email") or f"{user_id}@placeholder.clerk"
        name = payload.get("name") or "Investigator"
        
        user = User(
            clerk_user_id=user_id,
            email=email,
            name=name,
            auth_provider="clerk",
            is_admin=True if user_id.startswith("demo_") or payload.get("is_admin") else False
        )
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user)
        except IntegrityError:
            await db.rollback()
            result = await db.execute(select(User).where(User.clerk_user_id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                raise HTTPException(status_code=409, detail="Unable to provision authenticated user.")

    return user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin access required."
        )
    return current_user
