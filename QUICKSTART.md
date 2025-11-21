# StorePulse - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Python (need 3.11+)
python3 --version

# Check Node.js (need 18+)
node --version

# Check npm
npm --version
```

## Installation

### macOS/Linux
```bash
# 1. Clone repository
git clone https://github.com/shenzc7/StorePulse.git
cd StorePulse

# 2. Run bootstrap script
chmod +x scripts/bootstrap_env.sh
./scripts/bootstrap_env.sh

# 3. Run the app
./dev.sh
```

### Windows
```powershell
# 1. Clone repository
git clone https://github.com/shenzc7/StorePulse.git
cd StorePulse

# 2. Run bootstrap script
.\scripts\bootstrap_env.ps1

# 3. Run the app
.\dev.sh
```

## What Happens Next?

1. ✅ Bootstrap script installs all dependencies
2. ✅ Backend API starts on `http://localhost:9000`
3. ✅ Frontend dev server starts on `http://localhost:5173`
4. ✅ Tauri desktop app opens automatically

## First Steps

1. **Upload Data**: Go to Data page and upload a CSV file
   - Sample files available in `data/samples/`
   - Required columns: `event_date`, `visits`

2. **Train Model**: Go to Train page and click "Train Model"
   - This builds the forecasting model from your data
   - Takes 1-2 minutes depending on data size

3. **View Forecasts**: Go to Forecasts page
   - See 14-day predictions with confidence intervals

4. **Export Reports**: Go to Reports page
   - Generate PDF reports for stakeholders

## Troubleshooting

**Script won't run?**
```bash
chmod +x scripts/*.sh
chmod +x *.sh
```

**Port already in use?**
```bash
# Kill process on port 9000 (backend)
lsof -ti:9000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

**Dependencies not installing?**
```bash
# Make sure virtual environment is activated
source api_venv/bin/activate

# Reinstall Python dependencies
pip install -r api/requirements.txt

# Reinstall frontend dependencies
cd src
rm -rf node_modules package-lock.json
npm install
```

## Need More Help?

- 📖 Full guide: [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md)
- 📚 User manual: [docs/User_Manual.md](docs/User_Manual.md)
- 🔧 API docs: [docs/API.md](docs/API.md)

---

**That's it! Happy coding! 🚀**

