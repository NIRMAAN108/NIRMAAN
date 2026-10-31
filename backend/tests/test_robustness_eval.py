#!/usr/bin/env python3
"""
NIRMAAN Backend Robustness, Boundary & Resilience Evaluation Suite
Comprehensive testing against live server at http://127.0.0.1:8000
Targeting SIH26183 / I4C requirements:
- Input validation & malformed wallets
- Boundary conditions (depth, min usd value, negative amounts)
- Special characters, XSS, SQLi & Unicode handling
- 1930 / NCRP parsing edge cases & extreme payload sizing (50k - 100k chars)
- Non-existent case vault lookups & structured error envelopes
- High-concurrency load probe (15-20 concurrent requests) & server survival
"""
__test__ = False

import sys
import json
import time
import asyncio
import statistics
from typing import Dict, Any, List, Tuple
import httpx

BASE_URL = "http://127.0.0.1:8000"

# Color formatting for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

class TestResult:
    def __init__(self, category: str, test_id: str, description: str, passed: bool, status_code: int, latency_ms: float, details: str = ""):
        self.category = category
        self.test_id = test_id
        self.description = description
        self.passed = passed
        self.status_code = status_code
        self.latency_ms = latency_ms
        self.details = details

results: List[TestResult] = []

def record(category: str, test_id: str, description: str, passed: bool, status_code: int, latency_ms: float, details: str = ""):
    res = TestResult(category, test_id, description, passed, status_code, latency_ms, details)
    results.append(res)
    mark = f"{GREEN}[PASS]{RESET}" if passed else f"{RED}[FAIL]{RESET}"
    print(f" {mark} {category} | {test_id} - {description} (HTTP {status_code}, {latency_ms:.1f}ms) {details}")

# =========================================================================
# SECTION 1: MALFORMED & INVALID WALLET INPUTS (/api/trace)
# =========================================================================
async def test_malformed_wallet_inputs(client: httpx.AsyncClient):
    print(f"\n{CYAN}{BOLD}=== SECTION 1: Malformed & Invalid Wallet Inputs (POST /api/trace) ==={RESET}")
    
    test_cases = [
        ("EMPTY_STR", "Empty string address", "", 400),
        ("NON_STD_PREFIX_Z", "Non-standard prefix 'Z12345'", "Z12345", 400),
        ("NON_STD_PREFIX_XYZ", "Non-standard prefix 'xyz'", "xyz", 400),
        ("NON_STD_PREFIX_BTC", "Non-standard prefix 'BTC_123456789'", "BTC_123456789", 400),
        ("SPECIAL_CHARS", "Special characters and symbols", "!@#$%^&*()_+~|}{[]:;?><,./'", 400),
        ("TRON_FORMAT_SYMBOLS", "34-char string starting with T but full of symbols", "T" + "!@#$%^&*()_+~|}{[]:;?><,./'1234", 400),
        ("LONG_INPUT_NO_PREFIX", "Excessively long input (10,000 chars of 'A')", "A" * 10000, 400),
        ("LONG_INPUT_EVM_PREFIX", "Excessively long input (10,000 chars starting with 0x)", "0x" + ("f" * 9998), 400),
        ("LONG_INPUT_TRON_PREFIX", "Excessively long input (10,000 chars starting with T)", "T" + ("X" * 9999), 400),
    ]

    for test_id, desc, address, expected_statuses in test_cases:
        expected = expected_statuses if isinstance(expected_statuses, list) else [expected_statuses]
        t0 = time.perf_counter()
        try:
            resp = await client.post(f"{BASE_URL}/api/trace", json={"seed_address": address})
            latency = (time.perf_counter() - t0) * 1000.0
            
            # Check response structure
            is_valid_error = False
            if resp.status_code in [400, 422]:
                body = resp.json()
                is_valid_error = (body.get("success") is False) and ("error" in body)
            elif resp.status_code == 200:
                is_valid_error = True
            
            passed = (resp.status_code in expected) and (resp.status_code < 500)
            detail = f"Code={resp.status_code}"
            if not passed:
                detail += f" Expected {expected}, Body: {resp.text[:120]}"
            record("Input Validation", test_id, desc, passed, resp.status_code, latency, detail)
        except Exception as e:
            latency = (time.perf_counter() - t0) * 1000.0
            record("Input Validation", test_id, desc, False, 0, latency, f"Exception: {str(e)}")

