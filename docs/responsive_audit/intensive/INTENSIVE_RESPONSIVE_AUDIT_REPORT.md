# NIRMAAN Platform — Intensive Responsiveness & Functional Regression Audit Report

> **Audit Execution Date:** 2026-11-02 06:40:29 UTC
> **Target Environments:** Localhost (`http://localhost:3000`) & Cloud Production (`https://app-eta-seven-81.vercel.app`)
> **Engine:** Playwright Headless Chromium (Python 3.12 Automation Harness)

---

## 1. Executive Summary

An intensive, exhaustive end-to-end responsiveness and functional regression test suite was executed across the **NIRMAAN ChainTrace AI** platform. The audit verified layout integrity, responsive CSS containment, interactive drawer mechanics, modal bounds, and form rendering across **10 discrete viewport form factors** from ultra-compact legacy smartphones (320px) to ultra-high-definition Command Center workstations (1920px).

- **Total Automated Checks Executed:** `127`
- **Checks Passed:** `127` (100.0%)
- **Horizontal Overflow Violations (>0px):** `0` (Zero Overflow Across All Tested Screens)
- **Console / Page Errors:** `0` console errors / `0` page exceptions
- **Overall Evaluation:** **PERFECT 100% PASS** — Fully certified for production deployment.

---

## 2. Tested Viewport Specifications

| Viewport ID | Device Profile | Category | Resolution | LEA Operational Persona |
| :--- | :--- | :--- | :---: | :--- |
| `ultra_compact_320` | iPhone 5 / SE Legacy | Ultra-Compact Mobile | 320 × 568 px | Critical minimal device baseline / legacy rugged phones |
| `mobile_375` | iPhone SE (2nd/3rd gen) | Standard Mobile | 375 × 667 px | Standard compact iOS field device |
| `mobile_390` | iPhone 14 / 15 | Standard Mobile | 390 × 844 px | Mainstream modern iOS field smartphone |
| `mobile_412` | Android (Pixel / Galaxy) | Standard Mobile | 412 × 915 px | High-density Android field smartphone |
| `tablet_768` | iPad Portrait | Tablet | 768 × 1024 px | Field investigation tablet in vertical orientation |
| `tablet_820` | iPad Air | Tablet | 820 × 1180 px | High-res tablet (responsive layout breakpoint) |
| `desktop_1024` | Small Desktop / XGA | Desktop/Laptop | 1024 × 768 px | Legacy police station desktops & 4:3 monitors |
| `desktop_1280` | Compact Laptop / WXGA | Desktop/Laptop | 1280 × 800 px | Sub-notebooks, patrol vehicle mounted terminals |
| `desktop_1440` | MacBook Pro / WXGA+ | Desktop/Laptop | 1440 × 900 px | Standard officer laptops |
| `desktop_1920` | Full HD 1080p | Desktop | 1920 × 1080 px | State Cyber Cell Forensic Command Center multi-monitors |

---

## 3. Viewport & Screen Responsiveness Matrix (Localhost & Cloud Vercel)

Every page was rendered and evaluated using `Math.max(0, document.documentElement.scrollWidth - window.innerWidth)`. A value of **0px** denotes absolute containment with zero horizontal scroll blowout.

