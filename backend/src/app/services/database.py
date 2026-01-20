"""
Database service layer for Supabase CRUD operations
Handles all database interactions for sessions, messages, API keys, and settings
"""

from datetime import datetime
from uuid import UUID
from typing import Optional, List, Dict, Any
from fastapi import HTTPException

from ..core.supabase_client import get_supabase_client


class DatabaseService:
    """Service for all database operations"""

    def __init__(self):
        self.supabase = get_supabase_client()

    # ==================== USER SETTINGS ====================
    def get_user_settings(self, user_id: str) -> Dict[str, Any]:
        """Get user settings"""
        try:
            response = self.supabase.table("user_settings").select("*").eq("user_id", user_id).single().execute()
            return response.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch user settings: {str(e)}")

    def update_user_settings(
        self, user_id: str, default_temperature: float = None, default_max_tokens: int = None,
        sidebar_collapsed: bool = None
    ) -> Dict[str, Any]:
        """Update user settings"""
        try:
            update_data = {"updated_at": datetime.utcnow().isoformat()}
            if default_temperature is not None:
                update_data["default_temperature"] = default_temperature
            if default_max_tokens is not None:
                update_data["default_max_tokens"] = default_max_tokens
            if sidebar_collapsed is not None:
                update_data["sidebar_collapsed"] = sidebar_collapsed

            response = (
                self.supabase.table("user_settings")
                .update(update_data)
                .eq("user_id", user_id)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update user settings: {str(e)}")

    # ==================== API KEYS ====================
    def get_user_api_keys(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all API keys for a user"""
        try:
            response = (
                self.supabase.table("user_api_keys")
                .select("id, provider, is_active, created_at, updated_at")
                .eq("user_id", user_id)
                .execute()
            )
            return response.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch API keys: {str(e)}")

    def get_api_key_by_provider(self, user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        """Get a specific API key by provider"""
        try:
            response = (
                self.supabase.table("user_api_keys")
                .select("*")
                .eq("user_id", user_id)
                .eq("provider", provider)
                .eq("is_active", True)
                .single()
                .execute()
            )
            return response.data
        except Exception:
            return None

    def save_api_key(self, user_id: str, provider: str, api_key: str) -> Dict[str, Any]:
        """Save or update an API key"""
        try:
            # Try to get existing key
            existing = self.get_api_key_by_provider(user_id, provider)

            if existing:
                # Update existing
                response = (
                    self.supabase.table("user_api_keys")
                    .update({"api_key": api_key, "is_active": True, "updated_at": datetime.utcnow().isoformat()})
                    .eq("user_id", user_id)
                    .eq("provider", provider)
                    .execute()
                )
            else:
                # Insert new
                response = (
                    self.supabase.table("user_api_keys")
                    .insert({
                        "user_id": user_id,
                        "provider": provider,
                        "api_key": api_key,
                        "is_active": True
                    })
                    .execute()
                )
            return response.data[0] if response.data else {}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save API key: {str(e)}")

    def delete_api_key(self, user_id: str, api_key_id: str) -> Dict[str, Any]:
        """Delete an API key"""
        try:
            response = (
                self.supabase.table("user_api_keys")
                .delete()
                .eq("id", api_key_id)
                .eq("user_id", user_id)
                .execute()
            )
            return {"message": "API key deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete API key: {str(e)}")

    # ==================== CHAT SESSIONS ====================
    def create_chat_session(self, user_id: str, title: str = "New Chat", model_used: str = None) -> Dict[str, Any]:
        """Create a new chat session"""
        try:
            response = (
                self.supabase.table("chat_sessions")
                .insert({
                    "user_id": user_id,
                    "title": title,
                    "model_used": model_used
                })
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create chat session: {str(e)}")

    def get_chat_session(self, user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific chat session"""
        try:
            response = (
                self.supabase.table("chat_sessions")
                .select("*")
                .eq("user_id", user_id)
                .eq("id", session_id)
                .single()
                .execute()
            )
            return response.data
        except Exception:
            return None

    def get_user_chat_sessions(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all chat sessions for a user (ordered by most recent)"""
        try:
            response = (
                self.supabase.table("chat_sessions")
                .select("id, title, model_used, created_at, last_message_at, message_count, is_archived")
                .eq("user_id", user_id)
                .eq("is_archived", False)
                .order("last_message_at", desc=True)
                .limit(limit)
                .execute()
            )
            return response.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch chat sessions: {str(e)}")

    def update_chat_session(self, user_id: str, session_id: str, title: str = None, model_used: str = None) -> Dict[str, Any]:
        """Update a chat session"""
        try:
            update_data = {"updated_at": datetime.utcnow().isoformat()}
            if title:
                update_data["title"] = title
            if model_used:
                update_data["model_used"] = model_used

            response = (
                self.supabase.table("chat_sessions")
                .update(update_data)
                .eq("user_id", user_id)
                .eq("id", session_id)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update chat session: {str(e)}")

    def archive_chat_session(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """Archive a chat session (soft delete)"""
        try:
            response = (
                self.supabase.table("chat_sessions")
                .update({
                    "is_archived": True,
                    "updated_at": datetime.utcnow().isoformat()
                })
                .eq("user_id", user_id)
                .eq("id", session_id)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to archive chat session: {str(e)}")

    def delete_chat_session(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """Permanently delete a chat session and all its messages"""
        try:
            response = (
                self.supabase.table("chat_sessions")
                .delete()
                .eq("user_id", user_id)
                .eq("id", session_id)
                .execute()
            )
            return {"message": "Chat session deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete chat session: {str(e)}")

    # ==================== CHAT MESSAGES ====================
    def save_message(self, session_id: str, role: str, content: str, model: str = None, tokens_used: int = None, metadata: Dict = None) -> Dict[str, Any]:
        """Save a message to a chat session"""
        try:
            response = (
                self.supabase.table("chat_messages")
                .insert({
                    "session_id": session_id,
                    "role": role,
                    "content": content,
                    "model": model,
                    "tokens_used": tokens_used,
                    "metadata": metadata
                })
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save message: {str(e)}")

    def get_session_messages(self, session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all messages for a session"""
        try:
            response = (
                self.supabase.table("chat_messages")
                .select("*")
                .eq("session_id", session_id)
                .order("created_at", desc=False)
                .limit(limit)
                .execute()
            )
            return response.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")

    def update_message(self, message_id: str, content: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """Update a message"""
        try:
            update_data = {}
            if content:
                update_data["content"] = content
            if metadata:
                update_data["metadata"] = metadata

            response = (
                self.supabase.table("chat_messages")
                .update(update_data)
                .eq("id", message_id)
                .execute()
            )
            return response.data[0] if response.data else {}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update message: {str(e)}")

    def delete_message(self, message_id: str) -> Dict[str, Any]:
        """Delete a message"""
        try:
            response = (
                self.supabase.table("chat_messages")
                .delete()
                .eq("id", message_id)
                .execute()
            )
            return {"message": "Message deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete message: {str(e)}")

    def clear_session_messages(self, session_id: str) -> Dict[str, Any]:
        """Delete all messages in a session"""
        try:
            response = (
                self.supabase.table("chat_messages")
                .delete()
                .eq("session_id", session_id)
                .execute()
            )
            return {"message": "All messages cleared"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to clear messages: {str(e)}")


# Create singleton instance
db_service = DatabaseService()
