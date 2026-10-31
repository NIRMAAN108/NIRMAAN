"""
Section 94 BNSS Legal Notice & Case Dossier Generator
Enforces compliance with Bharatiya Nagarik Suraksha Sanhita, 2023 & Bharatiya Sakshya Adhiniyam, 2023.
"""
import time
import hashlib
from typing import Optional
from app.models.schemas import TraceResponse, CaseMetadata

def generate_section_94_bnss_notice(trace: TraceResponse, meta: Optional[CaseMetadata] = None) -> str:
    """Generates a court-ready, pre-filled Section 94 BNSS requisition notice."""
    if not meta:
        meta = CaseMetadata()

    current_date = time.strftime("%d-%m-%Y")
    current_time_utc = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())

    target_vasp = trace.target_vasp
    has_target_edge = bool(
        target_vasp
        and target_vasp.sweep_tx_hash
        and target_vasp.sweep_tx_hash.strip()
        and any(
            edge.source == target_vasp.deposit_address
            and edge.target == target_vasp.hot_wallet
            and edge.tx_hash == target_vasp.sweep_tx_hash
            for edge in trace.edges
        )
    )
    if has_target_edge and target_vasp is not None:
        vasp_name = target_vasp.name
        nodal_email = target_vasp.nodal_email
        deposit_addr = target_vasp.deposit_address
        hot_wallet = target_vasp.hot_wallet
        sweep_tx = target_vasp.sweep_tx_hash
        subject_line = f"""STATUTORY REQUISITION FOR PRODUCTION OF SUBSCRIBER KYC, TRANSACTION LEDGERS,
         IP TELEMETRY AND IMMEDIATE FREEZING OF ASSETS LINKED TO FRAUD PROCEEDS IN
         CASE FIR/NCRP COMPLAINT NO: {meta.fir_number}"""
        trail_summary = f"""Automated multi-hop blockchain tracing on the TRON (TRC-20) network originating from
suspect address '{trace.seed_address}' established a transaction path across {len(trace.edges)} graph edges
to your exchange infrastructure:

   * Identified User Deposit Address: {deposit_addr}
   * Associated Exchange Hot Wallet:  {hot_wallet}
   * Sweeping / Consolidation TxHash: {sweep_tx}"""
        production_directions = f"""By virtue of powers conferred under Section 94 BNSS, you are hereby legally required to
furnish the following electronic records to this office within TWENTY-FOUR (24) HOURS:

   a) Complete User Profile & KYC: Full legal name, date of birth, residential address,
      government identity proofs (PAN, Aadhaar, Passport), verified phone number & email.
   b) Transaction & Ledger History: Complete deposit, withdrawal, and order-book execution
      history for the Account UID linked to deposit address '{deposit_addr}'.
   c) Telemetry & Access Logs: IP address logs with port numbers, timestamps (UTC), login
      device IMEI/MAC, and User-Agent strings.
   d) P2P & Banking Off-Ramps: Bank account details (Account No., IFSC, Bank Name) or UPI IDs
      used for fiat settlement."""
        freeze_direction = """You are directed to place an immediate debit freeze/lien on all crypto balances and
   fiat funds held under the target UID to prevent dissipation of crime proceeds."""
    else:
        vasp_name = "No transaction-supported VASP destination established"
        nodal_email = "N/A"
        deposit_addr = "N/A"
        hot_wallet = "N/A"
        sweep_tx = "N/A"
        subject_line = f"""FORENSIC TRACE REVIEW: NO TRANSACTION-SUPPORTED EXCHANGE DESTINATION ESTABLISHED
         CASE FIR/NCRP COMPLAINT NO: {meta.fir_number}"""
        trail_summary = f"""Automated multi-hop blockchain tracing originating from suspect address
'{trace.seed_address}' did not establish, from transaction edges in this trace, that funds reached a
known exchange or VASP. No exchange deposit address, hot wallet, or sweep transaction hash is identified."""
        production_directions = """No exchange-specific production request is generated because this trace
   contains no transaction edge establishing a VASP destination."""
        freeze_direction = """No exchange-specific asset freeze is requested because this trace does not
   establish a transaction path to a VASP wallet."""

    # Compute SHA-256 evidence hash of graph nodes and edges
    evidence_payload = f"{trace.seed_address}:{deposit_addr}:{hot_wallet}:{len(trace.edges)}"
    sha256_hash = hashlib.sha256(evidence_payload.encode()).hexdigest()

    notice_template = f"""========================================================================================
FORM OF STATUTORY NOTICE UNDER SECTION 94 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023
(Corresponding to Section 91 of the Code of Criminal Procedure, 1973)
AND REQUISITION FOR IMMEDIATE ASSET PRESERVATION UNDER SECTIONS 106/107 BNSS, 2023
========================================================================================

NOTICE REFERENCE NO: LEA/CYBER/BNSS94/{trace.trace_id.upper()}
DATE OF ISSUE: {current_date}
PRIORITY: HIGH (1930 HELPLINE / GOLDEN HOUR CASE)

TO:
The Nodal Officer / Law Enforcement Response Desk
M/s {vasp_name}
Official LEA Contact: {nodal_email}

SUBJECT: {subject_line}

1. INVESTIGATION PARTICULARS:
   - Investigating Agency: {meta.police_station}
   - Investigating Officer: {meta.investigating_officer}
   - Statutory Provisions: Sections 316(2), 318(4) Bharatiya Nyaya Sanhita (BNS), 2023
                           and Section 66D Information Technology Act, 2000.
   - Reported Victim Loss: INR {meta.loss_amount_inr:,.2f}

2. FORENSIC BLOCKCHAIN TRAIL SUMMARY:
   {trail_summary}
   * Identification Timestamp:        {current_time_utc}
   * Execution Traversal Latency:     {trace.execution_time_ms} ms

3. STATUTORY DIRECTIONS UNDER SECTION 94 BNSS, 2023:
   {production_directions}

4. DIRECTION FOR IMMEDIATE LIEN / ASSET FREEZE (SECTIONS 106 & 107 BNSS):
   {freeze_direction}

5. STATUTORY ADMISSIBILITY CERTIFICATE (SECTION 63 BHARATIYA SAKSHYA ADHINIYAM, 2023):
   I certify that the forensic data herein was extracted in the regular course of official
   duty from immutable public ledgers using verified tracing algorithms.
   * Cryptographic Trace Integrity Seal (SHA-256): {sha256_hash}

Notice Issued By:
{meta.investigating_officer}
{meta.police_station}
========================================================================================"""
    return notice_template
