
import sys
import os
import joblib
import pandas as pd
import numpy as np
from datetime import date
from pathlib import Path

# Add project root to path
sys.path.append(os.getcwd())

from api.core.db import ModelRepository, VisitRepository
from api.core.forecast_service import ForecastService

def debug_pro_model():
    print("--- Debugging Pro Model ---")
    
    # 1. Check if model exists in DB
    model_info = ModelRepository.get_latest_model("pro", "ingarch")
    if not model_info:
        print("❌ No active PRO model found in database.")
        return

    print(f"✅ Found model: {model_info['name']}")
    print(f"   Artifact: {model_info['artifact_path']}")
    print(f"   Trained at: {model_info['trained_at']}")
    print(f"   Metrics: {model_info.get('metrics')}")

    # 2. Check Artifact validity
    artifact_path = Path(model_info['artifact_path'])
    if not artifact_path.exists():
        print(f"❌ Artifact file missing at {artifact_path}")
        return

    try:
        bundle = joblib.load(artifact_path)
        model = bundle["model"]
        print(f"✅ Loaded model object: {type(model)}")
        
        if hasattr(model, "params"):
            print(f"   Model params: {model.params}")
            if np.isnan(model.params).any():
                print("   ❌ WARNING: Model has NaN parameters!")
    except Exception as e:
        print(f"❌ Failed to load artifact: {e}")
        return

    # 3. Test Forecast Service generation
    svc = ForecastService()
    print("\n--- Generating Forecast (Horizon=7) ---")
    try:
        # We need to ensure we have data. features are built from recent history.
        # Let's see what features are built.
        features, warnings = svc._build_feature_frame(
            date.today(), 
            horizon_days=7, 
            feature_cols=bundle["feature_cols"]
        )
        print(f"   Feature Frame Shape: {features.shape}")
        if not features.empty:
            print("   Feature Columns:", features.columns.tolist())
            print("   First row features:\n", features.iloc[0])
            
            # Predict
            preds = svc._predict_with_specific_model(features, model, bundle["feature_cols"], "ProTest")
            print(f"\n   Predictions (First 3):")
            for p in preds[:3]:
                print(f"     Date: {p['date']}, P50: {p['predicted_visits']}, Range: {p['lower_bound']}-{p['upper_bound']}")
        else:
            print("❌ Feature frame is empty. Warnings:", warnings)

    except Exception as e:
        print(f"❌ Forecast processing failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_pro_model()
