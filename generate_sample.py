import pandas as pd
import numpy as np
from datetime import date, timedelta
import random

def generate_sample_data(filename="sample_store_data.csv", days=365):
    """Generates a realistic retail footfall dataset."""
    
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    dates = []
    visits = []
    
    current = start_date
    while current < end_date:
        # Base traffic (growing slightly over the year)
        day_index = (current - start_date).days
        trend = 100 + (day_index * 0.1)  # Starts at 100, ends at ~136
        
        # Weekly seasonality (high on weekends)
        # Monday=0, Sunday=6
        weekday = current.weekday()
        if weekday >= 4:  # Friday, Saturday, Sunday
            seasonality = 1.4  # 40% boost
        else:
            seasonality = 0.9  # 10% dip
            
        # Random noise
        noise = random.randint(-15, 25)
        
        # Holiday spikes (simplified)
        if current.month == 12: # December boost
             trend *= 1.2
             
        daily_visits = int(trend * seasonality + noise)
        daily_visits = max(50, daily_visits) # Minimum floor
        
        dates.append(current)
        visits.append(daily_visits)
        current += timedelta(days=1)
        
    df = pd.DataFrame({
        "date": dates,
        "visits": visits
    })
    
    # Save to root folder for easy access
    output_path = f"{filename}"
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} records in {output_path}")

if __name__ == "__main__":
    generate_sample_data()
