# StorePulse v1.0.1

"Know tomorrow's visits. Act today." StorePulse is a professional desktop application for retail forecasting that predicts store traffic patterns and provides actionable staffing and inventory recommendations. Built for retail managers who need data-driven insights to optimize operations and staffing decisions.

## 🚀 Quick Start - Get Running in 5 Minutes

### 🍎 macOS - One Command Setup (Easiest!) ⚡

**Copy and paste this single command into your terminal:**

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/shenzc7/StorePulse/main/SETUP_MACOS.sh)"
```

**This single command will:**
- ✅ Install Homebrew (if needed)
- ✅ Install Python 3.13, Node.js 20, Git, and Rust
- ✅ Clone the StorePulse repository
- ✅ Install all Python and Node.js dependencies (with proper version locking)
- ✅ Configure Python paths automatically
- ✅ Verify your setup
- ✅ Start the application automatically

**Time:** 10-15 minutes (depending on internet speed)

> **🎉 NEW**: The macOS installer has been completely fixed! It now resolves Python import errors, Tauri version mismatches, and Node.js PATH issues automatically. See [QUICK_INSTALL_MACOS.md](QUICK_INSTALL_MACOS.md) for details.

### 🪟 Windows 10/11 - One Command Setup (Admin PowerShell)

**Open PowerShell as Administrator and run:**

```powershell
powershell -ExecutionPolicy Bypass -NoLogo -NoProfile -Command "irm https://raw.githubusercontent.com/shenzc7/StorePulse/main/SETUP_WINDOWS.ps1 | iex"
```

**This single command will:**
- ✅ Install Git, Python 3.11, Node.js 20 LTS, Rustup, C++ Build Tools, and WebView2 via winget
- ✅ Clone the StorePulse repository to `~/StorePulse`
- ✅ Create the Python virtual environment and install Python/Node dependencies
- ✅ Add a desktop shortcut (“StorePulse”) that launches backend + frontend + Tauri together

**Time:** 15-25 minutes depending on network speed and Visual Studio Build Tools install

---

### Manual Setup (All Platforms)

### Step 1: Clone the Repository

**Option A: Using GitHub Desktop (Easiest for Non-Developers)**
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Open GitHub Desktop
3. Click "File" → "Clone Repository"
4. Go to "URL" tab
5. Paste: `https://github.com/shenzc7/StorePulse.git`
6. Choose where to save it
7. Click "Clone"

**Option B: Using Command Line**

**macOS/Linux:**
```bash
git clone https://github.com/shenzc7/StorePulse.git
cd StorePulse
```

**Windows (Command Prompt):**
```cmd
git clone https://github.com/shenzc7/StorePulse.git
cd StorePulse
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/shenzc7/StorePulse.git
cd StorePulse
```

### Step 2: Install Prerequisites

**You need these installed first:**

1. **Python 3.11 or higher**
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"
   - Verify: Open terminal/command prompt and type `python --version` (should show 3.11+)

2. **Node.js 18 or higher**
   - Download from: https://nodejs.org/
   - This also installs npm automatically
   - Verify: Type `node --version` (should show v18+)

3. **Git** (if not already installed)
   - macOS: Usually pre-installed, or get from https://git-scm.com/download/mac
   - Windows: Download from https://git-scm.com/download/win
   - Linux: `sudo apt-get install git` (Ubuntu/Debian)

### Step 3: Run Automated Setup

**macOS/Linux:**
```bash
# Make scripts executable
chmod +x scripts/bootstrap_env.sh
chmod +x dev.sh
chmod +x start.sh

# Run setup (this installs everything automatically)
./scripts/bootstrap_env.sh
```

**Windows (PowerShell):**
```powershell
# Run setup (this installs everything automatically)
.\scripts\bootstrap_env.ps1
```

**What this does:**
- ✅ Creates a Python virtual environment
- ✅ Installs all Python packages
- ✅ Installs all Node.js packages
- ✅ Verifies everything is installed correctly

**Time:** Takes 5-10 minutes depending on your internet speed

### Step 4: Run the Application

**macOS/Linux:**
```bash
./dev.sh
```

**Windows:**
```powershell
.\dev.sh
```

