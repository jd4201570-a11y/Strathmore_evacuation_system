@echo off
REM Quick start script for Indoor Navigation System (Windows)

echo.
echo ======================================
echo 🚀 Starting Indoor Navigation System
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ⏳ Step 1: Installing backend dependencies...
cd backend
if not exist "node_modules" (
    call npm install
) else (
    echo ✓ Backend dependencies already installed
)

echo.
echo ⏳ Step 2: Installing frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    call npm install
) else (
    echo ✓ Frontend dependencies already installed
)

echo.
echo ⏳ Step 3: Checking configuration files...
cd ..

if not exist "backend\.env" (
    echo.
    echo ⚠️  WARNING: backend\.env not found!
    echo    Create it from the template:
    echo    - Copy backend\.env.local.example to backend\.env
    echo    - OR run: copy backend\.env.local.example backend\.env
)

if not exist "frontend\.env.local" (
    echo.
    echo ⚠️  WARNING: frontend\.env.local not found!
    echo    Create it from the template:
    echo    - Copy frontend\.env.local.example to frontend\.env.local
    echo    - OR run: copy frontend\.env.local.example frontend\.env.local
)

echo.
echo ======================================
echo ✅ Setup complete!
echo ======================================
echo.
echo 📋 NEXT STEPS:
echo.
echo 1. Create backend\.env file
echo    (copy from backend\.env.local.example)
echo.
echo 2. Create frontend\.env.local file
echo    (copy from frontend\.env.local.example)
echo.
echo 3. RUN IN TWO SEPARATE COMMAND PROMPTS:
echo.
echo    CMD 1 - Backend:
echo    cd backend
echo    npm run dev
echo.
echo    CMD 2 - Frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open browser: http://localhost:5173
echo.
echo 📚 For detailed setup, see: SETUP_GUIDE.md
echo.
pause
