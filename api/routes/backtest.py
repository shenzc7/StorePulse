"""Backtest download endpoints."""
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/backtest", tags=["backtest"])

BACKTEST_DIR = Path(__file__).resolve().parents[2] / "reports" / "backtests"


@router.get("/")
async def list_backtests() -> dict[str, list[str]]:
    """List local backtest CSV files available for inspection."""
    files = sorted(p.name for p in BACKTEST_DIR.glob("*.csv"))
    return {"files": files}
