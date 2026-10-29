# NIRMAAN (ChainTrace AI) 🛡️⛓️

> **Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported Suspect Wallet Addresses through Automated Blockchain Analytics**  
> **SIH Problem Statement:** SIH26183  
> **Issuing Ministry:** Ministry of Home Affairs (MHA) / Indian Cybercrime Coordination Centre (I4C)  
> **Domain:** Blockchain & Cybersecurity  

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

## 🏗️ Architecture Stack Overview

* **Backend Engine:** Python 3.12+ (FastAPI) + Async `httpx` fan-out
* **Graph Traversal Core:** In-Memory NetworkX (sub-15ms BFS pathfinding)
* **Frontend Visualization:** React / Next.js + Cytoscape.js (`cytoscape-dagre` & `cose-bilkent`)
* **Multi-Chain Ingestion:** TronGrid / Tronscan API (TRC-20) + Etherscan / BscScan V2
* **Rate Limiting & Caching:** Redis Token-Bucket Limiter + SQLite Cache
* **Evidence & Dossier Engine:** WeasyPrint headless PDF compiler + SHA-256 hash sealing

---

## ⚖️ Indian Statutory Alignment (Active July 1, 2024)

NIRMAAN natively complies with the contemporary criminal justice system of India:
* **Section 94 BNSS, 2023** *(replaces Section 91 CrPC, 1973)* — Requisition to VASP for KYC, IP logs, and order-book records.
* **Section 106 & 107 BNSS, 2023** *(replaces Section 102 CrPC, 1973)* — Direction for immediate freezing of VASP accounts and assets.
* **Section 63 BSA, 2023** *(replaces Section 65B Indian Evidence Act, 1872)* — Electronic evidence admissibility certificate with cryptographic tamper-proof validation.
