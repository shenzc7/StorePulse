"""Export endpoints for generating PDF reports."""
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

REPORTS_ROOT = Path(__file__).resolve().parents[3] / "reports" / "exports"

router = APIRouter(prefix="/export", tags=["export"])


class StaffingShift(BaseModel):
    """Staff shift with count delta."""
    role: str
    current: int
    suggested: int
    delta: int


class StockDelta(BaseModel):
    """Stock delta for a SKU."""
    sku: str
    name: str
    current: int
    suggested: int
    delta: int


class ForecastPoint(BaseModel):
    """Single forecast point with calibration bands."""
    date: str
    p10: float
    p50: float
    p90: float
    confidence: Optional[str] = None


class ForecastUncertainty(BaseModel):
    """Uncertainty summary for a batch of forecasts."""
    mean_interval_width: float = 0.0
    coverage_pct: Optional[float] = None


class StaffingShiftSummary(BaseModel):
    """High-level staffing shift delta summary."""
    base: int
    peak: int
    delta: int


class StaffingDay(BaseModel):
    """Staffing recommendation for a single day."""
    date: str
    predicted_visits: float
    recommended_staff: int
    role_breakdown: Dict[str, int]
    labor_cost_estimate: float
    is_high_traffic: bool
    shifts: Optional[Dict[str, StaffingShiftSummary]] = None


class InventorySkuDelta(BaseModel):
    """Inventory delta for a SKU."""
    sku: str
    name: str
    current: int
    suggested: int
    delta: int


class InventoryDay(BaseModel):
    """Inventory recommendation snapshot."""
    date: Optional[str] = None
    estimated_daily_sales: Optional[float] = None
    inventory_priorities: Dict[str, str] = {}
    sku_deltas: Optional[List[InventorySkuDelta]] = None


class ForecastDataPayload(BaseModel):
    """Structured data for export payloads."""
    forecast: List[ForecastPoint] = []
    uncertainty: Optional[ForecastUncertainty] = None
    staffing: Optional[List[StaffingDay]] = None
    inventory: Optional[List[InventoryDay]] = None
    mode: Optional[str] = None


class ExportPlanRequest(BaseModel):
    """Request body for export plan generation."""
    store_name: str
    date_range: str
    p50_forecast: float
    p10_p90_note: str
    staffing_shifts: List[StaffingShift] = []
    stock_deltas: List[StockDelta] = []
    forecast_data: Optional[ForecastDataPayload] = None
    whatif_notes: str | None = None


def _create_title_style() -> ParagraphStyle:
    """Create Apple-clean title style."""
    return ParagraphStyle(
        'Title',
        fontSize=28,
        fontName='Helvetica-Bold',
        spaceAfter=16,
        textColor=colors.HexColor('#1D1D1F')
    )


def _create_heading_style() -> ParagraphStyle:
    """Create section heading style."""
    return ParagraphStyle(
        'Heading',
        fontSize=20,
        fontName='Helvetica-Bold',
        spaceAfter=12,
        spaceBefore=24,
        textColor=colors.HexColor('#1D1D1F')
    )


def _create_body_style() -> ParagraphStyle:
    """Create body text style."""
    return ParagraphStyle(
        'Body',
        fontSize=12,
        fontName='Helvetica',
        spaceAfter=8,
        leading=16,
        textColor=colors.HexColor('#424245')
    )


def _create_highlight_style() -> ParagraphStyle:
    """Create highlighted text style."""
    return ParagraphStyle(
        'Highlight',
        fontSize=16,
        fontName='Helvetica-Bold',
        spaceAfter=12,
        spaceBefore=8,
        textColor=colors.HexColor('#007AFF')
    )


