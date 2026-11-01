"""
Industrial Automated Test Suite for NIRMAAN Forensic Tracing Engine
Tests Multi-Chain Crawlers, Heuristics, Edge Cases, Data Contracts & Legal Notices.
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
import json
import re
from copy import deepcopy

import httpx

from app import main as app_module
from app.main import app
from app.models.schemas import TraceRequest
from app.core.tracer import ForensicTracer
from app.core.legal_notice import generate_section_94_bnss_notice
from app.crawlers.multi_chain_crawler import detect_chain
from app.crawlers.tron import TronCrawler

client = TestClient(app)

def _transfer(source, recipient, amount, tx_hash, token="USDT"):
    return {
        "from": source,
        "to": recipient,
        "amount": amount,
        "tx_hash": tx_hash,
        "timestamp": 1700000000,
        "token": token,
        "chain": "tron"
    }


@pytest.fixture(autouse=True)
def mock_api_crawler(monkeypatch):
    """Keep API trace tests independent of provider availability and wall-clock fixtures."""
    tron_seed = "TScamOriginVictimAddress778899AABB"
    tron_mule = "TMuleSplitterLayer1Address445566CC"
    tron_forwarder = "TBinanceUserDepositForwarder8899ZZ"
    evm_seed = "0xScamOriginVictimEther998877AABBCCDDEEFF"
    evm_mule = "0xMuleSplitterEtherLayer1A1B2C3D4E5F60718"
    evm_forwarder = "0xBinanceDepositForwarderEther88776655"
    btc_seed = "bc1qScamVictimBtcSeedAddress998877AABB"
    btc_mule = "bc1qMuleLayer1BtcSplitter223344CCDD"
    btc_forwarder = "bc1qBinanceDepositForwarderBtc556677"
    transfers_by_address = {
        tron_seed.lower(): [
            _transfer(tron_seed, tron_mule, 15000.0, "tron-seed-to-mule")
        ],
        tron_mule.lower(): [
            _transfer(tron_mule, tron_forwarder, 14950.0, "tron-mule-to-forwarder"),
            _transfer(tron_mule, "TPeelingChangeBurner11223344EEFF", 50.0, "tron-mule-to-change")
        ],
        tron_forwarder.lower(): [
            _transfer(tron_forwarder, "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N", 14950.0, "tron-forwarder-to-hot")
        ],
        evm_seed.lower(): [
            _transfer(evm_seed, evm_mule, 25000.0, "evm-seed-to-mule")
        ],
        evm_mule.lower(): [
            _transfer(evm_mule, evm_forwarder, 24900.0, "evm-mule-to-forwarder"),
            _transfer(evm_mule, "0xPeelingBurnerEtherChange99001122", 100.0, "evm-mule-to-change")
        ],
        evm_forwarder.lower(): [
            _transfer(evm_forwarder, "0x28C6c06298d514Db089934071355E5743bf21d60", 24900.0, "evm-forwarder-to-hot")
        ],
        btc_seed.lower(): [
            _transfer(btc_seed, btc_mule, 0.85, "btc-seed-to-mule", token="BTC")
        ],
        btc_mule.lower(): [
            _transfer(btc_mule, btc_forwarder, 0.82, "btc-mule-to-forwarder", token="BTC"),
            _transfer(btc_mule, "bc1qPeelChangeBurnerBtc99887766", 0.03, "btc-mule-to-change", token="BTC")
        ],
        btc_forwarder.lower(): [
            _transfer(btc_forwarder, "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h", 0.82, "btc-forwarder-to-hot", token="BTC")
        ],
    }

    async def fetch_transfers(address, chain=None):
        return deepcopy(transfers_by_address.get(address.lower(), []))

    monkeypatch.setattr(app_module.tracer.crawler, "fetch_transfers", fetch_transfers)


@pytest.fixture
def mocked_tracer(monkeypatch):
    tracer = ForensicTracer()

    async def fetch_empty_transfers(address, chain=None):
        return []

    monkeypatch.setattr(tracer.crawler, "fetch_transfers", fetch_empty_transfers)
    return tracer

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

def test_vasp_directory_all_wallets_validated():
    """P2 item 7: All active known hot wallets in vasp_directory.json must pass strict address format checks, with stubs labeled."""
    response = client.get("/api/vasps")
    assert response.status_code == 200
    vasps = response.json().get("vasps", {})
    
    stubs = []
    active_wallets = []
    for ex, info in vasps.items():
        for w in info.get("known_hot_wallets", []):
            if w.startswith("[TEST_STUB]"):
                stubs.append((ex, w))
            else:
                detected = detect_chain(w)
                assert detected in ("ethereum", "tron", "bitcoin"), f"Active hot wallet {w} in exchange {ex} failed address validation!"
                active_wallets.append((ex, w, detected))
                
    assert len(stubs) == 4
    assert len(active_wallets) == 41

# -------------------------------------------------------------
# 2. CHAIN AUTO-DETECTION ACCURACY & STRICT ADDRESS VALIDATION
# -------------------------------------------------------------

@pytest.mark.parametrize("address,expected_chain", [
    # Valid EVM (0x + 40 hex digits)
    ("0x28C6c06298d514Db089934071355E5743bf21d60", "ethereum"),
    ("0x95222290DD7853684454F4275E597E3A63725F78", "ethereum"),
    # Invalid EVM
    ("0xscamoriginvictimether998877aabbccddeeff", "unknown"),  # Non-hex characters
    ("0x28C6c06298d514Db089934071355E5743bf21d6", "unknown"),   # Length 41
    ("0x28C6c06298d514Db089934071355E5743bf21d6000", "unknown"), # Length 44

    # Valid TRON (T + 33 base58 digits, no 0, O, I, l)
    ("TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", "tron"),
    ("TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N", "tron"),
    # Invalid TRON
    ("TScamOriginVictimAddress778899AABB", "unknown"),  # Contains 'O' (invalid Base58)
    ("T0iBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", "unknown"),  # Contains '0' (invalid Base58)
    ("TIiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", "unknown"),  # Contains 'I' (invalid Base58)
    ("TliBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", "unknown"),  # Contains 'l' (invalid Base58)
    ("TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUV", "unknown"),   # Length 33 (must be 34)

    # Valid Bitcoin (Legacy 1..., P2SH 3..., Bech32 bc1...)
    ("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "bitcoin"),
    ("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", "bitcoin"),
    ("bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h", "bitcoin"),
    ("bc1qqyqszqgpqyqszqgpqyqszqgpqyqszqgpyfl4f3", "bitcoin"),
    # Invalid Bitcoin
    ("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb", "unknown"),  # Bad Base58Check checksum
    ("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twse0", "unknown"),  # Bad Base58Check checksum
    ("bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3z", "unknown"),  # Bad Bech32 checksum
    ("bc1qScamVictimBtcSeedAddress998877AABB", "unknown"),      # Mixed case & bad checksum
    ("random_invalid_string", "unknown")
])
def test_chain_detection_accuracy(address, expected_chain):
    assert detect_chain(address) == expected_chain

# -------------------------------------------------------------
# 3. END-TO-END TRON TRACING & SWEEP HEURISTIC
# -------------------------------------------------------------

def test_tron_trace_end_to_end():
    payload = {
        "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
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


@pytest.mark.asyncio
async def test_tron_demo_fixture_trace_makes_no_http_requests(monkeypatch):
    crawler = ForensicTracer()
    fetched_addresses = []
    original_fetch_transfers = TronCrawler.fetch_transfers

    async def track_fixture_fetch(tron_crawler, address, limit=15):
        fetched_addresses.append(address)
        return await original_fetch_transfers(tron_crawler, address, limit)

    def reject_http_client(*args, **kwargs):
        raise AssertionError("Synthetic TRON fixture trace attempted an HTTP request")

    monkeypatch.setattr(TronCrawler, "fetch_transfers", track_fixture_fetch)
    monkeypatch.setattr(httpx, "AsyncClient", reject_http_client)

    response = await crawler.trace(
        TraceRequest(seed_address="TScamOriginVictimAddress778899AABB")
    )

    hot_wallet = "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N"
    expected_hash = "d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3"
    assert "TPeelingChangeBurner11223344EEFF" in fetched_addresses
    assert response.destination_found is True
    assert response.target_vasp is not None
    assert response.target_vasp.name == "Binance"
    assert response.target_vasp.hot_wallet == hot_wallet
    assert response.target_vasp.sweep_tx_hash == expected_hash
    assert any(
        edge.target == hot_wallet and edge.tx_hash == expected_hash
        for edge in response.edges
    )

# -------------------------------------------------------------
# 4. END-TO-END EVM (ETHEREUM) TRACING
# -------------------------------------------------------------

def test_evm_trace_end_to_end():
    payload = {
        "seed_address": "0x95222290DD7853684454F4275E597E3A63725F78",
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
        "seed_address": "bc1qqyqszqgpqyqszqgpqyqszqgpqyqszqgpyfl4f3",
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
    lower_addr = "0x95222290dd7853684454f4275e597e3a63725f78"
    upper_addr = "0x95222290DD7853684454F4275E597E3A63725F78"

    res_lower = client.post("/api/trace", json={"seed_address": lower_addr})
    res_upper = client.post("/api/trace", json={"seed_address": upper_addr})

    assert res_lower.status_code == 200
    assert res_upper.status_code == 200
    assert res_lower.json()["destination_found"] == res_upper.json()["destination_found"]

def test_direct_hot_wallet_input():
    """A known hot wallet seed is labelled but is not a discovered destination."""
    binance_hot = "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N"
    response = client.post("/api/trace", json={"seed_address": binance_hot})
    assert response.status_code == 200
    data = response.json()
    assert data["destination_found"] is False
    assert data["target_vasp"] is None
    assert data["nodes"][0]["node_type"] == "VASP_HOT"
    assert data["nodes"][0]["vasp_name"] == "Binance"
    assert len(data["edges"]) == 0
    notice = data["section_94_notice_text"]
    assert "did not establish" in notice
    assert "deposited into your exchange infrastructure" not in notice


@pytest.mark.asyncio
async def test_seed_known_vasp_with_no_outgoing_transactions(mocked_tracer):
    response = await mocked_tracer.trace(TraceRequest(seed_address="TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N"))
    assert response.destination_found is False
    assert response.target_vasp is None
    assert response.nodes[0].node_type == "VASP_HOT"
    assert response.nodes[0].vasp_name == "Binance"
    assert response.edges == []


@pytest.mark.asyncio
async def test_outgoing_transaction_to_known_vasp_requires_and_records_hash(monkeypatch):
    tracer = ForensicTracer()
    seed = "TSuspectWalletForVaspTest0000001"
    hot_wallet = "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N"
    tx = _transfer(seed, hot_wallet, 125.0, "transaction-hash-123")

    async def fetch_transfer(address, chain=None):
        return [tx] if address == seed else []

    monkeypatch.setattr(tracer.crawler, "fetch_transfers", fetch_transfer)
    response = await tracer.trace(TraceRequest(seed_address=seed))
    assert response.destination_found is True
    assert response.target_vasp.name == "Binance"
    assert response.target_vasp.sweep_tx_hash == "transaction-hash-123"
    assert len(response.edges) == 1
    assert response.edges[0].source == seed
    assert response.edges[0].target == hot_wallet
    assert response.edges[0].tx_hash == response.target_vasp.sweep_tx_hash

    tx_without_hash = {key: value for key, value in tx.items() if key != "tx_hash"}

    async def fetch_unhashed_transfer(address, chain=None):
        return [tx_without_hash] if address == seed else []

    monkeypatch.setattr(tracer.crawler, "fetch_transfers", fetch_unhashed_transfer)
    response_without_hash = await tracer.trace(TraceRequest(seed_address=seed))
    assert response_without_hash.destination_found is False
    assert response_without_hash.target_vasp is None
    assert response_without_hash.edges == []


@pytest.mark.asyncio
async def test_wallet_without_transactions_or_vasp_match_has_no_destination(mocked_tracer):
    response = await mocked_tracer.trace(TraceRequest(seed_address="TNoTransactionsNoVaspWallet000001"))
    assert response.destination_found is False
    assert response.target_vasp is None
    assert len(response.nodes) == 1
    assert response.edges == []
    notice = generate_section_94_bnss_notice(response)
    assert "did not establish" in notice
    assert "No exchange-specific production request is generated" in notice
    assert "No exchange-specific asset freeze is requested" in notice


@pytest.mark.asyncio
async def test_empty_crawler_response_is_not_a_vasp_destination(mocked_tracer):
    response = await mocked_tracer.trace(TraceRequest(seed_address="TEmptyCrawlerResponseWallet00001"))
    assert response.destination_found is False
    assert response.target_vasp is None
    assert response.edges == []


@pytest.mark.asyncio
async def test_crawler_failure_is_not_converted_to_empty_trace(monkeypatch):
    tracer = ForensicTracer()

    async def fail_fetch(address, chain=None):
        raise RuntimeError("crawler provider failure")

    monkeypatch.setattr(tracer.crawler, "fetch_transfers", fail_fetch)
    with pytest.raises(RuntimeError, match="crawler provider failure"):
        await tracer.trace(TraceRequest(seed_address="TProviderFailureWallet0000001"))

def test_invalid_address_rejection():
    """Invalid address format must return HTTP 400 with standardized error payload."""
    response = client.post("/api/trace", json={"seed_address": "invalid_random_wallet_xyz"})
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_WALLET_ADDRESS"
    assert "Unrecognized blockchain address format" in data["error"]["details"]

def test_http_404_not_found():
    """Accessing non-existent endpoint must return clean 404 error payload."""
    response = client.get("/api/non_existent_route")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"

def test_http_422_validation_error():
    """Malformed request payload (e.g. invalid types or depth > 6) returns clean 422."""
    response = client.post("/api/trace", json={"seed_address": "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N", "max_depth": 99})
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "SCHEMA_VALIDATION_ERROR"
    assert "max_depth" in str(data["error"]["details"])

def test_dead_end_wallet_handling():
    """If an address has 0 outgoing transactions, return cleanly with 0 edges and no crash."""
    dead_end_tron = "TA4Wt1DUCqz6YegbnsmqsWC5uUfbdBqPxm"
    response = client.post("/api/trace", json={"seed_address": dead_end_tron})
    assert response.status_code == 200
    data = response.json()
    assert data["destination_found"] is False
    assert len(data["nodes"]) == 1
    assert len(data["edges"]) == 0

def test_sha256_evidence_seal_format():
    """Verify Section 63 BSA certificate has valid 64-char SHA-256 hex string."""
    response = client.post("/api/trace", json={"seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC"})
    notice = response.json().get("section_94_notice_text", "")
    match = re.search(r"Cryptographic Trace Integrity Seal \(SHA-256\):\s+([a-f0-9]{64})", notice)
    assert match is not None, "SHA-256 evidence seal was not found or malformed in legal notice"
    hash_val = match.group(1)
    assert len(hash_val) == 64

def test_trace_request_with_explicit_bsc_chain():
    """Regression test: verify optional chain='bsc' parameter routes to Binance Smart Chain."""
    payload = {
        "seed_address": "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
        "chain": "bsc",
        "max_depth": 1
    }
    response = client.post("/api/trace", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Binance Smart Chain" in data["chain"]

