@echo off 
start cmd /k "cd C:\digital-mec\backend && C:\digital-mec\venv\Scripts\activate && uvicorn app.main:app --reload --port 8000 --host 0.0.0.0" 
start cmd /k "cd C:\digital-mec\frontend && npm run dev" 
start http://localhost:5173 
