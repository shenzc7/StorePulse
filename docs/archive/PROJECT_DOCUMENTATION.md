# StorePulse Project Documentation

## Project Overview

**StorePulse** is a comprehensive retail forecasting application that predicts store visits for the next 14 days and converts these predictions into actionable staffing and inventory recommendations. The application operates entirely offline with local data storage and processing.

### Core Features
- **Offline-First Architecture**: No internet connectivity required after installation
- **14-Day Visit Forecasting**: Machine learning-powered predictions with uncertainty bands
- **Staffing Recommendations**: Shift-level guidance based on forecasted visit patterns
- **Inventory Planning**: SKU-level stocking actions derived from predictions
- **What-If Analysis**: Scenario testing for promotions, weather, and competitive factors
- **Professional Exports**: PDF reports for executive stakeholders

### Technical Stack
- **Frontend**: Tauri + React (Vite) with TypeScript, Tailwind CSS, Radix UI
- **Backend**: FastAPI (Python) with SQLite database
- **Machine Learning**: PyMC, LightGBM, INGARCH models with conformal calibration
- **Desktop Packaging**: Native binaries for macOS (.app) and Windows (.exe)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tauri Desktop Shell                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 React Frontend (Vite)                   │    │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │    │
│  │  │Home │ │Data │ │Train│ │Forecast│ │Lab  │ │Reports│    │    │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼───────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │   FastAPI     │ │  SQLite   │ │   ML      │
        │   Backend     │ │ Database  │ │  Models   │
        └───────────────┘ └───────────┘ └───────────┘
```

## File Structure Documentation

### 1. Frontend Application (`storepulse/app/`)
**Technology**: Tauri + React + TypeScript + Vite
**Purpose**: Desktop application interface and user interactions

#### Key Directories:
- **`src/`**: Main application source code
  - `App.tsx`: Root application component with routing
  - `main.tsx`: Electron/Tauri entry point
  - `router.tsx`: Page routing configuration
  - `stores/`: State management (Zustand/Pinia style)
  - `hooks/`: Custom React hooks for API calls
  - `lib/`: Utility functions and configurations

- **`pages/`**: Main application pages
  - `Home/`: Dashboard with overview metrics and quick actions
  - `Data/`: Data upload and management interface
  - `Train/`: Model training configuration and execution
  - `Forecast/`: Forecast visualization and analysis
  - `Lab/`: What-if scenario testing interface
  - `Reports/`: Export functionality and report generation
  - `Settings/`: Application configuration

- **`components/`**: Reusable UI components
  - `AccuracyMeter/`: Forecast accuracy visualization
  - `ActionCard/`: Call-to-action cards for main workflows
  - `StatusDock/`: Real-time status and progress indicators
  - `UploadBox/`: File upload interface with validation
  - `WhatIfPanel/`: Scenario analysis controls
  - `ExportPlan/`: Export configuration and download

- **`src-tauri/`**: Rust backend for Tauri desktop shell
  - `main.rs`: Tauri application entry point
  - `Cargo.toml`: Rust dependencies and configuration
  - `tauri.conf.json`: Tauri application configuration

### 2. Backend API (`storepulse/api/`)
**Technology**: FastAPI (Python)
**Purpose**: REST API server for data processing and ML orchestration

#### Core Modules:
- **`main.py`**: FastAPI application setup and route registration
- **`core/`**: Business logic and data processing
  - `db.py`: Database connection and schema management
  - `feats.py`: Feature engineering for ML models
  - `forecast_service.py`: Forecast generation and caching
  - `metrics.py**: Model evaluation and performance metrics
  - `schemas.py`: Pydantic data validation schemas
  - `calibrate.py`: Conformal prediction calibration

#### API Routes (`routes/`):
- **`data.py`**: Data upload, validation, and management endpoints
- **`train.py`**: Model training orchestration with progress tracking
- **`forecast.py`**: Forecast generation and retrieval endpoints
- **`whatif.py`**: Scenario analysis and comparison endpoints
- **`export.py`**: PDF report generation and download
- **`files.py`**: File upload and management utilities
- **`backtest.py`**: Historical model performance evaluation
- **`metrics.py`**: Real-time metrics and monitoring endpoints

### 3. Machine Learning (`storepulse/ml/`)
**Technology**: Python with PyMC, LightGBM, Statsmodels
**Purpose**: Model training, evaluation, and forecasting

#### Training Pipeline:
- **`train_ingarch.py`**: INGARCH model training for visit forecasting
- **`train_nb_arx.py`**: Negative Binomial ARX baseline models
- **`train_pymc_nb.py`**: PyMC probabilistic modeling with uncertainty quantification
- **`booster_gbm.py`**: LightGBM residual boosting for Pro mode
- **`backtest.py`**: Historical performance evaluation and validation
- **`baselines.py`**: Baseline model implementations for comparison

#### Model Artifacts (`artifacts/`):
- **`lite/`**: Lightweight model configurations and weights
- **`pro/`**: Professional model configurations with enhanced features

### 4. Data Layer (`storepulse/data/`)
**Purpose**: Sample datasets, holiday calendars, and database files

- **`samples/`**: Example datasets for testing and demonstrations
  - `lite_sample.csv`: Basic visit data format
  - `pro_sample.csv`: Enhanced dataset with additional features
