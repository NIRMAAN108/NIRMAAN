"""
NCRP / 1930 Cybercrime Complaint Ingestion Engine.
Extracts cryptocurrency wallet addresses, transaction hashes, loss amounts (INR/USD),
FIR/Ticket IDs, and investigating metadata from unstructured victim statements
and National Cyber Crime Reporting Portal (NCRP) complaints.
"""

import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from app.crawlers.multi_chain_crawler import (
    is_valid_tron_address,
    is_valid_evm_address,
    is_valid_bitcoin_address
)

class ExtractedComplaintData(BaseModel):
    raw_text: str
    extracted_addresses: List[Dict[str, str]] = Field(default_factory=list)
    extracted_tx_hashes: List[str] = Field(default_factory=list)
    extracted_fir_numbers: List[str] = Field(default_factory=list)
    extracted_amounts_inr: List[float] = Field(default_factory=list)
    extracted_phone_numbers: List[str] = Field(default_factory=list)
    primary_seed_address: Optional[str] = None
    primary_chain: Optional[str] = None
    estimated_loss_inr: float = 0.0
    suggested_fir: Optional[str] = None

# Regex patterns for crypto entities (Base58Check, Bech32, EIP-55 hex)
TRON_ADDR_REGEX = re.compile(r'\b(T[a-zA-Z0-9]{30,35})\b')
EVM_ADDR_REGEX = re.compile(r'\b(0x[a-fA-F0-9]{40})\b')
BTC_BECH32_REGEX = re.compile(r'\b(bc1[a-zA-Z0-9]{25,62})\b', re.IGNORECASE)
BTC_LEGACY_REGEX = re.compile(r'\b([13][a-zA-Z0-9]{25,34})\b')
TX_HASH_REGEX = re.compile(r'\b(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})\b')

# Indian Legal & Forensic patterns
FIR_REGEX = re.compile(
    r'\b((?:FIR|NCRP|TICKET)[\s\-_.:/]*[A-Za-z0-9\-_/]{3,30})\b',
    re.IGNORECASE
)
INR_AMOUNT_REGEX = re.compile(
    r'(?:(?:Rs\.?|INR|₹|amount\s+of|lost)\s*[:=]?\s*)([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{2})?|\b[0-9]{3,10}(?:\.[0-9]{2})?\b)(?!\s*(?:USDT|USDC|USD|BTC|ETH|TRX))',
    re.IGNORECASE
)
CRYPTO_AMOUNT_REGEX = re.compile(
    r'\b([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(USDT|USDC|USD|\$|BTC|ETH|TRX)\b',
    re.IGNORECASE
)
CRYPTO_TO_INR_RATES = {
    "USDT": 90.0, "USDC": 90.0, "USD": 90.0, "$": 90.0,
    "BTC": 5800000.0, "ETH": 230000.0, "TRX": 14.5
}
PHONE_REGEX = re.compile(r'\b(?:\+91[\-\s]?)?[6-9]\d{9}\b')

def parse_ncrp_complaint(text: str) -> ExtractedComplaintData:
    """
    Parses unstructured victim complaints from 1930 or NCRP portal.
    Extracts suspect crypto addresses, transaction receipts, amounts, and metadata.
    """
    if not text:
        return ExtractedComplaintData(raw_text="")

    # 1. Extract Addresses
    addresses: List[Dict[str, str]] = []
    seen_addr = set()

    # TRON
    for m in TRON_ADDR_REGEX.finditer(text):
        addr = m.group(1)
        if addr not in seen_addr and is_valid_tron_address(addr):
            seen_addr.add(addr)
            addresses.append({"address": addr, "chain": "tron"})

    # EVM
    for m in EVM_ADDR_REGEX.finditer(text):
        addr = m.group(1)
        if addr not in seen_addr and is_valid_evm_address(addr):
            seen_addr.add(addr)
            addresses.append({"address": addr, "chain": "ethereum"})

    # BTC Bech32
    for m in BTC_BECH32_REGEX.finditer(text):
        addr = m.group(1)
        if addr not in seen_addr and is_valid_bitcoin_address(addr):
            seen_addr.add(addr)
            addresses.append({"address": addr, "chain": "bitcoin"})

    # BTC Legacy
    for m in BTC_LEGACY_REGEX.finditer(text):
        addr = m.group(1)
        # Verify not already caught as TRON
        if addr not in seen_addr and not addr.startswith("T") and is_valid_bitcoin_address(addr):
            seen_addr.add(addr)
            addresses.append({"address": addr, "chain": "bitcoin"})

    # 2. Extract Tx Hashes
    tx_hashes: List[str] = []
    for m in TX_HASH_REGEX.finditer(text):
        h = m.group(1)
        if h not in seen_addr and h not in tx_hashes:
            tx_hashes.append(h)

    # 3. Extract FIR / Ticket IDs
    fir_numbers: List[str] = []
    for m in FIR_REGEX.finditer(text):
        fir = m.group(1).strip()
        # Ensure it looks like a real ticket or FIR ID (has numbers or dash)
        if any(c.isdigit() for c in fir) and fir not in fir_numbers:
            fir_numbers.append(fir)

    # 4. Extract Amounts (Crypto spot conversions & INR sums)
    amounts: List[float] = []
    for m in CRYPTO_AMOUNT_REGEX.finditer(text):
        raw_val = m.group(1).replace(",", "")
        unit = m.group(2).upper()
        rate = CRYPTO_TO_INR_RATES.get(unit, 90.0)
        try:
            val = float(raw_val) * rate
            if val >= 500:
                amounts.append(round(val, 2))
        except ValueError:
            pass

    for m in INR_AMOUNT_REGEX.finditer(text):
        raw_val = m.group(1).replace(",", "")
        try:
            val = float(raw_val)
            if val >= 500:  # Ignore trivial numbers like pin codes
                amounts.append(val)
        except ValueError:
            pass

    # 5. Extract Phone Numbers
    phone_numbers: List[str] = []
    for m in PHONE_REGEX.finditer(text):
        p = m.group(0)
        if p not in phone_numbers:
            phone_numbers.append(p)

    # Determine primary seed
    primary_addr = addresses[0]["address"] if addresses else None
    primary_chain = addresses[0]["chain"] if addresses else None
    est_loss = max(amounts) if amounts else 0.0
    suggested_fir = fir_numbers[0] if fir_numbers else "NCRP-1930/2026"

    return ExtractedComplaintData(
        raw_text=text,
        extracted_addresses=addresses,
        extracted_tx_hashes=tx_hashes,
        extracted_fir_numbers=fir_numbers,
        extracted_amounts_inr=amounts,
        extracted_phone_numbers=phone_numbers,
        primary_seed_address=primary_addr,
        primary_chain=primary_chain,
        estimated_loss_inr=est_loss,
        suggested_fir=suggested_fir
    )
