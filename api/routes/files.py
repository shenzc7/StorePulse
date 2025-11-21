"""File ingestion endpoints."""
from io import BytesIO
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

DATA_ROOT = Path(__file__).resolve().parents[2] / "data" / "samples"
MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024  # 50MB
MAX_ROWS = 10_000
ALLOWED_EXTENSIONS = {".csv", ".json", ".xlsx", ".xls"}

router = APIRouter(prefix="/files", tags=["files"])


def _enforce_row_limit(content: bytes, extension: str) -> None:
    """Ensure uploaded spreadsheet stays within supported row limits."""
    if extension == ".json":
        return

    reader = None
    try:
        if extension == ".csv":
            reader = pd.read_csv(BytesIO(content), nrows=MAX_ROWS + 1)
        elif extension in {".xlsx", ".xls"}:
            reader = pd.read_excel(BytesIO(content), nrows=MAX_ROWS + 1)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to parse file: {exc}") from exc

    if reader is not None and len(reader) > MAX_ROWS:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds {MAX_ROWS:,} row limit. Trim your data before uploading.",
        )


@router.post("/upload")
async def upload_file(payload: UploadFile = File(...)) -> dict[str, str]:
    """Persist a user-provided file into the local samples directory."""
    DATA_ROOT.mkdir(parents=True, exist_ok=True)

    original_name = Path(payload.filename or "upload.csv").name
    extension = original_name.lower().rsplit(".", 1)
    suffix = f".{extension[-1]}" if len(extension) == 2 else ".csv"

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Use CSV, JSON, XLSX, or XLS.",
        )

    content = await payload.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum supported size is 50MB.",
        )

    _enforce_row_limit(content, suffix)

    target_path = DATA_ROOT / original_name
    saved_name = original_name

    try:
        if suffix in {".xlsx", ".xls"}:
            df = pd.read_excel(BytesIO(content))
            saved_name = f"{Path(original_name).stem}.csv"
            target_path = DATA_ROOT / saved_name
            df.to_csv(target_path, index=False)
        else:
            target_path.write_bytes(content)

        return {"filename": saved_name, "path": str(target_path)}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {exc}") from exc


@router.get("/template/{template_name}")
async def download_template(template_name: str):
    """Download a data template file for user editing."""
    # Ensure the directory exists
    DATA_ROOT.mkdir(parents=True, exist_ok=True)

    # Map template names to actual filenames
    template_files = {
        "lite": "Data_Template_Lite.csv",
        "pro": "Data_Template_Pro.csv"
    }

    if template_name not in template_files:
        raise HTTPException(status_code=404, detail=f"Template '{template_name}' not found. Available: {', '.join(template_files.keys())}")

    template_path = DATA_ROOT / template_files[template_name]

    if not template_path.exists():
        raise HTTPException(status_code=404, detail=f"Template file '{template_files[template_name]}' not found")

    return FileResponse(
        path=template_path,
        media_type='text/csv',
        filename=template_files[template_name]
    )
