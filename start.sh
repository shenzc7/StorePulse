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
nohup uvicorn api.main:app --host 127.0.0.1 --port 9000 > /tmp/storepulse-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend
echo "⏳ Waiting for backend..."
for i in {1..10}; do
    if curl -s http://localhost:9000/health > /dev/null 2>&1; then
        echo "   ✅ Backend ready!"
        break
    fi
    sleep 1
done

# Start Vite
echo "🌐 Starting Vite dev server..."
cd src
nohup npm run vite-dev > /tmp/storepulse-vite.log 2>&1 &
VITE_PID=$!
echo "   Vite PID: $VITE_PID"

# Wait for Vite
echo "⏳ Waiting for Vite..."
for i in {1..15}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "   ✅ Vite ready!"
        break
    fi
    sleep 1
done

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

