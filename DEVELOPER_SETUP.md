# StorePulse - Developer Setup Guide

Welcome! This guide will help you get StorePulse up and running on your development machine.

> 💡 **Looking for a quick start?** Check out [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Python 3.11+** (3.12+ recommended)
  - Download from [python.org](https://www.python.org/downloads/)
  - Verify: `python3 --version` should show 3.11 or higher
  
- **Node.js 18+** and npm
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version` should show v18 or higher
  - Verify: `npm --version` should show 9 or higher

- **Git**
  - Download from [git-scm.com](https://git-scm.com/downloads)
  - Verify: `git --version`

### Platform-Specific Requirements

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`
- Rust (for Tauri): Will be installed automatically via npm

**Windows:**
- Visual Studio Build Tools (for native modules)
- Rust (for Tauri): Install from [rustup.rs](https://rustup.rs/)
- WebView2 runtime (usually pre-installed on Windows 10+)

**Linux:**
- Build essentials: `sudo apt-get install build-essential` (Ubuntu/Debian)
- Rust (for Tauri): Install from [rustup.rs](https://rustup.rs/)
- WebKitGTK development libraries

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd StorePulse
```

### 2. Automated Setup (Recommended)

**macOS/Linux:**
```bash
chmod +x scripts/bootstrap_env.sh
./scripts/bootstrap_env.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\bootstrap_env.ps1
```

This script will:
- ✅ Check Python and Node.js versions
- ✅ Create a Python virtual environment
- ✅ Install all Python dependencies
- ✅ Install all frontend dependencies
- ✅ Verify installation

### 3. Manual Setup (Alternative)

If you prefer manual setup or the automated script fails:

#### Step 1: Create Python Virtual Environment

**macOS/Linux:**
```bash
python3 -m venv api_venv
source api_venv/bin/activate
```

**Windows:**
```powershell
python -m venv api_venv
.\api_venv\Scripts\Activate.ps1
```

#### Step 2: Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r api/requirements.txt
```

#### Step 3: Install Frontend Dependencies

```bash
cd src
npm install
cd ..
```

### 4. Configure the Application

Copy the example config file:

```bash
cp config.example.json config.json
```

Edit `config.json` if needed (defaults work for local development).

### 5. Run the Application

**Option A: Using the dev script (with hot reload)**
```bash
./dev.sh
```

**Option B: Using the start script**
```bash
./start.sh
```

**Option C: Manual start**

Terminal 1 - Backend API:
```bash
source api_venv/bin/activate  # or `api_venv\Scripts\Activate.ps1` on Windows
uvicorn api.main:app --host 127.0.0.1 --port 9000 --reload
```

Terminal 2 - Frontend:
```bash
cd src
npm run vite-dev
```

Terminal 3 - Tauri Desktop App:
```bash
cd src
npm run tauri-dev
```

The application will open automatically. The backend API runs on `http://localhost:9000` and the frontend dev server on `http://localhost:5173`.

## 📁 Project Structure

```
StorePulse/
├── api/                    # FastAPI backend
│   ├── core/              # Core business logic
│   │   ├── db.py         # Database models and connection
│   │   ├── feats.py      # Feature engineering
│   │   ├── forecast_service.py  # Forecasting logic
│   │   └── ...
│   ├── routes/            # API endpoints
│   │   ├── data.py       # Data upload/management
│   │   ├── train.py      # Model training
│   │   ├── forecast.py    # Forecast generation
│   │   └── ...
│   ├── main.py           # FastAPI app entry point
│   └── requirements.txt  # Python dependencies
│
├── src/                   # Frontend (React + TypeScript + Tauri)
│   ├── components/       # React components
│   ├── pages/            # Page components
│   ├── src-tauri/        # Tauri Rust backend
│   ├── package.json      # Node.js dependencies
│   └── ...
│
├── ml/                    # Machine learning models
│   ├── train_ingarch.py  # NB-INGARCH model training
│   └── artifacts/        # Trained model files
│
├── data/                  # Application data
│   ├── storepulse.db     # SQLite database
│   ├── samples/          # Sample data files
│   └── ...
│
├── scripts/               # Utility scripts
│   ├── bootstrap_env.sh  # Environment setup
│   ├── dev_run.sh        # Development runner
│   └── ...
│
└── docs/                  # Documentation
```

## 🛠️ Development Workflow

### Running Tests

**Python Tests:**
```bash
source api_venv/bin/activate  # or `api_venv\Scripts\Activate.ps1` on Windows
pytest tests/
```

**Frontend Tests:**
```bash
cd src
npm test
```

### Code Quality

**Python Linting:**
```bash
source .venv/bin/activate
ruff check api/
```

**TypeScript Linting:**
```bash
cd src
npm run lint
```

### Database

The application uses SQLite stored at `data/storepulse.db`. The database is created automatically on first run.

To reset the database:
```bash
rm data/storepulse.db
# Restart the application - it will recreate the database
```

## 🔧 Troubleshooting

### Common Issues

**Issue: "Python 3.11+ required"**
- Solution: Install Python 3.11 or higher from [python.org](https://www.python.org/downloads/)

**Issue: "Node.js not found"**
- Solution: Install Node.js 18+ from [nodejs.org](https://nodejs.org/)

**Issue: "Permission denied" on scripts**
- Solution (macOS/Linux): `chmod +x scripts/*.sh`

**Issue: "Module not found" errors**
- Solution: Ensure virtual environment is activated and dependencies are installed:
  ```bash
  source api_venv/bin/activate  # or `api_venv\Scripts\Activate.ps1` on Windows
  pip install -r api/requirements.txt
  ```

**Issue: "npm install" fails**
- Solution: Clear npm cache and reinstall:
  ```bash
  cd src
  rm -rf node_modules package-lock.json
  npm cache clean --force
  npm install
  ```

**Issue: Tauri build fails (Rust errors)**
- Solution: Install Rust toolchain:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  # Restart terminal and try again
  ```

**Issue: Backend won't start (port 9000 in use)**
- Solution: Kill the process using port 9000:
  ```bash
  # macOS/Linux
  lsof -ti:9000 | xargs kill -9
  
  # Windows
  netstat -ano | findstr :9000
  taskkill /PID <PID> /F
  ```

**Issue: Frontend won't start (port 5173 in use)**
- Solution: Kill the process using port 5173 (same commands as above, replace 9000 with 5173)

### Getting Help

1. Check the [main README.md](README.md) for user documentation
2. Review [API documentation](docs/API.md) for backend API details
3. Check [docs/](docs/) folder for additional documentation
4. Review error logs:
   - Backend: `/tmp/storepulse-backend.log` (macOS/Linux) or check terminal output
   - Frontend: Check terminal output or browser console

## 📦 Building for Production

**Note:** Packaging is left to be done. For now, use development mode.

When ready to package:
- macOS: `./scripts/build_mac.sh`
- Windows: `.\scripts\build_win.ps1`

## 🔐 Environment Variables

Create a `.env` file in the project root (optional):

```env
# API Configuration
API_HOST=127.0.0.1
API_PORT=9000

# Database
DATABASE_URL=sqlite:///./data/storepulse.db

# Logging
LOG_LEVEL=INFO
```

## 📝 Development Notes

### Backend API

- FastAPI runs on `http://127.0.0.1:9000`
- API docs available at `http://127.0.0.1:9000/docs`
- Interactive API explorer at `http://127.0.0.1:9000/redoc`

### Frontend

- Vite dev server runs on `http://localhost:5173`
- Tauri desktop app connects to the dev server in development mode
- Hot reload is enabled for both frontend and backend

### Data Format

The application expects CSV files with:
- `event_date`: Date in YYYY-MM-DD format
- `visits`: Daily visitor count (required)
- Optional columns: `weather`, `promo_type`, `sales`, etc.

Sample data files are available in `data/samples/`.

## 🎯 Next Steps

1. ✅ Environment is set up
2. ✅ Application is running
3. 📖 Read the [User Manual](docs/User_Manual.md) to understand features
4. 🔍 Explore the codebase starting with `api/main.py` and `src/`
5. 🧪 Run tests to verify everything works
6. 💻 Start developing!

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

**Happy Coding! 🚀**

If you encounter any issues not covered here, please check the main [README.md](README.md) or create an issue in the repository.

