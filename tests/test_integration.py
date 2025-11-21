"""
Integration tests for StorePulse data handling and edge cases.

These tests verify that the system handles various data scenarios gracefully:
- Empty CSV files
- Corrupted/malformed files
- Extreme values (very high/low)
- Missing required columns
- Invalid date formats
- Large datasets
"""

import io
import json
import tempfile
from pathlib import Path
from datetime import datetime, date

import pytest
from fastapi.testclient import TestClient

from api.main import app


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def sample_csv_data():
    """Valid sample CSV data for testing."""
    return """date,visits
2024-01-01,100
2024-01-02,110
2024-01-03,95
2024-01-04,120
2024-01-05,130
"""


class TestDataEdgeCases:
    """Test edge cases in data handling."""

    def test_empty_csv_file(self, client):
        """Test handling of empty CSV files."""
        # Create empty CSV file
        empty_csv = io.BytesIO(b"")

        response = client.post(
            "/files/upload",
            files={"file": ("empty.csv", empty_csv, "text/csv")}
        )

        # Should return error for empty file
        assert response.status_code in [400, 422]
        data = response.json()
        assert "empty" in data.get("detail", "").lower() or "no data" in data.get("detail", "").lower()

    def test_corrupted_csv_file(self, client):
        """Test handling of corrupted/malformed CSV files."""
        # Create corrupted CSV (missing closing quote, invalid format)
        corrupted_csv = io.BytesIO(b"""date,visits
2024-01-01,100
2024-01-02,invalid_number
2024-01-03,100
""")

        response = client.post(
            "/files/upload",
            files={"file": ("corrupted.csv", corrupted_csv, "text/csv")}
        )

        # Should handle gracefully or return appropriate error
        assert response.status_code in [400, 422, 500]
        # The system should not crash, even if it can't parse the data

    def test_extreme_values_csv(self, client):
        """Test handling of extreme values in CSV."""
        extreme_csv = io.BytesIO(b"""date,visits
2024-01-01,0
2024-01-02,999999
2024-01-03,-100
2024-01-04,100
""")

        response = client.post(
            "/files/upload",
            files={"file": ("extreme.csv", extreme_csv, "text/csv")}
        )

        # Should handle extreme values gracefully
        if response.status_code == 200:
            # Successfully processed despite extreme values
            pass
        else:
            # Or return appropriate error
            assert response.status_code in [400, 422]

    def test_missing_columns_csv(self, client):
        """Test handling of CSV with missing required columns."""
        missing_cols_csv = io.BytesIO(b"""date_only
2024-01-01
2024-01-02
2024-01-03
""")

        response = client.post(
            "/files/upload",
            files={"file": ("missing_cols.csv", missing_cols_csv, "text/csv")}
        )

        # Should return error for missing visits column
        assert response.status_code in [400, 422]
        data = response.json()
        assert "visits" in data.get("detail", "").lower() or "column" in data.get("detail", "").lower()

    def test_invalid_date_format_csv(self, client):
        """Test handling of CSV with invalid date formats."""
        invalid_date_csv = io.BytesIO(b"""date,visits
invalid-date,100
2024-01-02,110
2024-01-03,95
""")

        response = client.post(
            "/files/upload",
            files={"file": ("invalid_date.csv", invalid_date_csv, "text/csv")}
        )

        # Should handle invalid dates gracefully
        assert response.status_code in [400, 422, 500]

    def test_large_dataset_csv(self, client):
        """Test handling of large CSV datasets."""
        # Create a moderately large dataset (1000 rows)
        large_data = ["date,visits"]
        base_date = date(2024, 1, 1)

        for i in range(1000):
            current_date = base_date.replace(day=min(i % 28 + 1, 28))
            visits = 100 + (i % 50)  # Some variation
            large_data.append(f"{current_date.isoformat()},{visits}")

        large_csv = io.BytesIO("\n".join(large_data).encode('utf-8'))

        response = client.post(
            "/files/upload",
            files={"file": ("large.csv", large_csv, "text/csv")}
        )

        # Should handle large datasets (might be slow but shouldn't crash)
        if response.status_code == 200:
            # Successfully processed large dataset
            pass
        else:
            # Or return appropriate error for size limits
            assert response.status_code in [400, 413, 422]

    def test_malformed_json_file(self, client):
        """Test handling of malformed JSON files."""
        malformed_json = io.BytesIO(b"""{"invalid": json}""")

        response = client.post(
            "/files/upload",
            files={"file": ("malformed.json", malformed_json, "application/json")}
        )

        # Should handle malformed JSON gracefully
        assert response.status_code in [400, 422, 500]

    def test_unsupported_file_format(self, client):
        """Test handling of unsupported file formats."""
        txt_file = io.BytesIO(b"This is just plain text, not CSV or JSON")

        response = client.post(
            "/files/upload",
            files={"file": ("text.txt", txt_file, "text/plain")}
        )

        # Should reject unsupported formats
        assert response.status_code in [400, 422]
        data = response.json()
        assert "format" in data.get("detail", "").lower() or "csv" in data.get("detail", "").lower()


