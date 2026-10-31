"""
Integration Test Suite for Full Stack Verticals:
- Vertical 2: ML Peeling Classifier, Mixer Directory & Risk Scorer
- Vertical 3: SQLite Case Vault Persistence, Section 94 / 63 BSA PDF Dossier,
              FIU-IND PMLA STR Reporting & Court-Sealed Evidence Bundles
- Domain Ingestion: NCRP / 1930 Cybercrime Complaint Parser
"""

import os
import zipfile
import io
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.ml.mixer_directory import identify_mixer_entity
from app.ml.peeling import analyze_peeling_chain, detect_structuring_smurfing
from app.ml.scorer import calculate_node_risk
from app.db.case_service import save_case, list_cases, get_case
from app.core.pdf_dossier import generate_pdf_dossier
from app.core.evidence_bundle import generate_evidence_bundle_zip
from app.core.pmla_str import generate_fiu_ind_str
from app.core.ncrp_parser import parse_ncrp_complaint
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

def test_ncrp_complaint_parser():
    """Verify unstructured victim complaint parsing from NCRP portal / 1930 SMS."""
    raw_complaint = (
        "Complainant Suresh Rao reports loss of Rs. 18,50,000 on Telegram task group. "
        "Fraudsters directed him to transfer crypto to suspect wallet "
        "TScamOriginVictimAddress778899AABB with receipt tx 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890. "
        "Complaint registered under FIR-44/2026 Cyber Cell. Phone: +919876543210."
    )
    data = parse_ncrp_complaint(raw_complaint)
    assert len(data.extracted_addresses) == 1
    assert data.extracted_addresses[0]["address"] == "TScamOriginVictimAddress778899AABB"
    assert data.extracted_addresses[0]["chain"] == "tron"
    assert data.primary_seed_address == "TScamOriginVictimAddress778899AABB"
    assert data.estimated_loss_inr == 1850000.0
    assert "FIR-44/2026" in data.suggested_fir

def test_fiu_ind_pmla_str_generation():
    """Verify generation of FINnet 2.0 compliant STR payload for FIU-IND."""
    mock_case = {
        "fir_number": "FIR-88/2026",
        "police_station": "State Cyber PS",
        "investigating_officer": "DSP Verma",
        "complainant_name": "Ramesh Kumar",
        "loss_amount_inr": 1500000.0,
        "seed_address": "TScamOriginVictimAddress778899AABB",
        "chain": "TRON (TRC-20)",
        "destination_vasp": "Binance",
        "total_routed_usd": 15000.0,
        "evidence_sha256": "f81e717ce2ec4938a1b5d6e7f809a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2",
        "trace_data": {
            "target_vasp": {
                "name": "Binance",
                "fiu_registered": True,
                "deposit_address": "TBinanceUserDepositForwarder8899ZZ",
                "hot_wallet": "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N",
                "sweep_tx_hash": "d4e5f60718293a4b5c6d7e8f90a1b2c3",
                "nodal_email": "compliance-in@binance.com"
            },
            "nodes": [{"id": "1", "is_peeling": True}],
            "edges": [{"source": "1", "target": "2"}]
        }
    }
    str_report = generate_fiu_ind_str(mock_case)
    assert str_report["report_header"]["regulatory_body"] == "Financial Intelligence Unit - India (FIU-IND)"
    assert str_report["target_reporting_entity"]["entity_name"] == "Binance"
    assert "VDA_ALGORITHMIC_PEELING_CHAIN_DETECTED" in str_report["aml_suspicion_indicators"]

def test_court_evidence_bundle_zip_and_manifest():
    """Verify that the ZIP evidence bundle compiles with valid SHA256SUMS manifest."""
    mock_case = {
        "fir_number": "FIR-88/2026",
        "police_station": "State Cyber PS",
        "investigating_officer": "DSP Verma",
        "complainant_name": "Ramesh Kumar",
        "loss_amount_inr": 1500000.0,
        "seed_address": "TScamOriginVictimAddress778899AABB",
        "chain": "TRON (TRC-20)",
        "destination_vasp": "Binance",
        "total_routed_usd": 15000.0,
        "evidence_sha256": "f81e717ce2ec4938a1b5d6e7f809a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2",
        "trace_data": {
            "target_vasp": {
                "name": "Binance",
                "fiu_registered": True,
                "deposit_address": "TBinanceUserDepositForwarder8899ZZ",
                "hot_wallet": "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N",
                "sweep_tx_hash": "d4e5f60718293a4b5c6d7e8f90a1b2c3",
                "nodal_email": "compliance-in@binance.com"
            },
            "nodes": [],
            "edges": []
        }
    }
    zip_bytes = generate_evidence_bundle_zip(mock_case)
    assert len(zip_bytes) > 2000

    # Unpack in-memory and verify SHA256SUMS manifest
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        namelist = zf.namelist()
        assert "SHA256SUMS.txt" in namelist
        assert any(n.endswith(".pdf") for n in namelist)
        assert any("SECTION_94_BNSS" in n for n in namelist)
        assert any("SECTION_63_BSA" in n for n in namelist)
        assert any("FIU_IND_PMLA_STR" in n for n in namelist)
        assert any("TRANSACTION_HOPS_LEDGER" in n for n in namelist)

