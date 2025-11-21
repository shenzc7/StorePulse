# StorePulse Abstract

**Tagline:** "Know tomorrow’s visits. Act today."

StorePulse is an offline-first desktop application for macOS and Windows that forecasts store visits for the next 14 days and translates them into shift-level staffing guidance and SKU-level stocking actions. The system supports two operating modes:

- **Lite:** accepts only historical pairs of `date, visits`.
- **Pro:** optionally ingests richer signals such as sales, conversion, promo_type, price_change, weather, paydays, school_breaks, local_events, and open_hours.

## Product Tenets
- Offline by default with local SQLite storage; no telemetry or external dependencies.
- Apple-clean interface crafted with Tauri + React (Vite), Radix UI, Tailwind, SF Pro, rounded-2xl surfaces, 200–240ms motion easing, and AA-compliant contrast.
- CSV-less onboarding with an "Add Today" action and an optional CSV import wizard.
- Predictive engine powered by a single **NB-INGARCH (Negative Binomial Integer-valued GARCH)** model:
  * Conditional mean dynamics: μ_t = β₀ + Σ βᵢ y_{t-i} + Σ γⱼ x_t,j (AR terms + exogenous factors)
  * GARCH volatility clustering: φ_t = α₀ + Σ αᵢ (ε²_{t-i}/μ_{t-i}) + Σ δⱼ φ_{t-j}
  * Negative Binomial distribution: Y_t ~ NegBin(μ_t, φ_t) for overdispersed count data
  * Designed specifically for retail daily customer arrival forecasting with lags 1/7/14, day-of-week, weather, holidays, promotions
  * No auxiliary Bayesian, booster, or conformal stacks—dispersion directly drives P10/P50/P90 planning bands
- Self-teaching codebase featuring docstrings and "// explain like I’m 12" comments for complex logic.

## Quality Gates (build must fail otherwise)
1. NB-INGARCH model must achieve at least 8% sMAPE improvement over MA7 baseline.
2. Model must capture overdispersion: estimated φ_t parameter must be > 0.
3. Model must exhibit volatility clustering: ARCH coefficients (αᵢ) must be statistically significant.
4. Cold-start to first actionable forecast must complete in ≤ 90 seconds on bundled sample data.
5. Exogenous factors (day-of-week, holidays) must show significant coefficients (γⱼ ≠ 0).

## Architecture Overview
- **UI Layer:** Tauri shell with React + Vite front-end. Pages: Home, Data, Train, Forecast, Lab, Reports, Settings. Components: StatusDock, AccuracyMeter, ActionCard, UploadBox, WhatIfPanel. All interactions flow through `/api/*` endpoints.
- **API Layer:** FastAPI app exposing `/files/upload`, `/data/add_today`, `/features/preview`, `/train`, `/forecast?days=14`, `/whatif`, and `/backtest` with server-sent events for progress updates. Operates solely on the local filesystem and SQLite database.
- **ML Layer:** NB-INGARCH training via maximum likelihood estimation (MLE) in `ml/train_ingarch.py`. Baseline models (MA7, Naive) for comparison with no auxiliary Bayesian or booster stacks. All artifacts saved to `ml/artifacts/` and reports to `reports/`. DEPRECATED: `train_nb_arx.py` (lacks INGARCH dynamics), `booster_gbm.py` (off-topic).
- **Data Layer:** Sample datasets plus holiday calendars packaged under `data/` to support cold-start workflows and testing.
- **QA Layer:** Automated tests enforcing all quality gates, schema robustness, conformal coverage, and packaging smoke tests.

## Deliverables
- Local binaries: `StorePulse.app` and `StorePulse.exe`.
- Reports: backtests, reliability plots, and exportable PDFs.
- Documentation: README, DECISIONS log, methodology PDF, VivaDeck, and demo script.

This abstract is the unambiguous source of truth for implementation priorities. All plans and modules shall align with these directives.

## PROJECT CORE PRINCIPLE
**NB-INGARCH IS THE SOUL OF THIS PLATFORM.** All other models have been removed to maintain focus on the approved project scope: "Demand Forecasting Automation Platform (DFAP) that utilizes Negative Binomial INGARCH (NB-INGARCH) models to forecast daily customer arrivals." This is not negotiable - it is the project specification.