**What happens:**
1. Backend API starts (you'll see "Backend ready")
2. Frontend starts (you'll see "Vite ready")
3. Desktop app opens automatically
4. You're ready to use StorePulse!

### First Time Using StorePulse

1. **Upload Your Data**
   - Click "Data" in the app
   - Upload a CSV file with your store visit data
   - Sample files are in `data/samples/` folder

2. **Train the Model**
   - Click "Train" in the app
   - Click "Train Model" button
   - Wait 1-2 minutes for training to complete

3. **View Forecasts**
   - Click "Forecast" to see predictions
   - See 14-day forecasts with confidence intervals

4. **Export Reports**
   - Click "Reports" to generate PDF reports

---

## 📖 Need More Help?

- **macOS Install Issues?** See [QUICK_INSTALL_MACOS.md](QUICK_INSTALL_MACOS.md) for the fixed installer
- **Having trouble?** See [Troubleshooting](#-troubleshooting) below
- **Want detailed setup?** See [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md)
- **Quick reference?** See [QUICKSTART.md](QUICKSTART.md)
- **What was fixed?** See [MACOS_SETUP_FIXES.md](MACOS_SETUP_FIXES.md) for technical details

## ✨ Key Features

### 🎯 **14-Day Visit Forecasts (Powered by NB-INGARCH)**
- **NB-INGARCH model**: Purpose-built for retail demand forecasting of daily customer arrivals
- **Captures overdispersion**: Accounts for variance > mean in count data (typical in retail footfall)
- **Volatility clustering**: Models time-varying variance (weekends/holidays have different patterns)
- **Exogenous factors**: Incorporates day-of-week, weather, holidays, promotions
- **Uncertainty bands**: Realistic P10-P50-P90 ranges for risk-aware planning

### 👥 **Smart Staffing Recommendations**
- Automatic staff scheduling based on predicted traffic
- Peak hour identification and staffing optimization
- Cost-effective labor planning with confidence intervals

### 📦 **Inventory Optimization**
- Stock level recommendations based on demand forecasts
- SKU-specific inventory alerts and planning
- Reduce waste while ensuring product availability

### 🔬 **What-If Scenario Planning**
- Test promotional campaigns before launch
- Weather impact analysis for seasonal planning
- Competitive scenario modeling
- Compare multiple business strategies

### 📊 **Professional Reports**
- Executive-ready PDF exports
- Visual dashboards with forecast accuracy metrics
- Stakeholder presentations with actionable insights

### 💾 **Offline-First Design**
- Works without internet connection
- Your data stays on your computer
- Fast performance with local processing

## 💻 System Requirements

- **Operating System**: macOS 10.15+, Windows 10+, or Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space
- **Python**: 3.11 or higher
- **Node.js**: 18 or higher
- **Internet**: Required for initial setup (downloading dependencies)

## 📋 Data Format

StorePulse works with your existing store data. Prepare a CSV, Excel (`.xlsx`/`.xls`), or JSON file with:

| Column | Required | Description |
|--------|----------|-------------|
| event_date | ✅ | Date in YYYY-MM-DD format |
| visits | ✅ | Daily visitor count |
| weather | ❌ | Weather conditions (optional) |
| promo_type | ❌ | Promotion type (optional) |
| sales | ❌ | Daily sales (optional) |

**Sample Data:**
```csv
event_date,visits,weather,promo_type
2024-01-01,150,sunny,none
2024-01-02,165,cloudy,promo_a
2024-01-03,180,rainy,none
```
Uploaders automatically convert Excel or JSON files into this structure before persisting them.

## 🔧 Troubleshooting

### Common Issues and Solutions

**"git: command not found"**
- **macOS/Linux**: Install Git from https://git-scm.com/downloads
- **Windows**: Install Git from https://git-scm.com/download/win
- After installing, restart your terminal/command prompt

**"python: command not found" or "python3: command not found"**
- Install Python from https://www.python.org/downloads/
- **Important**: During installation, check "Add Python to PATH"
- Restart your terminal after installation

**"node: command not found"**
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

**"Permission denied" (macOS/Linux)**
```bash
chmod +x scripts/*.sh
chmod +x *.sh
```

**"Scripts cannot be loaded" (Windows)**
```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Port already in use**
- **macOS/Linux**: 
  ```bash
  # Kill process on port 9000
  lsof -ti:9000 | xargs kill -9
  # Kill process on port 5173
  lsof -ti:5173 | xargs kill -9
  ```
- **Windows**:
  ```cmd
  # Find and kill process on port 9000
  netstat -ano | findstr :9000
  taskkill /PID <PID_NUMBER> /F
  
  # Find and kill process on port 5173
  netstat -ano | findstr :5173
  taskkill /PID <PID_NUMBER> /F
  ```

**Dependencies won't install**
```bash
# Make sure virtual environment is activated
# macOS/Linux:
source api_venv/bin/activate

# Windows:
.\api_venv\Scripts\Activate.ps1

# Then reinstall:
pip install -r api/requirements.txt
cd src
npm install
```

**App won't start after setup**
1. Make sure you're in the StorePulse directory: `cd StorePulse`
2. Make sure virtual environment is activated (see above)
3. Try running setup again: `./scripts/bootstrap_env.sh` (or `.\scripts\bootstrap_env.ps1` on Windows)

**Still having issues?**
- Check [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md) for detailed troubleshooting
- Make sure all prerequisites are installed correctly
- Verify Python and Node.js versions meet requirements

## 👨‍💻 For Developers

**Want to contribute or customize StorePulse?**

- 🚀 **Quick Start**: See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide
- 📖 **Full Guide**: Check out our comprehensive [Developer Setup Guide](DEVELOPER_SETUP.md)
- 🔧 **API Documentation**: See [docs/API.md](docs/API.md)

**Manual Setup (if automated setup fails):**
```bash
# Clone repository
git clone https://github.com/shenzc7/StorePulse.git
cd StorePulse

# Create Python virtual environment
python3 -m venv api_venv

# Activate virtual environment
# macOS/Linux:
source api_venv/bin/activate
# Windows:
.\api_venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r api/requirements.txt

# Install frontend dependencies
cd src
npm install
cd ..

# Run the application
./dev.sh  # or .\dev.sh on Windows
```

## 🛠️ Developer Setup

### macOS - Automated Setup (Recommended) ⚡

**One command to install everything (FIXED & TESTED):**

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/shenzc7/StorePulse/main/SETUP_MACOS.sh)"
```

This installs:
- Homebrew (package manager)
- Python 3.13
- Node.js 20
- Rust/Cargo (required for Tauri)
- Git
- All project dependencies (with automatic version fixing)
- Configures PYTHONPATH and environment variables
- Starts the application

**Recent Fixes (Nov 2025):**
- ✅ Fixed Python import errors
- ✅ Fixed Tauri version mismatches (2.0.0 lock)
- ✅ Fixed Node.js PATH configuration
- ✅ Added comprehensive error handling

See [QUICK_INSTALL_MACOS.md](QUICK_INSTALL_MACOS.md) for more details.

### Manual Setup

#### Backend Dependencies
- Python 3.11+ with the packages listed in `api/requirements.txt` (install via `pip install -r api/requirements.txt`)
- `psutil` powers system health telemetry exposed on the Settings page.
- `openpyxl` and `xlrd` enable native Excel import/export pathways without round-tripping through external tooling.

#### Frontend Configuration
- Set `VITE_API_BASE_URL` to override the default `http://127.0.0.1:9000` API origin when packaging or proxying through another port.
  ```bash
  # Example
  export VITE_API_BASE_URL="http://192.168.0.20:9000"
  npm run dev
  ```
- If unset, the client automatically falls back to `127.0.0.1:9000` (or `localhost`) and uses Tauri's injected base URL when running as a desktop bundle.

#### Prerequisites
- **Rust/Cargo** (REQUIRED for Tauri): Install from [rustup.rs](https://rustup.rs/) or run:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  source ~/.cargo/env
  ```

See [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md) for detailed setup instructions.

## 🎯 How It Works - The NB-INGARCH Approach

### The Forecasting Process
1. **Upload Data**: Import your historical visit data (CSV format - date and visits)
2. **Train NB-INGARCH Model**: Estimates Negative Binomial INGARCH parameters via maximum likelihood
   - **Conditional Mean**: μ_t = β₀ + Σ βᵢ y_{t-i} + Σ γⱼ x_t,j (captures AR patterns + exogenous effects)
   - **Volatility Dynamics**: φ_t = α₀ + Σ αᵢ (ε²_{t-i}/μ_{t-i}) (GARCH-style dispersion clustering)
   - **Count Distribution**: Y_t ~ NegBin(μ_t, φ_t) (handles overdispersed arrival counts)
3. **Generate Forecasts**: NB-INGARCH predicts daily arrivals with realistic uncertainty bands
4. **Business Recommendations**: Staffing and inventory suggestions based on forecasts + variance
5. **Export Reports**: Professional PDFs for stakeholders

### Why NB-INGARCH?
**Traditional forecasting methods fail for retail footfall because:**
- Simple averages ignore time dynamics and seasonality
- Linear regression can't capture volatility clustering (weekends vs weekdays)
- Poisson models assume variance = mean (violated in retail: variance >> mean)
- ML models (Random Forest, XGBoost) treat observations as independent (ignoring time dependencies)

**NB-INGARCH solves these issues:**
- ✅ Captures autoregressive dynamics (past arrivals predict future arrivals)
- ✅ Models volatility clustering (weekend variance ≠ weekday variance)
- ✅ Handles overdispersion (variance >> mean in retail footfall)
- ✅ Incorporates exogenous business drivers (weather, promotions, holidays)
- ✅ Provides realistic uncertainty bands for operational planning

### Understanding Forecasts
StorePulse provides three prediction levels:
- **P10**: Conservative estimate (10% chance of fewer visits)
- **P50**: Most likely outcome (50% chance)
- **P90**: Optimistic estimate (10% chance of more visits)

Use these bands to plan staffing for best/worst/most likely scenarios.

## ❓ Frequently Asked Questions

### Data & Privacy
**Q: Is my data secure?**
A: Yes! StorePulse works completely offline. Your data never leaves your computer and is stored locally in a secure SQLite database.

**Q: What if my data format is different?**
A: StorePulse is flexible. Contact support if your CSV format differs from the standard template.

**Q: How much historical data do I need?**
A: Minimum 30 days recommended, 90+ days preferred for better accuracy.

### Technical Questions
**Q: Does it work on older computers?**
A: Requires modern hardware (see system requirements). Contact IT for compatibility questions.

**Q: Can multiple users share the same installation?**
A: Each user should have their own installation to maintain data privacy.

**Q: How often should I retrain models?**
A: Retrain monthly or when you have significant new data (100+ new days).

### Support & Troubleshooting
**Q: The app won't start**
A: 
1. Make sure you've completed the setup steps above
2. Check that Python and Node.js are installed correctly
3. Try running `./dev.sh` again (or `.\dev.sh` on Windows)
4. See [Troubleshooting](#-troubleshooting) section above

**Q: Forecasts look wrong**
A: Verify your data format and consider retraining with more recent data. Make sure your CSV has the required columns.

**Q: Need help with data preparation?**
A: Check the sample files in `data/samples/` folder. They show the correct format.

**Q: Can't clone the repository**
A: 
- Make sure Git is installed (see Prerequisites above)
- Try using GitHub Desktop instead (easier for beginners)
- Check your internet connection

**Q: Setup script fails**
A:
- Make sure Python 3.11+ and Node.js 18+ are installed
- Check that you have internet connection (needed to download packages)
- Try running the manual setup steps instead

## 📞 Getting Help

### Documentation
- **User Manual**: See [docs/User_Manual.md](docs/User_Manual.md) for detailed usage instructions
- **API Documentation**: See [docs/API.md](docs/API.md) for API details
- **Developer Guide**: See [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md) for development setup

### Quick Links
- **Repository**: https://github.com/shenzc7/StorePulse
- **Issues**: If you find a bug, please open an issue on GitHub
- **Questions**: Check the [Troubleshooting](#-troubleshooting) section above first

### Version Information
- **Current Version**: StorePulse v1.0.1
- **Release Date**: October 2025
- **Compatibility**: macOS 10.15+, Windows 10+

---

## 📝 Summary

**To get started:**
1. ✅ Install Python 3.11+ and Node.js 18+
2. ✅ Clone: `git clone https://github.com/shenzc7/StorePulse.git`
3. ✅ Setup: `./scripts/bootstrap_env.sh` (or `.\scripts\bootstrap_env.ps1` on Windows)
4. ✅ Run: `./dev.sh` (or `.\dev.sh` on Windows)
5. ✅ Use the app!

**That's it!** The app will open automatically and you can start uploading data and generating forecasts.

---

*"Know tomorrow's visits. Act today."*

StorePulse empowers retail managers with data-driven insights to optimize staffing, inventory, and operations. Built for the real world, offline-first, and designed for business impact.
