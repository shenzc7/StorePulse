# StorePulse User Manual

## "Know tomorrow's visits. Act today."

**Version 1.0.0 | Client-Ready Edition**

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
   - [macOS Installation](#macos-installation)
   - [Windows Installation](#windows-installation)
4. [Getting Started](#getting-started)
5. [Data Management](#data-management)
   - [Adding Today's Data](#adding-todays-data)
   - [Importing Historical Data](#importing-historical-data)
   - [Data Validation](#data-validation)
6. [Model Training](#model-training)
7. [Forecasting](#forecasting)
   - [Basic Forecasting](#basic-forecasting)
   - [Understanding Prediction Bands](#understanding-prediction-bands)
   - [Lite vs Pro Mode](#lite-vs-pro-mode)
8. [What-If Analysis](#what-if-analysis)
9. [Reports & Export](#reports--export)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)
12. [Support](#support)

---

## Introduction

**StorePulse** is an offline-first desktop application that forecasts store visits for the next 14 days and translates them into actionable staffing and inventory recommendations.

### Key Features

- **Offline-First**: No internet connection required after installation
- **Two Operating Modes**:
  - **Lite**: Simple daily visit counts for quick forecasting
  - **Pro**: Rich contextual data (sales, promotions, weather) for enhanced accuracy
- **Uncertainty-Aware**: P10/P50/P90 prediction bands for risk management
- **Business Intelligence**: Automatic staffing and inventory recommendations
- **What-If Lab**: Test scenarios like "What if we run a 20% off sale?"
- **Export Ready**: Professional PDF reports for executive review

### How It Works

StorePulse is powered by a production-grade **Negative Binomial INGARCH** engine:
- Captures overdispersion in retail traffic data with autoregressive + GARCH-style volatility terms
- Supports both Lite and Pro datasets with contextual drivers (promotions, weather, events)
- Generates calibrated P10/P50/P90 prediction bands directly from dispersion estimates for trustworthy planning
- Streams training progress with deterministic, offline execution so you retain full control of your data

---

## System Requirements

### Minimum Requirements
- **macOS**: 10.15 (Catalina) or later
- **Windows**: Windows 10 version 1903 or later
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space
- **Display**: 1280x800 minimum resolution

### Recommended Specifications
- **Processor**: Intel i5 or equivalent (M1/M2 for macOS)
- **RAM**: 16GB or more for Pro mode training
- **Storage**: SSD with 5GB+ free space for data storage

---

## Installation

### macOS Installation

1. **Download** the StorePulse `.dmg` file from the release package
2. **Mount** the disk image by double-clicking the `.dmg` file
3. **Drag** StorePulse.app to your Applications folder
4. **Launch** StorePulse from Applications
5. **Grant Permissions** when prompted (required for local data storage)

**First Launch Time**: ~30 seconds (models load and self-calibrate)

![macOS Installation Screenshot](docs/screenshots/macos_install.png)

### Windows Installation

1. **Download** the StorePulse `.msi` installer from the release package
2. **Run** the installer as Administrator
3. **Follow** the installation wizard
4. **Launch** StorePulse from the Start Menu or Desktop shortcut

**Note**: Windows may show a security warning on first launch. Click "More info" → "Run anyway"

![Windows Installation Screenshot](docs/screenshots/windows_install.png)

---

## Getting Started

### First Launch

1. **Welcome Screen**: Click "Get Started" to begin setup
2. **Data Check**: System validates sample data and model availability
3. **Mode Selection**: Choose Lite or Pro mode based on your data availability

### Navigation Overview

- **Home**: Dashboard with key metrics and quick actions
- **Data**: Add today's visits and import historical data
- **Train**: Train forecasting models on your data
- **Forecast**: Generate predictions and view recommendations
- **Lab**: Test What-If scenarios
- **Reports**: View exports and historical analyses
- **Settings**: Configure preferences and data paths

---

## Data Management

### Adding Today's Data

**Daily Workflow**: Add today's actual visitor count to improve model accuracy.

1. **Navigate** to Data page
2. **Click** "Add Today"
3. **Enter**:
   - Date (defaults to today)
   - Visitor count (required)
   - Pro mode: Additional context (sales, promotions, weather)

![Add Today Interface](docs/screenshots/add_today.png)

**Pro Mode Fields**:
- **Sales**: Daily revenue ($)
- **Conversion**: Sales-to-visits ratio (%)
- **Promo Type**: "none", "sale", "coupon", etc.
- **Price Change**: Percentage change from normal pricing
- **Weather**: "sunny", "rainy", "cloudy"
- **Paydays**: Boolean (regional payday timing)
- **School Breaks**: Boolean (local school schedules)
- **Local Events**: Text description of events impacting traffic
- **Open Hours**: Hours store was open that day

### Importing Historical Data

**For New Users**: Import existing visit data for immediate forecasting.

1. **Prepare a CSV, Excel (.xlsx/.xls), or JSON file** with columns:
   - `event_date` or `date` (YYYY-MM-DD format)
   - `visits` (integer, required)
   - Pro mode: Additional columns as needed

2. **Click** "Import Data" on the Data page
3. **Select** the file — StorePulse automatically validates and, when needed, converts Excel sheets to CSV
4. **Preview** the most recent rows in the export panel to confirm formatting
5. **Confirm** import (data is validated before saving)

**Sample Format** (CSV/Excel):
```csv
event_date,visits,sales,conversion,promo_type
2024-01-01,125,2500.00,0.20,sale
2024-01-02,98,1960.00,0.20,none
```

**Data Export**: The same panel lets you preview recent entries and download your dataset in CSV, JSON, or Excel format for audits or BI tools.

### Data Validation

**Automatic Checks**:
- Date format validation
- Non-negative visit counts
- Reasonable data ranges
- Duplicate date detection
- Missing value identification

**Data Quality Indicators**:
- 🟢 **Good**: 30+ days of consistent data
- 🟡 **Fair**: 14-29 days of data
- 🔴 **Poor**: <14 days (basic trend forecasting only)

---

## Model Training

### When to Train

**Automatic Triggers**:
- After importing new data
- When data quality improves significantly
- Before generating forecasts (if no recent training)

**Manual Training**: Click "Train Models" when you want to:
- Update models with new data patterns
- Switch between Lite and Pro modes
- Improve forecast accuracy

### Training Process

1. **Data Preparation**: Features extracted from historical data
2. **Model Building**: NB-INGARCH (Negative Binomial INGARCH) engine trained via maximum likelihood
3. **Uncertainty Estimation**: NB-INGARCH dispersion term generates calibrated P10/P50/P90 bands—no auxiliary Bayesian or booster stacks required
4. **Quality Gates**: Accuracy, coverage, and weekend uplift checks enforce the 8% / 20% / 80–95% thresholds before the model is saved for forecasting

**Training Time**:
- **Lite Mode**: 2-5 minutes
- **Pro Mode**: 5-15 minutes (depends on data size)

![Training Progress](docs/screenshots/training_progress.png)

### Training Quality Gates

**Automatic Validation**:
- Lite model ≥8% better than simple moving average
- Pro model ≥20% better on weekends than Lite
- Prediction intervals 80-95% reliable
- Training completes in ≤90 seconds

**Failed Gates**: System alerts and suggests fixes

---

## Forecasting

### Basic Forecasting

1. **Navigate** to Forecast page
2. **Select** mode (Lite/Pro) and horizon (1-30 days)
3. **Click** "Generate Forecast"
4. **Review** results with uncertainty bands

**Forecast Output**:
- **P10**: Conservative estimate (10% chance below)
- **P50**: Most likely outcome
- **P90**: Optimistic estimate (10% chance above)

![Forecast Results](docs/screenshots/forecast_results.png)

### Understanding Prediction Bands

**Risk Management**:
- **Staffing**: Use P90 for busy day planning
- **Inventory**: Use P50 for normal operations
- **Budgeting**: Use P10 for conservative financial planning

**Confidence Indicators**:
- **Narrow Bands**: High confidence, stable patterns
- **Wide Bands**: Lower confidence, unusual conditions

### Lite vs Pro Mode

| Feature | Lite Mode | Pro Mode |
|---------|-----------|----------|
| **Data Required** | Just visits | Visits + context |
| **Accuracy** | Good baseline | Enhanced by context |
| **Weekend Performance** | Standard | 20%+ improvement |
| **Training Time** | Faster | Slower but more accurate |
| **Use Case** | Quick forecasts | Detailed planning |

---

## What-If Analysis

### Scenario Testing

**Common Scenarios**:
- **Promotional Impact**: "What if we run a 20% off sale?"
- **Weather Effects**: "What if it rains all weekend?"
- **Competitive Pressure**: "What if a competitor opens nearby?"
- **Economic Factors**: "What if prices increase 10%?"

### Creating Scenarios

1. **Open** What-If Lab
2. **Select** baseline forecast period
3. **Choose** scenario type or create custom
4. **Adjust** scenario parameters
5. **Compare** results to baseline

![What-If Lab Interface](docs/screenshots/whatif_lab.png)

### Scenario Templates

**Pre-built Scenarios**:
- 20% Off Sale (25% visit increase)
- Rainy Weather (15% decrease)
- Payday Week (10-15% increase)
- Competitor Opening (20% decrease)
- Holiday Weekend (15% increase)
- Price Increase (10% decrease)

**Custom Scenarios**: Combine multiple factors for complex analysis

### Saving Scenarios

- **Save** scenarios for later reference
- **Export** scenario comparisons to PDF
- **Share** scenarios with team members

---

## Reports & Export

### PDF Export

**Automatic Generation**:
- **Operations Plan**: Complete forecast with staffing and inventory
- **Executive Summary**: High-level metrics and trends
- **Scenario Comparison**: What-If analysis results

**Export Contents**:
- Visit forecasts with confidence bands
- Staffing recommendations by role
- Top 5 SKU stocking suggestions
- Scenario notes and assumptions

![PDF Export Preview](docs/screenshots/pdf_export.png)

### Export Options

- **Format**: PDF (professional printing)
- **Frequency**: On-demand or scheduled
- **Sharing**: Email-ready or print-ready layouts

---

## Troubleshooting

### Common Issues

**"No Models Available"**
- **Solution**: Train models on Data page first
- **Cause**: First launch or insufficient data

**"Forecast Generation Failed"**
- **Solution**: Check data quality and retrain models
- **Cause**: Model training issues or corrupted data

**"Slow Performance"**
- **Solution**: Ensure 16GB+ RAM, close other applications
- **Cause**: Large datasets or insufficient resources

**"Export Failed"**
- **Solution**: Check disk space and permissions
- **Cause**: Insufficient storage or write permissions

### Performance Optimization

**For Large Datasets**:
- Use SSD storage for faster I/O
- Close unnecessary applications during training
- Consider Pro mode only for complex forecasting needs

**Database Maintenance**:
- System automatically optimizes SQLite database
- No manual maintenance typically required
- Data is compressed and indexed automatically

---

## FAQ

**Q: Does StorePulse require internet?**
A: No, StorePulse works completely offline after installation.

**Q: How much historical data do I need?**
A: 30+ days for good accuracy, 14+ days for basic forecasting.

**Q: Can I use StorePulse for multiple stores?**
A: Yes, but requires separate data files and model training per store.

**Q: How accurate are the forecasts?**
A: Typically 8-25% better than simple baselines, depending on data quality.

**Q: What if my data has gaps?**
A: StorePulse handles missing data gracefully with trend extrapolation.

**Q: Can I export data for other systems?**
A: Yes, forecasts can be exported to CSV or integrated via API.

**Q: How often should I retrain models?**
A: After significant data changes or monthly for optimal accuracy.

**Q: What are "quality gates"?**
A: Automated checks ensuring forecast reliability before release.

---

## Support

### Getting Help

1. **In-App Help**: Click "?" icons for context-sensitive help
2. **Documentation**: This manual covers all features
3. **Troubleshooting Guide**: Built-in diagnostics and solutions

### Contact Information

**For Technical Issues**:
- Check system requirements and installation steps
- Review troubleshooting section above
- Verify data format and quality

**For Feature Requests**:
- Use in-app feedback form
- Contact development team

**Version Information**:
- Current: StorePulse v1.0.0
- Release Date: [Current Date]
- Support: Until v2.0.0 release

---

*StorePulse v1.0.0 User Manual*
*© 2024 StorePulse. All rights reserved.*

*This document explains how to use StorePulse effectively for store visit forecasting and operational planning. For technical details, see the Methodology.pdf document.*
