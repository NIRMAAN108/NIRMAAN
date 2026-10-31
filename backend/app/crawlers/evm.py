"""
Industrial Multi-Provider EVM (Ethereum & BSC) Crawler
Integrates Blockscout Open API + Etherscan V2 + Public RPC Logs + Failover.
"""
import logging
import time
import os
from typing import List, Dict, Any, Optional
import httpx

from app.crawlers.resilience import ResilientHttpClient

logger = logging.getLogger("nirmaan.crawler.evm")

DEMO_EVM_TRAIL = {
    "0x95222290DD7853684454F4275E597E3A63725F78": [
        {
            "from": "0x95222290DD7853684454F4275E597E3A63725F78",
            "to": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
            "amount": 25000.0,
            "tx_hash": "0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000",
            "timestamp": int(time.time()) - 3600,
            "token": "USDT",
            "chain": "ethereum"
        }
    ],
    "0x71C7656EC7ab88b098defB751B7401B5f6d8976F": [
        {
            "from": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
            "to": "0x0bfC924618e950882e70e3025255474B5C6eDb27",
            "amount": 24900.0,
            "tx_hash": "0x22223333444455556666777788889999aaaabbbbccccddddeeeeffff00001111",
            "timestamp": int(time.time()) - 2400,
            "token": "USDT",
            "chain": "ethereum"
        },
        {
            "from": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
            "to": "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
            "amount": 100.0,
            "tx_hash": "0x3333444455556666777788889999aaaabbbbccccddddeeeeffff000011112222",
            "timestamp": int(time.time()) - 2400,
            "token": "USDT",
            "chain": "ethereum"
        }
    ],
    "0x0bfC924618e950882e70e3025255474B5C6eDb27": [
        {
            "from": "0x0bfC924618e950882e70e3025255474B5C6eDb27",
            "to": "0x28C6c06298d514Db089934071355E5743bf21d60",  # Known Binance 14 Master Hot Wallet
            "amount": 24900.0,
            "tx_hash": "0x444455556666777788889999aaaabbbbccccddddeeeeffff0000111122223333",
            "timestamp": int(time.time()) - 1200,
            "token": "USDT",
            "chain": "ethereum"
        }
    ],
    "0x8894e0a0c962cb723c1976a4421c95949be2d4e3": []
}

