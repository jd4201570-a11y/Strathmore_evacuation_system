#!/bin/bash
# Quick start script for Indoor Navigation System

echo "🚀 Starting Indoor Navigation System..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✓ Backend dependencies already installed"
fi

echo ""
echo -e "${YELLOW}Step 2: Installing frontend dependencies...${NC}"
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✓ Frontend dependencies already installed"
fi

echo ""
echo -e "${YELLOW}Step 3: Checking configuration files...${NC}"
if [ ! -f "../backend/.env" ]; then
    echo -e "${RED}⚠️  backend/.env not found!${NC}"
    echo "   Create backend/.env using backend/.env.local.example as template"
    echo "   Example: cp backend/.env.local.example backend/.env"
fi

if [ ! -f ".env.local" ]; then
    echo -e "${RED}⚠️  frontend/.env.local not found!${NC}"
    echo "   Create frontend/.env.local using frontend/.env.local.example as template"
    echo "   Example: cp frontend/.env.local.example frontend/.env.local"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Create backend/.env file (copy from backend/.env.local.example)"
echo "2. Create frontend/.env.local file (copy from frontend/.env.local.example)"
echo "3. Run in TWO separate terminals:"
echo ""
echo "   Terminal 1 - Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "   Terminal 2 - Frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Open browser: http://localhost:5173"
echo ""
echo -e "${YELLOW}For detailed setup, see: SETUP_GUIDE.md${NC}"
