"""
Professional HTML & PDF Generator for NIRMAAN Documentation Suite
Uses Python Markdown with extra extensions and Headless Chrome print-to-pdf.
"""
import os
import subprocess
import markdown
import re

DOCS_DIR = r"e:\hackathon\docs"
ASSETS_DIR = os.path.join(DOCS_DIR, "assets")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# CSS stylesheet optimized for executive A4 printing and screen viewing
CSS_STYLE = """
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  
  @page {
    size: A4;
    margin: 20mm 16mm 20mm 16mm;
    @bottom-right {
      content: counter(page);
      font-size: 9pt;
      color: #64748b;
      font-family: 'Inter', sans-serif;
    }
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 10.5pt;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  .document-container {
    max-width: 820px;
    margin: 0 auto;
    padding: 10px 20px;
  }

  /* Header Badge Banner */
  .gov-badge {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #0f766e;
    padding-bottom: 12px;
    margin-bottom: 24px;
  }
  .gov-badge .title {
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 1px;
    color: #0f766e;
    text-transform: uppercase;
  }
  .gov-badge .sih-tag {
    background: #0f172a;
    color: #ffffff;
    font-size: 8pt;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  /* Headings */
  h1 {
    font-size: 20pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin-top: 15px;
    margin-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
  }
  h2 {
    font-size: 14pt;
    font-weight: 700;
    color: #0f766e;
    margin-top: 24px;
    margin-bottom: 10px;
    border-bottom: 1px dashed #cbd5e1;
    padding-bottom: 4px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 11.5pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 16px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }
  h4 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #475569;
    margin-top: 12px;
    margin-bottom: 4px;
  }

  p {
    margin-top: 0;
    margin-bottom: 10px;
    text-align: justify;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 18px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }
  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #0f172a;
    text-transform: uppercase;
    font-size: 8pt;
    letter-spacing: 0.5px;
  }
  td {
    padding: 7px 10px;
    border: 1px solid #cbd5e1;
    color: #334155;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }

  /* Code & Pre */
  code {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    color: #0f766e;
    padding: 2px 5px;
    border-radius: 4px;
  }
  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 12px 14px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 8pt;
    line-height: 1.45;
    margin: 12px 0 16px 0;
    page-break-inside: avoid;
    border-left: 4px solid #0d9488;
  }
  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
  }

  /* Blockquotes & Callouts */
  blockquote {
    border-left: 4px solid #0f766e;
    background: #f0fdfa;
    color: #134e4a;
    margin: 12px 0;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    font-size: 9.5pt;
  }

  /* Image Containers for Graphs */
  .graph-container {
    margin: 16px 0 20px 0;
    text-align: center;
    page-break-inside: avoid;
  }
  .graph-container img, .graph-container svg {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  }
  .graph-caption {
    font-size: 8.5pt;
    color: #64748b;
    font-weight: 500;
    margin-top: 6px;
  }

  /* Cover Page Styles */
  .cover-page {
    text-align: center;
    padding: 60px 20px 40px 20px;
    page-break-after: always;
  }
  .cover-title {
    font-size: 26pt;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }
  .cover-subtitle {
    font-size: 13pt;
    font-weight: 600;
    color: #0f766e;
    margin-bottom: 24px;
  }
  .cover-desc {
    font-size: 11pt;
    color: #475569;
    max-width: 650px;
    margin: 0 auto 30px auto;
    line-height: 1.6;
  }
  .cover-meta {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    display: inline-block;
    text-align: left;
    margin-top: 20px;
    font-size: 9pt;
  }
  .cover-meta table td {
    border: none;
    padding: 4px 10px;
    background: transparent;
  }

  /* Page Break Utilities */
  .page-break {
    page-break-after: always;
  }
</style>
"""

def read_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

def render_markdown_to_html(md_content, title, doc_type="DOCUMENTATION"):
    # Convert markdown to html using full extensions
    html_body = markdown.markdown(
        md_content,
        extensions=['tables', 'fenced_code', 'nl2br', 'sane_lists']
    )

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  {CSS_STYLE}
</head>
<body>
  <div class="document-container">
    <div class="gov-badge">
      <span class="title">Ministry of Home Affairs (MHA) &bull; I4C &bull; {doc_type}</span>
      <span class="sih-tag">SIH26183</span>
    </div>
    {html_body}
  </div>