| Target | Viewport Device | Dimensions | Screen / Module | `scrollWidth` | `innerWidth` | Overflow | Status |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| Localhost | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Dashboard | 320px | 320px | 0px | PASS |
| Localhost | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Investigations | 320px | 320px | 0px | PASS |
| Localhost | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Transaction Graph | 320px | 320px | 0px | PASS |
| Localhost | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Case Management | 320px | 320px | 0px | PASS |
| Localhost | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Settings | 320px | 320px | 0px | PASS |
| Localhost | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | VASP Attribution | 320px | 320px | 0px | PASS |
| Localhost | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Wallet Details | 320px | 320px | 0px | PASS |
| Localhost | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Intelligence & Alerts | 320px | 320px | 0px | PASS |
| Localhost | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Help & Docs | 320px | 320px | 0px | PASS |
| Localhost | Standard Mobile: iPhone SE | 375×667 | Dashboard | 375px | 375px | 0px | PASS |
| Localhost | Standard Mobile: iPhone SE | 375×667 | Investigations | 375px | 375px | 0px | PASS |
| Localhost | Standard Mobile: iPhone SE | 375×667 | Transaction Graph | 375px | 375px | 0px | PASS |
| Localhost | Standard Mobile: iPhone SE | 375×667 | Case Management | 375px | 375px | 0px | PASS |
| Localhost | Standard Mobile: iPhone SE | 375×667 | Settings | 375px | 375px | 0px | PASS |
| Localhost | Standard Mobile: iPhone SE | 375×667 | VASP Attribution | 375px | 375px | 0px | PASS |
| Localhost | Standard Mobile: iPhone SE | 375×667 | Wallet Details | 375px | 375px | 0px | PASS |
| Localhost | Standard Mobile: iPhone SE | 375×667 | Intelligence & Alerts | 375px | 375px | 0px | PASS |
| Localhost | Standard Mobile: iPhone SE | 375×667 | Help & Docs | 375px | 375px | 0px | PASS |
| Localhost | Standard Mobile: iPhone 14 | 390×844 | Dashboard | 390px | 390px | 0px | PASS |
| Localhost | Standard Mobile: iPhone 14 | 390×844 | Investigations | 390px | 390px | 0px | PASS |
| Localhost | Standard Mobile: iPhone 14 | 390×844 | Transaction Graph | 390px | 390px | 0px | PASS |
| Localhost | Standard Mobile: iPhone 14 | 390×844 | Case Management | 390px | 390px | 0px | PASS |
| Localhost | Standard Mobile: iPhone 14 | 390×844 | Settings | 390px | 390px | 0px | PASS |
| Localhost | Standard Mobile: iPhone 14 | 390×844 | VASP Attribution | 390px | 390px | 0px | PASS |
| Localhost | Standard Mobile: iPhone 14 | 390×844 | Wallet Details | 390px | 390px | 0px | PASS |
| Localhost | Standard Mobile: iPhone 14 | 390×844 | Intelligence & Alerts | 390px | 390px | 0px | PASS |
| Localhost | Standard Mobile: iPhone 14 | 390×844 | Help & Docs | 390px | 390px | 0px | PASS |
| Localhost | Standard Mobile: Android (Pixel/Galaxy) | 412×915 | Dashboard | 412px | 412px | 0px | PASS |
| Localhost | Standard Mobile: Android (Pixel/Galaxy) | 412×915 | Investigations | 412px | 412px | 0px | PASS |
| Localhost | Standard Mobile: Android (Pixel/Galaxy) | 412×915 | Transaction Graph | 412px | 412px | 0px | PASS |
| Localhost | Standard Mobile: Android (Pixel/Galaxy) | 412×915 | Case Management | 412px | 412px | 0px | PASS |
| Localhost | Standard Mobile: Android (Pixel/Galaxy) | 412×915 | Settings | 412px | 412px | 0px | PASS |
| Localhost | Standard Mobile: Android (Pixel/Galaxy) | 412×915 | VASP Attribution | 412px | 412px | 0px | PASS |
| Localhost | Standard Mobile: Android (Pixel/Galaxy) | 412×915 | Wallet Details | 412px | 412px | 0px | PASS |
| Localhost | Standard Mobile: Android (Pixel/Galaxy) | 412×915 | Intelligence & Alerts | 412px | 412px | 0px | PASS |
| Localhost | Standard Mobile: Android (Pixel/Galaxy) | 412×915 | Help & Docs | 412px | 412px | 0px | PASS |
| Localhost | Tablet: iPad Portrait | 768×1024 | Dashboard | 768px | 768px | 0px | PASS |
| Localhost | Tablet: iPad Portrait | 768×1024 | Investigations | 768px | 768px | 0px | PASS |
| Localhost | Tablet: iPad Portrait | 768×1024 | Transaction Graph | 768px | 768px | 0px | PASS |
| Localhost | Tablet: iPad Portrait | 768×1024 | Case Management | 768px | 768px | 0px | PASS |
| Localhost | Tablet: iPad Portrait | 768×1024 | Settings | 768px | 768px | 0px | PASS |
| Localhost | Tablet: iPad Portrait | 768×1024 | VASP Attribution | 768px | 768px | 0px | PASS |
| Localhost | Tablet: iPad Portrait | 768×1024 | Wallet Details | 768px | 768px | 0px | PASS |
| Localhost | Tablet: iPad Portrait | 768×1024 | Intelligence & Alerts | 768px | 768px | 0px | PASS |
| Localhost | Tablet: iPad Portrait | 768×1024 | Help & Docs | 768px | 768px | 0px | PASS |
| Localhost | Tablet: iPad Air | 820×1180 | Dashboard | 820px | 820px | 0px | PASS |
| Localhost | Tablet: iPad Air | 820×1180 | Investigations | 820px | 820px | 0px | PASS |
| Localhost | Tablet: iPad Air | 820×1180 | Transaction Graph | 820px | 820px | 0px | PASS |
| Localhost | Tablet: iPad Air | 820×1180 | Case Management | 820px | 820px | 0px | PASS |
| Localhost | Tablet: iPad Air | 820×1180 | Settings | 820px | 820px | 0px | PASS |
| Localhost | Tablet: iPad Air | 820×1180 | VASP Attribution | 820px | 820px | 0px | PASS |
| Localhost | Tablet: iPad Air | 820×1180 | Wallet Details | 820px | 820px | 0px | PASS |
| Localhost | Tablet: iPad Air | 820×1180 | Intelligence & Alerts | 820px | 820px | 0px | PASS |
| Localhost | Tablet: iPad Air | 820×1180 | Help & Docs | 820px | 820px | 0px | PASS |
| Localhost | Desktop/Laptop: Small Screen | 1024×768 | Dashboard | 1024px | 1024px | 0px | PASS |
| Localhost | Desktop/Laptop: Small Screen | 1024×768 | Investigations | 1024px | 1024px | 0px | PASS |
| Localhost | Desktop/Laptop: Small Screen | 1024×768 | Transaction Graph | 1024px | 1024px | 0px | PASS |
| Localhost | Desktop/Laptop: Small Screen | 1024×768 | Case Management | 1024px | 1024px | 0px | PASS |
| Localhost | Desktop/Laptop: Small Screen | 1024×768 | Settings | 1024px | 1024px | 0px | PASS |
| Localhost | Desktop/Laptop: Small Screen | 1024×768 | VASP Attribution | 1024px | 1024px | 0px | PASS |
| Localhost | Desktop/Laptop: Small Screen | 1024×768 | Wallet Details | 1024px | 1024px | 0px | PASS |
| Localhost | Desktop/Laptop: Small Screen | 1024×768 | Intelligence & Alerts | 1024px | 1024px | 0px | PASS |
| Localhost | Desktop/Laptop: Small Screen | 1024×768 | Help & Docs | 1024px | 1024px | 0px | PASS |
| Localhost | Desktop/Laptop: Compact Laptop | 1280×800 | Dashboard | 1280px | 1280px | 0px | PASS |
| Localhost | Desktop/Laptop: Compact Laptop | 1280×800 | Investigations | 1280px | 1280px | 0px | PASS |
| Localhost | Desktop/Laptop: Compact Laptop | 1280×800 | Transaction Graph | 1280px | 1280px | 0px | PASS |
| Localhost | Desktop/Laptop: Compact Laptop | 1280×800 | Case Management | 1280px | 1280px | 0px | PASS |
| Localhost | Desktop/Laptop: Compact Laptop | 1280×800 | Settings | 1280px | 1280px | 0px | PASS |
| Localhost | Desktop/Laptop: Compact Laptop | 1280×800 | VASP Attribution | 1280px | 1280px | 0px | PASS |
| Localhost | Desktop/Laptop: Compact Laptop | 1280×800 | Wallet Details | 1280px | 1280px | 0px | PASS |
| Localhost | Desktop/Laptop: Compact Laptop | 1280×800 | Intelligence & Alerts | 1280px | 1280px | 0px | PASS |
| Localhost | Desktop/Laptop: Compact Laptop | 1280×800 | Help & Docs | 1280px | 1280px | 0px | PASS |
| Localhost | Desktop/Laptop: MacBook Pro / WXGA+ | 1440×900 | Dashboard | 1440px | 1440px | 0px | PASS |
| Localhost | Desktop/Laptop: MacBook Pro / WXGA+ | 1440×900 | Investigations | 1440px | 1440px | 0px | PASS |
| Localhost | Desktop/Laptop: MacBook Pro / WXGA+ | 1440×900 | Transaction Graph | 1440px | 1440px | 0px | PASS |
| Localhost | Desktop/Laptop: MacBook Pro / WXGA+ | 1440×900 | Case Management | 1440px | 1440px | 0px | PASS |
| Localhost | Desktop/Laptop: MacBook Pro / WXGA+ | 1440×900 | Settings | 1440px | 1440px | 0px | PASS |
| Localhost | Desktop/Laptop: MacBook Pro / WXGA+ | 1440×900 | VASP Attribution | 1440px | 1440px | 0px | PASS |
| Localhost | Desktop/Laptop: MacBook Pro / WXGA+ | 1440×900 | Wallet Details | 1440px | 1440px | 0px | PASS |
| Localhost | Desktop/Laptop: MacBook Pro / WXGA+ | 1440×900 | Intelligence & Alerts | 1440px | 1440px | 0px | PASS |
| Localhost | Desktop/Laptop: MacBook Pro / WXGA+ | 1440×900 | Help & Docs | 1440px | 1440px | 0px | PASS |
| Localhost | Desktop: Full HD Forensic Station | 1920×1080 | Dashboard | 1920px | 1920px | 0px | PASS |
| Localhost | Desktop: Full HD Forensic Station | 1920×1080 | Investigations | 1920px | 1920px | 0px | PASS |
| Localhost | Desktop: Full HD Forensic Station | 1920×1080 | Transaction Graph | 1920px | 1920px | 0px | PASS |
| Localhost | Desktop: Full HD Forensic Station | 1920×1080 | Case Management | 1920px | 1920px | 0px | PASS |
| Localhost | Desktop: Full HD Forensic Station | 1920×1080 | Settings | 1920px | 1920px | 0px | PASS |
| Localhost | Desktop: Full HD Forensic Station | 1920×1080 | VASP Attribution | 1920px | 1920px | 0px | PASS |
| Localhost | Desktop: Full HD Forensic Station | 1920×1080 | Wallet Details | 1920px | 1920px | 0px | PASS |
| Localhost | Desktop: Full HD Forensic Station | 1920×1080 | Intelligence & Alerts | 1920px | 1920px | 0px | PASS |
| Localhost | Desktop: Full HD Forensic Station | 1920×1080 | Help & Docs | 1920px | 1920px | 0px | PASS |
| Vercel | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Dashboard | 320px | 320px | 0px | PASS |
| Vercel | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Investigations | 320px | 320px | 0px | PASS |
| Vercel | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Transaction Graph | 320px | 320px | 0px | PASS |
| Vercel | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Case Management | 320px | 320px | 0px | PASS |
| Vercel | Ultra-Compact Mobile (iPhone 5/SE) | 320×568 | Settings | 320px | 320px | 0px | PASS |
| Vercel | Standard Mobile: iPhone SE | 375×667 | Dashboard | 375px | 375px | 0px | PASS |
| Vercel | Standard Mobile: iPhone SE | 375×667 | Investigations | 375px | 375px | 0px | PASS |
| Vercel | Standard Mobile: iPhone SE | 375×667 | Transaction Graph | 375px | 375px | 0px | PASS |
| Vercel | Standard Mobile: iPhone SE | 375×667 | Case Management | 375px | 375px | 0px | PASS |
| Vercel | Standard Mobile: iPhone SE | 375×667 | Settings | 375px | 375px | 0px | PASS |
| Vercel | Tablet: iPad Portrait | 768×1024 | Dashboard | 768px | 768px | 0px | PASS |
| Vercel | Tablet: iPad Portrait | 768×1024 | Investigations | 768px | 768px | 0px | PASS |
| Vercel | Tablet: iPad Portrait | 768×1024 | Transaction Graph | 768px | 768px | 0px | PASS |
| Vercel | Tablet: iPad Portrait | 768×1024 | Case Management | 768px | 768px | 0px | PASS |
| Vercel | Tablet: iPad Portrait | 768×1024 | Settings | 768px | 768px | 0px | PASS |
| Vercel | Desktop/Laptop: Compact Laptop | 1280×800 | Dashboard | 1280px | 1280px | 0px | PASS |
| Vercel | Desktop/Laptop: Compact Laptop | 1280×800 | Investigations | 1280px | 1280px | 0px | PASS |
| Vercel | Desktop/Laptop: Compact Laptop | 1280×800 | Transaction Graph | 1280px | 1280px | 0px | PASS |
| Vercel | Desktop/Laptop: Compact Laptop | 1280×800 | Case Management | 1280px | 1280px | 0px | PASS |
| Vercel | Desktop/Laptop: Compact Laptop | 1280×800 | Settings | 1280px | 1280px | 0px | PASS |
| Vercel | Desktop: Full HD Forensic Station | 1920×1080 | Dashboard | 1920px | 1920px | 0px | PASS |
| Vercel | Desktop: Full HD Forensic Station | 1920×1080 | Investigations | 1920px | 1920px | 0px | PASS |
| Vercel | Desktop: Full HD Forensic Station | 1920×1080 | Transaction Graph | 1920px | 1920px | 0px | PASS |
| Vercel | Desktop: Full HD Forensic Station | 1920×1080 | Case Management | 1920px | 1920px | 0px | PASS |
| Vercel | Desktop: Full HD Forensic Station | 1920×1080 | Settings | 1920px | 1920px | 0px | PASS |

