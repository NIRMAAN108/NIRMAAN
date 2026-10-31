"""
========================================================================================
NIRMAAN (ChainTrace AI) - Blue Team Forensic Audit & Event Discovery Verification Suite
========================================================================================
Automated Verification against live server at http://127.0.0.1:8000.
Author: Blue Team Forensic Auditor & Compliance Specialist
Mission: End-to-End Operational Flow, Forensic Integrity & Compliance Verification
"""

import sys
import io
import time
import json
import zipfile
import hashlib
import urllib.request
import urllib.error
from typing import Dict, Any, List

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://127.0.0.1:8000"

class ForensicAuditRunner:
    def __init__(self):
        self.results = []
        self.start_time = time.time()

    def record(self, test_id: str, name: str, status: bool, details: Dict[str, Any], notes: str = ""):
        self.results.append({
            "test_id": test_id,
            "name": name,
            "status": "PASS" if status else "FAIL",
            "details": details,
            "notes": notes
        })
        icon = "[PASS]" if status else "[FAIL]"
        print(f"{icon} {test_id}: {name}")
        if not status:
            print(f"       ERROR: {notes}")

    def http_get(self, path: str, timeout: float = 15.0) -> (int, bytes, Dict[str, str]):
        url = f"{BASE_URL}{path}"
        req = urllib.request.Request(url, headers={"User-Agent": "NIRMAAN-Auditor/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            headers = {k.lower(): v for k, v in resp.getheaders()}
            return resp.status, resp.read(), headers

    def http_post(self, path: str, payload: dict, timeout: float = 30.0) -> (int, bytes, Dict[str, str]):
        url = f"{BASE_URL}{path}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={
            "User-Agent": "NIRMAAN-Auditor/1.0",
            "Content-Type": "application/json"
        })
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            headers = {k.lower(): v for k, v in resp.getheaders()}
            return resp.status, resp.read(), headers

    def run_all(self):
        print("=" * 80)
        print("STARTING NIRMAAN BLUE TEAM AUDIT SUITE")
        print(f"Target Endpoint: {BASE_URL}")
        print("=" * 80)

        # -------------------------------------------------------------------------
        # SECTION 1: SYSTEM HEALTH & VASP DIRECTORY INTEGRITY
        # -------------------------------------------------------------------------
        self.audit_health_and_vasps()

        # -------------------------------------------------------------------------
        # SECTION 2: 1930 / NCRP UNSTRUCTURED INGESTION & EXTRACTION
        # -------------------------------------------------------------------------
        self.audit_ncrp_parser()

        # -------------------------------------------------------------------------
        # SECTION 3: ALL 6 PRESET INVESTIGATION FLOWS
        # -------------------------------------------------------------------------
        self.audit_all_preset_flows()

        # -------------------------------------------------------------------------
        # SECTION 4: CASE VAULT, DOSSIER, STR & SEALED EVIDENCE BUNDLE
        # -------------------------------------------------------------------------
        self.audit_case_lifecycle_and_bundle()

        # -------------------------------------------------------------------------
        # SECTION 5: FRONTEND STATIC ASSETS & INTERACTIVE CONTROLLERS
        # -------------------------------------------------------------------------
        self.audit_frontend_assets()

        # -------------------------------------------------------------------------
        # SECTION 6: DEFENSE, RATE-LIMITING & RESILIENCE
        # -------------------------------------------------------------------------
        self.audit_circuit_breaker_resilience()

        self.print_summary()

    def audit_health_and_vasps(self):
        try:
            status, body, _ = self.http_get("/")
            data = json.loads(body.decode("utf-8"))
            passed = (status == 200 and data.get("status") == "online" and data.get("tracked_vasps_count", 0) > 0)
            self.record("SEC-01", "API Health & Online Status Check", passed, {
                "http_status": status,
                "online": data.get("status"),
                "tracked_vasps": data.get("tracked_vasps_count")
            })
        except Exception as e:
            self.record("SEC-01", "API Health & Online Status Check", False, {}, str(e))

        try:
            status, body, _ = self.http_get("/api/vasps")
            data = json.loads(body.decode("utf-8"))
            vasps = data.get("vasps", {})
            required = ["binance", "bybit", "okx", "coindcx", "wazirx"]
            all_present = all(k in vasps for k in required)
            all_emails = all("@" in vasps[k].get("nodal_email", "") for k in required)
            passed = (status == 200 and all_present and all_emails)
            self.record("SEC-02", "VASP Directory Normalization & Integrity", passed, {
                "tracked_exchanges": list(vasps.keys()),
                "required_verified": required
            })
        except Exception as e:
            self.record("SEC-02", "VASP Directory Normalization & Integrity", False, {}, str(e))

    def audit_ncrp_parser(self):
        raw_text = (
            "Complainant Rajesh Kumar reported loss of Rs. 15,00,000 on Telegram task fraud group. "
            "Suspect instructed transfer to TRON wallet TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC. "
            "Transaction reference 0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff. "
            "Case registered under FIR-88/2026 Bhopal Cyber PS."
        )
        try:
            status, body, _ = self.http_post("/api/ncrp/parse", {"text": raw_text})
            data = json.loads(body.decode("utf-8"))
            passed = (
                status == 200 and
                data.get("primary_seed_address") == "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC" and
                data.get("primary_chain") == "tron" and
                data.get("estimated_loss_inr") == 1500000.0 and
                data.get("suggested_fir") == "FIR-88/2026"
            )
            self.record("SEC-03", "1930 / NCRP Automated Text Ingestion", passed, {
                "primary_seed": data.get("primary_seed_address"),
                "primary_chain": data.get("primary_chain"),
                "loss_inr": data.get("estimated_loss_inr"),
                "suggested_fir": data.get("suggested_fir")
            })
        except Exception as e:
            self.record("SEC-03", "1930 / NCRP Automated Text Ingestion", False, {}, str(e))

    def audit_all_preset_flows(self):
        # 1. TRON Demo
        try:
            t0 = time.time()
            status, body, _ = self.http_post("/api/trace", {
                "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
                "max_depth": 4,
                "min_usd_value": 20.0,
                "case_metadata": {
                    "fir_number": "FIR-88/2026 Cyber PS Bhopal",
                    "loss_amount_inr": 1500000.0,
                    "police_station": "State Cyber PS Bhopal",
                    "investigating_officer": "DSP Anjali Verma"
                }
            })
            data = json.loads(body.decode("utf-8"))
            elapsed = round((time.time() - t0) * 1000, 2)
            vasp_match = (data.get("target_vasp") or {}).get("name") == "Binance"
            sec94_valid = "SECTION 94 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA" in data.get("section_94_notice_text", "")
            typology = (data.get("syndicate_typology") or {}).get("typology_code")
            typology_valid = typology in ["STANDARD_RAPID_MULE", "TELEGRAM_TASK_FRAUD"]
            passed = (status == 200 and data.get("destination_found") and vasp_match and sec94_valid and typology_valid)
            self.record("FLOW-01", "Preset 1: TRON Demo (₹15L Telegram Scam)", passed, {
                "latency_ms": elapsed,
                "destination_found": data.get("destination_found"),
                "target_vasp": (data.get("target_vasp") or {}).get("name"),
                "typology": typology,
                "nodes_count": len(data.get("nodes", [])),
                "edges_count": len(data.get("edges", [])),
                "evidence_sha256": data.get("evidence_sha256")
            })
        except Exception as e:
            self.record("FLOW-01", "Preset 1: TRON Demo (₹15L Telegram Scam)", False, {}, str(e))

        # 2. EVM Demo
        try:
            t0 = time.time()
            status, body, _ = self.http_post("/api/trace", {
                "seed_address": "0x95222290DD7853684454F4275E597E3A63725F78",
                "max_depth": 4,
                "min_usd_value": 20.0,
                "case_metadata": {
                    "fir_number": "FIR-104/2026 Cyber PS Bengaluru",
                    "loss_amount_inr": 2500000.0
                }
            })
            data = json.loads(body.decode("utf-8"))
            elapsed = round((time.time() - t0) * 1000, 2)
            vasp_match = (data.get("target_vasp") or {}).get("name") == "Binance"
            passed = (status == 200 and data.get("destination_found") and vasp_match and len(data.get("nodes", [])) >= 4)
            self.record("FLOW-02", "Preset 2: EVM Demo (₹25L CEX Layering)", passed, {
                "latency_ms": elapsed,
                "destination_found": data.get("destination_found"),
                "target_vasp": (data.get("target_vasp") or {}).get("name"),
                "nodes_count": len(data.get("nodes", [])),
                "edges_count": len(data.get("edges", []))
            })
        except Exception as e:
            self.record("FLOW-02", "Preset 2: EVM Demo (₹25L CEX Layering)", False, {}, str(e))

        # 3. BTC Demo
        try:
            t0 = time.time()
            status, body, _ = self.http_post("/api/trace", {
                "seed_address": "bc1qqyqszqgpqyqszqgpqyqszqgpqyqszqgpyfl4f3",
                "max_depth": 4,
                "min_usd_value": 20.0,
                "case_metadata": {
                    "fir_number": "FIR-12/2026 Cyber PS Delhi",
                    "loss_amount_inr": 5000000.0
                }
            })
            data = json.loads(body.decode("utf-8"))
            elapsed = round((time.time() - t0) * 1000, 2)
            vasp_match = (data.get("target_vasp") or {}).get("name") == "Binance"
            passed = (status == 200 and data.get("destination_found") and vasp_match and len(data.get("nodes", [])) >= 4)
            self.record("FLOW-03", "Preset 3: BTC Demo (₹50L Pig Butchering UTXO)", passed, {
                "latency_ms": elapsed,
                "destination_found": data.get("destination_found"),
                "target_vasp": (data.get("target_vasp") or {}).get("name"),
                "nodes_count": len(data.get("nodes", [])),
                "edges_count": len(data.get("edges", []))
            })
        except Exception as e:
            self.record("FLOW-03", "Preset 3: BTC Demo (₹50L Pig Butchering UTXO)", False, {}, str(e))

        # 4. Live Binance 14 Master Hot Vault
        try:
            t0 = time.time()
            status, body, _ = self.http_post("/api/trace", {
                "seed_address": "0x28C6c06298d514Db089934071355E5743bf21d60",
                "max_depth": 2,
                "min_usd_value": 20.0,
                "case_metadata": {
                    "fir_number": "FIR-301/2026 Cyber HQ Mumbai",
                    "loss_amount_inr": 8500000.0
                }
            })
            data = json.loads(body.decode("utf-8"))
            elapsed = round((time.time() - t0) * 1000, 2)
            vasp_match = (data.get("target_vasp") or {}).get("name") == "Binance"
            passed = (status == 200 and data.get("destination_found") and vasp_match)
            self.record("FLOW-04", "Preset 4: Live Binance 14 Hot Vault (EVM)", passed, {
                "latency_ms": elapsed,
                "target_vasp": (data.get("target_vasp") or {}).get("name"),
                "nodal_email": (data.get("target_vasp") or {}).get("nodal_email"),
                "fiu_registered": (data.get("target_vasp") or {}).get("fiu_registered")
            })
        except Exception as e:
            self.record("FLOW-04", "Preset 4: Live Binance 14 Hot Vault (EVM)", False, {}, str(e))

        # 5. Live WazirX $235M Exploiter
        try:
            t0 = time.time()
            status, body, _ = self.http_post("/api/trace", {
                "seed_address": "0x0bfC924618e950882e70e3025255474B5C6eDb27",
                "max_depth": 2,
                "min_usd_value": 20.0,
                "case_metadata": {
                    "fir_number": "FIR-192/2024 Special Cell Delhi",
                    "loss_amount_inr": 19500000000.0
                }
            })
            data = json.loads(body.decode("utf-8"))
            elapsed = round((time.time() - t0) * 1000, 2)
            node0 = data.get("nodes", [{}])[0]
            passed = (status == 200 and node0.get("risk_tier") == "CRITICAL" and data.get("ml_anomaly_score", 0) >= 0.80)
            self.record("FLOW-05", "Preset 5: Live WazirX Exploiter (CRITICAL Risk Tier)", passed, {
                "latency_ms": elapsed,
                "risk_tier": node0.get("risk_tier"),
                "ml_anomaly_score": data.get("ml_anomaly_score"),
                "flags": node0.get("flags")
            })
        except Exception as e:
            self.record("FLOW-05", "Preset 5: Live WazirX Exploiter (CRITICAL Risk Tier)", False, {}, str(e))

        # 6. Live Active TRON Wallet (TronGrid Live Query)
        try:
            t0 = time.time()
            status, body, _ = self.http_post("/api/trace", {
                "seed_address": "TTRnHsXFcGkkjC8NzQhUsVF1y86o38VjTw",
                "max_depth": 2,
                "min_usd_value": 20.0,
                "case_metadata": {
                    "fir_number": "FIR-44/2026 Cyber PS Cyberabad",
                    "loss_amount_inr": 3400000.0
                }
            })
            data = json.loads(body.decode("utf-8"))
            elapsed = round((time.time() - t0) * 1000, 2)
            passed = (status == 200 and len(data.get("nodes", [])) > 1 and len(data.get("edges", [])) > 0)
            self.record("FLOW-06", "Preset 6: Live Active TRON Wallet (TronGrid Live)", passed, {
                "latency_ms": elapsed,
                "nodes_count": len(data.get("nodes", [])),
                "edges_count": len(data.get("edges", [])),
                "ml_anomaly_score": data.get("ml_anomaly_score")
            })
        except Exception as e:
            self.record("FLOW-06", "Preset 6: Live Active TRON Wallet (TronGrid Live)", False, {}, str(e))

    def audit_case_lifecycle_and_bundle(self):
        # 1. Create Case
        case_id = None
        try:
            # Trace first
            _, body, _ = self.http_post("/api/trace", {
                "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
                "case_metadata": {
                    "fir_number": "FIR-E2E-AUDIT/2026",
                    "loss_amount_inr": 1850000.0,
                    "police_station": "Cyber Crime PS State HQ",
                    "investigating_officer": "DSP V. Sharma"
                }
            })
            trace_data = json.loads(body.decode("utf-8"))

            case_payload = {
                "fir_number": "FIR-E2E-AUDIT/2026",
                "police_station": "Cyber Crime PS State HQ",
                "investigating_officer": "DSP V. Sharma",
                "complainant_name": "Suresh Mehta",
                "loss_amount_inr": 1850000.0,
                "seed_address": trace_data["seed_address"],
                "chain": trace_data["chain"],
                "destination_vasp": (trace_data.get("target_vasp") or {}).get("name", "Binance"),
                "total_routed_usd": 18500.0,
                "evidence_sha256": trace_data["evidence_sha256"],
                "trace_data": trace_data
            }
            status, body, _ = self.http_post("/api/cases", case_payload)
            data = json.loads(body.decode("utf-8"))
            case_id = data.get("case_id")
            passed = (status == 201 and bool(case_id))
            self.record("CASE-01", "SQLite Case Vault: Case Creation (POST /api/cases)", passed, {
                "case_id": case_id,
                "fir_number": data.get("fir_number")
            })
        except Exception as e:
            self.record("CASE-01", "SQLite Case Vault: Case Creation (POST /api/cases)", False, {}, str(e))

        if not case_id:
            print("Skipping downstream case tests due to case creation failure.")
            return

        # 2. Fetch Case
        try:
            status, body, _ = self.http_get(f"/api/cases/{case_id}")
            data = json.loads(body.decode("utf-8"))
            passed = (status == 200 and data.get("case_id") == case_id and data.get("fir_number") == "FIR-E2E-AUDIT/2026")
            self.record("CASE-02", "Case Retrieval by ID (GET /api/cases/{id})", passed, {
                "case_id": case_id,
                "destination_vasp": data.get("destination_vasp")
            })
        except Exception as e:
            self.record("CASE-02", "Case Retrieval by ID (GET /api/cases/{id})", False, {}, str(e))

        # 3. Court Dossier PDF
        try:
            status, pdf_bytes, headers = self.http_get(f"/api/cases/{case_id}/dossier")
            has_pdf_header = pdf_bytes.startswith(b"%PDF-")
            size_valid = len(pdf_bytes) > 1000
            content_type_valid = "application/pdf" in headers.get("content-type", "")
            passed = (status == 200 and has_pdf_header and size_valid and content_type_valid)
            self.record("LEGAL-01", "Court Dossier PDF Generation (GET /api/cases/{id}/dossier)", passed, {
                "bytes_length": len(pdf_bytes),
                "header_signature": pdf_bytes[:5].decode("latin-1"),
                "content_type": headers.get("content-type")
            })
        except Exception as e:
            self.record("LEGAL-01", "Court Dossier PDF Generation (GET /api/cases/{id}/dossier)", False, {}, str(e))

        # 4. FIU-IND PMLA STR
        try:
            status, body, _ = self.http_get(f"/api/cases/{case_id}/str")
            str_data = json.loads(body.decode("utf-8"))
            header = str_data.get("report_header", {})
            regulatory_valid = header.get("regulatory_body") == "Financial Intelligence Unit - India (FIU-IND)"
            finnet_valid = "FINnet 2.0" in header.get("reporting_channel", "")
            aml_indicators = bool(str_data.get("aml_suspicion_indicators"))
            passed = (status == 200 and regulatory_valid and finnet_valid and aml_indicators)
            self.record("LEGAL-02", "FIU-IND PMLA STR Reporting (GET /api/cases/{id}/str)", passed, {
                "regulatory_body": header.get("regulatory_body"),
                "reporting_channel": header.get("reporting_channel"),
                "aml_indicators_count": len(str_data.get("aml_suspicion_indicators", []))
            })
        except Exception as e:
            self.record("LEGAL-02", "FIU-IND PMLA STR Reporting (GET /api/cases/{id}/str)", False, {}, str(e))

        # 5. Sealed Evidence Bundle ZIP & Non-Repudiation Manifest
        try:
            status, zip_bytes, headers = self.http_get(f"/api/cases/{case_id}/bundle")
            has_zip_header = zip_bytes.startswith(b"PK")
            zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
            namelist = zf.namelist()

            required_files = [
                ("pdf", any(n.endswith(".pdf") for n in namelist)),
                ("section_94", any("SECTION_94_BNSS" in n for n in namelist)),
                ("section_63", any("SECTION_63_BSA" in n for n in namelist)),
                ("fiu_str", any("FIU_IND_PMLA_STR" in n for n in namelist)),
                ("graph_json", any("FORENSIC_GRAPH_LEDGER" in n for n in namelist)),
                ("csv_ledger", any("TRANSACTION_HOPS_LEDGER" in n for n in namelist)),
                ("manifest", "SHA256SUMS.txt" in namelist)
            ]
            all_files_present = all(r[1] for r in required_files)

            # Cryptographic Invariance Check
            manifest_text = zf.read("SHA256SUMS.txt").decode("utf-8")
            manifest_lines = [l.strip() for l in manifest_text.splitlines() if l.strip() and not l.startswith("#")]
            hashes_verified = []
            all_hashes_matched = True

            for line in manifest_lines:
                expected_sha256, fname = line.split(None, 1)
                file_content = zf.read(fname)
                actual_sha256 = hashlib.sha256(file_content).hexdigest()
                is_match = (actual_sha256 == expected_sha256)
                if not is_match:
                    all_hashes_matched = False
                hashes_verified.append({
                    "file": fname,
                    "expected_sha256": expected_sha256,
                    "actual_sha256": actual_sha256,
                    "match": is_match
                })

            passed = (status == 200 and has_zip_header and all_files_present and all_hashes_matched and len(hashes_verified) >= 6)
            self.record("LEGAL-03", "Court-Sealed ZIP Evidence Bundle & Cryptographic Invariance", passed, {
                "bundle_bytes": len(zip_bytes),
                "files_count": len(namelist),
                "verified_files": [h["file"] for h in hashes_verified],
                "all_hashes_matched": all_hashes_matched,
                "cryptographic_manifest_lines": len(manifest_lines)
            })
        except Exception as e:
            self.record("LEGAL-03", "Court-Sealed ZIP Evidence Bundle & Cryptographic Invariance", False, {}, str(e))

    def audit_frontend_assets(self):
        try:
            status, body, _ = self.http_get("/app/index.html")
            html = body.decode("utf-8")
            required_ids = [
                "tabWalletBtn", "tabNcrpBtn", "modeWalletView", "modeNcrpView",
                "inputWallet", "inputFir", "inputLoss", "ncrpRawInput",
                "btnTraceAction", "btnTraceText", "crawlModeIndicator", "engineStatusBadge",
                "trailSection", "trailChainBadge", "trailLatencyBadge",
                "trailHop0Addr", "trailHop0Amount", "trailHop2Addr", "trailHop3Addr",
                "verdictExchangeTitle", "verdictNodalEmail", "verdictPortalUrl", "verdictSweepHash",
                "verdictRiskScore", "verdictRiskBar", "verdictEvidenceHash",
                "modalNotice", "noticePreContent", "copyNoticeIcon", "copyNoticeText"
            ]
            missing_ids = [id_str for id_str in required_ids if f'id="{id_str}"' not in html and f"id='{id_str}'" not in html]

            required_actions = [
                "downloadCourtPDF()", "downloadZIPBundle()", "openNoticeModal()",
                "closeNoticeModal()", "copyNoticeToClipboard()", "sendNodalEmail()",
                "loadScenario('tron_demo')", "loadScenario('evm_demo')", "loadScenario('btc_demo')",
                "loadScenario('binance_live')", "loadScenario('wazirx_live')", "loadScenario('tron_live')"
            ]
            missing_actions = [act for act in required_actions if act not in html]

            passed = (status == 200 and len(missing_ids) == 0 and len(missing_actions) == 0)
            self.record("FRONT-01", "Frontend UI Static Asset & Control Discovery", passed, {
                "html_bytes": len(body),
                "total_verified_ids": len(required_ids) - len(missing_ids),
                "missing_ids": missing_ids,
                "total_verified_actions": len(required_actions) - len(missing_actions),
                "missing_actions": missing_actions
            })
        except Exception as e:
            self.record("FRONT-01", "Frontend UI Static Asset & Control Discovery", False, {}, str(e))

    def audit_circuit_breaker_resilience(self):
        try:
            from app.crawlers.resilience import CircuitBreaker
            cb = CircuitBreaker(failure_threshold=3, recovery_timeout=0.1)
            
            # 1. Nominal
            assert cb.can_attempt() is True and not cb.is_open

            # 2. Trip breaker
            cb.record_failure()
            cb.record_failure()
            assert cb.can_attempt() is True
            cb.record_failure()
            assert cb.is_open is True and cb.can_attempt() is False

            # 3. Recover
            time.sleep(0.12)
            assert cb.can_attempt() is True
            cb.record_success()
            assert cb.is_open is False and cb.failure_count == 0

            self.record("DEF-01", "Crawler Fault Tolerance & Circuit Breaker State Machine", True, {
                "failure_threshold": 3,
                "recovery_state": "HALF-OPEN -> CLOSED",
                "zero_crash_guarantee": "VERIFIED"
            })
        except Exception as e:
            self.record("DEF-01", "Crawler Fault Tolerance & Circuit Breaker State Machine", False, {}, str(e))

    def print_summary(self):
        total = len(self.results)
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = total - passed
        elapsed = round(time.time() - self.start_time, 2)

        print("\n" + "=" * 80)
        print("AUDIT EXECUTION SUMMARY")
        print(f"Total Tests Executed: {total}")
        print(f"Total Tests Passed:   {passed} (100.0%)" if failed == 0 else f"Passed: {passed}, Failed: {failed}")
        print(f"Total Execution Time: {elapsed} seconds")
        print("=" * 80)

        # Output JSON result for machine ingestion
        audit_output_path = "backend/app/data/blue_team_audit_results.json"
        with open(audit_output_path, "w", encoding="utf-8") as f:
            json.dump({
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "target_endpoint": BASE_URL,
                "summary": {
                    "total": total,
                    "passed": passed,
                    "failed": failed,
                    "pass_rate_pct": round((passed / total) * 100, 2) if total else 0.0,
                    "elapsed_seconds": elapsed
                },
                "results": self.results
            }, f, indent=2)
        print(f"Audit results persisted to {audit_output_path}")

if __name__ == "__main__":
    runner = ForensicAuditRunner()
    runner.run_all()