- **`holidays/`**: Regional holiday calendars for feature engineering
- **`storepulse.db`**: SQLite database for data persistence

### 5. Quality Assurance (`storepulse/tests/`)
**Purpose**: Automated testing and quality gate enforcement

- **`test_quality_gates.py`**: Business reliability validation tests
- **`test_end_to_end.py`**: Complete workflow integration tests
- **`test_integration.py`**: Component interaction testing
- **`test_schema.py`**: Data validation and robustness testing

### 6. Build System (`scripts/`)
**Purpose**: Automated build, deployment, and development tooling

- **`build_mac.sh`**: Complete macOS application packaging
- **`build_win.ps1`**: Complete Windows application packaging
- **`bootstrap_env.sh/ps1`**: Development environment setup
- **`dev_run.sh`**: Development server orchestration
- **`run_quality_gates.sh/ps1`**: Quality gate execution

## Programming Languages Used

| Component | Primary Language | Secondary Languages |
|-----------|------------------|-------------------|
| Frontend UI | TypeScript (.tsx) | JavaScript, CSS, HTML |
| Tauri Shell | Rust (.rs) | JSON (config) |
| Backend API | Python (.py) | JSON (schemas) |
| ML Models | Python (.py) | - |
| Database | SQL (SQLite) | - |
| Build Scripts | Bash (.sh) | PowerShell (.ps1) |
| Tests | Python (.py) | - |
| Configuration | JSON, TOML | YAML, INI |

## Key Methods and Algorithms

### Machine Learning Pipeline:
1. **INGARCH Models**: Integer-valued GARCH for time series forecasting with volatility clustering
2. **PyMC Negative Binomial**: Bayesian modeling for uncertainty quantification
3. **LightGBM Boosting**: Gradient boosting for residual prediction in Pro mode
4. **Conformal Prediction**: Distribution-free calibration for reliable prediction intervals

### Data Processing:
1. **Feature Engineering**: Lagged variables, holiday indicators, trend decomposition
2. **Outlier Detection**: Statistical methods for data quality validation
3. **Time Series Decomposition**: Trend, seasonality, and residual separation

### Quality Gates:
1. **sMAPE Calculation**: Symmetric Mean Absolute Percentage Error for model comparison
2. **Calibration Testing**: Prediction interval coverage validation
3. **Performance Benchmarking**: Cold start time measurement and optimization

## File-by-File Documentation Index

This section provides detailed documentation for each major file in the project:

### Frontend Files:
- **Application Entry**: `storepulse/app/src/main.tsx`, `storepulse/app/src/App.tsx`
- **Routing**: `storepulse/app/src/router.tsx`
- **State Management**: `storepulse/app/src/stores/*`
- **API Integration**: `storepulse/app/src/hooks/*`
- **Page Components**: `storepulse/app/pages/*/*`
- **UI Components**: `storepulse/app/components/*/*`

### Backend Files:
- **API Server**: `storepulse/api/main.py`
- **Database Layer**: `storepulse/api/core/db.py`, `storepulse/api/core/schemas.py`
- **Business Logic**: `storepulse/api/core/feats.py`, `storepulse/api/core/forecast_service.py`
- **Route Handlers**: `storepulse/api/routes/*.py`

### ML Pipeline Files:
- **Model Training**: `storepulse/ml/train_*.py`
- **Evaluation**: `storepulse/ml/backtest.py`, `storepulse/ml/baselines.py`

### Configuration Files:
- **Package Management**: `storepulse/api/pyproject.toml`, `storepulse/app/package.json`
- **Build Configuration**: `storepulse/app/tauri.conf.json`, `storepulse/app/vite.config.ts`
- **Dependencies**: `storepulse/api/requirements.txt`

## Development Workflow

### Environment Setup:
1. **Bootstrap**: Run `scripts/bootstrap_env.sh` (macOS) or `scripts/bootstrap_env.ps1` (Windows)
2. **Development Server**: Execute `scripts/dev_run.sh` to start both frontend and backend
3. **Database**: SQLite database automatically initialized on first run

### Training Modes:
- **Fast Mode**: Quick training for demos and testing (~400 samples)
- **Full Mode**: Production-quality training for stakeholders (~1200 samples)

### Quality Gates:
- **Automated**: Run during builds and before deployments
- **Business-Critical**: Must pass for application to be considered production-ready
- **Comprehensive**: Cover accuracy, performance, calibration, and robustness

## Deployment

### Build Process:
1. **Quality Gates**: All tests must pass before packaging begins
2. **Frontend Build**: React application compiled with Vite
3. **Tauri Packaging**: Native desktop application bundle created
4. **Verification**: Application launch tested automatically
5. **Distribution**: Binaries copied to standard locations

### Output Artifacts:
- **macOS**: `StorePulse.app` (native application bundle)
- **Windows**: `StorePulse.exe` (standalone executable)

## Business Impact

StorePulse enables retail operators to:
- **Reduce Labor Costs**: Optimal staffing based on predicted visit patterns
- **Improve Inventory Management**: Stock levels aligned with forecasted demand
- **Enhance Customer Experience**: Adequate staffing during peak periods
- **Support Strategic Planning**: Data-driven decisions for operational improvements

The application provides a complete forecasting-to-action pipeline that transforms historical visit data into actionable operational guidance.
