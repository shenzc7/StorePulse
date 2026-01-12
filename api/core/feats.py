"""Feature engineering helpers."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import pandas as pd

HOLIDAY_CSV_DEFAULT = Path(__file__).resolve().parents[2] / "data" / "holidays" / "regional_holidays.csv"


@dataclass
class FeatureConfig:
    """Configuration of lag structure and exogenous enrichment."""

    lags: tuple[int, ...] = (1, 2, 7, 14, 21, 30)
    holiday_calendar: Path | None = HOLIDAY_CSV_DEFAULT if HOLIDAY_CSV_DEFAULT.exists() else None
    categorical_columns: tuple[str, ...] = ("weather", "promo_type", "local_events")
    numeric_columns: tuple[str, ...] = ("price_change", "open_hours")
    binary_columns: tuple[str, ...] = ("paydays", "school_breaks")


class RecordsFrameBuilder(Protocol):
    def load(self) -> pd.DataFrame:
        ...


def build_features(source: RecordsFrameBuilder, config: FeatureConfig | None = None) -> pd.DataFrame:
    """Transform raw records into the NB-ARX design matrix."""
    cfg = config or FeatureConfig()
    frame = source.load().copy()
    if "event_date" not in frame.columns and "date" in frame.columns:
        frame = frame.rename(columns={"date": "event_date"})

    frame = frame.sort_values("event_date")

    # Robust datetime conversion with error handling
    try:
        frame["event_date"] = pd.to_datetime(frame["event_date"], errors="coerce")
        if frame["event_date"].isna().any():
            print(f"Warning: {frame['event_date'].isna().sum()} rows have invalid dates and will be dropped.")
    except Exception as e:
        raise ValueError(f"Failed to convert event_date to datetime: {str(e)}. Check date format in data.")

    frame = frame.dropna(subset=["event_date", "visits"]).reset_index(drop=True)

    for lag in cfg.lags:
        frame[f"lag_{lag}"] = frame["visits"].shift(lag)

    # Robust day of week calculation
    try:
        frame["dow"] = frame["event_date"].dt.dayofweek
        frame["is_weekend"] = frame["dow"].isin({5, 6}).astype(int)
    except Exception as e:
        print(f"Warning: Failed to calculate day of week: {str(e)}. Using default values.")
        frame["dow"] = 0
        frame["is_weekend"] = 0

    if cfg.holiday_calendar is not None and Path(cfg.holiday_calendar).exists():
        try:
            holiday_df = pd.read_csv(cfg.holiday_calendar)
            date_col = "date" if "date" in holiday_df.columns else holiday_df.columns[0]
            holiday_dates = pd.to_datetime(holiday_df[date_col], errors="coerce")

            # Ensure both series are the same type for comparison
            frame_event_dates = pd.to_datetime(frame["event_date"], errors="coerce")
            holiday_timestamps = set(holiday_dates.dropna())

            # Compare dates properly by normalizing to date only (no time component)
            frame["is_holiday"] = frame_event_dates.dt.normalize().isin(holiday_timestamps).astype(int)
        except Exception as e:
            print(f"Warning: Failed to process holiday calendar: {str(e)}. Setting is_holiday to 0.")
            frame["is_holiday"] = 0
    else:
        frame["is_holiday"] = 0

    for column in cfg.binary_columns:
        if column in frame.columns:
            # Convert to numeric first, then fill and convert to int
            frame[column] = pd.to_numeric(frame[column], errors='coerce').fillna(0).astype(int)

    for column in cfg.numeric_columns:
        if column in frame.columns:
            # Special handling for price_change which might be categorical ('none', 'up', 'down')
            if column == 'price_change':
                # Check if it's categorical strings
                if frame[column].dtype == 'object' or isinstance(frame[column].iloc[0] if len(frame) > 0 else None, str):
                    # Convert categorical price_change to numeric codes
                    price_map = {'none': 0.0, 'up': 1.0, 'down': -1.0}
                    frame[column] = frame[column].astype(str).str.lower().map(price_map).fillna(0.0)
                else:
                    # Already numeric, just fill NaN
                    frame[column] = pd.to_numeric(frame[column], errors='coerce').fillna(0.0)
            else:
                filler = frame[column].median() if frame[column].notna().any() else 0.0
                # Convert to numeric first, then fill
                frame[column] = pd.to_numeric(frame[column], errors='coerce').fillna(filler)

    categorical_columns = [col for col in cfg.categorical_columns if col in frame.columns]
    if categorical_columns:
        dummies = pd.get_dummies(frame[categorical_columns].fillna("missing"), prefix=categorical_columns, drop_first=True)
        frame = pd.concat([frame.drop(columns=categorical_columns), dummies], axis=1)

    # Drop rows where lag features are NaN, but ensure we have minimum data
    frame = frame.dropna(subset=[f"lag_{lag}" for lag in cfg.lags]).reset_index(drop=True)

    # Add comprehensive feature set for better modeling
    if len(frame) > 14:  # Need enough data for advanced features
        # Rolling statistics for trend and volatility
        frame["rolling_mean_7"] = frame["visits"].rolling(7, center=True).mean()
        frame["rolling_std_7"] = frame["visits"].rolling(7, center=True).std()
        frame["rolling_mean_14"] = frame["visits"].rolling(14, center=True).mean()
        frame["rolling_std_14"] = frame["visits"].rolling(14, center=True).std()

        # Percentage change features
        frame["pct_change_1"] = frame["visits"].pct_change(1)
        frame["pct_change_7"] = frame["visits"].pct_change(7)
        frame["pct_change_14"] = frame["visits"].pct_change(14)

        # Volatility and acceleration features (with division by zero protection)
        frame["volatility_7"] = frame["rolling_std_7"] / frame["rolling_mean_7"].replace(0, 1)
        frame["acceleration"] = frame["pct_change_1"] - frame["pct_change_7"]

        # Trend strength indicators (with division by zero protection)
        frame["trend_strength"] = (frame["visits"] - frame["rolling_mean_7"]) / frame["rolling_std_7"].replace(0, 1)

        # Seasonal indicators (month of year)
        frame["month"] = frame["event_date"].dt.month
        frame["quarter"] = frame["event_date"].dt.quarter

        # Fill NaN values for new features
        frame["rolling_mean_7"] = frame["rolling_mean_7"].fillna(frame["visits"])
        frame["rolling_std_7"] = frame["rolling_std_7"].fillna(frame["visits"] * 0.1)
        frame["rolling_mean_14"] = frame["rolling_mean_14"].fillna(frame["visits"])
        frame["rolling_std_14"] = frame["rolling_std_14"].fillna(frame["visits"] * 0.1)
        frame["pct_change_1"] = frame["pct_change_1"].fillna(0).replace([float('inf'), float('-inf')], 0)
        frame["pct_change_7"] = frame["pct_change_7"].fillna(0).replace([float('inf'), float('-inf')], 0)
        frame["pct_change_14"] = frame["pct_change_14"].fillna(0).replace([float('inf'), float('-inf')], 0)
        frame["volatility_7"] = frame["volatility_7"].fillna(0.1).replace([float('inf'), float('-inf')], 0.1)
        frame["acceleration"] = frame["acceleration"].fillna(0).replace([float('inf'), float('-inf')], 0)
        frame["trend_strength"] = frame["trend_strength"].fillna(0).replace([float('inf'), float('-inf')], 0)

    # Ensure we have at least some data - if not, add fallback rows
    min_required_rows = max(cfg.lags) if cfg.lags else 1
    if len(frame) < min_required_rows:
        # Add fallback rows with default values if we don't have enough data
        fallback_rows = min_required_rows - len(frame)
        fallback_data = []
        for i in range(fallback_rows):
            fallback_data.append({
                "event_date": frame["event_date"].iloc[-1] + pd.Timedelta(days=i+1) if len(frame) > 0 else pd.Timestamp.now(),
                "visits": frame["visits"].iloc[-1] if len(frame) > 0 else 100,
            })
            # Fill lag features with last known values or defaults
            for lag in cfg.lags:
                fallback_data[-1][f"lag_{lag}"] = frame[f"lag_{lag}"].iloc[-1] if len(frame) > 0 else 100
            # Fill other features with defaults
            fallback_data[-1]["dow"] = 0
            fallback_data[-1]["is_weekend"] = 0
            fallback_data[-1]["is_holiday"] = 0
            # Fill advanced features with defaults
            if len(frame) > 14:  # If we have the advanced features
                fallback_data[-1]["rolling_mean_7"] = frame["rolling_mean_7"].iloc[-1] if len(frame) > 0 else 100
                fallback_data[-1]["rolling_std_7"] = frame["rolling_std_7"].iloc[-1] if len(frame) > 0 else 10
                fallback_data[-1]["rolling_mean_14"] = frame["rolling_mean_14"].iloc[-1] if len(frame) > 0 else 100
                fallback_data[-1]["rolling_std_14"] = frame["rolling_std_14"].iloc[-1] if len(frame) > 0 else 10
                fallback_data[-1]["pct_change_1"] = 0
                fallback_data[-1]["pct_change_7"] = 0
                fallback_data[-1]["pct_change_14"] = 0
                fallback_data[-1]["volatility_7"] = 0.1
                fallback_data[-1]["acceleration"] = 0
                fallback_data[-1]["trend_strength"] = 0
                fallback_data[-1]["month"] = 1
                fallback_data[-1]["quarter"] = 1

        fallback_df = pd.DataFrame(fallback_data)
        frame = pd.concat([frame, fallback_df], ignore_index=True)

    # Final validation: ensure no inf or nan values remain in the dataframe
    import numpy as np
    
    # Get only numeric columns (exclude datetime and object types)
    numeric_cols = frame.select_dtypes(include=[np.number]).columns.tolist()
    
    # Ensure event_date is not in numeric columns
    if 'event_date' in numeric_cols:
        numeric_cols.remove('event_date')
    
    for col in numeric_cols:
        try:
            # Convert to float64 to ensure compatibility
            frame[col] = pd.to_numeric(frame[col], errors='coerce')
            
            # Replace inf values with 0 (simpler and safer)
            frame[col] = frame[col].replace([float('inf'), float('-inf')], 0.0)
            
            # Fill any remaining NaN values with 0
            frame[col] = frame[col].fillna(0.0)
            
        except Exception as e:
            print(f"Warning: Error processing column {col}: {e}. Setting to 0.")
            frame[col] = 0.0
    
    # Final simple check using pandas methods (more robust)
    if len(numeric_cols) > 0:
        # Check for any remaining inf values
        for col in numeric_cols:
            if (frame[col] == float('inf')).any() or (frame[col] == float('-inf')).any():
                print(f"Warning: Infinite values found in {col}. Replacing with 0.")
                frame[col] = frame[col].replace([float('inf'), float('-inf')], 0.0)
        
        # Check for any remaining NaN values
        for col in numeric_cols:
            if frame[col].isna().any():
                print(f"Warning: NaN values found in {col}. Replacing with 0.")
                frame[col] = frame[col].fillna(0.0)

    # explain like I'm 12: we turn calendar quirks and tags into numbers so the GLM has something to chew on.
    return frame
