"""
Industrial Automated Test Suite for NIRMAAN Forensic Tracing Engine
Tests Multi-Chain Crawlers, Heuristics, Edge Cases, Data Contracts & Legal Notices.
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
import json
import re

from app.main import app
from app.models.schemas import TraceRequest, CaseMetadata
from app.core.tracer import ForensicTracer
from app.crawlers.multi_chain_crawler import detect_chain

client = TestClient(app)

# -------------------------------------------------------------
# 1. API HEALTH & VASP DIRECTORY INTEGRITY
# -------------------------------------------------------------

def test_health_check_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["problem_statement"] == "SIH26183"
    assert "tracked_vasps_count" in data
    assert data["tracked_vasps_count"] > 0

def test_vasp_directory_integrity():
    response = client.get("/api/vasps")
    assert response.status_code == 200
    data = response.json()
    assert "vasps" in data
    vasps = data["vasps"]
    
    required_exchanges = ["binance", "bybit", "okx", "coindcx", "wazirx"]
    for ex in required_exchanges:
        assert ex in vasps, f"Missing critical exchange: {ex}"
        info = vasps[ex]
        assert "name" in info
        assert "nodal_email" in info
        assert "@" in info["nodal_email"]
        assert "law_enforcement_portal" in info
        assert len(info.get("known_hot_wallets", [])) > 0, f"No hot wallets listed for {ex}"

# -------------------------------------------------------------
# 2. CHAIN AUTO-DETECTION ACCURACY
# -------------------------------------------------------------

@pytest.mark.parametrize("address,expected_chain", [
    ("TScamOriginVictimAddress778899AABB", "tron"),
    ("TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N", "tron"),
    ("0x28C6c06298d514Db089934071355E5743bf21d60", "ethereum"),
    ("0xscamoriginvictimether998877aabbccddeeff", "ethereum"),
    ("bc1qScamVictimBtcSeedAddress998877AABB", "bitcoin"),
    ("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "bitcoin"),
    ("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", "bitcoin"),
    ("random_invalid_string", "unknown")
])
def test_chain_detection_accuracy(address, expected_chain):
    assert detect_chain(address) == expected_chain

# -------------------------------------------------------------
# 3. END-TO-END TRON TRACING & SWEEP HEURISTIC
# -------------------------------------------------------------

def test_tron_trace_end_to_end():
    payload = {
        "seed_address": "TScamOriginVictimAddress778899AABB",
        "max_depth": 4,
        "min_usd_value": 20.0,
        "case_metadata": {
            "fir_number": "FIR-101/2026 Hyderabad",
            "police_station": "Cyber Crime PS Cyberabad",
            "investigating_officer": "Inspector V. Reddy",
            "loss_amount_inr": 1500000.0
        }
    }
    response = client.post("/api/trace", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["destination_found"] is True
    assert data["target_vasp"] is not None
    assert data["target_vasp"]["name"] == "Binance"
    assert data["target_vasp"]["fiu_registered"] is True
    assert "compliance-in@binance.com" in data["target_vasp"]["nodal_email"]
    assert len(data["nodes"]) >= 4
    assert len(data["edges"]) >= 3

    # Check node classification types
    node_types = {n["node_type"] for n in data["nodes"]}
    assert "SUSPECT" in node_types
    assert "MULE" in node_types
    assert "VASP_DEPOSIT" in node_types
    assert "VASP_HOT" in node_types

    # Verify Statutory Section 94 BNSS Notice
    notice = data.get("section_94_notice_text", "")
    assert "SECTION 94 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023" in notice
    assert "FIR-101/2026 Hyderabad" in notice
    assert "Binance" in notice
    assert "SHA-256" in notice

# -------------------------------------------------------------
# 4. END-TO-END EVM (ETHEREUM) TRACING
# -------------------------------------------------------------

def test_evm_trace_end_to_end():
    payload = {
        "seed_address": "0xScamOriginVictimEther998877AABBCCDDEEFF",
        "max_depth": 4,
        "min_usd_value": 20.0,
        "case_metadata": {
            "fir_number": "FIR-42/2026 Delhi",
            "loss_amount_inr": 2500000.0
        }
    }
    response = client.post("/api/trace", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["destination_found"] is True
    assert data["target_vasp"]["name"] == "Binance"
    assert "Ethereum" in data["chain"]
    assert len(data["nodes"]) >= 4

# -------------------------------------------------------------
# 5. END-TO-END BITCOIN TRACING
# -------------------------------------------------------------

def test_btc_trace_end_to_end():
    payload = {
        "seed_address": "bc1qScamVictimBtcSeedAddress998877AABB",
        "max_depth": 4,
        "min_usd_value": 20.0,
        "case_metadata": {
            "fir_number": "FIR-99/2026 Bengaluru",
            "loss_amount_inr": 5000000.0
        }
    }
    response = client.post("/api/trace", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["destination_found"] is True
    assert data["target_vasp"]["name"] == "Binance"
    assert "Bitcoin" in data["chain"]

# -------------------------------------------------------------
# 6. EDGE CASES & DEFENSIVE ERROR HANDLING
# -------------------------------------------------------------

def test_evm_case_insensitivity():
    """EVM addresses must match hot wallets whether uppercase, lowercase, or checksum."""
    lower_addr = "0xscamoriginvictimether998877aabbccddeeff"
    upper_addr = "0xSCAMORIGINVICTIMETHER998877AABBCCDDEEFF"

    res_lower = client.post("/api/trace", json={"seed_address": lower_addr})
    res_upper = client.post("/api/trace", json={"seed_address": upper_addr})

    assert res_lower.status_code == 200
    assert res_upper.status_code == 200
    assert res_lower.json()["destination_found"] == res_upper.json()["destination_found"]

def test_direct_hot_wallet_input():
    """If user pastes an address that is ALREADY a known hot wallet, flag immediately."""
    binance_hot = "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N"
    response = client.post("/api/trace", json={"seed_address": binance_hot})
    assert response.status_code == 200
    data = response.json()
    assert data["destination_found"] is True
    assert data["target_vasp"]["name"] == "Binance"
    assert data["nodes"][0]["node_type"] == "VASP_HOT"

def test_invalid_address_rejection():
    """Invalid address format must return HTTP 400 with actionable feedback."""
    response = client.post("/api/trace", json={"seed_address": "invalid_random_wallet_xyz"})
    assert response.status_code == 400
    assert "Unrecognized blockchain address format" in response.json()["detail"]

def test_dead_end_wallet_handling():
    """If an address has 0 outgoing transactions, return cleanly with 0 edges and no crash."""
    dead_end_tron = "TDeadEndZeroOutgoingTransfersAddress99"
    response = client.post("/api/trace", json={"seed_address": dead_end_tron})
    assert response.status_code == 200
    data = response.json()
    assert data["destination_found"] is False
    assert len(data["nodes"]) == 1
    assert len(data["edges"]) == 0

def test_sha256_evidence_seal_format():
    """Verify Section 63 BSA certificate has valid 64-char SHA-256 hex string."""
    response = client.post("/api/trace", json={"seed_address": "TScamOriginVictimAddress778899AABB"})
    notice = response.json().get("section_94_notice_text", "")
    match = re.search(r"Cryptographic Trace Integrity Seal \(SHA-256\):\s+([a-f0-9]{64})", notice)
    assert match is not None, "SHA-256 evidence seal was not found or malformed in legal notice"
    hash_val = match.group(1)
    assert len(hash_val) == 64
