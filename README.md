# LLM Chatbot (Backend + Frontend)

Flask backend and React frontend for a multi-provider LLM chatbot (OpenAI, Gemini).

## Run
From `backend`:
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements/base.txt
python src/app/main.py
```
Or use uvicorn directly:
```
uvicorn src.app.main:app --reload
```
The app listens on http://localhost:5000 by default. Docs at http://localhost:5000/docs. Override host/port with `FASTAPI_HOST`, `FASTAPI_PORT`.

### Frontend
```
cd frontend
npm install
npm start
```
Set `REACT_APP_API_URL` to point at the backend (defaults to http://localhost:5000).

## Project structure
```
interface1/
├── backend/
│   ├── src/
│   │   ├── app/main.py        # Flask app + routes
│   │   ├── providers/         # LLM providers
│   │   └── core/              # (future) settings/middleware
│   ├── requirements/
│   │   ├── base.txt
│   │   └── dev.txt
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── app/App.jsx        # root layout
│   │   ├── features/chat/     # chat UI
│   │   ├── features/config/   # config form
│   │   └── lib/api.js         # frontend API config
│   └── public/
├── docs/
└── infra/
```

## API (backend)
- `POST /api/configure` — set provider/model/api_key for a session
- `POST /api/chat` — send a chat message
- `GET /api/history` — fetch history for a session
- `POST /api/clear` — clear history
- `GET /api/sessions` — list active sessions
- `GET /health` — health check

## Notes
- Sessions + API keys are stored in memory; use a database for production.
- Add auth/rate limiting before exposing publicly.
- Environment variables belong in `backend/.env` (mirror keys in `backend/.env.example`).

## License
MIT
