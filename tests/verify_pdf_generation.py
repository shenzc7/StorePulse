
import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add project root to python path
sys.path.append(os.getcwd())

from api.main import app

def verify_pdf_generation():
    client = TestClient(app)
    
    print("1. Uploading sample data for training...")
    csv_content = "date,visits\n"
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=60)
    for i in range(60):
        d = start_date + timedelta(days=i)
        csv_content += f"{d.strftime('%Y-%m-%d')},{100 + (i % 7) * 10}\n"
        
    client.post("/files/upload", files={"file": ("test_data.csv", csv_content, "text/csv")})
    
    print("2. Triggering model training (lite mode)...")
    # Quick train in 'fast' mode or just rely on fallback if needed, but forecast needs data
    # Actually, forecast service handles fallback if no model, but ReportService needs data to verify charts
    # Let's just try generating report directly. ForecastService falls back to simple trend if model missing.
    
    print("3. Generating PDF report...")
    response = client.post("/api/reports/generate", json={"title": "Test Report", "days": 14, "mode": "lite"})
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Report generation successful!")
        print(f"Filename: {data['filename']}")
        print(f"Path: {data['path']}")
        
        # Verify file exists
        local_path = Path("reports/exports") / data['filename']
        if local_path.exists():
            print(f"✅ File created at {local_path}")
            size = local_path.stat().st_size
            print(f"Size: {size} bytes")
            if size > 1000:
                print("✅ File size looks reasonable (PDF content)")
            else:
                print("❌ File seems too small")
        else:
            print("❌ File not found on disk")
    else:
        print(f"❌ Failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    verify_pdf_generation()
