#!/usr/bin/env bash

# StorePulse - DEV Launcher (with hot reload)
# ============================================
# Run: ./dev.sh

echo "🚀 StorePulse Dev Launcher"
echo "=========================="

# Clean up
pkill -f "storepulse-backend" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true  
pkill -f "tauri" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true
sleep 1

cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"

# Start backend
echo "🖥️  Starting backend on port 9000..."
if [ ! -d "api_venv" ]; then
    echo "❌ Run: ./scripts/bootstrap_env.sh first"
    exit 1
fi

source api_venv/bin/activate
export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"
nohup uvicorn api.main:app --host 127.0.0.1 --port 9000 --reload > /tmp/storepulse-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend
sleep 3
if curl -s http://localhost:9000/health > /dev/null 2>&1; then
    echo "   ✅ Backend ready on http://localhost:9000"
else
    echo "❌ Backend failed"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start Vite
echo "🌐 Starting Vite dev server on port 5173..."
cd src
nohup npm run vite-dev > /tmp/storepulse-vite.log 2>&1 &
VITE_PID=$!

# Wait for Vite
sleep 5
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Vite ready on http://localhost:5173"
else
    echo "❌ Vite failed"
    kill $BACKEND_PID $VITE_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎯 Starting Tauri app..."
echo "   (First compile takes ~2 minutes)"
echo "   Both backend & frontend will auto-reload on changes"
echo ""

# Trap cleanup
trap 'kill $BACKEND_PID $VITE_PID 2>/dev/null; exit 0' INT TERM

# Run Tauri in foreground
npm run tauri-dev

# Cleanup
kill $BACKEND_PID $VITE_PID 2>/dev/null || true