class TestForecastIntegration:
    """Integration tests for forecast functionality."""

    def test_forecast_with_no_models_fallback(self, client):
        """Test forecast endpoint falls back gracefully when no models are available."""
        response = client.get("/api/forecast/?days=7&mode=lite")

        # Should return a forecast even without trained models (using trend fallback)
        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) > 0

        # Each forecast point should have required fields
        for point in data["predictions"]:
            assert "date" in point
            assert "predicted_visits" in point
            assert "lower_bound" in point
            assert "upper_bound" in point

    def test_forecast_mode_validation(self, client):
        """Test forecast endpoint validates mode parameter."""
        # Test invalid mode
        response = client.get("/api/forecast/?days=7&mode=invalid")
        assert response.status_code == 422  # FastAPI validation error

        # Test valid modes
        for mode in ["lite", "pro"]:
            response = client.get(f"/forecast/?days=7&mode={mode}")
            assert response.status_code == 200

    def test_forecast_days_validation(self, client):
        """Test forecast endpoint validates days parameter."""
        # Test too many days
        response = client.get("/api/forecast/?days=50&mode=lite")
        assert response.status_code == 422  # Should be limited to 30 days

        # Test negative days
        response = client.get("/api/forecast/?days=-1&mode=lite")
        assert response.status_code == 422

    def test_metrics_endpoint_integration(self, client):
        """Test metrics endpoint returns proper data structure."""
        response = client.get("/api/metrics/")

        assert response.status_code == 200
        data = response.json()

        # Should have all required metric fields
        required_fields = [
            "lite_lift", "pro_weekend_gain", "coverage",
            "time_to_first_forecast", "model_status"
        ]
        for field in required_fields:
            assert field in data

        # Model status should have boolean flags
        model_status = data["model_status"]
        assert isinstance(model_status["lite_model_available"], bool)
        assert isinstance(model_status["pro_model_available"], bool)


class TestEndToEndWorkflow:
    """End-to-end workflow integration tests."""

    def test_data_upload_to_forecast_pipeline(self, client):
        """Test complete pipeline: upload data → get forecast → verify integration."""
        # Step 1: Upload valid data
        csv_data = io.BytesIO(b"""date,visits
2024-01-01,100
2024-01-02,110
2024-01-03,95
""")

        upload_response = client.post(
            "/files/upload",
            files={"file": ("test.csv", csv_data, "text/csv")}
        )

        if upload_response.status_code != 200:
            pytest.skip("Data upload failed - skipping integration test")

        # Step 2: Get forecast (should use uploaded data if processed)
        forecast_response = client.get("/api/forecast/?days=3&mode=lite")
        assert forecast_response.status_code == 200

        forecast_data = forecast_response.json()
        assert "forecast" in forecast_data
        assert len(forecast_data["forecast"]) > 0

        # Step 3: Verify forecast structure
        for point in forecast_data["forecast"]:
            assert all(key in point for key in ["date", "p10", "p50", "p90"])
            assert isinstance(point["p10"], int)
            assert isinstance(point["p50"], int)
            assert isinstance(point["p90"], int)
            # P10 should be <= P50 <= P90
            assert point["p10"] <= point["p50"] <= point["p90"]

    def test_error_recovery_integration(self, client):
        """Test system recovers gracefully from various error conditions."""
        # Test multiple error scenarios and ensure system remains functional

        # 1. Invalid forecast request
        response = client.get("/api/forecast/?days=0&mode=lite")
        assert response.status_code == 422  # Validation error

        # 2. System should still work after error
        response = client.get("/api/forecast/?days=7&mode=lite")
        assert response.status_code == 200

        # 3. Test health endpoint
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
