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
echo "🖥️  Starting backend on port 9005..."
if [ ! -d "api_venv" ]; then
    echo "❌ Run: ./scripts/bootstrap_env.sh first"
    exit 1
fi

source api_venv/bin/activate
export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"
nohup uvicorn api.main:app --host 0.0.0.0 --port 9005 --reload > /tmp/storepulse-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend
sleep 3
if curl -s http://localhost:9005/health > /dev/null 2>&1; then
    echo "   ✅ Backend ready on http://localhost:9005"
else
    echo "❌ Backend failed"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start Vite
echo "🌐 Starting Vite dev server on port 5174..."
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

# Wait for Vite with more attempts and better checking
echo "⏳ Waiting for Vite to start..."
VITE_READY=false
for i in {1..30}; do
    sleep 1
    if curl -s http://localhost:5174 > /dev/null 2>&1; then
        echo "   ✅ Vite ready on http://localhost:5174"
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

