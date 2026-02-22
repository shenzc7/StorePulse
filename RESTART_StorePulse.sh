#!/usr/bin/env bash

# RESTART_StorePulse.sh - macOS Fix & Launcher
# ============================================

echo "🧹 Cleaning up existing processes..."
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

PROJECT_ROOT="$(pwd)"

echo "🖥️  Checking Backend (Python)..."
if [ ! -d "api_venv" ]; then
    echo "❌ api_venv not found. This script should be run in the project root."
    exit 1
fi

echo "📦 Installing/Verifying Backend dependencies..."
./api_venv/bin/pip install -r requirements.txt --quiet

echo "🖥️  Starting backend on port 9005..."
export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"
nohup ./api_venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 9005 --reload > /tmp/storepulse-backend.log 2>&1 &
BACKEND_PID=$!

echo "⏳ Waiting for backend health check..."
sleep 3
if curl -s http://localhost:9005/health > /dev/null 2>&1; then
    echo "   ✅ Backend ready on http://localhost:9005"
else
    echo "   ❌ Backend failed to start. Check /tmp/storepulse-backend.log"
fi

echo "🌐 Cleaning Frontend (Node/Vite)..."
cd src
if [ -d "node_modules" ]; then
    echo "   🗑️  Removing old node_modules..."
    rm -rf node_modules
fi

echo "📦 Installing Frontend dependencies (this may take a minute)..."
# We DO NOT run 'npm install npm run dev'. We run plain 'npm install'.
npm install --quiet

echo "🌐 Starting Vite dev server on port 5174..."
nohup npm run vite-dev > /tmp/storepulse-vite.log 2>&1 &
VITE_PID=$!

echo "⏳ Waiting for frontend..."
sleep 5
if curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "   ✅ Frontend ready on http://localhost:5174"
    echo ""
    echo "🎯 SUCCESS: Open http://localhost:5174 in your browser."
else
    echo "   ❌ Frontend failed to start. Check /tmp/storepulse-vite.log"
fi

echo ""
echo "Processes are running in background."
echo "- Backend PID: $BACKEND_PID"
echo "- Frontend PID: $VITE_PID"
echo ""
echo "To stop them, run: pkill -f uvicorn && pkill -f vite"
