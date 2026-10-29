"""
Bitcoin (UTXO) & Multi-Input Clustering Crawler
Extracts outbound UTXO transactions and resolves common-spend address clusters.
"""
import httpx
import logging
import time
from typing import List, Dict, Any, Optional, Set

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
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
        self._last_call_ts = 0.0

    async def _throttle(self):
        """Enforces rate limit on public Mempool API."""
        now = time.time()
        elapsed = now - self._last_call_ts
        if elapsed < 0.25:
            time.sleep(0.25 - elapsed)
        self._last_call_ts = time.time()

    async def fetch_transfers(self, address: str, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Fetches outbound Bitcoin transactions for a given address using Mempool.space API.
        """
        if address in DEMO_BTC_TRAIL:
            logger.info(f"Returning deterministic Bitcoin demo fixture for {address}")
            return DEMO_BTC_TRAIL[address]

        await self._throttle()
        url = f"https://mempool.space/api/address/{address}/txs"

        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                txs = response.json()
                transfers = []
                for tx in txs[:limit]:
                    is_sender = any(vin.get("prevout", {}).get("scriptpubkey_address") == address for vin in tx.get("vin", []))
                    if is_sender:
                        for vout in tx.get("vout", []):
                            recipient = vout.get("scriptpubkey_address")
                            if recipient and recipient != address:
                                satoshis = vout.get("value", 0)
                                btc_amount = satoshis / 1e8
                                transfers.append({
                                    "from": address,
                                    "to": recipient,
                                    "amount": btc_amount,
                                    "tx_hash": tx.get("txid"),
                                    "timestamp": tx.get("status", {}).get("block_time", int(time.time())),
                                    "token": "BTC",
                                    "chain": "bitcoin"
                                })
                return transfers
        except Exception as e:
            logger.warning(f"Mempool.space query failed for {address}: {e}")

        return []

    async def fetch_co_spent_cluster(self, address: str, max_txs: int = 5) -> Set[str]:
        """
        Multi-Input Common-Spend Heuristic:
        In Bitcoin, all input addresses spent in the same transaction are proven
        to belong to the same entity / wallet controller.
        """
        cluster = {address}
        await self._throttle()
        url = f"https://mempool.space/api/address/{address}/txs"

        try:
            r = await self.client.get(url)
            if r.status_code == 200:
                txs = r.json()
                for tx in txs[:max_txs]:
                    inputs = tx.get("vin", [])
                    input_addrs = {vin.get("prevout", {}).get("scriptpubkey_address") for vin in inputs if vin.get("prevout")}
                    if address in input_addrs:
                        cluster.update(filter(None, input_addrs))
        except Exception as e:
            logger.warning(f"Common spend cluster query failed for {address}: {e}")

        return cluster

    async def close(self):
        await self.client.aclose()
