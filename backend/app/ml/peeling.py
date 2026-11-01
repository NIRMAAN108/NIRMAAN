"""
Peeling Chain, Structuring & Forwarding Velocity Classifier.
Identifies potential transaction patterns for further review.
"""

from typing import Any, Dict, List, Optional
import math


def _get_valid_amount(tx: Dict[str, Any]) -> Optional[float]:
    """Return a finite positive amount, or None when the value is invalid."""
    raw = tx.get("usd_value")
    if raw is None:
        raw = tx.get("amount")

    if isinstance(raw, bool) or raw is None:
        return None
    try:
        value = float(raw)
    except (TypeError, ValueError, OverflowError):
        return None
    if not math.isfinite(value) or value <= 0:
        return None
    return value


def analyze_peeling_chain(
    incoming_transfers: List[Dict[str, Any]],
    outgoing_transfers: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Evaluate a possible peeling pattern: exactly 2 or 3 valid outgoing
    transfers, with the smallest amount representing 1%–20% of their total.
    """
    negative = {
        "is_peeling_chain": False,
        "peel_confidence": 0.0,
        "peel_ratio": 0.0,
        "peeled_amount_usd": 0.0,
        "change_amount_usd": 0.0,
    }
    if len(outgoing_transfers) not in (2, 3):
        return negative

    values = []
    for tx in outgoing_transfers:
        if not isinstance(tx, dict):
            return negative
        value = _get_valid_amount(tx)
        if value is None:
            return negative
        values.append(value)

    total = sum(values)
    if not math.isfinite(total) or total <= 0:
        return negative

    sorted_values = sorted(values)
    small_value = sorted_values[0]
    large_value = sorted_values[-1]
    peel_ratio = small_value / total

    if not 0.01 <= peel_ratio <= 0.20:
        return negative

    confidence = min(0.98, 0.70 + 0.28 * (1.0 - peel_ratio / 0.20))
    return {
        "is_peeling_chain": True,
        "peel_confidence": round(confidence, 3),
        "peel_ratio": round(peel_ratio, 4),
        "peeled_amount_usd": round(small_value, 2),
        "change_amount_usd": round(large_value, 2),
    }


def detect_structuring_smurfing(
    outgoing_transfers: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Count valid positive transfers in the configured $8,500–$9,999 range."""
    suspicious_count = 0
    for tx in outgoing_transfers:
        if not isinstance(tx, dict):
            continue
        value = _get_valid_amount(tx)
        if value is not None and 8500.0 <= value <= 9999.0:
            suspicious_count += 1

    return {
        "is_structuring": suspicious_count >= 2,
        "suspicious_tx_count": suspicious_count,
    }
