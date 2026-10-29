"""
Unified Multi-Chain Crawler Router
Auto-detects blockchain address format and routes requests across TRON, EVM, and Bitcoin.
"""
import re
from typing import List, Dict, Any, Optional

from app.crawlers.tron import TronCrawler
from app.crawlers.evm import EVMCrawler
from app.crawlers.btc import BitcoinCrawler

def detect_chain(address: str) -> str:
    """
    Deterministic chain detection based on address format:
    - Starts with 0x (42 chars) -> EVM (Ethereum / BSC)
    - Starts with T (34 chars, Base58) -> TRON
    - Starts with 1, 3, or bc1 -> Bitcoin
    """
    addr = address.strip()
    if addr.startswith("0x") and len(addr) == 42:
        return "ethereum"
    elif addr.startswith("T") and len(addr) == 34:
        return "tron"
    elif addr.startswith("bc1") or addr.startswith("1") or addr.startswith("3"):
        return "bitcoin"
    return "unknown"

class MultiChainCrawler:
    def __init__(self):
        self.tron_crawler = TronCrawler()
        self.evm_crawler = EVMCrawler()
        self.btc_crawler = BitcoinCrawler()

    async def fetch_transfers(self, address: str, chain: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Unified entry point. Automatically identifies chain if omitted.
        """
        target_chain = chain or detect_chain(address)

        if target_chain == "tron":
            return await self.tron_crawler.fetch_transfers(address)
        elif target_chain in ("ethereum", "bsc", "evm"):
            return await self.evm_crawler.fetch_transfers(address, chain="ethereum")
        elif target_chain == "bitcoin":
            return await self.btc_crawler.fetch_transfers(address)
        else:
            # Fallback attempt across all
            if address.startswith("T"):
                return await self.tron_crawler.fetch_transfers(address)
            elif address.startswith("0x"):
                return await self.evm_crawler.fetch_transfers(address)
            return []

    async def close(self):
        await self.tron_crawler.close()
        await self.evm_crawler.close()
        await self.btc_crawler.close()
