# Backend

FastAPI service for the LLM chatbot.

## Setup
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements/base.txt
```

## Run
From `backend`:
```
python src/app/main.py
```
Or use uvicorn directly:
```
uvicorn src.app.main:app --reload
```
The app listens on http://localhost:5000 by default. Override with `FASTAPI_HOST`, `FASTAPI_PORT`, `FASTAPI_RELOAD`.

**Interactive API docs:** http://localhost:5000/docs

## Notes
- Providers live in `src/providers`.
- Add configs/middleware to `src/core` as the app grows.
- Sessions are stored in memory; replace with Redis/DB for production.
- FastAPI auto-generates OpenAPI docs with Swagger UI at `/docs`.
