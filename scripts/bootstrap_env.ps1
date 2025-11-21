Param()

# Bootstrap StorePulse dev environment (Windows PowerShell)
Write-Host "🚀 StorePulse Environment Bootstrap (Windows)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check Python version
$pythonVersion = python --version 2>&1
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
Write-Host "   Python version: $pythonVersion"

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERROR: Node.js not found" -ForegroundColor Red
    Write-Host "   Install from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = node --version
Write-Host "   Node.js version: $nodeVersion"

# Create virtual environment
Write-Host ""
Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path api_venv) {
    Write-Host "   ℹ️  Virtual environment already exists, using existing api_venv" -ForegroundColor Gray
} else {
    python -m venv api_venv
    Write-Host "   ✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
. api_venv\Scripts\Activate.ps1
Write-Host "   ✅ Virtual environment activated" -ForegroundColor Green

# Upgrade pip
Write-Host ""
Write-Host "⬆️  Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip | Out-Null
Write-Host "   ✅ Pip upgraded" -ForegroundColor Green

# Install Python dependencies
Write-Host ""
Write-Host "📚 Installing Python dependencies..." -ForegroundColor Yellow
if (-not (Test-Path api\requirements.txt)) {
    Write-Host "❌ ERROR: api/requirements.txt not found" -ForegroundColor Red
    exit 1
}

python -m pip install -r api/requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host ""
Write-Host "🎨 Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location src
if (npm install) {
    Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: npm install failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host ""
Write-Host "✅ Environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Activate virtual environment: .\api_venv\Scripts\Activate.ps1"
Write-Host "  2. Run development server: .\dev.sh"
Write-Host "  3. Or run production mode: .\start.sh"
Write-Host ""
Write-Host "See DEVELOPER_SETUP.md for detailed instructions and troubleshooting"
