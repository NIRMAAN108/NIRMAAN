"""
Composite Anomaly & Risk Scorer for Blockchain Forensic Nodes.
Aggregates multi-signal graph heuristics, peeling metrics, mixer telemetry,
and transaction velocity into a standardized risk rating (0.0 - 1.0) suitable for law enforcement triage.
"""

from typing import List, Dict, Any, Optional
from app.ml.mixer_directory import identify_mixer_entity
from app.ml.peeling import analyze_peeling_chain, detect_structuring_smurfing
from app.ml.graph_clustering import (
    calculate_dispersion_entropy,
    compute_transfer_velocity,
    build_nx_graph,
    calculate_graph_centrality
)
from app.ml.syndicate_classifier import classify_syndicate_typology

def calculate_node_risk(
    address: str,
    node_type: str,
    incoming_transfers: List[Dict[str, Any]],
    outgoing_transfers: List[Dict[str, Any]],
    is_vasp: bool = False,
    chain: str = "TRON (TRC-20)"
) -> Dict[str, Any]:
    """
    Computes an explainable, multi-factor risk profile and ML feature vector for a wallet address:
    - Base risk by node type (Suspect: 0.85, Mule: 0.65, VASP: 0.08)
    - Mixer / Privacy Protocol penalty (+0.95 or instant CRITICAL)
    - Peeling chain behavior penalty (+0.25)
    - Structuring / Smurfing penalty (+0.20)
    - Transfer velocity / dwell time penalty (+0.15)
    - High-velocity / fan-out adjustments
    - Generates 8-dimensional ML feature vector and syndicate typology classification
    """
    flags: List[str] = []
    
    # 1. Mixer Check
    mixer_info = identify_mixer_entity(address)
    if mixer_info:
        flags.append(f"KNOWN_MIXER_ENTITY:{mixer_info['protocol']}")
        typology = classify_syndicate_typology(
            chain=chain,
            is_mixer=True,
            is_peeling=False,
            is_structuring=False,
            is_rapid_forwarder=True,
            dwell_time_seconds=0,
            destination_found=False
        )
        return {
            "risk_score": 0.99,
            "risk_tier": "CRITICAL",
            "is_mixer": True,
            "mixer_details": mixer_info,
            "is_peeling": False,
            "flags": flags,
            "feature_vector": [1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0],
            "typology": typology,
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
            "feature_vector": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0],
            "typology": None,
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

    # 5. Velocity & Dwell Time Analysis
    velocity_info = compute_transfer_velocity(incoming_transfers, outgoing_transfers)
    if velocity_info["is_rapid_forwarder"]:
        base_score += 0.12
        dwell_s = velocity_info["dwell_time_seconds"] or 0
        flags.append(f"RAPID_FORWARDING_BOT(dwell={dwell_s}s)")

    # 6. Outgoing Volume and Fan-out Entropy
    dispersion_entropy = calculate_dispersion_entropy(outgoing_transfers)
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

    # Modus Operandi Typology Classification
    typology = classify_syndicate_typology(
        chain=chain,
        is_mixer=False,
        is_peeling=peel_analysis["is_peeling_chain"],
        is_structuring=struct_analysis["is_structuring"],
        is_rapid_forwarder=velocity_info["is_rapid_forwarder"],
        dwell_time_seconds=velocity_info["dwell_time_seconds"],
        destination_found=False
    )

    # 8-dimensional ML Feature Vector
    feature_vector = [
        round(float(len(incoming_transfers)), 2),
        round(float(len(outgoing_transfers)), 2),
        round(float(1.0 if velocity_info['is_rapid_forwarder'] else 0.0), 2),
        round(float(peel_analysis['peel_ratio']), 3),
        round(float(struct_analysis['suspicious_tx_count']), 2),
        round(float(dispersion_entropy), 3),
        0.0, # mixer proximity
        0.0  # exchange custody
    ]

    # Construct human-readable explanation
    explanation_parts = []
    if "REPORTED_FRAUD_SEED" in flags:
        explanation_parts.append("Reported victim deposit origin.")
    if peel_analysis["is_peeling_chain"]:
        explanation_parts.append(f"Exhibits automated peeling with ${peel_analysis['peeled_amount_usd']:,.2f} shaved.")
    if struct_analysis["is_structuring"]:
        explanation_parts.append(f"Structured smurfing detected across {struct_analysis['suspicious_tx_count']} transfers.")
    if velocity_info["is_rapid_forwarder"]:
        explanation_parts.append(f"Automated forwarding execution in {velocity_info['dwell_time_seconds']} seconds.")
    if not explanation_parts:
        explanation_parts.append("Intermediary transfer node with standard routing patterns.")

    return {
        "risk_score": round(final_score, 2),
        "risk_tier": tier,
        "is_mixer": False,
        "mixer_details": None,
        "is_peeling": peel_analysis["is_peeling_chain"],
        "peeling_details": peel_analysis,
        "velocity_details": velocity_info,
        "typology": typology,
        "feature_vector": feature_vector,
        "flags": flags,
        "explanation": " ".join(explanation_parts)
    }
