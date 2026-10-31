"""
Pydantic Schemas for NIRMAAN Forensic Engine
Strict typing, zero bloat, high serialization performance.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CaseMetadata(BaseModel):
    fir_number: Optional[str] = Field(default="NCRP-COMPLAINT/2026", description="FIR or NCRP ticket ID")
    police_station: Optional[str] = Field(default="State Cyber Police Station", description="Station name")
    investigating_officer: Optional[str] = Field(default="Inspector Cyber Cell", description="IO Name/Rank")
    complainant_name: Optional[str] = Field(default="Complainant", description="Victim / Complainant Name")
    loss_amount_inr: Optional[float] = Field(default=0.0, ge=0.0, description="Victim loss in INR")

class TraceRequest(BaseModel):
    seed_address: str = Field(..., description="Target suspect wallet address (TRON, EVM, BTC)")
    chain: Optional[str] = Field(default=None, description="Optional target blockchain override: 'bsc', 'ethereum', 'tron', 'bitcoin'")
    max_depth: int = Field(default=4, ge=1, le=6, description="Maximum BFS traversal depth")
    min_usd_value: float = Field(default=20.0, ge=0.0, description="Minimum USD value threshold to prune dust")
    case_metadata: Optional[CaseMetadata] = Field(default_factory=CaseMetadata)

class GraphNode(BaseModel):
    id: str
    address: str
    node_type: str = Field(description="SUSPECT | MULE | VASP_DEPOSIT | VASP_HOT | MIXER")
    label: str
    vasp_name: Optional[str] = None
    balance_usd: Optional[float] = 0.0
    risk_score: Optional[float] = 0.5
    risk_tier: Optional[str] = "MEDIUM"  # LOW | MEDIUM | HIGH | CRITICAL
    is_peeling: Optional[bool] = False
    is_mixer: Optional[bool] = False
    flags: Optional[List[str]] = []
    explanation: Optional[str] = None
    feature_vector: Optional[List[float]] = None
    typology: Optional[Dict[str, Any]] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    tx_hash: str
    amount: float
    token: str = "USDT"
    usd_value: float
    timestamp: int

class TargetVASP(BaseModel):
    name: str
    fiu_registered: bool
    deposit_address: str
    hot_wallet: str
    sweep_tx_hash: Optional[str] = None
    nodal_email: str
    law_enforcement_portal: str
    source: Optional[str] = "FIU-IND Verified Registry"
    verification_date: Optional[str] = "2026-10-31"
    confidence: Optional[str] = "HIGH"

class TraceResponse(BaseModel):
    trace_id: str
    seed_address: str
    chain: str = "TRON (TRC-20)"
    execution_time_ms: float
    destination_found: bool
    is_synthetic: bool = Field(default=False, description="Flag indicating if trace data contains synthetic/demo test fixtures")
    target_vasp: Optional[TargetVASP] = None
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    section_94_notice_text: Optional[str] = None
    evidence_sha256: Optional[str] = None
    syndicate_typology: Optional[Dict[str, Any]] = None
    ml_anomaly_score: Optional[float] = None

# Case Vault Persistence Models (Vertical 3)
class CaseCreateRequest(BaseModel):
    fir_number: str
    police_station: str
    investigating_officer: str
    complainant_name: str = "Complainant"
    loss_amount_inr: float = Field(default=0.0, ge=0.0)
    seed_address: str
    chain: str
    destination_vasp: Optional[str] = None
    total_routed_usd: float = 0.0
    evidence_sha256: Optional[str] = None
    trace_data: Dict[str, Any]

class CaseRecord(BaseModel):
    case_id: str
    fir_number: str
    police_station: str
    investigating_officer: str
    complainant_name: str
    loss_amount_inr: float
    seed_address: str
    chain: str
    destination_vasp: Optional[str] = None
    total_routed_usd: float
    evidence_sha256: Optional[str] = None
    created_at: str
