# How to Start the Backend (CORRECTLY)

## The Issue
The backend needs to be started from the `storepulse` directory (not `storepulse/api`) so Python can find all the modules correctly.

## How to Start It

**Open a NEW terminal and run:**

```bash
cd /Users/shenzc/Desktop/projects/StorePulse
source venv/bin/activate
cd storepulse
python -m uvicorn api.main:app --reload --port 8000
```

**Leave this terminal open!** You'll see the backend logs here, which helps with debugging.

## Verify It's Working

In another terminal:
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok"}

curl http://localhost:8000/api/metrics/
# Should return JSON with model status
```

## If You See Errors

The terminal will show you the exact Python error. Common issues:

1. **Import errors** → Make sure you're in the `storepulse` directory (not `storepulse/api`)
2. **Port in use** → Run `pkill -f uvicorn` first
3. **Module not found** → Make sure venv is activated

## After Backend is Running

1. Start frontend in separate terminal:
   ```bash
   cd /Users/shenzc/Desktop/projects/StorePulse/storepulse/app
   npm run dev
   ```

2. Open browser: `http://localhost:5173`

3. All API calls from frontend will be proxied to backend on port 8000

## Current Status

✅ Fixed all import issues  
✅ Added `/api` prefix to all routes  
✅ Fixed CORS for development  
✅ Fixed database imports  

**Start the backend using the command above and the 500 errors should be gone!**
