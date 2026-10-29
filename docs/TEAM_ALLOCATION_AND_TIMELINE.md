# NIRMAAN: 4-DEVELOPER TEAM ALLOCATION & LINEAR MILESTONE TIMELINE

**SIH Problem Statement:** SIH26183 · Ministry of Home Affairs (MHA) / I4C  
**Team Composition:** 4 Developers  
* **Skill Inventory:**
  * 4 Developers capable of WebDev (Frontend / Backend / API)
  * 3 Generalists ("Can work on anything" — Systems, pipelines, integration)
  * 2 Machine Learning & Model Training Specialists (GNNs, clustering, heuristics)
  * 1 Blockchain Specialist (EVM, Tron, Bitcoin UTXO, RPC nodes)

---

## 1. The 4 Dedicated Project Verticals

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     NIRMAAN 4-VERTICAL MATRIX                                │
├──────────────────────────┬──────────────────────────┬──────────────────────────┬─────────────┤
│ VERTICAL 1: BLOCKCHAIN   │ VERTICAL 2: ML &         │ VERTICAL 3: FRONTEND     │ VERTICAL 4: │
│ INGESTION & PROTOCOLS    │ HEURISTIC INTELLIGENCE   │ INVESTIGATION CANVAS     │ BACKEND &   │
│                          │                          │                          │ LEGAL LEA   │
├──────────────────────────┼──────────────────────────┼──────────────────────────┼─────────────┤
│ Lead: Dev 1 (Blockchain) │ Lead: Dev 2 & Dev 3 (ML) │ Lead: Dev 4 (WebDev)     │ Lead: Dev 3 │
│ Assisting: Dev 3 (Gen)   │ Assisting: AI Subagent   │ Assisting: Dev 1/2 (Web) │ (Generalist)│
├──────────────────────────┼──────────────────────────┼──────────────────────────┼─────────────┤
│ • EVM Crawler (ETH/BSC)  │ • Peeling Chain ML Model │ • Cytoscape Canvas UI    │ • FastAPI   │
│ • Bitcoin UTXO Indexer   │ • GNN / Node2Vec Scoring │ • Timeline Scrubber      │ • Case DB   │
│ • Internal Tx Traces     │ • Mixer / Bridge Detect  │ • Entity Inspector Pane  │ • BNSS PDF  │
│ • VASP Directory 500+    │ • Deposit Sweep Rules    │ • 1-Click Export Tool    │ • ZIP Vault │
└──────────────────────────┴──────────────────────────┴──────────────────────────┴─────────────┘
```

---

## 2. Developer Role Assignments & Concrete Ownership

### 🔷 DEV 1: Blockchain Infrastructure Specialist (Blockchain + WebDev)
* **Assigned Vertical:** **Vertical 1 — Multi-Chain Ingestion & Protocol Crawlers**
* **Core Responsibilities:**
  1. Build the EVM crawler (`backend/app/crawlers/evm.py`) for Ethereum and BSC USDT/USDC (handling ERC-20 Transfer logs + internal smart contract calls).
  2. Build the Bitcoin crawler (`backend/app/crawlers/btc.py`) for UTXO transaction fetching via Blockstream/Mempool API.
  3. Expand TRON crawler to inspect Stake 2.0 energy delegations (`/wallet/getdelegatedresource`).
  4. Curate and expand `backend/app/data/vasp_directory.json` with 500+ known exchange hot wallets and nodal officer contacts.

### 🟣 DEV 2: Machine Learning & Fraud Modeling Specialist (ML + WebDev)
* **Assigned Vertical:** **Vertical 2 — Anomaly Detection, GNN & Risk Scoring**
* **Core Responsibilities:**
  1. Build the **Peeling Chain Anomaly Classifier** (detects asymmetric 90/10 splits rolling into virgin change addresses).
  2. Implement **Mixer & Bridge Detection Heuristics** (Tornado Cash, FixedFloat, ChangeNOW, Thorchain signatures).
  3. Develop a lightweight **Graph Risk Scoring Engine** (0.0 to 1.0 fraud propensity score for each node using in-degree, out-degree, velocity, and transitivity features).
  4. Package models as modular pure-Python / ONNX inference functions callable by the graph traversal engine in $< 50\text{ ms}$.

### 🟢 DEV 3: Full-Stack Systems & Integration Specialist (Generalist + ML + WebDev)
* **Assigned Vertical:** **Vertical 4 — Backend APIs, Case Vault & Legal Dossier Engine**
* **Core Responsibilities:**
  1. Maintain and extend the **FastAPI Gateway** (`backend/app/main.py`) with clean REST endpoints.
  2. Build the **Case Management Vault** (SQLite database tracking FIR number, IO name, complainant loss, and notes).
  3. Build the **Automated Court-Ready Dossier Engine** (`backend/app/core/pdf_dossier.py` using WeasyPrint/Playwright) generating Section 94 BNSS notices and Section 63 BSA certificates with SHA-256 cryptographic hashes.
  4. Cross-vertical glue: Bridge ML outputs and blockchain crawler outputs into the core NetworkX tracer.

### 🟡 DEV 4: UI/UX & Visual Analytics Lead (WebDev)
* **Assigned Vertical:** **Vertical 3 — Interactive Investigation Canvas & Frontend**
* **Core Responsibilities:**
  1. Expand the Cytoscape.js frontend into an executive dark-mode investigation workspace.
  2. Implement dual layout switching:
     * **Dagre Mode:** Linear Left-to-Right money trail view.
     * **CoSE Mode:** Force-directed entity clustering view.
  3. Build the **Timeline Playback Scrubber** (animates transactions chronologically so police can watch the money move step-by-step).
  4. Build the **Entity Inspector & Legal Notice Modal** with instant 1-click PDF download.

---

## 3. Linear Milestone Timeline Chart (Phased Sprint)

```
====================================================================================================
PHASE 1: FOUNDATIONS & CONTRACTS (Day 1: Hours 0 – 6)
====================================================================================================
[DEV 1 - Blockchain]  ==> Implement EVM crawler schema & get free API keys (Etherscan/BscScan).
[DEV 2 - ML/Model]    ==> Extract feature vectors from transaction edges (amount, velocity, degree).
[DEV 3 - Backend/LEA] ==> Finalize Pydantic data contracts (TraceRequest, GraphNode, TraceResponse).
[DEV 4 - Frontend]    ==> Setup Cytoscape canvas container, theme palette, and node styling classes.
----------------------------------------------------------------------------------------------------
CHECKPOINT 1: All 4 developers align on API schemas; mock JSON returns valid graph to frontend.

