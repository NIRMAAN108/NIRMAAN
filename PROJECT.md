# Project: NIRMAAN (ChainTrace AI) — Law Enforcement Cryptocurrency & Blockchain Intelligence Platform

## Architecture
NIRMAAN (ChainTrace AI) is an enterprise law enforcement cryptocurrency intelligence platform designed for Indian Law Enforcement Agencies (LEAs), State Cyber Crime Cells, and the Indian Cyber Crime Coordination Centre (I4C).

### Subsystems:
1. **Frontend (`frontend/app`)**:
   - Framework: React 19.3.1, Tailwind CSS v4.3.3, Cytoscape.js 3.34.4 with Dagre layout, Lucide-React 1.66.0, Vite 8.3.5.
   - Dev Server: Runs at `http://localhost:3000`.
   - Deployment: Static deployment at `https://app-eta-seven-81.vercel.app`.
   - Layout: In-flow permanent flex layout (`aside.shrink-0` and `div.flex-1.min-w-0`), guaranteeing 0px sidebar overlay on any viewport.
2. **Backend (`backend`)**:
   - Framework: FastAPI 0.111+, Uvicorn 0.29+, Pydantic v2 schemas.
   - Entry Point: `backend/app/main.py` at `http://127.0.0.1:8000`.
   - Database: SQLite3 WAL mode (`backend/app/data/case_vault.db`).
   - Graph Analytics: NetworkX 3.3 for multi-hop BFS, shortest path, directed cycle detection, PageRank, and betweenness centrality.
   - Legal Evidence Generators: ReportLab 5.1 for Section 94 BNSS court PDF dossiers, Section 63 BSA electronic certificates, FIU-IND PMLA STR JSONs, and court-sealed ZIP bundles with `SHA256SUMS.txt`.
3. **Live Blockchain Crawlers (`backend/app/crawlers`)**:
   - TRON: TronGrid REST API & Tronscan OpenAPI (TRC-20 USDT/TRX, energy delegation).
   - EVM: Blockscout v2 & Etherscan/BscScan (ERC-20/BEP-20 transfers, gas funders).
   - Bitcoin: Mempool.space REST & Blockstream Esplora (UTXO clustering, proportional satoshi attribution).
   - Resilient Client: Exponential backoff, jitter, circuit breaker, rate limit tracking.
4. **Automated Verification Harness (`frontend/app/tests` / `e2e`)**:
   - Tooling: Playwright (@playwright/test) utilizing local Google Chrome / Chromium.
   - Multi-Viewport Matrix: 10 viewports (320px, 375px, 390px, 412px, 768px, 820px, 1024px, 1280px, 1440px, 1920px).
   - Metric Assertions: `scrollWidth - innerWidth == 0` (0px horizontal overflow), `aside.right <= main.left` (0px overlap), zero console exceptions, and programmatic control interaction.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Navigation & Route Switching | 9 operational views (Dashboard, Investigation, Graph, Wallet, VASP, Legal Dossiers, Case Vault, Alerts, Settings, Help) + Standalone Canvas | M1 / M4 | Survey 1 |
