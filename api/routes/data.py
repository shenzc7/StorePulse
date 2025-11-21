"""Operational data management routes."""
from datetime import date
import logging
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..core.db import VisitRepository
from ..core.schemas import LiteRecord, ProRecord

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/data", tags=["data"])


class AddTodayPayload(BaseModel):
    """Payload for adding today's visit count."""
    event_date: date
    visits: int


@router.post("/add_today")
async def add_today(payload: AddTodayPayload) -> dict[str, str]:
    """Add today's visit count to the database.

    This endpoint persists visit data to SQLite for use in model training and forecasting.
    Data survives app restarts and is used to build increasingly accurate models over time.
    """
    # explain like I'm 12: we save today's visitor count into our database like a diary entry.
    # This lets us remember what happened today so we can predict what might happen tomorrow.

    if payload.event_date > date.today():
        raise HTTPException(status_code=400, detail="Event date cannot be in the future.")

    record = LiteRecord(event_date=payload.event_date, visits=payload.visits)
    success = VisitRepository.add_lite_record(record)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to save visit record")

    return {
        "status": "success",
        "message": f"Recorded {payload.visits} visits for {payload.event_date}",
        "persisted": "true"
    }


@router.post("/add_today_pro")
async def add_today_pro(payload: ProRecord) -> dict[str, str]:
    """Add today's visit count with Pro mode additional data.

    Pro mode includes richer contextual data like sales, promotions, weather, etc.
    This enables more sophisticated forecasting models with better accuracy.
    """
    # explain like I'm 12: Pro mode is like keeping a detailed diary - we note not just
    # how many visitors came, but also what the weather was like, if there were sales,
    # and other details that help us make smarter predictions.

    if payload.event_date > date.today():
        raise HTTPException(status_code=400, detail="Event date cannot be in the future.")

    success = VisitRepository.add_pro_record(payload)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to save Pro visit record")

    return {
        "status": "success",
        "message": f"Recorded {payload.visits} visits with Pro data for {payload.event_date}",
        "persisted": "true"
    }


