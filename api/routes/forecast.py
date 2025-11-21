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
    mode: str = Query("lite", regex="^(lite|pro)$", description="Forecast mode ('lite' or 'pro')"),
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
        result = forecast_service.forecast(horizon_days=days, mode=mode)

        return result

    except Exception as e:
        error_msg = str(e)
        # Check for missing model file (common first-run scenario)
        if "No such file or directory" in error_msg and "ingarch_model.joblib" in error_msg:
            return {
                "status": "no_models",
                "message": "No prediction models available. Please train a model first using the 'Setup Forecasting' page.",
                "forecasts": [],
                "recommendations": {
                    "staffing": "Train a forecasting model to get staffing recommendations",
                    "inventory": "Train a forecasting model to get inventory alerts",
                    "next_steps": ["Upload historical data", "Train forecasting model", "Generate predictions"]
                },
                "generated_at": datetime.now().isoformat(),
                "horizon_days": days
            }
        
        # Log unexpected errors
        print(f"❌ Forecast error: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"Forecast generation failed: {error_msg}. Ensure models are trained and historical data is available."
        )
