from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .supabase import decode_supabase_jwt
from app.core.database import get_db
from app.models.user import User

security = HTTPBearer()

def get_jwt_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Extracts and validates the JWT from the Authorization header.
    Returns the decoded JWT payload.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = decode_supabase_jwt(token)
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_id(payload: dict = Depends(get_jwt_payload)) -> str:
    """
    Returns the Supabase Auth user ID (UUID string).
    """
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
    """
    Fetches the User model from the database based on the authenticated Supabase user ID.
    If the user does not exist in the local database yet, it creates a synchronized record.
    """
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing subject in token")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        # User is authenticated via Supabase but doesn't exist locally yet.
        # Synchronize the record using details from the JWT.
        email = payload.get("email") or f"{user_id}@placeholder.supabase"
        name = payload.get("user_metadata", {}).get("full_name") or "New Investigator"
        
        user = User(id=user_id, email=email, name=name, auth_provider="supabase")
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user
