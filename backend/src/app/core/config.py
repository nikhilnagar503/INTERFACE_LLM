import os
from functools import lru_cache
from typing import List
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)


def _parse_origins(value: str | None) -> List[str]:
    if not value:
        return ["http://localhost:3000"]
    return [origin.strip() for origin in value.split(",") if origin.strip()]


class Settings:
    """Lightweight settings loader to keep FastAPI configuration centralized."""

    def __init__(self) -> None:
        self.fastapi_debug: bool = os.getenv("FASTAPI_DEBUG", "true").lower() == "true"
        self.fastapi_host: str = os.getenv("FASTAPI_HOST", "0.0.0.0")
        self.fastapi_port: int = int(os.getenv("FASTAPI_PORT", "5000"))
        self.fastapi_reload: bool = os.getenv("FASTAPI_RELOAD", "true").lower() == "true"
        self.supabase_url: str = os.getenv("SUPABASE_URL", "")
        self.supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
        self.supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.allowed_origins: List[str] = _parse_origins(os.getenv("FRONTEND_ORIGINS"))


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
