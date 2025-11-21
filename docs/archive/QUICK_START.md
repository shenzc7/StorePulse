# StorePulse Quick Start Guide

## Fixed Connection Issues ✅

The connection errors in Dashboard and Forecasts pages have been fixed!

### What Was Fixed:
1. **Added Vite Proxy**: Configured to forward `/api/*` requests to `http://localhost:8000`
2. **Created API Utility**: Centralized API calls with better error handling
3. **Updated Pages**: Dashboard and Forecasts now use the new API utility

## How to Run StorePulse

You need to run **both** the backend API server and the frontend dev server:

### Step 1: Start the Backend API (Terminal 1)

```bash
cd /Users/shenzc/Desktop/projects/StorePulse/storepulse

# Activate virtual environment
source ../venv/bin/activate

# Navigate to API directory
cd api

# Start the FastAPI server on port 8000
uvicorn main:app --reload --port 8000
```

The backend should start on: `http://localhost:8000`

### Step 2: Start the Frontend (Terminal 2)

```bash
cd /Users/shenzc/Desktop/projects/StorePulse/storepulse/app

# Install dependencies (first time only)
npm install

# Start Vite dev server
npm run dev
```

The frontend will start on: `http://localhost:5173`

### Step 3: Open the App

Open your browser to: **http://localhost:5173**

## Verify Everything Works

1. **Dashboard** should load model metrics (or show "Not Trained" if no models)
2. **Forecasts** should load forecast data (or show empty state)
3. Check browser console for any errors

## Troubleshooting

### "Connection error" in Dashboard/Forecasts

**Problem**: Backend isn't running or running on wrong port

**Solutions**:
- Make sure backend is running on port 8000
- Check terminal 1 for backend errors
- Try: `curl http://localhost:8000/health` (should return `{"status":"ok"}`)

### Port 8000 already in use

**Problem**: Another app is using port 8000

**Solution**: Use a different port:
```bash
# In Terminal 1, change to port 8001
uvicorn main:app --reload --port 8001

# Then update vite.config.ts:
# Change 'http://localhost:8000' to 'http://localhost:8001'
```

### Frontend won't start

**Problem**: Dependencies not installed or port 5173 in use

**Solutions**:
```bash
cd app
npm install  # Install dependencies
npm run dev  # Start dev server
```

## Using the Automated Script

Alternatively, use the provided dev script (runs both servers):

```bash
cd /Users/shenzc/Desktop/projects/StorePulse/storepulse
./scripts/dev_run.sh
```

## What's Different Now

### Before (Broken):
- Frontend made requests to `/api/metrics/`
- No proxy configured → 404 errors
- Connection errors everywhere

### After (Fixed):
- Vite proxy forwards `/api/*` → `http://localhost:8000/api/*`
- API utility handles errors gracefully
- Clear error messages guide users

## Testing the API Directly

Test if backend is working:

```bash
# Health check
curl http://localhost:8000/health

# Get metrics
curl http://localhost:8000/api/metrics/

# Get forecasts
curl http://localhost:8000/api/forecast/
```

## Next Steps

Once both servers are running:

1. Go to **Data** page → Upload some sample data
2. Go to **Train** page → Train a model
3. Go to **Dashboard** → See your model metrics
4. Go to **Forecasts** → View predictions

Enjoy your premium StorePulse UI! 🎉
