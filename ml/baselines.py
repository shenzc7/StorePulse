"""Baseline models for StorePulse."""
from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass
class BaselineResult:
    name: str
    predictions: pd.Series


def moving_average(frame: pd.DataFrame, window: int = 7) -> BaselineResult:
    """Simple moving average baseline."""
    preds = frame["visits"].rolling(window=window).mean().shift(1)
    preds = preds.fillna(method="bfill")
    return BaselineResult(name=f"MA{window}", predictions=preds)


def naive(frame: pd.DataFrame) -> BaselineResult:
    """Naïve baseline predicting the previous observed value."""
    preds = frame["visits"].shift(1)
    if preds.isna().all():
        preds.iloc[0] = frame["visits"].iloc[0]
    preds = preds.fillna(method="bfill")
    # explain like I'm 12: we just repeat yesterday because sometimes “no change” is the fairest guess.
    return BaselineResult(name="Naive-1", predictions=preds)
