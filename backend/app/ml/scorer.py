"""
Composite Anomaly & Risk Scorer for Blockchain Forensic Nodes.
Aggregates multi-signal graph heuristics, peeling metrics, and mixer telemetry
into a standardized risk rating (0.0 - 1.0) suitable for law enforcement triage.
"""

from typing import List, Dict, Any, Optional
from app.ml.mixer_directory import identify_mixer_entity
from app.ml.peeling import analyze_peeling_chain, detect_structuring_smurfing

def calculate_node_risk(
    address: str,
    node_type: str,
    incoming_transfers: List[Dict[str, Any]],
    outgoing_transfers: List[Dict[str, Any]],
    is_vasp: bool = False
) -> Dict[str, Any]:
    """
    Computes an explainable, multi-factor risk profile for a wallet address:
    - Base risk by node type (Suspect: 0.85, Mule: 0.65, VASP: 0.10)
    - Mixer / Privacy Protocol penalty (+0.95 or instant CRITICAL)
    - Peeling chain behavior penalty (+0.35)
    - Structuring / Smurfing penalty (+0.25)
    - High-velocity / fan-out adjustments
    """
    flags: List[str] = []
    
    # 1. Mixer Check
    mixer_info = identify_mixer_entity(address)
    if mixer_info:
        flags.append(f"KNOWN_MIXER_ENTITY:{mixer_info['protocol']}")
        return {
            "risk_score": 0.99,
            "risk_tier": "CRITICAL",
            "is_mixer": True,
            "mixer_details": mixer_info,
            "is_peeling": False,
            "flags": flags,
            "explanation": f"Directly matches OFAC/LEA flagged mixer service: {mixer_info['name']}."
        }

    # If identified legitimate VASP treasury, assign low institutional risk
    if is_vasp or node_type in ["VASP_HOT", "VASP_DEPOSIT"]:
        return {
            "risk_score": 0.08,
            "risk_tier": "LOW",
            "is_mixer": False,
            "mixer_details": None,
            "is_peeling": False,
            "flags": ["IDENTIFIED_EXCHANGE_VAULT"],
            "explanation": "Identified custodial exchange vault or institutional treasury."
        }

    # 2. Base score from forensic position
    if node_type == "SUSPECT":
        base_score = 0.85
        flags.append("REPORTED_FRAUD_SEED")
    elif node_type == "MULE":
        base_score = 0.60
        flags.append("INTERMEDIARY_HOP_MULE")
    else:
        base_score = 0.30

    # 3. Peeling Chain Analysis
    peel_analysis = analyze_peeling_chain(incoming_transfers, outgoing_transfers)
    if peel_analysis["is_peeling_chain"]:
        base_score += 0.25 * peel_analysis["peel_confidence"]
        flags.append(f"ALGORITHMIC_PEELING_CHAIN(ratio={peel_analysis['peel_ratio']:.1%})")

    # 4. Structuring Analysis
    struct_analysis = detect_structuring_smurfing(outgoing_transfers)
    if struct_analysis["is_structuring"]:
        base_score += 0.20
        flags.append(f"TRANSACTION_STRUCTURING({struct_analysis['suspicious_tx_count']}_txs)")

    # 5. Outgoing Volume and Fan-out
    if len(outgoing_transfers) > 10:
        base_score += 0.10
        flags.append("HIGH_FANOUT_DISTRIBUTION")

    # Clamp between 0.05 and 0.98
    final_score = max(0.05, min(0.98, base_score))

    # Determine risk tier
    if final_score >= 0.80:
        tier = "CRITICAL"
    elif final_score >= 0.60:
        tier = "HIGH"
    elif final_score >= 0.35:
        tier = "MEDIUM"
    else:
        tier = "LOW"

    # Construct human-readable explanation
    explanation_parts = []
    if "REPORTED_FRAUD_SEED" in flags:
        explanation_parts.append("Reported victim deposit origin.")
    if peel_analysis["is_peeling_chain"]:
        explanation_parts.append(f"Exhibits automated peeling with ${peel_analysis['peeled_amount_usd']:,.2f} shaved.")
    if struct_analysis["is_structuring"]:
        explanation_parts.append(f"Detected {struct_analysis['suspicious_tx_count']} sub-$10k structured transfers.")
    if not explanation_parts:
        explanation_parts.append("Intermediary transfer node with standard routing patterns.")

    return {
        "risk_score": round(final_score, 2),
        "risk_tier": tier,
        "is_mixer": False,
        "mixer_details": None,
        "is_peeling": peel_analysis["is_peeling_chain"],
        "peeling_metrics": peel_analysis,
        "flags": flags,
        "explanation": " ".join(explanation_parts)
    }
