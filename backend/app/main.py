from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.api.jobs import router as jobs_router
from app.api.jobs_historical import router as jobs_historical_router
from app.api.companies import router as companies_router
from app.api.recruiters import router as recruiters_router
from app.api.reports import router as reports_router
from app.api.community import router as community_router
from contextlib import asynccontextmanager
from app.core.rate_limit import limiter

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.database import engine
    from app.models.base import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Configure CORS for frontend access
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
is_wildcard = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if not is_wildcard else ["*"],
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs_router, prefix=f"{settings.API_V1_STR}/jobs", tags=["jobs"])
app.include_router(jobs_historical_router, prefix=f"{settings.API_V1_STR}/jobs", tags=["jobs-historical"])
app.include_router(companies_router, prefix=f"{settings.API_V1_STR}/companies", tags=["companies"])
app.include_router(recruiters_router, prefix=f"{settings.API_V1_STR}/recruiters", tags=["recruiters"])
app.include_router(reports_router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])
app.include_router(community_router, prefix=f"{settings.API_V1_STR}/community", tags=["community"])

@app.get("/")
async def root():
    return {"message": "Welcome to the HireShield API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
