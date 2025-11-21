"""Scenario analysis endpoints for What-If Lab.

The What-If Lab allows users to test different business scenarios and see
how they impact visit forecasts, staffing needs, and inventory requirements.
Scenarios can be saved for later reference and comparison.
"""
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..core.db import WhatIfScenarioRepository
from ..core.forecast_service import ForecastService
from ..core.inventory import InventoryRepository

router = APIRouter(prefix="/whatif", tags=["whatif"])

# Global forecast service for scenario analysis
forecast_service = ForecastService()


class ScenarioConfig(BaseModel):
    """Configuration for a What-If scenario."""
    name: str = Field(..., description="Scenario name for reference")
    description: str = Field("", description="Optional scenario description")

    # Scenario toggles (can be combined)
    promo_boost: float = Field(0.0, ge=0.0, le=1.0, description="Promotional boost multiplier (0-1)")
    weather_impact: str = Field("normal", description="Weather impact: 'rainy', 'sunny', or 'normal'")
    holiday_effect: bool = Field(False, description="Apply holiday/weekend effect")
    payday_shift: bool = Field(False, description="Apply payday timing shift")
    price_sensitivity: float = Field(0.0, ge=-0.5, le=0.5, description="Price sensitivity adjustment")
    competitor_action: str = Field("none", description="Competitor action: 'none', 'promo', or 'new_store'")


class WhatIfRequest(BaseModel):
    """Request for What-If scenario analysis."""
    baseline_date: date = Field(..., description="Baseline forecast date")
    horizon_days: int = Field(14, ge=1, le=30, description="Forecast horizon")
    mode: str = Field("lite", description="Forecast mode: 'lite' or 'pro'")
    scenarios: List[ScenarioConfig] = Field(..., description="List of scenarios to compare")


class ScenarioResult(BaseModel):
    """Result of a single scenario analysis."""
    scenario_name: str
    forecast_delta: List[Dict[str, Any]]  # Daily deltas from baseline (date strings, numeric values)
    impact_summary: Dict[str, Any]  # Overall impact metrics (includes string values like scenario_strength)
    staffing_impact: Dict[str, int]  # Staffing changes by role
    inventory_impact: List[Dict[str, Any]]  # Top SKU changes (includes string fields like sku, name, category)


class ScenarioSaveRequest(BaseModel):
    """Payload for saving an analyzed scenario."""
    scenario_name: str = Field(..., min_length=1, description="Human readable name")
    baseline_date: date = Field(..., description="Baseline forecast start date")
    horizon_days: int = Field(14, ge=1, le=30, description="Forecast horizon used for analysis")
    mode: str = Field("lite", description="Forecast mode used when running analysis")
    scenario_config: ScenarioConfig
    forecast_results: Dict[str, Any] = Field(..., description="Full result payload from /analyze")
    baseline_forecast_id: Optional[int] = Field(
        None,
        description="Optional reference to cached baseline forecast"
    )


def _extract_avg_impact(forecast_results: Optional[Dict[str, Any]]) -> Optional[float]:
    """Attempt to calculate an average visit delta for saved scenarios."""
    if not isinstance(forecast_results, dict):
        return None

    impact_summary = forecast_results.get("impact_summary")
    if isinstance(impact_summary, dict):
        avg_value = impact_summary.get("avg_visit_delta_pct")
        if isinstance(avg_value, (int, float)):
            return round(float(avg_value), 2)

    forecast_delta = forecast_results.get("forecast_delta")
    if isinstance(forecast_delta, list) and forecast_delta:
        deltas = [
            entry.get("delta_pct")
            for entry in forecast_delta
            if isinstance(entry, dict) and isinstance(entry.get("delta_pct"), (int, float))
        ]
        if deltas:
            return round(sum(deltas) / len(deltas), 2)

    return None