# =========================================================================
# SECTION 2: BOUNDARY VALUES & SPECIAL CHARACTERS (/api/trace & /api/cases)
# =========================================================================
async def test_boundary_values(client: httpx.AsyncClient):
    print(f"\n{CYAN}{BOLD}=== SECTION 2: Boundary Values & Extreme Parameters ==={RESET}")
    seed = "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC"

    boundary_cases = [
        ("DEPTH_ZERO", "max_depth = 0 (violates ge=1)", {"seed_address": seed, "max_depth": 0}, 422),
        ("DEPTH_NEGATIVE", "max_depth = -5 (negative depth)", {"seed_address": seed, "max_depth": -5}, 422),
        ("DEPTH_HUNDRED", "max_depth = 100 (violates le=6)", {"seed_address": seed, "max_depth": 100}, 422),
        ("MIN_USD_NEGATIVE_50", "min_usd_value = -50 (violates ge=0.0)", {"seed_address": seed, "min_usd_value": -50.0}, 422),
        ("MIN_USD_NEGATIVE_100", "min_usd_value = -100 (violates ge=0.0)", {"seed_address": seed, "min_usd_value": -100.0}, 422),
        ("MIN_USD_ZERO_BOUNDARY", "min_usd_value = 0.0 (exact lower bound)", {"seed_address": seed, "min_usd_value": 0.0}, 200),
        ("DEPTH_SIX_BOUNDARY", "max_depth = 6 (exact upper bound)", {"seed_address": seed, "max_depth": 6}, 200),
        ("NEGATIVE_LOSS_AMOUNT", "negative loss_amount_inr = -100000", {
            "seed_address": seed,
            "case_metadata": {
                "fir_number": "NCRP-TEST/NEG-LOSS",
                "loss_amount_inr": -100000.0
            }
        }, 422),
        ("UNICODE_HINDI_METADATA", "Hindi Unicode complainant & FIR", {
            "seed_address": seed,
            "case_metadata": {
                "fir_number": "एनसीआरपी-शिकायत/२०२६/९९",
                "police_station": "साइबर अपराध पुलिस स्टेशन, नई दिल्ली",
                "investigating_officer": "निरीक्षक राजेश कुमार",
                "complainant_name": "राजेश कुमार शर्मा",
                "loss_amount_inr": 250000.0
            }
        }, 200),
        ("SPECIAL_CHARS_EMOJI", "Emoji & special symbols in FIR", {
            "seed_address": seed,
            "case_metadata": {
                "fir_number": "🚨 FIR-CRIME-2026/💣🔥#@!",
                "police_station": "HQ State Cyber Cell #01",
                "investigating_officer": "Insp. John Doe (ID: 9988)",
                "complainant_name": "Victim 🕵️‍♂️💸 [Confidential]",
                "loss_amount_inr": 50000.0
            }
        }, 200),
        ("SQLI_PAYLOAD_METADATA", "SQL Injection strings in FIR & Complainant", {
            "seed_address": seed,
            "case_metadata": {
                "fir_number": "FIR-001'; DROP TABLE cases; --",
                "police_station": "Cyber Cell' OR '1'='1",
                "investigating_officer": "Admin'--",
                "complainant_name": "Test' UNION SELECT * FROM cases --",
                "loss_amount_inr": 10000.0
            }
        }, 200),
        ("XSS_PAYLOAD_METADATA", "XSS HTML payloads in metadata", {
            "seed_address": seed,
            "case_metadata": {
                "fir_number": "<script>alert('xss')</script>",
                "police_station": "<iframe src='evil.com'></iframe>",
                "investigating_officer": "<img src=x onerror=alert(1)>",
                "complainant_name": "<b>Bold Victim</b>",
                "loss_amount_inr": 75000.0
            }
        }, 200),
    ]

    for test_id, desc, payload, expected_statuses in boundary_cases:
        expected = expected_statuses if isinstance(expected_statuses, list) else [expected_statuses]
        t0 = time.perf_counter()
        try:
            resp = await client.post(f"{BASE_URL}/api/trace", json=payload)
            latency = (time.perf_counter() - t0) * 1000.0
            passed = (resp.status_code in expected) and (resp.status_code < 500)
            detail = f"Status={resp.status_code}"
            if not passed:
                detail += f" Expected {expected}, Body: {resp.text[:120]}"
            record("Boundary Values", test_id, desc, passed, resp.status_code, latency, detail)
        except Exception as e:
            latency = (time.perf_counter() - t0) * 1000.0
            record("Boundary Values", test_id, desc, False, 0, latency, f"Exception: {str(e)}")

