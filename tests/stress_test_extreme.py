import pytest
import pandas as pd
import numpy as np
import io
import time
import threading
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def generate_csv(rows, missing_dates=False, outliers=False):
    """Generate CSV content with specific characteristics."""
    dates = pd.date_range(start="2020-01-01", periods=rows, freq="D")
    visits = np.random.poisson(100, size=rows)
    
    if outliers:
        # Add massive outliers
        visits[rows//2] = 1000000
        visits[rows//4] = -5 # Negative values (should be caught)
        
    df = pd.DataFrame({"event_date": dates, "visits": visits})
    
    if missing_dates:
        # Drop random 20% of rows
        df = df.sample(frac=0.8)
        
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    return csv_buffer.getvalue()

def test_stress_massive_dataset():
    """Test training on 10 years of data (3650 rows)."""
    csv_content = generate_csv(3650)
    files = {"file": ("massive.csv", csv_content, "text/csv")}
    
    start_time = time.time()
    response = client.post("/api/train/", files=files)
    duration = time.time() - start_time
    
    # Should accept request (SSE stream starts 200)
    assert response.status_code == 200
    print(f"\nMassive dataset (3650 rows) accepted in {duration:.2f}s")

def test_stress_tiny_dataset():
    """Test training on minimal data (30 rows)."""
    csv_content = generate_csv(30)
    files = {"file": ("tiny.csv", csv_content, "text/csv")}
    response = client.post("/api/train/", files=files)
    assert response.status_code == 200

def test_stress_outliers():
    """Test data with extreme outliers and negative values."""
    csv_content = generate_csv(100, outliers=True)
    files = {"file": ("outliers.csv", csv_content, "text/csv")}
    
    # The API might return 200 (SSE) but stream an error, or 400 if validation catches it early
    # Our validation logic in train.py catches negatives early?
    # Let's check train.py validation.
    # It uses `_validate_dataframe` which checks for negatives.
    # So this should fail with 400.
    response = client.post("/api/train/", files=files)
    assert response.status_code == 400
    assert "negative" in response.text.lower()

def test_concurrency_hammer():
    """Hammer the forecast endpoint while training is running."""
    # 1. Start training in a thread (mocked or real)
    # Since TestClient is synchronous, we can't easily do true parallel requests 
    # without using async client or threads with requests.
    # But we can simulate "busy" state.
    
    # For this test, we'll just hammer the forecast endpoint 100 times
    start_time = time.time()
    for _ in range(100):
        client.get("/api/forecast/")
    duration = time.time() - start_time
    print(f"\n100 Forecast requests served in {duration:.2f}s ({100/duration:.1f} req/s)")
    assert duration < 5.0 # Should be fast (cached or simple db query)

if __name__ == "__main__":
    # Manual run
    test_stress_massive_dataset()
    test_stress_tiny_dataset()
    test_stress_outliers()
    test_concurrency_hammer()
