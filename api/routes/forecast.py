"""Forecast retrieval endpoints."""
from datetime import date, datetime, timedelta

from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

from ..core.forecast_service import ForecastService

router = APIRouter(prefix="/forecast", tags=["forecast"])

# Global forecast service instance
forecast_service = ForecastService()


@router.get("/")
async def forecast(
    days: int = Query(7, ge=1, le=30, description="Forecast horizon in days"),
    mode: str = Query("auto", pattern="^(lite|pro|auto)$", description="Forecast mode ('lite', 'pro', or 'auto')"),
) -> dict[str, Any]:
    """Return NB-INGARCH forecasts with staffing and inventory recommendations.

    Args:
        days: Number of days to forecast (1-30).
        mode: 'lite' (univariate) or 'pro' (multivariate with exogenous factors).

    Returns:
        JSON response containing:
        - forecasts: List of daily predictions (p10, p50, p90)
        - recommendations: Actionable insights for staffing/inventory
        - metrics: Model performance metrics (SMAPE, etc.)
    """
    try:
        # Auto-detect mode if not specified or explicit 'auto'
        # Also handles fallback: if user requests 'lite' but only 'pro' exists (or vice versa), we could consider switching,
        # but for now let's implement true 'auto' logic.
        
        final_mode = mode
        if mode == "auto":
            # Check for Pro models first
            from ..core.db import ModelRepository
            if ModelRepository.get_active_models("pro"):
                final_mode = "pro"
            else:
                final_mode = "lite"
        
        result = forecast_service.forecast(horizon_days=days, mode=final_mode)
        
        # Inject the mode used into the response so frontend knows
        result["mode_used"] = final_mode
        return result

    except Exception as e:
        error_msg = str(e)
        # Check for missing model file (common first-run scenario)
        if "No such file or directory" in error_msg and "model.joblib" in error_msg:
            return {
                "status": "no_models",
                "message": "No prediction models available. Please train a model first using the 'Setup Forecasting' page.",
                "predictions": [],
                "recommendations": {
                    "staffing": "Train a forecasting model to get staffing recommendations",
                    "inventory": "Train a forecasting model to get inventory alerts",
                    "next_steps": ["Upload historical data", "Train forecasting model", "Generate predictions"]
                },
                "generated_at": datetime.now().isoformat(),
                "horizon_days": days,
                "mode_requested": mode
            }
        
        # Check specifically for "No trained X model available" which comes from forecast_service
        if "No trained" in error_msg and "available" in error_msg:
             return {
                "status": "no_models",
                "message": str(e),
                "predictions": [],
                "recommendations": {
                    "staffing": "Train a forecasting model to get staffing recommendations",
                    "inventory": "Train a forecasting model to get inventory alerts",
                },
                "generated_at": datetime.now().isoformat(),
                "horizon_days": days,
                 "mode_requested": mode
            }

        # Log unexpected errors
        print(f"❌ Forecast error: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"Forecast generation failed: {error_msg}. Ensure models are trained and historical data is available."
        )
