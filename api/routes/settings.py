"""Application settings management endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from ..core.db import SettingsRepository

router = APIRouter(prefix="/settings", tags=["settings"])


class ModelConfigSettings(BaseModel):
    """NB-INGARCH model configuration settings."""
    default_forecast_horizon: int = Field(14, ge=1, le=30, description="Default forecast days ahead")
    confidence_levels: List[float] = Field([0.1, 0.5, 0.9], description="Prediction interval confidence levels")
    enable_caching: bool = Field(True, description="Enable forecast result caching")
    cache_ttl_seconds: int = Field(3600, ge=300, le=86400, description="Cache time-to-live in seconds")
    min_training_samples: int = Field(60, ge=30, le=365, description="Minimum samples required for training")
    training_timeout_seconds: int = Field(300, ge=60, le=1800, description="Training timeout in seconds")


class DataManagementSettings(BaseModel):
    """Data management and retention settings."""
    data_retention_days: int = Field(365, ge=30, le=3650, description="Days to retain historical data")
    auto_cleanup_enabled: bool = Field(True, description="Enable automatic data cleanup")
    quality_monitoring_enabled: bool = Field(True, description="Enable data quality monitoring")
    anomaly_detection_threshold: float = Field(2.5, ge=1.0, le=5.0, description="Standard deviations for anomaly detection")


class AutomationSettings(BaseModel):
    """Automation and scheduling settings."""
    auto_forecast_enabled: bool = Field(False, description="Enable automatic daily forecasts")
    auto_forecast_time: str = Field("06:00", description="Time for automatic forecasts (HH:MM)")
    auto_training_enabled: bool = Field(False, description="Enable automatic model retraining")
    auto_training_interval_days: int = Field(30, ge=7, le=90, description="Days between automatic retraining")
    alerts_enabled: bool = Field(True, description="Enable performance alerts")
    alert_accuracy_threshold: float = Field(0.8, ge=0.5, le=1.0, description="Accuracy threshold for alerts")


class SystemMonitoringSettings(BaseModel):
    """System monitoring and diagnostics settings."""
    health_check_interval_seconds: int = Field(300, ge=60, le=3600, description="Health check interval")
    performance_logging_enabled: bool = Field(True, description="Enable performance logging")
    diagnostic_mode_enabled: bool = Field(False, description="Enable detailed diagnostics")
    max_log_age_days: int = Field(30, ge=7, le=365, description="Maximum log file age")


class AdvancedConfigSettings(BaseModel):
    """Advanced configuration settings."""
    database_pool_size: int = Field(5, ge=1, le=20, description="Database connection pool size")
    api_timeout_seconds: int = Field(60, ge=10, le=300, description="API request timeout")
    logging_level: str = Field("INFO", description="Application logging level")
    enable_debug_mode: bool = Field(False, description="Enable debug mode")


class QualityGatesSettings(BaseModel):
    """Quality gates and validation settings."""
    lite_vs_baseline_improvement_pct: float = Field(8.0, ge=0.0, le=50.0, description="Required improvement over baseline")
    pro_vs_lite_improvement_pct: float = Field(10.0, ge=0.0, le=50.0, description="Required Pro vs Lite improvement")
    calibration_coverage_min: float = Field(0.85, ge=0.5, le=1.0, description="Minimum calibration coverage")
    cold_start_max_ms: int = Field(5000, ge=1000, le=30000, description="Maximum cold start time")


class ApplicationSettings(BaseModel):
    """Complete application settings model."""
    nb_ingarch_config: ModelConfigSettings
    data_management: DataManagementSettings
    automation: AutomationSettings
    system_monitoring: SystemMonitoringSettings
    advanced_config: AdvancedConfigSettings
    quality_gates: QualityGatesSettings

    # User preferences (from localStorage, but stored server-side)
    auto_run: bool = Field(True, description="Auto-run forecasts on page load")

    @validator('automation')
    def validate_automation_settings(cls, v: AutomationSettings) -> AutomationSettings:
        """Validate automation settings consistency."""
        if v.auto_forecast_enabled and not v.auto_forecast_time:
            raise ValueError("auto_forecast_time is required when auto_forecast_enabled is True")
        if v.auto_training_enabled and v.auto_training_interval_days < 7:
            raise ValueError("auto_training_interval_days must be at least 7 days")
        return v


SECTION_MODEL_MAP = {
    "nb_ingarch_config": ModelConfigSettings,
    "data_management": DataManagementSettings,
    "automation": AutomationSettings,
    "system_monitoring": SystemMonitoringSettings,
    "advanced_config": AdvancedConfigSettings,
    "quality_gates": QualityGatesSettings,
}
BOOLEAN_SECTIONS = {"auto_run"}


class UpdateSettingsRequest(BaseModel):
    """Request model for updating settings."""
    section: str
    settings: Dict[str, Any]


@router.get("/")
async def get_all_settings() -> Dict[str, Any]:
    """Get all application settings."""
    try:
        # Get settings from database
        db_settings = SettingsRepository.get_all_settings()

        # Define default settings structure
        defaults = {
            "nb_ingarch_config": {
                "default_forecast_horizon": 14,
                "confidence_levels": [0.1, 0.5, 0.9],
                "enable_caching": True,
                "cache_ttl_seconds": 3600,
                "min_training_samples": 60,
                "training_timeout_seconds": 300
            },
            "data_management": {
                "data_retention_days": 365,
                "auto_cleanup_enabled": True,
                "quality_monitoring_enabled": True,
                "anomaly_detection_threshold": 2.5
            },
            "automation": {
                "auto_forecast_enabled": False,
                "auto_forecast_time": "06:00",
                "auto_training_enabled": False,
                "auto_training_interval_days": 30,
                "alerts_enabled": True,
                "alert_accuracy_threshold": 0.8
            },
            "system_monitoring": {
                "health_check_interval_seconds": 300,
                "performance_logging_enabled": True,
                "diagnostic_mode_enabled": False,
                "max_log_age_days": 30
            },
            "advanced_config": {
                "database_pool_size": 5,
                "api_timeout_seconds": 60,
                "logging_level": "INFO",
                "enable_debug_mode": False
            },
            "quality_gates": {
                "lite_vs_baseline_improvement_pct": 8.0,
                "pro_vs_lite_improvement_pct": 10.0,
                "calibration_coverage_min": 0.85,
                "cold_start_max_ms": 5000
            },
            "auto_run": True
        }

        # Merge database settings with defaults
        merged_settings = json.loads(json.dumps(defaults))
        for key, value in db_settings.items():
            merged_settings[key] = value

        return merged_settings

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve settings: {str(e)}")


@router.put("/")
async def update_settings(request: UpdateSettingsRequest) -> Dict[str, str]:
    """Update application settings for a specific section."""
    try:
        # Validate section name
        valid_sections = {
            "nb_ingarch_config", "data_management", "automation", "system_monitoring",
            "advanced_config", "quality_gates", "auto_run"
        }

        if request.section not in valid_sections:
            raise HTTPException(status_code=400, detail=f"Invalid section: {request.section}")

        payload = request.settings
        if request.section in BOOLEAN_SECTIONS:
            if not isinstance(payload, bool):
                raise HTTPException(status_code=400, detail="Expected a boolean value.")
            SettingsRepository.set_setting(request.section, payload)
        else:
            model_cls = SECTION_MODEL_MAP.get(request.section)
            if not model_cls:
                raise HTTPException(status_code=400, detail=f"Invalid section: {request.section}")
            if not isinstance(payload, dict):
                raise HTTPException(status_code=400, detail="Settings payload must be an object.")
            validated = model_cls(**payload).model_dump()
            SettingsRepository.set_setting(request.section, validated)

        return {"status": "success", "message": f"Settings updated for section: {request.section}"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")


@router.get("/system/health")
async def get_system_health() -> Dict[str, Any]:
    """Get system health status and diagnostics."""
    try:
        import psutil
        import os
        from pathlib import Path

        # Basic system info
        system_info = {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent,
            "process_count": len(psutil.pids()),
            "uptime_seconds": int(psutil.boot_time())
        }

        # Database health
        from ..core.db import db_manager
        db_healthy = False
        try:
            with db_manager.get_connection() as conn:
                conn.execute("SELECT 1")
                db_healthy = True
        except Exception:
            db_healthy = False

        # ML models status
        from ..core.db import ModelRepository
        lite_model = ModelRepository.get_latest_model("lite", "ingarch")
        pro_model = ModelRepository.get_latest_model("pro", "ingarch")

        # Data status
        from ..core.db import VisitRepository
        data_count = len(VisitRepository.get_visit_history(365))

        return {
            "system": system_info,
            "database": {"healthy": db_healthy},
            "models": {
                "lite_available": lite_model is not None,
                "pro_available": pro_model is not None
            },
            "data": {"records_count": data_count},
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.post("/system/reset/{section}")
async def reset_section_settings(section: str) -> Dict[str, str]:
    """Reset a settings section to defaults."""
    try:
        # Define default values for each section
        defaults = {
            "nb_ingarch_config": {
                "default_forecast_horizon": 14,
                "confidence_levels": [0.1, 0.5, 0.9],
                "enable_caching": True,
                "cache_ttl_seconds": 3600,
                "min_training_samples": 60,
                "training_timeout_seconds": 300
            },
            "data_management": {
                "data_retention_days": 365,
                "auto_cleanup_enabled": True,
                "quality_monitoring_enabled": True,
                "anomaly_detection_threshold": 2.5
            },
            "automation": {
                "auto_forecast_enabled": False,
                "auto_forecast_time": "06:00",
                "auto_training_enabled": False,
                "auto_training_interval_days": 30,
                "alerts_enabled": True,
                "alert_accuracy_threshold": 0.8
            },
            "system_monitoring": {
                "health_check_interval_seconds": 300,
                "performance_logging_enabled": True,
                "diagnostic_mode_enabled": False,
                "max_log_age_days": 30
            },
            "advanced_config": {
                "database_pool_size": 5,
                "api_timeout_seconds": 60,
                "logging_level": "INFO",
                "enable_debug_mode": False
            },
            "quality_gates": {
                "lite_vs_baseline_improvement_pct": 8.0,
                "pro_vs_lite_improvement_pct": 10.0,
                "calibration_coverage_min": 0.85,
                "cold_start_max_ms": 5000
            },
            "auto_run": True
        }

        if section not in defaults:
            raise HTTPException(status_code=400, detail=f"Invalid section: {section}")

        SettingsRepository.set_setting(section, defaults[section])

        return {"status": "success", "message": f"Section '{section}' reset to defaults"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset section: {str(e)}")
