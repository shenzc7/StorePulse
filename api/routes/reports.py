"""Reports discovery and management endpoints."""

from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/reports", tags=["reports"])


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format."""
    if size_bytes == 0:
        return "0 B"

    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024.0 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1

    return f"{size_bytes:.1f} {size_names[i]}"


@router.get("/list")
async def list_reports() -> Dict[str, Any]:
    """Dynamically discover and list all available reports."""
    try:
        reports_dir = Path(__file__).resolve().parents[2] / "reports"

        if not reports_dir.exists():
            return {
                "reports": [],
                "categories": {},
                "total_count": 0
            }

        # Define report categories and their metadata
        report_categories = {
            'backtests': {
                'title': 'Model Backtests',
                'description': 'Cross-validation results showing model accuracy',
                'icon': 'chart-bar',
                'color': 'blue'
            },
            'forecasts': {
                'title': 'Forecast Data',
                'description': 'Generated forecast results and predictions',
                'icon': 'trending-up',
                'color': 'green'
            },
            'exports': {
                'title': 'Export Reports',
                'description': 'Generated PDF reports and business documents',
                'icon': 'document',
                'color': 'purple'
            },
            'reliability': {
                'title': 'Reliability Analysis',
                'description': 'Model reliability and calibration metrics',
                'icon': 'shield-check',
                'color': 'orange'
            }
        }

        reports = []
        categories_found = {}

        # Scan all subdirectories for report files
        for category_path in reports_dir.iterdir():
            if category_path.is_dir():
                category_name = category_path.name

                # Skip if not a known category
                if category_name not in report_categories:
                    continue

                category_info = report_categories[category_name]
                categories_found[category_name] = category_info

                # Scan files in this category
                for file_path in category_path.glob('*'):
                    if file_path.is_file() and not file_path.name.startswith('.'):
                        # Get file stats
                        stat = file_path.stat()

                        # Determine file type and get appropriate metadata
                        file_ext = file_path.suffix.lower()

                        if file_ext == '.csv':
                            file_type = 'CSV'
                            description = 'Comma-separated values data file'
                        elif file_ext == '.json':
                            file_type = 'JSON'
                            description = 'JavaScript Object Notation data file'
                        elif file_ext in ['.png', '.jpg', '.jpeg', '.svg']:
                            file_type = file_ext.upper()[1:]  # Remove the dot
                            description = 'Image visualization file'
                        elif file_ext == '.pdf':
                            file_type = 'PDF'
                            description = 'Portable Document Format report'
                        elif file_ext == '.npz':
                            file_type = 'NPZ'
                            description = 'NumPy compressed array file'
                        else:
                            file_type = file_ext.upper()[1:] if file_ext else 'FILE'
                            description = f'Data file ({file_ext})'

                        # Create report entry
                        report = {
                            'id': f"{category_name}_{file_path.name}",
                            'name': file_path.stem.replace('_', ' ').title(),
                            'filename': file_path.name,
                            'path': f'/reports/{category_name}/{file_path.name}',
                            'category': category_name,
                            'category_title': category_info['title'],
                            'category_description': category_info['description'],
                            'category_icon': category_info['icon'],
                            'category_color': category_info['color'],
                            'type': file_type,
                            'size': stat.st_size,
                            'size_formatted': format_file_size(stat.st_size),
                            'modified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M'),
                            'description': description,
                            'is_downloadable': file_ext in ['.csv', '.json', '.pdf', '.png', '.jpg', '.jpeg', '.svg']
                        }

                        reports.append(report)

        # Sort by modification date (newest first)
        reports.sort(key=lambda x: x['modified'], reverse=True)

        return {
            "reports": reports,
            "categories": categories_found,
            "total_count": len(reports)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {str(e)}")


@router.get("/categories")
async def get_report_categories() -> Dict[str, Any]:
    """Get available report categories and their metadata."""
    return {
        'backtests': {
            'title': 'Model Backtests',
            'description': 'Cross-validation results showing model accuracy',
            'icon': 'chart-bar',
            'color': 'blue'
        },
        'forecasts': {
            'title': 'Forecast Data',
            'description': 'Generated forecast results and predictions',
            'icon': 'trending-up',
            'color': 'green'
        },
        'exports': {
            'title': 'Export Reports',
            'description': 'Generated PDF reports and business documents',
            'icon': 'document',
            'color': 'purple'
        },
        'reliability': {
            'title': 'Reliability Analysis',
            'description': 'Model reliability and calibration metrics',
            'icon': 'shield-check',
            'color': 'orange'
        }
    }


@router.get("/download/{category}/{filename}")
async def download_report(category: str, filename: str) -> FileResponse:
    """Download a specific report file."""
    reports_dir = Path(__file__).resolve().parents[2] / "reports"
    file_path = reports_dir / category / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(path=str(file_path), filename=filename)
