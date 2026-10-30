"""
Case Vault Service.
Provides high-level queries and mutations for investigated cybercrime cases.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.db.database import get_connection
from app.models.schemas import CaseCreateRequest, CaseRecord

def save_case(req: CaseCreateRequest) -> CaseRecord:
    """Inserts a new investigated case record into the SQLite Case Vault."""
    case_id = f"case_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    trace_json = json.dumps(req.trace_data)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO cases (
                case_id, fir_number, police_station, investigating_officer,
                complainant_name, loss_amount_inr, seed_address, chain,
                destination_vasp, total_routed_usd, evidence_sha256,
                trace_data, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            case_id,
            req.fir_number,
            req.police_station,
            req.investigating_officer,
            req.complainant_name,
            req.loss_amount_inr,
            req.seed_address,
            req.chain,
            req.destination_vasp,
            req.total_routed_usd,
            req.evidence_sha256,
            trace_json,
            now_iso
        ))
        conn.commit()

    return CaseRecord(
        case_id=case_id,
        fir_number=req.fir_number,
        police_station=req.police_station,
        investigating_officer=req.investigating_officer,
        complainant_name=req.complainant_name,
        loss_amount_inr=req.loss_amount_inr,
        seed_address=req.seed_address,
        chain=req.chain,
        destination_vasp=req.destination_vasp,
        total_routed_usd=req.total_routed_usd,
        evidence_sha256=req.evidence_sha256,
        created_at=now_iso
    )

def list_cases(limit: int = 50) -> List[CaseRecord]:
    """Retrieves the list of recent cases from the Case Vault."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT case_id, fir_number, police_station, investigating_officer,
                   complainant_name, loss_amount_inr, seed_address, chain,
                   destination_vasp, total_routed_usd, evidence_sha256, created_at
            FROM cases
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [
            CaseRecord(
                case_id=row["case_id"],
                fir_number=row["fir_number"],
                police_station=row["police_station"],
                investigating_officer=row["investigating_officer"],
                complainant_name=row["complainant_name"],
                loss_amount_inr=row["loss_amount_inr"],
                seed_address=row["seed_address"],
                chain=row["chain"],
                destination_vasp=row["destination_vasp"],
                total_routed_usd=row["total_routed_usd"],
                evidence_sha256=row["evidence_sha256"],
                created_at=row["created_at"]
            )
            for row in rows
        ]

def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves full case details including raw trace data."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "case_id": row["case_id"],
            "fir_number": row["fir_number"],
            "police_station": row["police_station"],
            "investigating_officer": row["investigating_officer"],
            "complainant_name": row["complainant_name"],
            "loss_amount_inr": row["loss_amount_inr"],
            "seed_address": row["seed_address"],
            "chain": row["chain"],
            "destination_vasp": row["destination_vasp"],
            "total_routed_usd": row["total_routed_usd"],
            "evidence_sha256": row["evidence_sha256"],
            "trace_data": json.loads(row["trace_data"]),
            "created_at": row["created_at"]
        }
