#!/bin/bash
# StorePulse - Complete macOS Setup Script
# Copy and paste this entire script into your terminal

set -e  # Exit on error

echo "🚀 StorePulse macOS Setup"
echo "=========================="
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
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
brew update

# Install prerequisites
echo ""
echo "📦 Installing prerequisites..."
brew install python@3.13 node@20 git

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
if ! command -v node &> /dev/null; then
    echo "⚠️  Warning: Node.js not in PATH. Reloading shell..."
    source ~/.zprofile 2>/dev/null || true
fi

# Install Rust (required for Tauri)
echo ""
echo "🦀 Installing Rust..."
if ! command -v cargo &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
else
    echo "✅ Rust already installed"
fi

# Install Xcode Command Line Tools (if not already installed)
echo ""
echo "🔧 Checking Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
    echo "Installing Xcode Command Line Tools (this may take a while)..."
    xcode-select --install
    echo "⚠️  Please complete the Xcode Command Line Tools installation, then press Enter to continue..."
    read
else
    echo "✅ Xcode Command Line Tools already installed"
fi

# Clone repository (if not already cloned)
echo ""
if [ ! -d "StorePulse" ] && [ ! -f "package.json" ] && [ ! -f "api/main.py" ]; then
    echo "📥 Cloning StorePulse repository..."
    git clone https://github.com/shenzc7/StorePulse.git
    cd StorePulse
elif [ -d "StorePulse" ]; then
    echo "✅ Repository already cloned"
    cd StorePulse
    echo "🔄 Updating repository..."
    git pull || echo "⚠️  Could not update (may be on different branch)"
else
    echo "✅ Already in StorePulse directory"
    echo "🔄 Updating repository..."
    git pull || echo "⚠️  Could not update (may be on different branch)"
fi

# Create Python virtual environment
echo ""
echo "🐍 Setting up Python environment..."
python3 -m venv api_venv
source api_venv/bin/activate

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r api/requirements.txt

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
cd src
npm install
cd ..

# Verify setup
echo ""
echo "✅ Verifying setup..."
./scripts/verify_setup.sh

# Fix Tauri version mismatch (ensure npm packages match Cargo.toml)
echo ""
echo "🔧 Fixing Tauri version compatibility..."
cd src
npm install @tauri-apps/api@2.0.0 @tauri-apps/cli@2.0.0 --save-exact
cd ..

# Start the application using dev.sh script
echo ""
echo "🎉 Setup complete! Starting StorePulse..."
echo ""
echo "Using dev.sh launcher..."
chmod +x dev.sh
./dev.sh

