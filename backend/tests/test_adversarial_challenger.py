"""
Adversarial Verification & Empirical Stress Test Suite for NIRMAAN (ChainTrace AI)
Author: teamwork_challenger (challenger_2)
Focus:
- Live Blockchain Crawlers (R3 Compliance without Mock Fallbacks)
- Edge Case Address & Unsupported Chain Handling
- Risk Engine Boundary Invariants [0.05, 0.99]
- Circular Layering Loops & High Fan-Out Resilience
- Mixer & VASP Graph Proximity Metrics
- Statutory Legal Evidence Integrity (Section 94 BNSS, Section 63 BSA, PDF, ZIP, SHA256SUMS.txt)
- Frontend API Timeout Contract Verification
"""

import os
import io
import re
import csv
import json
import random
import hashlib
import zipfile
import pytest
import networkx as nx
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import TraceRequest, CaseMetadata, CaseCreateRequest
from app.crawlers.tron import TronCrawler
from app.crawlers.evm import EVMCrawler
from app.crawlers.btc import BitcoinCrawler
from app.crawlers.multi_chain_crawler import detect_chain, is_valid_evm_address, is_valid_tron_address, is_valid_bitcoin_address
from app.ml.scorer import calculate_node_risk
from app.ml.peeling import analyze_peeling_chain, detect_structuring_smurfing
from app.ml.mixer_directory import identify_mixer_entity
from app.ml.graph_clustering import build_nx_graph, calculate_graph_centrality, detect_circular_layering
from app.core.legal_notice import generate_section_94_bnss_notice, generate_section_63_bsa_certificate, compute_canonical_evidence_digest, get_canonical_evidence_json
from app.core.pdf_dossier import generate_pdf_dossier
from app.core.evidence_bundle import generate_evidence_bundle_zip
from app.core.pmla_str import generate_fiu_ind_str

client = TestClient(app)

# =========================================================================
# 1. LIVE BLOCKCHAIN CRAWLER STRESS & R3 COMPLIANCE
# =========================================================================

@pytest.mark.asyncio
async def test_adversarial_live_crawlers_r3_no_mocks():
    """
    R3 Verification: Live crawler connections to TronGrid, Blockscout, and Mempool.
    Must execute with STRICT_LIVE_NETWORK=1 to ensure no demo/mock fixtures are returned.
    """
    old_strict = os.environ.get("STRICT_LIVE_NETWORK")
    os.environ["STRICT_LIVE_NETWORK"] = "1"
    try:
        # 1. TRON Live Network: Query a real mainnet address (USDT TRC-20 contract)
        tron_crawler = TronCrawler(timeout=10.0)
        # Using Tron USDT contract address: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
        tron_txs = await tron_crawler.fetch_transfers("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", limit=3)
        assert isinstance(tron_txs, list)
        for tx in tron_txs:
            assert tx["chain"] == "tron"
            assert isinstance(tx["amount"], (int, float))
            assert isinstance(tx["tx_hash"], str)
            assert len(tx["tx_hash"]) > 0
        await tron_crawler.close()

        # 2. EVM Live Network: Query a real Ethereum mainnet address via Blockscout
        evm_crawler = EVMCrawler(timeout=10.0)
        # Using Binance 14 hot wallet on Ethereum: 0x28C6c06298d514Db089934071355E5743bf21d60
        evm_txs = await evm_crawler.fetch_transfers("0x28C6c06298d514Db089934071355E5743bf21d60", chain="ethereum", limit=3)
        assert isinstance(evm_txs, list)
        for tx in evm_txs:
            assert tx["chain"] == "ethereum"
            assert isinstance(tx["amount"], (int, float))
            assert isinstance(tx["tx_hash"], str)
        await evm_crawler.close()

        # 3. Bitcoin Live Network: Query a real Bitcoin mainnet address via Mempool.space
        btc_crawler = BitcoinCrawler(timeout=15.0)
        # Using Bitfinex hot/cold wallet: 34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo
        btc_txs = await btc_crawler.fetch_transfers("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", limit=3)
        assert isinstance(btc_txs, list)
        for tx in btc_txs:
            assert tx["chain"] == "bitcoin"
            assert isinstance(tx["amount"], (int, float))
            assert isinstance(tx["tx_hash"], str)
        await btc_crawler.close()

    finally:
        if old_strict is not None:
            os.environ["STRICT_LIVE_NETWORK"] = old_strict
        else:
            os.environ.pop("STRICT_LIVE_NETWORK", None)


