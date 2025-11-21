"""Inventory catalog helpers for What-If analysis."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

CATALOG_PATH = Path(__file__).resolve().parents[2] / "data" / "inventory" / "catalog.json"


class InventoryRepository:
    """Lightweight repository for inventory catalog data."""

    _catalog_cache: List[Dict[str, Any]] | None = None

    @classmethod
    def _load_catalog(cls) -> List[Dict[str, Any]]:
        if cls._catalog_cache is not None:
            return cls._catalog_cache

        if not CATALOG_PATH.exists():
            cls._catalog_cache = []
            return cls._catalog_cache

        try:
            cls._catalog_cache = json.loads(CATALOG_PATH.read_text())
        except json.JSONDecodeError:
            cls._catalog_cache = []
        return cls._catalog_cache

    @classmethod
    def estimate_impact(cls, visit_delta: float, top_n: int = 3) -> List[Dict[str, Any]]:
        """Distribute visit delta across top SKUs for scenario insights."""
        catalog = cls._load_catalog()
        if not catalog or visit_delta == 0:
            return []

        sorted_catalog = sorted(catalog, key=lambda item: item.get("daily_capacity", 1), reverse=True)
        top_items = sorted_catalog[:top_n]
        total_capacity = sum(item.get("daily_capacity", 1) for item in top_items)
        if total_capacity <= 0:
            total_capacity = len(top_items)

        impacts = []
        for item in top_items:
            weight = item.get("daily_capacity", 1) / total_capacity
            impacts.append({
                "sku": item["sku"],
                "name": item["name"],
                "category": item.get("category"),
                "delta": int(round(visit_delta * weight))
            })

        return impacts