def _derive_baseline_date(scenario_config: Dict[str, Any],
                          forecast_results: Optional[Dict[str, Any]]) -> Optional[str]:
    """Fetch the baseline date from stored metadata."""
    if isinstance(scenario_config, dict):
        baseline_date = scenario_config.get("baseline_date")
        if isinstance(baseline_date, str):
            return baseline_date

    if isinstance(forecast_results, dict):
        forecast_delta = forecast_results.get("forecast_delta")
        if isinstance(forecast_delta, list) and forecast_delta:
            first_entry = forecast_delta[0]
            if isinstance(first_entry, dict):
                date_value = first_entry.get("date")
                if isinstance(date_value, str):
                    return date_value

    return None


@router.post("/analyze")
async def analyze_scenarios(request: WhatIfRequest) -> Dict[str, List[ScenarioResult]]:
    """Analyze multiple What-If scenarios against baseline forecast.

    Compares scenario forecasts to baseline and returns deltas for:
    - Visit predictions
    - Staffing requirements
    - Inventory recommendations

    Results can be saved for later reference and presentation.
    """
    # explain like I'm 12: this lets you ask "what if" questions like "what if we run a big sale?"
    # or "what if it rains all week?" and see how that changes our predictions for visitors,
    # staffing needs, and what products to stock.

    try:
        baseline_date = request.baseline_date or (date.today() + timedelta(days=1))
        horizon_days = request.horizon_days
        mode = request.mode

        # Generate baseline forecast
        baseline_forecast = forecast_service.generate_forecast(
            start_date=baseline_date,
            horizon_days=horizon_days,
            mode=mode
        )

        results = []

        for scenario in request.scenarios:
            # Convert Pydantic model to dict for forecast service
            scenario_dict = scenario.model_dump() if hasattr(scenario, 'model_dump') else dict(scenario)
            
            # Apply scenario modifications to features
            scenario_forecast = forecast_service.generate_scenario_forecast(
                baseline_date=baseline_date,
                horizon_days=horizon_days,
                mode=mode,
                scenario_config=scenario_dict
            )

            # Calculate deltas from baseline
            forecast_deltas = []
            for i in range(horizon_days):
                baseline_visits = baseline_forecast["forecast"][i]["p50"]
                scenario_visits = scenario_forecast["forecast"][i]["p50"]
                delta_pct = ((scenario_visits - baseline_visits) / baseline_visits * 100) if baseline_visits > 0 else 0

                forecast_deltas.append({
                    "date": baseline_forecast["forecast"][i]["date"],
                    "baseline_visits": baseline_visits,
                    "scenario_visits": scenario_visits,
                    "delta": scenario_visits - baseline_visits,
                    "delta_pct": round(delta_pct, 1)
                })

            # Calculate overall impact
            avg_delta_pct = sum(d["delta_pct"] for d in forecast_deltas) / len(forecast_deltas)
            total_delta = sum(d["delta"] for d in forecast_deltas)

            impact_summary = {
                "avg_visit_delta_pct": round(avg_delta_pct, 1),
                "total_visit_delta": int(total_delta),
                "max_daily_impact": max(abs(d["delta"]) for d in forecast_deltas),
                "scenario_strength": "high" if abs(avg_delta_pct) > 15 else "medium" if abs(avg_delta_pct) > 5 else "low"
            }

            # Calculate staffing impact (simplified)
            staffing_impact = {}
            if abs(avg_delta_pct) > 5:  # Only if significant impact
                roles = ["cashier", "floor_staff", "manager"]
                for role in roles:
                    # Scale staffing based on visit delta
                    staffing_impact[role] = int(total_delta / 100)  # Rough heuristic

            inventory_impact = InventoryRepository.estimate_impact(total_delta)

            results.append(ScenarioResult(
                scenario_name=scenario.name,
                forecast_delta=forecast_deltas,
                impact_summary=impact_summary,
                staffing_impact=staffing_impact,
                inventory_impact=inventory_impact
            ))

        return {"scenarios": results}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scenario analysis failed: {str(e)}"
        )


