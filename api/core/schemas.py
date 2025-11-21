"""Shared data schemas for StorePulse."""
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, validator

PROMO_TYPES = {"none", "bogo", "percent_off", "bundle", "flash", "other"}
WEATHER_TYPES = {"sunny", "cloudy", "rainy", "storm", "humid", "normal", "unknown"}


class LiteRecord(BaseModel):
    """Minimal record for Lite mode."""
    event_date: date
    visits: int = Field(ge=0)


class ProRecord(LiteRecord):
    """Extended record for Pro mode with optional exogenous drivers."""
    sales: Optional[float] = Field(default=None, ge=0)
    conversion: Optional[float] = Field(default=None, ge=0, le=1)
    promo_type: Optional[str] = Field(default=None, max_length=50)
    price_change: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
    weather: Optional[str] = Field(default=None, max_length=32)
    paydays: Optional[bool] = None
    school_breaks: Optional[bool] = None
    local_events: Optional[str] = Field(default=None, max_length=120)
    open_hours: Optional[float] = Field(default=None, ge=0, le=24)

    @validator("promo_type")
    def validate_promo(cls, value: Optional[str]) -> Optional[str]:
        if value and value.lower() not in PROMO_TYPES:
            allowed = ", ".join(sorted(PROMO_TYPES))
            raise ValueError(f"promo_type must be one of: {allowed}")
        return value

    @validator("weather")
    def validate_weather(cls, value: Optional[str]) -> Optional[str]:
        if value and value.lower() not in WEATHER_TYPES:
            allowed = ", ".join(sorted(WEATHER_TYPES))
            raise ValueError(f"weather must be one of: {allowed}")
        return value
