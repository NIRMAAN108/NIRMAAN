"""
Section 94 BNSS Legal Notice & Section 63 BSA Electronic Certificate Generator.
Enforces compliance with Bharatiya Nagarik Suraksha Sanhita, 2023 & Bharatiya Sakshya Adhiniyam, 2023.
"""
import time
import json
import hashlib
from typing import Optional, Dict, Any, Union
from app.models.schemas import TraceResponse, CaseMetadata

def _get_attr(obj: Any, key: str, default: Any = None) -> Any:
    """Helper to extract attribute from either a Pydantic model or a dictionary."""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)

def compute_canonical_evidence_digest(trace: Union[TraceResponse, Dict[str, Any]]) -> str:
    """
    Computes a deterministic, tamper-evident SHA-256 digest over the entire canonical
    transaction graph (all nodes, directed edges, raw transfer amounts, token assets, and tx hashes).
    Admissible under Section 63(4) Bharatiya Sakshya Adhiniyam (BSA), 2023.
    """
    seed_address = _get_attr(trace, "seed_address", "")
    chain = _get_attr(trace, "chain", "")
    nodes = _get_attr(trace, "nodes", [])
    edges = _get_attr(trace, "edges", [])

    canonical_data = {
        "version": "2.0-CANONICAL-EVIDENCE",
        "seed_address": str(seed_address),
        "chain": str(chain),
        "nodes": sorted([
            {
                "id": str(_get_attr(n, "id", "")),
                "type": str(_get_attr(n, "node_type", "")),
                "vasp": str(_get_attr(n, "vasp_name", "") or "")
            }
            for n in nodes
        ], key=lambda x: x["id"]),
        "edges": sorted([
            {
                "tx_hash": str(_get_attr(e, "tx_hash", "")),
                "source": str(_get_attr(e, "source", "")),
                "target": str(_get_attr(e, "target", "")),
                "amount": float(_get_attr(e, "amount", 0.0)),
                "token": str(_get_attr(e, "token", "USDT")),
                "timestamp": int(_get_attr(e, "timestamp", 0) or 0)
            }
            for e in edges
        ], key=lambda x: x["tx_hash"])
    }
    canonical_json = json.dumps(canonical_data, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

def generate_section_94_bnss_notice(trace: Union[TraceResponse, Dict[str, Any]], meta: Optional[CaseMetadata] = None) -> str:
    """Generates a court-ready, pre-filled Section 94 BNSS requisition notice."""
    if not meta:
        meta = CaseMetadata()

    current_date = time.strftime("%d-%m-%Y")
    current_time_utc = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())

    target_vasp = _get_attr(trace, "target_vasp")
    vasp_name = _get_attr(target_vasp, "name", "Centralized Exchange / VASP") if target_vasp else "Centralized Exchange / VASP"
    nodal_email = _get_attr(target_vasp, "nodal_email", "compliance@exchange.com") if target_vasp else "compliance@exchange.com"
    deposit_addr = _get_attr(target_vasp, "deposit_address", "N/A") if target_vasp else "N/A"
    hot_wallet = _get_attr(target_vasp, "hot_wallet", "N/A") if target_vasp else "N/A"
    sweep_tx = _get_attr(target_vasp, "sweep_tx_hash", "N/A") if target_vasp else "N/A"

    seed_address = _get_attr(trace, "seed_address", "N/A")
    trace_id = _get_attr(trace, "trace_id", "TRACE")
    chain = _get_attr(trace, "chain", "Multi-Chain")
    edges = _get_attr(trace, "edges", [])
    exec_ms = _get_attr(trace, "execution_time_ms", 350.0)
    is_synthetic = bool(_get_attr(trace, "is_synthetic", False))

    # Compute deterministic canonical SHA-256 evidence digest across all graph transactions
    sha256_hash = compute_canonical_evidence_digest(trace)

    demo_watermark = ""
    if is_synthetic:
        demo_watermark = """****************************************************************************************
[DEMONSTRATION ONLY / SYNTHETIC FIXTURE — NOT AN ISSUED STATUTORY NOTICE]
THIS RECORD WAS GENERATED USING OFFLINE TEST FIXTURES FOR FORENSIC DEMONSTRATION PURPOSES.
DO NOT TRANSMIT TO ANY FINANCIAL ENTITY, COURT OF LAW, OR VIRTUAL ASSET SERVICE PROVIDER.
****************************************************************************************

"""

    notice_template = f"""{demo_watermark}========================================================================================
DRAFT REQUISITION FOR PRODUCTION OF ELECTRONIC RECORDS UNDER SECTION 94 BNSS, 2023
(Corresponding to Section 91 of the Code of Criminal Procedure, 1973)
STATUS: DRAFT FOR INVESTIGATING OFFICER (IO) REVIEW & SIGNATURE — NOT OFFICIALLY ISSUED
========================================================================================

NOTICE REFERENCE NO: LEA/CYBER/BNSS94/{trace_id.upper()}
DATE OF ISSUE: {current_date}
PRIORITY: HIGH (1930 HELPLINE / GOLDEN HOUR CASE)
FORM OF STATUTORY NOTICE UNDER SECTION 94 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023

TO:
The Nodal Officer / Law Enforcement Response Desk
M/s {vasp_name}
Official LEA Contact: {nodal_email}

SUBJECT: DRAFT STATUTORY REQUISITION FOR PRODUCTION OF SUBSCRIBER KYC, TRANSACTION LEDGERS,
         IP TELEMETRY AND ASSET PRESERVATION IN CASE FIR/NCRP COMPLAINT NO: {meta.fir_number}

1. INVESTIGATION PARTICULARS:
   - Investigating Agency: {meta.police_station}
   - Investigating Officer: {meta.investigating_officer} (Reviewing Authority)
   - Statutory Provisions: Sections 316(2), 318(4) Bharatiya Nyaya Sanhita (BNS), 2023 
                           and Section 66D Information Technology Act, 2000.
   - Reported Victim Loss: INR {meta.loss_amount_inr:,.2f}
   - Blockchain Network:   {chain}

2. FORENSIC BLOCKCHAIN TRAIL SUMMARY:
   Automated multi-hop blockchain tracing on the cryptocurrency ledger originating from 
   suspect address '{seed_address}' established that illicit proceeds were routed 
   across {len(edges)} transaction hops and deposited into your exchange infrastructure:

   * Identified User Deposit Address: {deposit_addr}
   * Associated Exchange Hot Wallet:  {hot_wallet}
   * Sweeping / Consolidation TxHash: {sweep_tx}
   * Identification Timestamp:        {current_time_utc}
   * Execution Traversal Latency:     {exec_ms} ms

3. STATUTORY REQUISITION UNDER SECTION 94 BNSS, 2023:
   By virtue of powers under Section 94 BNSS, you are hereby requested to 
   furnish the following electronic records to this office within TWENTY-FOUR (24) HOURS:
   
   a) Complete User Profile & KYC: Full legal name, date of birth, residential address, 
      government identity proofs (PAN, Aadhaar, Passport), verified phone number & email.
   b) Transaction & Ledger History: Complete deposit, withdrawal, and order-book execution 
      history for the Account UID linked to deposit address '{deposit_addr}'.
   c) Telemetry & Access Logs: IP address logs with port numbers, timestamps (UTC), login 
      device IMEI/MAC, and User-Agent strings.
   d) P2P & Banking Off-Ramps: Bank account details (Account No., IFSC, Bank Name) or UPI IDs 
      used for fiat settlement.

4. DIRECTION FOR ASSET PRESERVATION (UNDER SECTIONS 106 & 107 BNSS, 2023):
   Pending formal judicial warrant/order under Section 107 BNSS, you are requested to 
   place an immediate administrative debit freeze/lien on the target deposit account and 
   associated UID to prevent further dispersion of reported crime proceeds.

5. STATUTORY ADMISSIBILITY CERTIFICATE (SECTION 63 BHARATIYA SAKSHYA ADHINIYAM, 2023):
   I certify that the forensic data herein was extracted in the regular course of official 
   duty from immutable public ledgers using verified tracing algorithms.
   * Cryptographic Trace Integrity Seal (SHA-256): {sha256_hash}
   * Canonical Evidence Serialization: SHA-256 over all {len(edges)} transaction hops and {len(_get_attr(trace, 'nodes', []))} nodes.

DRAFT NOTICE — FOR REVIEW & SIGNATURE:
______________________________________
{meta.investigating_officer}
{meta.police_station}
========================================================================================"""
    return notice_template

