#!/usr/bin/env bash

# StorePulse - Super Simple Launcher
# ===================================
# Just run: ./launch.sh

echo "🚀 StorePulse Launcher"
echo "====================="

# Clean up
echo "🧹 Cleaning up old processes..."
pkill -f "storepulse-backend" 2>/dev/null || true
pkill -f "uvicorn api.main" 2>/dev/null || true  
pkill -f "tauri" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

cd "$(dirname "$0")"

# Start backend only
echo "🖥️  Starting backend..."
if [ ! -d "api_venv" ]; then
    echo "❌ Run: ./scripts/bootstrap_env.sh first"
    exit 1
fi

source api_venv/bin/activate
uvicorn api.main:app --host 127.0.0.1 --port 9005 &
BACKEND_PID=$!

# Wait for backend
sleep 3
if curl -s http://localhost:9005/health > /dev/null 2>&1; then
    echo "   ✅ Backend ready!"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Open the app
if [ -d "dist/StorePulse.app" ]; then
    echo "📱 Opening StorePulse app..."
    open dist/StorePulse.app
    echo ""
    echo "🎉 StorePulse is running!"
    echo "   Press Ctrl+C to stop backend"
    trap 'kill $BACKEND_PID 2>/dev/null; exit 0' INT TERM
    wait $BACKEND_PID
else
    echo "❌ dist/StorePulse.app not found"
    echo "   Run: ./scripts/build_mac.sh"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

