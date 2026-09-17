@echo off
title MCPShield Server Launcher
echo ===================================================
echo           Starting MCPShield Platform
echo ===================================================
echo [1/2] Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH.
    pause
    exit /b 1
)

echo [2/2] Launching MCPShield Full Stack (API + Web Console)...
echo Local URL:   http://127.0.0.1:8000
echo Docs URL:    http://127.0.0.1:8000/docs
echo.
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
pause
