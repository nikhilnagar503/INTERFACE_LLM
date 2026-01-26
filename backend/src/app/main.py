from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
from typing import List, Dict
import json
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from src.app.core.config import settings
from src.app.routes import auth, chat, health, database

app = FastAPI(title="LLM Chatbot API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(database.router)


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.app.main:app",
        host=settings.fastapi_host,
        port=settings.fastapi_port,
        reload=settings.fastapi_reload,
    )