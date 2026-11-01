"""
Unified Multi-Chain Crawler Router
Auto-detects blockchain address format and routes requests across TRON, EVM, and Bitcoin.
"""
import hashlib
import re
from typing import List, Dict, Any, Optional

from app.crawlers.tron import TronCrawler
from app.crawlers.evm import EVMCrawler
from app.crawlers.btc import BitcoinCrawler

# --- Base58 & Bech32 Cryptographic Constants & Helpers ---
B58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
B58_MAP = {c: i for i, c in enumerate(B58_CHARS)}

BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
BECH32_MAP = {c: i for i, c in enumerate(BECH32_CHARSET)}


def _b58decode_check(s: str) -> Optional[bytes]:
    """Decodes Base58 string and verifies double-SHA256 4-byte checksum."""
    val = 0
    for c in s:
        if c not in B58_MAP:
            return None
        val = val * 58 + B58_MAP[c]
    b = val.to_bytes((val.bit_length() + 7) // 8, "big")
    num_zeros = len(s) - len(s.lstrip("1"))
    raw = b"\x00" * num_zeros + b
    if len(raw) < 4:
        return None
    data, checksum = raw[:-4], raw[-4:]
    h = hashlib.sha256(hashlib.sha256(data).digest()).digest()[:4]
    if h != checksum:
        return None
    return data


def _bech32_polymod(values: List[int]) -> int:
    generator = [0x3B6A57B2, 0x26508E6D, 0x1EA119FA, 0x3D4233DD, 0x2A1462B3]
    chk = 1
    for v in values:
        top = chk >> 25
        chk = (chk & 0x1FFFFFF) << 5 ^ v
        for i in range(5):
            chk ^= generator[i] if ((top >> i) & 1) else 0
    return chk


def _bech32_hrp_expand(hrp: str) -> List[int]:
    return [ord(x) >> 5 for x in hrp] + [0] + [ord(x) & 31 for x in hrp]


def _verify_bech32(bech: str) -> bool:
    """Verifies BIP-173 (Bech32) or BIP-350 (Bech32m) checksum for Bitcoin."""
    if any(ord(c) < 33 or ord(c) > 126 for c in bech):
        return False
    if bech.lower() != bech and bech.upper() != bech:
        return False  # Mixed case is strictly invalid per BIP-173
    bech = bech.lower()
    pos = bech.rfind("1")
    if pos < 1 or pos + 7 > len(bech) or len(bech) > 90:
        return False
    hrp = bech[:pos]
    if hrp != "bc":
        return False
    data = []
    for c in bech[pos + 1 :]:
        if c not in BECH32_MAP:
            return False
        data.append(BECH32_MAP[c])
    poly = _bech32_polymod(_bech32_hrp_expand(hrp) + data)
    return poly in (1, 0x2BC830A3)


def is_valid_evm_address(address: str) -> bool:
    """
    Validates EVM address:
    Must start with 0x or 0X followed by exactly 40 hexadecimal characters (total 42 characters).
    """
    addr = address.strip()
    return bool(re.match(r"^0[xX][0-9a-fA-F]{40}$", addr))


def is_valid_tron_address(address: str, verify_checksum: bool = False) -> bool:
    """
    Validates TRON address:
    Must start with 'T' followed by 33 Base58 characters (total 34 characters, no 0, O, I, l).
    If verify_checksum is True, also verifies Base58Check double-SHA256 checksum and 0x41 prefix.
    """
    addr = address.strip()
    if not re.match(r"^T[1-9A-HJ-NP-Za-km-z]{33}$", addr):
        return False
    if verify_checksum:
        data = _b58decode_check(addr)
        return data is not None and len(data) == 21 and data[0] == 0x41
    return True


def is_valid_bitcoin_address(address: str) -> bool:
    """
    Validates Bitcoin address:
    - Native SegWit (Bech32 / Bech32m): Starts with 'bc1', validated with BIP-173/BIP-350 checksum.
    - Legacy P2PKH: Starts with '1', 26 to 35 chars, Base58Check checksum with 0x00 version byte.
    - Script P2SH: Starts with '3', 26 to 35 chars, Base58Check checksum with 0x05 version byte.
    """
    addr = address.strip()
    if addr.lower().startswith("bc1"):
        return _verify_bech32(addr)
    elif addr.startswith("1") or addr.startswith("3"):
        if not (26 <= len(addr) <= 35):
            return False
        data = _b58decode_check(addr)
        if data is None or len(data) != 21:
            return False
        if addr.startswith("1") and data[0] != 0x00:
            return False
        if addr.startswith("3") and data[0] != 0x05:
            return False
        return True
    return False


def detect_chain(address: str) -> str:
    """
    Deterministic chain detection based on exact address format:
    - EVM: 0x + 40 hex digits -> 'ethereum' (or BSC if routed)
    - TRON: T + 33 base58 digits (no 0, O, I, l) -> 'tron'
    - Bitcoin: Legacy (1), P2SH (3), or Native SegWit (bc1) with valid checksum -> 'bitcoin'
    Returns 'unknown' if the address does not match any exact format.
    """
    addr = address.strip()
    if is_valid_evm_address(addr):
        return "ethereum"
    elif is_valid_tron_address(addr):
        return "tron"
    elif is_valid_bitcoin_address(addr):
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
            evm_network = "bsc" if target_chain == "bsc" else "ethereum"
            return await self.evm_crawler.fetch_transfers(address, chain=evm_network)
        elif target_chain == "bitcoin":
            return await self.btc_crawler.fetch_transfers(address)
        else:
            # Fallback attempt only for known address shapes
            detected = detect_chain(address)
            if detected == "tron":
                return await self.tron_crawler.fetch_transfers(address)
            elif detected == "ethereum":
                return await self.evm_crawler.fetch_transfers(address)
            return []

    async def close(self):
        await self.tron_crawler.close()
        await self.evm_crawler.close()
        await self.btc_crawler.close()