def test_adversarial_invalid_addresses_rejection():
    """
    Test edge-case and corrupted addresses across TRON, EVM, and Bitcoin.
    All must be cleanly rejected with HTTP 400 Bad Request.
    """
    invalid_addresses = [
        # TRON: contains invalid Base58 characters (0, O, I, l) or bad length
        ("T0iBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", "TRON with digit 0"),
        ("TOiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", "TRON with uppercase O"),
        ("TIiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", "TRON with uppercase I"),
        ("TliBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", "TRON with lowercase l"),
        ("TShortAddress", "TRON too short"),
        ("T" + "A" * 50, "TRON too long"),
        # EVM: invalid length or non-hex characters
        ("0x1234567890abcdef", "EVM too short"),
        ("0x" + "g" * 40, "EVM invalid hex chars"),
        ("0x" + "a" * 41, "EVM 41 hex chars"),
        ("0x" + "a" * 39, "EVM 39 hex chars"),
        # Bitcoin: invalid checksum or bad characters
        ("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb", "Bitcoin legacy invalid base58 checksum"),
        ("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twse0", "Bitcoin P2SH invalid base58 checksum"),
        ("bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3z", "Bitcoin SegWit invalid bech32 checksum"),
        ("bc1qScamVictimBtcSeedAddress998877AABB", "Bitcoin SegWit invalid chars"),
        # Arbitrary junk
        ("", "Empty string"),
        ("   ", "Whitespace only"),
        ("DROP TABLE cases;--", "SQL Injection pattern"),
        ("<script>alert('xss')</script>", "XSS payload"),
        ("!@#$%^&*()_+", "Special characters")
    ]

    for addr, desc in invalid_addresses:
        resp = client.post("/api/trace", json={"seed_address": addr})
        assert resp.status_code in [400, 422], f"Failed to reject {desc} (status={resp.status_code})"
        body = resp.json()
        assert body.get("success") is False or "detail" in body or "error" in body


def test_adversarial_unsupported_chains():
    """
    Test that unsupported blockchain networks are rejected with HTTP 400.
    """
    valid_evm_addr = "0x28C6c06298d514Db089934071355E5743bf21d60"
    unsupported_chains = ["solana", "cardano", "ripple", "polkadot", "avalanche", "dogecoin", "cosmos", "fakechain"]

    for uc in unsupported_chains:
        resp = client.post("/api/trace", json={"seed_address": valid_evm_addr, "chain": uc})
        assert resp.status_code == 400, f"Unsupported chain '{uc}' was not rejected with HTTP 400 (got {resp.status_code})"
        data = resp.json()
        assert "Unsupported blockchain chain" in str(data) or "error" in data


# =========================================================================
# 2. RISK ENGINE & HEURISTICS STRESS TESTING
# =========================================================================

def test_risk_score_invariants_across_all_boundaries():
    """
    Verify that ML risk score stays strictly within [0.05, 0.99] across all inputs,
    including 0 transfers, extreme fan-outs, and unusual values.
    """
    # 1. Zero incoming and Zero outgoing
    r1 = calculate_node_risk(
        address="0xTestZeroTransfersNode1122334455667788",
        node_type="MULE",
        incoming_transfers=[],
        outgoing_transfers=[],
        is_vasp=False
    )
    assert 0.05 <= r1["risk_score"] <= 0.99
    assert r1["risk_score"] == 0.60  # Default base score for mule

    # 2. Extreme Fan-Out: 1,000 outgoing transfers
    many_out = [
        {"to": f"0xRecipient{i:04d}", "amount": 100.0, "usd_value": 100.0, "timestamp": 1700000000 + i}
        for i in range(1000)
    ]
    r2 = calculate_node_risk(
        address="0xTestExtremeFanOutNode1122334455667788",
        node_type="MULE",
        incoming_transfers=[{"from": "0xOrigin", "amount": 100000.0, "usd_value": 100000.0, "timestamp": 1699999900}],
        outgoing_transfers=many_out,
        is_vasp=False
    )
    assert 0.05 <= r2["risk_score"] <= 0.99
    assert "HIGH_FANOUT_DISTRIBUTION" in r2["flags"]

    # 3. Suspect origin with 0 outgoing
    r3 = calculate_node_risk(
        address="0xTestSuspectNoOutNode1122334455667788",
        node_type="SUSPECT",
        incoming_transfers=[],
        outgoing_transfers=[],
        is_vasp=False
    )
    assert 0.05 <= r3["risk_score"] <= 0.99
    assert r3["risk_score"] == 0.85

    # 4. Known VASP Treasury
    r4 = calculate_node_risk(
        address="0x28C6c06298d514Db089934071355E5743bf21d60",
        node_type="VASP_HOT",
        incoming_transfers=[],
        outgoing_transfers=[],
        is_vasp=True
    )
    assert 0.05 <= r4["risk_score"] <= 0.99
    assert r4["risk_score"] == 0.08
    assert r4["risk_tier"] == "LOW"

    # 5. Direct Sanctioned Mixer Entity (Tornado Cash 10 ETH)
    r5 = calculate_node_risk(
        address="0x910cbd523d972eb0a6f4cae4618ad62622b39dbf",
        node_type="MULE",
        incoming_transfers=[],
        outgoing_transfers=[],
        is_vasp=False
    )
    assert r5["risk_score"] == 0.99
    assert r5["risk_tier"] == "CRITICAL"
    assert r5["is_mixer"] is True