====================================================================================================
PHASE 2: CORE VERTICAL EXECUTION (Day 1: Hours 6 – 18)
====================================================================================================
[DEV 1 - Blockchain]  ==> Live EVM ERC-20 + BTC UTXO crawlers working with rate-limit retry logic.
[DEV 2 - ML/Model]    ==> Peeling chain classifier + mixer fingerprint detector tested on historical txs.
[DEV 3 - Backend/LEA] ==> SQLite Case Vault (CRUD for FIR cases) + Section 94 BNSS PDF generator.
[DEV 4 - Frontend]    ==> Connect search bar to live API; implement Dagre auto-layout on node insertion.
----------------------------------------------------------------------------------------------------
CHECKPOINT 2: End-to-end trace works for TRON + EVM; graph displays with ML risk badges on nodes.

====================================================================================================
PHASE 3: ADVANCED FEATURES & INTEGRATION (Day 2: Hours 18 – 28)
====================================================================================================
[DEV 1 - Blockchain]  ==> Expand VASP directory to 500+ hot wallets (Binance, Bybit, CoinDCX, WazirX).
[DEV 2 - ML/Model]    ==> Deploy 0.0–1.0 risk score calculation into response payload.
[DEV 3 - Backend/LEA] ==> Build Section 63 BSA SHA-256 certificate & 1-click ZIP evidence packet export.
[DEV 4 - Frontend]    ==> Build Timeline Playback Scrubber & node filter controls (min USD, date range).
----------------------------------------------------------------------------------------------------
CHECKPOINT 3: System passes live end-to-end multi-hop trace in < 5 seconds; 1-click generates PDF.

====================================================================================================
PHASE 4: POLISH, BENCHMARKS & JURY REHEARSAL (Day 2: Hours 28 – 36)
====================================================================================================
[ALL DEVS]            ==> 1. Run full regression test with 3 live scam case studies (Task Scam, Digital Arrest).
                      ==> 2. Ensure offline demo fallbacks are 100% resilient if WiFi fails during pitch.
                      ==> 3. Prepare pitch deck slides highlighting 1930 Golden Hour & ₹50L vs ₹3L cost advantage.
----------------------------------------------------------------------------------------------------
FINAL OUTCOME: Winning Prototype ready for SIH Jury Evaluation!
====================================================================================================
```

---

## 4. Cross-Vertical Integration Contracts (Interfaces)

To guarantee that all 4 developers work in parallel without blocking each other:

1. **Crawler Interface (Dev 1 -> Dev 3):**
   ```python
   async def fetch_transfers(address: str, chain: str) -> List[Dict]:
       # Returns: [{"from": str, "to": str, "amount": float, "token": str, "tx_hash": str, "timestamp": int}]
   ```

2. **ML Classifier Interface (Dev 2 -> Dev 3):**
   ```python
   def evaluate_node_risk(node_history: List[Dict]) -> Dict:
       # Returns: {"risk_score": float, "is_peel_chain": bool, "mixer_detected": Optional[str]}
   ```

3. **Frontend API Contract (Dev 3 -> Dev 4):**
   * Endpoint: `POST /api/trace`
   * Response: Strict `TraceResponse` schema (JSON with `nodes`, `edges`, `target_vasp`, `section_94_notice_text`).
