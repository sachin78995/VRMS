#!/bin/bash
echo "Starting VRMS Frontend Deployment to Vercel..."
echo

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "Error: Not in frontend directory. Please run this script from the frontend folder."
    exit 1
fi

echo "Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo
echo "Step 2: Building the project..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error: Build failed"
    exit 1
fi

echo
echo "Step 3: Deploying to Vercel..."
vercel --prod
if [ $? -ne 0 ]; then
    echo "Error: Deployment failed"
    echo "Make sure you have Vercel CLI installed: npm i -g vercel"
    exit 1
fi

echo
echo "✅ Deployment completed successfully!"
echo
echo "Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Add environment variable: VITE_API_URL = https://your-backend-url.com"
echo "3. Redeploy if needed"
echo