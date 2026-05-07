@echo off
title AfyaMEC — Update
echo.
echo  Updating AfyaMEC...
echo.

echo  [1/3] Pulling latest changes from Git...
cd C:\digital-mec
git pull origin main 2>nul || echo  (No git remote configured — skipping)

echo  [2/3] Updating Python packages...
cd C:\digital-mec\backend
C:\digital-mec\venv\Scripts\activate
pip install -r requirements.txt --quiet

echo  [3/3] Updating Node packages...
cd C:\digital-mec\frontend
npm install --silent

echo.
echo  ✅ Update complete! Restart the platform to apply changes.
pause