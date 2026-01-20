from typing import Dict, List, Optional


class SessionStore:
    """In-memory session storage. Replace with database in production."""

    def __init__(self) -> None:
        self.sessions: Dict[str, Dict] = {}

    def _key(self, user_id: str, session_id: str) -> str:
        return f"{user_id}:{session_id}"

    def create_or_update(self, user_id: str, session_id: str, provider: object) -> None:
        self.sessions[self._key(user_id, session_id)] = {
            "provider": provider,
            "chat_history": [],
        }

    def get(self, user_id: str, session_id: str) -> Optional[Dict]:
        return self.sessions.get(self._key(user_id, session_id))

    def clear_history(self, user_id: str, session_id: str) -> None:
        key = self._key(user_id, session_id)
        if key in self.sessions:
            self.sessions[key]["chat_history"] = []

    def list_sessions(self, user_id: str) -> List[Dict]:
        prefix = f"{user_id}:"
        result: List[Dict] = []
        for key, value in self.sessions.items():
            if key.startswith(prefix):
                session_id = key.split(":", 1)[1]
                result.append(
                    {
                        "session_id": session_id,
                        "provider": value["provider"].__class__.__name__,
                        "message_count": len(value.get("chat_history", [])),
                    }
                )
        return result


session_store = SessionStore()
