@echo off
echo Starting VRMS Frontend Deployment to Vercel...
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo Error: Not in frontend directory. Please run this script from the frontend folder.
    pause
    exit /b 1
)

echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Building the project...
call npm run build
if errorlevel 1 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo Step 3: Deploying to Vercel...
call vercel --prod
if errorlevel 1 (
    echo Error: Deployment failed
    echo Make sure you have Vercel CLI installed: npm i -g vercel
    pause
    exit /b 1
)

echo.
echo ✅ Deployment completed successfully!
echo.
echo Next steps:
echo 1. Go to your Vercel dashboard
echo 2. Add environment variable: VITE_API_URL = https://your-backend-url.com
echo 3. Redeploy if needed
echo.
pause