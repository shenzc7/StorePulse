from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="StorePulse API", description="Simple StorePulse API for Vercel")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "message": "StorePulse API is running"}

@app.get("/api/health")
async def api_health():
    return {"status": "ok", "message": "StorePulse API is running"}