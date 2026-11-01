# NIRMAAN (ChainTrace AI) 🛡️⛓️

> **Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported Suspect Wallet Addresses through Automated Blockchain Analytics**  
> **SIH Problem Statement:** SIH26183  
> **Issuing Ministry:** Ministry of Home Affairs (MHA) / Indian Cybercrime Coordination Centre (I4C)  
> **Domain:** Blockchain & Cybersecurity  

[![Live Demo](https://img.shields.io/badge/Live_Production_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://app-eta-seven-81.vercel.app)
[![Standalone Graph Canvas](https://img.shields.io/badge/Standalone_WebGL_Canvas-Live-0284c7?style=for-the-badge&logo=cytoscape&logoColor=white)](https://app-eta-seven-81.vercel.app/standalone-graph.html)
[![Test Suite](https://img.shields.io/badge/Test_Suite-35%2F35_Passing-10b981?style=for-the-badge&logo=pytest&logoColor=white)](./backend/tests/test_forensics_suite.py)
[![Statutory Alignment](https://img.shields.io/badge/Statutory_Standard-BNSS_%26_BSA_2023-blue?style=for-the-badge)](./docs/RESEARCH.md)

---

## 🌐 Live Deployments & Interactive Links

* 🚀 **Production Application:** **[https://app-eta-seven-81.vercel.app](https://app-eta-seven-81.vercel.app)**
* 🕸️ **Standalone Cytoscape Canvas:** **[https://app-eta-seven-81.vercel.app/standalone-graph.html](https://app-eta-seven-81.vercel.app/standalone-graph.html)**
* ⚙️ **Automated CI/CD Pipeline:** Fully configured with GitHub Actions and Vercel edge deployment.

---

## 📌 Executive Summary

**NIRMAAN** is an indigenous, sovereign blockchain forensic and Anti-Money Laundering (AML) platform designed for frontline Indian Law Enforcement Agencies (LEAs), State Cyber Police Stations, and the national **1930 / NCRP** ecosystem.

When a citizen reports cyber fraud, stolen funds are rapidly converted into cryptocurrency (predominantly **USDT on TRON TRC-20 and EVM chains**) and layered through peel chains into centralized exchanges (VASPs). NIRMAAN bridges the critical gap where traditional bank freezes end:
1. **Automated Multi-Hop Traversal:** Ingests suspect wallet addresses and traces peeling chains across public ledgers in **< 4.2 seconds**.
2. **Exchange Deposit Sweep Heuristic:** Deterministically identifies unlabelled user deposit addresses by detecting parent gas/energy funding and sweeping consolidations into major exchanges (Binance, Bybit, CoinDCX, WazirX).
3. **Automated Statutory Legal Notices:** Instantly compiles court-admissible notices under **Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023** and **Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023** electronic certificates with SHA-256 evidence integrity hashing.

---

## 📚 Complete Project Documentation

Detailed project specifications, engineering blueprints, and research dossiers are available in the [`docs/`](./docs) directory:

| Document | Description | Link |
| :--- | :--- | :--- |
| **Product Requirements Document (PRD)** | Problem background, target user personas, functional requirements (FR-01 to FR-10), non-functional requirements, and success metrics. | [📄 Read PRD](./docs/PRD.md) |
| **Technical Requirements Document (TRD)** | Engineering architecture, bounded BFS traversal algorithms, deposit sweep heuristics, Cytoscape.js canvas design, and API schemas. | [📄 Read TRD](./docs/TRD.md) |
| **Comprehensive Research Dossier** | I4C operational context, Indian fraud data (₹22,845 Cr in 2024), competitor financial benchmarking, BNSS statutory transition, and legal notice templates. | [📄 Read Research Dossier](./docs/RESEARCH.md) |

---

## 🏛️ Application Architecture & Forensic Modules

The system provides an enterprise GovTech suite crafted for cyber crime investigators:

1. **Dashboard (`/`):** Command & Telemetry center tracking active FIRs, victim loss metrics (₹ INR and USDT), and high-risk cash-out alerts.
2. **Investigation Engine (`/investigation`):** On-demand multi-chain bounded BFS crawler for TRON (TRC-20), Ethereum (ERC-20), BSC (BEP-20), and Bitcoin (UTXO).
3. **Transaction Flow Graph (`/graph`):** Cytoscape & Sankey visualizer rendering complex peeling chains, mule clusters, and exchange hot wallets with dynamic layouts (Hierarchical, Breadth-First, Force-Directed).
4. **Standalone WebGL Explorer (`/standalone-graph.html`):** High-density canvas built to handle 1,000+ node graph traces smoothly in a dedicated viewport.
5. **Wallet Behavioral Profiling (`/wallet`):** Granular address dossier with transaction turnover velocity, risk scoring, and counterparty exposure matrices.
6. **VASP Attribution & Requisition (`/vasp`):** Searchable 41-VASP FIU-IND registry and instant generator for Section 94 BNSS statutory freeze notices.
7. **Intelligence & Alerts (`/alerts`):** Real-time surveillance ticker capturing high-velocity fund movements, mixer interactions, and rapid structuring.
8. **Case Management Vault (`/cases`):** Master repository of cases with SHA-256 tamper-sealed electronic evidence dossiers compliant with Section 63 BSA.
9. **Settings & Statutory Protocols (`/settings`):** State Police presets (Delhi IFSO, Maharashtra Cyber, TG-CSB, Karnataka CID), live letterhead preview, and interactive RPC node latency tests.
10. **Help & Legal SOPs (`/help`):** Comprehensive field guide on the new criminal laws (BNSS / BSA / BNS) and digital evidence admissibility.

---

## 🏗️ Architecture Stack Overview

* **Backend Engine:** Python 3.12+ (FastAPI) + Async `httpx` fan-out
* **Graph Traversal Core:** In-Memory NetworkX (sub-15ms BFS pathfinding)
* **Frontend Visualization:** React / Vite + Cytoscape.js (`cytoscape-dagre`) + Tailwind CSS + Lucide Icons
* **Multi-Chain Ingestion:** TronGrid / Tronscan API (TRC-20) + Etherscan / BscScan V2 + Blockstream (BTC)
* **Rate Limiting & Caching:** Resilient caching and token-bucket rate limiters
* **Evidence & Dossier Engine:** SHA-256 cryptographic chain-of-custody seal + Section 63 BSA certificate generator

---

## ⚖️ Indian Statutory Alignment (Active July 1, 2024)

NIRMAAN natively complies with the contemporary criminal justice system of India:
* **Section 94 BNSS, 2023** *(replaces Section 91 CrPC, 1973)* — Statutory requisition to VASP for KYC, IP logs, and order-book records.
* **Section 106 & 107 BNSS, 2023** *(replaces Section 102 CrPC, 1973)* — Direction for immediate freezing of VASP accounts and digital assets.
* **Section 63 BSA, 2023** *(replaces Section 65B Indian Evidence Act, 1872)* — Electronic evidence admissibility certificate with cryptographic tamper-proof validation.

---

## ⚡ Quickstart Guide

### 1. Run Automated Test Suite (35/35 Tests)
```bash
# Set Python path to backend
export PYTHONPATH="backend"     # Linux / macOS
$env:PYTHONPATH="backend"        # Windows PowerShell

# Run Pytest
pytest backend/tests/test_forensics_suite.py -v
```

### 2. Start Backend API Server
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# API docs available at http://127.0.0.1:8000/docs
```

### 3. Start Frontend Client
```bash
cd frontend/app
npm install
npm run dev
# App running at http://localhost:3000
```