</body>
</html>
"""
    return full_html

def convert_html_to_pdf(html_path, pdf_path):
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        f"file:///{html_path.replace(os.sep, '/')}"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(pdf_path):
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"SUCCESS: Created PDF -> {os.path.basename(pdf_path)} ({size_kb:.1f} KB)")
        return True
    else:
        print(f"ERROR: Failed to create PDF for {html_path}: {res.stderr}")
        return False

# -------------------------------------------------------------
# 2. READ & FORMAT MARKDOWN DOCS (REPLACING MERMAID WITH SVGS)
# -------------------------------------------------------------

# FORMAT PRD
prd_src = read_file(r"C:\Users\Somil\.gemini\antigravity\brain\676d7665-aace-4260-9605-1036ab62282a\PRD.md")
prd_clean = re.sub(
    r'```mermaid\s+sequenceDiagram[\s\S]*?```',
    r'''<div class="graph-container">
  <img src="./assets/diagram4_sequence_investigation.svg" alt="60-Second Investigation Sequence Diagram" />
  <div class="graph-caption">Figure 1.1: The 60-Second Field Investigation Lifecycle: From Citizen Complaint to VASP Asset Freeze</div>
</div>''',
    prd_src
)

write_file(os.path.join(DOCS_DIR, "PRD.md"), prd_clean)
prd_html_path = os.path.join(DOCS_DIR, "PRD.html")
write_file(prd_html_path, render_markdown_to_html(prd_clean, "NIRMAAN - Product Requirements Document (PRD)", "PRODUCT REQUIREMENTS DOCUMENT"))
convert_html_to_pdf(prd_html_path, os.path.join(DOCS_DIR, "PRD.pdf"))


# FORMAT TRD
trd_src = read_file(r"C:\Users\Somil\.gemini\antigravity\brain\676d7665-aace-4260-9605-1036ab62282a\TRD.md")
import re

# Cleanly replace mermaid blocks with SVG figures in TRD
trd_clean = re.sub(
    r'```mermaid\s+flowchart TD[\s\S]*?```',
    r'''<div class="graph-container">
  <img src="./assets/diagram3_system_architecture.svg" alt="System Architecture Diagram" />
  <div class="graph-caption">Figure 2.1: NIRMAAN Full Technical Architecture Decomposition</div>
</div>''',
    trd_src
)
trd_clean = re.sub(
    r'```mermaid\s+sequenceDiagram[\s\S]*?```',
    r'''<div class="graph-container">
  <img src="./assets/diagram1_sweep_forensics.svg" alt="Deposit Sweep Heuristic Forensic Architecture" />
  <div class="graph-caption">Figure 2.2: Automated Blockchain Forensics & Deposit Sweep Attribution Heuristic</div>
</div>''',
    trd_clean
)

write_file(os.path.join(DOCS_DIR, "TRD.md"), trd_clean)
trd_html_path = os.path.join(DOCS_DIR, "TRD.html")
write_file(trd_html_path, render_markdown_to_html(trd_clean, "NIRMAAN - Technical Requirements Document (TRD)", "TECHNICAL REQUIREMENTS DOCUMENT"))
convert_html_to_pdf(trd_html_path, os.path.join(DOCS_DIR, "TRD.pdf"))


# FORMAT RESEARCH
res_raw = read_file(os.path.join(DOCS_DIR, "RESEARCH.md"))
res_clean = res_raw
# Add the stakeholder flow graph to RESEARCH.md
if "## 1. Problem Statement Context" in res_clean and "diagram2_stakeholder_flow.svg" not in res_clean:
    res_clean = res_clean.replace("## 1. Problem Statement Context & The Indian Cybercrime Landscape", """## 1. Problem Statement Context & The Indian Cybercrime Landscape

<div class="graph-container">
  <img src="./assets/diagram2_stakeholder_flow.svg" alt="1930 Helpline Ecosystem & I4C Integration" />
  <div class="graph-caption">Figure 3.1: National Cybercrime Response Ecosystem & Automated Crypto Attribution Architecture</div>
