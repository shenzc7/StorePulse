# StorePulse v1.0.1

"Know tomorrow's visits. Act today." StorePulse is a professional desktop application for retail forecasting that predicts store traffic patterns and provides actionable staffing and inventory recommendations. Built for retail managers who need data-driven insights to optimize operations and staffing decisions.

## ✨ Key Features

### 🎯 **14-Day Visit Forecasts**
- Advanced machine learning models trained on your historical data
- Uncertainty bands (P10-P50-P90) for risk-aware planning
- Real-time predictions based on your store's patterns

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

StorePulse works with your existing store data. Prepare a CSV file with:

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

## 🎯 How It Works

### The Forecasting Process
1. **Upload Data**: Import your historical visit data (CSV format)
2. **Train Models**: StorePulse analyzes patterns in your data using advanced machine learning
3. **Generate Forecasts**: Predicts future visits with confidence intervals
4. **Business Recommendations**: Provides staffing and inventory suggestions
5. **Export Reports**: Create professional PDFs for your team

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
1. **Data Upload**: Navigate to Data page → Upload CSV file → Validation
2. **Training**: Navigate to Train page → Quick/Full accuracy toggle → Start training → Monitor SSE progress
3. **Export**: Navigate to Reports page → Export PDF → Download

### Screenshots
Visual documentation of the application interface:

| Screenshot | Description | Component Coverage |
|------------|-------------|-------------------|
| ![Home Page](docs/screenshots/01_home_page.png) | Initial application dashboard | AccuracyMeter, StatusDock, ActionCard, WhatIfPanel |
| ![Data Page](docs/screenshots/02_data_page.png) | Data upload interface | UploadBox, DataValidation |
| ![Data Uploaded](docs/screenshots/03_data_uploaded.png) | Upload success state | ValidationResults |
| ![Train Page](docs/screenshots/04_train_page.png) | Training configuration | TrainingControls, AccuracyToggle |
| ![Toggle Test](docs/screenshots/05_toggle_test.png) | Quick/Full accuracy toggle | API round-trip verification |
| ![Training Started](docs/screenshots/06_training_started.png) | Training initiation | ProgressIndicator, SSEConnection |
| ![Training Progress](docs/screenshots/07_training_progress.png) | Real-time progress monitoring | Server-Sent Events |
| ![Reports Page](docs/screenshots/08_reports_page.png) | Export functionality | ExportPlan, ReportsList |
| ![Export Initiated](docs/screenshots/09_export_initiated.png) | PDF export process | Download functionality |
| ![Final State](docs/screenshots/10_final_state.png) | Complete flow verification | End-to-end testing |

### Running UI Tests
```bash
# Run comprehensive UI smoke tests
node ui_automation.js

# Generate fresh screenshots
npm run build && npm run dev &
node ui_automation.js

# View test results
cat docs/ui_smoke_report.md
cat docs/screenshots/manifest.json
```

### Test Reports
- **Smoke Test Report**: [`docs/ui_smoke_report.md`](docs/ui_smoke_report.md) - Comprehensive test execution results
- **Screenshot Manifest**: [`docs/screenshots/manifest.json`](docs/screenshots/manifest.json) - Metadata for all captured screenshots

### Manual Testing Checklist
For manual verification when automated testing is unavailable:
- [ ] Application launches without errors
- [ ] All navigation links functional (Data, Train, Forecast, Reports, Settings)
- [ ] File upload accepts CSV and shows validation feedback
- [ ] Quick/Full accuracy toggle updates API state and UI summary
- [ ] Training process shows progress indicators
- [ ] SSE connections provide real-time updates
- [ ] PDF export generates downloadable files
- [ ] All components render without console errors

## One-Click Builds

StorePulse provides automated build scripts that handle the complete packaging pipeline from source to distributable binaries.

### Quick Start

#### macOS Build
```bash
./scripts/build_mac.sh
```

