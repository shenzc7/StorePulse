# StorePulse File-by-File Documentation Index

This index provides comprehensive documentation for every file in the StorePulse project, including file type, programming language, purpose, methods used, and key functionality.

## Frontend Application Files (`storepulse/app/`)

### Core Application Files

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `src/main.tsx` | Entry Point | TypeScript | React application bootstrap | createRoot, render, StrictMode |
| `src/App.tsx` | Component | TypeScript | Root application component | BrowserRouter, Routes, Route configuration |
| `src/router.tsx` | Configuration | TypeScript | Application routing setup | createBrowserRouter, Route definitions |
| `src/env.d.ts` | Type Definitions | TypeScript | Environment variable types | Vite environment declarations |

### Page Components (`pages/`)

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `pages/Home/` | Page Component | TypeScript | Dashboard with overview metrics | useMetrics, AccuracyMeter, StatusDock |
| `pages/Data/` | Page Component | TypeScript | Data upload and management | File upload, validation, schema checking |
| `pages/Train/` | Page Component | TypeScript | Model training interface | Training mode selection, progress tracking |
| `pages/Forecast/` | Page Component | TypeScript | Forecast visualization | Chart rendering, prediction intervals |
| `pages/Lab/` | Page Component | TypeScript | What-if scenario testing | Scenario configuration, comparison views |
| `pages/Reports/` | Page Component | TypeScript | Export functionality | PDF generation, download management |
| `pages/Settings/` | Page Component | TypeScript | Application configuration | Settings management, preferences |

### UI Components (`components/`)

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `components/AccuracyMeter/` | UI Component | TypeScript | Forecast accuracy visualization | SVG rendering, percentage calculations |
| `components/ActionCard/` | UI Component | TypeScript | Call-to-action cards | Click handlers, navigation triggers |
| `components/StatusDock/` | UI Component | TypeScript | Real-time status indicators | WebSocket connections, state updates |
| `components/UploadBox/` | UI Component | TypeScript | File upload interface | Drag-and-drop, validation feedback |
| `components/WhatIfPanel/` | UI Component | TypeScript | Scenario analysis controls | Form inputs, calculation triggers |
| `components/ExportPlan/` | UI Component | TypeScript | Export configuration | Download triggers, format selection |

### State Management (`stores/`)

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `stores/` | State Store | TypeScript | Zustand state management | Store creation, state updates, selectors |

### Tauri Integration (`src-tauri/`)

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `src/main.rs` | Entry Point | Rust | Tauri application bootstrap | tauri::Builder, app configuration |
| `Cargo.toml` | Configuration | TOML | Rust dependencies | Package metadata, dependency management |
| `tauri.conf.json` | Configuration | JSON | Tauri application config | Window settings, security policies |

## Backend API Files (`storepulse/api/`)

### Core Application Files

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `main.py` | Web Server | Python | FastAPI application entry point | FastAPI app creation, CORS middleware, route registration |
| `pyproject.toml` | Configuration | TOML | Python project configuration | Dependencies, build settings, metadata |
| `requirements.txt` | Dependencies | Text | Python package requirements | Package versions and dependencies |

### Core Modules (`core/`)

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `core/db.py` | Database Layer | Python | SQLite database management | Connection pooling, migrations, CRUD operations |
| `core/schemas.py` | Data Models | Python | Pydantic data validation | Schema definitions, validation rules |
| `core/feats.py` | Feature Engineering | Python | Feature extraction and processing | Lag creation, encoding, scaling |
| `core/forecast_service.py` | Forecasting | Python | Forecast generation and caching | Model loading, prediction, caching |
| `core/metrics.py` | Evaluation | Python | Model performance metrics | Accuracy calculations, validation |
| `core/calibrate.py` | Calibration | Python | Prediction interval calibration | Conformal prediction, coverage validation |

### API Routes (`routes/`)

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `routes/train.py` | API Routes | Python | Model training endpoints | File upload, data validation, ML orchestration |
| `routes/forecast.py` | API Routes | Python | Forecast generation endpoints | Prediction requests, result formatting |
| `routes/data.py` | API Routes | Python | Data management endpoints | CRUD operations, validation |
| `routes/whatif.py` | API Routes | Python | Scenario analysis endpoints | Scenario processing, comparison |
| `routes/export.py` | API Routes | Python | Report generation endpoints | PDF creation, file serving |
| `routes/files.py` | API Routes | Python | File handling utilities | Upload processing, validation |
| `routes/backtest.py` | API Routes | Python | Historical evaluation endpoints | Backtesting, performance analysis |
| `routes/metrics.py` | API Routes | Python | Metrics and monitoring endpoints | Performance tracking, health checks |

## Machine Learning Files (`storepulse/ml/`)

### Training Modules

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `train_ingarch.py` | ML Training | Python | INGARCH model training | Time series modeling, volatility clustering |
| `train_nb_arx.py` | ML Training | Python | Negative Binomial ARX baseline | Baseline model implementation |
| `train_pymc_nb.py` | ML Training | Python | PyMC probabilistic modeling | Bayesian inference, uncertainty quantification |
| `booster_gbm.py` | ML Training | Python | LightGBM residual boosting | Gradient boosting, residual prediction |

### Evaluation Modules

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `backtest.py` | Evaluation | Python | Historical performance testing | Cross-validation, error analysis |
| `baselines.py` | Evaluation | Python | Baseline model implementations | Simple benchmarks, comparison methods |

