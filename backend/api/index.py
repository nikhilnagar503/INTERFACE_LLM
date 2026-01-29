"""
Vercel Serverless Function Entry Point
This file wraps your FastAPI app for Vercel's serverless environment
"""
import sys
import os

# Add backend directory to Python path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import your FastAPI app
from src.app.main import app

# Vercel needs this variable name
handler = app
