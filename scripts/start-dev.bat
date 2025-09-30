@echo off
echo 🔍 Cleaning up processes and starting development server...

REM Kill processes on our designated ports (avoiding 3000/3001 to not interfere with other projects)
for %%p in (3002 3003 3004 3005) do (
    echo Checking port %%p...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :%%p') do (
        if not "%%i"=="" (
            echo 🔥 Killing process on port %%p (PID: %%i)
            taskkill /PID %%i /F >nul 2>&1
        )
    )
)

REM Clean build cache
if exist ".next" (
    echo 🧹 Cleaning build cache...
    rmdir /s /q ".next" >nul 2>&1
    echo ✅ Cleared .next cache
)

echo 🚀 Starting Next.js development server...
echo Press Ctrl+C to stop the server

REM Set preferred port to 3002 and start
set PORT=3002
npm run dev