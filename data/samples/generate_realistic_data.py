#!/usr/bin/env python3
"""
Generate realistic sample data for StorePulse with proper statistical properties.
Creates both Lite and Pro mode datasets with 365 days of data.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)

def generate_realistic_visits(n_days=365, base=100, trend=0.05, seasonality=True):
    """
    Generate realistic store visit data with trend, seasonality, and noise.
    
    Args:
        n_days: Number of days to generate
        base: Base number of daily visits
        trend: Daily trend coefficient (0.05 = 5% growth over period)
        seasonality: Whether to add weekly seasonality
    
    Returns:
        Array of visit counts
    """
    # Generate time index
    t = np.arange(n_days)
    
    # Base trend
    visits = base + (trend * t)
    
    # Weekly seasonality (weekends get more traffic)
    if seasonality:
        day_of_week = t % 7
        # Weekend boost (Saturday=5, Sunday=6)
        weekend_boost = np.where(day_of_week >= 5, 30, 0)
        # Midweek pattern (Wed-Thu are busier than Mon-Tue)
        midweek_boost = np.where((day_of_week >= 2) & (day_of_week <= 4), 10, 0)
        visits += weekend_boost + midweek_boost
    
    # Monthly seasonality (end of month busier)
    day_of_month = (t % 30) / 30.0
    monthly_pattern = 15 * np.sin(2 * np.pi * day_of_month)
    visits += monthly_pattern
    
    # Add realistic noise (Poisson-like variation)
    noise = np.random.normal(0, 8, n_days)
    visits += noise
    
    # Add occasional spikes (promotions, events)
    n_spikes = n_days // 60  # ~6 events per year
    spike_days = np.random.choice(n_days, n_spikes, replace=False)
    for day in spike_days:
        visits[day] += np.random.randint(30, 80)
    
    # Ensure no negative values
    visits = np.maximum(visits, 20)
    
    return np.round(visits).astype(int)


def generate_temperature_data(n_days=365, mean_temp=20, variation=10):
    """Generate realistic temperature data (for Pro mode)."""
    t = np.arange(n_days)
    
    # Annual cycle
    annual_cycle = mean_temp + variation * np.sin(2 * np.pi * t / 365 - np.pi/2)
    
    # Daily variation
    daily_noise = np.random.normal(0, 3, n_days)
    
    temperature = annual_cycle + daily_noise
    return np.round(temperature, 1)


def generate_precipitation_data(n_days=365):
    """Generate realistic precipitation data (for Pro mode)."""
    # Rain on ~30% of days
    rain_days = np.random.binomial(1, 0.3, n_days)
    
    # Rain amount when it rains
    rain_amount = np.where(
        rain_days,
        np.random.gamma(2, 5, n_days),  # Gamma distribution for rain amounts
        0
    )
    
    return np.round(rain_amount, 1)


def generate_promotion_data(n_days=365):
    """Generate promotion indicator (for Pro mode)."""
    # Promotions on ~15% of days, clustered
    promotions = np.zeros(n_days, dtype=int)
    
    # Create promotional periods (typically 3-7 days)
    n_campaigns = n_days // 45  # ~8 campaigns per year
    for _ in range(n_campaigns):
        start_day = np.random.randint(0, n_days - 7)
        duration = np.random.randint(3, 8)
        promotions[start_day:start_day + duration] = 1
    
    return promotions


def generate_lite_sample(n_days=365, output_path=None):
    """Generate Lite mode sample dataset (only date and visits)."""
    start_date = datetime(2024, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(n_days)]
    visits = generate_realistic_visits(n_days)
    
    df = pd.DataFrame({
        'date': dates,
        'visits': visits
    })
    
    if output_path:
        df.to_csv(output_path, index=False)
        print(f"✅ Lite sample created: {output_path}")
        print(f"   Rows: {len(df)}, Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"   Visits range: {df['visits'].min()} to {df['visits'].max()}")
        print(f"   Mean visits: {df['visits'].mean():.1f}")
    
    return df


def generate_pro_sample(n_days=365, output_path=None):
    """Generate Pro mode sample dataset (with exogenous features)."""
    start_date = datetime(2024, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(n_days)]
    
    # Generate correlated visits (temperature and promotions affect visits)
    base_visits = generate_realistic_visits(n_days, base=95)
    temperature = generate_temperature_data(n_days)
    precipitation = generate_precipitation_data(n_days)
    promotions = generate_promotion_data(n_days)
    
    # Temperature affects visits (warmer = more visits, up to a point)
    temp_effect = np.clip((temperature - 15) * 0.5, -10, 10)
    
    # Rain reduces visits
    rain_effect = np.where(precipitation > 5, -15, 0)
    
    # Promotions increase visits
    promo_effect = promotions * 25
    
    # Combined visits
    visits = base_visits + temp_effect + rain_effect + promo_effect
    visits = np.maximum(visits, 20).astype(int)
    
    df = pd.DataFrame({
        'date': dates,
        'visits': visits,
        'temperature': temperature,
        'precipitation': precipitation,
        'is_promotion': promotions,
        'competitor_distance_km': np.full(n_days, 2.5)  # Static feature
    })
    
    if output_path:
        df.to_csv(output_path, index=False)
        print(f"✅ Pro sample created: {output_path}")
        print(f"   Rows: {len(df)}, Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"   Visits range: {df['visits'].min()} to {df['visits'].max()}")
        print(f"   Mean visits: {df['visits'].mean():.1f}")
        print(f"   Features: temperature, precipitation, is_promotion, competitor_distance_km")
    
    return df


def main():
    """Generate both Lite and Pro sample datasets."""
    script_dir = Path(__file__).parent
    
    print("🚀 Generating Realistic Sample Data for StorePulse")
    print("=" * 60)
    print()
    
    # Generate 365 days of data (1 year)
    n_days = 365
    
    # Generate Lite sample
    lite_path = script_dir / "lite_sample.csv"
    generate_lite_sample(n_days=n_days, output_path=lite_path)
    
    print()
    
    # Generate Pro sample
    pro_path = script_dir / "pro_sample.csv"
    generate_pro_sample(n_days=n_days, output_path=pro_path)
    
    print()
    print("=" * 60)
    print("✅ Sample data generation complete!")
    print()
    print("Data characteristics:")
    print("  • 365 days of daily store visit data")
    print("  • Realistic trend, seasonality, and noise")
    print("  • Weekly patterns (weekends busier)")
    print("  • Monthly cycles (end-of-month patterns)")
    print("  • Random promotional events")
    print("  • Pro mode includes weather and promotion features")
    print()
    print("Next steps:")
    print("  1. Review generated CSV files")
    print("  2. Use for training: python ml/train_nb_arx.py data/samples/lite_sample.csv")
    print("  3. Upload via UI to test data validation")


if __name__ == "__main__":
    main()
