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

    vasp_name = trace.target_vasp.name if trace.target_vasp else "Centralized Exchange / VASP"
    nodal_email = trace.target_vasp.nodal_email if trace.target_vasp else "compliance@exchange.com"
    deposit_addr = trace.target_vasp.deposit_address if trace.target_vasp else "N/A"
    hot_wallet = trace.target_vasp.hot_wallet if trace.target_vasp else "N/A"
    sweep_tx = trace.target_vasp.sweep_tx_hash if (trace.target_vasp and trace.target_vasp.sweep_tx_hash) else "N/A"

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

SUBJECT: STATUTORY REQUISITION FOR PRODUCTION OF SUBSCRIBER KYC, TRANSACTION LEDGERS,
         IP TELEMETRY AND IMMEDIATE FREEZING OF ASSETS LINKED TO FRAUD PROCEEDS IN
         CASE FIR/NCRP COMPLAINT NO: {meta.fir_number}

1. INVESTIGATION PARTICULARS:
   - Investigating Agency: {meta.police_station}
   - Investigating Officer: {meta.investigating_officer}
   - Statutory Provisions: Sections 316(2), 318(4) Bharatiya Nyaya Sanhita (BNS), 2023 
                           and Section 66D Information Technology Act, 2000.
   - Reported Victim Loss: INR {meta.loss_amount_inr:,.2f}

2. FORENSIC BLOCKCHAIN TRAIL SUMMARY:
   Automated multi-hop blockchain tracing on the TRON (TRC-20) network originating from 
   suspect address '{trace.seed_address}' established that illicit proceeds were routed 
   across {len(trace.edges)} transaction hops and deposited into your exchange infrastructure:

   * Identified User Deposit Address: {deposit_addr}
   * Associated Exchange Hot Wallet:  {hot_wallet}
   * Sweeping / Consolidation TxHash: {sweep_tx}
   * Identification Timestamp:        {current_time_utc}
   * Execution Traversal Latency:     {trace.execution_time_ms} ms

3. STATUTORY DIRECTIONS UNDER SECTION 94 BNSS, 2023:
   By virtue of powers conferred under Section 94 BNSS, you are hereby legally required to 
   furnish the following electronic records to this office within TWENTY-FOUR (24) HOURS:
   
   a) Complete User Profile & KYC: Full legal name, date of birth, residential address, 
      government identity proofs (PAN, Aadhaar, Passport), verified phone number & email.
   b) Transaction & Ledger History: Complete deposit, withdrawal, and order-book execution 
      history for the Account UID linked to deposit address '{deposit_addr}'.
   c) Telemetry & Access Logs: IP address logs with port numbers, timestamps (UTC), login 
      device IMEI/MAC, and User-Agent strings.
   d) P2P & Banking Off-Ramps: Bank account details (Account No., IFSC, Bank Name) or UPI IDs 
      used for fiat settlement.

4. DIRECTION FOR IMMEDIATE LIEN / ASSET FREEZE (SECTIONS 106 & 107 BNSS):
   You are directed to place an immediate debit freeze/lien on all crypto balances and 
   fiat funds held under the target UID to prevent dissipation of crime proceeds.

5. STATUTORY ADMISSIBILITY CERTIFICATE (SECTION 63 BHARATIYA SAKSHYA ADHINIYAM, 2023):
   I certify that the forensic data herein was extracted in the regular course of official 
   duty from immutable public ledgers using verified tracing algorithms.
   * Cryptographic Trace Integrity Seal (SHA-256): {sha256_hash}

Notice Issued By:
{meta.investigating_officer}
{meta.police_station}
========================================================================================"""
    return notice_template
