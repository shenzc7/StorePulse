#!/usr/bin/env python3
"""
Regenerate sample models using the production-grade NB-INGARCH implementation.
This replaces the old PyMC/Booster artifacts with real INGARCH models.
"""
import sys
import os
import shutil
import numpy as np
import pandas as pd
import pickle
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

from ml.train_ingarch import NBINGARCHModel

ARTIFACTS_DIR = PROJECT_ROOT / "ml" / "artifacts"

def generate_synthetic_data(n=365):
    """Generate synthetic retail data with weekly seasonality and trend."""
    np.random.seed(42)
    t = np.arange(n)
    # Baseline + Trend + Weekly Seasonality
    mu = 100 + 0.05 * t + 20 * np.sin(2 * np.pi * t / 7)
    # Add noise (Negative Binomial)
    y = np.random.negative_binomial(n=50, p=50/(50+mu))
    
    # Create DataFrame
    dates = pd.date_range(start="2024-01-01", periods=n, freq="D")
    df = pd.DataFrame({"event_date": dates, "visits": y})
    
    # Add some exogenous features
    df["dow"] = df["event_date"].dt.dayofweek
    df["is_weekend"] = df["dow"].isin([5, 6]).astype(int)
    
    return df

def train_and_save(mode, data):
    """Train NB-INGARCH model and save artifact."""
    print(f"🚀 Training {mode} model...")
    
    # Prepare data
    y = data["visits"].values
    if mode == "pro":
        # Use weekend as exogenous feature for Pro mode
        X = data[["is_weekend"]].values
    else:
        X = None
        
    # Save synthetic data to CSV
    csv_path = PROJECT_ROOT / "data" / f"{mode}_sample.csv"
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    data.to_csv(csv_path, index=False)
    print(f"📄 Generated {mode} dataset at {csv_path}")
    
    # Train using the official pipeline (handles saving + DB registration)
    print(f"🚀 Training {mode} model via pipeline...")
    from ml.train_ingarch import train
    
    # Use 'demo' mode for faster training during regeneration
    results = train(csv_path, p=1, q=1, sampling_mode="demo")
    
    print(f"✅ Trained and registered {mode} model!")
    print(f"   Artifact: {results['artifact']}")
    print(f"   Metrics: {results['quality_metrics']}")

def main():
    print("🔄 Regenerating sample models with proper registration...")
    
    # Clean existing artifacts
    if ARTIFACTS_DIR.exists():
        shutil.rmtree(ARTIFACTS_DIR)
    ARTIFACTS_DIR.mkdir(parents=True)
    
    # Generate data
    data = generate_synthetic_data()
    
    # Train Lite model
    train_and_save("lite", data)
    
    # Train Pro model
    train_and_save("pro", data)
    
    print("\n✨ All sample models regenerated and REGISTERED successfully!")

if __name__ == "__main__":
    main()
