import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, PageBreak, Frame, PageTemplate, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# --- Theme Configuration ---
# Palette: Deep Blue & Vibrant Accents
THEME_PRIMARY = colors.HexColor('#0F172A')    # Slate 900 (Deep Navy)
THEME_SECONDARY = colors.HexColor('#3B82F6')  # Blue 500 (Vibrant Blue)
THEME_ACCENT = colors.HexColor('#06B6D4')     # Cyan 500 (Bright Accent)
TEXT_PRIMARY = colors.HexColor('#334155')     # Slate 700
TEXT_SECONDARY = colors.HexColor('#64748B')   # Slate 500
BG_LIGHT = colors.HexColor('#F8FAFC')         # Slate 50
CODE_BG = colors.HexColor('#1E293B')          # Slate 800
CODE_TEXT = colors.HexColor('#E2E8F0')        # Slate 200

# Admonition Colors
NOTE_COLOR = colors.HexColor('#EFF6FF')       # Blue 50
NOTE_BORDER = colors.HexColor('#BFDBFE')      # Blue 200
TIP_COLOR = colors.HexColor('#F0FDF4')        # Green 50
TIP_BORDER = colors.HexColor('#BBF7D0')       # Green 200
WARNING_COLOR = colors.HexColor('#FFF7ED')    # Orange 50
WARNING_BORDER = colors.HexColor('#FED7AA')   # Orange 200

def draw_cover_page(c, doc):
    """Draws a premium, graphical cover page."""
    c.saveState()
    width, height = A4
    
    # 1. Background: Deep Navy Gradient Simulation (Solid for now, but layered)
    c.setFillColor(THEME_PRIMARY)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    # 2. Abstract Geometric Shapes (The "Wow" Factor)
    # Large Circle Top Right
    c.setFillColor(colors.HexColor('#1E293B')) # Slightly lighter navy
    c.circle(width, height, 300, fill=1, stroke=0)
    
    # Accent Curve Bottom Left
    path = c.beginPath()
    path.moveTo(0, 0)
    path.lineTo(width * 0.6, 0)
    path.curveTo(width * 0.4, height * 0.2, 0, height * 0.4, 0, height * 0.5)
    path.close()
    c.setFillColor(THEME_SECONDARY)
    c.drawPath(path, fill=1, stroke=0)
    
    # Overlay Curve (Cyan)
    path = c.beginPath()
    path.moveTo(0, 0)
    path.lineTo(width * 0.4, 0)
    path.curveTo(width * 0.3, height * 0.15, 0, height * 0.3, 0, height * 0.4)
    path.close()
    c.setFillColor(THEME_ACCENT)
    c.drawPath(path, fill=1, stroke=0) # Opacity would be nice, but standard reportlab is tricky.
    
    # 3. Logo Placement
    logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "logo.jpg")
    if os.path.exists(logo_path):
        # Draw a white container for the logo
        c.setFillColor(colors.white)
        c.roundRect(width/2 - 60, height * 0.75 - 60, 120, 120, 20, fill=1, stroke=0)
        # Draw logo
        try:
            c.drawImage(logo_path, width/2 - 50, height * 0.75 - 50, width=100, height=100, preserveAspectRatio=True, mask='auto')
        except:
            pass # Fallback if image fails

    # 4. Title Typography
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 48)
    c.drawCentredString(width/2, height * 0.6, "StorePulse")
    
    c.setFont("Helvetica", 24)
    c.setFillColor(colors.HexColor('#94A3B8')) # Slate 400
    c.drawCentredString(width/2, height * 0.55, "User Manual")
    
    # 5. Decorative Line
    c.setStrokeColor(THEME_ACCENT)
    c.setLineWidth(3)
    c.line(width/2 - 50, height * 0.52, width/2 + 50, height * 0.52)
    
    # 6. Version & Date
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.white)
    c.drawCentredString(width/2, height * 0.45, "Version 1.0.0")
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor('#94A3B8'))
    c.drawCentredString(width/2, height * 0.42, "Comprehensive Guide")

    # 7. Footer Tagline
    c.setFont("Helvetica-Oblique", 12)
    c.setFillColor(colors.white)
    c.drawRightString(width - 30, 30, "Know tomorrow's visits. Act today.")

    c.restoreState()

