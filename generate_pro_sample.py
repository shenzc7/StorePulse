import pandas as pd
import numpy as np
from datetime import date, timedelta
import random

def generate_pro_sample_data(filename="sample_store_data_pro.csv", days=365):
    """Generates a realistic retail footfall dataset with Pro features."""
    
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    dates = []
    visits_list = []
    sales_list = []
    conversion_list = []
    promo_list = []
    price_change_list = []
    weather_list = []
    paydays_list = []
    school_breaks_list = []
    local_events_list = []
    open_hours_list = []
    
    current = start_date
    while current < end_date:
        # Base traffic
        day_index = (current - start_date).days
        trend = 100 + (day_index * 0.1)
        
        # Weekly seasonality
        weekday = current.weekday()
        is_weekend = weekday >= 4
        
        seasonality = 1.4 if is_weekend else 0.9
        
        # Random noise
        noise = random.randint(-15, 25)
        
        # Pro Features
        promo = random.choices(["None", "BOGO", "Discount_20"], weights=[0.7, 0.15, 0.15])[0]
        weather = random.choices(["Sunny", "Cloudy", "Rainy"], weights=[0.6, 0.3, 0.1])[0]
        is_payday = current.day in [15, 30, 31]
        
        # Holiday/Break logic
        month = current.month
        is_school_break = month in [6, 7, 12]
        
        # Impact calculations
        promo_boost = 1.25 if promo != "None" else 1.0
        weather_drag = 0.8 if weather == "Rainy" else 1.0
        payday_boost = 1.1 if is_payday else 1.0
        
        # Calculate final visits
        daily_visits = int(trend * seasonality * promo_boost * weather_drag * payday_boost + noise)
        daily_visits = max(50, daily_visits)
        
        # Derived metrics
        conversion_rate = random.uniform(0.08, 0.18) # 8-18%
        if promo != "None":
            conversion_rate += 0.03 # Better conversion on promos
            
        avg_ticket = random.uniform(45, 65)
        daily_sales = daily_visits * conversion_rate * avg_ticket
        
        dates.append(current)
        visits_list.append(daily_visits)
        # Round sales to 2 decimals
        sales_list.append(round(daily_sales, 2))
        # Conversion as decimal 0-1
        conversion_list.append(round(conversion_rate, 4))
        
        promo_list.append(promo)
        price_change_list.append(0.0) # Simplified
        weather_list.append(weather)
        paydays_list.append(is_payday)
        school_breaks_list.append(is_school_break)
        
        # Rare local event
        is_event = random.random() < 0.05
        local_events_list.append("Concert" if is_event else "None")
        open_hours_list.append(12.0)
        
        current += timedelta(days=1)
        
    df = pd.DataFrame({
        "date": dates,
        "visits": visits_list,
        "sales": sales_list,
        "conversion": conversion_list,
        "promo_type": promo_list,
        "price_change": price_change_list,
        "weather": weather_list,
        "paydays": paydays_list,
        "school_breaks": school_breaks_list,
        "local_events": local_events_list,
        "open_hours": open_hours_list
    })
    
    output_path = f"{filename}"
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} records in {output_path}")

if __name__ == "__main__":
    generate_pro_sample_data()