def _generate_plan_pdf(request: ExportPlanRequest, output_path: Path) -> None:
    """Generate a clean PDF plan using reportlab with real forecast data."""
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=1*inch,
        leftMargin=1*inch,
        topMargin=1*inch,
        bottomMargin=1*inch
    )

    # Extract data from forecast
    forecast_payload = request.forecast_data
    forecast_points = forecast_payload.forecast if forecast_payload else []

    # Build content
    story = []

    # Styles
    title_style = _create_title_style()
    heading_style = _create_heading_style()
    body_style = _create_body_style()
    highlight_style = _create_highlight_style()

    # Title
    story.append(Paragraph("Store Operations Plan", title_style))
    story.append(Spacer(1, 12))

    # Store info
    story.append(Paragraph(f"<b>Store:</b> {request.store_name}", body_style))

    # Date range from forecast
    if forecast_points:
        start_date = forecast_points[0].date
        end_date = forecast_points[-1].date
        story.append(Paragraph(f"<b>Period:</b> {start_date} to {end_date}", body_style))
    else:
        story.append(Paragraph(f"<b>Period:</b> {request.date_range}", body_style))

    story.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", body_style))
    story.append(Paragraph(
        f"<b>Mode:</b> {(forecast_payload.mode if forecast_payload and forecast_payload.mode else 'lite').upper()} Model",
        body_style
    ))
    story.append(Spacer(1, 20))

    # Forecast section
    if forecast_points:
        story.append(Paragraph("📊 Visit Forecast", heading_style))

        # Summary stats
        total_p50 = sum(point.p50 for point in forecast_points)
        avg_p50 = total_p50 / len(forecast_points)
        story.append(Paragraph(f"{total_p50:,.0f} total expected visits ({avg_p50:.0f} avg/day)", highlight_style))

        # Uncertainty note
        mean_width = (
            forecast_payload.uncertainty.mean_interval_width
            if forecast_payload and forecast_payload.uncertainty
            else 0
        )
        story.append(Paragraph(f"P10-P90 bands average {mean_width:.1f} visits wide for planning confidence", body_style))
        story.append(Spacer(1, 16))
    else:
        story.append(Paragraph("📊 Visit Forecast", heading_style))
        story.append(Paragraph(
            f"{request.p50_forecast:,.0f} total expected visits over {request.date_range}",
            highlight_style
        ))
        story.append(Paragraph(request.p10_p90_note, body_style))
        story.append(Spacer(1, 16))

        # Daily forecast table (first 7 days for readability)
        forecast_table_data = [["Date", "P10", "P50", "P90", "Confidence"]]
        for point in forecast_points[:7]:  # First week
            width = point.p90 - point.p10
            confidence = "High" if width < 20 else "Medium" if width < 40 else "Low"
            forecast_table_data.append([
                point.date,
                f"{point.p10:,}",
                f"{point.p50:,}",
                f"{point.p90:,}",
                point.confidence or confidence
            ])

        forecast_table = Table(forecast_table_data, colWidths=[1.2*inch, 0.8*inch, 0.8*inch, 0.8*inch, 1*inch])
        forecast_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F2F2F7')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1D1D1F')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E5EA'))
        ]))

        story.append(forecast_table)
        story.append(Spacer(1, 16))

    # Staffing section
    staffing_data = forecast_payload.staffing if forecast_payload and forecast_payload.staffing else []
    if staffing_data:
        story.append(Paragraph("👥 Staffing Recommendations", heading_style))

        first_day_staffing = staffing_data[0]
        breakdown = first_day_staffing.role_breakdown or {}
        if breakdown:
            staffing_table_data = [["Role", "Assigned", "Notes"]]
            for role, assigned in breakdown.items():
                note = "High traffic buffer" if first_day_staffing.is_high_traffic else "Core coverage"
                staffing_table_data.append([
                    role.replace('_', ' ').title(),
                    str(assigned),
                    note
                ])

            staffing_table = Table(staffing_table_data, colWidths=[1.6*inch, 1.1*inch, 2*inch])
            staffing_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F2F2F7')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1D1D1F')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E5EA'))
            ]))

            story.append(staffing_table)
            story.append(Paragraph(
                f"Total staff target: {first_day_staffing.recommended_staff} "
                f"(labor cost ₹{first_day_staffing.labor_cost_estimate:,.0f})",
                body_style
            ))
            story.append(Spacer(1, 16))
    elif request.staffing_shifts:
        story.append(Paragraph("👥 Staffing Recommendations", heading_style))
        staffing_table_data = [["Role", "Current", "Suggested", "Delta"]]
        for shift in request.staffing_shifts:
            delta_text = f"+{shift.delta}" if shift.delta > 0 else str(shift.delta)
            if shift.delta > 0:
                delta_text = f'<font color="#34C759">{delta_text}</font>'
            elif shift.delta < 0:
                delta_text = f'<font color="#FF3B30">{delta_text}</font>'
            else:
                delta_text = '<font color="#8E8E93">No change</font>'
            staffing_table_data.append([
                shift.role.replace("_", " ").title(),
                str(shift.current),
                str(shift.suggested),
                delta_text
            ])
        staffing_table = Table(staffing_table_data, colWidths=[1.5*inch, 1*inch, 1*inch, 1.5*inch])
        staffing_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F2F2F7')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1D1D1F')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E5EA'))
        ]))
        story.append(staffing_table)
        story.append(Spacer(1, 16))

    # Inventory section
    inventory_data = forecast_payload.inventory if forecast_payload and forecast_payload.inventory else []
    if inventory_data:
        story.append(Paragraph("📦 Inventory Recommendations", heading_style))

        first_day_inventory = inventory_data[0]
        sku_deltas = first_day_inventory.sku_deltas or []

        if sku_deltas:
            inventory_table_data = [["SKU", "Product", "Current", "Suggested", "Change"]]
            for sku in sku_deltas[:5]:  # Top 5 SKUs
                change_text = f"+{sku.delta}" if sku.delta > 0 else str(sku.delta)
                if sku.delta > 0:
                    change_text = f'<font color="#34C759">{change_text}</font>'
                elif sku.delta < 0:
                    change_text = f'<font color="#FF3B30">{change_text}</font>'
                else:
                    change_text = '<font color="#8E8E93">No change</font>'

                inventory_table_data.append([
                    sku.sku,
                    sku.name[:18] + "..." if len(sku.name) > 18 else sku.name,
                    str(sku.current),
                    str(sku.suggested),
                    change_text
                ])

            inventory_table = Table(inventory_table_data, colWidths=[0.8*inch, 2*inch, 0.8*inch, 0.8*inch, 1*inch])
            inventory_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F2F2F7')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1D1D1F')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 1), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E5EA'))
            ]))

            story.append(inventory_table)
            story.append(Spacer(1, 16))
        elif first_day_inventory.inventory_priorities:
            inventory_table_data = [["Category", "Action"]]
            for category, action in first_day_inventory.inventory_priorities.items():
                inventory_table_data.append([
                    category.replace('_', ' ').title(),
                    action.replace('_', ' ').title()
                ])

            inventory_table = Table(inventory_table_data, colWidths=[2.5*inch, 2.5*inch])
            inventory_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F2F2F7')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1D1D1F')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E5EA'))
            ]))

            story.append(inventory_table)
            story.append(Spacer(1, 16))
    elif request.stock_deltas:
        story.append(Paragraph("📦 Inventory Recommendations", heading_style))
        inventory_table_data = [["SKU", "Product", "Current", "Suggested", "Change"]]
        for sku in request.stock_deltas[:5]:
            change_text = f"+{sku.delta}" if sku.delta > 0 else str(sku.delta)
            if sku.delta > 0:
                change_text = f'<font color="#34C759">{change_text}</font>'
            elif sku.delta < 0:
                change_text = f'<font color="#FF3B30">{change_text}</font>'
            else:
                change_text = '<font color="#8E8E93">No change</font>'
            inventory_table_data.append([
                sku.sku,
                sku.name[:18] + "..." if len(sku.name) > 18 else sku.name,
                str(sku.current),
                str(sku.suggested),
                change_text
            ])
        inventory_table = Table(inventory_table_data, colWidths=[0.8*inch, 2*inch, 0.8*inch, 0.8*inch, 1*inch])
        inventory_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F2F2F7')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1D1D1F')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E5EA'))
        ]))
        story.append(inventory_table)
        story.append(Spacer(1, 16))

    # What-If notes section
    if request.whatif_notes:
        story.append(Paragraph("💡 Scenario Notes", heading_style))
        story.append(Paragraph(request.whatif_notes, body_style))
        story.append(Spacer(1, 16))

    # Footer
    story.append(Spacer(1, 32))
    footer_style = ParagraphStyle(
        'Footer',
        fontSize=10,
        fontName='Helvetica',
        textColor=colors.HexColor('#8E8E93'),
        alignment=1  # Center
    )
    story.append(Paragraph("Generated by StorePulse • storepulse.app", footer_style))

    # Build PDF
    doc.build(story)


