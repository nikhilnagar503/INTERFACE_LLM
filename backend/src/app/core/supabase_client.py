from fastapi import Header, HTTPException
from supabase import Client, create_client

from .config import settings

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """Return a singleton Supabase client using service role to bypass RLS for server ops."""
    global _supabase_client
    if _supabase_client is None:
        key = settings.supabase_service_role_key or settings.supabase_anon_key
        if not settings.supabase_url or not key:
            raise RuntimeError("Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
        _supabase_client = create_client(settings.supabase_url, key)
    return _supabase_client


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """FastAPI dependency to validate the Supabase JWT and return the user object."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1]
    client = get_supabase_client()

    try:
        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid auth token")
        return user_response.user
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive catch
        raise HTTPException(status_code=401, detail=f"Invalid auth token: {exc}")
