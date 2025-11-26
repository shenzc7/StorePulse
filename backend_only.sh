#!/usr/bin/env bash

# StorePulse - Backend Only Launcher
# ==================================
# Run: ./backend_only.sh
# Then in another terminal: cd src && npm run tauri-dev

echo "🚀 StorePulse Backend Only"
echo "========================="

# Clean up
pkill -f "storepulse-backend" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true  
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
uvicorn api.main:app --host 127.0.0.1 --port 9000 --reload

# When you Ctrl+C, it will stop the backend
echo "Backend stopped"
