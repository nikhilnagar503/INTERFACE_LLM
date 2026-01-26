from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.app.core.supabase_client import get_current_user, get_supabase_client

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class ProfileUpdate(BaseModel):
    display_name: str = None
    avatar_url: str = None


@router.get("/me")
def read_current_user(user=Depends(get_current_user)):
    """Return the authenticated user's basic profile."""
    return {
        "id": getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None),
        "email": getattr(user, "email", None) or (user.get("email") if isinstance(user, dict) else None),
    }


@router.post("/profile")
def create_or_update_profile(profile: ProfileUpdate, user=Depends(get_current_user)):
    """Create or update user profile"""
    try:
        supabase = get_supabase_client()
        user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID not found")
        
        # Try to create profile
        try:
            result = supabase.table("profiles").insert({
                "user_id": user_id,
                "display_name": profile.display_name or "",
                "avatar_url": profile.avatar_url or None
            }).execute()
            if result and result.data:
                return result.data[0]
            return {"user_id": user_id, "display_name": profile.display_name}
        except Exception as insert_err:
            # If insert fails (user already exists), try update
            print(f"Insert failed, attempting update: {insert_err}")
            try:
                result = supabase.table("profiles").update({
                    "display_name": profile.display_name or "",
                    "avatar_url": profile.avatar_url or None
                }).eq("user_id", user_id).execute()
                if result and result.data:
                    return result.data[0]
                return {"user_id": user_id, "display_name": profile.display_name}
            except Exception as update_err:
                print(f"Update also failed: {update_err}")
                raise
    except HTTPException:
        raise
    except Exception as e:
        print(f"Profile creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")
