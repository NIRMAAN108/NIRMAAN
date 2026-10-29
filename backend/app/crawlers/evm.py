"""
EVM (Ethereum & BSC) Token Transfer Crawler
Handles ERC-20 & BEP-20 USDT/USDC transfer tracking with public API & fallback demo fixtures.
"""
import httpx
import logging
import time
from typing import List, Dict, Any, Optional

logger = logging.getLogger("nirmaan.crawler.evm")

# Common Token Contracts
ETH_USDT_CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7"
BSC_USDT_CONTRACT = "0x55d398326f99059ff775485246999027b3197955"

# Deterministic realistic EVM demo trail (Victim -> Scam Burner -> Mule Splitter -> Binance Deposit -> Binance Hot 14)
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
    def __init__(self, api_key: Optional[str] = None, timeout: float = 4.0):
        self.api_key = api_key or "FREE_KEY"
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)

    async def fetch_transfers(self, address: str, chain: str = "ethereum", limit: int = 25) -> List[Dict[str, Any]]:
        """
        Fetches outbound ERC-20 / BEP-20 token transfers for a given EVM address.
        Supports Ethereum mainnet and BSC.
        """
        address_lower = address.lower()

        # Check demo fixture first
        for key in DEMO_EVM_TRAIL:
            if key.lower() == address_lower:
                logger.info(f"Returning deterministic EVM demo fixture for {address}")
                return DEMO_EVM_TRAIL[key]

        endpoint = "https://api.etherscan.io/api" if chain == "ethereum" else "https://api.bscscan.com/api"
        contract = ETH_USDT_CONTRACT if chain == "ethereum" else BSC_USDT_CONTRACT

        params = {
            "module": "account",
            "action": "tokentx",
            "contractaddress": contract,
            "address": address,
            "page": 1,
            "offset": limit,
            "sort": "desc",
            "apikey": self.api_key
        }

        try:
            response = await self.client.get(endpoint, params=params)
            if response.status_code == 200:
                data = response.json()
                results = data.get("result", [])
                if not isinstance(results, list):
                    return []
                transfers = []
                for item in results:
                    if not isinstance(item, dict):
                        continue
                    # Filter for outbound token transfers
                    if item.get("from", "").lower() == address_lower:
                        raw_value = float(item.get("value", 0))
                        decimals = int(item.get("tokenDecimal", 6))
                        amount = raw_value / (10 ** decimals)

                        transfers.append({
                            "from": item.get("from"),
                            "to": item.get("to"),
                            "amount": amount,
                            "tx_hash": item.get("hash"),
                            "timestamp": int(item.get("timeStamp", 0)),
                            "token": item.get("tokenSymbol", "USDT"),
                            "chain": chain
                        })
                return transfers
        except Exception as e:
            logger.warning(f"EVM Explorer query failed for {address} on {chain}: {e}")

        return []

    async def close(self):
        await self.client.aclose()
