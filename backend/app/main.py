"""
NIRMAAN (ChainTrace AI) - FastAPI Entry Point
Real-Time Fraud-Linked Crypto Exchange Attribution Engine (SIH26183 / I4C).
Features standardized enterprise error handling (400, 404, 422, 429, 500, 504),
SQLite Case Vault persistence, ML Risk & Peeling Analytics, NCRP 1930 Incident Ingestion,
FIU-IND PMLA STR Reporting, and Cryptographic Court-Ready Evidence Bundles.
"""
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, Field
import json
import os
import re
from typing import List, Optional, Dict, Any

from app.models.schemas import TraceRequest, TraceResponse, CaseCreateRequest, CaseRecord
from app.core.tracer import ForensicTracer
from app.core.legal_notice import generate_section_94_bnss_notice
from app.core.pdf_dossier import generate_pdf_dossier
from app.core.evidence_bundle import generate_evidence_bundle_zip
from app.core.pmla_str import generate_fiu_ind_str
from app.core.ncrp_parser import parse_ncrp_complaint, ExtractedComplaintData
from app.crawlers.multi_chain_crawler import detect_chain
from app.db.case_service import save_case, list_cases, get_case
from app.core.errors import (
    ForensicEngineException,
    InvalidWalletAddressError,
    custom_forensic_exception_handler,
    custom_starlette_http_exception_handler,
    custom_validation_exception_handler,
    generic_unhandled_exception_handler
)

class NCRPParseRequest(BaseModel):
    text: str = Field(..., description="Unstructured 1930 Helpline or NCRP complaint text")

app = FastAPI(
    title="NIRMAAN Forensic Tracing Engine",
    description="Automated Real-Time Identification of Fraud-Linked Crypto Exchanges (SIH26183 / I4C)",
    version="1.0.0"
)

# -------------------------------------------------------------
# 1. REGISTER GLOBAL EXCEPTION HANDLERS (400, 404, 422, 429, 500, 504)
# -------------------------------------------------------------
app.add_exception_handler(ForensicEngineException, custom_forensic_exception_handler)
app.add_exception_handler(StarletteHTTPException, custom_starlette_http_exception_handler)
app.add_exception_handler(RequestValidationError, custom_validation_exception_handler)
app.add_exception_handler(Exception, generic_unhandled_exception_handler)

# -------------------------------------------------------------
# 2. CORS MIDDLEWARE
# -------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend directory if it exists
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")

tracer = ForensicTracer()

@app.get("/")
def health_check():
    return {
        "status": "online",
        "system": "NIRMAAN Blockchain Forensic Engine",
        "problem_statement": "SIH26183",
        "issuing_authority": "Ministry of Home Affairs (MHA) / I4C",
        "supported_chains": ["TRON (TRC-20)", "Ethereum (ERC-20)", "BSC (BEP-20)", "Bitcoin (UTXO)"],
        "tracked_vasps_count": len(tracer.vasp_db)
    }

@app.get("/api/vasps")
def list_vasps():
    """Returns curated directory of tracked exchanges and hot wallets."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(base_dir, "data", "vasp_directory.json")
    if not os.path.exists(path):
        raise StarletteHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VASP Intelligence Directory file not found on server."
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/ncrp/parse", response_model=ExtractedComplaintData)
def parse_complaint_endpoint(req: NCRPParseRequest):
    """
    Automated NLP & Regex extractor for NCRP / 1930 complaints.
    Extracts suspect wallets, transaction hashes, loss amounts, and FIR ticket IDs.
    """
    return parse_ncrp_complaint(req.text)

@app.post("/api/trace", response_model=TraceResponse)
async def run_trace(req: TraceRequest):
    """
    Main forensic entry point:
    Accepts suspect TRON/EVM/Bitcoin wallet, traces multi-hop flows, runs deposit sweep detection,
    and returns graph nodes with ML risk scoring, edges, target VASP, and pre-filled Section 94 notice.
    """
    chain = detect_chain(req.seed_address)
    if chain == "unknown":
        raise InvalidWalletAddressError(
            address=req.seed_address,
            details="Unrecognized blockchain address format. Supported: TRON (starts with 'T'), EVM (starts with '0x'), Bitcoin (starts with 'bc1', '1', or '3')."
        )

    response = await tracer.trace(req)
    # Generate legal notice
    response.section_94_notice_text = generate_section_94_bnss_notice(response, req.case_metadata)
    return response

# -------------------------------------------------------------
# 3. CASE VAULT & EVIDENCE PACKAGING ENDPOINTS (Vertical 3)
# -------------------------------------------------------------
@app.post("/api/cases", response_model=CaseRecord, status_code=status.HTTP_201_CREATED)
def create_case_record(req: CaseCreateRequest):
    """Persists an investigated trace into the SQLite Case Vault."""
    return save_case(req)

@app.get("/api/cases", response_model=List[CaseRecord])
def get_recent_cases(limit: int = 50):
    """Lists past investigated cases from the Case Vault."""
    return list_cases(limit=limit)

@app.get("/api/cases/{case_id}")
def get_case_details(case_id: str):
    """Retrieves full case details including raw graph trace data."""
    case = get_case(case_id)
    if not case:
        raise StarletteHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case ID '{case_id}' not found in Case Vault."
        )
    return case

@app.get("/api/cases/{case_id}/dossier")
def download_case_dossier(case_id: str):
    """Generates and streams an official court-admissible PDF evidence dossier."""
    case = get_case(case_id)
    if not case:
        raise StarletteHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case ID '{case_id}' not found in Case Vault."
        )
    pdf_bytes = generate_pdf_dossier(case)
    raw_fir = str(case.get('fir_number', 'CASE'))
    fir_clean = re.sub(r'[^a-zA-Z0-9_\-]', '_', raw_fir).strip('_') or 'CASE'
    filename = f"NIRMAAN_DOSSIER_{fir_clean}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/cases/{case_id}/bundle")
def download_case_evidence_bundle(case_id: str):
    """
    Generates and streams a court-sealed ZIP evidence bundle containing:
    PDF dossier, Section 94 notice, Section 63 BSA certificate, FIU-IND STR,
    CSV hop ledger, JSON graph, and SHA256SUMS.txt manifest.
    """
    case = get_case(case_id)
    if not case:
        raise StarletteHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case ID '{case_id}' not found in Case Vault."
        )
    zip_bytes = generate_evidence_bundle_zip(case)
    raw_fir = str(case.get('fir_number', 'CASE'))
    fir_clean = re.sub(r'[^a-zA-Z0-9_\-]', '_', raw_fir).strip('_') or 'CASE'
    filename = f"NIRMAAN_EVIDENCE_BUNDLE_{fir_clean}.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/cases/{case_id}/str")
def get_case_fiu_str(case_id: str):
    """Generates structured FIU-IND PMLA Suspicious Transaction Report (STR) payload."""
    case = get_case(case_id)
    if not case:
        raise StarletteHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case ID '{case_id}' not found in Case Vault."
        )
    return generate_fiu_ind_str(case)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
