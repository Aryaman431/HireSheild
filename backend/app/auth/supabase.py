import jwt
from app.core.config import settings

def decode_supabase_jwt(token: str) -> dict:
    """
    Decodes and validates a Supabase JWT.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError if validation fails.
    """
    decoded = jwt.decode(
        token,
        settings.SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        audience="authenticated"
    )
    return decoded
