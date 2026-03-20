@echo off
chcp 65001 >nul 2>&1
echo ==========================================
echo    PhantomRotate v0.5.0
echo    Proxy Pool Manager
echo ==========================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo Building backend...
go build -o phantomrotate.exe ./cmd/server

echo.
echo Starting backend server...
start /b cmd /c "phantomrotate.exe"

timeout /t 2 >nul

echo Starting frontend dev server...
cd web
call npm install
call npm run dev

pause
