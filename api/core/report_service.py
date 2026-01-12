"""
Service for generating high-quality PDF reports using ReportLab and Matplotlib.
"""

import os
import io
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, 
    PageBreak, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.widgets.markers import makeMarker

# Configure matplotlib for non-interactive backend
plt.switch_backend('Agg')

class ReportService:
    """Service to generate professional PDF reports."""
    
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Define custom paragraph styles for the report."""
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            leading=28,
            alignment=1, # Center
            spaceAfter=30,
            textColor=colors.HexColor('#1a56db') # Blue-700
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            leading=20,
            spaceBefore=20,
            spaceAfter=10,
            textColor=colors.HexColor('#111827'), # Gray-900
            borderPadding=(0, 0, 5, 0),
            borderWidth=0,
            borderColor=colors.HexColor('#e5e7eb')
        ))
        
        self.styles.add(ParagraphStyle(
            name='MetricLabel',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#6b7280'), # Gray-500
            alignment=1 # Center
        ))
        
        self.styles.add(ParagraphStyle(
            name='MetricValue',
            parent=self.styles['Normal'],
            fontSize=18,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#111827'), # Gray-900
            alignment=1, # Center
            spaceAfter=10
        ))
        
        self.styles.add(ParagraphStyle(
            name='InsightText',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#374151') # Gray-700
        ))

    def generate_forecast_chart(self, predictions: List[Dict[str, Any]]) -> io.BytesIO:
        """Generate a forecast chart image using matplotlib."""
        dates = [datetime.strptime(p['date'], '%Y-%m-%d') for p in predictions]
        visits = [p['predicted_visits'] for p in predictions]
        lower = [p['lower_bound'] for p in predictions]
        upper = [p['upper_bound'] for p in predictions]
        
        fig, ax = plt.subplots(figsize=(10, 4))
        
        # Plot mean forecast
        ax.plot(dates, visits, color='#2563eb', linewidth=2, label='Forecast')
        
        # Plot uncertainty interval
        ax.fill_between(dates, lower, upper, color='#bfdbfe', alpha=0.5, label='90% Confidence')
        
        # Highlight weekends
        for i, date in enumerate(dates):
            if date.weekday() >= 5: # Saturday or Sunday
                ax.axvspan(date - timedelta(days=0.5), date + timedelta(days=0.5), 
                          color='#f3f4f6', alpha=0.5, zorder=0)

        ax.set_title('14-Day Traffic Forecast', fontsize=12, pad=10)
        ax.set_ylabel('Projected Visitors')
        ax.grid(True, linestyle='--', alpha=0.3)
        ax.legend(loc='upper right', frameon=False)
        
        # Format dates
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=300)
        img_buffer.seek(0)
        plt.close(fig)
        
        return img_buffer

    def _create_cover_page(self, canvas, doc):
        """Draw the cover page."""
        canvas.saveState()
        
        # Background graphics
        canvas.setFillColor(colors.HexColor('#f9fafb'))
        canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        
        # Branding Header
        canvas.setFillColor(colors.HexColor('#1a56db'))
        canvas.rect(0, A4[1] - 100, A4[0], 100, fill=1, stroke=0)
        
        canvas.setFillColor(colors.white)
        canvas.setFont('Helvetica-Bold', 30)
        canvas.drawString(50, A4[1] - 60, "StorePulse")
        canvas.setFont('Helvetica', 14)
        canvas.drawString(50, A4[1] - 85, "Intelligent Demand Forecasting")
        
        # Report Details
        canvas.setFillColor(colors.HexColor('#111827'))
        canvas.setFont('Helvetica-Bold', 24)
        canvas.drawCentredString(A4[0]/2, A4[1]/2 + 50, "Strategic Forecast Report")
        
        canvas.setFont('Helvetica', 14)
        canvas.setFillColor(colors.HexColor('#4b5563'))
        today = datetime.now().strftime('%B %d, %Y')
        canvas.drawCentredString(A4[0]/2, A4[1]/2, f"Generated on {today}")
        
        canvas.restoreState()

    def generate_pdf(self, forecast_data: Dict[str, Any], filename: str) -> str:
        """
        Generate a comprehensive PDF report from forecast data.
        
        Args:
            forecast_data: The JSON response from the forecast API
            filename: Name of the output PDF file
            
        Returns:
            Absolute path to the generated PDF
        """
        file_path = self.output_dir / filename
        doc = SimpleDocTemplate(
            str(file_path),
            pagesize=A4,
            rightMargin=50, leftMargin=50,
            topMargin=50, bottomMargin=50
        )
        
        story = []
        
        # --- TITLE PAGE is handled by page template usually, but we'll specific layouts
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Strategic Demand Forecast", self.styles['ReportTitle']))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", 
                             self.styles['Normal']))
        story.append(Paragraph(f"Horizon: {len(forecast_data.get('predictions', []))} days", 
                             self.styles['Normal']))
        story.append(Paragraph(f"Model Mode: {forecast_data.get('mode_used', 'Unknown').upper()}", 
                             self.styles['Normal']))
        story.append(PageBreak())
        
        # --- EXECUTIVE SUMMARY ---
        story.append(Paragraph("Executive Summary", self.styles['SectionHeader']))
        
        predictions = forecast_data.get('predictions', [])
        if not predictions:
            story.append(Paragraph("No prediction data available.", self.styles['Normal']))
            doc.build(story)
            return str(file_path)
            
        total_visits = sum(p['predicted_visits'] for p in predictions)
        avg_visits = total_visits / len(predictions)
        peak_day = max(predictions, key=lambda x: x['predicted_visits'])
        
        # Summary Metrics Grid
        data = [
            [
                Paragraph("Total Projected Traffic", self.styles['MetricLabel']),
                Paragraph("Average Daily Visits", self.styles['MetricLabel']),
                Paragraph("Peak Traffic Day", self.styles['MetricLabel'])
            ],
            [
                Paragraph(f"{int(total_visits):,}", self.styles['MetricValue']),
                Paragraph(f"{int(avg_visits):,}", self.styles['MetricValue']),
                Paragraph(f"{int(peak_day['predicted_visits']):,}", self.styles['MetricValue'])
            ],
            [
                Paragraph("Next 14 Days", self.styles['MetricLabel']),
                Paragraph("Baseline", self.styles['MetricLabel']),
                Paragraph(f"{peak_day['day_of_week']}", self.styles['MetricLabel'])
            ]
        ]
        
        tbl = Table(data, colWidths=[2.2*inch]*3)
        tbl.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e5e7eb')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 20))
        
        # --- FORECAST VISUALIZATION ---
        story.append(Paragraph("Traffic Forecast Trend", self.styles['SectionHeader']))
        chart_buffer = self.generate_forecast_chart(predictions)
        img = Image(chart_buffer, width=6*inch, height=3*inch)
        story.append(img)
        story.append(Spacer(1, 10))
        
        # --- STAFFING PLAN ---
        story.append(Paragraph("Staffing Recommendations", self.styles['SectionHeader']))
        
        staffing_recs = forecast_data.get('staffing_recommendations', [])
        if staffing_recs:
            table_data = [['Date', 'Day', 'Traffic', 'Rec. Staff', 'Cost Est.']]
            
            for rec in staffing_recs[:14]: # Show first 2 weeks
                date_obj = datetime.strptime(rec['date'], '%Y-%m-%d')
                day_str = date_obj.strftime('%a')
                table_data.append([
                    rec['date'],
                    day_str,
                    f"{int(rec['predicted_visits']):,}",
                    str(rec['recommended_staff']),
                    f"INR {int(rec['labor_cost_estimate']):,}"
                ])
                
            staff_table = Table(table_data, colWidths=[1.2*inch, 0.8*inch, 1.2*inch, 1.2*inch, 1.5*inch])
            staff_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#111827')),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 10),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
            ]))
            story.append(staff_table)
        else:
            story.append(Paragraph("No staffing data available.", self.styles['Normal']))

        story.append(PageBreak())
        
        # --- INVENTORY RISKS ---
        story.append(Paragraph("Inventory Risk Analysis", self.styles['SectionHeader']))
        
        alerts = forecast_data.get('inventory_alerts', [])
        high_risk = [a for a in alerts if a.get('stockout_risk') == 'high']
        
        if high_risk:
            story.append(Paragraph("⚠️ High Risk Alerts Detected", 
                                 ParagraphStyle('Warning', parent=self.styles['Normal'], textColor=colors.red)))
            
            risk_data = [['Date', 'Risk Level', 'Est. Sales', 'Action']]
            for alert in high_risk[:10]: # Top 10 risks
                 risk_data.append([
                     alert['date'],
                     alert['stockout_risk'].upper(),
                     str(alert['estimated_daily_sales']),
                     alert.get('recommended_action', 'Restock immediately')
                 ])
            
            risk_table = Table(risk_data, colWidths=[1.2*inch, 1*inch, 1*inch, 2.5*inch])
            risk_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#fee2e2')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.red),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fecaca')),
            ]))
            story.append(risk_table)
        else:
            story.append(Paragraph("No high-risk inventory alerts detected for this period.", self.styles['Normal']))
            
        doc.build(story)
        return str(file_path)

if __name__ == "__main__":
    # Test execution
    print("Report Service Module Loaded")
