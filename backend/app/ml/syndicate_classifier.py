"""
Syndicate Typology & Modus Operandi (MO) Forensic Classifier.
Classifies on-chain behavioral signatures into established Indian & Global cybercrime patterns.
"""

from typing import List, Dict, Any

TYPOLOGY_DEFINITIONS = {
    "TELEGRAM_TASK_FRAUD": {
        "name": "Southeast Asian Telegram Task Scam / Part-Time Job Fraud",
        "description": "Victim lured into Telegram task group, instructed to send TRON USDT deposits. Automated multi-hop mule layering with fixed 1-5% peeling cuts followed by instant CEX consolidation.",
        "statutory_violation": "Section 318(4) BNS, 2023 & Section 66D IT Act, 2000"
    },
    "PIG_BUTCHERING_SHA_ZHU_PAN": {
        "name": "Pig Butchering / Investment Romance Scam (Sha Zhu Pan)",
        "description": "Gradual capital accumulation on deceptive trading platforms, followed by complete liquidity draining to exchange user deposit forwarders.",
        "statutory_violation": "Section 316(2), 318(4) BNS, 2023"
    },
    "MIXER_OBSCURATION": {
        "name": "Sanctioned Privacy Mixer Obscuration / Asset Concealment",
        "description": "Funds routed through non-custodial cryptographic pools (Tornado Cash, Sinbad, Blender) or cross-chain bridge services to sever audit trail.",
        "statutory_violation": "Section 3 PMLA, 2002 (Money Laundering) & Section 94 BNSS, 2023"
    },
    "P2P_SMURFING_RING": {
        "name": "Coordinated P2P Smurfing & Layering Ring",
        "description": "Transactions split into amounts under reporting thresholds ($9,000-$9,950 or ₹50,000) across multiple synthetic identity mule wallets.",
        "statutory_violation": "Section 12 PMLA, 2002 & Section 106 BNSS, 2023"
    },
    "STANDARD_RAPID_MULE": {
        "name": "Automated Intermediary Hop Layering",
        "description": "High-velocity pass-through mule wallet with short dwell time designed to add synthetic hops before exchange liquidation.",
        "statutory_violation": "Section 318(4) BNS, 2023"
    }
}

def classify_syndicate_typology(
    chain: str,
    is_mixer: bool,
    is_peeling: bool,
    is_structuring: bool,
    is_rapid_forwarder: bool,
    dwell_time_seconds: Any,
    destination_found: bool,
    target_vasp_name: Any = None
) -> Dict[str, Any]:
    """
    Classifies the dominant laundering modus operandi based on multi-signal indicators.
    """
    if is_mixer:
        typ = "MIXER_OBSCURATION"
        confidence = 0.96
    elif is_peeling and ("TRON" in (chain or "").upper() or "TRC" in (chain or "").upper()):
        typ = "TELEGRAM_TASK_FRAUD"
        confidence = 0.94
    elif is_structuring:
        typ = "P2P_SMURFING_RING"
        confidence = 0.88
    elif is_rapid_forwarder and destination_found:
        typ = "STANDARD_RAPID_MULE"
        confidence = 0.85
    elif is_peeling:
        typ = "PIG_BUTCHERING_SHA_ZHU_PAN"
        confidence = 0.82
    else:
        typ = "STANDARD_RAPID_MULE"
        confidence = 0.70

    details = TYPOLOGY_DEFINITIONS.get(typ, TYPOLOGY_DEFINITIONS["STANDARD_RAPID_MULE"])

    return {
        "typology_code": typ,
        "typology_name": details["name"],
        "confidence": confidence,
        "description": details["description"],
        "statutory_violation": details["statutory_violation"]
    }
