#!/usr/bin/env python3
import random
from datetime import date, timedelta
from pathlib import Path
import csv

random.seed(42)

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

WEATHER_PATTERNS = {
    "sunny": 0.45,
    "cloudy": 0.25,
    "rainy": 0.15,
    "humid": 0.10,
    "storm": 0.05,
}

PROMO_TYPES = ["none", "none", "none", "flash", "percent_off", "bogo", "bundle"]

def is_payday(d: date) -> bool:
    return d.day in [1, 2, 14, 15, 16]

def get_day_of_week_multiplier(d: date) -> float:
    dow = d.weekday()
    multipliers = {0: 0.75, 1: 0.85, 2: 0.90, 3: 0.95, 4: 1.15, 5: 1.35, 6: 1.20}
    return multipliers[dow]

def get_weather_multiplier(weather: str) -> float:
    multipliers = {"sunny": 1.10, "cloudy": 1.00, "humid": 0.95, "rainy": 0.75, "storm": 0.55}
    return multipliers.get(weather, 1.0)

def get_promo_multiplier(promo_type: str) -> float:
    multipliers = {"flash": 1.45, "bogo": 1.35, "percent_off": 1.25, "bundle": 1.20, "other": 1.10, "none": 1.0}
    return multipliers.get(promo_type, 1.0)

def generate_weather() -> str:
    r = random.random()
    cumulative = 0
    for weather, prob in WEATHER_PATTERNS.items():
        cumulative += prob
        if r < cumulative: return weather
    return "sunny"

def generate_dataset(start_date: date, num_days: int, prefix: str):
    lite_data = []
    pro_data = []
    
    current_promo = "none"
    promo_days_left = 0

    holiday_events = ["New Year", "Valentine's", "Easter", "Summer Sale", "Halloween", "Black Friday", "Christmas"]
    
    for day in range(num_days):
        d = start_date + timedelta(days=day)
        
        weather = generate_weather()
        
        # Promotions
        if promo_days_left > 0:
            promo_days_left -= 1
        else:
            if random.random() < 0.1: # 10% chance to start a promo
                current_promo = random.choice([p for p in PROMO_TYPES if p != "none"])
                promo_days_left = random.randint(2, 5)
            else:
                current_promo = "none"
                
        # School break (June, July, August loosely or late Dec)
        school_breaks = (d.month in [6, 7, 8]) or (d.month == 12 and d.day > 20)
        
        # Local events / Holidays
        local_event = ""
        if random.random() < 0.05:
            local_event = random.choice(holiday_events)
            
        paydays = is_payday(d)
        
        # Base visits calculation
        mean = 150
        mean *= get_day_of_week_multiplier(d)
        mean *= get_weather_multiplier(weather)
        mean *= get_promo_multiplier(current_promo)
        if local_event: mean *= 1.4
        if school_breaks: mean *= 1.1
        if paydays: mean *= 1.15
        
        # Add a seasonal trend (e.g. slight long term growth)
        seasonal_factor = 1.0 + (day / num_days) * 0.2 
        mean *= seasonal_factor
        
        # Dispersion
        dispersion = 0.15 if d.weekday() >= 4 else 0.08
        variance = mean + dispersion * mean * mean
        std = variance ** 0.5
        
        visits = int(random.gauss(mean, std))
        visits = max(20, visits)
        
        # Sales and Conversion
        base_conv = 0.35 if current_promo == "none" else 0.45
        conversion = round(base_conv * random.uniform(0.9, 1.1), 3)
        avg_spend = 32.50
        if current_promo != "none": avg_spend *= 0.85
        sales = round((visits * conversion) * avg_spend * random.uniform(0.9, 1.1), 2)
        
        open_hours = 10.0 if d.weekday() < 5 else 12.0
        
        event_date_str = d.strftime("%Y-%m-%d")
        
        lite_data.append({"event_date": event_date_str, "visits": visits})
        pro_data.append({
            "event_date": event_date_str,
            "visits": visits,
            "sales": sales,
            "conversion": conversion,
            "promo_type": current_promo if current_promo != "none" else "",
            "weather": weather,
            "paydays": paydays,
            "school_breaks": school_breaks,
            "local_events": local_event,
            "open_hours": open_hours
        })
        
    lite_fields = ["event_date", "visits"]
    pro_fields = ["event_date", "visits", "sales", "conversion", "promo_type", "weather", "paydays", "school_breaks", "local_events", "open_hours"]
    
    with open(DATA_DIR / f"{prefix}_lite.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=lite_fields)
        writer.writeheader()
        writer.writerows(lite_data)
        
    with open(DATA_DIR / f"{prefix}_pro.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=pro_fields)
        writer.writeheader()
        writer.writerows(pro_data)
        
    print(f"Generated {num_days} days of data for {prefix}")

generate_dataset(date(2023, 1, 1), 365, "1_year")
generate_dataset(date(2021, 1, 1), 1095, "3_years")
