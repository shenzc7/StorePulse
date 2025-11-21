#!/bin/bash
# StorePulse Setup Verification Script
# Run this script to verify all prerequisites are installed correctly

echo "=========================================="
echo "StorePulse Setup Verification"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Check Python
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    echo "✅ Python found: $PYTHON_VERSION"
    
    # Check version (need 3.11+)
    MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    if [ "$MAJOR" -lt 3 ] || ([ "$MAJOR" -eq 3 ] && [ "$MINOR" -lt 11 ]); then
        echo "⚠️  WARNING: Python 3.11+ recommended (found $PYTHON_VERSION)"
        ((WARNINGS++))
    fi
else
    echo "❌ ERROR: Python 3 not found"
    echo "   Install from: https://www.python.org/downloads/"
    ((ERRORS++))
fi
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: $NODE_VERSION"
    
    # Check version (need 18+)
    MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
    if [ "$MAJOR" -lt 18 ]; then
        echo "⚠️  WARNING: Node.js 18+ recommended (found $NODE_VERSION)"
        ((WARNINGS++))
    fi
else
    echo "❌ ERROR: Node.js not found"
    echo "   Install from: https://nodejs.org/"
    ((ERRORS++))
fi
echo ""

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm found: $NPM_VERSION"
else
    echo "❌ ERROR: npm not found"
    echo "   Usually comes with Node.js"
    ((ERRORS++))
fi
echo ""

# Check Rust/Cargo (CRITICAL for Tauri)
echo "Checking Rust/Cargo..."
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version)
    echo "✅ Cargo found: $CARGO_VERSION"
    
    if command -v rustc &> /dev/null; then
        RUSTC_VERSION=$(rustc --version)
        echo "✅ Rust compiler found: $RUSTC_VERSION"
    else
        echo "⚠️  WARNING: rustc not found (but cargo is)"
        ((WARNINGS++))
    fi
else
    echo "❌ ERROR: Cargo (Rust) not found"
    echo "   This is REQUIRED for Tauri desktop app"
    echo "   Install from: https://rustup.rs/"
    echo "   Or run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    ((ERRORS++))
fi
echo ""

# Check Git
echo "Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "✅ Git found: $GIT_VERSION"
else
    echo "⚠️  WARNING: Git not found (optional for development)"
    ((WARNINGS++))
fi
echo ""

# Check project structure
echo "Checking project structure..."
if [ -f "api/requirements.txt" ]; then
    echo "✅ Backend requirements file found"
else
    echo "❌ ERROR: api/requirements.txt not found"
    ((ERRORS++))
fi

if [ -f "src/package.json" ]; then
    echo "✅ Frontend package.json found"
else
    echo "❌ ERROR: src/package.json not found"
    ((ERRORS++))
fi

if [ -f "src/src-tauri/Cargo.toml" ]; then
    echo "✅ Tauri Cargo.toml found"
else
    echo "❌ ERROR: src/src-tauri/Cargo.toml not found"
    ((ERRORS++))
fi
echo ""

# Check virtual environment
echo "Checking Python virtual environment..."
if [ -d "api_venv" ]; then
    echo "✅ Python virtual environment found"
    if [ -f "api_venv/bin/activate" ] || [ -f "api_venv/Scripts/activate" ]; then
        echo "✅ Virtual environment appears valid"
    else
        echo "⚠️  WARNING: Virtual environment may be corrupted"
        ((WARNINGS++))
    fi
else
    echo "⚠️  WARNING: Python virtual environment not found"
    echo "   Run: python3 -m venv api_venv"
    ((WARNINGS++))
fi
echo ""

# Check Node modules
echo "Checking Node.js dependencies..."
if [ -d "src/node_modules" ]; then
    echo "✅ Node modules found"
else
    echo "⚠️  WARNING: Node modules not installed"
    echo "   Run: cd src && npm install"
    ((WARNINGS++))
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 All checks passed! You're ready to run StorePulse."
    echo ""
    echo "To start the application:"
    echo "  ./dev.sh"
    echo "  or"
    echo "  ./start.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "✅ No critical errors found, but there are some warnings."
    echo "   Review the warnings above and fix them if needed."
    exit 0
else
    echo "❌ Critical errors found. Please fix them before running StorePulse."
    echo ""
    echo "Quick fixes:"
    echo "  - Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo "  - Create venv: python3 -m venv api_venv"
    echo "  - Install deps: pip install -r api/requirements.txt"
    echo "  - Install npm deps: cd src && npm install"
    echo ""
    echo "See TROUBLESHOOTING.md for detailed solutions."
    exit 1
fi

