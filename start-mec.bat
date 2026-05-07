@echo off
title AfyaMEC — Kenya Family Planning Platform
color 0A
echo.
echo  ==========================================
echo   🌿 AfyaMEC — Starting Platform...
echo  ==========================================
echo.
echo  [1/3] Starting Backend (FastAPI + PostgreSQL)...
start "AfyaMEC Backend" cmd /k "cd C:\digital-mec\backend && C:\digital-mec\venv\Scripts\activate && uvicorn app.main:app --port 8000 --host 0.0.0.0 --no-access-log"
echo  Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo  [2/3] Starting Frontend (React + Vite)...
start "AfyaMEC Frontend" cmd /k "cd C:\digital-mec\frontend && npm run dev"
echo  Waiting for frontend to start...
timeout /t 5 /nobreak > nul

echo  [3/3] Opening browser...
start http://localhost:5173

echo.
echo  ==========================================
echo   ✅ AfyaMEC is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo  ==========================================
echo.
echo  Keep this window open while using AfyaMEC.
echo  Close both CMD windows to stop the platform.
pause