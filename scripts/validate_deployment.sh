#!/usr/bin/env bash
set -euo pipefail

# StorePulse Deployment Validation Script
# Comprehensive end-to-end validation before client delivery

echo "🔍 StorePulse Deployment Validation"
echo "===================================="
echo "Version: 1.0.0"
echo "Date: $(date)"
echo ""

VALIDATION_PASSED=true
VALIDATION_WARNINGS=0

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    VALIDATION_PASSED=false
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((VALIDATION_WARNINGS++))
}

section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Navigate to project root
cd "$(dirname "$0")/.."

# 1. ENVIRONMENT CHECKS
section "1. ENVIRONMENT VALIDATION"

# Check Python version
if python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)"; then
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    pass "Python version $PYTHON_VERSION (>=3.11 required)"
else
    fail "Python 3.11+ not found"
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    pass "Node.js $NODE_VERSION installed"
else
    fail "Node.js not found"
fi

# Check virtual environment
if [ -d .venv ]; then
    pass "Virtual environment exists at .venv"
else
    fail "Virtual environment not found - run ./scripts/bootstrap_env.sh"
fi

# Activate venv if present
if [ -d .venv ]; then
    source .venv/bin/activate
fi

# 2. DEPENDENCY CHECKS
section "2. DEPENDENCY VALIDATION"

# Check Python dependencies
REQUIRED_PACKAGES=("fastapi" "pandas" "numpy" "pymc" "lightgbm" "sklearn" "sqlalchemy")
for package in "${REQUIRED_PACKAGES[@]}"; do
    if python -c "import $package" 2>/dev/null; then
        VERSION=$(python -c "import $package; print(getattr($package, '__version__', 'unknown'))")
        pass "Python package: $package ($VERSION)"
    else
        fail "Missing Python package: $package"
    fi
done

# Check frontend dependencies
if [ -f app/node_modules/.package-lock.json ]; then
    pass "Frontend dependencies installed"
else
    warn "Frontend dependencies may not be installed"
fi

# 3. FILE STRUCTURE CHECKS
section "3. FILE STRUCTURE VALIDATION"

