# StorePulse - macOS One-Line Install (FIXED)

## 🚀 Quick Install

Copy and paste this command into Terminal:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/shenzc7/StorePulse/main/SETUP_MACOS.sh)"
```

**That's it!** The script will:
- ✅ Install all prerequisites (Python, Node, Rust)
- ✅ Clone the repository
- ✅ Set up virtual environment
- ✅ Install all dependencies
- ✅ Fix version mismatches automatically
- ✅ Launch the application

## ⏱️ Installation Time

- **Fresh install**: ~10-15 minutes
- **First Tauri build**: Additional ~2 minutes

## 💻 What You Need

- macOS 10.15+ (Catalina or newer)
- ~5 GB free disk space
- Internet connection
- That's all!

## ✅ What Was Fixed

The previous install script had **3 critical bugs** that caused it to fail on fresh machines:

### 1. Python Import Error ✅ FIXED
**Before:** 
```
ImportError: attempted relative import with no known parent package
```
**After:** Added proper PYTHONPATH configuration

### 2. Tauri Version Mismatch ✅ FIXED
**Before:**
```
Error Found version mismatched Tauri packages
tauri (v2.0.0) : @tauri-apps/api (v2.8.0)
```
**After:** Force clean install with exact versions

### 3. Frontend Won't Start ✅ FIXED
**Before:**
```
Warn Waiting for your frontend dev server to start on http://localhost:5173/...
(indefinitely)
```
**After:** Backend starts correctly, frontend follows

## 📝 Success Looks Like

```
========================================
🎉 Setup Complete!
========================================

📋 Installation Summary:
   ✅ Python 3.13.7
   ✅ Node.js v20.19.5
   ✅ Rust 1.91.1

🚀 Starting StorePulse...

🖥️  Starting backend on port 9000...
   ✅ Backend ready on http://localhost:9000
🌐 Starting Vite dev server on port 5173...
   ✅ Vite ready on http://localhost:5173
🎯 Starting Tauri app...

[Tauri app window opens]
```

## 🔧 Troubleshooting

### If Something Goes Wrong

1. **Check logs:**
   ```bash
   tail -f /tmp/storepulse-backend.log
   tail -f /tmp/storepulse-vite.log
   ```

2. **Restart the app:**
   ```bash
   cd StorePulse
   ./dev.sh
   ```

3. **Full reset:**
   ```bash
   cd StorePulse
   rm -rf api_venv src/node_modules
   bash SETUP_MACOS.sh
   ```

### Common Issues

**"Command not found: node"**
```bash
# Restart terminal, then:
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
source ~/.zprofile
```

**"Port 9000 already in use"**
```bash
lsof -ti:9000 | xargs kill -9
```

**"Tauri version mismatch" (shouldn't happen now)**
```bash
cd StorePulse/src
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 🆘 Still Having Issues?

1. Make sure you have:
   - Admin/sudo access
   - Stable internet connection
   - At least 5GB free space

2. Check versions:
   ```bash
   python3 --version  # Should be 3.13.x
   node --version     # Should be v20.x+
   cargo --version    # Should be 1.91.x+
   ```

3. See detailed troubleshooting: [MACOS_SETUP_FIXES.md](./MACOS_SETUP_FIXES.md)

## 🎯 Manual Installation (Alternative)

If the one-line install doesn't work for some reason:

```bash
# 1. Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install prerequisites
brew install python@3.13 node@20 git

# 3. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 4. Clone and setup
git clone https://github.com/shenzc7/StorePulse.git
cd StorePulse
python3 -m venv api_venv
source api_venv/bin/activate
pip install -r api/requirements.txt
cd src
rm -rf node_modules package-lock.json
npm install
cd ..

# 5. Run
./dev.sh
```

## 📚 Next Steps

After installation:
1. Upload your sales data (CSV or Excel)
2. Configure inventory settings
3. Train the forecasting model
4. Generate predictions
5. Export reports

See [User Manual](./docs/User_Manual.pdf) for detailed instructions.

---

**Installation Script Version**: 2.0 (Fixed November 2025)  
**Tested On**: macOS Sonoma (13.x), Sequoia (14.x)  
**Supported Architectures**: Intel (x86_64), Apple Silicon (arm64)

## 💡 Pro Tips

- First Rust compilation takes ~2 minutes - this is normal
- Backend auto-reloads on code changes (dev mode)
- Press `Ctrl+C` in terminal to stop the app
- Use `./start.sh` for production mode (no auto-reload)
- Log files are in `/tmp/storepulse-*.log`

---

**Need help?** Check the full troubleshooting guide: [MACOS_SETUP_FIXES.md](./MACOS_SETUP_FIXES.md)

