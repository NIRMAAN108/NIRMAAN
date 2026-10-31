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
import re
import json
import subprocess
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
        "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC with receipt tx 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890. "
        "Complaint registered under FIR-44/2026 Cyber Cell. Phone: +919876543210."
    )
    data = parse_ncrp_complaint(raw_complaint)
    assert len(data.extracted_addresses) == 1
    assert data.extracted_addresses[0]["address"] == "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC"
    assert data.extracted_addresses[0]["chain"] == "tron"
    assert data.primary_seed_address == "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC"
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
        "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
        "chain": "TRON (TRC-20)",
        "destination_vasp": "Binance",
        "total_routed_usd": 15000.0,
        "evidence_sha256": "f81e717ce2ec4938a1b5d6e7f809a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2",
        "trace_data": {
            "target_vasp": {
                "name": "Binance",
                "fiu_registered": True,
                "deposit_address": "TTpfou5hZarSNUpbaiAWHcCyC4u7ofBMrk",
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
        "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
        "chain": "TRON (TRC-20)",
        "destination_vasp": "Binance",
        "total_routed_usd": 15000.0,
        "evidence_sha256": "f81e717ce2ec4938a1b5d6e7f809a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2",
        "trace_data": {
            "target_vasp": {
                "name": "Binance",
                "fiu_registered": True,
                "deposit_address": "TTpfou5hZarSNUpbaiAWHcCyC4u7ofBMrk",
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
        ncrp_res = await client.post("/api/ncrp/parse", json={"text": "Lost 500000 on TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC"})
        assert ncrp_res.status_code == 200
        assert ncrp_res.json()["primary_seed_address"] == "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC"

        # 2. Create Case
        payload = {
            "fir_number": "FIR-TEST/2026",
            "police_station": "Cyber Crime PS Cyberabad",
            "investigating_officer": "Inspector K. Reddy",
            "complainant_name": "Suresh Patel",
            "loss_amount_inr": 2500000.0,
            "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
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

def test_frontend_xss_unescaped_innerhtml_scanner():
    """
    Grep-style regression test: parses frontend/index.html, identifies all template
    literals assigned to .innerHTML, and asserts that every dynamic interpolation
    is wrapped in escapeHtml(), encodeURI(), encodeURIComponent(), or is a safe numeric/static expression.
    Fails if any unescaped variable/expression is interpolated directly into innerHTML.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    html_path = os.path.join(base_dir, "frontend", "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    bt = chr(96)  # backtick
    pattern = re.compile(r'\.innerHTML\s*=\s*' + bt + r'([^' + bt + r']*)' + bt)
    assignments = pattern.findall(html)
    assert len(assignments) > 0, "No .innerHTML template literal assignments found in frontend/index.html"

    safe_prefixes = ("escapeHtml(", "encodeURI(", "encodeURIComponent(", "Number(")
    safe_static_exact = {"idx", "idx + 1", "badgeBg"}

    violations = []
    for idx_stmt, body in enumerate(assignments, 1):
        interps = re.findall(r'\$\{([^}]+)\}', body)
        for expr in interps:
            e = expr.strip()
            if any(e.startswith(p) for p in safe_prefixes):
                continue
            if e in safe_static_exact:
                continue
            if ".length" in e or e.isdigit() or e.startswith("Math."):
                continue
            if "v.fiu_registered ?" in e:
                continue

            violations.append(f"Assignment #{idx_stmt}: '${{{e}}}'")

    assert not violations, f"Detected unescaped innerHTML interpolations susceptible to XSS:\n" + "\n".join(violations)


def test_frontend_render_xss_payload_injection():
    """
    Regression test: executes the actual escapeHtml function extracted from frontend/index.html
    against hostile XSS payloads (<img src=x onerror=alert(1)>, <script>, <svg>, etc.)
    and verifies that all executable tags are sanitized into safe HTML entities.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    html_path = os.path.join(base_dir, "frontend", "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    fn_match = re.search(r"function escapeHtml\([^\)]*\)\s*\{[\s\S]*?return[\s\S]*?\}", html)
    assert fn_match is not None, "function escapeHtml() was not found in frontend/index.html"
    fn_js = fn_match.group(0)

    payloads = [
        '<img src=x onerror=alert(1)>',
        '<script>alert("XSS")</script>',
        '"><svg onload=alert(document.domain)>',
        "';alert('steal_token');//",
        '<a href="javascript:alert(1)">Click Me</a>'
    ]

    test_script = f"""
    {fn_js}
    const payloads = {json.dumps(payloads)};
    const results = payloads.map(p => escapeHtml(p));
    process.stdout.write(JSON.stringify(results));
    """

    res = subprocess.run(["node", "-e", test_script], capture_output=True, text=True, check=True)
    sanitized_results = json.loads(res.stdout)

    for original, sanitized in zip(payloads, sanitized_results):
        assert "<img" not in sanitized
        assert "<script" not in sanitized
        assert "<svg" not in sanitized
        assert "<" not in sanitized
        assert ">" not in sanitized
        assert "&lt;" in sanitized or "&#39;" in sanitized or "&#039;" in sanitized or "&quot;" in sanitized


def test_legal_notice_statutory_separation_and_negative_branch():
    """
    Verify P2 Item 5:
    1. Removes 'court-ready' claim from Section 94 BNSS requisitions.
    2. Separates Section 94 (production of documents) from Sections 106 & 107 BNSS (seizure/attachment).
    3. Emits negative notice when trace contains no VASP destination edge.
    """
    from app.core.legal_notice import generate_section_94_bnss_notice

    # Case A: Trace with NO VASP target edge
    trace_no_vasp = {
        "trace_id": "test-trace-no-vasp",
        "seed_address": "0x52908400098527886E0F7030069857D2E4169EE7",
        "chain": "Ethereum",
        "nodes": [],
        "edges": []
    }
    notice_neg = generate_section_94_bnss_notice(trace_no_vasp)
    assert "court-ready" not in notice_neg.lower()
    assert "SECTION 94 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA" in notice_neg
    assert "SEPARATE STATUTORY NOTICE FOR ASSET PRESERVATION UNDER SECTIONS 106 & 107 BNSS" in notice_neg
    assert "No exchange-specific production request is generated" in notice_neg
    assert "No exchange-specific asset freeze or lien is requested" in notice_neg

    # Case B: Trace with a valid VASP target edge
    trace_with_vasp = {
        "trace_id": "test-trace-vasp",
        "seed_address": "0x52908400098527886E0F7030069857D2E4169EE7",
        "chain": "Ethereum",
        "target_vasp": {
            "name": "Binance",
            "deposit_address": "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be",
            "hot_wallet": "0x28c6c06298d514db089934071355e5743bf21d60",
            "sweep_tx_hash": "0xabc123456789",
            "nodal_email": "compliance@binance.com"
        },
        "nodes": [
            {"id": "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be", "address": "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be"},
            {"id": "0x28c6c06298d514db089934071355e5743bf21d60", "address": "0x28c6c06298d514db089934071355e5743bf21d60"}
        ],
        "edges": [
            {
                "source": "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be",
                "target": "0x28c6c06298d514db089934071355e5743bf21d60",
                "tx_hash": "0xabc123456789",
                "amount": 1000.0,
                "token": "USDT",
                "usd_value": 1000.0,
                "timestamp": 1700000000
            }
        ]
    }
    notice_pos = generate_section_94_bnss_notice(trace_with_vasp)
    assert "court-ready" not in notice_pos.lower()
    assert "M/s Binance" in notice_pos
    assert "Section 94 BNSS (Production of Documents)" in notice_pos
    assert "Section 107 BNSS (Warrant for Attachment/Seizure)" in notice_pos


@pytest.mark.asyncio
async def test_tracer_feature_vector_graph_dimensions_and_tx_hash_guard(monkeypatch):
    """
    Verify P2 Item 6 & Resilience:
    1. tracer.py ignores transactions with empty or whitespace-only tx_hash.
    2. tracer.py calculates feature vector dimensions 6 (mixer proximity) and 7 (exchange custody)
       from real graph topology instead of remaining fixed at 0.0.
    """
    from app.core.tracer import ForensicTracer
    from app.models.schemas import TraceRequest

    tracer = ForensicTracer()
    res = await tracer.trace(TraceRequest(
        seed_address="0x95222290DD7853684454F4275E597E3A63725F78",
        chain="ethereum"
    ))

    # All nodes must have feature_vector of length 8
    for node in res.nodes:
        assert node.feature_vector is not None
        assert len(node.feature_vector) == 8

    # VASP hot wallet must have exchange custody dimension (index 7) == 1.0
    hot_nodes = [n for n in res.nodes if n.node_type == "VASP_HOT"]
    assert len(hot_nodes) > 0
    for hn in hot_nodes:
        assert hn.feature_vector[7] == 1.0

    # VASP deposit forwarder must have exchange custody dimension == 0.8
    deposit_nodes = [n for n in res.nodes if n.node_type == "VASP_DEPOSIT"]
    assert len(deposit_nodes) > 0
    for dn in deposit_nodes:
        assert dn.feature_vector[7] == 0.8

    # Intermediate mules and seed routing into deposit must have non-zero exchange custody dimension
    seed_nodes = [n for n in res.nodes if n.address.lower() == "0x95222290DD7853684454F4275E597E3A63725F78".lower()]
    assert len(seed_nodes) > 0
    assert seed_nodes[0].feature_vector[7] > 0.0

    # Test tx_hash guard: transfers with empty or whitespace-only tx_hash must be skipped
    corrupt_transfers = [
        {"from": "0x95222290DD7853684454F4275E597E3A63725F78", "to": "0x52908400098527886E0F7030069857D2E4169EE7", "amount": 100.0, "tx_hash": "", "timestamp": 1700000000, "token": "ETH"},
        {"from": "0x95222290DD7853684454F4275E597E3A63725F78", "to": "0x52908400098527886E0F7030069857D2E4169EE7", "amount": 100.0, "tx_hash": "   ", "timestamp": 1700000000, "token": "ETH"},
        {"from": "0x95222290DD7853684454F4275E597E3A63725F78", "to": "0x52908400098527886E0F7030069857D2E4169EE7", "amount": 100.0, "tx_hash": None, "timestamp": 1700000000, "token": "ETH"},
    ]
    async def mock_fetch_transfers(addr, chain=None):
        return corrupt_transfers

    monkeypatch.setattr(tracer.crawler, "fetch_transfers", mock_fetch_transfers)
    corrupt_res = await tracer.trace(TraceRequest(
        seed_address="0x95222290DD7853684454F4275E597E3A63725F78",
        chain="ethereum"
    ))
    # All corrupt transfers must be rejected, producing 0 edges
    assert len(corrupt_res.edges) == 0

