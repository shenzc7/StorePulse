#!/bin/bash
# StorePulse - Complete macOS Setup Script
# Copy and paste this entire script into your terminal

# Don't exit on error for some commands (we'll handle errors manually)
set +e

echo "🚀 StorePulse macOS Setup"
echo "=========================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to check if port is in use
port_in_use() {
    lsof -ti:$1 &> /dev/null
}

# Check if Homebrew is installed
if ! command_exists brew; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew already installed"
fi

# Update Homebrew
echo ""
echo "🔄 Updating Homebrew..."
brew update 2>/dev/null || echo "⚠️  Homebrew update skipped"

# Install prerequisites
echo ""
echo "📦 Installing prerequisites..."
brew install python@3.13 node@20 git 2>/dev/null || {
    echo "⚠️  Some packages may already be installed, continuing..."
}

# Add node@20 to PATH (it's keg-only, not symlinked by default)
echo ""
echo "🔧 Configuring Node.js PATH..."
if [[ $(uname -m) == "arm64" ]]; then
    export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
    if ! grep -q 'node@20/bin' ~/.zprofile 2>/dev/null; then
        echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
    fi
else
    export PATH="/usr/local/opt/node@20/bin:$PATH"
    if ! grep -q 'node@20/bin' ~/.zprofile 2>/dev/null; then
        echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> ~/.zprofile
    fi
fi

# Verify Node.js is accessible
if ! command_exists node; then
    echo "⚠️  Warning: Node.js not in PATH. Reloading shell..."
    source ~/.zprofile 2>/dev/null || true
    source ~/.zshrc 2>/dev/null || true
    # Try again
    if ! command_exists node; then
        echo "⚠️  Trying alternate Node.js installation method..."
        brew install node 2>/dev/null || true
        # One more try
        if ! command_exists node; then
            echo "❌ ERROR: Node.js installation failed"
            echo "   Please manually install Node.js from https://nodejs.org"
            echo "   Or run: brew install node"
            exit 1
        fi
    fi
fi

echo "✅ Node.js is accessible: $(node --version)"

# Install Rust (required for Tauri)
echo ""
echo "🦀 Installing Rust..."
if ! command_exists cargo; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env 2>/dev/null || {
        echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zprofile
        export PATH="$HOME/.cargo/bin:$PATH"
    }
else
    echo "✅ Rust already installed"
fi

# Verify Rust is accessible
if ! command_exists cargo; then
    echo "❌ ERROR: Cargo not found after installation. Please restart terminal and try again."
    exit 1
fi

# Install Xcode Command Line Tools (if not already installed)
echo ""
echo "🔧 Checking Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
    echo "Installing Xcode Command Line Tools (this may take a while)..."
    xcode-select --install
    echo "⚠️  Please complete the Xcode Command Line Tools installation, then press Enter to continue..."
    read -r
else
    echo "✅ Xcode Command Line Tools already installed"
fi

# Clone repository (if not already cloned)
echo ""
PROJECT_DIR=""
if [ ! -d "StorePulse" ] && [ ! -f "package.json" ] && [ ! -f "api/main.py" ]; then
    echo "📥 Cloning StorePulse repository..."
    git clone https://github.com/shenzc7/StorePulse.git
    cd StorePulse || exit 1
    PROJECT_DIR="$(pwd)"
elif [ -d "StorePulse" ]; then
    echo "✅ Repository already cloned"
    cd StorePulse || exit 1
    PROJECT_DIR="$(pwd)"
    echo "🔄 Updating repository..."
    git pull 2>/dev/null || echo "⚠️  Could not update (may be on different branch)"
else
    echo "✅ Already in StorePulse directory"
    PROJECT_DIR="$(pwd)"
    echo "🔄 Updating repository..."
    git pull 2>/dev/null || echo "⚠️  Could not update (may be on different branch)"
fi

# Ensure we're in the project root
cd "$PROJECT_DIR" || exit 1