@router.post("/save")
async def save_scenario(request: ScenarioSaveRequest) -> Dict[str, str]:
    """Save a What-If scenario for later reference.

    Saves scenario configuration and results to database for:
    - Historical reference
    - Report generation
    - Scenario comparison
    """
    # explain like I'm 12: we save your "what if" experiments so you can look back at them later,
    # like keeping a notebook of all the different scenarios you've tested.

    try:
        scenario_name = request.scenario_name.strip()
        if not scenario_name:
            raise HTTPException(
                status_code=400,
                detail="Scenario name cannot be empty"
            )

        scenario_config_payload = request.scenario_config.model_dump()
        scenario_config_payload.update({
            "baseline_date": request.baseline_date.isoformat(),
            "mode": request.mode,
            "horizon_days": request.horizon_days
        })

        scenario_id = WhatIfScenarioRepository.save_scenario(
            name=scenario_name,
            scenario_config=scenario_config_payload,
            forecast_results=request.forecast_results,
            baseline_forecast_id=request.baseline_forecast_id
        )

        return {
            "status": "success",
            "message": f"Scenario '{scenario_name}' saved successfully",
            "scenario_id": str(scenario_id)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save scenario: {str(e)}"
        )


@router.get("/scenarios")
async def list_scenarios(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0)
) -> Dict[str, Any]:
    """List saved What-If scenarios for reference."""
    # explain like I'm 12: this shows you all the "what if" experiments you've saved,
    # like looking at your notebook of past scenario tests.

    try:
        stored_scenarios = WhatIfScenarioRepository.list_scenarios(limit=limit, offset=offset)
        total_count = WhatIfScenarioRepository.get_total_count()

        formatted = []
        for scenario in stored_scenarios:
            config = scenario.get("scenario_config") or {}
            forecast_results = scenario.get("forecast_results")

            formatted.append({
                "id": scenario["id"],
                "name": scenario["name"],
                "created_at": scenario["created_at"],
                "baseline_date": _derive_baseline_date(config, forecast_results),
                "avg_impact": _extract_avg_impact(forecast_results),
                "scenario_config": config,
                "forecast_results": forecast_results
            })

        return {
            "scenarios": formatted,
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list scenarios: {str(e)}"
        )


@router.get("/quick-scenarios")
async def get_quick_scenarios() -> Dict[str, List[ScenarioConfig]]:
    """Get pre-configured scenario templates for common What-If questions.

    Provides ready-to-use scenarios for typical business questions like:
    - What if we run a 20% off sale?
    - What if a competitor opens nearby?
    - What if there's bad weather?
    """
    # explain like I'm 12: these are like ready-made "what if" questions that lots of stores
    # ask themselves, so we made templates to make it quick and easy.

    scenarios = [
        ScenarioConfig(
            name="20% Off Sale",
            description="Major promotional event with 20% discount across store",
            promo_boost=0.25,  # 25% visit increase expected
            holiday_effect=True  # Sales often feel like mini-holidays
        ),
        ScenarioConfig(
            name="Rainy Weather",
            description="Extended period of rainy weather impacting foot traffic",
            weather_impact="rainy",  # 15% decrease expected
        ),
        ScenarioConfig(
            name="Payday Week",
            description="Timing around monthly payday when spending increases",
            payday_shift=True,  # 10-15% increase during payday periods
        ),
        ScenarioConfig(
            name="Competitor Opening",
            description="New competitor store opening nearby",
            competitor_action="new_store",  # 20% decrease expected
        ),
        ScenarioConfig(
            name="Holiday Weekend",
            description="Major holiday weekend with increased shopping",
            holiday_effect=True,
            promo_boost=0.15
        ),
        ScenarioConfig(
            name="Price Increase",
            description="10% price increase across key categories",
            price_sensitivity=-0.1,  # 10% decrease expected
        )
    ]

    return {"quick_scenarios": scenarios}