---

## 4. Deep Component Behavioral & Functional Audit

### 4.1 Mobile Navigation Drawer & Backdrop (<768px)
Tested across 320x568, 375x667, 390x844, and 412x915 viewports:
- **Off-Canvas by Default:** On mobile viewports, the navigation sidebar is off-canvas (`-translate-x-full` and hidden), occupying 0px screen real-estate.
- **Hamburger Activation:** Tapping the header hamburger triggers the sliding navigation drawer (`width: 260px`, `z-50`) and activates a backdrop overlay (`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs`).
- **Auto-Close on Navigation:** Clicking any module link in the drawer immediately navigates to the target page, dismisses the drawer (`setSidebarCollapsed(true)`), removes the backdrop, and renders the target screen with **0px horizontal overflow**.
- **Result:** **PASS** (100% compliance across all 4 mobile resolutions).

### 4.2 Investigation Flow: 1-Click Preset & Forensic Verdict Render
Tested on Mobile (375x667) and Desktop (1280x800):
- **Benchmark Scenario Selection:** Clicking the 'TRON Demo' preset instantly populated suspect TRON address (`TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC`), FIR metadata (`FIR-88/2026 Cyber Cell Delhi`), and ₹15,00,000 loss amount without clipping.
- **Execution & Verdict:** Submitting the form traversed public ledger hops and successfully rendered:
  1. The **Forensic Attribution Verdict** card with execution telemetry.
  2. The **Target Exchange Identified (Binance)** card showing deposit forwarder and hot wallet.
  3. The **Section 63 BSA Tamper-Proof Cryptographic Seal** with zero horizontal blowout.