# =========================================================================
# SECTION 3: NCRP / 1930 PARSING EDGE CASES (POST /api/ncrp/parse)
# =========================================================================
async def test_ncrp_parsing(client: httpx.AsyncClient):
    print(f"\n{CYAN}{BOLD}=== SECTION 3: 1930 / NCRP Parsing Edge Cases (POST /api/ncrp/parse) ==={RESET}")

    multi_chain_text = """
    URGENT NCRP TICKET NCRP/DELHI/2026/88912.
    Victim lost INR 1,500,000 in a telegram crypto investment task scam.
    Victim sent 15,000 USDT to suspect TRON address TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC.
    Additional 5 ETH was sent to Ethereum address 0x95222290DD7853684454F4275E597E3A63725F78.
    Suspect also instructed transaction to Bitcoin address 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa and Segwit bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq.
    Victim phone: +919876543210. Transaction hash: 0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000.
    """

    no_crypto_text = """
    I was defrauded via Google Pay / UPI. Sent Rs 45000 to fraudster number 9876543210.
    FIR No: FIR/CYBER/2026/1029. No crypto wallets or blockchain involved in this incident.
    """

    large_text_50k = "NCRP Complaint statement: " + ("The suspect demanded USDT to address TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC. Amount Rs 50,000. " * 500)
    large_text_100k = "NCRP Complaint statement: " + ("Fraud incident details lost Rs 100,000 in crypto. " * 2000)

    ncrp_cases = [
        ("EMPTY_TEXT", "Completely empty text string", "", 200, lambda b: len(b.get("extracted_addresses", [])) == 0),
        ("NO_CRYPTO_TEXT", "Text with zero crypto addresses", no_crypto_text, 200, lambda b: len(b.get("extracted_addresses", [])) == 0),
        ("MULTI_CHAIN_TEXT", "Text with TRON, EVM, BTC addresses", multi_chain_text, 200, lambda b: len(b.get("extracted_addresses", [])) >= 3),
        ("LARGE_TEXT_50K", "Large text document (50k characters)", large_text_50k[:50000], 200, lambda b: len(b.get("extracted_addresses", [])) >= 1),
        ("LARGE_TEXT_100K", "Extremely large document (100k characters)", large_text_100k[:100000], 200, lambda b: b.get("raw_text") is not None),
    ]

    for test_id, desc, text_payload, expected_status, validator in ncrp_cases:
        t0 = time.perf_counter()
        try:
            resp = await client.post(f"{BASE_URL}/api/ncrp/parse", json={"text": text_payload})
            latency = (time.perf_counter() - t0) * 1000.0
            valid_payload = False
            if resp.status_code == expected_status:
                data = resp.json()
                valid_payload = validator(data)
            
            passed = (resp.status_code == expected_status) and valid_payload and (resp.status_code < 500)
            detail = f"Len={len(text_payload)}, Status={resp.status_code}, ValidSchema={valid_payload}"
            record("NCRP Parsing", test_id, desc, passed, resp.status_code, latency, detail)
        except Exception as e:
            latency = (time.perf_counter() - t0) * 1000.0
            record("NCRP Parsing", test_id, desc, False, 0, latency, f"Exception: {str(e)}")