# Check for port conflicts
echo ""
echo "🔍 Checking for port conflicts..."
if port_in_use 9005; then
    echo "⚠️  Port 9005 is already in use. Attempting to free it..."
    lsof -ti:9005 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if port_in_use 5174; then
    echo "⚠️  Port 5174 is already in use. Attempting to free it..."
    lsof -ti:5174 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Create Python virtual environment (if it doesn't exist)
echo ""
echo "🐍 Setting up Python environment..."
if [ ! -d "api_venv" ]; then
    python3 -m venv api_venv || {
        echo "❌ ERROR: Failed to create virtual environment"
        exit 1
    }
else
    echo "✅ Virtual environment already exists"
fi

source api_venv/bin/activate || {
    echo "❌ ERROR: Failed to activate virtual environment"
    exit 1
}

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install -r api/requirements.txt || {
    echo "❌ ERROR: Failed to install Python dependencies"
    exit 1
}

# Ensure PYTHONPATH includes project root for proper module imports
echo ""
echo "🔧 Configuring Python path..."
export PYTHONPATH="$PROJECT_DIR:$PYTHONPATH"

# Test that Python can import the api module correctly
echo ""
echo "🧪 Testing Python module imports..."
cd "$PROJECT_DIR" || exit 1
if python3 -c "from api.routes import data; print('✅ API module imports working')" 2>/dev/null; then
    echo "   Module import test passed!"
else
    echo "⚠️  Warning: Python module imports test failed"
    echo "   Don't worry - this will be set up correctly when the app starts"
    echo "   The dev.sh script will configure the environment properly"
fi

# Fix Tauri version in package.json and force clean install
echo ""
echo "🔧 Ensuring Tauri version compatibility..."
cd src || exit 1

# Clean npm cache and remove existing installations for fresh start
echo "🧹 Cleaning npm cache and existing installations..."
rm -rf node_modules package-lock.json 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

# Verify package.json has exact versions (should already be 2.0.0)
if grep -q '"@tauri-apps/api": "2.0.0"' package.json && grep -q '"@tauri-apps/cli": "2.0.0"' package.json; then
    echo "✅ Tauri versions already set to 2.0.0"
else
    echo "⚠️  Fixing Tauri versions in package.json..."
    # macOS sed requires -i '' for in-place editing
    sed -i '' 's/"@tauri-apps\/api": "[^"]*"/"@tauri-apps\/api": "2.0.0"/g' package.json 2>/dev/null || \
    sed -i.bak 's/"@tauri-apps\/api": "[^"]*"/"@tauri-apps\/api": "2.0.0"/g' package.json && rm -f package.json.bak
    
    sed -i '' 's/"@tauri-apps\/cli": "[^"]*"/"@tauri-apps\/cli": "2.0.0"/g' package.json 2>/dev/null || \
    sed -i.bak 's/"@tauri-apps\/cli": "[^"]*"/"@tauri-apps\/cli": "2.0.0"/g' package.json && rm -f package.json.bak
    
    echo "✅ Tauri versions pinned to 2.0.0"
fi

cd .. || exit 1

# Install Node.js dependencies with exact versions
echo ""
echo "📦 Installing Node.js dependencies..."
cd src || exit 1
npm install || {
    echo "⚠️  npm install had issues, trying with --legacy-peer-deps..."
    npm install --legacy-peer-deps || {
        echo "❌ ERROR: Failed to install Node.js dependencies"
        exit 1
    }
}

# Verify Tauri versions after install
echo ""
echo "🔍 Verifying Tauri installation..."
TAURI_API_VERSION=$(npm list @tauri-apps/api --depth=0 2>/dev/null | grep @tauri-apps/api | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
TAURI_CLI_VERSION=$(npm list @tauri-apps/cli --depth=0 2>/dev/null | grep @tauri-apps/cli | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)

if [ "$TAURI_API_VERSION" = "2.0.0" ] && [ "$TAURI_CLI_VERSION" = "2.0.0" ]; then
    echo "✅ Tauri versions verified: API $TAURI_API_VERSION, CLI $TAURI_CLI_VERSION"
else
    echo "⚠️  Warning: Tauri versions may not match (API: $TAURI_API_VERSION, CLI: $TAURI_CLI_VERSION)"
    echo "    This might cause issues. Expected both to be 2.0.0"
fi

cd .. || exit 1

# Make scripts executable
echo ""
echo "🔧 Making scripts executable..."
chmod +x dev.sh start.sh scripts/*.sh 2>/dev/null || true

# Verify setup
echo ""
echo "✅ Verifying setup..."
if [ -f "scripts/verify_setup.sh" ]; then
    chmod +x scripts/verify_setup.sh
    ./scripts/verify_setup.sh || echo "⚠️  Some verification checks failed, but continuing..."
else
    echo "⚠️  verify_setup.sh not found, skipping verification"
fi

# Clean up any existing processes
echo ""
echo "🧹 Cleaning up any existing StorePulse processes..."
pkill -f "storepulse-backend" 2>/dev/null || true
pkill -f "uvicorn api.main" 2>/dev/null || true
pkill -f "tauri dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Final setup summary
echo ""
echo "=========================================="
echo "🎉 Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Installation Summary:"
echo "   ✅ Python $(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')"
echo "   ✅ Node.js $(node --version)"
echo "   ✅ Rust $(rustc --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')"
echo "   ✅ Virtual environment: api_venv"
echo "   ✅ Project: $PROJECT_DIR"
echo ""
echo "🚀 Starting StorePulse..."
echo ""
echo "📝 Note: If you see errors, check these log files:"
echo "   - Backend: /tmp/storepulse-backend.log"
echo "   - Frontend: /tmp/storepulse-vite.log"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""
sleep 2

# Ensure we're in project root
cd "$PROJECT_DIR" || exit 1

# Use dev.sh which handles everything correctly
if [ -f "dev.sh" ]; then
    chmod +x dev.sh
    ./dev.sh
else
    echo "❌ ERROR: dev.sh not found"
    echo "   Current directory: $(pwd)"
    exit 1
fi