</div>
""")

write_file(os.path.join(DOCS_DIR, "RESEARCH.md"), res_clean)
res_html_path = os.path.join(DOCS_DIR, "RESEARCH.html")
write_file(res_html_path, render_markdown_to_html(res_clean, "NIRMAAN - Comprehensive Research Dossier", "COMPREHENSIVE RESEARCH DOSSIER"))
convert_html_to_pdf(res_html_path, os.path.join(DOCS_DIR, "RESEARCH.pdf"))


# -------------------------------------------------------------
# 3. BUILD ALL-IN-ONE MASTER DOSSIER PDF
# -------------------------------------------------------------
master_cover = f"""
<div class="cover-page">
  <div style="font-size: 11pt; font-weight: 700; color: #0f766e; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;">
    SMART INDIA HACKATHON 2024–2026 &bull; PROBLEM STATEMENT SIH26183
  </div>
  <div style="font-size: 10pt; color: #64748b; margin-bottom: 25px;">
    Ministry of Home Affairs (MHA) &bull; Indian Cybercrime Coordination Centre (I4C)
  </div>

  <div class="cover-title">NIRMAAN: CHAINTRACE AI</div>
  <div class="cover-subtitle">Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported Suspect Wallet Addresses through Automated Blockchain Analytics</div>
  
  <div class="cover-desc">
    A sovereign, end-to-end blockchain analytics, heuristic graph tracing, and statutory legal compliance platform engineered for frontline Indian cyber police stations, the national 1930 helpline, and FIU-IND compliance enforcement.
  </div>

  <div class="graph-container" style="max-width: 720px; margin: 25px auto;">
    <img src="./assets/diagram1_sweep_forensics.svg" alt="Core Heuristic Sweep Architecture" />
  </div>

  <div class="cover-meta">
    <table>
      <tr><td><strong>Document Suite:</strong></td><td>Master Project Dossier (PRD + TRD + Research + Legal Templates)</td></tr>
      <tr><td><strong>Target Deployment:</strong></td><td>Indian Cybercrime Coordination Centre (I4C) / District CCPS</td></tr>
      <tr><td><strong>Statutory Compliance:</strong></td><td>Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 &amp; BSA, 2023</td></tr>
      <tr><td><strong>Technology Core:</strong></td><td>FastAPI 3.12, In-Memory NetworkX, Cytoscape.js, TronGrid &amp; Etherscan APIs</td></tr>
      <tr><td><strong>Status:</strong></td><td>Final Approved Specification &bull; Ready for Evaluation</td></tr>
    </table>
  </div>
</div>
<div class="page-break"></div>
"""

# Master HTML Assembly
master_html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NIRMAAN - Master Project Dossier (SIH26183)</title>
  {CSS_STYLE}
</head>
<body>
  <div class="document-container">
    {master_cover}

    <!-- PART 1: PRD -->
    <div style="margin-top: 30px;">
      <div class="gov-badge">
        <span class="title">PART I: PRODUCT REQUIREMENTS SPECIFICATION</span>
        <span class="sih-tag">SIH26183 / PRD</span>
      </div>
      {markdown.markdown(prd_clean, extensions=['tables', 'fenced_code', 'nl2br', 'sane_lists'])}
    </div>

    <div class="page-break"></div>

    <!-- PART 2: TRD -->
    <div style="margin-top: 30px;">
      <div class="gov-badge">
        <span class="title">PART II: TECHNICAL REQUIREMENTS &amp; ENGINEERING ARCHITECTURE</span>
        <span class="sih-tag">SIH26183 / TRD</span>
      </div>
      {markdown.markdown(trd_clean, extensions=['tables', 'fenced_code', 'nl2br', 'sane_lists'])}
    </div>

    <div class="page-break"></div>

    <!-- PART 3: RESEARCH & LEGAL -->
    <div style="margin-top: 30px;">
      <div class="gov-badge">
        <span class="title">PART III: GENERAL RESEARCH, COMPETITIVE INTELLIGENCE &amp; STATUTORY COMPLIANCE</span>
        <span class="sih-tag">SIH26183 / RESEARCH</span>
      </div>
      {markdown.markdown(res_clean, extensions=['tables', 'fenced_code', 'nl2br', 'sane_lists'])}
    </div>
  </div>
</body>
</html>
"""

master_html_path = os.path.join(DOCS_DIR, "NIRMAAN_MASTER_PROJECT_DOSSIER.html")
write_file(master_html_path, master_html_content)
convert_html_to_pdf(master_html_path, os.path.join(DOCS_DIR, "NIRMAAN_MASTER_PROJECT_DOSSIER.pdf"))

print("\n--- ALL DOCUMENTATION, VECTOR GRAPHS & PDFS GENERATED SUCCESSFULLY ---")