# =========================================================================
# SECTION 4: NON-EXISTENT CASE VAULT LOOKUPS & ERROR ENVELOPES
# =========================================================================
async def test_non_existent_case_vault(client: httpx.AsyncClient):
    print(f"\n{CYAN}{BOLD}=== SECTION 4: Non-Existent Record Handling & Error Envelopes ==={RESET}")

    dummy_ids = [
        ("INVALID_UUID", "invalid-uuid-12345"),
        ("SQLI_ID", "case_999' OR '1'='1"),
        ("SPECIAL_CHARS_ID", "case_!@#$%^&*()"),
    ]

    endpoints = [
        ("GET_CASE", "/api/cases/{id}", "Case Record Query"),
        ("GET_DOSSIER", "/api/cases/{id}/dossier", "PDF Dossier Stream"),
        ("GET_BUNDLE", "/api/cases/{id}/bundle", "Evidence Bundle ZIP"),
        ("GET_STR", "/api/cases/{id}/str", "FIU-IND STR Payload"),
    ]

    for id_tag, case_id in dummy_ids:
        for ep_tag, path_tmpl, ep_desc in endpoints:
            test_id = f"{id_tag}_{ep_tag}"
            desc = f"{ep_desc} for non-existent '{case_id}'"
            path = path_tmpl.format(id=case_id)
            t0 = time.perf_counter()
            try:
                resp = await client.get(f"{BASE_URL}{path}")
                latency = (time.perf_counter() - t0) * 1000.0

                # Verify structured 404 response
                is_structured_404 = False
                if resp.status_code == 404:
                    try:
                        body = resp.json()
                        is_structured_404 = (
                            body.get("success") is False and
                            body.get("error", {}).get("code") == "RESOURCE_NOT_FOUND" and
                            body.get("error", {}).get("status_code") == 404
                        )
                    except Exception:
                        is_structured_404 = False

                passed = (resp.status_code == 404) and is_structured_404
                detail = f"Status={resp.status_code}, Structured404={is_structured_404}"
                record("Case Vault Lookups", test_id, desc, passed, resp.status_code, latency, detail)
            except Exception as e:
                latency = (time.perf_counter() - t0) * 1000.0
                record("Case Vault Lookups", test_id, desc, False, 0, latency, f"Exception: {str(e)}")

# =========================================================================
# SECTION 5: PERSISTENCE & ARTIFACT GENERATION WITH UNICODE / SPECIAL CHARS
# =========================================================================
async def test_unicode_case_lifecycle(client: httpx.AsyncClient):
    print(f"\n{CYAN}{BOLD}=== SECTION 5: Unicode & Special Chars Case Vault Persistence Lifecycle ==={RESET}")
    
    # 1. First run a trace to get realistic graph data
    trace_resp = await client.post(f"{BASE_URL}/api/trace", json={
        "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC"
    })
    trace_data = trace_resp.json()

    # 2. Persist case with Hindi Unicode and Special Characters
    unicode_case_payload = {
        "fir_number": "FIR/NEW-DELHI/2026/८८९१२",
        "police_station": "साइबर पुलिस थाना, दक्षिण दिल्ली",
        "investigating_officer": "निरीक्षक राजेश शर्मा (IO-77)",
        "complainant_name": "श्रीमती सुनीता देवी 🇮🇳",
        "loss_amount_inr": 1250000.0,
        "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
        "chain": "TRON (TRC-20)",
        "destination_vasp": "Binance Holdings Ltd",
        "total_routed_usd": 14950.0,
        "evidence_sha256": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "trace_data": trace_data
    }

    t0 = time.perf_counter()
    created_case_id = None
    try:
        resp = await client.post(f"{BASE_URL}/api/cases", json=unicode_case_payload)
        latency = (time.perf_counter() - t0) * 1000.0
        passed = resp.status_code == 201
        if passed:
            created_case_id = resp.json().get("case_id")
        record("Unicode Lifecycle", "CASE_CREATE_UNICODE", "Persist case with Hindi unicode & emojis", passed, resp.status_code, latency, f"CreatedCaseId={created_case_id}")
    except Exception as e:
        latency = (time.perf_counter() - t0) * 1000.0
        record("Unicode Lifecycle", "CASE_CREATE_UNICODE", "Persist case with Hindi unicode & emojis", False, 0, latency, f"Exception: {str(e)}")

    if created_case_id:
        # Check GET case
        t0 = time.perf_counter()
        resp = await client.get(f"{BASE_URL}/api/cases/{created_case_id}")
        latency = (time.perf_counter() - t0) * 1000.0
        record("Unicode Lifecycle", "CASE_GET_UNICODE", "Fetch persisted Unicode case record", resp.status_code == 200, resp.status_code, latency)

        # Check GET FIU STR
        t0 = time.perf_counter()
        resp = await client.get(f"{BASE_URL}/api/cases/{created_case_id}/str")
        latency = (time.perf_counter() - t0) * 1000.0
        record("Unicode Lifecycle", "CASE_STR_UNICODE", "Generate FIU-IND STR with Unicode metadata", resp.status_code == 200, resp.status_code, latency)

        # Check GET Dossier (PDF) - ReportLab unicode behavior test
        t0 = time.perf_counter()
        resp = await client.get(f"{BASE_URL}/api/cases/{created_case_id}/dossier")
        latency = (time.perf_counter() - t0) * 1000.0
        passed = resp.status_code == 200 and len(resp.content) > 1000
        detail = f"Status={resp.status_code}, Bytes={len(resp.content)}"
        record("Unicode Lifecycle", "CASE_PDF_DOSSIER_UNICODE", "Generate court PDF dossier with Unicode metadata", passed, resp.status_code, latency, detail)

        # Check GET Bundle (ZIP)
        t0 = time.perf_counter()
        resp = await client.get(f"{BASE_URL}/api/cases/{created_case_id}/bundle")
        latency = (time.perf_counter() - t0) * 1000.0
        passed = resp.status_code == 200 and len(resp.content) > 1000
        detail = f"Status={resp.status_code}, Bytes={len(resp.content)}"
        record("Unicode Lifecycle", "CASE_ZIP_BUNDLE_UNICODE", "Generate court ZIP bundle with Unicode metadata", passed, resp.status_code, latency, detail)

