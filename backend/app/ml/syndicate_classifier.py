
"""
Behavioural Typology Classifier for Blockchain Forensic Analysis.

Identifies observable transaction patterns for investigative triage.

IMPORTANT:
- These are heuristic classifications, not proof of criminal activity.
- A behavioural pattern cannot establish the identity or intent of a wallet owner.
- No statutory violation or sanctions designation is determined here.
"""

from typing import Any, Dict


TYPOLOGY_DEFINITIONS = {
    "MIXER_DIRECTORY_MATCH": {
        "name": "Configured Mixer Directory Match",
        "description": (
            "The address matches an entry in the configured mixer directory. "
            "Directory ownership, deployment and sanctions status require "
            "independent verification."
        ),
    },
    "POSSIBLE_TRON_PEELING": {
        "name": "Possible TRON Peeling Pattern",
        "description": (
            "Transaction distribution exhibits a possible peeling pattern "
            "on a TRON-compatible chain. This does not establish a particular "
            "fraud scheme."
        ),
    },
    "POSSIBLE_PEELING": {
        "name": "Possible Peeling Pattern",
        "description": (
            "Transaction distribution exhibits a possible peeling pattern. "
            "Further transaction and entity-level analysis is required."
        ),
    },
    "POSSIBLE_STRUCTURING": {
        "name": "Possible Structuring-like Pattern",
        "description": (
            "Outgoing transactions exhibit a structuring-like distribution. "
            "Threshold-based heuristics alone do not establish intent or "
            "a reporting violation."
        ),
    },
    "RAPID_FORWARDING": {
        "name": "Rapid Forwarding Pattern",
        "description": (
            "The wallet exhibits a short transaction dwell time consistent "
            "with rapid forwarding behaviour."
        ),
    },
    "INSUFFICIENT_EVIDENCE": {
        "name": "Insufficient Behavioural Evidence",
        "description": (
            "The supplied indicators do not establish a sufficiently "
            "specific behavioural pattern."
        ),
    },
}


def classify_syndicate_typology(
    chain: str,
    is_mixer: bool,
    is_peeling: bool,
    is_structuring: bool,
    is_rapid_forwarder: bool,
    dwell_time_seconds: Any,
    destination_found: bool,
    target_vasp_name: Any = None,
) -> Dict[str, Any]:
    """
    Classify observable transaction behaviour.

    The result is a heuristic investigative indicator, not a finding
    of criminal conduct.
    """

    normalized_chain = (chain or "").upper()

    if is_mixer:
        typology_code = "MIXER_DIRECTORY_MATCH"

    elif is_structuring:
        typology_code = "POSSIBLE_STRUCTURING"

    elif is_peeling and (
        "TRON" in normalized_chain or "TRC" in normalized_chain
    ):
        typology_code = "POSSIBLE_TRON_PEELING"

    elif is_peeling:
        typology_code = "POSSIBLE_PEELING"

    elif is_rapid_forwarder:
        typology_code = "RAPID_FORWARDING"

    else:
        typology_code = "INSUFFICIENT_EVIDENCE"

    details = TYPOLOGY_DEFINITIONS[typology_code]

    # Describe supporting context without treating it as proof.
    context = []

    if dwell_time_seconds is not None and is_rapid_forwarder:
        context.append(
            f"Observed dwell time: {dwell_time_seconds} seconds."
        )

    if destination_found:
        context.append(
            "A destination match was reported by the upstream analysis."
        )

    if target_vasp_name:
        context.append(
            f"Associated destination VASP metadata: {target_vasp_name}."
        )

    description = details["description"]

    if context:
        description += " " + " ".join(context)

    return {
        "typology_code": typology_code,
        "typology_name": details["name"],
        "confidence": None,
        "confidence_note": (
            "No calibrated statistical confidence is available. "
            "This classification is based on heuristic indicators."
        ),
        "description": description,
        "statutory_violation": None,
        "legal_note": (
            "No legal violation is determined by this classifier. "
            "Any statutory assessment requires independent legal review."
        ),
    }