def draw_header_footer(c, doc):
    """Draws header and footer on content pages."""
    c.saveState()
    width, height = A4
    
    # Header Background
    c.setFillColor(colors.white)
    c.rect(0, height - 60, width, 60, fill=1, stroke=0)
    
    # Header Line
    c.setStrokeColor(colors.HexColor('#E2E8F0'))
    c.setLineWidth(1)
    c.line(0, height - 60, width, height - 60)
    
    # Header Text
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(THEME_PRIMARY)
    c.drawString(50, height - 40, "StorePulse User Manual")
    
    c.setFont("Helvetica", 10)
    c.setFillColor(TEXT_SECONDARY)
    c.drawRightString(width - 50, height - 40, "v1.0.0")
    
    # Footer
    c.setStrokeColor(colors.HexColor('#E2E8F0'))
    c.line(50, 50, width - 50, 50)
    
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_SECONDARY)
    page_num = c.getPageNumber()
    c.drawString(50, 30, "© 2024 StorePulse")
    c.drawRightString(width - 50, 30, f"Page {page_num}")
    
    c.restoreState()

def create_mac_window_code_block(code_lines, styles):
    """Creates a table that looks like a MacOS terminal window."""
    # Window Header
    header_data = [['', '', '']] # Dots
    # We simulate dots with text or just colored cells. Let's use colored cells in a nested table or just drawing.
    # Actually, simpler: A table with a header row and a content row.
    
    # Join code lines
    code_text = '<br/>'.join(code_lines).replace(' ', '&nbsp;')
    p = Paragraph(code_text, styles['ModernCode'])
    
    # The "Traffic Lights"
    # We can't easily draw circles in a flowable Table unless we use a custom Flowable.
    # For simplicity/robustness, we'll use a colored header row.
    
    data = [
        [Paragraph('<font color="#FF5F56">●</font> <font color="#FFBD2E">●</font> <font color="#27C93F">●</font>', styles['WindowHeader'])],
        [p]
    ]
    
    t = Table(data, colWidths=[6.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')), # Dark header
        ('BACKGROUND', (0,1), (-1,-1), CODE_BG),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('LEFTPADDING', (0,0), (-1,0), 12),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]), # ReportLab 3.6+ supports this? If not, it ignores.
        # Fallback if rounded corners don't work is square, which is fine.
    ]))
    return t

