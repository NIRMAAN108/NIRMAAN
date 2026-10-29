"""
NIRMAAN (ChainTrace AI) - FastAPI Entry Point
Real-Time Fraud-Linked Crypto Exchange Attribution Engine.
Features standardized enterprise error handling (400, 404, 422, 429, 500, 504).
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import json
import os

from app.models.schemas import TraceRequest, TraceResponse
from app.core.tracer import ForensicTracer
from app.core.legal_notice import generate_section_94_bnss_notice
from app.crawlers.multi_chain_crawler import detect_chain
from app.core.errors import (
    ForensicEngineException,
    InvalidWalletAddressError,
    custom_forensic_exception_handler,
    custom_starlette_http_exception_handler,
    custom_validation_exception_handler,
    generic_unhandled_exception_handler
)

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

@app.post("/api/trace", response_model=TraceResponse)
async def run_trace(req: TraceRequest):
    """
    Main forensic entry point:
    Accepts suspect TRON/EVM/Bitcoin wallet, traces multi-hop flows, runs deposit sweep detection,
    and returns graph nodes, edges, target VASP, and pre-filled Section 94 BNSS notice.
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
