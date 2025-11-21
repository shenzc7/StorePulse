# StorePulse Troubleshooting Guide

## Common Issues and Solutions

### Error: "failed to run 'cargo metadata' command"

**Symptom:**
```
Error failed to run 'cargo metadata' command to get workspace directory: No such file or directory (os error 2)
```

**Cause:** Rust/Cargo is not installed or not in your PATH.

**Solution:**

#### macOS:
```bash
# Install Rust using rustup (recommended)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart your terminal or reload PATH
source ~/.cargo/env

# Verify installation
cargo --version
rustc --version
```

#### Windows:
1. Download and run the installer from: https://rustup.rs/
2. Or use PowerShell:
```powershell
# Download and run rustup-init.exe from https://rustup.rs/
# Follow the installation wizard
# Restart PowerShell/Command Prompt
cargo --version
```

#### Linux:
```bash
# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verify installation
cargo --version
```

**After installing Rust:**
```bash
# Navigate to project directory
cd StorePulse

# Install frontend dependencies
cd src
npm install

# Try running again
npm run tauri-dev
```

---

### Error: "Command 'cargo' not found" after installation

**Solution:**
```bash
# Add Cargo to PATH (macOS/Linux)
export PATH="$HOME/.cargo/bin:$PATH"

# Or add to your shell profile permanently:
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc  # For zsh
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc  # For bash

# Reload shell
source ~/.zshrc  # or source ~/.bashrc
```

---

### Error: "Tauri CLI not found"

**Solution:**
```bash
# Install Tauri CLI globally
npm install -g @tauri-apps/cli

# Or use npx (no global install needed)
npx @tauri-apps/cli dev
```

---

### Error: "Python not found" or "Module not found"

**Solution:**
```bash
# Ensure Python 3.11+ is installed
python3 --version

# Create virtual environment
python3 -m venv api_venv

# Activate virtual environment
# macOS/Linux:
source api_venv/bin/activate

# Windows:
api_venv\Scripts\Activate.ps1

# Install dependencies
pip install -r api/requirements.txt
```

---

### Error: "Port 9000 already in use"

**Solution:**
```bash
# macOS/Linux - Find and kill process
lsof -ti:9000 | xargs kill -9

# Windows - Find and kill process
netstat -ano | findstr :9000
taskkill /PID <PID> /F

# Or change port in api/main.py
```

---

### Error: "Node modules not found"

**Solution:**
```bash
cd src
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

### Error: "Database locked" or SQLite errors

**Solution:**
```bash
# Close any running instances of StorePulse
# Delete and recreate database (WARNING: This deletes all data)
rm data/storepulse.db

# Restart the application - it will recreate the database
```

---

### Error: "Build failed" during Tauri build

**Solution:**
```bash
# Ensure all dependencies are installed
cd src
npm install

# Ensure Rust is installed and up to date
rustup update

# Clean build cache
cargo clean
rm -rf src-tauri/target

# Try building again
npm run tauri build
```

---

### Platform-Specific Issues

#### macOS:
- **Xcode Command Line Tools required:**
  ```bash
  xcode-select --install
  ```

#### Windows:
- **Visual Studio Build Tools required:**
  - Download from: https://visualstudio.microsoft.com/downloads/
  - Install "Desktop development with C++" workload

#### Linux:
- **Build essentials required:**
  ```bash
  sudo apt-get update
  sudo apt-get install build-essential libwebkit2gtk-4.0-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

---

### Quick Verification Checklist

Run these commands to verify your setup:

```bash
# 1. Check Python
python3 --version  # Should be 3.11+

# 2. Check Node.js
node --version  # Should be 18+

# 3. Check Rust/Cargo
cargo --version  # Should be installed

# 4. Check Git
git --version

# 5. Verify project structure
ls -la src/src-tauri/Cargo.toml  # Should exist
ls -la api/requirements.txt      # Should exist
```

---

### Still Having Issues?

1. **Check the logs:**
   - Backend: Terminal output or `/tmp/storepulse-backend.log`
   - Frontend: Browser console (F12) or terminal output

2. **Verify environment:**
   ```bash
   # Check if virtual environment is activated
   which python  # Should point to api_venv/bin/python
   
   # Check if Node modules are installed
   ls src/node_modules  # Should exist
   ```

3. **Clean install:**
   ```bash
   # Remove all dependencies and reinstall
   rm -rf api_venv src/node_modules src/package-lock.json
   python3 -m venv api_venv
   source api_venv/bin/activate
   pip install -r api/requirements.txt
   cd src
   npm install
   ```

4. **Check system requirements:**
   - macOS: 10.15+
   - Windows: 10+ (64-bit)
   - RAM: 8GB minimum
   - Storage: 2GB free space

---

## Getting Help

If none of these solutions work:
1. Check the main [README.md](README.md)
2. Review [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md)
3. Check error logs for specific error messages
4. Ensure all prerequisites are installed correctly

