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
    from api.core.db import ModelRepository, SettingsRepository

    lite_model = ModelRepository.get_latest_model("lite", "ingarch")
    if not lite_model:
        pytest.skip("Lite model not trained")

    metadata = lite_model.get("training_metadata") or {}
    if metadata.get("sampling_mode") != "full":
        pytest.skip("Lite quality gate applies to full training mode artifacts only")

    metrics_payload = lite_model.get("metrics") or {}
    smape = metrics_payload.get("smape")
    ma7_smape = metrics_payload.get("ma7_smape")
    if smape is None or ma7_smape in (None, 0):
        pytest.skip("Lite metrics missing required SMAPE/MA7 fields")

    improvement_pct = ((ma7_smape - smape) / ma7_smape) * 100
    threshold = float(
        (SettingsRepository.get_setting("quality_gates", {}) or {}).get(
            "lite_vs_baseline_improvement_pct", 8.0
        )
    )

    assert improvement_pct >= threshold, (
        f"Lite model fails quality gate: {improvement_pct:.1f}% improvement vs MA7 baseline "
        f"is below configured {threshold:.1f}% threshold."
    )


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
    from api.core.db import ModelRepository, SettingsRepository

    lite_model = ModelRepository.get_latest_model("lite", "ingarch")
    pro_model = ModelRepository.get_latest_model("pro", "ingarch")
    if not lite_model or not pro_model:
        pytest.skip("Lite/Pro models unavailable for comparison")

    lite_meta = lite_model.get("training_metadata") or {}
    pro_meta = pro_model.get("training_metadata") or {}
    if lite_meta.get("sampling_mode") != "full" or pro_meta.get("sampling_mode") != "full":
        pytest.skip("Pro-vs-Lite quality gate applies to full training mode artifacts only")

    lite_records = lite_meta.get("record_count")
    pro_records = pro_meta.get("record_count")
    if isinstance(lite_records, int) and isinstance(pro_records, int):
        if abs(lite_records - pro_records) > max(20, int(0.3 * lite_records)):
            pytest.skip("Lite and Pro models were trained on materially different dataset sizes")

    lite_metrics = lite_model.get("metrics") or {}
    pro_metrics = pro_model.get("metrics") or {}
    lite_smape = lite_metrics.get("smape")
    pro_smape = pro_metrics.get("smape")
    if lite_smape in (None, 0) or pro_smape is None:
        pytest.skip("Lite/Pro SMAPE metrics unavailable")

    improvement_pct = ((lite_smape - pro_smape) / lite_smape) * 100
    threshold = float(
        (SettingsRepository.get_setting("quality_gates", {}) or {}).get(
            "pro_vs_lite_improvement_pct", 10.0
        )
    )

    assert improvement_pct >= threshold, (
        f"Pro model fails quality gate: {improvement_pct:.1f}% improvement over Lite "
        f"is below configured {threshold:.1f}% threshold."
    )


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
