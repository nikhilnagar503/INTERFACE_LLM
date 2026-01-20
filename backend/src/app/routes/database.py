"""
Database API endpoints for sessions, messages, API keys, and settings
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from ..core.supabase_client import get_current_user
from ..services.database import db_service

router = APIRouter(prefix="/api/db", tags=["Database"])


# ==================== REQUEST/RESPONSE MODELS ====================
class CreateSessionRequest(BaseModel):
    title: str = "New Chat"
    model_used: Optional[str] = None


class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    model_used: Optional[str] = None


class SaveMessageRequest(BaseModel):
    session_id: str
    role: str  # 'user', 'assistant', 'system'
    content: str
    model: Optional[str] = None
    tokens_used: Optional[int] = None


class SessionResponse(BaseModel):
    id: str
    title: str
    model_used: Optional[str]
    created_at: str
    last_message_at: str
    message_count: int
    is_archived: bool


class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: str
    model: Optional[str]
    tokens_used: Optional[int]


class ApiKeyResponse(BaseModel):
    id: str
    provider: str
    is_active: bool
    created_at: str


class SettingsResponse(BaseModel):
    id: str
    user_id: str
    default_temperature: float
    default_max_tokens: int
    sidebar_collapsed: bool


# ==================== SETTINGS ENDPOINTS ====================
@router.get("/settings", response_model=SettingsResponse)
def get_settings(user=Depends(get_current_user)):
    """Get user settings"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    settings = db_service.get_user_settings(user_id)
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings


@router.put("/settings")
def update_settings(
    user=Depends(get_current_user),
    default_temperature: Optional[float] = None,
    default_max_tokens: Optional[int] = None,
    sidebar_collapsed: Optional[bool] = None
):
    """Update user settings"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    settings = db_service.update_user_settings(user_id, default_temperature, default_max_tokens, sidebar_collapsed)
    return {"message": "Settings updated", "data": settings}


# ==================== API KEYS ENDPOINTS ====================
@router.get("/api-keys", response_model=List[ApiKeyResponse])
def get_api_keys(user=Depends(get_current_user)):
    """Get all API keys for the user"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    keys = db_service.get_user_api_keys(user_id)
    return keys


@router.post("/api-keys")
def save_api_key(provider: str, api_key: str, user=Depends(get_current_user)):
    """Save or update an API key"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    if not provider or not api_key:
        raise HTTPException(status_code=400, detail="provider and api_key are required")

    result = db_service.save_api_key(user_id, provider, api_key)
    return {"message": "API key saved successfully", "data": result}


@router.delete("/api-keys/{api_key_id}")
def delete_api_key(api_key_id: str, user=Depends(get_current_user)):
    """Delete an API key"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    result = db_service.delete_api_key(user_id, api_key_id)
    return result


# ==================== CHAT SESSIONS ENDPOINTS ====================
@router.post("/sessions", response_model=SessionResponse)
def create_session(request: CreateSessionRequest, user=Depends(get_current_user)):
    """Create a new chat session"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    session = db_service.create_chat_session(user_id, request.title, request.model_used)
    return session


@router.get("/sessions", response_model=List[SessionResponse])
def get_sessions(user=Depends(get_current_user)):
    """Get all chat sessions for the user"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    sessions = db_service.get_user_chat_sessions(user_id)
    return sessions


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, user=Depends(get_current_user)):
    """Get a specific chat session"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    session = db_service.get_chat_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.put("/sessions/{session_id}")
def update_session(session_id: str, request: UpdateSessionRequest, user=Depends(get_current_user)):
    """Update a chat session"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    session = db_service.update_chat_session(user_id, session_id, request.title, request.model_used)
    return {"message": "Session updated", "data": session}


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, user=Depends(get_current_user)):
    """Delete a chat session and all its messages"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    result = db_service.delete_chat_session(user_id, session_id)
    return result


@router.post("/sessions/{session_id}/archive")
def archive_session(session_id: str, user=Depends(get_current_user)):
    """Archive a chat session"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    result = db_service.archive_chat_session(user_id, session_id)
    return {"message": "Session archived", "data": result}


# ==================== CHAT MESSAGES ENDPOINTS ====================
@router.post("/messages", response_model=MessageResponse)
def save_message(request: SaveMessageRequest, user=Depends(get_current_user)):
    """Save a message to a chat session"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    # Verify user owns this session
    session = db_service.get_chat_session(user_id, request.session_id)
    if not session:
        raise HTTPException(status_code=403, detail="Session not found or unauthorized")

    message = db_service.save_message(
        request.session_id, request.role, request.content, request.model, request.tokens_used
    )
    return message


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
def get_messages(session_id: str, user=Depends(get_current_user)):
    """Get all messages for a session"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    # Verify user owns this session
    session = db_service.get_chat_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=403, detail="Session not found or unauthorized")

    messages = db_service.get_session_messages(session_id)
    return messages


@router.delete("/messages/{message_id}")
def delete_message(message_id: str, user=Depends(get_current_user)):
    """Delete a message"""
    # Note: In production, you'd want to verify the user owns this message's session
    result = db_service.delete_message(message_id)
    return result


@router.post("/sessions/{session_id}/clear")
def clear_session(session_id: str, user=Depends(get_current_user)):
    """Clear all messages in a session"""
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id")

    # Verify user owns this session
    session = db_service.get_chat_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=403, detail="Session not found or unauthorized")

    result = db_service.clear_session_messages(session_id)
    return result
