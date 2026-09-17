from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from .config import settings

def get_async_database_uri(uri: str) -> str:
    if uri.startswith("postgres://"):
        return uri.replace("postgres://", "postgresql+asyncpg://", 1)
    if uri.startswith("postgresql://") and not uri.startswith("postgresql+asyncpg://"):
        return uri.replace("postgresql://", "postgresql+asyncpg://", 1)
    return uri

engine = create_async_engine(get_async_database_uri(settings.DATABASE_URI), echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
