"""Metric utilities for enforcing quality gates."""
from __future__ import annotations

import numpy as np


def smape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Symmetric mean absolute percentage error."""
    denom = (np.abs(y_true) + np.abs(y_pred)) / 2
    mask = denom != 0
    return float(np.mean(np.abs(y_true[mask] - y_pred[mask]) / denom[mask]) * 100)


def mase(y_true: np.ndarray, y_pred: np.ndarray, seasonal_period: int = 7) -> float:
    """Mean absolute scaled error."""
    diff = np.abs(y_true - y_pred)
    denominator = np.mean(np.abs(np.diff(y_true, n=seasonal_period)))
    return float(np.mean(diff) / denominator)


def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Root mean squared error."""
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