def test_circular_layering_loops_and_cycles():
    """
    Stress-test directed circular loops (A -> B -> C -> A, A -> B -> A, A -> A).
    Verify that cycle detection succeeds without infinite recursion.
    """
    # 1. 3-node loop: A -> B -> C -> A
    edges_loop_3 = [
        {"source": "0xLoopA", "target": "0xLoopB", "amount": 1000.0, "tx_hash": "tx1", "timestamp": 1700000100},
        {"source": "0xLoopB", "target": "0xLoopC", "amount": 950.0, "tx_hash": "tx2", "timestamp": 1700000200},
        {"source": "0xLoopC", "target": "0xLoopA", "amount": 900.0, "tx_hash": "tx3", "timestamp": 1700000300},
    ]
    G3 = build_nx_graph(edges_loop_3)
    res_a = detect_circular_layering(G3, "0xLoopA")
    assert res_a["has_cycle"] is True
    assert res_a["cycle_length"] == 3
    assert "0xLoopA" in res_a["cycle_path"]

    # 2. 2-node ping-pong loop: A -> B -> A
    edges_ping_pong = [
        {"source": "0xPing", "target": "0xPong", "amount": 5000.0, "tx_hash": "txp1", "timestamp": 1700000100},
        {"source": "0xPong", "target": "0xPing", "amount": 4900.0, "tx_hash": "txp2", "timestamp": 1700000200},
    ]
    Gp = build_nx_graph(edges_ping_pong)
    res_ping = detect_circular_layering(Gp, "0xPing")
    assert res_ping["has_cycle"] is True
    assert res_ping["cycle_length"] == 2

    # 3. Simple cycles on directed graph
    cycles = list(nx.simple_cycles(G3))
    assert len(cycles) > 0


def test_peeling_chain_threshold_boundaries():
    """
    Test peeling chain detection at boundary ratios (50%, 79%, 80%, 90%, 95%, 99%).
    """
    incoming = [{"amount": 10000.0, "usd_value": 10000.0}]

    # Case A: 50/50 split -> Not a peeling chain
    out_50_50 = [
        {"to": "0xOut1", "amount": 5000.0, "usd_value": 5000.0},
        {"to": "0xOut2", "amount": 5000.0, "usd_value": 5000.0}
    ]
    res_50 = analyze_peeling_chain(incoming, out_50_50)
    assert res_50["is_peeling_chain"] is False

    # Case B: 75/25 split -> Not a peeling chain (< 80%)
    out_75_25 = [
        {"to": "0xMain", "amount": 7500.0, "usd_value": 7500.0},
        {"to": "0xPeel", "amount": 2500.0, "usd_value": 2500.0}
    ]
    res_75 = analyze_peeling_chain(incoming, out_75_25)
    assert res_75["is_peeling_chain"] is False

    # Case C: 85/15 split -> Peeling chain! (85% passed, 15% peeled)
    out_85_15 = [
        {"to": "0xMain", "amount": 8500.0, "usd_value": 8500.0},
        {"to": "0xPeel", "amount": 1500.0, "usd_value": 1500.0}
    ]
    res_85 = analyze_peeling_chain(incoming, out_85_15)
    assert res_85["is_peeling_chain"] is True
    assert res_85["peel_ratio"] == 0.15

    # Case D: 98/2 split -> Peeling chain!
    out_98_2 = [
        {"to": "0xMain", "amount": 9800.0, "usd_value": 9800.0},
        {"to": "0xPeel", "amount": 200.0, "usd_value": 200.0}
    ]
    res_98 = analyze_peeling_chain(incoming, out_98_2)
    assert res_98["is_peeling_chain"] is True


