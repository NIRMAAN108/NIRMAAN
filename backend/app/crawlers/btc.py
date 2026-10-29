"""
Bitcoin (UTXO) Crawler
Tracks outbound Bitcoin transactions using Mempool.space / Blockstream Esplora API.
"""
import httpx
import logging
import time
from typing import List, Dict, Any, Optional

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

    async def fetch_transfers(self, address: str, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Fetches outbound Bitcoin transactions for a given address using Mempool.space API.
        """
        # Check demo fixture first
        if address in DEMO_BTC_TRAIL:
            logger.info(f"Returning deterministic Bitcoin demo fixture for {address}")
            return DEMO_BTC_TRAIL[address]

        url = f"https://mempool.space/api/address/{address}/txs"

        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                txs = response.json()
                transfers = []
                for tx in txs[:limit]:
                    # Check if address is in inputs (meaning address spent money)
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

    async def close(self):
        await self.client.aclose()
