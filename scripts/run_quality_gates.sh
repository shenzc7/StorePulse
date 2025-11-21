#!/usr/bin/env bash
set -euo pipefail

# StorePulse Quality Gates Runner
# This script runs all quality gate tests to ensure business reliability standards

echo "🛡️  StorePulse Quality Gates Validation"
echo "======================================"
echo ""

# Check if we're in a virtual environment
if [ -z "${VIRTUAL_ENV:-}" ] && [ -d ".venv" ]; then
    echo "🔧 Activating virtual environment..."
    source .venv/bin/activate
fi

echo "🔍 Running Lite vs MA7 baseline quality gate..."
python -m pytest tests/test_quality_gates.py::test_lite_vs_ma7_baseline_quality_gate -v

echo ""
echo "🔍 Running Pro weekend vs Lite quality gate..."
python -m pytest tests/test_quality_gates.py::test_pro_weekend_vs_lite_quality_gate -v

echo ""
echo "🔍 Running forecast calibration coverage quality gate..."
python -m pytest tests/test_quality_gates.py::test_forecast_calibration_coverage_quality_gate -v

echo ""
echo "🔍 Running cold start performance quality gate..."
python -m pytest tests/test_quality_gates.py::test_cold_start_performance_quality_gate -v

echo ""
echo "🔍 Running schema fuzzing tests..."
python -m pytest tests/test_end_to_end.py::TestSchemaFuzzing -v

echo ""
echo "🔍 Running performance validation tests..."
python -m pytest tests/test_end_to_end.py::TestPerformanceGates -v

echo ""
echo "🔍 Running smoke tests..."
python -m pytest tests/test_end_to_end.py::TestSmokeTests -v

echo ""
echo "✅ All StorePulse quality gates passed!"
echo "🎯 Business reliability standards enforced successfully."
echo ""
echo "Quality gates validated:"
echo "  ✓ Lite model ≥8% sMAPE better than MA7 baseline"
echo "  ✓ Pro model ≥20% weekend sMAPE better than Lite"
echo "  ✓ Calibrated coverage (P10–P90) within 80–95%"
echo "  ✓ Cold start forecast ≤90s on lite_sample.csv"
echo "  ✓ Schema fuzzing: missing days, negatives, messy headers → no crash"
echo "  ✓ Smoke test: packaged app launches without error"
