import sys
import os
import pandas as pd
import numpy as np
from pathlib import Path
import joblib

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

from api.core.forecast_service import ForecastService
from api.core.db import ModelRepository

def verify_model_usage():
    print("🕵️‍♀️ Verifying Model Usage...")
    
    service = ForecastService()
    
    # 1. Check if model exists
    model_info = ModelRepository.get_latest_model("lite", "ingarch")
    if not model_info:
        print("❌ No 'lite' model found. Please run regeneration script first.")
        return
        
    print(f"✅ Found model: {model_info['name']} (trained at {model_info['trained_at']})")
    
    # 2. Load model artifact directly
    artifact_path = Path(model_info["artifact_path"])
    bundle = joblib.load(artifact_path)
    model = bundle["model"]
    print(f"✅ Loaded model artifact type: {type(model).__name__}")
    
    # 3. Generate forecast via Service
    print("\n🔮 Generating forecast via Service...")
    result = service.forecast(horizon_days=1, mode="lite")
    
    if result["status"] != "success":
        print(f"❌ Forecast failed: {result.get('message')}")
        return
        
    service_pred = result["predictions"][0]["predicted_visits"]
    print(f"   Service Prediction (Day 1): {service_pred}")
    
    # 4. Generate forecast manually using model
    print("\n🧪 Generating forecast manually using model.predict()...")
    # We need to reconstruct the feature row exactly as the service does
    # This is hard to replicate exactly without copying valid logic, 
    # but we can verify that the service *calls* the model.
    
    # Instead, let's monkeypatch the model's predict method to prove it's called
    original_predict = model.predict
    
    call_log = []
    def mocked_predict(*args, **kwargs):
        call_log.append("CALLED")
        return original_predict(*args, **kwargs)
        
    model.predict = mocked_predict
    
    # We need to inject this mocked model back into the service's cache or repository
    # Service loads from disk, so we can't easily mock without saving to disk.
    # But we can inject it into the service's in-memory cache if we access it.
    
    # Force load the bundle into cache
    service._model_cache["lite"] = {
        "model": model,
        "feature_cols": bundle["feature_cols"],
        "model_info": model_info,
        "mode": "lite",
        "model_type": "INGARCH"
    }
    
    # Run forecast again
    service.forecast(horizon_days=1, mode="lite")
    
    if call_log:
        print("✅ Model.predict() WAS called by the service!")
    else:
        print("❌ Model.predict() was NOT called! (Is it using a fallback?)")

if __name__ == "__main__":
    verify_model_usage()
