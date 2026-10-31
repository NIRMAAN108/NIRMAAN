"""
Industrial Multi-Provider Bitcoin Crawler
Integrates Mempool.space + Blockstream Esplora + Multi-Input Clustering + Failover.
"""
import logging
import time
from typing import List, Dict, Any, Optional, Set
import httpx

from app.crawlers.resilience import ResilientHttpClient

logger = logging.getLogger("nirmaan.crawler.btc")

DEMO_BTC_TRAIL = {
    "bc1qScamVictimBtcSeedAddress998877AABB": [
        {
            "from": "bc1qScamVictimBtcSeedAddress998877AABB",
            "to": "bc1qMuleLayer1BtcSplitter223344CCDD",
            "amount": 0.85,
            "tx_hash": "e1f2a3b4c5d60718293a4b5c6d7e8f90e1f2a3b4c5d60718293a4b5c6d7e8f90",
            "timestamp": int(time.time()) - 3600,
            "token": "BTC",
            "chain": "bitcoin"
        }
    ],
    "bc1qMuleLayer1BtcSplitter223344CCDD": [
        {
            "from": "bc1qMuleLayer1BtcSplitter223344CCDD",
            "to": "bc1qBinanceDepositForwarderBtc556677",
            "amount": 0.82,
            "tx_hash": "f2a3b4c5d60718293a4b5c6d7e8f90e1f2a3b4c5d60718293a4b5c6d7e8f90e1",
            "timestamp": int(time.time()) - 2400,
            "token": "BTC",
            "chain": "bitcoin"
        },
        {
            "from": "bc1qMuleLayer1BtcSplitter223344CCDD",
            "to": "bc1qPeelChangeBurnerBtc99887766",
            "amount": 0.03,
            "tx_hash": "a3b4c5d60718293a4b5c6d7e8f90e1f2a3b4c5d60718293a4b5c6d7e8f90e1f2",
            "timestamp": int(time.time()) - 2400,
            "token": "BTC",
            "chain": "bitcoin"
        }
    ],
    "bc1qBinanceDepositForwarderBtc556677": [
        {
            "from": "bc1qBinanceDepositForwarderBtc556677",
            "to": "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h",  # Known Binance Bitcoin Hot Wallet
            "amount": 0.82,
            "tx_hash": "b4c5d60718293a4b5c6d7e8f90e1f2a3b4c5d60718293a4b5c6d7e8f90e1f2a3",
            "timestamp": int(time.time()) - 1200,
            "token": "BTC",
            "chain": "bitcoin"
        }
    ]
}

class BitcoinCrawler:
    def __init__(self, timeout: float = 12.0):
        self.resilient_client = ResilientHttpClient(timeout=timeout)

    def _parse_mempool_response(self, response: httpx.Response, address: str, limit: int) -> List[Dict[str, Any]]:
        """Parses Mempool / Esplora UTXO transaction payloads."""
        txs = response.json()
        if not isinstance(txs, list):
            return []

        transfers = []
        for tx in txs[:limit]:
            if not isinstance(tx, dict):
                continue

            inputs = tx.get("vin", [])
            # Calculate total input satoshis and the target address's contribution
            my_input_satoshis = sum(
                vin.get("prevout", {}).get("value", 0)
                for vin in inputs
                if vin.get("prevout", {}).get("scriptpubkey_address") == address
            )
            total_input_satoshis = sum(
                vin.get("prevout", {}).get("value", 0)
                for vin in inputs
                if vin.get("prevout")
            )

            is_sender = any(
                vin.get("prevout", {}).get("scriptpubkey_address") == address
                for vin in inputs if vin.get("prevout")
            )

            # Target address participated as an input funder
            if is_sender:
                # Proportional input ratio if input values are present; otherwise fallback to 1.0
                if my_input_satoshis > 0 and total_input_satoshis > 0:
                    input_ratio = my_input_satoshis / total_input_satoshis
                else:
                    input_ratio = 1.0

                for vout in tx.get("vout", []):
                    recipient = vout.get("scriptpubkey_address")
                    # Omit change returns to the same address
                    if recipient and recipient != address:
                        try:
                            satoshis = vout.get("value", 0)
                            # Attribute proportional share to avoid multi-input double-counting (ERR-09)
                            proportional_satoshis = satoshis * input_ratio
                            btc_amount = proportional_satoshis / 1e8
                            tx_id = tx.get("txid", "")
                            # Retain raw block time or null; never synthesize time.time() (ERR-08)
                            raw_ts = tx.get("status", {}).get("block_time")
                            ts = int(raw_ts) if raw_ts is not None else 0

                            if btc_amount > 0 and tx_id:
                                transfers.append({
                                    "from": address,
                                    "to": recipient,
                                    "amount": round(btc_amount, 8),
                                    "tx_hash": tx_id,
                                    "timestamp": ts,
                                    "token": "BTC",
                                    "chain": "bitcoin"
                                })
                        except Exception:
                            continue

        return transfers

    async def fetch_transfers(self, address: str, limit: int = 15) -> List[Dict[str, Any]]:
        """Multi-Provider Failover Crawl for Bitcoin."""
        if address in DEMO_BTC_TRAIL:
            logger.info(f"Returning deterministic Bitcoin demo fixture for {address}")
            return DEMO_BTC_TRAIL[address]

        providers = [
            # Provider 1: Mempool.space
            {
                "url": f"https://mempool.space/api/address/{address}/txs",
                "parser": lambda res: self._parse_mempool_response(res, address, limit)
            },
            # Provider 2: Blockstream Esplora (Alternative mirror)
            {
                "url": f"https://blockstream.info/api/address/{address}/txs",
                "parser": lambda res: self._parse_mempool_response(res, address, limit)
            }
        ]

        for p in providers:
            res = await self.resilient_client.get_with_failover([p], p["parser"])
            if res:
                return res

        return []

    async def fetch_co_spent_cluster(self, address: str, max_txs: int = 5) -> Set[str]:
        """Multi-Input Common-Spend Heuristic."""
        cluster = {address}
        url = f"https://mempool.space/api/address/{address}/txs"

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                r = await client.get(url, headers={"User-Agent": "NIRMAAN-Forensic-Engine/1.0"})
                if r.status_code == 200:
                    txs = r.json()
                    if isinstance(txs, list):
                        for tx in txs[:max_txs]:
                            inputs = tx.get("vin", [])
                            input_addrs = {vin.get("prevout", {}).get("scriptpubkey_address") for vin in inputs if vin.get("prevout")}
                            if address in input_addrs:
                                cluster.update(filter(None, input_addrs))
        except Exception as e:
            logger.debug(f"Common spend cluster query silent skip: {e}")

        return cluster

    async def close(self):
        await self.resilient_client.close()