# =========================================================================
# SECTION 6: CONCURRENCY & RESILIENCE PROBE (15-20 Concurrent Trace Requests)
# =========================================================================
async def test_concurrency_probe(num_concurrent: int = 16):
    print(f"\n{CYAN}{BOLD}=== SECTION 6: Concurrency & Load Handling ({num_concurrent} Concurrent Traces) ==={RESET}")
    
    payload = {
        "seed_address": "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
        "max_depth": 4,
        "min_usd_value": 20.0,
        "case_metadata": {
            "fir_number": "NCRP-CONCURRENCY-TEST/2026",
            "police_station": "Cyber Crime Task Force"
        }
    }

    async def single_trace_request(idx: int, client: httpx.AsyncClient) -> Dict[str, Any]:
        t0 = time.perf_counter()
        try:
            resp = await client.post(f"{BASE_URL}/api/trace", json=payload, timeout=25.0)
            latency = (time.perf_counter() - t0) * 1000.0
            return {
                "idx": idx,
                "status": resp.status_code,
                "latency_ms": latency,
                "success": (resp.status_code == 200),
                "error": None
            }
        except Exception as e:
            latency = (time.perf_counter() - t0) * 1000.0
            return {
                "idx": idx,
                "status": 0,
                "latency_ms": latency,
                "success": False,
                "error": str(e)
            }

    # Use limits for high concurrency
    limits = httpx.Limits(max_keepalive_connections=30, max_connections=50)
    async with httpx.AsyncClient(limits=limits, timeout=30.0) as client:
        start_probe = time.perf_counter()
        tasks = [single_trace_request(i, client) for i in range(num_concurrent)]
        probe_results = await asyncio.gather(*tasks)
        total_time_s = time.perf_counter() - start_probe

    latencies = [r["latency_ms"] for r in probe_results]
    success_count = sum(1 for r in probe_results if r["success"])
    fail_count = num_concurrent - success_count
    error_rate = (fail_count / num_concurrent) * 100.0
    throughput = num_concurrent / total_time_s if total_time_s > 0 else 0

    mean_lat = statistics.mean(latencies)
    median_lat = statistics.median(latencies)
    min_lat = min(latencies)
    max_lat = max(latencies)
    sorted_lat = sorted(latencies)
    p95_lat = sorted_lat[int(0.95 * len(sorted_lat))]

    print(f"\n{BOLD}Concurrency Probe Performance Metrics:{RESET}")
    print(f"  Total Concurrent Requests : {num_concurrent}")
    print(f"  Successful Requests (200) : {success_count} / {num_concurrent}")
    print(f"  Failed Requests           : {fail_count}")
    print(f"  Error Rate                : {error_rate:.2f}%")
    print(f"  Total Duration            : {total_time_s:.2f} seconds")
    print(f"  Throughput                : {throughput:.2f} req/s")
    print(f"  Latency Min / Max         : {min_lat:.1f}ms / {max_lat:.1f}ms")
    print(f"  Latency Mean / Median     : {mean_lat:.1f}ms / {median_lat:.1f}ms")
    print(f"  Latency P95               : {p95_lat:.1f}ms")

    # Post-concurrency health check
    async with httpx.AsyncClient(timeout=10.0) as client:
        t0 = time.perf_counter()
        health_resp = await client.get(f"{BASE_URL}/")
        health_lat = (time.perf_counter() - t0) * 1000.0
        health_ok = (health_resp.status_code == 200) and (health_resp.json().get("status") == "online")

    concurrency_passed = (error_rate == 0.0) and health_ok
    record("Concurrency & Load", "CONCURRENCY_BURST", f"16 concurrent trace requests", concurrency_passed, 200 if concurrency_passed else 500, mean_lat, f"MeanLat={mean_lat:.1f}ms, P95={p95_lat:.1f}ms, ErrorRate={error_rate:.1f}%")
    record("Concurrency & Load", "POST_LOAD_HEALTH", "Server remains online & responsive after load", health_ok, health_resp.status_code, health_lat, f"HealthOK={health_ok}")