@router.get("/history")
async def get_visit_history(days: int = 365) -> Dict[str, Any]:
    """Get historical visit data for model training.

    Returns visit records from the last N days for use in training forecasting models.
    More data = better models, but training takes longer with larger datasets.
    """
    # explain like I'm 12: we look back at our diary entries to learn patterns.
    # The more diary entries we have, the better we can predict future days.

    try:
        records = VisitRepository.get_visit_history(days)

        # Safely compute date range
        date_range = {}
        if records:
            try:
                dates = [r["event_date"] for r in records if r["event_date"]]
                if dates:
                    date_range = {
                        "start": min(dates),
                        "end": max(dates)
                    }
                else:
                    date_range = {"start": None, "end": None}
            except Exception as e:
                print(f"Warning: Error computing date range: {e}")
                date_range = {"start": None, "end": None}
        else:
            date_range = {"start": None, "end": None}

        return {
            "records": records,
            "count": len(records),
            "date_range": date_range
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/latest")
async def get_latest_visits(limit: int = 30) -> Dict[str, Any]:
    """Get the most recent visit records for quick inspection.

    Useful for checking recent data quality and understanding current trends
    before running forecasts or training new models.
    """
    # explain like I'm 12: we show the most recent diary entries so you can see
    # what's been happening lately, like checking the last few pages of your diary.

    try:
        records = VisitRepository.get_latest_visits(limit)

        return {
            "records": records,
            "count": len(records)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/insights")
async def get_data_insights() -> Dict[str, Any]:
    """Get data insights and statistics for the dashboard.

    Provides summary statistics, trends, and recommendations based on
    current visit data in the database.
    """
    # explain like I'm 12: this looks at all your visitor data and tells you
    # interesting facts like how many people visit each day, what patterns
    # we see, and suggestions for what you might want to do differently.

    try:
        records = VisitRepository.get_visit_history(365)
        if not records:
            return {
                "total_records": 0,
                "date_range": "No data yet",
                "avg_daily_visits": 0,
                "data_quality_score": 0,
                "trends": {
                    "weekly_pattern": [],
                    "monthly_growth": 0,
                    "seasonal_peaks": []
                },
                "gaps": ["No data available yet"],
                "recommendations": ["Upload historical data or start adding daily visitor counts"]
            }

        df = pd.DataFrame(records)
        df["event_date"] = pd.to_datetime(df["event_date"])
        df = df.sort_values("event_date")
        df["visits"] = pd.to_numeric(df["visits"], errors="coerce").fillna(0)

        total_records = len(df)
        min_date = df["event_date"].min().date()
        max_date = df["event_date"].max().date()
        date_range = f"{min_date} to {max_date}"
        avg_daily_visits = round(df["visits"].mean(), 1)

        completeness = min(total_records / 90, 1.0)
        recent_activity = 1.0 if (date.today() - max_date).days <= 14 else 0.6
        data_quality_score = int((0.7 * completeness + 0.3 * recent_activity) * 100)

        df["dow"] = df["event_date"].dt.day_name()
        weekly_pattern_series = (
            df.groupby("dow")["visits"]
            .mean()
            .reindex(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
            .fillna(0)
        )
        weekly_pattern = [
            f"{day}: {round(value):,} avg visitors" for day, value in weekly_pattern_series.items()
        ]

        monthly_growth = 0.0
        if total_records >= 30:
            recent_window = df.tail(30)["visits"].mean()
            prior_window = df.iloc[-60:-30]["visits"].mean() if total_records >= 60 else None
            if prior_window and prior_window > 0:
                monthly_growth = ((recent_window - prior_window) / prior_window) * 100

        df["month_label"] = df["event_date"].dt.strftime("%b %Y")
        seasonal_means = df.groupby("month_label")["visits"].mean().sort_values(ascending=False)
        seasonal_peaks = [
            f"{label}: {round(value):,} avg visitors" for label, value in seasonal_means.head(3).items()
        ]

        full_range = pd.date_range(min_date, max_date)
        missing_dates = sorted(set(full_range.date) - set(df["event_date"].dt.date))
        gaps = []
        if missing_dates:
            gaps.append(f"{len(missing_dates)} days missing between {missing_dates[0]} and {missing_dates[-1]}")
        if total_records < 30:
            gaps.append("Less than 30 days of data captured")

        recommendations = []
        if data_quality_score < 70:
            recommendations.append("Upload at least 90 days of history for reliable forecasts")
        if monthly_growth > 10:
            recommendations.append("Prepare for sustained growth with additional staffing and inventory")
        elif monthly_growth < -10:
            recommendations.append("Traffic declining. Consider promotions or campaigns this month.")

        return {
            "total_records": total_records,
            "date_range": date_range,
            "avg_daily_visits": avg_daily_visits,
            "data_quality_score": data_quality_score,
            "trends": {
                "weekly_pattern": weekly_pattern,
                "monthly_growth": round(monthly_growth, 1),
                "seasonal_peaks": seasonal_peaks
            },
            "gaps": gaps or ["Data set looks healthy"],
            "recommendations": recommendations or ["Keep adding daily entries to maintain data freshness"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


@router.get("/export")
async def export_all_data(format: str = Query("csv", regex="^(csv|json|xlsx)$")) -> Any:
    """Export all visitor data in specified format.

    Args:
        format: Export format - 'csv', 'json', or 'xlsx'

    Returns:
        FileResponse with the exported data
    """
    try:
        # Get all visit records
        records = VisitRepository.get_visit_history(365*10)  # Get up to 10 years of data

        if not records:
            raise HTTPException(status_code=404, detail="No data available to export")

        # Create exports directory
        exports_dir = Path(__file__).resolve().parents[2] / "reports" / "exports"
        exports_dir.mkdir(parents=True, exist_ok=True)

        # Generate filename with timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"storepulse_data_{timestamp}.{format}"
        file_path = exports_dir / filename

        format_lower = format.lower()
        if format_lower == "csv":
            # Export as CSV
            import csv

            with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
                if records:
                    fieldnames = records[0].keys()
                    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                    writer.writeheader()
                    for record in records:
                        writer.writerow(record)

        elif format_lower == "json":
            # Export as JSON
            import json

            with open(file_path, 'w', encoding='utf-8') as jsonfile:
                json.dump(records, jsonfile, indent=2, default=str)
        elif format_lower == "xlsx":
            df = pd.DataFrame(records)
            df.to_excel(file_path, index=False)

        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Use 'csv', 'json', or 'xlsx'")

        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type=(
                'text/csv' if format_lower == 'csv'
                else 'application/json' if format_lower == 'json'
                else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/export/preview")
async def export_preview(limit: int = Query(5, ge=1, le=20)) -> Dict[str, Any]:
    """Provide a lightweight preview of the data that will be exported."""
    try:
        stats = VisitRepository.get_dataset_stats()
        sample = VisitRepository.get_latest_visits(limit)
        return {
            "total_records": stats.get("total_records", 0),
            "date_range": {
                "start": str(stats.get("min_date")) if stats.get("min_date") else None,
                "end": str(stats.get("max_date")) if stats.get("max_date") else None,
            },
            "sample": sample
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {exc}") from exc


@router.delete("/clear_all")
async def clear_all_data() -> Dict[str, Any]:
    """Clear all data from the database (visits, models, forecasts).
    
    This is a destructive operation that removes all historical data and trained models.
    Use this to start fresh with new data or reset the system completely.
    """
    try:
        from ..core.db import db_manager
        
        clear_warnings: List[str] = []

        # Clear all tables
        with db_manager.get_connection() as conn:
            conn.execute("DELETE FROM visits")
            conn.execute("DELETE FROM models")
            conn.execute("DELETE FROM forecast_cache")
            # Also clear user settings and what-if scenarios to ensure a true reset
            try:
                conn.execute("DELETE FROM settings")
            except Exception as exc:  # pragma: no cover - defensive only
                logger.warning("Unable to clear settings table during reset: %s", exc)
                clear_warnings.append("Settings table could not be cleared; remove manually if required.")
            try:
                conn.execute("DELETE FROM whatif_scenarios")
            except Exception as exc:  # pragma: no cover - defensive only
                logger.warning("Unable to clear what-if scenarios during reset: %s", exc)
                clear_warnings.append("What-If scenarios table could not be cleared; remove manually if required.")
            conn.commit()
        
        # Also clear any cached artifacts
        import shutil
        artifacts_dir = Path(__file__).resolve().parents[2] / "ml" / "artifacts"
        if artifacts_dir.exists():
            for mode_dir in ["lite", "pro"]:
                mode_path = artifacts_dir / mode_dir
                if mode_path.exists():
                    for artifact_file in mode_path.glob("*"):
                        if artifact_file.is_file():
                            artifact_file.unlink()
        
        reports_dir = Path(__file__).resolve().parents[2] / "reports"
        if reports_dir.exists():
            for report_file in reports_dir.rglob("*"):
                if report_file.is_file() and report_file.suffix in [".csv", ".json", ".png", ".npz"]:
                    report_file.unlink()
        
        response: Dict[str, Any] = {
            "status": "success",
            "message": "All data, models, forecasts, settings, and scenarios cleared successfully. System reset to clean state.",
            "cleared": "visits, models, forecast_cache, settings, whatif_scenarios, artifacts, reports"
        }
        if clear_warnings:
            response["warnings"] = clear_warnings
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear data: {str(e)}")
