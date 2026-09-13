import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models.base import Base

# Use an in-memory SQLite DB for tests, but note that pgvector is PostgreSQL only.
# This test suite will fail if it tries to test pgvector models against sqlite.
# For full tests, we'd need a real PostgreSQL DB.
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    # create all tables except embeddings (which uses pgvector)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def db_session(engine):
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session() as session:
        yield session
        await session.rollback()

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User

@pytest_asyncio.fixture
async def async_client(db_session):
    async def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.pop(get_db, None)

@pytest.fixture
def override_auth():
    def _override(user_id: str = "test_user_123", is_admin: bool = False):
        async def mock_get_current_user():
            return User(id=user_id, email=f"{user_id}@test.com", name="Test User", auth_provider="clerk", is_admin=is_admin)
        app.dependency_overrides[get_current_user] = mock_get_current_user
    
    yield _override
    
    # Teardown: clear the overrides
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def auth_client(async_client, override_auth):
    override_auth("auth_client_user")
    return async_client

