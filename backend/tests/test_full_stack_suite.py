"""
Integration Test Suite for Full Stack Verticals:
- Vertical 2: ML Peeling Classifier, Mixer Directory & Risk Scorer
- Vertical 3: SQLite Case Vault Persistence & Section 94 / 63 BSA PDF Dossier
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.ml.mixer_directory import identify_mixer_entity
from app.ml.peeling import analyze_peeling_chain, detect_structuring_smurfing
from app.ml.scorer import calculate_node_risk
from app.db.case_service import save_case, list_cases, get_case
from app.core.pdf_dossier import generate_pdf_dossier
from app.models.schemas import CaseCreateRequest

def test_mixer_entity_recognition():
    """Verify that known OFAC/UN sanctioned mixers are recognized."""
    # Tornado Cash 10 ETH pool
    res = identify_mixer_entity("0x910cbd523d972eb0a6f4cae4618ad62622b39dbf")
    assert res is not None
    assert res["protocol"] == "Tornado Cash"
    assert res["risk_tier"] == "CRITICAL"

    # Clean address
    clean_res = identify_mixer_entity("0x0000000000000000000000000000000000000000")
    assert clean_res is None

def test_peeling_chain_classifier():
    """Verify detection of peeling chain pattern (small peel, large change)."""
    incoming = [{"amount": 10000.0, "usd_value": 10000.0}]
    # 5% peeled off ($500), 95% passed along ($9,500)
    outgoing = [
        {"to": "0xPeeledFee", "amount": 500.0, "usd_value": 500.0},
        {"to": "0xChangeAddress", "amount": 9500.0, "usd_value": 9500.0}
    ]
    res = analyze_peeling_chain(incoming, outgoing)
    assert res["is_peeling_chain"] is True
    assert res["peel_ratio"] == 0.05
    assert res["peel_confidence"] > 0.80

def test_structuring_smurfing_detector():
    """Verify identification of sub-$10k transfers avoiding AML triggers."""
    outgoing = [
        {"amount": 9400.0, "usd_value": 9400.0},
        {"amount": 9850.0, "usd_value": 9850.0}
    ]
    res = detect_structuring_smurfing(outgoing)
    assert res["is_structuring"] is True
    assert res["suspicious_tx_count"] == 2

def test_composite_risk_scorer_mixer_penalty():
    """Verify that interacting with a mixer triggers instant CRITICAL rating."""
    res = calculate_node_risk(
        address="0xd90e2f925da726b50c4ed8d0fb90ad053324f31b",
        node_type="MULE",
        incoming_transfers=[],
        outgoing_transfers=[]
    )
    assert res["risk_score"] >= 0.95
    assert res["risk_tier"] == "CRITICAL"
    assert res["is_mixer"] is True

@pytest.mark.asyncio
async def test_case_vault_api_endpoints():
    """Verify Case Vault API (POST /api/cases, GET /api/cases, GET /api/cases/{id}/dossier)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create Case
        payload = {
            "fir_number": "FIR-TEST/2026",
            "police_station": "Cyber Crime PS Cyberabad",
            "investigating_officer": "Inspector K. Reddy",
            "complainant_name": "Suresh Patel",
            "loss_amount_inr": 2500000.0,
            "seed_address": "TScamOriginVictimAddress778899AABB",
            "chain": "TRON (TRC-20)",
            "destination_vasp": "Binance",
            "total_routed_usd": 25000.0,
            "evidence_sha256": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "trace_data": {"nodes": [], "edges": []}
        }
        create_res = await client.post("/api/cases", json=payload)
        assert create_res.status_code == 201
        data = create_res.json()
        assert "case_id" in data
        case_id = data["case_id"]

        # 2. List Cases
        list_res = await client.get("/api/cases")
        assert list_res.status_code == 200
        cases = list_res.json()
        assert any(c["case_id"] == case_id for c in cases)

        # 3. Get Case Details
        detail_res = await client.get(f"/api/cases/{case_id}")
        assert detail_res.status_code == 200
        assert detail_res.json()["fir_number"] == "FIR-TEST/2026"

        # 4. Download PDF Dossier
        dossier_res = await client.get(f"/api/cases/{case_id}/dossier")
        assert dossier_res.status_code == 200
        assert dossier_res.headers["content-type"] == "application/pdf"
        assert len(dossier_res.content) > 1000
