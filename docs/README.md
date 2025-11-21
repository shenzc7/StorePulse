# StorePulse Docs Hub

Welcome to the StorePulse documentation bundle. This guide explains how to install the offline desktop app, run the full stack, understand Lite vs Pro modes, and keep things healthy.

## Install & Setup

### macOS / Linux
1. `cd storepulse`
2. `./scripts/bootstrap_env.sh`
   - *ELI5:* This builds a fresh Python sandbox and fetches the API + UI dependencies.
3. Activate the virtual environment: `source .venv/bin/activate`
4. (Optional) Stay updated: `pip install --upgrade pip && npm update`

### Windows
1. Open PowerShell, `cd storepulse`
2. `./scripts/bootstrap_env.ps1`
   - *ELI5:* Same as mac, but PowerShell-flavored.
3. Activate the environment: `.\.venv\Scripts\Activate.ps1`
4. (Optional) Keep packages current: `pip install --upgrade pip`

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm 9+
- (macOS) Xcode command-line tools for native builds
- (Windows) Visual Studio Build Tools + WebView runtime

## Run the Stack
1. Make sure the environment is active (`source .venv/bin/activate` or the PowerShell variant).
2. Launch both API and UI: `./scripts/dev_run.sh`
   - Uvicorn serves the FastAPI app on `http://localhost:9000`
   - Tauri + React dev server opens on `http://localhost:1420`
3. Stop everything with `Ctrl+C` (script also cleans the API process).

### Key Routes & Artifacts
- `/api/train` drops trained assets under `reports/` and `ml/`
  - Forecast bands: `reports/forecasts/lite_bands.npz`
  - Reliability plots: `reports/lite_reliability.png`
  - Backtests & exports: `reports/backtests/`, `reports/exports/`
- `/api/forecast?days=14` generates next-14-day visit plans
- `/api/reports` serves zipped PDFs for WhatsApp-ready sharing

*ELI5:* Think of `/train` as your “make it smart” button. After you press it, check the `reports/` folder to see what the brain learned.

## Lite vs Pro at a Glance

| Feature | Lite Mode | Pro Mode |
| --- | --- | --- |
| Inputs | `date, visits` only | Adds sales, conversion, promo_type, price_change, weather, paydays, school_breaks, local_events, open_hours |
| Engine | NB-INGARCH (Lite features) | NB-INGARCH with Pro context (sales, weather, events) |
| Outputs | Shift-level staffing, SKU-level stock (baseline) | All Lite actions + promo-aware staffing tweaks + inventory boosts |
| Quality Gate | ≥8% sMAPE better than MA7 | ≥20% weekend sMAPE gain vs Lite |
| Best For | Fast onboarding, sparse data | High-traffic stores with rich context |

*ELI5:* Lite is your “just the basics” autopilot, Pro adds weather + promos so it flies like a pro pilot with a co-pilot checking mistakes.

## Screenshots

- Lite Dashboard — `docs/screenshots/lite-dashboard.png`
- Pro Forecast Bands — `docs/screenshots/pro-forecast-bands.png`
- Action Cards PDF Export — `docs/screenshots/action-cards.png`

## Troubleshooting
- **`uvicorn` port in use:** Kill stray processes with `lsof -i :9000` (mac/Linux) or `Get-Process -Id (Get-NetTCPConnection -LocalPort 9000).OwningProcess` (Windows).
- **Node dev server complaints:** Clear cache `rm -rf app/node_modules/.vite` and rerun `npm install`.
- **Python dependency errors:** Make sure the virtual environment is active (`which python` should point to `.venv/bin/python`).
- **Reports folder empty after /train:** Re-run `/api/train` and watch the FastAPI console; successful runs timestamp artifacts in `reports/`.
- **GPU warnings on Windows:** Ignore – models run on CPU-only Negative-Binomial stacks.

Still stuck? Peek at `DECISIONS.md` for architectural intent or run `pytest tests/test_quality_gates.py -k gate` to confirm the quality guardrails.
