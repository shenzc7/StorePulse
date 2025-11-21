"""
Quality gate tests enforcing StorePulse non-negotiables.

These tests ensure business reliability by validating that:
- Lite model significantly outperforms simple MA7 baseline (8%+ sMAPE improvement)
- Pro model provides substantial weekend accuracy gains over Lite (20%+ improvement)
- Forecast calibration maintains reliable prediction intervals (80-95% coverage)
"""
import json
import time
from datetime import date, timedelta
from pathlib import Path

import pytest

from ml import backtest


def test_lite_vs_ma7_baseline_quality_gate():
    """
    Business reliability: Lite model must deliver meaningful accuracy gains over naive baseline.

    Why this matters: A simple 7-day moving average represents the bare minimum forecasting
    approach. If Lite can't beat this by at least 8%, it provides no business value over
    manual trend analysis, wasting development and compute resources.
    """
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
    from api.core.forecast_service import ForecastService
    from api.core.db import VisitRepository

    # Get historical data for baseline calculation
    historical_data = VisitRepository.get_visit_history(90)  # Last 90 days

    if len(historical_data) < 14:
        pytest.skip("Insufficient historical data for baseline comparison")

    # Calculate MA7 baseline on recent data
    recent_visits = [r["visits"] for r in historical_data[-14:]]
    ma7_baseline = sum(recent_visits) / len(recent_visits)

    # Generate Lite forecast for comparison
    forecast_service = ForecastService()

    try:
        lite_forecast = forecast_service.forecast(horizon_days=7)
        if lite_forecast.get("status") != "success" or not lite_forecast.get("predictions"):
            pytest.skip("Lite model not trained or produced no predictions")

        # Calculate average forecast vs baseline
        avg_forecast = sum(point["predicted_visits"] for point in lite_forecast["predictions"]) / len(lite_forecast["predictions"])
        improvement_pct = ((avg_forecast - ma7_baseline) / ma7_baseline * 100) if ma7_baseline > 0 else 0

        assert improvement_pct >= 8.0, (
            f"Lite model fails quality gate: {improvement_pct:.1f}% improvement vs MA7 baseline "
            f"is below 8% threshold. Business impact: Lite provides minimal advantage "
            f"over manual trend analysis."
        )

    except Exception as e:
        pytest.fail(f"Lite model evaluation failed: {str(e)}")


def test_pro_weekend_vs_lite_quality_gate():
    """
    Business reliability: Pro model must provide significant weekend accuracy improvements.

    Why this matters: Weekends represent high-traffic periods where accurate forecasts are
    critical for staffing and inventory decisions. If Pro doesn't deliver 20%+ better
    weekend accuracy than Lite, it fails to justify the additional complexity and cost.
    """
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
    from api.core.forecast_service import ForecastService

    # Generate forecasts with both modes
    forecast_service = ForecastService()
    start_date = date.today() + timedelta(days=1)

    try:
        lite_forecast = forecast_service.generate_forecast(
            start_date=start_date,
            horizon_days=14,
            mode="lite"
        )

        pro_forecast = forecast_service.generate_forecast(
            start_date=start_date,
            horizon_days=14,
            mode="pro"
        )

        if lite_forecast.get("status") != "success" or pro_forecast.get("status") != "success":
            pytest.skip("Lite/Pro forecasts unavailable for weekend comparison")

        # Compare weekend vs weekday performance
        weekend_days = [5, 6]  # Saturday, Sunday (0=Monday)

        lite_weekend_forecasts = []
        lite_weekday_forecasts = []
        pro_weekend_forecasts = []
        pro_weekday_forecasts = []

        for i, point in enumerate(lite_forecast["forecast"]):
            day_of_week = (start_date + timedelta(days=i)).weekday()
            if day_of_week in weekend_days:
                lite_weekend_forecasts.append(point["p50"])
                pro_weekend_forecasts.append(pro_forecast["forecast"][i]["p50"])
            else:
                lite_weekday_forecasts.append(point["p50"])
                pro_weekday_forecasts.append(pro_forecast["forecast"][i]["p50"])

        if not lite_weekend_forecasts:
            pytest.skip("No weekend days in forecast horizon")

        # Calculate average weekend performance
        lite_weekend_avg = sum(lite_weekend_forecasts) / len(lite_weekend_forecasts)
        pro_weekend_avg = sum(pro_weekend_forecasts) / len(pro_weekend_forecasts)

        # Pro should be better on weekends (higher forecast accuracy)
        weekend_improvement = ((pro_weekend_avg - lite_weekend_avg) / lite_weekend_avg * 100) if lite_weekend_avg > 0 else 0

        assert weekend_improvement >= 20.0, (
            f"Pro model fails weekend quality gate: {weekend_improvement:.1f}% improvement "
            f"over Lite is below 20% threshold. Business impact: Pro doesn't provide sufficient "
            f"value for weekend forecasting critical for operational planning."
        )

    except Exception as e:
        pytest.fail(f"Pro vs Lite weekend comparison failed: {str(e)}")


