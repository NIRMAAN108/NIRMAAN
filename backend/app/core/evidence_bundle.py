"""
Cryptographic Evidence Bundle Generator for Indian Courts & LEAs.
Packages court-admissible forensic artifacts into a signed ZIP bundle:
- PDF Forensic Dossier
- Section 94 BNSS Statutory Freeze Notice (.txt)
- Section 63 BSA Electronic Certificate (.txt)
- FIU-IND PMLA Suspicious Transaction Report (.json)
- Serialized Graph Trace Ledger (.json)
- Tabular Hop Ledger (.csv)
- SHA256SUMS.txt (Cryptographic Manifest for Non-Repudiation)
"""

import io
import csv
import json
import zipfile
import hashlib
from typing import Dict, Any

from app.core.pdf_dossier import generate_pdf_dossier
from app.core.legal_notice import (
    generate_section_94_bnss_notice,
    generate_section_63_bsa_certificate,
    get_canonical_evidence_json
)
from app.core.pmla_str import generate_fiu_ind_str
from app.models.schemas import CaseMetadata

def generate_evidence_bundle_zip(case_data: Dict[str, Any]) -> bytes:
    """
    Builds an in-memory ZIP evidence bundle containing court-ready documents
    and SHA-256 integrity manifest.
    """
    zip_buffer = io.BytesIO()
    fir_clean = case_data.get("fir_number", "CASE").replace("/", "_").replace(" ", "_")

    # 1. Generate PDF Dossier
    pdf_bytes = generate_pdf_dossier(case_data)

    # 2. Generate Section 94 BNSS Notice
    trace_data = case_data.get("trace_data", {})
    case_meta = CaseMetadata(
        fir_number=case_data.get("fir_number"),
        police_station=case_data.get("police_station"),
        investigating_officer=case_data.get("investigating_officer"),
        complainant_name=case_data.get("complainant_name"),
        loss_amount_inr=case_data.get("loss_amount_inr", 0.0)
    )
    notice_text = generate_section_94_bnss_notice(trace_data, case_meta)

    # 3. Generate Section 63 BSA Certificate
    bsa_cert = generate_section_63_bsa_certificate(trace_data, case_meta)
    bsa_text = bsa_cert.get("certificate_text", "")

    # 4. Generate FIU-IND PMLA STR JSON
    fiu_str = generate_fiu_ind_str(case_data)
    fiu_json_bytes = json.dumps(fiu_str, indent=2).encode("utf-8")

    # 5. Generate Graph Data JSON
    graph_json_bytes = json.dumps(trace_data, indent=2).encode("utf-8")

    # 6. Generate CSV Hop Ledger
    csv_buffer = io.StringIO()
    csv_writer = csv.writer(csv_buffer)
    csv_writer.writerow(["Source Address", "Target Address", "Amount", "Token", "USD Value", "Tx Hash", "Timestamp"])
    for edge in trace_data.get("edges", []):
        csv_writer.writerow([
            edge.get("source"),
            edge.get("target"),
            edge.get("amount"),
            edge.get("token", "USDT"),
            edge.get("usd_value"),
            edge.get("tx_hash"),
            edge.get("timestamp")
        ])
    csv_bytes = csv_buffer.getvalue().encode("utf-8")

    # 0. Canonical Evidence Specification (Direct verification of Section 63 BSA digest)
    canonical_spec_str = get_canonical_evidence_json(trace_data)
    canonical_spec_bytes = canonical_spec_str.encode("utf-8")

    # Artifact dictionary for checksums
    artifacts = {
        f"00_CANONICAL_EVIDENCE_SPEC_{fir_clean}.json": canonical_spec_bytes,
        f"01_COURT_DOSSIER_{fir_clean}.pdf": pdf_bytes,
        f"02_SECTION_94_BNSS_NOTICE_{fir_clean}.txt": notice_text.encode("utf-8"),
        f"03_SECTION_63_BSA_CERTIFICATE_{fir_clean}.txt": bsa_text.encode("utf-8"),
        f"04_FIU_IND_PMLA_STR_REPORT_{fir_clean}.json": fiu_json_bytes,
        f"05_FORENSIC_GRAPH_LEDGER_{fir_clean}.json": graph_json_bytes,
        f"06_TRANSACTION_HOPS_LEDGER_{fir_clean}.csv": csv_bytes,
    }

    # 7. Generate SHA256SUMS.txt manifest
    manifest_lines = []
    for filename, content in artifacts.items():
        file_sha = hashlib.sha256(content).hexdigest()
        manifest_lines.append(f"{file_sha}  {filename}")
    manifest_bytes = ("\n".join(manifest_lines) + "\n").encode("utf-8")
    artifacts["SHA256SUMS.txt"] = manifest_bytes

    # Write all to zip
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for filename, content in artifacts.items():
            zf.writestr(filename, content)

    zip_bytes = zip_buffer.getvalue()
    zip_buffer.close()
    return zip_bytes
