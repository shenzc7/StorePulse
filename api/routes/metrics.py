"""Model performance metrics endpoints."""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import APIRouter

from ..core import feats
from ..core.db import ModelRepository, VisitRepository
from ..core.forecast_service import ForecastService

router = APIRouter(prefix="/metrics", tags=["metrics"])


class _FrameLoader:
    """Adapter that lets feature builder consume an in-memory DataFrame."""

    def __init__(self, frame: pd.DataFrame) -> None:
        self._frame = frame

    def load(self) -> pd.DataFrame:
        return self._frame.copy()


def _safe_float(value: Any) -> Optional[float]:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(numeric):
        return None
    return numeric


def _load_model_artifact(model_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    artifact_path = model_info.get("artifact_path")
    if not artifact_path:
        return None

    path = Path(str(artifact_path))
    if not path.exists():
        return None

    try:
        payload = joblib.load(path)
    except Exception:
        return None

    if not isinstance(payload, dict):
        return None

    if "model" not in payload:
        return None

    return payload


def _compute_lite_lift(lite_metrics: Dict[str, Any]) -> float:
    smape = _safe_float(lite_metrics.get("smape"))
    ma7_smape = _safe_float(lite_metrics.get("ma7_smape"))
    if smape is None or ma7_smape is None or ma7_smape <= 0:
        return 0.0
    return round(((ma7_smape - smape) / ma7_smape) * 100.0, 1)


def _compute_pro_gain(lite_metrics: Dict[str, Any], pro_metrics: Dict[str, Any]) -> float:
    lite_smape = _safe_float(lite_metrics.get("smape"))
    pro_smape = _safe_float(pro_metrics.get("smape"))
    if lite_smape is None or pro_smape is None or lite_smape <= 0:
        return 0.0
    return round(((lite_smape - pro_smape) / lite_smape) * 100.0, 1)


def _model_predict(model: Any, design_matrix: pd.DataFrame) -> np.ndarray:
    if hasattr(model, "predict") and hasattr(model, "coef_"):
        return np.asarray(model.predict(design_matrix), dtype=float)
    if hasattr(model, "predict"):
        matrix = design_matrix.to_numpy(dtype=float, copy=True)
        return np.asarray(model.predict(exog=matrix), dtype=float)
    raise RuntimeError("Model artifact does not expose a supported predict API")


def _compute_empirical_coverage(
    model_info: Dict[str, Any],
    history: list[dict[str, Any]],
) -> Optional[float]:
    if len(history) < 45:
        return None

    artifact = _load_model_artifact(model_info)
    if not artifact:
        return None

    model = artifact.get("model")
    feature_cols = artifact.get("feature_cols") or []
    if model is None or not feature_cols:
        return None

    raw = pd.DataFrame(history)
    if raw.empty or "event_date" not in raw.columns or "visits" not in raw.columns:
        return None

    try:
        feature_frame = feats.build_features(_FrameLoader(raw))
    except Exception:
        return None

    if feature_frame.empty:
        return None

    missing = [col for col in feature_cols if col not in feature_frame.columns]
    for col in missing:
        feature_frame[col] = 0.0

    design = feature_frame.loc[:, feature_cols].apply(pd.to_numeric, errors="coerce").fillna(0.0)
    actual = pd.to_numeric(feature_frame["visits"], errors="coerce").to_numpy(dtype=float)
    if actual.size == 0:
        return None

    try:
        preds = _model_predict(model, design)
    except Exception:
        return None

    n = min(len(actual), len(preds))
    if n <= 0:
        return None

    actual = actual[-n:]
    preds = preds[-n:]

    rolling_std = (
        pd.to_numeric(feature_frame.get("rolling_std_7"), errors="coerce")
        .fillna(0.0)
        .to_numpy(dtype=float)
        if "rolling_std_7" in feature_frame.columns
        else np.zeros(n, dtype=float)
    )
    rolling_std = rolling_std[-n:]

    residual_std = np.std(actual - preds)
    floor_std = max(residual_std, 1.0)
    sigma = np.where(rolling_std > 0, rolling_std, floor_std)

    lower = preds - (1.645 * sigma)
    upper = preds + (1.645 * sigma)
    covered = (actual >= lower) & (actual <= upper)
    return round(float(np.mean(covered) * 100.0), 1)


def _measure_forecast_latency(mode: str) -> str:
    service = ForecastService()
    start = time.perf_counter()
    result = service.forecast(horizon_days=1, mode=mode)
    elapsed = time.perf_counter() - start
    if result.get("status") == "success":
        return f"{elapsed:.2f}s"
    return "Unavailable"


def calculate_model_metrics() -> dict:
    """Calculate metrics from real trained artifacts and persisted data."""
    lite_model = ModelRepository.get_latest_model("lite", "ingarch")
    pro_model = ModelRepository.get_latest_model("pro", "ingarch")

    if not lite_model and not pro_model:
        return {
            "lite_lift": 0.0,
            "pro_weekend_gain": 0.0,
            "coverage": 0.0,
            "time_to_first_forecast": "No models trained",
        }

    lite_metrics = (lite_model or {}).get("metrics") or {}
    pro_metrics = (pro_model or {}).get("metrics") or {}

    lite_lift = _compute_lite_lift(lite_metrics)
    pro_gain = _compute_pro_gain(lite_metrics, pro_metrics) if lite_model and pro_model else 0.0

    history = VisitRepository.get_visit_history(365)
    coverage_candidates: list[float] = []
    if lite_model:
        lite_coverage = _compute_empirical_coverage(lite_model, history)
        if lite_coverage is not None:
            coverage_candidates.append(lite_coverage)
    if pro_model:
        pro_coverage = _compute_empirical_coverage(pro_model, history)
        if pro_coverage is not None:
            coverage_candidates.append(pro_coverage)

    coverage = round(float(np.mean(coverage_candidates)), 1) if coverage_candidates else 0.0

    preferred_mode = "lite" if lite_model else "pro"
    latency = _measure_forecast_latency(preferred_mode)

    return {
        "lite_lift": lite_lift,
        "pro_weekend_gain": pro_gain,
        "coverage": coverage,
        "time_to_first_forecast": latency,
    }


@router.get("/")
async def get_model_metrics() -> dict:
    """Return current model performance metrics for dashboard components."""
    try:
        metrics = calculate_model_metrics()
        lite_model = ModelRepository.get_latest_model("lite", "ingarch")
        pro_model = ModelRepository.get_latest_model("pro", "ingarch")

        return {
            "lite_lift": metrics["lite_lift"],
            "pro_weekend_gain": metrics["pro_weekend_gain"],
            "coverage": metrics["coverage"],
            "time_to_first_forecast": metrics["time_to_first_forecast"],
            "model_status": {
                "lite_model_available": lite_model is not None,
                "pro_model_available": pro_model is not None,
            },
        }
    except Exception:
        return {
            "lite_lift": 0.0,
            "pro_weekend_gain": 0.0,
            "coverage": 0.0,
            "time_to_first_forecast": "Unavailable",
            "model_status": {
                "lite_model_available": False,
                "pro_model_available": False,
            },
        }
