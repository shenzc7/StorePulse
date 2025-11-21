# macOS Setup Script - Fixed Version

## What Was Fixed

The `SETUP_MACOS.sh` script has been completely fixed to resolve all installation issues on fresh macOS machines.

### Critical Fixes Applied

1. **Python Module Import Error** ✅
   - **Problem**: `ImportError: attempted relative import with no known parent package`
   - **Root Cause**: Python wasn't recognizing the `api` directory as a proper package
   - **Fix**: Added `PYTHONPATH` export to include project root directory
   - **Files Modified**: `SETUP_MACOS.sh`, `dev.sh`, `start.sh`

2. **Tauri Version Mismatch** ✅
   - **Problem**: `tauri (v2.0.0) : @tauri-apps/api (v2.8.0)` version conflict
   - **Root Cause**: npm was installing newer cached versions instead of exact versions
   - **Fix**: 
     - Delete `node_modules` and `package-lock.json` before install
     - Clear npm cache completely
     - Verify versions after installation
     - Added fallback version checking

3. **Frontend Not Starting** ✅
   - **Problem**: Vite dev server wasn't launching, Tauri kept waiting
   - **Root Cause**: Backend crash prevented full startup sequence
   - **Fix**: Fixed backend issues, which allows proper startup sequence

4. **Node.js PATH Issues** ✅
   - **Problem**: `node@20` not found after installation (keg-only formula)
   - **Root Cause**: Homebrew's `node@20` isn't symlinked by default
   - **Fix**: 
     - Added PATH configuration for both Intel and Apple Silicon Macs
     - Added fallback to install regular `node` if `node@20` fails
     - Multiple shell profile checks (`.zprofile`, `.zshrc`)

### Additional Improvements

- ✅ **Better Error Messages**: Clear error messages with suggested actions
- ✅ **Log File References**: Shows where to check logs if errors occur
- ✅ **Module Import Testing**: Tests Python imports before launching
- ✅ **Version Verification**: Verifies all installed versions are correct
- ✅ **Port Conflict Resolution**: Automatically kills processes on ports 9000 and 5173
- ✅ **Setup Summary**: Shows installation summary before launching

## How to Use (Fresh Install)

### One-Line Install Command

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/shenzc7/StorePulse/main/SETUP_MACOS.sh)"
```

### Manual Install Steps (if needed)

```bash
# 1. Download the script
curl -fsSL https://raw.githubusercontent.com/shenzc7/StorePulse/main/SETUP_MACOS.sh > setup_storepulse.sh

# 2. Make it executable
chmod +x setup_storepulse.sh

# 3. Run it
./setup_storepulse.sh
```

### What the Script Does

1. ✅ Installs Homebrew (if not present)
2. ✅ Installs Python 3.13, Node.js 20, Git
3. ✅ Installs Rust toolchain
4. ✅ Installs Xcode Command Line Tools
5. ✅ Clones StorePulse repository
6. ✅ Creates Python virtual environment
7. ✅ Installs all Python dependencies
8. ✅ Configures PYTHONPATH correctly
9. ✅ Cleans and installs Node.js dependencies with exact versions
10. ✅ Verifies setup
11. ✅ Launches the application

### Expected Output

```
🚀 StorePulse macOS Setup
==========================

✅ Homebrew already installed
🔄 Updating Homebrew...
📦 Installing prerequisites...
🦀 Installing Rust...
🔧 Checking Xcode Command Line Tools...
📥 Cloning StorePulse repository...
🐍 Setting up Python environment...
📦 Installing Python dependencies...
🔧 Configuring Python path...
🧪 Testing Python module imports...
   ✅ API module imports working
🔧 Ensuring Tauri version compatibility...
🧹 Cleaning npm cache and existing installations...
✅ Tauri versions already set to 2.0.0
📦 Installing Node.js dependencies...
🔍 Verifying Tauri installation...
✅ Tauri versions verified: API 2.0.0, CLI 2.0.0
✅ Verifying setup...

==========================================
🎉 Setup Complete!
==========================================

📋 Installation Summary:
   ✅ Python 3.13.7
   ✅ Node.js v20.19.5
   ✅ Rust 1.91.1
   ✅ Virtual environment: api_venv
   ✅ Project: /Users/[username]/Desktop/StorePulse

🚀 Starting StorePulse...