# =========================================================================
# MAIN EXECUTION ORCHESTRATOR
# =========================================================================
async def run_evaluation():
    print(f"{BOLD}========================================================================{RESET}")
    print(f"{BOLD} NIRMAAN FORENSIC ENGINE - EXHAUSTIVE ROBUSTNESS & RESILIENCE EVALUATION{RESET}")
    print(f" Target Endpoint: {BASE_URL}")
    print(f" Execution Time : {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{BOLD}========================================================================{RESET}")

    limits = httpx.Limits(max_keepalive_connections=20, max_connections=30)
    async with httpx.AsyncClient(limits=limits, timeout=30.0) as client:
        # Pre-check: Ensure server is up
        try:
            h = await client.get(f"{BASE_URL}/")
            if h.status_code != 200:
                print(f"{RED}Server at {BASE_URL} responded with status {h.status_code}. Aborting.{RESET}")
                return
        except Exception as e:
            print(f"{RED}Cannot connect to {BASE_URL}: {e}. Ensure server is running.{RESET}")
            return

        await test_malformed_wallet_inputs(client)
        await test_boundary_values(client)
        await test_ncrp_parsing(client)
        await test_non_existent_case_vault(client)
        await test_unicode_case_lifecycle(client)

    # Concurrency test runs its own client
    await test_concurrency_probe(num_concurrent=16)

    # Summary calculation
    total_tests = len(results)
    passed_tests = sum(1 for r in results if r.passed)
    failed_tests = total_tests - passed_tests
    pass_rate = (passed_tests / total_tests) * 100.0 if total_tests > 0 else 0.0

    print(f"\n{BOLD}========================================================================{RESET}")
    print(f"{BOLD} EVALUATION EXECUTIVE SUMMARY{RESET}")
    print(f"{BOLD}========================================================================{RESET}")
    print(f" Total Test Cases Executed  : {total_tests}")
    print(f" Passed                     : {GREEN}{passed_tests}{RESET}")
    print(f" Failed / Anomaly Found     : {RED if failed_tests > 0 else GREEN}{failed_tests}{RESET}")
    print(f" Pass Rate                  : {GREEN if pass_rate == 100 else YELLOW}{pass_rate:.1f}%{RESET}")
    print(f"{BOLD}========================================================================{RESET}")

    # Output detailed report JSON to stdout or file
    summary_data = {
        "total": total_tests,
        "passed": passed_tests,
        "failed": failed_tests,
        "pass_rate_percent": round(pass_rate, 2),
        "tests": [
            {
                "category": r.category,
                "test_id": r.test_id,
                "description": r.description,
                "passed": r.passed,
                "status_code": r.status_code,
                "latency_ms": round(r.latency_ms, 2),
                "details": r.details
            }
            for r in results
        ]
    }

    with open("robustness_report.json", "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)
    print(f"Detailed JSON results written to: robustness_report.json\n")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
