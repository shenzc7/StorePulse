#!/usr/bin/env bash
set -euo pipefail

# Bootstrap StorePulse dev environment (macOS/Linux)
echo "🚀 StorePulse Environment Bootstrap"
echo "===================================="

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
REQUIRED_VERSION="3.11"

echo "📋 Checking prerequisites..."
echo "   Python version: $PYTHON_VERSION"

if ! python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)"; then
    echo "❌ ERROR: Python 3.11+ required, found $PYTHON_VERSION"
    echo "   Install from: https://www.python.org/downloads/"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js not found"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "   Node.js version: $NODE_VERSION"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
if [ -d api_venv ]; then
    echo "   ℹ️  Virtual environment already exists, using existing api_venv"
else
    python3 -m venv api_venv
    echo "   ✅ Virtual environment created"
fi

# Activate virtual environment
source api_venv/bin/activate
echo "   ✅ Virtual environment activated"

# Upgrade pip
echo ""
echo "⬆️  Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
echo "   ✅ Pip upgraded"

# Install Python dependencies
echo ""
echo "📚 Installing Python dependencies..."
if [ ! -f api/requirements.txt ]; then
    echo "❌ ERROR: api/requirements.txt not found"
    exit 1
fi

if pip install -r api/requirements.txt; then
    echo "   ✅ Python dependencies installed"
else
    echo "❌ ERROR: Failed to install Python dependencies"
    echo "   Check that you're using a virtual environment (not system Python)"
    echo "   If you see PEP 668 error, ensure you activated api_venv first"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "🎨 Installing frontend dependencies..."
pushd src > /dev/null
if npm install; then
    echo "   ✅ Frontend dependencies installed"
else
    echo "❌ ERROR: npm install failed"
    popd > /dev/null
    exit 1
fi
popd > /dev/null

# Verify critical packages
echo ""
echo "🔍 Verifying installation..."
python -c "import fastapi, pandas, pymc, lightgbm, sklearn" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ All core packages verified"
else
    echo "⚠️  WARNING: Some packages may not have installed correctly"
    echo "   Run 'pip list' to check installed packages"
fi

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Activate virtual environment: source api_venv/bin/activate"
echo "  2. Run development server: ./dev.sh"
echo "  3. Or run production mode: ./start.sh"
echo ""
echo "See DEVELOPER_SETUP.md for detailed instructions and troubleshooting"