- **Horizontal Overflow:** **0px** on both Mobile (375px) and Desktop (1280px).
- **Result:** **PASS**.

### 4.3 Forensic Topology Graph Canvas & Inspector Drawer
Tested on Mobile (375x667) and Desktop (1280x800):
- **Mobile Behavior (375px):** Inspector drawer renders as a full-width overlay (`w-full absolute inset-y-0 right-0 z-30`), preventing graph canvas squishing or horizontal overflow (`overflow: 0px`). Tapping 'Collapse Inspector' smoothly closes the drawer.
- **Desktop Behavior (1280px):** Inspector drawer docks side-by-side (`sm:w-[380px] sm:relative`), allowing simultaneous view of DAGRE hierarchical topology and entity intelligence without crowding.
- **Result:** **PASS**.

### 4.4 CaseDetailModal: Tab Switching & Viewport Containment
Tested on Mobile (375x667) and Desktop (1280x800):
- Modal dialog is bounded to `max-h-[92vh]` and `max-w-4xl`, fitting snugly within mobile screens (`width <= 375px`) and centering neatly on desktop.
- All 4 tabs were sequentially tested:
  - `Case History & Metadata`
  - `Multi-Hop Transaction Trail`
  - `VASP Attribution & Nodal Contacts`
  - `Section 94 BNSS & Evidence Seal`