| 2 | Header Global Controls | Breadcrumbs, back/home buttons, quick switcher, tactical alerts dropdown, officer profile dropdown, Ctrl+K search | M1 / M4 | Survey 1 |
| 3 | Form Submissions & Inputs | Suspect address input, chain selector, NCRP parser input, VASP modal form, Settings profile form | M1 / M2 | Survey 1 & 2 |
| 4 | Search Bars & Filters | Header search, Wallet tx search/filter, VASP search/status filter, Case Vault FIR search, Alerts multi-filter | M1 / M4 | Survey 1 |
| 5 | Cytoscape Canvas & Basic Controls | Interactive zoom in/out, fit to screen, node click inspection, edge click inspection | M1 / M3 | Survey 1 |
| 6 | Graph Layout Reset Button | Dedicated one-click "Reset Layout" toolbar button in React graph | M3 | Survey 1 |
| 7 | Timeline Scrubber Control | Interactive chronological range slider / scrubber stepping through transaction sequence hops by timestamp | M3 | Survey 1 |
| 8 | Multi-Hop BFS Forensic Tracer | Automated multi-hop tracing across TRON, EVM, BSC, and Bitcoin | M2 | Survey 2 |
| 9 | Live Blockchain Network Integration | Live queries directly to TronGrid, Blockscout, Mempool without synthetic/mock fallbacks | M2 | Survey 2 & R3 |
| 10 | Frontend Mock Fallback Removal | Eliminate 6s abort timeout in `api.js`, remove synthetic trace generation on live routes, eliminate empty graph mock nodes | M2 | Survey 2 & R3 |
| 11 | VASP Directory Live Data Binding | Fix `/api/vasps` object vs array payload binding in `VASPAttribution.jsx` so live registered VASPs display | M2 | Survey 2 |
| 12 | ML Risk Engine & Typology Classification | Node risk scoring (0.05-0.98), peeling chain detection, smurfing, dwell velocity, syndicate MO classification | M2 | Survey 2 |
| 13 | Statutory Legal Evidence Generation | Section 94 BNSS Notice, Section 63 BSA Certificate, PDF Dossier, Sealed ZIP Bundle, FIU-IND STR JSON | M2 | Survey 2 |
| 14 | Responsive Multi-Viewport Support | 10 viewports (320px to 1920px) with 0px horizontal overflow | M4 | Survey 1 & R2 |
| 15 | Header Responsive Compaction | Compact buttons/padding on 320px-412px viewports to eliminate search squeeze and header overflow | M4 | Survey 1 |
| 16 | CaseDetailModal Responsive Tab Bar | Add `overflow-x-auto` & `whitespace-nowrap` to prevent tab wrapping on mobile/tablet screens | M4 | Survey 1 |
| 17 | Window Resize Listener | Dynamic resize handler in `App.jsx` to collapse sidebar when resizing below 1024px | M4 | Survey 1 |
| 18 | Sidebar In-Flow Verification | Guarantee `aside.shrink-0` remains in flow without covering or overlapping dashboard content | M1 / M4 | Survey 1 & R2 |
| 19 | Automated Verification Test Suite | Playwright automated test scripts for all 10 viewports, control exercisers, overflow assertions, console interceptor | M1 / M5 | Survey 3 & R4 |
| 20 | Frontend Code Cleanliness & Linting | Resolve ESLint problems in frontend (`api.js`, `Header.jsx`, `TransactionGraph.jsx`, `VASPAttribution.jsx`) | M4 | Survey 3 |
| 21 | Comprehensive Audit Documentation | Full documentation of all components, 10-viewport metrics, defects remediated, and verification proof | M5 | Survey 1-3 & R6 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Automated E2E Verification Harness (Test Track) | Install Playwright, build test runner covering all 10 viewports, 0px overflow assertion, sidebar in-flow check, console log monitor, control exercisers; publish `TEST_READY.md` and `TEST_INFRA.md` | none | DONE |
| M2 | Live Backend & Blockchain Network Integration | Remove frontend 6s timeout and silent mock fallbacks in `api.js`, remove mock graph injection in `TransactionGraph.jsx`, fix VASP directory array binding in `VASPAttribution.jsx`, verify live crawler queries (TronGrid, Blockscout, Mempool) | none | DONE |
| M3 | Graph Controls Enhancement | Implement interactive timeline scrubber control in `TransactionGraph.jsx`, implement dedicated one-click layout reset button in toolbar, verify node inspection drawer and canvas controls | none | DONE |
| M4 | Responsive Multi-Viewport Layout & Defect Remediation | Remediate 320px header compaction, fix `CaseDetailModal.jsx` tab bar overflow, add window resize listener in `App.jsx`, resolve ESLint errors across frontend components | M2, M3 | DONE |
| M5 | 100% E2E Verification Pass, Adversarial Hardening & Audit Report | Execute full Playwright test suite across all 10 viewports, verify zero console errors, zero overflow, live data flows, adversarial hardening (Tier 5), author comprehensive audit report (`AUDIT_REPORT.md`) | M1, M2, M3, M4 | DONE |

---

## Interface Contracts

### 1. Frontend API Client (`frontend/app/src/services/api.js`) ↔ Backend (`backend/app/main.py`)
- `POST /api/trace`:
  - Request: `{ address: string, chain?: string, max_depth?: number, user_direction?: string }`
  - Response: `{ case_id: string, seed: string, chain: string, total_nodes: number, total_edges: number, nodes: Node[], edges: Edge[], alerts: Alert[], statistics: Stats, is_synthetic: boolean }`
  - Requirement: Timeout must be at least 30,000ms. If backend fails or is offline, must throw or display explicit live network error rather than silently injecting synthetic mock data.
