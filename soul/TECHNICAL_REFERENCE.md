# StorePulse: Technical Reference

> **Document Purpose**: This document details the low-level technical specifications, including API endpoints and Database Schema. It serves as evidence of implementation completeness for the technical panel.

---

## 1. Database Schema (SQLite)

The application uses a relational SQLite database (`storepulse.db`).

### Tables

#### `visits`
Stores the raw historical footfall data.
*   `event_date` (DATE, PK): The date of the visit count.
*   `visits` (INTEGER): Daily footfall count.
*   `sales` (REAL): Daily sales revenue (Pro mode).
*   `promo_type` (TEXT): Type of promotion active (if any).
*   `is_holiday` (BOOLEAN): Flag for holiday status.
*   `weather` (TEXT): Weather condition.

#### `forecasts`
Stores generated predictions for historical tracking and accuracy analysis.
*   `id` (INTEGER, PK): Auto-incrementing ID.
*   `forecast_date` (DATE): The date for which the prediction was made.
*   `predicted_visits` (REAL): The point forecast (P50).
*   `lower_bound` (REAL): P10 estimate.
*   `upper_bound` (REAL): P90 estimate.
*   `model_version` (TEXT): Version of the model used.
*   `created_at` (TIMESTAMP): When the forecast was generated.

#### `models`
Registry of trained model artifacts.
*   `id` (INTEGER, PK): Auto-incrementing ID.
*   `model_type` (TEXT): "INGARCH" or "ARX".
*   `version` (TEXT): Semantic versioning (e.g., "1.0.0").
*   `trained_at` (TIMESTAMP): Training completion time.
*   `metrics` (JSON): Training metrics (AIC, BIC, Log-Likelihood).
*   `artifact_path` (TEXT): File path to the serialized `.joblib` model.

#### `settings`
Key-value store for application configuration.
*   `key` (TEXT, PK): Setting name (e.g., "theme", "forecast_horizon").
*   `value` (JSON): Setting value.

---

## 2. API Reference (FastAPI)

### Authentication
*   Currently open (Localhost only). Future scope includes JWT.

### Endpoints

#### Health Check
*   **GET** `/health`
    *   **Response**: `{"status": "ok", "database": "connected"}`
    *   **Purpose**: Readiness probe for the frontend.

#### Data Management
*   **POST** `/api/upload`
    *   **Body**: `multipart/form-data` (CSV file).
    *   **Purpose**: Ingests historical data. Validates schema and data types.
*   **GET** `/api/visits`
    *   **Query**: `start_date`, `end_date`.
    *   **Purpose**: Retrieves historical data for visualization.

#### Training
*   **POST** `/api/train`
    *   **Body**: `{"mode": "lite" | "pro"}`
    *   **Response**: Streamed SSE (Server-Sent Events) with progress updates.
    *   **Purpose**: Triggers the NB-INGARCH training pipeline.

#### Forecasting
*   **GET** `/api/forecast`
    *   **Query**: `horizon` (default 7), `mode` ("lite" | "pro").
    *   **Response**:
        ```json
        {
          "status": "success",
          "predictions": [
            {
              "date": "2024-01-01",
              "predicted_visits": 150,
              "lower_bound": 130,
              "upper_bound": 180,
              "confidence_level": "90%"
            }
          ],
          "staffing_recommendations": [...]
        }
        ```
    *   **Purpose**: Returns predictions and operational insights.

---

## 3. Directory Structure

```
StorePulse/
├── api/                 # Backend Logic
│   ├── core/            # Business Logic (Features, DB)
│   ├── routes/          # API Endpoints
│   └── main.py          # Entry Point
├── ml/                  # Machine Learning Core
│   └── train_ingarch.py # NB-INGARCH Implementation
├── src/                 # Frontend (React)
├── data/                # Local Data Storage
├── tests/               # Pytest Suite
└── storepulse.db        # SQLite Database
```