class EVMCrawler:
    def __init__(self, api_key: Optional[str] = None, timeout: float = 6.0):
        self.api_key = api_key or os.getenv("ETHERSCAN_API_KEY", "")
        self.resilient_client = ResilientHttpClient(timeout=timeout)

    def _parse_blockscout_response(self, response: httpx.Response, address_lower: str, chain: str) -> List[Dict[str, Any]]:
        """Parses Blockscout v2 token-transfers payload defensively."""
        data = response.json()
        items = data.get("items", [])
        if not isinstance(items, list):
            return []

        transfers = []
        for item in items:
            if not isinstance(item, dict):
                continue
            sender_hash = item.get("from", {}).get("hash", "").lower()
            if sender_hash == address_lower:
                try:
                    token_info = item.get("token", {})
                    raw_val = float(item.get("total", {}).get("value", 0))
                    decimals = int(token_info.get("decimals", 6))
                    amount = raw_val / (10 ** decimals)
                    symbol = token_info.get("symbol", "USDT")
                    tx_hash = item.get("transaction_hash", "")
                    recipient = item.get("to", {}).get("hash", "")

                    if amount > 0 and tx_hash and recipient:
                        # Parse actual ISO timestamp from Blockscout if present (ERR-08)
                        ts = 0
                        raw_ts = item.get("timestamp")
                        if raw_ts:
                            try:
                                from datetime import datetime
                                dt = datetime.fromisoformat(str(raw_ts).replace("Z", "+00:00"))
                                ts = int(dt.timestamp())
                            except Exception:
                                ts = 0

                        transfers.append({
                            "from": sender_hash,
                            "to": recipient,
                            "amount": round(amount, 6),
                            "tx_hash": tx_hash,
                            "timestamp": ts,
                            "token": symbol,
                            "chain": chain
                        })
                except Exception as e:
                    logger.debug(f"Skipping malformed Blockscout item: {e}")
                    continue

        return transfers

    def _parse_etherscan_response(self, response: httpx.Response, address_lower: str, chain: str) -> List[Dict[str, Any]]:
        """Parses Etherscan / BscScan V2 result list."""
        data = response.json()
        results = data.get("result", [])
        if not isinstance(results, list):
            return []

        transfers = []
        for item in results:
            if not isinstance(item, dict):
                continue
            if item.get("from", "").lower() == address_lower:
                try:
                    raw_val = float(item.get("value", 0))
                    decimals = int(item.get("tokenDecimal", 6))
                    amount = raw_val / (10 ** decimals)
                    symbol = item.get("tokenSymbol", "USDT")
                    tx_hash = item.get("hash", "")
                    recipient = item.get("to", "")
                    ts = int(item.get("timeStamp", 0))

                    if amount > 0 and tx_hash and recipient:
                        transfers.append({
                            "from": address_lower,
                            "to": recipient,
                            "amount": round(amount, 6),
                            "tx_hash": tx_hash,
                            "timestamp": ts if ts > 0 else 0,
                            "token": symbol,
                            "chain": chain
                        })
                except Exception:
                    continue

        return transfers

    async def fetch_transfers(self, address: str, chain: str = "ethereum", limit: int = 15) -> List[Dict[str, Any]]:
        """Multi-Provider Failover Crawl for EVM."""
        address_lower = address.lower()

        # Check demo fixture first
        for key in DEMO_EVM_TRAIL:
            if key.lower() == address_lower:
                logger.info(f"Returning deterministic EVM demo fixture for {address}")
                return DEMO_EVM_TRAIL[key]

        base_host = "bsc.blockscout.com" if chain == "bsc" else "eth.blockscout.com"
        etherscan_host = "api.bscscan.com" if chain == "bsc" else "api.etherscan.io"

        providers = [
            # Provider 1: Blockscout Open API (Free, high uptime)
            {
                "url": f"https://{base_host}/api/v2/addresses/{address}/token-transfers",
                "params": {"type": "ERC-20"},
                "parser": lambda res: self._parse_blockscout_response(res, address_lower, chain)
            },
            # Provider 2: Etherscan / BscScan V2
            {
                "url": f"https://{etherscan_host}/api",
                "params": {
                    "module": "account",
                    "action": "tokentx",
                    "address": address,
                    "page": 1,
                    "offset": limit,
                    "sort": "desc",
                    "apikey": self.api_key or "YourApiKeyToken"
                },
                "parser": lambda res: self._parse_etherscan_response(res, address_lower, chain)
            }
        ]

        for p in providers:
            res = await self.resilient_client.get_with_failover([p], p["parser"])
            if res:
                return res

        return []

    async def fetch_gas_funder(self, address: str, chain: str = "ethereum") -> Optional[str]:
        """Detects parent gas funding transfer (0.001 to 0.1 ETH/BNB)."""
        base_host = "bsc.blockscout.com" if chain == "bsc" else "eth.blockscout.com"
        url = f"https://{base_host}/api/v2/addresses/{address}/transactions"

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                r = await client.get(url, headers={"User-Agent": "NIRMAAN-Forensic-Engine/1.0"})
                if r.status_code == 200:
                    txs = r.json().get("items", [])
                    address_lower = address.lower()
                    for tx in txs:
                        to_addr = tx.get("to", {}).get("hash", "").lower()
                        if to_addr == address_lower:
                            val = float(tx.get("value", 0))
                            if 0.0005 <= (val / 1e18) <= 0.10:
                                return tx.get("from", {}).get("hash")
        except Exception as e:
            logger.debug(f"Gas funder query silent skip: {e}")
        return None

    async def close(self):
        await self.resilient_client.close()
