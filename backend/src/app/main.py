from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
<<<<<<< HEAD
=======
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from src.providers.llm_providers import OpenAIProvider, GeminiProvider, AnthropicProvider, GroqProvider
import os
from typing import List, Dict
import json
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
>>>>>>> feature/prompt-library

from app.core.config import settings
from app.routes import auth, chat, health

app = FastAPI(title="LLM Chatbot API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)
=======
# Store active sessions (in production, use a database)
sessions = {}

# Default configuration from environment
DEFAULT_PROVIDER = os.getenv('DEFAULT_PROVIDER', 'groq')
DEFAULT_MODEL = os.getenv('DEFAULT_MODEL', 'mixtral-8x7b-32768')
DEFAULT_API_KEY = os.getenv('DEFAULT_API_KEY', os.getenv('GROQ_API_KEY', ''))

# Create a default session on startup
def initialize_default_session():
    """Initialize default session with environment configuration"""
    if DEFAULT_API_KEY and DEFAULT_API_KEY != 'gsk_placeholder_for_testing':
        try:
            session_id = 'default'
            provider = DEFAULT_PROVIDER.lower()
            
            if provider == 'openai':
                llm_provider = OpenAIProvider(DEFAULT_API_KEY, DEFAULT_MODEL)
            elif provider == 'gemini':
                llm_provider = GeminiProvider(DEFAULT_API_KEY, DEFAULT_MODEL)
            elif provider == 'anthropic':
                llm_provider = AnthropicProvider(DEFAULT_API_KEY, DEFAULT_MODEL)
            elif provider == 'groq':
                llm_provider = GroqProvider(DEFAULT_API_KEY, DEFAULT_MODEL)
            else:
                return
            
            sessions[session_id] = {
                'provider': llm_provider,
                'chat_history': [],
                'config': {
                    'provider': provider,
                    'model': DEFAULT_MODEL
                }
            }
            print(f"✓ Default session initialized: {provider} / {DEFAULT_MODEL}")
        except Exception as e:
            print(f"✗ Failed to initialize default session: {str(e)}")

# Initialize on startup
@app.on_event("startup")
async def startup():
    initialize_default_session()

# Pydantic models
class ConfigureRequest(BaseModel):
    provider: str
    api_key: str
    model: str
    session_id: str = "default"

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    history: List[Dict] = None  # Optional conversation history from frontend

class ClearRequest(BaseModel):
    session_id: str = "default"

class ConfigureResponse(BaseModel):
    message: str
    provider: str
    model: str
    session_id: str

class ConfigResponse(BaseModel):
    """Response for config info"""
    has_default: bool
    default_provider: str = None
    default_model: str = None
    available_providers: List[str] = []

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

class HealthResponse(BaseModel):
    status: str
>>>>>>> feature/prompt-library


@app.get("/", tags=["Info"])
def home():
    return {
        "message": "Chatbot API is running!",
        "auth": "All endpoints require a valid Supabase Bearer token",
        "endpoints": {
            "GET /api/auth/me": "Return authenticated user",
            "POST /api/configure": "Configure LLM provider",
            "POST /api/chat": "Send chat message",
            "POST /api/chat/stream": "Stream chat message",
            "GET /api/history": "Get chat history",
            "POST /api/clear": "Clear chat history",
            "GET /api/sessions": "List active sessions",
            "GET /health": "Health check",
        },
        "docs": "/docs",
        "openapi_schema": "/openapi.json",
    }


<<<<<<< HEAD
if __name__ == "__main__":
=======
@app.get('/api/config', response_model=ConfigResponse, tags=["Configuration"])
def get_config():
    """
    Get default configuration info
    """
    has_default = 'default' in sessions and DEFAULT_API_KEY and DEFAULT_API_KEY != 'gsk_placeholder_for_testing'
    return ConfigResponse(
        has_default=has_default,
        default_provider=DEFAULT_PROVIDER if has_default else None,
        default_model=DEFAULT_MODEL if has_default else None,
        available_providers=["openai", "gemini", "anthropic", "groq"]
    )


@app.post('/api/configure', response_model=ConfigureResponse, tags=["Configuration"])
def configure_llm(request_data: ConfigureRequest):
    """
    Configure LLM provider and model
    """
    try:
        provider = request_data.provider.lower()
        api_key = request_data.api_key
        model = request_data.model
        session_id = request_data.session_id

        if not provider or not api_key or not model:
            raise HTTPException(
                status_code=400,
                detail='Missing required fields: provider, api_key, model'
            )

        # Initialize the appropriate provider
        if provider == 'openai':
            llm_provider = OpenAIProvider(api_key, model)
        elif provider == 'gemini':
            llm_provider = GeminiProvider(api_key, model)
        elif provider == 'anthropic':
            llm_provider = AnthropicProvider(api_key, model)
        elif provider == 'groq':
            llm_provider = GroqProvider(api_key, model)
        else:
            raise HTTPException(
                status_code=400,
                detail=f'Unsupported provider: {provider}'
            )

        # Store the provider instance with chat history
        sessions[session_id] = {
            'provider': llm_provider,
            'chat_history': []
        }

        return ConfigureResponse(
            message='Configuration successful',
            provider=provider,
            model=model,
            session_id=session_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/chat', response_model=ChatResponse, tags=["Chat"])
def chat(request_data: ChatRequest):
    """
    Send a message to the configured LLM
    """
    try:
        message = request_data.message
        session_id = request_data.session_id
        history = request_data.history or []

        if not message:
            raise HTTPException(status_code=400, detail='Message is required')

        if session_id not in sessions:
            raise HTTPException(
                status_code=400,
                detail='Session not configured. Please configure first.'
            )

        session = sessions[session_id]
        provider = session['provider']
        
        # Use history from frontend if provided, otherwise use stored history
        if history:
            chat_history = history
        else:
            chat_history = session['chat_history']

        # Get response from LLM
        response = provider.chat(message, chat_history)

        # Update stored chat history
        session['chat_history'].append({'role': 'user', 'content': message})
        session['chat_history'].append({'role': 'assistant', 'content': response})

        return ChatResponse(
            response=response,
            session_id=session_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/chat/stream', tags=["Chat"])
async def chat_stream(request_data: ChatRequest):
    """
    Send a message to the configured LLM with streaming response
    """
    import asyncio
    import time
    
    async def generate():
        try:
            message = request_data.message
            session_id = request_data.session_id
            history = request_data.history or []

            if not message:
                yield json.dumps({"error": "Message is required"}) + "\n"
                return

            if session_id not in sessions:
                yield json.dumps({"error": "Session not configured. Please configure first."}) + "\n"
                return

            session = sessions[session_id]
            provider = session['provider']
            
            # Use history from frontend if provided, otherwise use stored history
            if history:
                chat_history = history
            else:
                chat_history = session['chat_history']

            # Get response from LLM
            response = provider.chat(message, chat_history)

            # Stream the response with proper timing
            full_response = ""
            # Split by words and stream each character with a small delay
            words = response.split(' ')
            for word_idx, word in enumerate(words):
                for char_idx, char in enumerate(word):
                    full_response += char
                    yield json.dumps({"chunk": char}) + "\n"
                    # Add small delay between characters for visual streaming effect
                    await asyncio.sleep(0.002)
                
                # Add space after word (except last word)
                if word_idx < len(words) - 1:
                    full_response += ' '
                    yield json.dumps({"chunk": " "}) + "\n"
                    await asyncio.sleep(0.002)

            # Update stored chat history after full response is generated
            session['chat_history'].append({'role': 'user', 'content': message})
            session['chat_history'].append({'role': 'assistant', 'content': full_response})

            # Send completion signal
            yield json.dumps({"done": True}) + "\n"

        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")


@app.get('/api/history', response_model=HistoryResponse, tags=["Chat"])
def get_history(session_id: str = 'default'):
    """
    Get chat history for a session
    """
    try:
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail='Session not found')

        chat_history = sessions[session_id]['chat_history']

        return HistoryResponse(
            session_id=session_id,
            history=chat_history
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/clear', tags=["Chat"])
def clear_history(request_data: ClearRequest):
    """
    Clear chat history for a session
    """
    try:
        session_id = request_data.session_id

        if session_id not in sessions:
            raise HTTPException(status_code=404, detail='Session not found')

        sessions[session_id]['chat_history'] = []

        return {
            'message': 'History cleared',
            'session_id': session_id
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/api/sessions', response_model=SessionsResponse, tags=["Sessions"])
def list_sessions():
    """
    List all active sessions
    """
    try:
        session_list = []
        for session_id, session_data in sessions.items():
            provider_name = session_data['provider'].__class__.__name__
            session_list.append(
                SessionInfo(
                    session_id=session_id,
                    provider=provider_name,
                    message_count=len(session_data['chat_history'])
                )
            )

        return SessionsResponse(sessions=session_list)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/health', response_model=HealthResponse, tags=["Health"])
def health():
    """Health check endpoint"""
    return HealthResponse(status='healthy')


if __name__ == '__main__':
>>>>>>> feature/prompt-library
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.fastapi_host,
        port=settings.fastapi_port,
        reload=settings.fastapi_reload,
    )