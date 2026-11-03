# NIRMAAN (ChainTrace AI) — Test Infrastructure Specification

## 1. Overview
This document specifies the end-to-end automated testing harness implemented for the NIRMAAN (ChainTrace AI) cryptocurrency and blockchain intelligence platform. The test harness provides continuous automated verification across all views, UI controls, multi-viewport layout constraints, and forensic investigation workflows.

---

## 2. Technical Stack
- **Framework**: Playwright (`@playwright/test` v1.64.1)
- **Browser Channel**: System Google Chrome (`channel: 'chrome'`, located at `C:\Program Files\Google\Chrome\Application\chrome.exe`)
- **Execution Mode**: Headless with 1 worker to ensure deterministic state and prevent port/resource collisions
- **Target URL**: Default `http://localhost:3000` (auto-spawned by Playwright's `webServer` using Vite dev server), configurable via `BASE_URL` environment variable to audit live cloud deployment (e.g., `https://app-eta-seven-81.vercel.app`)
- **Reporters**:
  * List console reporter
  * JSON reporter (`frontend/app/playwright-report/results.json`)
  * HTML reporter (`frontend/app/playwright-report/html/index.html`)

---

## 3. Test Suites & Tier Architecture

| Suite | File Path | Scope & Assertions | Cases Count |
|---|---|---|---|
| **Tier 1: Controls** | `frontend/app/tests/tier1-controls.spec.js` | Interactive UI controls across all 9 views + standalone graph: navigation switching, sidebar toggle, home/back buttons, Ctrl+K omnibox search, quick switcher, alerts menu, officer profile menu, investigation form & 1-click presets, VASP directory & creation modal, Case Vault table & 4-tab inspection modal, Settings tabs & persistence, and Cytoscape graph toolbar/zoom/fit/export. | 9 tests |
| **Tier 2: Viewports** | `frontend/app/tests/tier2-viewports.spec.js` | 10 target viewports (320px to 1920px). Asserts strictly 0px horizontal page overflow (`scrollWidth - innerWidth <= 0`), in-flow permanent sidebar non-overlap (`aside.right <= main.left + 0.5px`), and zero unhandled JavaScript exceptions or console errors across core operational views. | 10 tests |
| **Tier 3: Workflows** | `frontend/app/tests/tier3-workflows.spec.js` | End-to-end user journeys: Dashboard → Case Details Modal → Graph Canvas → Vault; Omnibox search routing (0x/TRON wallet addresses and FIR numbers); VASP attribution registration and selection; Officer settings presets and header profile synchronization. | 4 tests |
| **Tier 4: Live Trace** | `frontend/app/tests/tier4-livetrace.spec.js` | Deep forensic tracing verification: missing parameter form validation, multi-chain benchmark presets (TRON TRC-20, EVM, Bitcoin UTXO), automated multi-hop trace execution, Section 63 BSA tamper-proof SHA-256 seal presence, direct transition to topology canvas, and statutory evidence artifact URL verification (`/api/cases/{caseId}/dossier`, `/api/cases/{caseId}/bundle`). | 5 tests |
| **Shared Helpers** | `frontend/app/tests/helpers/test-utils.js` | Viewport dimensions matrix, layout metric evaluator (`evaluateLayoutMetrics`), error listener interceptor (`attachErrorListeners`), and resilient navigation dispatcher (`navigateToModule`). | Helper |

---

## 4. Multi-Viewport Specification Matrix

| Viewport ID | Device Class | Width (px) | Height (px) | Overflow Max | Sidebar Constraint | Exception Assertion |
|---|---|---|---|---|---|---|
| VP-01 | Mobile S (iPhone SE) | 320 | 568 | 0px | In-Flow (`aside.right <= main.left + 0.5`) | Zero errors |
| VP-02 | Mobile M (iPhone 8) | 375 | 667 | 0px | In-Flow (`aside.right <= main.left + 0.5`) | Zero errors |
| VP-03 | Mobile L (iPhone 12/13/14) | 390 | 844 | 0px | In-Flow (`aside.right <= main.left + 0.5`) | Zero errors |
| VP-04 | Mobile Android (Pixel/Galaxy) | 412 | 915 | 0px | In-Flow (`aside.right <= main.left + 0.5`) | Zero errors |
| VP-05 | Tablet Portrait (iPad Mini) | 768 | 1024 | 0px | In-Flow (`aside.right <= main.left + 0.5`) | Zero errors |
| VP-06 | Tablet Air (iPad Air) | 820 | 1180 | 0px | In-Flow (`aside.right <= main.left + 0.5`) | Zero errors |
| VP-07 | Desktop Small / Laptop | 1024 | 768 | 0px | In-Flow (`aside.right <= main.left + 0.5`) | Zero errors |
| VP-08 | Standard Desktop | 1280 | 800 | 0px | In-Flow (`aside.right <= main.left + 0.5`) | Zero errors |
| VP-09 | Desktop HD | 1440 | 900 | 0px | In-Flow (`aside.right <= main.left + 0.5`) | Zero errors |
| VP-10 | Full HD Desktop | 1920 | 1080 | 0px | In-Flow (`aside.right <= main.left + 0.5`) | Zero errors |

---

## 5. Execution Commands

From repository root:
```powershell
# Run the complete verification test suite (all 28 tests)
npm --prefix frontend/app test

# Run individual tiers
npm --prefix frontend/app run test:tier1    # Interactive controls
npm --prefix frontend/app run test:tier2    # 10 Viewports matrix
npm --prefix frontend/app run test:tier3    # Cross-feature workflows
npm --prefix frontend/app run test:tier4    # Live trace & forensic scenarios

# Run against live cloud deployment (optional)
$env:BASE_URL="https://app-eta-seven-81.vercel.app"; npm --prefix frontend/app test
```

From `frontend/app` directory:
```powershell
cd frontend/app
npm test
```