def generate_pdf(md_path, pdf_path):
    doc = SimpleDocTemplate(
        pdf_path, 
        pagesize=A4,
        rightMargin=0.8*inch, leftMargin=0.8*inch,
        topMargin=1.2*inch, bottomMargin=1.2*inch
    )
    
    # Frames & Templates
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='normal')
    
    cover_template = PageTemplate(id='cover', frames=frame, onPage=draw_cover_page)
    normal_template = PageTemplate(id='normal', frames=frame, onPage=draw_header_footer)
    
    doc.addPageTemplates([cover_template, normal_template])
    
    styles = getSampleStyleSheet()
    
    # --- Custom Styles ---
    
    styles.add(ParagraphStyle(
        name='ModernH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        spaceBefore=30,
        spaceAfter=16,
        textColor=THEME_PRIMARY,
        borderPadding=0
    ))

    styles.add(ParagraphStyle(
        name='ModernH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=24,
        spaceBefore=24,
        spaceAfter=12,
        textColor=THEME_SECONDARY
    ))

    styles.add(ParagraphStyle(
        name='ModernH3',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        spaceBefore=16,
        spaceAfter=8,
        textColor=THEME_PRIMARY
    ))

    styles.add(ParagraphStyle(
        name='ModernBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        alignment=TA_LEFT,
        spaceAfter=10,
        textColor=TEXT_PRIMARY
    ))
    
    styles.add(ParagraphStyle(
        name='ModernCode',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=9,
        leading=12,
        textColor=CODE_TEXT,
        spaceAfter=0,
        spaceBefore=0
    ))
    
    styles.add(ParagraphStyle(
        name='WindowHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=12,
        alignment=TA_LEFT,
    ))

    # Admonition Styles
    def create_admonition_style(name, bg_color, border_color, text_color):
        return ParagraphStyle(
            name=name,
            parent=styles['BodyText'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            backColor=bg_color,
            borderColor=border_color,
            borderWidth=1,
            borderPadding=12,
            borderRadius=8,
            spaceBefore=12,
            spaceAfter=12,
            textColor=text_color
        )

    styles.add(create_admonition_style('Note', NOTE_COLOR, NOTE_BORDER, colors.HexColor('#1E40AF')))
    styles.add(create_admonition_style('Tip', TIP_COLOR, TIP_BORDER, colors.HexColor('#166534')))
    styles.add(create_admonition_style('Warning', WARNING_COLOR, WARNING_BORDER, colors.HexColor('#9A3412')))

    story = []
    
    # Force Cover Page
    story.append(Paragraph("", styles['Normal'])) 
    story.append(PageBreak())
    
    # Read Markdown
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code_block = False
    code_content = []

    for line in lines:
        line = line.rstrip()
        
        # Handle Code Blocks
        if line.startswith('```'):
            if in_code_block:
                # End of code block -> Create Mac Window
                t = create_mac_window_code_block(code_content, styles)
                story.append(t)
                story.append(Spacer(1, 12))
                in_code_block = False
                code_content = []
            else:
                in_code_block = True
            continue
        
        if in_code_block:
            code_content.append(line)
            continue

        # Skip metadata/TOC
        if line.startswith('[TOC]') or line.startswith('## Table of Contents'):
            continue

        # Headers
        if line.startswith('# '):
            if "StorePulse User Manual" in line: continue
            story.append(Paragraph(line[2:], styles['ModernH1']))
            # Decorative underline for H1
            # story.append(Spacer(1, 4))
        elif line.startswith('## '):
            story.append(Paragraph(line[3:], styles['ModernH1'])) # Map H2 to H1 style for visual hierarchy
        elif line.startswith('### '):
            story.append(Paragraph(line[4:], styles['ModernH2']))
        elif line.startswith('#### '):
            story.append(Paragraph(line[5:], styles['ModernH3']))
        
        # Images
        elif line.startswith('![') and '](' in line:
            match = re.search(r'\((.*?)\)', line)
            if match:
                img_path = match.group(1)
                full_img_path = os.path.join(os.path.dirname(md_path), img_path)
                if os.path.exists(full_img_path):
                    try:
                        img = RLImage(full_img_path)
                        aspect = img.imageHeight / float(img.imageWidth)
                        display_width = 6*inch
                        display_height = display_width * aspect
                        
                        if display_height > 8*inch:
                            scale = (8*inch) / display_height
                            display_width *= scale
                            display_height *= scale

                        img.drawWidth = display_width
                        img.drawHeight = display_height
                        
                        # Wrap image in a table to center it and maybe add a border?
                        # For now, just center it.
                        # story.append(img) # Default left
                        
                        # Centered Image
                        t = Table([[img]], colWidths=[display_width])
                        t.setStyle(TableStyle([
                            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                        ]))
                        story.append(t)
                        story.append(Spacer(1, 12))
                    except Exception:
                        pass
        
        # Lists
        elif line.strip().startswith('- ') or line.strip().startswith('* '):
            text = line.strip()[2:]
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            story.append(Paragraph(f"• {text}", styles['ModernBody'], bulletText='•'))
        elif re.match(r'^\d+\. ', line.strip()):
            text = re.sub(r'^\d+\. ', '', line.strip())
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            story.append(Paragraph(f"{line.strip().split('.')[0]}. {text}", styles['ModernBody']))
            
        # Tables (Basic rendering)
        elif '|' in line and set(line.strip()) != {'|', '-'}:
             story.append(Paragraph(line, styles['ModernCode']))

        # Admonitions (Note/Tip/Warning)
        elif line.strip().lower().startswith('note:') or line.strip().lower().startswith('**note:**'):
            text = line.strip()[5:].strip() if line.strip().lower().startswith('note:') else line.strip()[9:].strip()
            story.append(Paragraph(f"<b>NOTE:</b> {text}", styles['Note']))
        elif line.strip().lower().startswith('tip:') or line.strip().lower().startswith('**tip:**'):
            text = line.strip()[4:].strip() if line.strip().lower().startswith('tip:') else line.strip()[8:].strip()
            story.append(Paragraph(f"<b>TIP:</b> {text}", styles['Tip']))
        elif line.strip().lower().startswith('warning:') or line.strip().lower().startswith('**warning:**'):
            text = line.strip()[8:].strip() if line.strip().lower().startswith('warning:') else line.strip()[12:].strip()
            story.append(Paragraph(f"<b>WARNING:</b> {text}", styles['Warning']))

        # Normal Text
        elif line.strip():
            text = line.strip()
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
            text = re.sub(r'`(.*?)`', r'<font face="Courier" backColor="#F1F5F9"> \1 </font>', text) # Inline code style
            story.append(Paragraph(text, styles['ModernBody']))

    doc.build(story)
    print(f"PDF generated at {pdf_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    md_file = os.path.join(base_dir, "docs", "User_Manual.md")
    pdf_file = os.path.join(base_dir, "docs", "User_Manual.pdf")
    
    try:
        generate_pdf(md_file, pdf_file)
    except Exception as e:
        print(f"Error generating PDF: {e}")

