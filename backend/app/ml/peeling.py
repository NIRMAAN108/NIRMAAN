"""
Peeling Chain, Structuring & Forwarding Velocity Classifier.
Identifies algorithmic money laundering patterns used by cyber syndicates.
"""

from typing import List, Dict, Any, Tuple
import datetime

def analyze_peeling_chain(
    incoming_transfers: List[Dict[str, Any]],
    outgoing_transfers: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates whether an address functions as a hop in an automated peeling chain.
    In a peeling chain:
    - An address receives a lump sum.
    - It emits 2 outputs: a small peeled amount (cashout/fee) and a large change amount.
    - Peel ratio (small / total) is typically between 1% and 15%.
    """
    if not outgoing_transfers:
        return {
            "is_peeling_chain": False,
            "peel_confidence": 0.0,
            "peel_ratio": 0.0,
            "peeled_amount_usd": 0.0,
            "change_amount_usd": 0.0
        }

    # Out degree check: classic peeling has out-degree of 2 (or 3)
    out_degree = len(outgoing_transfers)
    out_values = [float(tx.get("usd_value") or tx.get("amount") or 0.0) for tx in outgoing_transfers]
    out_values = [v for v in out_values if v > 0]

    if out_degree in [2, 3] and len(out_values) >= 2:
        sorted_vals = sorted(out_values)
        small_val = sorted_vals[0]
        large_val = sorted_vals[-1]
        total = sum(sorted_vals)

        if total > 0:
            peel_ratio = small_val / total
            # Classic peel: 1% to 15% peeled off, rest passed as change
            if 0.01 <= peel_ratio <= 0.20:
                confidence = min(0.98, 0.70 + (0.28 * (1.0 - (peel_ratio / 0.20))))
                return {
                    "is_peeling_chain": True,
                    "peel_confidence": round(confidence, 3),
                    "peel_ratio": round(peel_ratio, 4),
                    "peeled_amount_usd": round(small_val, 2),
                    "change_amount_usd": round(large_val, 2)
                }

    return {
        "is_peeling_chain": False,
        "peel_confidence": 0.0,
        "peel_ratio": 0.0,
        "peeled_amount_usd": 0.0,
        "change_amount_usd": 0.0
    }

def detect_structuring_smurfing(outgoing_transfers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Detects smurfing/structuring patterns where transactions are deliberately
    split into amounts just below standard threshold limits (e.g. $9,000 - $9,950 USD)
    to evade automated AML compliance flags.
    """
    if not outgoing_transfers:
        return {"is_structuring": False, "suspicious_tx_count": 0}

    smurf_count = 0
    for tx in outgoing_transfers:
        val = float(tx.get("usd_value") or tx.get("amount") or 0.0)
        # Frequent crypto AML structuring range: $8,500 to $9,999
        if 8500.0 <= val <= 9999.0:
            smurf_count += 1

    is_structuring = smurf_count >= 2
    return {
        "is_structuring": is_structuring,
        "suspicious_tx_count": smurf_count
    }
