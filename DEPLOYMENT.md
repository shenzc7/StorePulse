# StorePulse Deployment Guide

## Frontend (Vercel) ✅

The frontend is already deployed to Vercel at:
- **Production:** https://src-alpha-liart.vercel.app

## Backend Deployment Required ⚠️

The backend API needs to be deployed to a cloud service. Here are quick options:

### Option 1: Railway (Recommended - Easiest)

1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your StorePulse repository
5. Railway will auto-detect Python
6. Set these environment variables:
   - `CORS_ALLOW_ALL=true` (or set `CORS_ORIGINS` with your Vercel URL)
7. Set the root directory to `/api` (if Railway asks)
8. Railway will provide a URL like: `https://your-app.up.railway.app`
9. Copy that URL and set it in Vercel (see below)

### Option 2: Render

1. Go to https://render.com
2. Sign up/login
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Settings:
   - **Name:** storepulse-api
   - **Root Directory:** `api`
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `CORS_ALLOW_ALL=true`
7. Deploy and copy the URL

### Option 3: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch` in the `api` directory
3. Follow prompts
4. Set environment: `fly secrets set CORS_ALLOW_ALL=true`
5. Deploy: `fly deploy`

## Configure Vercel Environment Variable

Once your backend is deployed, set the API URL in Vercel:

```bash
cd src
vercel env add VITE_API_BASE_URL production
# When prompted, enter your backend URL (e.g., https://your-app.up.railway.app)
```

Or via Vercel Dashboard:
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add `VITE_API_BASE_URL` with your backend URL
4. Redeploy

## Quick Test

After setting the environment variable, redeploy:

```bash
cd src
vercel --prod
```

Your app should now connect to the backend! 🚀