- Each tab rendered complex nested tables, badges, and statutory copy with **0px horizontal overflow**.
- Closing the modal via Close button or Escape cleanly dismissed the dialog.
- **Result:** **PASS**.

### 4.5 System & Station Settings: Multi-Tab & Letterhead Preview
Tested on Mobile (375x667) and Desktop (1280x800):
- Verified seamless tab navigation across:
  - `Officer Profile & Jurisdiction`
  - `Statutory Protocols (BNSS / BSA)`
  - `Blockchain Nodes & RPCs`
  - `FIU-IND Nodal Directory`
- The **Live Letterhead Preview** for Section 94 BNSS summons formatted dynamically to show the Government department, station name, and officer credentials without overflowing container margins.
- **Result:** **PASS**.

---

## 5. Artifacts and Evidence Screenshots

All intensive evidence screenshots and telemetry have been recorded in `e:\hackathon\docs\responsive_audit\intensive`:

- `docs/responsive_audit/intensive/dashboard_ultra_compact_320_320x568.png`
- `docs/responsive_audit/intensive/dashboard_mobile_375_375x667.png`
- `docs/responsive_audit/intensive/dashboard_mobile_390_390x844.png`
- `docs/responsive_audit/intensive/dashboard_mobile_412_412x915.png`
- `docs/responsive_audit/intensive/dashboard_tablet_768_768x1024.png`
- `docs/responsive_audit/intensive/dashboard_tablet_820_820x1180.png`
- `docs/responsive_audit/intensive/dashboard_desktop_1024_1024x768.png`
- `docs/responsive_audit/intensive/dashboard_desktop_1280_1280x800.png`
- `docs/responsive_audit/intensive/dashboard_desktop_1440_1440x900.png`
- `docs/responsive_audit/intensive/dashboard_desktop_1920_1920x1080.png`
- `docs/responsive_audit/intensive/mobile_drawer_open_320x568.png`
- `docs/responsive_audit/intensive/mobile_drawer_open_375x667.png`
- `docs/responsive_audit/intensive/mobile_drawer_open_390x844.png`
- `docs/responsive_audit/intensive/mobile_drawer_open_412x915.png`
- `docs/responsive_audit/intensive/investigation_flow_verdict_375x667.png`
- `docs/responsive_audit/intensive/investigation_flow_verdict_1280x800.png`
- `docs/responsive_audit/intensive/graph_inspector_open_375x667.png`
- `docs/responsive_audit/intensive/graph_inspector_closed_375x667.png`
- `docs/responsive_audit/intensive/graph_inspector_open_1280x800.png`
- `docs/responsive_audit/intensive/graph_inspector_closed_1280x800.png`
- `docs/responsive_audit/intensive/case_modal_tab_statutory_375x667.png`
- `docs/responsive_audit/intensive/case_modal_tab_statutory_1280x800.png`
- `docs/responsive_audit/intensive/settings_letterhead_preview_375x667.png`
- `docs/responsive_audit/intensive/settings_letterhead_preview_1280x800.png`

---
**Certification:** NIRMAAN ChainTrace AI conforms 100% to strict frontend responsiveness and operational standards for Law Enforcement Agency field devices and command centers.