@router.post("/plan")
async def export_plan(request: ExportPlanRequest) -> dict[str, Any]:
    """Generate and save a clean PDF plan based on real forecast data.

    This endpoint creates a professional operations plan PDF using:
    - Live forecast data with P10/P50/P90 prediction intervals
    - AI-generated staffing recommendations by role
    - Inventory stocking suggestions based on forecast deltas
    - What-If scenario notes (optional)

    The PDF includes tables, confidence indicators, and business intelligence
    formatted for executive review and operational planning.
    """
    # explain like I'm 12: we take all the smart predictions and recommendations and put them
    # into a pretty PDF report that looks professional, like a business report card that shows
    # what to expect and how to prepare for the coming days.

    try:
        # Ensure exports directory exists
        REPORTS_ROOT.mkdir(parents=True, exist_ok=True)

        # Generate filename with current date
        today = date.today().strftime("%Y%m%d")
        filename = f"plan_{today}.pdf"
        output_path = REPORTS_ROOT / filename

        # Generate PDF with real forecast data
        _generate_plan_pdf(request, output_path)

        if request.forecast_data and request.forecast_data.forecast:
            forecast_points = request.forecast_data.forecast
            total = sum(point.p50 for point in forecast_points)
            avg = total / len(forecast_points) if forecast_points else 0
            interval_width = request.forecast_data.uncertainty.mean_interval_width if request.forecast_data.uncertainty else 0
        else:
            total = request.p50_forecast
            avg = request.p50_forecast
            interval_width = 0

        return {
            "filename": filename,
            "path": str(output_path),
            "download_url": f"/export/download/{filename}",
            "forecast_summary": {
                "total_visits": total,
                "avg_daily": avg,
                "uncertainty_width": interval_width
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


@router.get("/download/{filename}")
async def download_plan(filename: str) -> FileResponse:
    """Download a generated plan PDF."""
    file_path = REPORTS_ROOT / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/pdf"
    )


@router.get("/list")
async def list_exports() -> dict[str, list[str]]:
    """List all available export files."""
    if not REPORTS_ROOT.exists():
        return {"files": []}
    
    files = [f.name for f in REPORTS_ROOT.glob("*.pdf")]
    files.sort(reverse=True)  # Most recent first
    
    return {"files": files}
