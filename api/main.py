"""
FastAPI entrypoint for StorePulse local API.

FILE OVERVIEW:
- File Type: Python module (main.py)
- Programming Language: Python 3.8+
- Purpose: Entry point for the FastAPI backend server
- Dependencies: FastAPI, CORSMiddleware for cross-origin requests
- Routes: Orchestrates all API endpoints for the StorePulse desktop application

TECHNICAL DETAILS:
- Creates FastAPI application instance with metadata (title, description, version)
- Configures CORS middleware to allow frontend communication from Tauri/React app
- Registers all route modules that expose the /api/* endpoints
- Provides /health endpoint for application monitoring and desktop shell pings

METHODS USED:
- FastAPI application creation and configuration
- CORS middleware setup for cross-origin resource sharing
- Route registration and module inclusion
- Health check endpoint implementation

BUSINESS LOGIC:
This file serves as the central orchestrator for the entire StorePulse backend API.
It establishes the server foundation and enables communication between the desktop
frontend (Tauri + React) and the various backend services (ML models, database,
file handling, etc.).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import all route modules that define the API endpoints
# Each module contains FastAPI routers with specific functionality:
# - backtest: Historical model performance evaluation
# - data: Data upload, validation, and management
# - export: PDF report generation and download
# - files: File upload and management utilities
# - forecast: Forecast generation and retrieval
# - metrics: Real-time metrics and monitoring
# - settings: Application configuration and preferences
# - train: Model training orchestration
# - whatif: Scenario analysis and comparison
from .routes import backtest, data, export, files, forecast, metrics, reports, settings, train, whatif

# Create FastAPI application instance
# This is the main web server that handles HTTP requests from the frontend
app = FastAPI(
    title="StorePulse API",                              # API name displayed in docs
    description="Local-only orchestration for StorePulse desktop app",  # API purpose
    version="1.0.0",                                   # Current version
)

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the React frontend (running on different ports/origins) to communicate
# with the FastAPI backend. The frontend runs on:
# - http://localhost:5173 during development (Vite dev server)
# - tauri://localhost in production (Tauri packaged app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite development server port
        "http://localhost:5174",  # Backup development port
        "tauri://localhost",       # Tauri production environment
        "http://tauri.localhost",  # Alternative Tauri origin
    ],
    allow_credentials=True,       # Allow cookies and authentication headers
    allow_methods=["*"],         # Permit all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],         # Allow all request headers
)

# Register all API route modules
# Each router handles a specific domain of functionality:
# - files: File upload and management operations
# - data: Data upload, validation, and CRUD operations
# - train: Model training orchestration and progress tracking
# - forecast: Forecast generation and retrieval endpoints
# - whatif: Scenario analysis and comparison functionality
# - backtest: Historical model performance evaluation
# - export: PDF report generation and download
# - metrics: Real-time system metrics and monitoring
# - settings: Application configuration and preferences
# All routes are prefixed with "/api" to organize the API namespace
app.include_router(files.router, prefix="/api")
app.include_router(data.router, prefix="/api")
app.include_router(train.router, prefix="/api")
app.include_router(forecast.router, prefix="/api")
app.include_router(whatif.router, prefix="/api")
app.include_router(backtest.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """
    Health check endpoint for application monitoring.

    PURPOSE:
    - Provides a simple ping endpoint for the desktop shell to verify API availability
    - Used by the Tauri frontend to check if the backend server is running
    - Essential for application startup verification and error handling

    RETURNS:
    - Dictionary with "status": "ok" indicating the API server is operational
    - HTTP 200 status code for successful health checks

    BUSINESS LOGIC:
    This endpoint enables the desktop application to verify backend connectivity
    before attempting any API operations. If this fails, the frontend can display
    appropriate error messages to the user about backend connectivity issues.
    """
    from .core.db import db_manager
    
    try:
        # Verify database connection
        with db_manager.get_connection() as db:
            db.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
