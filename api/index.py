"""Vercel serverless entrypoint for FastAPI backend."""

from __future__ import annotations

import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.main import app  # noqa: E402

# Vercel Python runtime looks for `handler`.
handler = app
