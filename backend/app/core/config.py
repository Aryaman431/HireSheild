from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "HireShield"
    API_V1_STR: str = "/api/v1"
    DATABASE_URI: str
    
    # Optional testing DB
    TEST_DATABASE_URI: str | None = None
    
    SUPABASE_JWT_SECRET: str
    CORS_ORIGINS: str = "http://localhost:3000"

    # AI Configuration (Phase 6)
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Document Processing (Phase 10)
    MAX_UPLOAD_SIZE_MB: int = 10
    MAX_PDF_PAGES: int = 20

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
