"""
Database routes for sessions, messages, and prompts
Handles all CRUD operations with Supabase
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..core.supabase_client import get_current_user
from ..services.database import db_service

router = APIRouter(prefix="/api/db", tags=["Database"])


# ==================== REQUEST/RESPONSE MODELS ====================
class SessionCreate(BaseModel):
    title: str = "New Chat"
    model_used: Optional[str] = None


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    model_used: Optional[str] = None


class MessageCreate(BaseModel):
    session_id: str
    role: str
    content: str
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    metadata: Optional[dict] = None


class PromptCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    content: str
    tags: List[str] = []
    is_public: bool = False


class PromptUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


# ==================== SESSION ROUTES ====================
@router.post("/sessions")
async def create_session(
    session: SessionCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new chat session"""
    try:
        result = db_service.create_chat_session(
            user_id=user.id,
            title=session.title,
            model_used=session.model_used
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def get_sessions(
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user)
):
    """Get all sessions for the current user"""
    try:
        sessions = db_service.get_user_chat_sessions(user_id=user.id, limit=limit)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    user: dict = Depends(get_current_user)
):
    """Get a specific session"""
    try:
        session = db_service.get_chat_session(user_id=user.id, session_id=session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/sessions/{session_id}")
async def update_session(
    session_id: str,
    updates: SessionUpdate,
    user: dict = Depends(get_current_user)
):
    """Update a session"""
    try:
        result = db_service.update_chat_session(
            user_id=user.id,
            session_id=session_id,
            title=updates.title,
            model_used=updates.model_used
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a session and all its messages"""
    try:
        result = db_service.delete_chat_session(user_id=user.id, session_id=session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/archive")
async def archive_session(
    session_id: str,
    user: dict = Depends(get_current_user)
):
    """Archive a session (soft delete)"""
    try:
        result = db_service.archive_chat_session(user_id=user.id, session_id=session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MESSAGE ROUTES ====================
@router.post("/messages")
async def save_message(
    message: MessageCreate,
    user: dict = Depends(get_current_user)
):
    """Save a message to a session"""
    try:
        # Verify session belongs to user
        session = db_service.get_chat_session(user_id=user.id, session_id=message.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        result = db_service.save_message(
            session_id=message.session_id,
            user_id=user.id,
            role=message.role,
            content=message.content,
            model=message.model,
            tokens_used=message.tokens_used,
            metadata=message.metadata
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/messages")
async def get_messages(
    session_id: str,
    limit: int = Query(100, ge=1, le=500),
    user: dict = Depends(get_current_user)
):
    """Get all messages for a session"""
    try:
        # Verify session belongs to user
        session = db_service.get_chat_session(user_id=user.id, session_id=session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        messages = db_service.get_session_messages(session_id=session_id, limit=limit)
        return messages
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a specific message"""
    try:
        result = db_service.delete_message(message_id=message_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/clear")
async def clear_session(
    session_id: str,
    user: dict = Depends(get_current_user)
):
    """Clear all messages in a session"""
    try:
        # Verify session belongs to user
        session = db_service.get_chat_session(user_id=user.id, session_id=session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        result = db_service.clear_session_messages(session_id=session_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PROMPT ROUTES ====================
@router.get("/prompts/system")
async def get_system_prompts():
    """Get all system prompts (no auth required)"""
    try:
        result = db_service.supabase.table("prompts").select("*").eq("is_system", True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prompts")
async def get_user_prompts(
    user: dict = Depends(get_current_user)
):
    """Get all prompts for the current user"""
    try:
        result = db_service.supabase.table("prompts").select("*").eq("user_id", user.id).eq("is_system", False).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prompts")
async def create_prompt(
    prompt: PromptCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new prompt"""
    try:
        result = db_service.supabase.table("prompts").insert({
            "user_id": user.id,
            "title": prompt.title,
            "description": prompt.description,
            "content": prompt.content,
            "tags": prompt.tags,
            "is_public": prompt.is_public,
            "is_system": False
        }).execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/prompts/{prompt_id}")
async def update_prompt(
    prompt_id: str,
    updates: PromptUpdate,
    user: dict = Depends(get_current_user)
):
    """Update a prompt"""
    try:
        update_data = {}
        if updates.title: update_data["title"] = updates.title
        if updates.description: update_data["description"] = updates.description
        if updates.content: update_data["content"] = updates.content
        if updates.tags: update_data["tags"] = updates.tags
        if updates.is_public is not None: update_data["is_public"] = updates.is_public
        
        result = db_service.supabase.table("prompts").update(update_data).eq("id", prompt_id).eq("user_id", user.id).execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/prompts/{prompt_id}")
async def delete_prompt(
    prompt_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a prompt"""
    try:
        db_service.supabase.table("prompts").delete().eq("id", prompt_id).eq("user_id", user.id).execute()
        return {"message": "Prompt deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
