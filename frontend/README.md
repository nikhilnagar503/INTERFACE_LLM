# LLM Chatbot Frontend

React-based frontend for the LLM Chatbot application.

## Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Make sure the backend is running

The backend Flask server must be running on `http://localhost:5000` (or set `REACT_APP_API_URL`).

```bash
cd ../backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements/base.txt
cd src
python -m app.main
```

## Features

- 🎨 Beautiful, modern UI with gradient theme
- 🔧 Easy LLM configuration (OpenAI & Gemini)
- 💬 Real-time chat interface
- 📝 Chat history management
- 🎯 Session-based conversations
- 📱 Responsive design

## Usage

1. **Configure**: Enter your API key, select provider and model
2. **Chat**: Start chatting with your configured LLM
3. **Manage**: Clear history or reconfigure anytime
