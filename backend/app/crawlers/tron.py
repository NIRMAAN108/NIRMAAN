"""
Industrial Multi-Provider TRON Crawler
Integrates TronGrid Primary + Tronscan Secondary + Circuit Breakers + Failover.
"""
import logging
import time
from typing import List, Dict, Any, Optional
import httpx

from app.crawlers.resilience import ResilientHttpClient

logger = logging.getLogger("nirmaan.crawler.tron")

DEMO_FIXTURE_TRAIL = {
    "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC": [
        {
            "from": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
            "to": "TSGRsppW4vSaWWstQUTa2d4CWJDWBRkWVA",
            "amount": 15000.0,
            "tx_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
            "timestamp": int(time.time()) - 3600,
            "token": "USDT",
            "chain": "tron"
        }
    ],
    "TSGRsppW4vSaWWstQUTa2d4CWJDWBRkWVA": [
        {
            "from": "TSGRsppW4vSaWWstQUTa2d4CWJDWBRkWVA",
            "to": "TTpfou5hZarSNUpbaiAWHcCyC4u7ofBMrk",
            "amount": 14950.0,
            "tx_hash": "b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1",
            "timestamp": int(time.time()) - 2400,
            "token": "USDT",
            "chain": "tron"
        },
        {
            "from": "TSGRsppW4vSaWWstQUTa2d4CWJDWBRkWVA",
            "to": "TVNujs6Y14Hd12vsM5BaBjHq2iNBsqs5Kd",
            "amount": 50.0,
            "tx_hash": "c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2",
            "timestamp": int(time.time()) - 2400,
            "token": "USDT",
            "chain": "tron"
        }
    ],
    "TTpfou5hZarSNUpbaiAWHcCyC4u7ofBMrk": [
        {
            "from": "TTpfou5hZarSNUpbaiAWHcCyC4u7ofBMrk",
            "to": "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N",  # Known Binance Hot Wallet 1
            "amount": 14950.0,
            "tx_hash": "d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3",
            "timestamp": int(time.time()) - 1200,
            "token": "USDT",
            "chain": "tron"
        }
    ],
    "TVNujs6Y14Hd12vsM5BaBjHq2iNBsqs5Kd": []
}

class TronCrawler:
    def __init__(self, timeout: float = 6.0):
        self.resilient_client = ResilientHttpClient(timeout=timeout)

    def _parse_trongrid_response(self, response: httpx.Response, address: str) -> List[Dict[str, Any]]:
        """Safely parses TronGrid JSON with defensive type coercion and decimal validation."""
        data = response.json()
        raw_txs = data.get("data", [])
        if not isinstance(raw_txs, list):
            return []

        transfers = []
        for item in raw_txs:
            if not isinstance(item, dict):
                continue
            if item.get("from") == address:
                try:
                    raw_val = float(item.get("value", 0))
                    token_info = item.get("token_info") or {}
                    decimals = int(token_info.get("decimals", 6)) if isinstance(token_info, dict) else 6
                    amount = raw_val / (10 ** decimals) if decimals > 0 else raw_val
                    symbol = token_info.get("symbol", "USDT") if isinstance(token_info, dict) else "USDT"
                    tx_id = item.get("transaction_id", "")
                    ts = int(item.get("block_timestamp", 0)) // 1000
                    recipient = (item.get("to") or "").strip()

                    if amount > 0 and tx_id and recipient:
                        transfers.append({
                            "from": address,
                            "to": recipient,
                            "amount": round(amount, 6),
                            "tx_hash": tx_id,
                            "timestamp": ts if ts > 0 else 0,
                            "token": symbol,
                            "chain": "tron"
                        })
                except (ValueError, TypeError, ZeroDivisionError, AttributeError) as err:
                    logger.debug(f"Skipping malformed TRON transaction record: {err}")
                    continue

        return transfers

    def _parse_tronscan_response(self, response: httpx.Response, address: str) -> List[Dict[str, Any]]:
        """Secondary fallback parser for Tronscan OpenAPI."""
        data = response.json()
        raw_txs = data.get("token_transfers", [])
        if not isinstance(raw_txs, list):
            return []

        transfers = []
        for item in raw_txs:
            if not isinstance(item, dict):
                continue
            if item.get("from_address") == address:
                try:
                    raw_val = float(item.get("quant", 0))
                    token_info = item.get("tokenInfo") or {}
                    decimals = int(token_info.get("tokenDecimal", 6)) if isinstance(token_info, dict) else 6
                    amount = raw_val / (10 ** decimals) if decimals > 0 else raw_val
                    symbol = token_info.get("tokenAbbr", "USDT") if isinstance(token_info, dict) else "USDT"
                    tx_id = item.get("transaction_id", "")
                    ts = int(item.get("block_ts", 0)) // 1000
                    recipient = (item.get("to_address") or "").strip()

                    if amount > 0 and tx_id and recipient:
                        transfers.append({
                            "from": address,
                            "to": recipient,
                            "amount": round(amount, 6),
                            "tx_hash": tx_id,
                            "timestamp": ts if ts > 0 else 0,
                            "token": symbol,
                            "chain": "tron"
                        })
                except Exception:
                    continue

        return transfers

    async def fetch_transfers(self, address: str, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Multi-Provider Failover Crawl:
        1. Checks demo fixture first (for offline resilience)
        2. Queries TronGrid Official API
        3. If failed/timed out, automatically fails over to Tronscan OpenAPI
        """
        if address in DEMO_FIXTURE_TRAIL:
            logger.info(f"Returning deterministic demo fixture for {address}")
            return DEMO_FIXTURE_TRAIL[address]

        # Multi-provider definitions
        providers = [
            {
                "url": f"https://api.trongrid.io/v1/accounts/{address}/transactions/trc20",
                "params": {"limit": limit, "only_to": "false", "only_from": "true"},
                "parser": lambda res: self._parse_trongrid_response(res, address)
            },
            {
                "url": "https://apilist.tronscanapi.com/api/token_trc20/transfers",
                "params": {"limit": limit, "start": 0, "sort": "-timestamp", "count": "true", "relatedAddress": address},
                "parser": lambda res: self._parse_tronscan_response(res, address)
            }
        ]

        for p in providers:
            res = await self.resilient_client.get_with_failover([p], p["parser"])
            if res:
                return res

        return []

    async def fetch_energy_delegator(self, address: str) -> Optional[str]:
        """Inspects TRON Stake 2.0 Energy Delegations to find exchange parent."""
        url = "https://api.trongrid.io/wallet/getdelegatedresource"
        payload = {"fromAddress": "", "toAddress": address, "visible": True}
        data = await self.resilient_client.post_json(url, payload, timeout=4.0)
        if data and isinstance(data, dict):
            delegated_list = data.get("delegatedResource", [])
            if delegated_list and isinstance(delegated_list, list):
                return delegated_list[0].get("from")
        return None

    async def close(self):
        await self.resilient_client.close()
