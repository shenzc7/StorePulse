# StorePulse v1.0.1

"Know tomorrow's visits. Act today." StorePulse is a professional desktop application for retail forecasting that predicts store traffic patterns and provides actionable staffing and inventory recommendations. Built for retail managers who need data-driven insights to optimize operations and staffing decisions.

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

## 🚀 Installation

### System Requirements
- **macOS**: 10.15 or later
- **Windows**: 10 or later (64-bit)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space

### Quick Start
1. **Download**: Get StorePulse from your IT department or download link
2. **Install**: Double-click the installer file
   - macOS: Open StorePulse.app
   - Windows: Run StorePulse.exe
3. **Launch**: Click the StorePulse icon on your desktop

### First Time Setup
1. **Upload Your Data**: Click "Data" and upload your historical visit data (CSV format)
2. **Train Models**: Click "Train" to build forecasting models from your data
3. **View Forecasts**: See 14-day predictions with staffing recommendations
4. **Export Reports**: Generate PDF reports for your team

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

## 👨‍💻 For Developers

**Want to contribute or run StorePulse locally?** 

- 🚀 **Quick Start**: See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide
- 📖 **Full Guide**: Check out our comprehensive [Developer Setup Guide](DEVELOPER_SETUP.md)

Quick start for developers:
```bash
# Clone the repository
git clone <your-repo-url>
cd StorePulse

# Run automated setup (macOS/Linux)
./scripts/bootstrap_env.sh

# Or manual setup
python3 -m venv api_venv
source api_venv/bin/activate
pip install -r api/requirements.txt
cd src && npm install && cd ..

# Run the application
./dev.sh
```

See [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md) for detailed instructions, troubleshooting, and development workflow.

## 🛠️ Environment Setup

### Backend Dependencies
- Python 3.11+ with the packages listed in `api/requirements.txt` (install via `pip install -r api/requirements.txt`)
- `psutil` powers system health telemetry exposed on the Settings page.
- `openpyxl` and `xlrd` enable native Excel import/export pathways without round-tripping through external tooling.

### Frontend Configuration
- Set `VITE_API_BASE_URL` to override the default `http://127.0.0.1:9000` API origin when packaging or proxying through another port.
  ```bash
  # Example
  export VITE_API_BASE_URL="http://192.168.0.20:9000"
  npm run dev
  ```
- If unset, the client automatically falls back to `127.0.0.1:9000` (or `localhost`) and uses Tauri's injected base URL when running as a desktop bundle.

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
A: Check system requirements and ensure antivirus isn't blocking the application.

**Q: Forecasts look wrong**
A: Verify your data format and consider retraining with more recent data.

**Q: Need help with data preparation?**
A: Contact your IT team or use the sample data templates provided.

## 📞 Support

### Getting Help
- **Documentation**: Check the User Manual (User_Manual.pdf) for detailed instructions
- **IT Support**: Contact your IT department for technical issues
- **Training**: Request training sessions for your team

### Version Information
- **Current Version**: StorePulse v1.0.1
- **Release Date**: October 2025
- **Compatibility**: macOS 10.15+, Windows 10+

---

*"Know tomorrow's visits. Act today."*

StorePulse empowers retail managers with data-driven insights to optimize staffing, inventory, and operations. Built for the real world, offline-first, and designed for business impact.
