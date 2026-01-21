from fastapi import APIRouter, Depends

from src.app.core.supabase_client import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.get("/me")
def read_current_user(user=Depends(get_current_user)):
    """Return the authenticated user's basic profile."""
    return {
        "id": getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None),
        "email": getattr(user, "email", None) or (user.get("email") if isinstance(user, dict) else None),
    }
