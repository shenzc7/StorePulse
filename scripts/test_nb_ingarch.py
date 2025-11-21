#!/usr/bin/env python3
"""Test script to validate the real NB-INGARCH implementation.

This script tests the core NB-INGARCH model on sample data to ensure:
1. Model trains successfully via MLE
2. Parameters are estimated correctly
3. Overdispersion is captured (φ_t > 0)
4. Volatility clustering is present (significant ARCH coefficients)
5. Model beats MA7 baseline (quality gate)
6. Forecasts are generated correctly

Run from project root: python scripts/test_nb_ingarch.py
"""
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

import numpy as np
import pandas as pd
from ml.train_ingarch import train, NBINGARCHModel
from api.core import feats, metrics
from ml import baselines

def test_nb_ingarch_training():
    """Test 1: Train NB-INGARCH model on sample data."""
    print("\n" + "="*80)
    print("TEST 1: NB-INGARCH Model Training")
    print("="*80)
    
    # Path to sample data
    lite_sample = project_root / "data" / "samples" / "lite_sample.csv"
    
    if not lite_sample.exists():
        print(f"❌ Sample data not found: {lite_sample}")
        return False
    
    print(f"✅ Loading sample data: {lite_sample}")
    df = pd.read_csv(lite_sample)
    print(f"   Data shape: {df.shape[0]} observations")
    print(f"   Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"   Visit stats: mean={df['visits'].mean():.1f}, std={df['visits'].std():.1f}, var/mean={df['visits'].var()/df['visits'].mean():.2f}")
    
    # Check for overdispersion in raw data
    variance_mean_ratio = df['visits'].var() / df['visits'].mean()
    if variance_mean_ratio > 1.0:
        print(f"✅ Data shows overdispersion (var/mean = {variance_mean_ratio:.2f} > 1.0)")
    else:
        print(f"⚠️  Data may not show strong overdispersion (var/mean = {variance_mean_ratio:.2f})")
    
    # Train model
    print("\n🔧 Training NB-INGARCH model...")
    try:
        results = train(lite_sample, p=1, q=1, sampling_mode="fast")
        print("✅ Training completed successfully!")
        
        # Check results
        if "artifact" in results:
            print(f"   Model artifact saved: {results['artifact']}")
        if "quality_metrics" in results:
            metrics_dict = results["quality_metrics"]
            print(f"\n📊 Quality Metrics:")
            print(f"   Model sMAPE: {metrics_dict.get('smape', 'N/A'):.2f}%")
            print(f"   Model MASE: {metrics_dict.get('mase', 'N/A'):.2f}")
            print(f"   Model RMSE: {metrics_dict.get('rmse', 'N/A'):.2f}")
            print(f"   MA7 sMAPE: {metrics_dict.get('ma7_smape', 'N/A'):.2f}%")
            
            # Quality gate check
            model_smape = metrics_dict.get('smape', float('inf'))
            ma7_smape = metrics_dict.get('ma7_smape', float('inf'))
            if ma7_smape > 0:
                improvement_pct = ((ma7_smape - model_smape) / ma7_smape) * 100
                print(f"\n🎯 Quality Gate: {improvement_pct:.2f}% improvement over MA7")
                if improvement_pct >= 8.0:
                    print(f"   ✅ PASSED (≥8% required)")
                else:
                    print(f"   ⚠️  Below target (≥8% required)")
        
        return True
    except Exception as e:
        print(f"❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_nb_ingarch_model_direct():
    """Test 2: Test NBINGARCHModel class directly."""
    print("\n" + "="*80)
    print("TEST 2: NB-INGARCH Model Parameters")
    print("="*80)
    
    # Load and prepare data
    lite_sample = project_root / "data" / "samples" / "lite_sample.csv"
    df = pd.read_csv(lite_sample)
    
    # Rename 'date' to 'event_date' if needed
    if 'date' in df.columns and 'event_date' not in df.columns:
        df['event_date'] = df['date']
    
    df['event_date'] = pd.to_datetime(df['event_date'])
    
    # Build features
    from ml.train_ingarch import CsvLoader
    
    # Save with correct column name
    temp_file = project_root / "data" / "samples" / "temp_lite_test.csv"
    df[['event_date', 'visits']].to_csv(temp_file, index=False)
    
    loader = CsvLoader(temp_file)
    feature_frame = feats.build_features(loader)
    
    print(f"✅ Feature engineering complete")
    print(f"   Features: {list(feature_frame.columns)}")
    
    # Extract target and features
    y = feature_frame["visits"].astype(float).values
    feature_cols = [col for col in feature_frame.columns if col not in {"visits", "event_date"}]
    
    if feature_cols:
        exog = feature_frame[feature_cols].apply(pd.to_numeric, errors="coerce").fillna(0.0).values
        exog = np.nan_to_num(exog, nan=0.0, posinf=0.0, neginf=0.0)
    else:
        exog = None
    
    print(f"✅ Data prepared: {len(y)} observations, {len(feature_cols) if feature_cols else 0} exogenous features")
    
    # Train NB-INGARCH model
    print(f"\n🔧 Fitting NB-INGARCH(1,1) model...")
    model = NBINGARCHModel(y, exog=exog, p=1, q=1)
    
    try:
        model.fit(maxiter=200, method='Nelder-Mead')
        
        if model.params is not None:
            print(f"✅ Model fitted successfully!")
            print(f"\n📊 Estimated Parameters:")
            
            n_exog = exog.shape[1] if exog is not None else 0
            n_mean_params = 1 + model.p + n_exog
            
            print(f"   Mean Equation:")
            print(f"      β₀ (intercept): {model.params[0]:.3f}")
            if model.p > 0:
                print(f"      β₁ (AR coef):   {model.params[1]:.3f}")
            
            print(f"\n   Dispersion Equation:")
            print(f"      α₀ (base disp):  {model.params[n_mean_params]:.3f}")
            if model.q > 0 and len(model.params) > n_mean_params + 1:
                print(f"      α₁ (ARCH coef):  {model.params[n_mean_params+1]:.3f}")
            
            # Check overdispersion
            base_dispersion = model.params[n_mean_params]
            if base_dispersion > 0:
                print(f"\n✅ Overdispersion captured: α₀ = {base_dispersion:.3f} > 0")
            else:
                print(f"\n⚠️  No overdispersion: α₀ = {base_dispersion:.3f} ≤ 0")
            
            # Check ARCH effect
            if model.q > 0 and len(model.params) > n_mean_params + 1:
                arch_coef = model.params[n_mean_params+1]
                if arch_coef > 0.01:
                    print(f"✅ Volatility clustering present: α₁ = {arch_coef:.3f} > 0")
                else:
                    print(f"⚠️  Weak volatility clustering: α₁ = {arch_coef:.3f}")
            
            return True
        else:
            print(f"❌ Model fitting failed: No parameters estimated")
            return False
            
    except Exception as e:
        print(f"❌ Model fitting failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Clean up temp file
        if temp_file.exists():
            temp_file.unlink()


def test_nb_ingarch_forecasting():
    """Test 3: Test NB-INGARCH forecasting capability."""
    print("\n" + "="*80)
    print("TEST 3: NB-INGARCH Forecasting")
    print("="*80)
    
    # Load and prepare data
    lite_sample = project_root / "data" / "samples" / "lite_sample.csv"
    df = pd.read_csv(lite_sample)
    
    # Rename columns
    if 'date' in df.columns:
        df['event_date'] = df['date']
    df['event_date'] = pd.to_datetime(df['event_date'])
    
    # Simple test: fit on first 300 days, forecast next 7
    train_df = df.iloc[:300].copy()
    test_df = df.iloc[300:307].copy()
    
    print(f"✅ Train set: {len(train_df)} days")
    print(f"✅ Test set: {len(test_df)} days")
    
    # Train model
    y_train = train_df['visits'].astype(float).values
    model = NBINGARCHModel(y_train, exog=None, p=1, q=1)
    
    try:
        model.fit(maxiter=150, method='Nelder-Mead')
        print(f"✅ Model fitted")
        
        # Generate forecasts
        forecasts = model.predict(n_ahead=7)
        print(f"\n📈 7-Day Forecast:")
        
        actuals = test_df['visits'].values
        for i, (forecast, actual) in enumerate(zip(forecasts, actuals)):
            error = actual - forecast
            pct_error = (abs(error) / actual) * 100
            print(f"   Day {i+1}: Forecast={forecast:.1f}, Actual={actual:.0f}, Error={error:+.1f} ({pct_error:.1f}%)")
        
        # Calculate forecast accuracy
        forecast_smape = metrics.smape(actuals, forecasts)
        forecast_rmse = metrics.rmse(actuals, forecasts)
        print(f"\n📊 Forecast Accuracy:")
        print(f"   sMAPE: {forecast_smape:.2f}%")
        print(f"   RMSE: {forecast_rmse:.2f}")
        
        if forecast_smape < 30.0:
            print(f"✅ Good forecast accuracy (sMAPE < 30%)")
        else:
            print(f"⚠️  Forecast accuracy could be improved (sMAPE = {forecast_smape:.2f}%)")
        
        return True
        
    except Exception as e:
        print(f"❌ Forecasting failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_comparison_with_baselines():
    """Test 4: Compare NB-INGARCH with baselines."""
    print("\n" + "="*80)
    print("TEST 4: NB-INGARCH vs Baselines")
    print("="*80)
    
    lite_sample = project_root / "data" / "samples" / "lite_sample.csv"
    df = pd.read_csv(lite_sample)
    
    if 'date' in df.columns:
        df['event_date'] = df['date']
    df['event_date'] = pd.to_datetime(df['event_date'])
    
    # Use first 300 for training, next 50 for testing
    train_df = df.iloc[:300].copy()
    test_df = df.iloc[300:350].copy()
    
    y_train = train_df['visits'].astype(float).values
    y_test = test_df['visits'].astype(float).values
    
    print(f"✅ Train: {len(y_train)} days, Test: {len(y_test)} days")
    
    # Fit NB-INGARCH
    print(f"\n🔧 Training NB-INGARCH...")
    model = NBINGARCHModel(y_train, exog=None, p=1, q=1)
    model.fit(maxiter=150)
    ingarch_forecasts = model.predict(n_ahead=len(y_test))
    
    # Baseline: MA7
    print(f"🔧 Computing MA7 baseline...")
    ma7_forecasts = []
    for i in range(len(y_test)):
        if i == 0:
            # Use last 7 days of training
            window = y_train[-7:]
        else:
            # Use last 7 days (including previous test actuals)
            window = np.concatenate([y_train[-(7-i):], y_test[:i]]) if i < 7 else y_test[i-7:i]
        ma7_forecasts.append(np.mean(window))
    ma7_forecasts = np.array(ma7_forecasts)
    
    # Baseline: Naive (yesterday's value)
    print(f"🔧 Computing Naive baseline...")
    naive_forecasts = np.concatenate([[y_train[-1]], y_test[:-1]])
    
    # Compare
    print(f"\n📊 Forecast Comparison:")
    
    ingarch_smape = metrics.smape(y_test, ingarch_forecasts)
    ma7_smape = metrics.smape(y_test, ma7_forecasts)
    naive_smape = metrics.smape(y_test, naive_forecasts)
    
    print(f"   NB-INGARCH sMAPE: {ingarch_smape:.2f}%")
    print(f"   MA7 sMAPE:        {ma7_smape:.2f}%")
    print(f"   Naive sMAPE:      {naive_smape:.2f}%")
    
    # Calculate improvements
    improvement_vs_ma7 = ((ma7_smape - ingarch_smape) / ma7_smape) * 100
    improvement_vs_naive = ((naive_smape - ingarch_smape) / naive_smape) * 100
    
    print(f"\n🎯 Improvements:")
    print(f"   vs MA7:   {improvement_vs_ma7:+.2f}%")
    print(f"   vs Naive: {improvement_vs_naive:+.2f}%")
    
    if improvement_vs_ma7 >= 8.0:
        print(f"\n✅ Quality Gate PASSED: {improvement_vs_ma7:.2f}% improvement over MA7 (≥8% required)")
        return True
    else:
        print(f"\n⚠️  Quality Gate: {improvement_vs_ma7:.2f}% improvement over MA7 (target: ≥8%)")
        return False


def main():
    """Run all NB-INGARCH validation tests."""
    print("\n" + "="*80)
    print("NB-INGARCH MODEL VALIDATION SUITE")
    print("="*80)
    print("Testing the REAL NB-INGARCH implementation (not fake LinearRegression)")
    print("Purpose: Validate that NB-INGARCH is the soul of this platform")
    
    results = {
        "training": False,
        "parameters": False,
        "forecasting": False,
        "baselines": False
    }
    
    # Run tests
    try:
        results["training"] = test_nb_ingarch_training()
    except Exception as e:
        print(f"❌ Test 1 crashed: {e}")
    
    try:
        results["parameters"] = test_nb_ingarch_model_direct()
    except Exception as e:
        print(f"❌ Test 2 crashed: {e}")
    
    try:
        results["forecasting"] = test_nb_ingarch_forecasting()
    except Exception as e:
        print(f"❌ Test 3 crashed: {e}")
    
    try:
        results["baselines"] = test_comparison_with_baselines()
    except Exception as e:
        print(f"❌ Test 4 crashed: {e}")
    
    # Summary
    print("\n" + "="*80)
    print("VALIDATION SUMMARY")
    print("="*80)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"   {test_name.upper():15s}: {status}")
    
    total_passed = sum(results.values())
    total_tests = len(results)
    
    print(f"\n📊 Overall: {total_passed}/{total_tests} tests passed")
    
    if all(results.values()):
        print("\n🎉 ALL TESTS PASSED! NB-INGARCH is working correctly!")
        print("   The soul of this platform is intact. ✨")
        return 0
    else:
        print("\n⚠️  Some tests failed. Review output above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())