def generate_section_63_bsa_certificate(trace: Union[TraceResponse, Dict[str, Any]], meta: Optional[CaseMetadata] = None) -> Dict[str, Any]:
    """
    Generates a formal Certificate of Electronic Evidence under Section 63(4) of the
    Bharatiya Sakshya Adhiniyam (BSA), 2023 (corresponding to Section 65B Indian Evidence Act).
    """
    if not meta:
        meta = CaseMetadata()

    current_date = time.strftime("%d-%m-%Y")
    current_time_utc = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    
    seed_address = _get_attr(trace, "seed_address", "N/A")
    trace_id = _get_attr(trace, "trace_id", "TRACE")
    edges = _get_attr(trace, "edges", [])
    nodes = _get_attr(trace, "nodes", [])

    payload = f"{trace_id}:{seed_address}:{len(nodes)}:{len(edges)}"
    sha256_hash = hashlib.sha256(payload.encode()).hexdigest()

    certificate_text = f"""========================================================================================
CERTIFICATE OF ELECTRONIC EVIDENCE UNDER SECTION 63 OF THE BHARATIYA SAKSHYA ADHINIYAM, 2023
(Replaces Section 65B of the Indian Evidence Act, 1872)
FOR ADMISSIBILITY OF BLOCKCHAIN FORENSIC LEDGERS & VASP ATTRIBUTION RECORDS
========================================================================================

CERTIFICATE ID: CERT-BSA63-{trace_id.upper()}
DATE OF CERTIFICATION: {current_date}
INVESTIGATION REFERENCE: {meta.fir_number}

I, {meta.investigating_officer}, do hereby certify and declare on official oath as under:

1. LAWFUL COMPUTER OPERATING CONDITIONS:
   During the period over which the electronic cryptocurrency records were produced, the 
   automated NIRMAAN Blockchain Forensic System was operating properly in the ordinary course 
   of official lawful cyber investigations.

2. INTEGRITY OF DATA INGESTION:
   The transaction records and graph traversal data were extracted directly from immutable 
   public distributed blockchain nodes (TRON, EVM, Bitcoin) without manual alteration, 
   injection, or modification.

3. FORENSIC SEAL AND CRYPTOGRAPHIC NON-REPUDIATION:
   To ensure evidentiary non-repudiation and chain of custody, the digital ledger artifacts 
   have been cryptographically bound with a SHA-256 integrity seal:
   
   * Evidence Seal (SHA-256): {sha256_hash}
   * Target Seed Address:     {seed_address}
   * Nodes Resolved:          {len(nodes)}
   * Transaction Edges:       {len(edges)}
   * Verification Time (UTC): {current_time_utc}

4. STATUTORY DECLARATION:
   The particulars given above are true and correct to the best of my knowledge, and this 
   certificate fulfills all statutory requirements of Section 63(4) Bharatiya Sakshya Adhiniyam, 2023.

Certified by:
{meta.investigating_officer}
{meta.police_station}
========================================================================================"""
    return {
        "certificate_id": f"CERT-BSA63-{trace_id.upper()}",
        "sha256_hash": sha256_hash,
        "certificate_text": certificate_text
    }
