# OPTIMIZED MILESTONE PLAN: PARALLEL SPRINT ROADMAP

**Project:** NIRMAAN (ChainTrace AI) · SIH26183  
**Team Allocation:**  
* **YOU (Dev 1):** Blockchain Infrastructure & Multi-Chain Crawlers (TRON, EVM, BTC, VASP DB)
* **DEV 2:** Machine Learning, Peeling Chain Classification & Risk Scoring
* **DEV 3:** Backend Architecture, Case Vault & Section 94 BNSS Legal PDF Engine
* **DEV 4:** Frontend UI/UX, Cytoscape.js Canvas & Timeline Playback Scrubber

---

## ⚡ Core Optimizations Applied

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 KEY CRITICAL-PATH OPTIMIZATIONS                             │
├──────────────────────────┬──────────────────────────────────────────────────────────────────┤
│ 1. Zero-Wait Mocking     │ Backend & Frontend use mock contracts on Minute 1.               │
│                          │ No developer ever sits idle waiting for APIs or models.          │
├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 2. "Steel Thread" First  │ The entire end-to-end TRON pipe is operational by Hour 4.        │
│                          │ EVM and Bitcoin are additive modules that cannot break the core. │
├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 3. Heuristics Before ML  │ Dev 2 ships fast deterministic rules first (peel ratios, mixers),│
│                          │ then layers ML risk scoring. Demo never fails if ML overfits.    │
├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 4. Pitch-Proof Fallback  │ If hackathon WiFi drops during jury demo, system switches to     │
│                          │ local fixture seamlessly in 0.2s without error popups.           │
└──────────────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 📅 The 4 Time-Boxed Milestones

```
====================================================================================================
MILESTONE 1: THE "STEEL THREAD" (Hours 0 – 4)
Objective: Have the entire pipeline operational end-to-end with zero blocking dependencies.
====================================================================================================
• YOU (Blockchain)  ==> [COMPLETED] Test live TRON TRC-20 crawler with TronGrid + resilient failover.
• DEV 2 (ML/Model)  ==> Write deterministic peeling chain filter function (len(out)==2 & 90/10 ratio).
• DEV 3 (Backend)   ==> Freeze Pydantic schemas; expose /api/trace and /api/vasps on FastAPI.
• DEV 4 (Frontend)  ==> Wire Cytoscape.js canvas to /api/trace; render Red (Suspect) -> Green (VASP).
----------------------------------------------------------------------------------------------------
🎯 DEFINITION OF DONE (DoD 1):
Any team member can open the browser, paste a TRON address, see nodes draw on screen in < 1 second,
and click to view a pre-filled Section 94 BNSS notice.

====================================================================================================
MILESTONE 2: LIVE DATA & INTELLIGENCE INJECTION (Hours 4 – 12)
Objective: Replace mocks with real multi-chain ingestion and automated legal notice generation.
====================================================================================================
• YOU (Blockchain)  ==> [COMPLETED] 1. Build EVM crawler (backend/app/crawlers/evm.py) for ETH & BSC USDT.
                    ==> [COMPLETED] 2. Add Tron Stake 2.0 energy delegation checks to attribute CEX parent sweeps.
• DEV 2 (ML/Model)  ==> 1. Add mixer detection heuristics (Tornado Cash, FixedFloat, ChangeNOW).
                    ==> 2. Package 0.0–1.0 node risk scoring function into the traversal engine.
• DEV 3 (Backend)   ==> 1. Implement SQLite Case Vault (save FIR #, IO Name, Complainant Loss).
                    ==> 2. Build automated PDF dossier generator with SHA-256 evidence integrity seal.
• DEV 4 (Frontend)  ==> 1. Build dual layout toggle (Dagre Linear Flow vs CoSE Entity Clusters).
                    ==> 2. Add Entity Inspector card showing target exchange, deposit address & sweep hash.
----------------------------------------------------------------------------------------------------
🎯 DEFINITION OF DONE (DoD 2):
Live Ethereum & TRON wallets trace through real explorer APIs; legal notice exports as a court-ready PDF.

====================================================================================================
MILESTONE 3: MULTI-CHAIN DEPTH & ADVANCED UI (Hours 12 – 20)
Objective: Polish investigation capabilities and expand exchange intelligence.
====================================================================================================
• YOU (Blockchain)  ==> [COMPLETED] 1. Build Bitcoin UTXO crawler (backend/app/crawlers/btc.py) via Mempool API.
                    ==> [COMPLETED] 2. Expand vasp_directory.json to indexed hot wallets (CoinDCX, WazirX, Binance).
                    ==> [COMPLETED] 3. Deploy CircuitBreaker & ResilientHttpClient with multi-provider failover.
• DEV 2 (ML/Model)  ==> Refine GNN / feature-based anomaly classifier for high-risk hop branches.
• DEV 3 (Backend)   ==> Build 1-click ZIP Evidence Export (Signed PDF Dossier + Raw JSON Trace Ledger).
• DEV 4 (Frontend)  ==> Build Timeline Playback Scrubber (animate transaction hops chronologically).
----------------------------------------------------------------------------------------------------
🎯 DEFINITION OF DONE (DoD 3):
Platform supports TRON, EVM, and BTC; timeline scrubber animates the money trail step-by-step.

====================================================================================================
MILESTONE 4: HARDENING, RESILIENCE & JURY REHEARSAL (Hours 20 – 24)
Objective: Bulletproof stability and pitch-perfect delivery for the SIH evaluation jury.
====================================================================================================
• YOU (Blockchain)  ==> [COMPLETED] Automated 25/25 test suite passing; live explorer queries verified.
• ALL DEVS TOGETHER:
  1. Fail-Safe Offline Test: Disconnect WiFi completely. Verify demo executes flawlessly in 0.3s.
  2. Pitch Story Alignment: Rehearse the 3-minute pitch:
     - 0:00–0:45: Victim story (Ramesh lost ₹15L; 1930 freezes fiat, but crypto goes dark).
     - 0:45–1:45: Live Demo (Paste wallet -> 4-second attribution -> Binance Hot Wallet hit).
     - 1:45–2:30: Legal Innovation (1-click Section 94 BNSS notice + Sec 63 BSA certificate).
     - 2:30–3:00: Business & Cost Disruption (₹3L Made-in-India GeM vs ₹50L Chainalysis).
----------------------------------------------------------------------------------------------------
🏆 FINAL OUTCOME: Production-grade, crash-proof, award-winning SIH prototype.
====================================================================================================
```

---

## 🔌 Cross-Developer Interface Contract (Zero Merge Conflicts)

```
        [ DEV 1: CRAWLERS ]                   [ DEV 2: ML & HEURISTICS ]
         (evm.py, tron.py)                       (peel.py, mixer.py)
                 │                                        │
                 ▼                                        ▼
    Normalized Transfer Dicts               {"risk_score": 0.85, ...}
                 │                                        │
                 └──────────────► ┌──────────────────┐ ◄──┘
                                  │ DEV 3: BACKEND   │
                                  │ (tracer.py)      │
                                  └────────┬─────────┘
                                           │
                                  TraceResponse JSON
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ DEV 4: FRONTEND  │
                                  │ (Cytoscape UI)   │
                                  └──────────────────┘
```