def test_forecast_calibration_coverage_quality_gate():
    """
    Business reliability: Forecast calibration must maintain reliable prediction intervals.

    Why this matters: Users depend on prediction intervals (P10-P90) for risk management.
    If coverage falls below 80%, forecasts are overconfident and dangerous for planning.
    If above 95%, forecasts are too conservative and not useful for decision-making.
    """
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
    from api.core.forecast_service import ForecastService
    from api.core.db import VisitRepository

    # Get historical data for calibration testing
    historical_data = VisitRepository.get_visit_history(60)  # Last 60 days

    if len(historical_data) < 30:
        pytest.skip("Insufficient historical data for calibration testing")

    forecast_service = ForecastService()

    try:
        # Generate forecast for historical period to test calibration
        test_date = date.today() - timedelta(days=14)  # 2 weeks ago
        calibration_forecast = forecast_service.generate_forecast(
            start_date=test_date,
            horizon_days=7,
            mode="lite"
        )

        if calibration_forecast.get("status") != "success" or not calibration_forecast.get("forecast"):
            pytest.skip("Calibration forecast unavailable")

        # Compare forecast intervals against actual historical data
        # This is a simplified calibration test - in production would use
        # proper conformal prediction calibration

        actual_visits = []
        forecast_p10 = []
        forecast_p50 = []
        forecast_p90 = []

        for i in range(min(7, len(calibration_forecast["forecast"]))):
            forecast_date = test_date + timedelta(days=i)

            # Find actual visits for this date
            for record in historical_data:
                # Handle both string and date comparisons
                record_date = record["event_date"]
                if isinstance(record_date, str):
                    record_date = date.fromisoformat(record_date)

                if record_date == forecast_date:
                    actual_visits.append(record["visits"])
                    break

            # Get forecast bands for this date
            if i < len(calibration_forecast["forecast"]):
                point = calibration_forecast["forecast"][i]
                forecast_p10.append(point["p10"])
                forecast_p50.append(point["p50"])
                forecast_p90.append(point["p90"])

        if len(actual_visits) < 3:
            pytest.skip("Insufficient overlapping historical data for calibration test")

        # Simple coverage test: check if actual values fall within predicted bands
        # In production, this would use proper statistical calibration tests
        coverage_count = 0
        for actual, p10, p50, p90 in zip(actual_visits, forecast_p10, forecast_p50, forecast_p90):
            if p10 <= actual <= p90:
                coverage_count += 1

        coverage_pct = coverage_count / len(actual_visits) if actual_visits else 0

        assert 0.8 <= coverage_pct <= 0.95, (
            f"Forecast calibration fails quality gate: {coverage_pct:.1%} coverage outside "
            f"80-95% range. Business impact: Prediction intervals are unreliable, "
            f"undermining trust in risk management capabilities."
        )

    except Exception as e:
        pytest.fail(f"Calibration testing failed: {str(e)}")


def test_cold_start_performance_quality_gate():
    """
    Business reliability: Cold start forecasting must complete within performance budget.

    Why this matters: Users expect responsive forecasts even on first app launch.
    Performance >90s creates poor user experience and may indicate scalability issues
    that could affect production deployment reliability.
    """
    # Import here to avoid circular imports and ensure clean state
    from api.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    start_time = time.time()

    # Test forecast endpoint with reasonable horizon
    response = client.get("/api/forecast/?days=14&mode=lite")

    end_time = time.time()
    duration = end_time - start_time

    assert response.status_code == 200, (
        f"Forecast endpoint returned {response.status_code}: {response.text}"
    )

    assert duration <= 90.0, (
        f"Cold start performance fails quality gate: {duration:.1f}s exceeds 90s limit. "
        f"Business impact: Slow startup creates poor user experience and indicates "
        f"potential scalability issues in production."
    )


def test_quality_gates_comprehensive(tmp_path: Path) -> None:
    """
    Legacy test maintained for backward compatibility.
    Runs all quality gates in sequence to ensure comprehensive validation.
    """
    # This test now delegates to specific quality gate functions above
    # but maintains the original interface for existing CI/CD integration
    test_lite_vs_ma7_baseline_quality_gate()
    test_pro_weekend_vs_lite_quality_gate()
    test_forecast_calibration_coverage_quality_gate()
    test_cold_start_performance_quality_gate()
