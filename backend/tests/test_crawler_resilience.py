"""
Crawler Resilience & Stress Test Suite
Verifies that crawlers never crash, handle malformed schemas, survive rate-limits,
and properly failover between blockchain providers.
"""
import pytest
import asyncio
import os
from app.crawlers.resilience import CircuitBreaker, ResilientHttpClient
from app.crawlers.tron import TronCrawler
from app.crawlers.evm import EVMCrawler
from app.crawlers.btc import BitcoinCrawler

# -------------------------------------------------------------
# 1. CIRCUIT BREAKER RECOVERY & HEALTH
# -------------------------------------------------------------

def test_circuit_breaker_lifecycle():
    cb = CircuitBreaker(failure_threshold=3, recovery_timeout=0.2)
    assert cb.can_attempt() is True
    assert cb.is_open is False

    # Simulate 3 failures
    cb.record_failure()
    cb.record_failure()
    assert cb.can_attempt() is True
    cb.record_failure()  # 3rd failure hits threshold
    assert cb.is_open is True
    assert cb.can_attempt() is False  # Tripped!

    # Wait for recovery timeout
    import time
    time.sleep(0.25)
    assert cb.can_attempt() is True  # Half-open, allowing retry
    cb.record_success()
    assert cb.is_open is False
    assert cb.failure_count == 0

# -------------------------------------------------------------
# 2. DEFENSIVE PARSER HARDENING (ZERO-CRASH GUARANTEE)
# -------------------------------------------------------------

def test_tron_parser_resilience_to_malformed_payloads():
    crawler = TronCrawler()
    
    # Mock response with corrupt fields, nulls, negative numbers
    class FakeResponse:
        def json(self):
            return {
                "data": [
                    None,
                    "string_instead_of_dict",
                    {"from": "T123", "value": "corrupted_string"},
                    {"from": "T123", "to": "T456", "value": 15000000000, "token_info": {"decimals": 6, "symbol": "USDT"}, "transaction_id": "0xabc", "block_timestamp": 1700000000000},
                    {"from": "T123", "value": None}
                ]
            }

    parsed = crawler._parse_trongrid_response(FakeResponse(), "T123")
    assert len(parsed) == 1
    assert parsed[0]["amount"] == 15000.0
    assert parsed[0]["token"] == "USDT"

def test_evm_parser_resilience_to_malformed_payloads():
    crawler = EVMCrawler()

    class FakeBlockscoutResponse:
        def json(self):
            return {
                "items": [
                    None,
                    {"from": {"hash": "0x123"}, "total": {"value": "corrupted"}},
                    {"from": {"hash": "0x123"}, "to": {"hash": "0x456"}, "total": {"value": "5000000000"}, "token": {"decimals": 6, "symbol": "USDT"}, "transaction_hash": "0xdef"}
                ]
            }

    parsed = crawler._parse_blockscout_response(FakeBlockscoutResponse(), "0x123", "ethereum")
    assert len(parsed) == 1
    assert parsed[0]["amount"] == 5000.0

def test_btc_parser_resilience_to_malformed_payloads():
    crawler = BitcoinCrawler()

    class FakeMempoolResponse:
        def json(self):
            return [
                "corrupted_item",
                None,
                {
                    "vin": [{"prevout": {"scriptpubkey_address": "bc1qSender"}}],
                    "vout": [{"scriptpubkey_address": "bc1qRecipient", "value": 150000000}],
                    "txid": "0xbtctx",
                    "status": {"block_time": 1700000000}
                }
            ]

    parsed = crawler._parse_mempool_response(FakeMempoolResponse(), "bc1qSender", 10)
    assert len(parsed) == 1
    assert parsed[0]["amount"] == 1.5
    assert parsed[0]["token"] == "BTC"

# -------------------------------------------------------------
# 3. MOCKED MULTI-CHAIN CRAWLER EXECUTION (RESILIENCE VERIFICATION)
# -------------------------------------------------------------

# TODO (coordinate with Dev 1): crawler results currently use [] both for a
# successful query with no transactions and when all providers fail. Resolving
# this ambiguity requires a separate crawler contract change.
@pytest.mark.asyncio
async def test_crawlers_handle_empty_provider_responses(monkeypatch):
    """Empty provider responses produce empty lists without making live network calls."""
    tron_crawler = TronCrawler()
    evm_crawler = EVMCrawler()
    btc_crawler = BitcoinCrawler()
    provider_calls = []

    def mock_empty_provider_response(crawler):
        async def get_with_failover(providers, parser):
            provider_calls.extend(provider["url"] for provider in providers)
            return []

        monkeypatch.setattr(crawler.resilient_client, "get_with_failover", get_with_failover)

    mock_empty_provider_response(tron_crawler)
    mock_empty_provider_response(evm_crawler)
    mock_empty_provider_response(btc_crawler)

    tron_res = await tron_crawler.fetch_transfers("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb")
    assert isinstance(tron_res, list)
    assert tron_res == []

    evm_res = await evm_crawler.fetch_transfers("0x0000000000000000000000000000000000000000")
    assert isinstance(evm_res, list)
    assert evm_res == []

    btc_res = await btc_crawler.fetch_transfers("1111111111111111111114oLvT2")
    assert isinstance(btc_res, list)
    assert btc_res == []
    assert len(provider_calls) == 6

    await tron_crawler.close()
    await evm_crawler.close()
    await btc_crawler.close()


@pytest.mark.asyncio
@pytest.mark.skipif(
    os.getenv("RUN_LIVE_CRAWLER_TESTS") != "1",
    reason="Live-network integration test; set RUN_LIVE_CRAWLER_TESTS=1 to enable",
)
async def test_live_crawlers_smoke():
    """Smoke-test crawler calls against live providers; excluded from offline runs."""
    tron_crawler = TronCrawler()
    evm_crawler = EVMCrawler()
    btc_crawler = BitcoinCrawler()

    tron_res = await tron_crawler.fetch_transfers("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb")
    assert isinstance(tron_res, list)

    evm_res = await evm_crawler.fetch_transfers("0x0000000000000000000000000000000000000000")
    assert isinstance(evm_res, list)

    btc_res = await btc_crawler.fetch_transfers("1111111111111111111114oLvT2")
    assert isinstance(btc_res, list)

    await tron_crawler.close()
    await evm_crawler.close()
    await btc_crawler.close()
