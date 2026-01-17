from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ..providers.llm_providers import OpenAIProvider, GeminiProvider, AnthropicProvider, GroqProvider
import os
from typing import List, Dict

app = FastAPI(title="LLM Chatbot API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active sessions (in production, use a database)
sessions = {}

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


@app.get('/', tags=["Info"])
def home():
    """Home page with API documentation"""
    return {
        'message': 'Chatbot API is running!',
        'endpoints': {
            'POST /api/configure': 'Configure LLM provider',
            'POST /api/chat': 'Send chat message',
            'GET /api/history': 'Get chat history',
            'POST /api/clear': 'Clear chat history',
            'GET /api/sessions': 'List active sessions',
            'GET /health': 'Health check'
        },
        'docs': '/docs',
        'openapi_schema': '/openapi.json'
    }


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
    import uvicorn
    debug_mode = os.getenv('FASTAPI_DEBUG', 'true').lower() == 'true'
    host = os.getenv('FASTAPI_HOST', '0.0.0.0')
    port = int(os.getenv('FASTAPI_PORT', '5000'))
    reload = os.getenv('FASTAPI_RELOAD', 'true').lower() == 'true'
    uvicorn.run(app, host=host, port=port, reload=reload)