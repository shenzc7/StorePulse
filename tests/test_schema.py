from datetime import date

import pytest

from api.core.schemas import LiteRecord, ProRecord


def test_lite_schema_accepts_minimal_payload() -> None:
    record = LiteRecord(event_date=date(2024, 10, 1), visits=120)
    assert record.visits == 120


def test_pro_schema_extends_lite() -> None:
    record = ProRecord(
        event_date=date(2024, 10, 1),
        visits=120,
        sales=8900.0,
        promo_type="flash",
    )
    assert record.promo_type == "flash"


def test_negative_visits_rejected() -> None:
    with pytest.raises(ValueError):
        LiteRecord(event_date=date(2024, 10, 1), visits=-1)
