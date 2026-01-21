import json
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.app.core.supabase_client import get_current_user
from src.app.services.session_store import session_store
from src.providers.llm_providers import AnthropicProvider, GeminiProvider, GroqProvider, OpenAIProvider

router = APIRouter(prefix="/api", tags=["Chat"])


class ConfigureRequest(BaseModel):
    provider: str
    api_key: str
    model: str
    session_id: str = "default"


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    history: List[Dict] | None = None


class ClearRequest(BaseModel):
    session_id: str = "default"


class ConfigureResponse(BaseModel):
    message: str
    provider: str
    model: str
    session_id: str


class ChatResponse(BaseModel):
    response: str
    session_id: str


class HistoryResponse(BaseModel):
    session_id: str
    history: List[Dict[str, str]]


class SessionInfo(BaseModel):
    session_id: str
    provider: str
    message_count: int


class SessionsResponse(BaseModel):
    sessions: List[SessionInfo]


def _require_user_id(user: object) -> str:
    if hasattr(user, "id"):
        user_id = getattr(user, "id")
    elif isinstance(user, dict):
        user_id = user.get("id") or user.get("user", {}).get("id")
    else:
        user_id = None
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to resolve user id from token")
    return user_id


def _build_provider(provider: str, api_key: str, model: str):
    provider_key = provider.lower()
    if provider_key == "openai":
        return OpenAIProvider(api_key, model)
    if provider_key == "gemini":
        return GeminiProvider(api_key, model)
    if provider_key == "anthropic":
        return AnthropicProvider(api_key, model)
    if provider_key == "groq":
        return GroqProvider(api_key, model)
    raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")


@router.post("/configure", response_model=ConfigureResponse)
def configure_llm(request_data: ConfigureRequest, user=Depends(get_current_user)):
    provider = request_data.provider
    api_key = request_data.api_key
    model = request_data.model
    session_id = request_data.session_id

    if not provider or not api_key or not model:
        raise HTTPException(status_code=400, detail="Missing required fields: provider, api_key, model")

    llm_provider = _build_provider(provider, api_key, model)
    user_id = _require_user_id(user)
    session_store.create_or_update(user_id, session_id, llm_provider)

    return ConfigureResponse(
        message="Configuration successful",
        provider=provider,
        model=model,
        session_id=session_id,
    )


@router.post("/chat", response_model=ChatResponse)
def chat(request_data: ChatRequest, user=Depends(get_current_user)):
    message = request_data.message
    session_id = request_data.session_id
    history = request_data.history or []

    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    user_id = _require_user_id(user)
    session = session_store.get(user_id, session_id)
    if not session:
        raise HTTPException(status_code=400, detail="Session not configured. Please configure first.")

    provider = session["provider"]
    chat_history = history if history else session["chat_history"]
    response = provider.chat(message, chat_history)

    session["chat_history"].append({"role": "user", "content": message})
    session["chat_history"].append({"role": "assistant", "content": response})

    return ChatResponse(response=response, session_id=session_id)


@router.post("/chat/stream")
async def chat_stream(request_data: ChatRequest, user=Depends(get_current_user)):
    async def generate():
        try:
            message = request_data.message
            session_id = request_data.session_id
            history = request_data.history or []

            if not message:
                yield {"error": "Message is required"}
                return

            user_id = _require_user_id(user)
            session = session_store.get(user_id, session_id)
            if not session:
                yield {"error": "Session not configured. Please configure first."}
                return

            provider = session["provider"]
            chat_history = history if history else session["chat_history"]
            response = provider.chat(message, chat_history)

            full_response = ""
            words = response.split(" ")
            for word_idx, word in enumerate(words):
                for char in word:
                    full_response += char
                    yield {"chunk": char}
                if word_idx < len(words) - 1:
                    full_response += " "
                    yield {"chunk": " "}

            session["chat_history"].append({"role": "user", "content": message})
            session["chat_history"].append({"role": "assistant", "content": full_response})
            yield {"done": True}

        except Exception as exc:  # pragma: no cover - keep streaming resilient
            yield {"error": str(exc)}

    async def event_stream():
        async for payload in generate():
            yield json.dumps(payload) + "\n"

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")


@router.get("/history", response_model=HistoryResponse)
def get_history(session_id: str = "default", user=Depends(get_current_user)):
    user_id = _require_user_id(user)
    session = session_store.get(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return HistoryResponse(session_id=session_id, history=session["chat_history"])


@router.post("/clear")
def clear_history(request_data: ClearRequest, user=Depends(get_current_user)):
    session_id = request_data.session_id
    user_id = _require_user_id(user)
    session = session_store.get(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session_store.clear_history(user_id, session_id)
    return {"message": "History cleared", "session_id": session_id}


@router.get("/sessions", response_model=SessionsResponse)
def list_sessions(user=Depends(get_current_user)):
    user_id = _require_user_id(user)
    session_list = [SessionInfo(**session) for session in session_store.list_sessions(user_id)]
    return SessionsResponse(sessions=session_list)
