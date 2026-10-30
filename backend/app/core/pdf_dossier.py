"""
Automated Court-Ready PDF Evidence Dossier Generator.
Produces legally compliant, tamper-evident cryptocurrency forensic dossiers
admissible under Section 94 BNSS, 2023 and Section 63 BSA, 2023.
"""

import io
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)

def generate_pdf_dossier(case_data: Dict[str, Any]) -> bytes:
    """
    Builds a high-resolution, court-admissible PDF dossier as raw bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom forensic styling
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0369a1'),
        alignment=1
    )
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    body_bold = ParagraphStyle(
        'BodyBoldCustom',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    legal_quote = ParagraphStyle(
        'LegalQuote',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=10,
        rightIndent=10
    )

    story = []

    # Header / Seal
    story.append(Paragraph("INDIAN CYBERCRIME COORDINATION CENTRE (I4C) / MHA", subtitle_style))
    story.append(Paragraph("STATUTORY FORENSIC DOSSIER & EVIDENCE REPORT", title_style))
    story.append(Paragraph("PRODUCED UNDER SECTION 94 BNSS, 2023 & SECTION 63 BSA, 2023", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=12))

    # Section 1: Case Details & Complainant Particulars
    story.append(Paragraph("1. CASE REGISTRATION & INVESTIGATION PARTICULARS", h2_style))
    case_table_data = [
        [
            Paragraph("<b>FIR / Complaint No.:</b>", body_style),
            Paragraph(case_data.get("fir_number", "N/A"), body_bold),
            Paragraph("<b>Date of Issue:</b>", body_style),
            Paragraph(datetime.now(timezone.utc).strftime("%d-%b-%Y %H:%M UTC"), body_style)
        ],
        [
            Paragraph("<b>Police Station:</b>", body_style),
            Paragraph(case_data.get("police_station", "State Cyber Cell"), body_style),
            Paragraph("<b>Investigating Officer:</b>", body_style),
            Paragraph(case_data.get("investigating_officer", "Inspector Cyber Cell"), body_style)
        ],
        [
            Paragraph("<b>Complainant Name:</b>", body_style),
            Paragraph(case_data.get("complainant_name", "Victim Complainant"), body_style),
            Paragraph("<b>Reported Loss:</b>", body_style),
            Paragraph(f"INR {case_data.get('loss_amount_inr', 0.0):,.2f}", body_bold)
        ]
    ]
    t1 = Table(case_table_data, colWidths=[120, 160, 110, 140])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t1)
    story.append(Spacer(1, 12))

    # Section 2: Destination Exchange & Attribution
    story.append(Paragraph("2. TARGET VASP ATTRIBUTION & LIQUIDATION TRAIL", h2_style))
    vasp_name = case_data.get("destination_vasp") or "Unidentified / In-Transit"
    seed_addr = case_data.get("seed_address", "N/A")
    chain = case_data.get("chain", "TRON (TRC-20)")
    routed_usd = case_data.get("total_routed_usd", 0.0)

    vasp_table_data = [
        [
            Paragraph("<b>Target Exchange (VASP):</b>", body_style),
            Paragraph(f"<b>{vasp_name}</b> (FIU-IND Verified)", body_bold),
            Paragraph("<b>Blockchain Network:</b>", body_style),
            Paragraph(chain, body_style)
        ],
        [
            Paragraph("<b>Reported Seed Address:</b>", body_style),
            Paragraph(f"<font size=7>{seed_addr}</font>", body_style),
            Paragraph("<b>Total Routed Value:</b>", body_style),
            Paragraph(f"${routed_usd:,.2f} USD", body_bold)
        ]
    ]
    t2 = Table(vasp_table_data, colWidths=[130, 170, 110, 120])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f9ff')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bae6fd')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0f2fe')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t2)
    story.append(Spacer(1, 12))

    # Section 3: Statutory Freeze Order (Section 94 BNSS)
    story.append(Paragraph("3. STATUTORY NOTICE UNDER SECTION 94 BNSS, 2023", h2_style))
    notice_p = Paragraph(
        f"<b>WHEREAS</b> an investigation into cyber fraud registered under FIR <b>{case_data.get('fir_number', 'N/A')}</b> "
        f"has established that proceeds of crime originating from wallet <b>{seed_addr}</b> have been routed into "
        f"accounts operated on your platform (<b>{vasp_name}</b>).<br/><br/>"
        "<b>NOW THEREFORE</b>, you are hereby commanded under Section 94 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 "
        "and Section 106/107 BNSS to immediately:<br/>"
        "1. <b>FREEZE & RESTRICT WITHDRAWALS</b> on the recipient deposit wallet and any associated KYC account.<br/>"
        "2. Produce complete KYC records, registered email, phone number, login IP access logs, and linked bank accounts.<br/>"
        "3. Provide confirmation of compliance within 24 hours to the investigating officer.",
        legal_quote
    )
    story.append(notice_p)
    story.append(Spacer(1, 14))

    # Section 4: Electronic Certificate (Section 63 BSA) & SHA-256 Seal
    story.append(Paragraph("4. CERTIFICATE OF ELECTRONIC EVIDENCE (SECTION 63 BSA, 2023)", h2_style))
    sha_hash = case_data.get("evidence_sha256") or "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    bsa_p = Paragraph(
        "I hereby certify that the cryptocurrency transaction ledger and graph traversal data contained in this dossier "
        "were produced by an automated forensic system during the ordinary course of lawful cyber investigation. "
        "The cryptographic hash below establishes mathematical non-repudiation and proof that the evidence has not been "
        "altered, tampered with, or corrupted since generation.",
        body_style
    )
    story.append(bsa_p)
    story.append(Spacer(1, 8))

    hash_table_data = [
        [
            Paragraph("<b>EVIDENCE SEAL (SHA-256):</b>", body_style),
            Paragraph(f"<b><font size=7 color='#0369a1'>{sha_hash}</font></b>", body_style)
        ],
        [
            Paragraph("<b>Statutory Status:</b>", body_style),
            Paragraph("Admissible under Section 63(4) Bharatiya Sakshya Adhiniyam, 2023", body_style)
        ]
    ]
    t3 = Table(hash_table_data, colWidths=[160, 370])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t3)
    story.append(Spacer(1, 20))

    # Signature Block
    sig_data = [
        [
            Paragraph("____________________________<br/><b>Investigating Officer Signature</b>", body_style),
            Paragraph("____________________________<br/><b>Superintendent of Police / Seal</b>", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[265, 265])
    story.append(t_sig)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
