"""
FIU-IND Suspicious Transaction Report (STR) Generator.
Compliant with the Prevention of Money Laundering Act (PMLA), 2002
and FIU-IND FINnet 2.0 XML/JSON Reporting Standards for Virtual Digital Assets (VDAs).
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List

def generate_fiu_ind_str(case_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a structured Suspicious Transaction Report (STR) payload
    suitable for immediate submission to the Financial Intelligence Unit - India (FIU-IND).
    """
    str_ref = f"STR-FIU-IND-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    trace_data = case_data.get("trace_data", {})
    target_vasp = trace_data.get("target_vasp") or {}

    nodes = trace_data.get("nodes", [])
    edges = trace_data.get("edges", [])

    # Identify indicators of suspicion
    indicators: List[str] = [
        "VDA_SUSPICIOUS_TRANSFER_RAPID_LAYERING",
        "VDA_PROCEEDS_OF_CYBER_FRAUD"
    ]
    if any(n.get("is_peeling") for n in nodes):
        indicators.append("VDA_ALGORITHMIC_PEELING_CHAIN_DETECTED")
    if any(n.get("is_mixer") for n in nodes):
        indicators.append("VDA_SANCTIONED_MIXER_OR_PRIVACY_POOL_INTERACTION")
    if target_vasp.get("name"):
        indicators.append(f"VDA_DEPOSIT_SWEEP_TO_RE_{target_vasp.get('name').upper()}")

    # Format FINnet 2.0 schema structure
    str_payload = {
        "report_header": {
            "str_reference_number": str_ref,
            "report_type": "SUSPICIOUS_TRANSACTION_REPORT_VDA",
            "statutory_act": "Prevention of Money Laundering Act (PMLA), 2002",
            "regulatory_body": "Financial Intelligence Unit - India (FIU-IND)",
            "reporting_channel": "FINnet 2.0 Electronic Gateway",
            "submission_timestamp": now_iso
        },
        "investigation_reference": {
            "fir_number": case_data.get("fir_number", "N/A"),
            "police_station": case_data.get("police_station", "State Cyber Cell"),
            "investigating_officer": case_data.get("investigating_officer", "Inspector Cyber Cell"),
            "victim_loss_inr": case_data.get("loss_amount_inr", 0.0),
            "cryptographic_evidence_sha256": case_data.get("evidence_sha256", "N/A")
        },
        "suspect_vda_profile": {
            "origin_seed_wallet": case_data.get("seed_address", "N/A"),
            "blockchain_network": case_data.get("chain", "TRON (TRC-20)"),
            "total_value_routed_usd": case_data.get("total_routed_usd", 0.0),
            "total_hops_traversed": len(edges),
            "total_entities_identified": len(nodes)
        },
        "target_reporting_entity": {
            "entity_name": target_vasp.get("name", "Unknown / Offshore"),
            "fiu_registered_status": target_vasp.get("fiu_registered", False),
            "target_deposit_wallet": target_vasp.get("deposit_address", "N/A"),
            "master_hot_wallet": target_vasp.get("hot_wallet", "N/A"),
            "sweep_tx_hash": target_vasp.get("sweep_tx_hash", "N/A"),
            "nodal_compliance_email": target_vasp.get("nodal_email", "N/A")
        },
        "aml_suspicion_indicators": indicators,
        "narrative_grounds_for_suspicion": (
            f"Automated graph analytics into cybercrime complaint {case_data.get('fir_number')} "
            f"established that proceeds of crime totaling ${case_data.get('total_routed_usd', 0.0):,.2f} USD "
            f"were fraudulently acquired from complainant {case_data.get('complainant_name', 'Complainant')} "
            f"and transferred from seed address {case_data.get('seed_address')}. Funds were actively layered "
            f"across {len(nodes)} addresses before undergoing automated deposit sweep consolidation into custodial "
            f"wallets operated by {target_vasp.get('name', 'the exchange')}. Immediate freezing and preservation "
            f"under Sections 106/107 BNSS, 2023 and Section 66D IT Act is requested, with AML/CFT referral transmitted "
            f"under PMLA guidelines to FIU-IND for statutory intelligence dissemination."
        )
    }
    return str_payload
