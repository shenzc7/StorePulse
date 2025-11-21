from pathlib import Path

import pytest


@pytest.mark.parametrize(
    "script,expected",
    [
        ("scripts/build_mac.sh", "python ml/train_nb_arx.py data/samples/lite_sample.csv"),
        ("scripts/build_win.ps1", "python ml/train_nb_arx.py data/samples/lite_sample.csv"),
    ],
)
def test_build_scripts_reference_training(script: str, expected: str) -> None:
    content = Path(script).read_text()
    assert expected in content