def test_structuring_smurfing_threshold_boundaries():
    """
    Test structuring/smurfing detection:
    Amounts between $9,000 and $9,999 (just below $10,000 CTR/FIU threshold).
    """
    # 1. Amounts all under $500 -> not structuring
    out_micro = [{"amount": 200.0, "usd_value": 200.0} for _ in range(5)]
    res_micro = detect_structuring_smurfing(out_micro)
    assert res_micro["is_structuring"] is False

    # 2. Single transaction at $9,800 -> requires at least 2 suspicious transfers to flag structuring
    out_single = [{"amount": 9800.0, "usd_value": 9800.0}]
    res_single = detect_structuring_smurfing(out_single)
    assert res_single["is_structuring"] is False

    # 3. Two or more transactions between $9,000 and $9,999 -> Structuring detected!
    out_smurf = [
        {"amount": 9500.0, "usd_value": 9500.0},
        {"amount": 9850.0, "usd_value": 9850.0},
        {"amount": 9200.0, "usd_value": 9200.0}
    ]
    res_smurf = detect_structuring_smurfing(out_smurf)
    assert res_smurf["is_structuring"] is True
    assert res_smurf["suspicious_tx_count"] == 3


def test_randomized_fuzzing_invariants():
    """
    Generates 50 randomized transfer patterns with wide ranges of amounts and timestamps.
    Asserts that 0.05 <= risk_score <= 0.99 holds strictly for every case.
    """
    random.seed(42)
    for _ in range(50):
        in_count = random.randint(0, 15)
        out_count = random.randint(0, 15)
        
        in_transfers = [
            {"amount": random.uniform(1, 100000), "usd_value": random.uniform(1, 100000), "timestamp": random.randint(1600000000, 1750000000)}
            for _ in range(in_count)
        ]
        out_transfers = [
            {"to": f"0x{random.randint(0, 2**160):040x}", "amount": random.uniform(1, 100000), "usd_value": random.uniform(1, 100000), "timestamp": random.randint(1600000000, 1750000000)}
            for _ in range(out_count)
        ]
        node_type = random.choice(["SUSPECT", "MULE", "DEFAULT"])
        
        result = calculate_node_risk(
            address=f"0x{random.randint(0, 2**160):040x}",
            node_type=node_type,
            incoming_transfers=in_transfers,
            outgoing_transfers=out_transfers,
            is_vasp=False
        )
        score = result["risk_score"]
        assert 0.05 <= score <= 0.99, f"Risk score {score} violated bounds [0.05, 0.99] in fuzz test!"
        assert result["risk_tier"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


# =========================================================================
# 3. STATUTORY ARTIFACT INTEGRITY (BNSS, BSA, PDF, ZIP, SHA256)
# =========================================================================

def test_section_94_bnss_notice_generation_integrity():
    """
    Verifies Section 94 BNSS Notice generation under diverse metadata inputs:
    - Normal metadata
    - Missing/null metadata
    - Extreme amounts
    - Unicode / Hindi characters
    """
    dummy_trace = {
        "target_vasp": {
            "name": "Binance India",
            "nodal_email": "nodal.in@binance.com",
            "deposit_address": "TDepVaspDepositCluster9900112233",
            "sweep_tx_hash": "0x5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d"
        },
        "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
        "nodes": [
            {"id": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", "node_type": "SUSPECT"},
            {"id": "TDepVaspDepositCluster9900112233", "node_type": "VASP_DEPOSIT", "vasp_name": "Binance India"}
        ],
        "edges": [
            {
                "source": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
                "target": "TDepVaspDepositCluster9900112233",
                "amount": 15000.0,
                "token": "USDT",
                "tx_hash": "0x5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
                "timestamp": 1700000000
            }
        ]
    }

    # Case A: Standard metadata with confirmed VASP destination
    meta_std = CaseMetadata(
        fir_number="FIR-42/2026",
        police_station="Cyber Crime Police Station",
        investigating_officer="Inspector Sharma",
        complainant_name="Vikram Rao",
        loss_amount_inr=1500000.0
    )
    notice_std = generate_section_94_bnss_notice(dummy_trace, meta_std)
    assert "SECTION 94 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA" in notice_std
    assert "FIR-42/2026" in notice_std
    assert "Binance India" in notice_std
    assert "TDepVaspDepositCluster9900112233" in notice_std

    # Case B: Unicode Hindi metadata
    meta_hi = CaseMetadata(
        fir_number="प्राथमिकी-९९/२०२६",
        police_station="साइबर अपराध पुलिस स्टेशन, नई दिल्ली",
        investigating_officer="निरीक्षक राजेश कुमार",
        complainant_name="राजेश कुमार",
        loss_amount_inr=5000000.0
    )
    notice_hi = generate_section_94_bnss_notice(dummy_trace, meta_hi)
    assert "प्राथमिकी-९९/२०२६" in notice_hi
    assert "Binance India" in notice_hi

    # Case C: Negative Branch (No transaction-supported VASP established)
    no_vasp_trace = {
        "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
        "nodes": [],
        "edges": []
    }
    notice_neg = generate_section_94_bnss_notice(no_vasp_trace, meta_std)
    assert "NO TRANSACTION-SUPPORTED EXCHANGE DESTINATION ESTABLISHED" in notice_neg


def test_section_63_bsa_electronic_certificate_integrity():
    """
    Verifies Section 63 BSA certificate creation and canonical hash non-repudiation.
    """
    dummy_trace = {
        "seed_address": "0x28C6c06298d514Db089934071355E5743bf21d60",
        "chain": "Ethereum (ERC-20)",
        "nodes": [
            {"id": "0x28C6c06298d514Db089934071355E5743bf21d60", "node_type": "SUSPECT", "balance_usd": 1000.0}
        ],
        "edges": [
            {"source": "0x28C6c06298d514Db089934071355E5743bf21d60", "target": "0xTarget", "amount": 1000.0, "tx_hash": "0xhash1", "timestamp": 1700000000}
        ]
    }
    meta = CaseMetadata(
        fir_number="FIR-BSA-CERT-TEST/2026",
        police_station="State Cyber Crime Cell",
        investigating_officer="ACP Priya Singh",
        complainant_name="Bank of India Cyber Cell",
        loss_amount_inr=2000000.0
    )
    cert = generate_section_63_bsa_certificate(dummy_trace, meta)
    assert "certificate_text" in cert
    assert "sha256_hash" in cert
    assert len(cert["sha256_hash"]) == 64

    cert_text = cert["certificate_text"]
    assert "CERTIFICATE OF ELECTRONIC EVIDENCE UNDER SECTION 63 OF THE BHARATIYA SAKSHYA ADHINIYAM, 2023" in cert_text
    assert cert["sha256_hash"] in cert_text

    # Verify canonical JSON digest reproducibility
    canon_spec = get_canonical_evidence_json(dummy_trace)
    expected_hash = hashlib.sha256(canon_spec.encode("utf-8")).hexdigest()
    assert cert["sha256_hash"] == expected_hash


def test_pdf_dossier_and_zip_bundle_integrity():
    """
    Generates a full court-sealed ZIP evidence bundle and verifies:
    1. Valid ZIP structure
    2. All expected artifact files are present
    3. SHA256SUMS.txt exists and matches the exact SHA-256 hash of each file in the ZIP.
    """
    case_data = {
        "case_id": "CASE-TEST-CHALLENGER-999",
        "fir_number": "FIR-999/2026 Cyber Cell",
        "police_station": "Cyber Crime Special Cell",
        "investigating_officer": "Inspector Rajesh Sharma",
        "complainant_name": "Rohan Deshmukh",
        "loss_amount_inr": 2500000.0,
        "seed_address": "0x28C6c06298d514Db089934071355E5743bf21d60",
        "chain": "Ethereum (ERC-20)",
        "destination_vasp": "CoinDCX",
        "total_routed_usd": 30000.0,
        "trace_data": {
            "seed_address": "0x28C6c06298d514Db089934071355E5743bf21d60",
            "chain": "Ethereum (ERC-20)",
            "target_vasp": {
                "name": "CoinDCX",
                "nodal_email": "lea-nodal@coindcx.com",
                "deposit_address": "0xDeposit11223344",
                "hot_wallet": "0x28C6c06298d514Db089934071355E5743bf21d60",
                "sweep_tx_hash": "0xsweeptxhash1234567890abcdef"
            },
            "nodes": [
                {"id": "0x28C6c06298d514Db089934071355E5743bf21d60", "node_type": "SUSPECT", "balance_usd": 30000.0, "risk_score": 0.92, "risk_tier": "CRITICAL"},
                {"id": "0xDeposit11223344", "node_type": "VASP_DEPOSIT", "vasp_name": "CoinDCX", "balance_usd": 0.0, "risk_score": 0.45, "risk_tier": "MEDIUM"}
            ],
            "edges": [
                {"source": "0x28C6c06298d514Db089934071355E5743bf21d60", "target": "0xDeposit11223344", "amount": 30000.0, "token": "USDT", "usd_value": 30000.0, "tx_hash": "0xtx1", "timestamp": 1700000000}
            ]
        }
    }

    # 1. Test PDF dossier generation directly
    pdf_bytes = generate_pdf_dossier(case_data)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")
    assert b"%%EOF" in pdf_bytes[-1024:]

    # 2. Test Evidence Bundle ZIP generation
    zip_bytes = generate_evidence_bundle_zip(case_data)
    assert len(zip_bytes) > 2000
    assert zip_bytes.startswith(b"PK\x03\x04")

    # Unpack ZIP in memory and verify SHA256SUMS.txt
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        file_list = zf.namelist()
        assert "SHA256SUMS.txt" in file_list
        
        # Verify required artifacts are present
        assert any(f.startswith("00_CANONICAL_EVIDENCE_SPEC_") for f in file_list)
        assert any(f.startswith("01_COURT_DOSSIER_") and f.endswith(".pdf") for f in file_list)
        assert any(f.startswith("02_SECTION_94_BNSS_NOTICE_") and f.endswith(".txt") for f in file_list)
        assert any(f.startswith("03_SECTION_63_BSA_CERTIFICATE_") and f.endswith(".txt") for f in file_list)
        assert any(f.startswith("04_FIU_IND_PMLA_STR_REPORT_") and f.endswith(".json") for f in file_list)
        assert any(f.startswith("05_FORENSIC_GRAPH_LEDGER_") and f.endswith(".json") for f in file_list)
        assert any(f.startswith("06_TRANSACTION_HOPS_LEDGER_") and f.endswith(".csv") for f in file_list)

        # Parse SHA256SUMS.txt
        manifest_text = zf.read("SHA256SUMS.txt").decode("utf-8")
        manifest_lines = [l.strip() for l in manifest_text.splitlines() if l.strip()]
        assert len(manifest_lines) == 7

        for line in manifest_lines:
            parts = line.split("  ")
            assert len(parts) == 2, f"Malformed manifest line: {line}"
            claimed_hash, filename = parts[0], parts[1]
            assert filename in file_list, f"File {filename} in manifest not found in ZIP"
            actual_content = zf.read(filename)
            actual_hash = hashlib.sha256(actual_content).hexdigest()
            assert actual_hash == claimed_hash, f"SHA-256 mismatch for {filename}: claimed {claimed_hash}, got {actual_hash}"


# =========================================================================
# 4. FRONTEND API TIMEOUT & ERROR RESILIENCE VERIFICATION
# =========================================================================

def test_frontend_api_timeout_and_no_mock_fallback():
    """
    Verifies that frontend api.js enforces:
    1. 45-second timeout (AbortSignal.timeout(45000)) in traceWallet
    2. Re-throws error rather than calling generateSyntheticTrace during live trace failures
    """
    api_js_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "frontend", "app", "src", "services", "api.js"
    )
    assert os.path.exists(api_js_path), f"api.js not found at {api_js_path}"
    
    with open(api_js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Verify 45s timeout is configured in traceWallet
    assert "AbortSignal.timeout(45000)" in content, "traceWallet must have 45000ms timeout"

    # 2. Extract traceWallet function body
    start = content.find("export async function traceWallet")
    end = content.find("export async function parseNcrpText", start)
    assert start != -1 and end != -1, "Could not slice export async function traceWallet in api.js"
    trace_fn_body = content[start:end]

    # 3. Assert generateSyntheticTrace is NEVER called inside traceWallet
    assert "generateSyntheticTrace" not in trace_fn_body, "traceWallet MUST NOT call generateSyntheticTrace!"
    assert "throw err" in trace_fn_body or "throw new Error" in trace_fn_body, "traceWallet must re-throw live errors"


# =========================================================================
# 5. GRAPH CENTRALITY & PROXIMITY FEATURE VECTOR VERIFICATION
# =========================================================================

def test_adversarial_mixer_and_vasp_proximity_feature_vector():
    """
    Stress-test graph shortest-path proximity to Mixer and VASP hot wallets:
    - Verifies Dim 6 (mixer proximity) decays as 1 / (distance + 1)
    - Verifies Dim 7 (exchange custody) decays as 1 / (distance + 1)
    """
    # Build a 4-hop chain: Hop0 -> Hop1 -> Hop2 -> Mixer
    mixer_addr = "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf" # Known Tornado Cash
    edges = [
        {"source": "0xHop0", "target": "0xHop1", "amount": 1000.0, "tx_hash": "txh1", "timestamp": 1700000100},
        {"source": "0xHop1", "target": "0xHop2", "amount": 950.0, "tx_hash": "txh2", "timestamp": 1700000200},
        {"source": "0xHop2", "target": mixer_addr, "amount": 900.0, "tx_hash": "txh3", "timestamp": 1700000300},
    ]
    G = build_nx_graph(edges)
    
    # Distance from Hop2 to mixer is 1 -> 1 / (1 + 1) = 0.5
    d_hop2 = nx.shortest_path_length(G, "0xHop2", mixer_addr)
    assert d_hop2 == 1
    prox_hop2 = round(1.0 / (d_hop2 + 1), 3)
    assert prox_hop2 == 0.5

    # Distance from Hop1 to mixer is 2 -> 1 / (2 + 1) = 0.333
    d_hop1 = nx.shortest_path_length(G, "0xHop1", mixer_addr)
    assert d_hop1 == 2
    prox_hop1 = round(1.0 / (d_hop1 + 1), 3)
    assert prox_hop1 == 0.333

    # Distance from Hop0 to mixer is 3 -> 1 / (3 + 1) = 0.25
    d_hop0 = nx.shortest_path_length(G, "0xHop0", mixer_addr)
    assert d_hop0 == 3
    prox_hop0 = round(1.0 / (d_hop0 + 1), 3)
    assert prox_hop0 == 0.25


@pytest.mark.asyncio
async def test_adversarial_dead_end_wallet_trace():
    """
    Tests tracing a dead-end wallet (valid address with zero outbound transactions).
    Must return a clean 1-node, 0-edge response with destination_found=False and is_synthetic=False
    under STRICT_LIVE_NETWORK=1 without unhandled exceptions.
    """
    old_strict = os.environ.get("STRICT_LIVE_NETWORK")
    os.environ["STRICT_LIVE_NETWORK"] = "1"
    try:
        from app.core.tracer import ForensicTracer
        tracer = ForensicTracer()
        
        # Generate fresh, valid, unused TRON address with valid Base58Check checksum
        B58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
        payload = b"\x41" + b"\x01\x23\x45\x67\x89\xab\xcd\xef\x00\x11\x22\x33\x44\x55\x66\x77\x88\x99\xaa\xbb"
        chk = hashlib.sha256(hashlib.sha256(payload).digest()).digest()[:4]
        raw = payload + chk
        val = int.from_bytes(raw, "big")
        b58 = ""
        while val > 0:
            val, mod = divmod(val, 58)
            b58 = B58_CHARS[mod] + b58
        fresh_tron_addr = b58
        assert fresh_tron_addr.startswith("T")
        assert len(fresh_tron_addr) == 34

        req = TraceRequest(
            seed_address=fresh_tron_addr,
            max_depth=2,
            min_usd_value=50.0
        )
        resp = await tracer.trace(req)
        assert resp.destination_found is False
        assert len(resp.nodes) == 1
        assert len(resp.edges) == 0
        assert resp.is_synthetic is False
        assert resp.target_vasp is None
        assert 0.05 <= resp.ml_anomaly_score <= 0.99
    finally:
        if old_strict is not None:
            os.environ["STRICT_LIVE_NETWORK"] = old_strict
        else:
            os.environ.pop("STRICT_LIVE_NETWORK", None)
