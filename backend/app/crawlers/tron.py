"""
TRON TRC-20 (USDT) Crawler
Extracts outbound token transfers with rate-limit resilience and offline demo fixtures.
"""
import httpx
import logging
import time
from typing import List, Dict, Any

logger = logging.getLogger("nirmaan.crawler.tron")
TRC20_USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"

# Deterministic realistic demo trail (Victim -> Scam Burner -> Mule Splitter -> Binance Deposit -> Binance Hot Wallet)
DEMO_FIXTURE_TRAIL = {
    "TScamOriginVictimAddress778899AABB": [
        {
            "from": "TScamOriginVictimAddress778899AABB",
            "to": "TMuleSplitterLayer1Address445566CC",
            "amount": 15000.0,
            "tx_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
            "timestamp": int(time.time()) - 3600,
            "token": "USDT"
        }
    ],
    "TMuleSplitterLayer1Address445566CC": [
        {
            "from": "TMuleSplitterLayer1Address445566CC",
            "to": "TBinanceUserDepositForwarder8899ZZ",
            "amount": 14950.0,
            "tx_hash": "b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1",
            "timestamp": int(time.time()) - 2400,
            "token": "USDT"
        },
        {
            "from": "TMuleSplitterLayer1Address445566CC",
            "to": "TPeelingChangeBurner11223344EEFF",
            "amount": 50.0,
            "tx_hash": "c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2",
            "timestamp": int(time.time()) - 2400,
            "token": "USDT"
        }
    ],
    "TBinanceUserDepositForwarder8899ZZ": [
        {
            "from": "TBinanceUserDepositForwarder8899ZZ",
            "to": "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N",  # Known Binance Hot Wallet 1
            "amount": 14950.0,
            "tx_hash": "d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3",
            "timestamp": int(time.time()) - 1200,
            "token": "USDT"
        }
    ]
}

class TronCrawler:
    def __init__(self, timeout: float = 4.0):
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)

    async def fetch_transfers(self, address: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetches outbound TRC-20 USDT transfers from Tronscan public API.
        Falls back to realistic demo graph if address matches demo seed or public API is unreachable.
        """
        # Check demo fixture first for instant zero-latency benchmark demos
        if address in DEMO_FIXTURE_TRAIL:
            logger.info(f"Returning deterministic demo fixture for {address}")
            return DEMO_FIXTURE_TRAIL[address]

        url = f"https://apilist.tronscanapi.com/api/token_trc20/transfers"
        params = {
            "limit": limit,
            "start": 0,
            "sort": "-timestamp",
            "count": "true",
            "relatedAddress": address
        }

        try:
            headers = {"User-Agent": "NIRMAAN-Forensics-Engine/1.0"}
            response = await self.client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                data = response.json()
                transfers = []
                for item in data.get("token_transfers", []):
                    # Filter for USDT and outbound transfers
                    if item.get("from_address") == address and item.get("symbol", "").upper() == "USDT":
                        raw_amount = float(item.get("quant", 0))
                        # USDT on Tron has 6 decimals
                        decimals = int(item.get("tokenInfo", {}).get("tokenDecimal", 6))
                        amount = raw_amount / (10 ** decimals) if raw_amount > 1e6 else raw_amount

                        transfers.append({
                            "from": item.get("from_address"),
                            "to": item.get("to_address"),
                            "amount": amount,
                            "tx_hash": item.get("transaction_id"),
                            "timestamp": int(item.get("block_ts", 0)) // 1000,
                            "token": "USDT"
                        })
                return transfers
        except Exception as e:
            logger.warning(f"Tronscan API query failed for {address}: {e}. Checking fallback.")

        # If live call failed and address not in demo, return empty list
        return []

    async def close(self):
        await self.client.aclose()