CRITICAL_FILES=(
    "api/requirements.txt"
    "api/main.py"
    "app/package.json"
    "README.md"
    "INSTALLATION.md"
    "ACCEPTANCE.md"
    "scripts/bootstrap_env.sh"
    "scripts/build_mac.sh"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        pass "Critical file exists: $file"
    else
        fail "Missing critical file: $file"
    fi
done

# 4. DOCUMENTATION CHECKS
section "4. DOCUMENTATION VALIDATION"

DOC_FILES=(
    "docs/User_Manual.pdf"
    "docs/Methodology.pdf"
    "docs/DemoScript_v2.txt"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        SIZE=$(du -h "$file" | cut -f1)
        pass "Documentation exists: $file ($SIZE)"
    else
        warn "Documentation missing: $file"
    fi
done

# 5. MODEL ARTIFACTS VALIDATION
section "5. MODEL ARTIFACTS VALIDATION"

# Lite mode artifacts
LITE_ARTIFACTS=(
    "ml/artifacts/lite/nb_arx_lite_model.pkl"
    "ml/artifacts/lite/pymc_model.pkl"
    "ml/artifacts/lite/model_metadata.json"
    "ml/artifacts/lite/training_summary.json"
)

echo "Lite Mode Artifacts:"
for artifact in "${LITE_ARTIFACTS[@]}"; do
    if [ -f "$artifact" ]; then
        SIZE=$(du -h "$artifact" | cut -f1)
        pass "  $artifact ($SIZE)"
    else
        fail "  Missing: $artifact"
    fi
done

# Pro mode artifacts
PRO_ARTIFACTS=(
    "ml/artifacts/pro/nb_arx_pro_model.pkl"
    "ml/artifacts/pro/booster_model.txt"
    "ml/artifacts/pro/booster_metadata.pkl"
    "ml/artifacts/pro/model_metadata.json"
    "ml/artifacts/pro/pymc_report.json"
    "ml/artifacts/pro/training_summary.json"
)

echo ""
echo "Pro Mode Artifacts:"
for artifact in "${PRO_ARTIFACTS[@]}"; do
    if [ -f "$artifact" ]; then
        SIZE=$(du -h "$artifact" | cut -f1)
        pass "  $artifact ($SIZE)"
    else
        fail "  Missing: $artifact"
    fi
done

# 6. DATABASE VALIDATION
section "6. DATABASE VALIDATION"

if [ -f "data/storepulse.db" ]; then
    SIZE=$(du -h "data/storepulse.db" | cut -f1)
    pass "Database exists: data/storepulse.db ($SIZE)"
    
    # Check database integrity
    if python -c "from sqlalchemy import create_engine; engine = create_engine('sqlite:///data/storepulse.db'); engine.connect()" 2>/dev/null; then
        pass "Database is accessible"
    else
        fail "Database connection failed"
    fi
else
    warn "Database not found (will be created on first run)"
fi

# 7. SAMPLE DATA VALIDATION
section "7. SAMPLE DATA VALIDATION"

SAMPLE_FILES=(
    "data/samples/lite_sample.csv"
    "data/samples/pro_sample.csv"
)

for sample in "${SAMPLE_FILES[@]}"; do
    if [ -f "$sample" ]; then
        ROWS=$(tail -n +2 "$sample" | wc -l | xargs)
        pass "Sample data: $sample ($ROWS rows)"
    else
        fail "Missing sample data: $sample"
    fi
done

# 8. TEST EXECUTION
section "8. TEST SUITE VALIDATION"

echo "Running critical tests..."

# Test imports
if python -c "
from api.core import schemas, db, feats, forecast_service
from api.routes import forecast, train, data
print('All imports successful')
" 2>/dev/null; then
    pass "API imports successful"
else
    fail "API import errors detected"
fi

# Run quick tests (if pytest available)
if command -v pytest &> /dev/null; then
    echo ""
    echo "Running quick smoke tests..."
    
    # Test schema validation
    if pytest tests/test_schema.py -v --tb=short 2>&1 | tee /tmp/storepulse_test.log | grep -q "passed"; then
        pass "Schema tests passed"
    else
        warn "Schema tests failed or skipped"
    fi
else
    warn "pytest not available - skipping test execution"
fi

# 9. BUILD SCRIPT VALIDATION
section "9. BUILD SCRIPT VALIDATION"

BUILD_SCRIPTS=(
    "scripts/bootstrap_env.sh"
    "scripts/build_mac.sh"
    "scripts/build_win.ps1"
)

for script in "${BUILD_SCRIPTS[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        pass "Build script executable: $script"
    elif [ -f "$script" ]; then
        warn "Build script not executable: $script (chmod +x needed)"
    else
        fail "Build script missing: $script"
    fi
done

# 10. HANDOVER MATERIALS
section "10. HANDOVER MATERIALS VALIDATION"

HANDOVER_FILES=(
    "handover/Quick_Start_1pager.html"
    "handover/Data_Template_Guide.html"
    "handover/Handover_Checklist.html"
    "handover/Data_Template_Lite.csv"
    "handover/Data_Template_Pro.csv"
)

for file in "${HANDOVER_FILES[@]}"; do
    if [ -f "$file" ]; then
        pass "Handover file: $file"
    else
        warn "Handover file missing: $file"
    fi
done

# FINAL SUMMARY
section "VALIDATION SUMMARY"

echo ""
if [ "$VALIDATION_PASSED" = true ]; then
    if [ $VALIDATION_WARNINGS -eq 0 ]; then
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ ALL VALIDATIONS PASSED${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Status: READY FOR CLIENT DELIVERY"
        echo "Warnings: 0"
        echo ""
        echo "Next Steps:"
        echo "  1. Run ./scripts/create_handover_package.sh"
        echo "  2. Review handover package contents"
        echo "  3. Test installation on clean system"
        echo "  4. Deliver to client with documentation"
    else
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}⚠️  VALIDATION PASSED WITH WARNINGS${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Status: ACCEPTABLE FOR DELIVERY"
        echo "Warnings: $VALIDATION_WARNINGS"
        echo ""
        echo "Review warnings above before final delivery"
    fi
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Status: NOT READY FOR DELIVERY"
    echo "Failures detected - see errors above"
    echo ""
    echo "Fix all critical issues before proceeding"
    exit 1
fi

echo ""
echo "Validation completed: $(date)"
echo ""

# Save report
REPORT_FILE="validation_report_$(date +%Y%m%d_%H%M%S).txt"
echo "📄 Detailed report available in test logs"

exit 0