@pytest.mark.asyncio
async def test_case_vault_api_endpoints():
    """Verify Case Vault API (POST /api/cases, GET /api/cases, GET /api/cases/{id}/dossier, bundle, str)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test NCRP Parse
        ncrp_res = await client.post("/api/ncrp/parse", json={"text": "Lost 500000 on TScamOriginVictimAddress778899AABB"})
        assert ncrp_res.status_code == 200
        assert ncrp_res.json()["primary_seed_address"] == "TScamOriginVictimAddress778899AABB"

        # 2. Create Case
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

        # 3. List Cases
        list_res = await client.get("/api/cases")
        assert list_res.status_code == 200
        cases = list_res.json()
        assert any(c["case_id"] == case_id for c in cases)

        # 4. Get Case Details
        detail_res = await client.get(f"/api/cases/{case_id}")
        assert detail_res.status_code == 200
        assert detail_res.json()["fir_number"] == "FIR-TEST/2026"

        # 5. Download PDF Dossier
        dossier_res = await client.get(f"/api/cases/{case_id}/dossier")
        assert dossier_res.status_code == 200
        assert dossier_res.headers["content-type"] == "application/pdf"
        assert len(dossier_res.content) > 1000

        # 6. Download ZIP Bundle
        bundle_res = await client.get(f"/api/cases/{case_id}/bundle")
        assert bundle_res.status_code == 200
        assert bundle_res.headers["content-type"] == "application/zip"
        assert len(bundle_res.content) > 1000

        # 7. Get FIU STR Report
        str_res = await client.get(f"/api/cases/{case_id}/str")
        assert str_res.status_code == 200
        assert "report_header" in str_res.json()

@pytest.mark.asyncio
async def test_cors_configuration_explicit_origins():
    """Regression test: verify CORS does not use wildcard origins when credentials are true."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Preflight from permitted local origin
        res_allowed = await client.options(
            "/api/trace",
            headers={
                "Origin": "http://127.0.0.1:8000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"
            }
        )
        assert res_allowed.headers.get("access-control-allow-origin") == "http://127.0.0.1:8000"
        assert res_allowed.headers.get("access-control-allow-credentials") == "true"

        # Preflight from file:// local browser context (Origin: null)
        res_null = await client.options(
            "/api/trace",
            headers={
                "Origin": "null",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"
            }
        )
        assert res_null.headers.get("access-control-allow-origin") == "null"
        assert res_null.headers.get("access-control-allow-credentials") == "true"

        # Static mounts check: verify frontend served via /app and /frontend
        res_app = await client.get("/app/index.html")
        assert res_app.status_code == 200
        res_front = await client.get("/frontend/index.html")
        assert res_front.status_code == 200

        # Preflight from untrusted origin
        res_blocked = await client.options(
            "/api/trace",
            headers={
                "Origin": "http://malicious-site.example",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"
            }
        )
        assert res_blocked.headers.get("access-control-allow-origin") != "*"
        assert res_blocked.headers.get("access-control-allow-origin") != "http://malicious-site.example"

def test_frontend_initial_html_neutral_empty_state():
    """Regression test: verify frontend landing HTML contains neutral empty state without hardcoded Binance/₹14.95L."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    html_path = os.path.join(base_dir, "frontend", "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    assert '<h2 class="text-3xl font-extrabold text-white tracking-tight" id="verdictExchangeTitle">Binance</h2>' not in html
    assert "₹14,95,000 Tracked" not in html
    assert "No Active Trace" in html
    assert "AWAITING TRACE" in html

def test_frontend_xss_sanitization_helpers_present():
    """Regression test: verify XSS escaping helper is defined and used before DOM innerHTML insertions."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    html_path = os.path.join(base_dir, "frontend", "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    assert "function escapeHtml(str)" in html
    assert "${escapeHtml(node.address)}" in html
    assert "${escapeHtml(edge.tx_hash" in html
    assert "${escapeHtml(c.fir_number)}" in html
    assert "${escapeHtml(v.name)}" in html
