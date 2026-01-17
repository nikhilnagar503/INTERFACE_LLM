# Backend Setup Guide

## Step-by-Step Instructions to Run the Backend

### Method 1: Using the System Python (Recommended for now)

Since the packages are already installed in your system Python, this is the quickest way:

1. **Open a PowerShell terminal**

2. **Navigate to the backend src directory:**
   ```powershell
   cd C:\Users\nagar\Desktop\interface1\backend\src
   ```

3. **Start the server:**
   ```powershell
   uvicorn app.main:app --reload --host localhost --port 5000
   ```

4. **You should see:**
   ```
   INFO:     Uvicorn running on http://localhost:5000 (Press CTRL+C to quit)
   INFO:     Started reloader process
   INFO:     Started server process
   INFO:     Application startup complete.
   ```

5. **Access the backend:**
   - API: http://localhost:5000
   - API Documentation: http://localhost:5000/docs
   - **DO NOT** use `http://0.0.0.0:5000` - it won't work in a browser!

### Method 2: Using Virtual Environment (Proper way for production)

1. **Open PowerShell and navigate to backend folder:**
   ```powershell
   cd C:\Users\nagar\Desktop\interface1\backend
   ```

2. **Create a new virtual environment:**
   ```powershell
   python -m venv .venv
   ```

3. **Activate the virtual environment:**
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```
   
   If you get an error about execution policy, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **Install dependencies:**
   ```powershell
   pip install -r requirements/base.txt
   ```

5. **Navigate to src and start the server:**
   ```powershell
   cd src
   uvicorn app.main:app --reload --host localhost --port 5000
   ```

### Common Issues and Solutions

#### Issue 1: "This site can't be reached - ERR_ADDRESS_INVALID"
**Problem:** You're trying to access `http://0.0.0.0:5000`
**Solution:** Use `http://localhost:5000` instead

#### Issue 2: "No module named uvicorn"
**Problem:** uvicorn is not installed
**Solution:** Run `pip install uvicorn[standard]`

#### Issue 3: Port 5000 already in use
**Problem:** Another application is using port 5000
**Solution:** Use a different port:
```powershell
uvicorn app.main:app --reload --host localhost --port 8000
```
(Don't forget to update REACT_APP_API_URL in frontend)

#### Issue 4: CORS errors in frontend
**Problem:** Frontend can't connect to backend
**Solution:** Make sure backend is running on localhost:5000 and frontend is configured correctly

### Checking if Backend is Running

1. **Open browser and go to:** http://localhost:5000
2. **You should see:** A JSON response with API information
3. **Check API docs:** http://localhost:5000/docs

### Stopping the Server

Press `CTRL+C` in the terminal where the server is running

## Frontend Configuration

Make sure your frontend is configured to use the correct backend URL:

- File: `frontend/src/lib/api.js`
- Default: `http://localhost:5000`
- Can be overridden with environment variable: `REACT_APP_API_URL`

## Quick Start (All in One)

```powershell
# Terminal 1 - Backend
cd C:\Users\nagar\Desktop\interface1\backend\src
uvicorn app.main:app --reload --host localhost --port 5000

# Terminal 2 - Frontend
cd C:\Users\nagar\Desktop\interface1\frontend
npm start
```

Then open: http://localhost:3000
