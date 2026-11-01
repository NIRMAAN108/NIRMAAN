
"""
Composite Anomaly & Risk Scorer for Blockchain Forensic Nodes.

Combines graph, peeling, mixer-directory, transaction-velocity and
structuring heuristics into an explainable triage score.

IMPORTANT:
- Scores are heuristic indicators, not calibrated probabilities.
- Directory matches do not establish ownership or sanctions status.
- Behavioural patterns do not establish criminal activity.
"""

from typing import List, Dict, Any

from app.ml.mixer_directory import identify_mixer_entity
from app.ml.peeling import (
    analyze_peeling_chain,
    detect_structuring_smurfing,
)
from app.ml.graph_clustering import (
    calculate_dispersion_entropy,
    compute_transfer_velocity,
)
from app.ml.syndicate_classifier import classify_syndicate_typology


def calculate_node_risk(
    address: str,
    node_type: str,
    incoming_transfers: List[Dict[str, Any]],
    outgoing_transfers: List[Dict[str, Any]],
    is_vasp: bool = False,
    chain: str = "TRON (TRC-20)",
) -> Dict[str, Any]:
    """
    Calculate a heuristic risk profile for a blockchain address.

    Returns a risk score, tier, behavioural flags, feature vector,
    and supporting analysis.

    The score is for investigative triage only.
    """

    flags: List[str] = []

    # 1. Mixer-directory lookup.
    mixer_info = identify_mixer_entity(address, chain)

    # 2. Analyse transaction behaviour regardless of node type.
    peel_analysis = analyze_peeling_chain(
        incoming_transfers,
        outgoing_transfers,
    )

    struct_analysis = detect_structuring_smurfing(
        outgoing_transfers,
    )

    velocity_info = compute_transfer_velocity(
        incoming_transfers,
        outgoing_transfers,
    )

    dispersion_entropy = calculate_dispersion_entropy(
        outgoing_transfers,
    )

    is_peeling = peel_analysis["is_peeling_chain"]
    is_structuring = struct_analysis["is_structuring"]
    is_rapid_forwarder = velocity_info["is_rapid_forwarder"]

    # 3. Base score from node classification.
    if node_type == "SUSPECT":
        base_score = 0.85
        flags.append("REPORTED_FRAUD_SEED")

    elif node_type == "MULE":
        base_score = 0.60
        flags.append("INTERMEDIARY_HOP")

    elif is_vasp or node_type in ["VASP_HOT", "VASP_DEPOSIT"]:
        base_score = 0.08

    else:
        base_score = 0.30

    # 4. VASP identification is contextual, not an automatic risk override.
    is_exchange_node = (
        is_vasp or node_type in ["VASP_HOT", "VASP_DEPOSIT"]
    )

    if is_exchange_node:
        flags.append("IDENTIFIED_EXCHANGE_VAULT")
        flags.append("IDENTIFIED_VASP_CONTEXT")

    # 5. Mixer-directory match.
    # Do not describe an unverified directory match as a confirmed
    # sanctions designation.
    if mixer_info:
        flags.append(
            f"CONFIGURED_MIXER_DIRECTORY_MATCH:{mixer_info.get('protocol', 'UNKNOWN')}"
        )
        base_score += 0.35

    # 6. Peeling behaviour.
    if is_peeling:
        peel_confidence = float(
            peel_analysis.get("peel_confidence", 0.0)
        )
        base_score += 0.25 * peel_confidence

        flags.append(
            f"POSSIBLE_PEELING_PATTERN(ratio={peel_analysis['peel_ratio']:.1%})"
        )

    # 7. Structuring-like behaviour.
    if is_structuring:
        suspicious_count = struct_analysis["suspicious_tx_count"]
        base_score += 0.20

        flags.append(
            f"POSSIBLE_STRUCTURING_PATTERN({suspicious_count}_transfers)"
        )

    # 8. Rapid forwarding.
    if is_rapid_forwarder:
        base_score += 0.12

        dwell_seconds = velocity_info["dwell_time_seconds"] or 0

        flags.append(
            f"RAPID_FORWARDING_PATTERN(dwell={dwell_seconds}s)"
        )

    # 9. High fan-out.
    if len(outgoing_transfers) > 10:
        base_score += 0.10
        flags.append("HIGH_OUTGOING_FANOUT")

    # 10. Calculate final score.
    final_score = max(0.05, min(0.98, base_score))

    if final_score >= 0.80:
        tier = "CRITICAL"
    elif final_score >= 0.60:
        tier = "HIGH"
    elif final_score >= 0.35:
        tier = "MEDIUM"
    else:
        tier = "LOW"

    # 11. Syndicate/behavioural typology classification.
    typology = classify_syndicate_typology(
        chain=chain,
        is_mixer=bool(mixer_info),
        is_peeling=is_peeling,
        is_structuring=is_structuring,
        is_rapid_forwarder=is_rapid_forwarder,
        dwell_time_seconds=velocity_info["dwell_time_seconds"],
        destination_found=False,
    )

    # 12. Eight-dimensional heuristic feature vector.
    feature_vector = [
        round(float(len(incoming_transfers)), 2),
        round(float(len(outgoing_transfers)), 2),
        round(float(is_rapid_forwarder), 2),
        round(float(peel_analysis["peel_ratio"]), 3),
        round(float(struct_analysis["suspicious_tx_count"]), 2),
        round(float(dispersion_entropy), 3),
        round(float(bool(mixer_info)), 2),
        round(float(is_exchange_node), 2),
    ]

    # 13. Human-readable explanation.
    explanation_parts = []

    if node_type == "SUSPECT":
        explanation_parts.append(
            "Address is marked as a reported fraud seed."
        )

    if mixer_info:
        explanation_parts.append(
            f"Address matches configured mixer-directory entry "
            f"{mixer_info.get('name', 'UNKNOWN')}. "
            "Ownership and sanctions status are unverified."
        )

    if is_exchange_node:
        explanation_parts.append(
            "Address is identified as a VASP-context node; "
            "this classification does not establish legitimacy."
        )

    if is_peeling:
        explanation_parts.append(
            "Transaction distribution exhibits a possible peeling pattern."
        )

    if is_structuring:
        explanation_parts.append(
            "Outgoing transfers exhibit a possible structuring-like pattern."
        )

    if is_rapid_forwarder:
        explanation_parts.append(
            f"Short transfer dwell time observed: "
            f"{velocity_info['dwell_time_seconds']} seconds."
        )

    if len(outgoing_transfers) > 10:
        explanation_parts.append(
            "High outgoing transaction fan-out observed."
        )

    if not explanation_parts:
        explanation_parts.append(
            "No configured high-risk behavioural indicators were detected."
        )

    return {
        "risk_score": round(final_score, 2),
        "risk_tier": tier,
        "is_mixer": bool(mixer_info),
        "mixer_details": mixer_info,
        "is_peeling": is_peeling,
        "peeling_details": peel_analysis,
        "structuring_details": struct_analysis,
        "velocity_details": velocity_info,
        "typology": typology,
        "feature_vector": feature_vector,
        "flags": flags,
        "explanation": " ".join(explanation_parts),
    }