# StorePulse v0.9.0 "Demo-ready" Release Notes

**Tagline:** "Know tomorrow's visits. Act today."

StorePulse v0.9.0 is the first demo-ready build of our offline-first desktop forecast companion for store teams. It follows every directive in `ABSTRACT.md` and packages the full Lite and Pro experience alongside the quality gates that guard reliability.

## Highlights

### Product Experience
- Offline-by-default desktop shell built with Tauri + React, Radix UI, Tailwind, SF Pro, 200-240ms motion easing, and AA-compliant contrast.
- Guided navigation across Home, Data, Train, Forecast, Lab, Reports, and Settings pages with StatusDock visibility of `API • Local • SQLite`.
- CSV-less onboarding featuring the "Add Today" action, optional CSV import wizard, and UploadBox with immediate SQLite persistence.
- Forecast review presented through AccuracyMeter, ActionCard, and WhatIfPanel components with exports stored under `reports/exports/`.

### Forecasting Engine
- Lite mode consumes historical `date, visits` pairs and trains an NB-ARX model with 1/7/14-day lags.
- Pro mode augments Lite with sales, conversion, promo_type, price_change, weather, paydays, school_breaks, local_events, and open_hours drivers plus a LightGBM residual booster for uplift.
- PyMC Negative Binomial probabilistic model paired with inductive conformal calibration supplies calibrated P10/P50/P90 bands saved to `reports/forecasts/`.
- Backtests and reliability plots are published to `reports/backtests/` and summarized inside the Reports page.

### Operations & Distribution
- FastAPI backend exposes `/files/upload`, `/data/add_today`, `/features/preview`, `/train`, `/forecast?days=14`, `/whatif`, and `/backtest`, streaming progress through server-sent events.
- Quality gates halt the pipeline unless Lite maintains >=8% sMAPE improvement over an MA7 baseline, Pro weekends deliver >=20% uplift, calibrated P10-P90 coverage remains between 80% and 95%, and cold-start completes in <=90 seconds.
- Binaries `StorePulse.app` and `StorePulse.exe` ship alongside sample datasets in `data/samples/` for instant walkthroughs.

## Known Limits

### Data & Modeling
- Lite requires at least two weeks of `date, visits` history; Pro realizes the biggest gains once rich drivers span a month.
- Forecast horizon defaults to 14 days; extending it needs code changes in the API layer.
- Custom external features are not yet configurable through the UI and require backend updates.

### Performance & Platform
- Full training runs remain compute intensive; allocate 8 GB RAM for PyMC sampling comfort.
- Builds target macOS and Windows; Linux packaging is on the roadmap.
- Designed for single-desktop use; concurrent multi-user scenarios are not validated.

### User Experience
- Data validation guards common schema issues, yet highly malformed files may need manual cleanup before UploadBox ingest.
- If server-sent events pause, the UI presents a retry affordance that keeps the offline session intact.
- Undo flows are limited; back up SQLite files before experimenting in the Lab page.

## Upgrade Notes

### First-Time Setup
1. Fetch `StorePulse.app` (macOS) or `StorePulse.exe` (Windows) from the packaged artifacts.
2. Launch the binary; no external dependencies are required thanks to the offline-first stack.
3. Visit the Data page to use "Add Today" or the CSV import wizard.
4. Head to the Train page, choose Lite or Pro, and watch the StatusDock confirm API activity.

### Data Migration
- Historical seeds live under `data/samples/lite_sample.csv` and `data/samples/pro_sample.csv`.
- Additional regional calendars can be extended inside `data/holidays/` before triggering Train.

### Verification
- Review training outputs under `reports/forecasts/` and reliability evidence under `reports/backtests/`.
- Export stakeholder-ready PDFs from the Reports page; files land in `reports/exports/`.

## Quality Assurance
- Automated tests enforce all quality gates described in `ABSTRACT.md`.
- Packaging smoke tests confirm both binaries start, reach Home, and surface the StatusDock heartbeat.
- The Lab page includes toggles for experimenting with the LightGBM booster while keeping QA logs in `DECISIONS.md`.

## Issue Reporting
Share OS version, reproduction steps, expected versus actual behavior, and relevant artifacts from `reports/` when filing an issue.

## Roadmap Glimpse
- Linux packaging support.
- Configurable exogenous driver selection inside the Pro workflow.
- Extended forecast horizons with adaptive calibration.
- Additional what-if templates inside the Lab page.
