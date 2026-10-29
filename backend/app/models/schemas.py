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
    loss_amount_inr: Optional[float] = Field(default=0.0, description="Victim loss in INR")

class TraceRequest(BaseModel):
    seed_address: str = Field(..., description="Target TRON suspect wallet address (e.g., starts with T)")
    max_depth: int = Field(default=4, ge=1, le=6, description="Maximum BFS traversal depth")
    min_usd_value: float = Field(default=20.0, ge=0.0, description="Minimum USD value threshold to prune dust")
    case_metadata: Optional[CaseMetadata] = Field(default_factory=CaseMetadata)

class GraphNode(BaseModel):
    id: str
    address: str
    node_type: str = Field(description="SUSPECT | MULE | VASP_DEPOSIT | VASP_HOT")
    label: str
    vasp_name: Optional[str] = None
    balance_usd: Optional[float] = 0.0

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

class TraceResponse(BaseModel):
    trace_id: str
    seed_address: str
    chain: str = "TRON (TRC-20)"
    execution_time_ms: float
    destination_found: bool
    target_vasp: Optional[TargetVASP] = None
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    section_94_notice_text: Optional[str] = None
