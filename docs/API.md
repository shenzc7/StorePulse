# StorePulse API Documentation

## Overview

StorePulse provides a REST API for retail forecasting and data management. The API is built with FastAPI and runs locally on the user's machine, ensuring complete data privacy and offline operation.

**Base URL:** `http://localhost:5173/api`
**Authentication:** None required (local application)
**Data Format:** JSON

## Core Endpoints

### Health Check

#### GET `/health`
Verify that the API server is running and operational.

**Response:**
```json
{
  "status": "ok"
}
```

### Data Management

#### POST `/data/add_today`
Add today's visit count to the database.

**Request Body:**
```json
{
  "event_date": "2024-01-15",
  "visits": 150
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Recorded 150 visits for 2024-01-15",
  "persisted": "true"
}
```

#### POST `/data/add_today_pro`
Add today's visit count with Pro features (sales, promotions, etc.).

**Request Body:**
```json
{
  "event_date": "2024-01-15",
  "visits": 150,
  "sales": 2500.00,
  "conversion": 0.06,
  "promo_type": "seasonal_discount",
  "price_change": -0.15
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Recorded 150 visits with Pro data for 2024-01-15",
  "persisted": "true"
}
```

#### GET `/data/history`
Retrieve historical visit data for model training.

**Query Parameters:**
- `days` (optional): Number of days of history (default: 365)

**Response:**
```json
{
  "records": [
    {
      "event_date": "2024-01-15",
      "visits": 150,
      "sales": 2500.00,
      "weather": "sunny",
      "promo_type": "none"
    }
  ],
  "count": 365,
  "date_range": {
    "start": "2023-01-15",
    "end": "2024-01-15"
  }
}
```

### Model Training

#### POST `/train`
Train forecasting models on uploaded data.

**Request Body:**
```json
{
  "dataset_path": "/path/to/data.csv",
  "mode": "lite",
  "sampling_mode": "full"
}
```

**Response (streaming via Server-Sent Events):**
```
event: progress
data: {"stage": "loading_data", "message": "Loading historical data...", "progress": 10}

event: progress
data: {"stage": "training", "message": "Training NB-ARX model...", "progress": 50}

event: progress
data: {"stage": "validation", "message": "Running quality gates...", "progress": 90}

event: complete
data: {"status": "success", "model_path": "/ml/artifacts/lite/model.joblib", "metrics": {...}}
```

### Forecasting

#### GET `/forecast`
Generate visit forecasts with staffing and inventory recommendations.

**Query Parameters:**
- `days` (optional): Number of days to forecast (default: 7, max: 30)

**Response:**
```json
{
  "status": "success",
  "model_type": "NB-INGARCH (Trained on YOUR data)",
  "forecast_horizon_days": 7,
  "predictions": [
    {
      "date": "2024-01-16",
      "p10": 120,
      "p50": 145,
      "p90": 170,
      "staffing_needed": 3,
      "inventory_alert": "normal"
    }
  ],
  "staffing_recommendations": [
    "Peak day expected: Schedule 4 staff members",
    "Low traffic day: Consider 2 staff members"
  ],
  "inventory_alerts": [
    "Monitor dairy products - high demand expected",
    "Stock up on seasonal items"
  ],
  "generated_at": "2024-01-15T10:30:00Z",
  "data_source": "Your uploaded CSV data",
  "model_trained": true
}
```

### What-If Scenarios

#### POST `/whatif`
Test business scenarios against baseline forecasts.

**Request Body:**
```json
{
  "scenario": {
    "name": "Holiday Promotion",
    "changes": {
      "promo_type": "holiday_sale",
      "price_change": -0.20
    },
    "duration_days": 7
  }
}
```

**Response:**
```json
{
  "scenario_name": "Holiday Promotion",
  "baseline_forecast": [...],
  "scenario_forecast": [...],
  "impact_analysis": {
    "additional_visits": 450,
    "additional_revenue": 9000.00,
    "staffing_impact": "+2 staff needed",
    "inventory_impact": "Increase stock by 25%"
  }
}
```

### Model Metrics

#### GET `/metrics`
Get real-time model performance metrics for dashboard display.

**Response:**
```json
{
  "model_status": "trained",
  "accuracy_metrics": {
    "smape": 8.5,
    "mase": 0.85,
    "last_trained": "2024-01-15T09:00:00Z"
  },
  "data_quality": {
    "records_count": 365,
    "date_range_days": 365,
    "features_used": ["lag_1", "lag_7", "lag_14", "dow", "weather"]
  },
  "system_health": {
    "api_status": "healthy",
    "database_status": "connected",
    "model_cache_status": "valid"
  }
}
```

### File Management

#### POST `/files/upload`
Upload CSV data files for processing.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: CSV file containing historical data

**Response:**
```json
{
  "filename": "store_data.csv",
  "file_path": "/temp/store_data.csv",
  "size_bytes": 15432,
  "columns_detected": ["event_date", "visits", "weather", "promo_type"],
  "rows_count": 365,
  "data_quality_score": 95
}
```

### Backtesting

#### GET `/backtest`
Run historical backtesting to validate model performance.

**Query Parameters:**
- `model_type` (optional): "lite" or "pro" (default: "lite")

**Response:**
```json
{
  "backtest_results": [
    {
      "fold": 1,
      "period": "2024-01",
      "n_samples": 31,
      "model_smape": 7.8,
      "baseline_smape": 15.2,
      "improvement_pct": 48.7
    }
  ],
  "aggregate_metrics": {
    "mean_smape": 8.5,
    "mean_improvement": 42.3,
    "quality_gate_passed": true
  }
}
```

### Reports & Exports

#### POST `/reports/export`
Generate PDF reports with forecasts and recommendations.

**Request Body:**
```json
{
  "report_type": "forecast_summary",
  "include_charts": true,
  "include_recommendations": true,
  "forecast_days": 14
}
```

**Response:**
```json
{
  "export_id": "forecast_20240115_001",
  "filename": "StorePulse_Forecast_Report_2024-01-15.pdf",
  "file_path": "/reports/exports/forecast_20240115_001.pdf",
  "generated_at": "2024-01-15T10:45:00Z",
  "file_size_mb": 2.3
}
```

## Data Formats

### Lite Mode Data
Minimum required columns for basic forecasting:

```csv
event_date,visits
2024-01-01,120
2024-01-02,135
2024-01-03,142
```

### Pro Mode Data
Enhanced features for advanced forecasting:

```csv
event_date,visits,sales,conversion,weather,promo_type,price_change
2024-01-01,120,1800.00,0.067,sunny,none,0.0
2024-01-02,135,2100.00,0.064,cloudy,promo_a,-0.10
2024-01-03,142,1950.00,0.073,rainy,none,0.0
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Descriptive error message",
  "status": "error",
  "details": "Additional context for debugging"
}
```

### Common Error Codes
- `400 Bad Request`: Invalid input data or parameters
- `404 Not Found`: Resource or model not available
- `500 Internal Server Error`: Server-side processing error

## Rate Limiting

- No explicit rate limiting (local application)
- Server-sent events provide real-time progress updates
- Long-running operations (training) are asynchronous

## Versioning

- **API Version**: v1.0.1
- **Breaking Changes**: None planned for initial release
- **Deprecation Policy**: 6 months notice for deprecated endpoints

## Support

For technical API integration questions:
- Check the User Manual for common use cases
- Review Methodology.pdf for forecasting approach details
- Contact support for custom integration requirements