## Configuration Files

### Build and Development

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `scripts/build_mac.sh` | Build Script | Bash | macOS application packaging | Build pipeline orchestration |
| `scripts/build_win.ps1` | Build Script | PowerShell | Windows application packaging | Build pipeline orchestration |
| `scripts/bootstrap_env.sh` | Setup Script | Bash | Development environment setup | Dependency installation |
| `scripts/dev_run.sh` | Development Script | Bash | Development server orchestration | Process management |

### Application Configuration

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `app/package.json` | Configuration | JSON | Node.js dependencies and scripts | Build commands, dependency management |
| `app/vite.config.ts` | Configuration | TypeScript | Vite build configuration | Development server, build settings |
| `app/tailwind.config.ts` | Configuration | TypeScript | Tailwind CSS styling | Theme configuration, plugin setup |
| `app/tsconfig.json` | Configuration | JSON | TypeScript compiler settings | Compilation rules, module resolution |

## Data Files (`storepulse/data/`)

### Sample Datasets

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `samples/lite_sample.csv` | Data File | CSV | Basic visit data sample | Date, visits columns |
| `samples/pro_sample.csv` | Data File | CSV | Enhanced feature data sample | Multiple feature columns |
| `samples/generate_realistic_data.py` | Data Generator | Python | Sample data creation script | Random data generation |

### Holiday Calendars

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `holidays/regional_holidays.csv` | Data File | CSV | Holiday date reference | Date, holiday name, region |

## Test Files (`storepulse/tests/`)

### Quality Gates

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `test_quality_gates.py` | Test Suite | Python | Business reliability validation | sMAPE calculations, calibration testing |
| `test_end_to_end.py` | Integration Tests | Python | Complete workflow testing | Full pipeline validation |
| `test_integration.py` | Integration Tests | Python | Component interaction testing | API endpoint testing |
| `test_schema.py` | Validation Tests | Python | Data schema validation | Pydantic model testing |

## Documentation Files

### Project Documentation

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `ABSTRACT.md` | Documentation | Markdown | Project mission and scope | Requirements specification |
| `README.md` | Documentation | Markdown | Project overview and setup | Installation instructions |
| `DECISIONS.md` | Documentation | Markdown | Architectural decision log | Design rationale |
| `RELEASE_NOTES_v1.0.0.md` | Documentation | Markdown | Version release information | Feature descriptions |

### User Documentation

| File Path | Type | Language | Purpose | Key Methods/Functions |
|-----------|------|----------|---------|----------------------|
| `docs/README.md` | Documentation | Markdown | Technical documentation | API reference, methodology |
| `docs/User_Manual.md` | Documentation | Markdown | End-user guide | Feature explanations, workflows |
| `docs/DemoScript_v2.txt` | Documentation | Text | Demonstration script | Step-by-step demo guide |

## Key Programming Languages Summary

### Python Files
- **Framework**: FastAPI for web API, Pydantic for data validation
- **Data Processing**: pandas, numpy for data manipulation
- **Machine Learning**: PyMC, LightGBM, statsmodels for modeling
- **Database**: sqlite3 for data persistence
- **Testing**: pytest for unit and integration testing

### TypeScript Files
- **Framework**: React for UI components, Vite for build tooling
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: Zustand for application state
- **Type Safety**: TypeScript for compile-time type checking

### Rust Files
- **Framework**: Tauri for cross-platform desktop application
- **Desktop Integration**: System tray, file dialogs, native menus

### Configuration Files
- **JSON**: Package configurations, build settings
- **TOML**: Python project metadata, Rust dependencies
- **Shell Scripts**: Build automation, development workflows

## Methods and Algorithms Used

### Machine Learning Pipeline
1. **INGARCH Models**: Integer-valued GARCH for time series with volatility clustering
2. **PyMC Modeling**: Bayesian inference for uncertainty quantification
3. **LightGBM Boosting**: Gradient boosting for residual prediction
4. **Conformal Prediction**: Distribution-free calibration for prediction intervals

### Data Processing Methods
1. **Feature Engineering**: Lag variables, holiday indicators, trend decomposition
2. **Outlier Detection**: Statistical methods for data quality validation
3. **Time Series Analysis**: Seasonal decomposition, autocorrelation analysis

### Quality Assurance Methods
1. **sMAPE Calculation**: Symmetric Mean Absolute Percentage Error
2. **Calibration Testing**: Prediction interval coverage validation
3. **Performance Benchmarking**: Cold start time measurement

## File Organization Patterns

### Modular Architecture
- **Separation of Concerns**: Clear boundaries between UI, API, ML, and data layers
- **Reusable Components**: Shared utilities and common functionality
- **Configuration Management**: Centralized settings and build configuration

### Development Workflow
- **Build Automation**: One-click builds for multiple platforms
- **Quality Gates**: Automated testing integrated into build pipeline
- **Documentation Integration**: Living documentation that evolves with code

### Data Flow Architecture
- **Offline-First Design**: Local storage and processing, no external dependencies
- **Progressive Enhancement**: Core functionality works without advanced features
- **Caching Strategy**: Intelligent caching for performance optimization

This comprehensive index provides complete visibility into every aspect of the StorePulse codebase, enabling effective maintenance, debugging, and future development.