**Expected Output:**
```
🔍 Running StorePulse quality gate tests...
✅ All quality gates passed!
🔨 Building Tauri application...
🚀 Verifying StorePulse launches to Home page...
✅ StorePulse.app launch verification completed
📦 Copying binaries to /dist...
✅ StorePulse.app copied to /dist/StorePulse.app
🎉 StorePulse build completed successfully!
📍 Binaries available at: /dist/StorePulse.app
```

**Output Location:** `/dist/StorePulse.app`

#### Windows Build
```powershell
.\scripts\build_win.ps1
```

**Expected Output:**
```
🔍 Running StorePulse quality gate tests...
✅ All quality gates passed!
🔨 Building Tauri application...
🚀 Verifying StorePulse launches...
✅ StorePulse.exe launch test completed successfully
📦 Copying binaries to C:\dist...
✅ StorePulse.exe copied to: C:\dist\StorePulse.exe
🎉 StorePulse build completed successfully!
📍 Binaries available at: C:\dist\StorePulse.exe
```

**Output Location:** `C:\dist\StorePulse.exe`

### Build Pipeline

Each build script executes the complete packaging workflow:

1. **Environment Setup**: Activates virtual environment if present
2. **Frontend Build**: Compiles React application with Vite
3. **ML Training**: Trains and validates machine learning models
4. **Quality Gates**: Runs comprehensive reliability tests
5. **Tauri Build**: Packages native desktop application
6. **Launch Verification**: Confirms application launches without errors
7. **Distribution**: Copies binaries to standard distribution locations

### Distribution Artifacts

After successful builds, binaries are automatically copied to:

| Platform | Location | Format | Purpose |
|----------|----------|---------|---------|
| **macOS** | `/dist/StorePulse.app` | `.app` bundle | macOS installation package |
| **Windows** | `C:\dist\StorePulse.exe` | Standalone executable | Windows installer/executable |

### Packaging Tests

Validate packaging integrity with dedicated tests:

```bash
# Test binary existence and launch behavior
python -m pytest tests/test_packaging.py -v

# Test specific packaging aspects
python -m pytest tests/test_packaging.py::TestBinaryExistence::test_macos_app_bundle_exists -v
python -m pytest tests/test_packaging.py::TestBinaryLaunch::test_windows_exe_launch_mocked -v
```

### Troubleshooting

#### Build Fails at Quality Gates
```
Lite model fails quality gate: 5.2% improvement vs MA7 baseline is below 8% threshold.
Business impact: Lite provides no meaningful advantage over manual trend analysis.
```
**Solution**: Review model training data and parameters in `ml/` directory.

#### Binary Not Found
```
❌ ERROR: StorePulse.app not found at app/src-tauri/target/release/bundle/macos/StorePulse.app
```
**Solution**: Ensure Tauri dependencies are installed: `cd app && npm install`

#### Launch Verification Fails
```
❌ ERROR: Failed to launch StorePulse.exe - executable may be corrupted
```
**Solution**: Clean Tauri build cache: `cd app && npm run tauri dev` then rebuild

#### Error Messages
When gates fail, clear business-impact messages explain:
```
Lite model fails quality gate: 5.2% improvement vs MA7 baseline is below 8% threshold.
Business impact: Lite provides no meaningful advantage over manual trend analysis,
reducing trust in forecasting system.
```

### Gate Rationale

Each quality gate enforces specific business reliability requirements:

1. **Baseline Comparison**: Ensures ML models provide genuine value over simple statistical methods
2. **Weekend Specialization**: Validates that Pro mode justifies its complexity for high-traffic periods
3. **Calibration Reliability**: Maintains user trust in prediction intervals for decision-making
4. **Performance Budget**: Prevents user experience degradation that could reduce adoption
5. **Data Robustness**: Handles real-world data imperfections without crashes
6. **System Stability**: Ensures packaged applications work out-of-the-box

### Implementation Details

- **Test Files**: `tests/test_quality_gates.py`, `tests/test_end_to_end.py`
- **Configuration**: `pytest.ini` with quality gate markers
- **CI Integration**: Automatic execution in build pipelines
- **Documentation**: Inline comments explain business reliability importance

Refer to test files in `tests/` for exact enforcement logic and `docs/` for detailed methodology.