- `GET /api/vasps`:
  - Response: `{ vasps: { [vaspId: string]: VaspRecord } }`
  - Frontend parsing: must handle `{ vasps: {...} }` and convert to array format `Object.values(data.vasps)` so live directory populates.
- `POST /api/cases`:
  - Request: `{ fir_number: string, police_station: string, io_name: string, io_rank: string, trace_data: object }`
  - Response: CaseRecord with HTTP 201.
- `GET /api/cases/{case_id}/dossier` -> application/pdf
- `GET /api/cases/{case_id}/bundle` -> application/zip
- `GET /api/cases/{case_id}/str` -> application/json

### 2. Graph Controls ↔ Cytoscape Core (`TransactionGraph.jsx`)
- **Zoom In/Out**: `cy.zoom(zoom * factor)`
- **Fit View**: `cy.fit(null, 60)`
- **Reset Layout**: Re-run active layout algorithm (`dagre`, `breadthfirst`, etc.) and reset camera zoom & pan.
- **Timeline Scrubber**: `<input type="range" min={minTime} max={maxTime} step={step} value={currentTime} ... />` filtering elements:
  - Edges with `edge.timestamp <= currentTime` remain visible (`display: element`), future edges are hidden (`display: none`).
  - Active nodes connected to visible edges remain visible; isolated future nodes are hidden.
  - Controls: Play/Pause, Step Forward/Backward, Reset, and Live timestamp scrubber readout.

### 3. Layout & Multi-Viewport Constraints
- Viewports: 320px, 375px, 390px, 412px, 768px, 820px, 1024px, 1280px, 1440px, 1920px.
- `document.documentElement.scrollWidth <= window.innerWidth` (strictly 0px horizontal page overflow).
- `aside.getBoundingClientRect().right <= main.getBoundingClientRect().left + 0.5` (strictly 0px sidebar overlap).

---

## Code Layout

### Frontend (`frontend/app/`)
- `src/App.jsx` — Core layout container, routing, sidebar collapse state, resize listener.
- `src/components/layout/Header.jsx` — Header controls, global search, breadcrumbs, tactical alerts, profile.
- `src/components/layout/Sidebar.jsx` — In-flow sidebar navigation links and state.
- `src/components/modals/CaseDetailModal.jsx` — 4-tab case detail modal with Section 94 notice and evidence downloads.
- `src/pages/Dashboard.jsx` — Executive metrics, health status, recent case table.
- `src/pages/Investigation.jsx` — BFS tracer launchpad, 1-click presets, trace status indicator.
- `src/pages/TransactionGraph.jsx` — Cytoscape canvas, layout toolbar, zoom/fit pills, timeline scrubber, inspection drawer.
- `src/pages/WalletDetails.jsx` — Wallet telemetry, risk breakdown, transaction table.
- `src/pages/VASPAttribution.jsx` — VASP directory, live attribution, new attribution modal.
- `src/pages/CaseManagement.jsx` — Case Vault table, FIR search, dossier/bundle downloads.
- `src/pages/IntelligenceAlerts.jsx` — National telemetry threat feed, multi-criteria filters.
- `src/pages/Settings.jsx` — IO profile, BNSS/BSA settings, RPC configurations, FIU directory.
- `src/pages/HelpDocs.jsx` — SOPs, statutory references, FAQ accordions.
- `src/services/api.js` — Live API client, live trace requests, endpoint URLs.
- `tests/` or `e2e/` — Automated Playwright browser test suite.

### Backend (`backend/`)
- `app/main.py` — FastAPI application, route handlers, CORS, health checks.
- `app/crawlers/` — MultiChainCrawler, TRON, EVM, Bitcoin live explorers.
- `app/ml/` — Scorer, peeling, structuring, mixer directory, syndicate MO classifier.
- `app/core/` — Section 94 legal notice, Section 63 certificate, PDF dossier, ZIP bundle, PMLA STR.
- `app/db/` — SQLite database, case service, schema migrations.
- `tests/` — pytest forensics suite, crawler resilience, ML validation.
