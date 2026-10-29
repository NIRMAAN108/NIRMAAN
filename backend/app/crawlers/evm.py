"""
EVM (Ethereum & BSC) Token Transfer & Gas-Funding Crawler
Supports live Blockscout open explorer on Ethereum & BSC + Gas-Funding Parent Detection.
"""
import httpx
import logging
import time
from typing import List, Dict, Any, Optional

logger = logging.getLogger("nirmaan.crawler.evm")

DEMO_EVM_TRAIL = {
    "0xScamOriginVictimEther998877AABBCCDDEEFF": [
        {
            "from": "0xScamOriginVictimEther998877AABBCCDDEEFF",
            "to": "0xMuleSplitterEtherLayer1A1B2C3D4E5F60718",
            "amount": 25000.0,
            "tx_hash": "0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000",
            "timestamp": int(time.time()) - 3600,
            "token": "USDT",
            "chain": "ethereum"
        }
    ],
    "0xMuleSplitterEtherLayer1A1B2C3D4E5F60718": [
        {
            "from": "0xMuleSplitterEtherLayer1A1B2C3D4E5F60718",
            "to": "0xBinanceDepositForwarderEther88776655",
            "amount": 24900.0,
            "tx_hash": "0x22223333444455556666777788889999aaaabbbbccccddddeeeeffff00001111",
            "timestamp": int(time.time()) - 2400,
            "token": "USDT",
            "chain": "ethereum"
        },
        {
            "from": "0xMuleSplitterEtherLayer1A1B2C3D4E5F60718",
            "to": "0xPeelingBurnerEtherChange99001122",
            "amount": 100.0,
            "tx_hash": "0x3333444455556666777788889999aaaabbbbccccddddeeeeffff000011112222",
            "timestamp": int(time.time()) - 2400,
            "token": "USDT",
            "chain": "ethereum"
        }
    ],
    "0xBinanceDepositForwarderEther88776655": [
        {
            "from": "0xBinanceDepositForwarderEther88776655",
            "to": "0x28C6c06298d514Db089934071355E5743bf21d60",  # Known Binance 14 Master Hot Wallet
            "amount": 24900.0,
            "tx_hash": "0x444455556666777788889999aaaabbbbccccddddeeeeffff0000111122223333",
            "timestamp": int(time.time()) - 1200,
            "token": "USDT",
            "chain": "ethereum"
        }
    ]
}

class EVMCrawler:
    def __init__(self, api_key: Optional[str] = None, timeout: float = 6.0):
        self.api_key = api_key
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
        self._last_call_ts = 0.0

    async def _throttle(self):
        """Smooth rate limiter (5 req/sec)."""
        now = time.time()
        elapsed = now - self._last_call_ts
        if elapsed < 0.20:
            time.sleep(0.20 - elapsed)
        self._last_call_ts = time.time()

    async def fetch_transfers(self, address: str, chain: str = "ethereum", limit: int = 15) -> List[Dict[str, Any]]:
        """
        Fetches live outbound ERC-20 / BEP-20 token transfers using Blockscout Open Explorer.
        Auto-routes between Ethereum (eth.blockscout.com) and BSC (bsc.blockscout.com).
        """
        address_lower = address.lower()

        # Check demo fixture first
        for key in DEMO_EVM_TRAIL:
            if key.lower() == address_lower:
                logger.info(f"Returning deterministic EVM demo fixture for {address}")
                return DEMO_EVM_TRAIL[key]

        await self._throttle()
        base_host = "bsc.blockscout.com" if chain == "bsc" else "eth.blockscout.com"
        url = f"https://{base_host}/api/v2/addresses/{address}/token-transfers?type=ERC-20"

        try:
            headers = {"User-Agent": "NIRMAAN-Forensic-Engine/1.0"}
            response = await self.client.get(url, headers=headers)
            if response.status_code == 200:
                items = response.json().get("items", [])
                transfers = []
                for item in items[:limit]:
                    sender_hash = item.get("from", {}).get("hash", "").lower()
                    if sender_hash == address_lower:
                        token_info = item.get("token", {})
                        raw_val = float(item.get("total", {}).get("value", 0))
                        decimals = int(token_info.get("decimals", 6))
                        amount = raw_val / (10 ** decimals)
                        symbol = token_info.get("symbol", "USDT")

                        transfers.append({
                            "from": item.get("from", {}).get("hash"),
                            "to": item.get("to", {}).get("hash"),
                            "amount": amount,
                            "tx_hash": item.get("transaction_hash"),
                            "timestamp": int(time.time()),
                            "token": symbol,
                            "chain": chain
                        })
                return transfers
        except Exception as e:
            logger.warning(f"Blockscout query failed for {address} on {chain}: {e}")

        return []

    async def fetch_gas_funder(self, address: str, chain: str = "ethereum") -> Optional[str]:
        """
        Deposit Sweep Heuristic (Parent Gas Dispenser Detection):
        Checks who sent native ETH / BNB to this address to pay gas for token sweeps.
        Returns the parent hot wallet / gas dispenser address if detected.
        """
        await self._throttle()
        base_host = "bsc.blockscout.com" if chain == "bsc" else "eth.blockscout.com"
        url = f"https://{base_host}/api/v2/addresses/{address}/transactions"

        try:
            headers = {"User-Agent": "NIRMAAN-Forensic-Engine/1.0"}
            r = await self.client.get(url, headers=headers)
            if r.status_code == 200:
                txs = r.json().get("items", [])
                address_lower = address.lower()
                for tx in txs:
                    # Inbound native transfer
                    to_addr = tx.get("to", {}).get("hash", "").lower()
                    if to_addr == address_lower:
                        val = float(tx.get("value", 0))
                        # Typical gas funding transfer: 0.001 to 0.05 ETH/BNB
                        if 0.0005 <= (val / 1e18) <= 0.10:
                            return tx.get("from", {}).get("hash")
        except Exception as e:
            logger.warning(f"Gas funder query failed for {address}: {e}")
        return None

    async def close(self):
        await self.client.aclose()