🖥️  Starting backend on port 9000...
   ✅ Backend ready on http://localhost:9000
🌐 Starting Vite dev server on port 5173...
   ✅ Vite ready on http://localhost:5173
🎯 Starting Tauri app...
   (First compile takes ~2 minutes)
```

## Troubleshooting

### If Backend Fails to Start

Check the backend log:
```bash
tail -f /tmp/storepulse-backend.log
```

Common issues:
- **Import errors**: Make sure you're in the project root directory
- **Port in use**: Kill process on port 9000: `lsof -ti:9000 | xargs kill -9`

### If Frontend Fails to Start

Check the Vite log:
```bash
tail -f /tmp/storepulse-vite.log
```

Common issues:
- **Node not found**: Restart terminal and try again
- **Port in use**: Kill process on port 5173: `lsof -ti:5173 | xargs kill -9`

### If Tauri Version Mismatch Persists

```bash
cd src
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Manual Startup (if auto-start fails)

```bash
cd StorePulse
./dev.sh
```

Or:
```bash
cd StorePulse
./start.sh
```

## Environment Variables

The fixed scripts automatically set:

```bash
# Added to dev.sh and start.sh
export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"

# Added to .zprofile (for Node.js on Apple Silicon)
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Added to .zprofile (for Rust)
export PATH="$HOME/.cargo/bin:$PATH"
```

## Files Modified

1. **SETUP_MACOS.sh** - Main installation script
   - Added PYTHONPATH configuration
   - Added npm cache cleaning
   - Added Tauri version verification
   - Improved error handling and logging

2. **dev.sh** - Development launcher
   - Added PYTHONPATH export
   - Added PROJECT_ROOT variable

3. **start.sh** - Production launcher  
   - Added PYTHONPATH export
   - Added PROJECT_ROOT variable

## System Requirements

- **macOS**: 10.15+ (Catalina or newer)
- **Architecture**: Intel (x86_64) or Apple Silicon (arm64)
- **Disk Space**: ~5 GB for all dependencies
- **Memory**: 8 GB RAM minimum
- **Internet**: Required for downloading dependencies

## What Gets Installed

### System-Level (via Homebrew)
- Python 3.13
- Node.js 20.x
- Git 2.x
- Xcode Command Line Tools

### Rust Toolchain (via rustup)
- cargo 1.91+
- rustc 1.91+

### Python Packages (in virtual environment)
- FastAPI, Uvicorn
- Pandas, NumPy, SciPy
- PyMC, Arviz, PyTensor
- scikit-learn, LightGBM
- and ~50 more dependencies

### Node.js Packages
- @tauri-apps/api (2.0.0)
- @tauri-apps/cli (2.0.0)
- React, Vite, TailwindCSS
- and ~500+ more dependencies

## Success Indicators

✅ **Setup Successful If You See:**
- No Python import errors
- Backend starts on http://localhost:9000
- Frontend starts on http://localhost:5173
- Tauri app window opens
- No version mismatch warnings

❌ **Setup Failed If You See:**
- `ImportError: attempted relative import`
- `Tauri version mismatch`
- `Waiting for your frontend dev server...` (indefinitely)
- Backend or Frontend crash loops

## Getting Help

If issues persist after using the fixed script:

1. Check log files:
   - `/tmp/storepulse-backend.log`
   - `/tmp/storepulse-vite.log`

2. Verify installations:
   ```bash
   python3 --version  # Should be 3.13.x
   node --version     # Should be v20.x or v21+
   cargo --version    # Should be 1.91+
   ```

3. Try manual cleanup:
   ```bash
   cd StorePulse
   rm -rf api_venv node_modules src/node_modules
   bash SETUP_MACOS.sh
   ```

## Changes Summary

| Issue | Status | Fix Location |
|-------|--------|--------------|
| Python import error | ✅ Fixed | SETUP_MACOS.sh, dev.sh, start.sh |
| Tauri version mismatch | ✅ Fixed | SETUP_MACOS.sh |
| Frontend not starting | ✅ Fixed | Backend fix resolved this |
| Node.js PATH issues | ✅ Fixed | SETUP_MACOS.sh |
| Poor error messages | ✅ Improved | SETUP_MACOS.sh |

---

**Last Updated**: November 21, 2025  
**Tested On**: macOS Sequoia (14.x), Sonoma (13.x)  
**Script Version**: 2.0 (Fixed)

