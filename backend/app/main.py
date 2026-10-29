"""
NIRMAAN (ChainTrace AI) - FastAPI Entry Point
Real-Time Fraud-Linked Crypto Exchange Attribution Engine.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os

from app.models.schemas import TraceRequest, TraceResponse
from app.core.tracer import ForensicTracer
from app.core.legal_notice import generate_section_94_bnss_notice
from app.crawlers.multi_chain_crawler import detect_chain

app = FastAPI(
    title="NIRMAAN Forensic Tracing Engine",
    description="Automated Real-Time Identification of Fraud-Linked Crypto Exchanges (SIH26183 / I4C)",
    version="1.0.0"
)

# Enable CORS for frontend integration
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
        "supported_chain": "TRON (TRC-20 USDT)",
        "tracked_vasps_count": len(tracer.vasp_db)
    }

@app.get("/api/vasps")
def list_vasps():
    """Returns curated directory of tracked exchanges and hot wallets."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(base_dir, "data", "vasp_directory.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/trace", response_model=TraceResponse)
async def run_trace(req: TraceRequest):
    """
    Main forensic entry point:
    Accepts suspect TRON wallet, traces multi-hop flows, runs deposit sweep detection,
    and returns graph nodes, edges, target VASP, and pre-filled Section 94 BNSS notice.
    """
    chain = detect_chain(req.seed_address)
    if chain == "unknown":
        raise HTTPException(
            status_code=400,
            detail="Unrecognized blockchain address format. Supported: TRON (starts with 'T'), EVM (starts with '0x'), Bitcoin (starts with 'bc1', '1', or '3')."
        )

    response = await tracer.trace(req)
    # Generate legal notice
    response.section_94_notice_text = generate_section_94_bnss_notice(response, req.case_metadata)
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
