#!/usr/bin/env bash
set -e

# StorePulse - Simple One-Command Launcher
# =========================================
# Just run: ./start.sh

echo "🚀 StorePulse Launcher"
echo "====================="
echo ""

# Kill any existing instances
echo "🧹 Cleaning up old processes..."
pkill -f "storepulse-backend" 2>/dev/null || true
pkill -f "uvicorn api.main" 2>/dev/null || true
pkill -f "tauri dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Navigate to project root
cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"

# Check virtual environment
if [ ! -d "api_venv" ]; then
    echo "❌ ERROR: Virtual environment not found"
    echo "   Run: ./scripts/bootstrap_env.sh"
    exit 1
fi

# Start backend
echo "🖥️  Starting backend API..."
source api_venv/bin/activate
export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"
nohup uvicorn api.main:app --host 0.0.0.0 --port 9005 > /tmp/storepulse-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend
echo "⏳ Waiting for backend..."
for i in {1..10}; do
    if curl -s http://localhost:9005/health > /dev/null 2>&1; then
        echo "   ✅ Backend ready!"
        break
    fi
    sleep 1
done

# Start Vite
echo "🌐 Starting Vite dev server..."
cd src

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   ⚠️  node_modules not found, installing dependencies..."
    npm install
fi

# Start Vite in background with explicit host binding
# Export PATH to ensure node/npm are found by nohup
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
nohup npm run vite-dev > /tmp/storepulse-vite.log 2>&1 &
VITE_PID=$!
echo "   Vite PID: $VITE_PID"

# Wait for Vite with better checking
echo "⏳ Waiting for Vite..."
VITE_READY=false
for i in {1..30}; do
    sleep 1
    if curl -s http://localhost:5174 > /dev/null 2>&1; then
        echo "   ✅ Vite ready!"
        VITE_READY=true
        break
    fi
    # Check if process is still running
    if ! kill -0 $VITE_PID 2>/dev/null; then
        echo "   ❌ Vite process died. Check logs:"
        tail -20 /tmp/storepulse-vite.log
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    # Show progress every 5 seconds
    if [ $((i % 5)) -eq 0 ]; then
        echo "   ⏳ Still waiting... ($i seconds)"
    fi
done

if [ "$VITE_READY" = false ]; then
    echo "❌ Vite failed to start after 30 seconds"
    echo "   Check logs: tail -50 /tmp/storepulse-vite.log"
    echo "   Last 20 lines:"
    tail -20 /tmp/storepulse-vite.log
    kill $BACKEND_PID $VITE_PID 2>/dev/null
    exit 1
fi

# Start Tauri
echo "🎯 Starting Tauri app..."
echo "   (First run may take 1-2 minutes to compile Rust code)"
echo ""

# Trap to cleanup on exit
trap 'echo ""; echo "🛑 Shutting down..."; kill $BACKEND_PID $VITE_PID 2>/dev/null; exit 0' INT TERM

# Run Tauri (this will block)
npm run tauri-dev

# Cleanup if Tauri exits
kill $BACKEND_PID $VITE_PID 2>/dev/null || true

