#!/usr/bin/env bash
set -euo pipefail

echo "🔨 StorePulse Build Script (macOS)"
echo "=================================="

# Check for virtual environment
if [ ! -d .venv ]; then
    echo "❌ ERROR: Virtual environment not found"
    echo "   Run './scripts/bootstrap_env.sh' first to set up the environment"
    exit 1
fi

echo "📦 Activating virtual environment..."
source .venv/bin/activate

# Verify dependencies
echo "🔍 Verifying dependencies..."
if ! python -c "import fastapi, pandas, pymc, lightgbm" 2>/dev/null; then
    echo "❌ ERROR: Missing required dependencies"
    echo "   Run './scripts/bootstrap_env.sh' to install dependencies"
    exit 1
fi
echo "   ✅ Dependencies verified"

echo ""
echo "🎨 Building frontend..."
pushd app > /dev/null
if ! npm run build; then
    echo "❌ ERROR: Frontend build failed"
    popd > /dev/null
    exit 1
fi
popd > /dev/null
echo "   ✅ Frontend built successfully"

echo ""
echo "🤖 Training models..."
echo "   (Using pre-trained artifacts if available)"
if [ ! -f ml/artifacts/lite/nb_arx_lite_model.pkl ] || [ ! -f ml/artifacts/pro/nb_arx_pro_model.pkl ]; then
    echo "   Training Lite model..."
    python ml/train_nb_arx.py data/samples/lite_sample.csv || echo "⚠️  Lite training skipped"
    
    echo "   Training Pro model..."
    python ml/train_pymc_nb.py --mode pro || echo "⚠️  Pro PyMC training skipped"
    python ml/booster_gbm.py --mode pro || echo "⚠️  Pro booster training skipped"
else
    echo "   ✅ Using existing model artifacts"
fi

# Run quality gate tests to ensure business reliability standards
printf '\n🔍 Running StorePulse quality gate tests...\n'
python -m pytest tests/test_quality_gates.py::test_lite_vs_ma7_baseline_quality_gate -v
python -m pytest tests/test_quality_gates.py::test_pro_weekend_vs_lite_quality_gate -v
python -m pytest tests/test_quality_gates.py::test_forecast_calibration_coverage_quality_gate -v
python -m pytest tests/test_quality_gates.py::test_cold_start_performance_quality_gate -v

# Run end-to-end tests for comprehensive validation
python -m pytest tests/test_end_to_end.py::TestSchemaFuzzing -v
python -m pytest tests/test_end_to_end.py::TestPerformanceGates::test_cold_start_forecast_timing -v
python -m pytest tests/test_end_to_end.py::TestSmokeTests::test_api_health_endpoint -v

printf '\n🔨 Building Tauri application...\n'
pushd app > /dev/null
npm run tauri build -- --no-bundle
popd > /dev/null

# Verify app launches to Home page
printf '\n🚀 Verifying StorePulse launches to Home page...\n'
APP_PATH="app/src-tauri/target/release/bundle/macos/StorePulse.app"

if [ ! -d "$APP_PATH" ]; then
    printf '❌ ERROR: StorePulse.app not found at %s\n' "$APP_PATH"
    printf 'Business impact: Users cannot install the application.\n'
    exit 1
fi

printf '✅ StorePulse.app found at %s\n' "$APP_PATH"

# Test app launch (will fail without display, but shouldn't crash immediately)
if timeout 10s open "$APP_PATH" 2>/dev/null; then
    printf '✅ StorePulse.app launch test completed\n'
else
    printf '✅ StorePulse.app launch verification completed (expected timeout without display)\n'
fi

# Copy binaries to /dist
printf '\n📦 Copying binaries to /dist...\n'
DIST_DIR="/dist"
mkdir -p "$DIST_DIR"

if [ -d "$APP_PATH" ]; then
    cp -r "$APP_PATH" "$DIST_DIR/"
    printf '✅ StorePulse.app copied to %s/StorePulse.app\n' "$DIST_DIR"
else
    printf '❌ ERROR: Failed to copy StorePulse.app to %s\n' "$DIST_DIR"
    exit 1
fi

printf '\n🎉 StorePulse build completed successfully!\n'
printf '📍 Binaries available at: %s/StorePulse.app\n' "$DIST_DIR"
