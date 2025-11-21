#!/usr/bin/env bash
set -euo pipefail

if [ -d .venv ]; then
  source .venv/bin/activate
fi

# Start Vite dev server first
pushd src > /dev/null
npm run vite-dev &
VITE_PID=$!
popd > /dev/null

# Wait a moment for Vite to start
sleep 3

# Start Python API server
uvicorn api.main:app --reload --port 9000 &
UVICORN_PID=$!

# Start Tauri (which will connect to Vite dev server)
pushd src > /dev/null
npm run tauri-dev
popd > /dev/null

# Cleanup
kill $UVICORN_PID 2>/dev/null || true
kill $VITE_PID 2>/dev/null || true
