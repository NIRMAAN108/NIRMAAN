# DEVELOPER INTEGRATION GUIDE: ZERO-BLOCKCHAIN REQUIRED
**For Frontend, Backend & ML Teammates Working on NIRMAAN**

> **TL;DR:** You do **not** need to know cryptography, Solidity, smart contracts, or Web3 to build on top of our blockchain engine. Our multi-chain crawler and tracer already abstracts everything into plain JSON objects (`nodes` and `edges`) identical to standard social network or banking data.

---

## 1. The 30-Second Mental Translation

| Blockchain Concept | What It Actually Means in Plain English | Equivalent in Banking / Web |
| :--- | :--- | :--- |
| **Address** (`T...`, `0x...`, `bc1...`) | A unique user identifier / account number. | Bank Account Number / UPI ID |
| **Transaction Hash** (`tx_hash`) | A unique receipt ID proving a transfer happened. | Bank Reference No. / UTR Number |
| **Token Transfer** | Money sent from Account A to Account B. | IMPS / NEFT / UPI Transfer |
| **Exchange Deposit Address** | A single-use forwarder wallet assigned to 1 person. | Virtual Account Number (VAN) |
| **Exchange Hot Wallet** | The main master treasury vault of the exchange. | Central Bank Clearing Pool (Binance, CoinDCX) |
| **Deposit Sweep** | The exchange pulling money from deposit to hot wallet. | Daily Automated Treasury Consolidation |

---

## 2. Guide for FRONTEND Developers (Dev 4)

### A. How to Call the Backend API
You only need to interact with a single endpoint: **`POST /api/trace`**.

```typescript
// Example fetch call from React / Next.js / Vanilla JS
async function traceSuspectWallet(walletAddress: string, firNumber: string) {
  const response = await fetch("http://127.0.0.1:8000/api/trace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seed_address: walletAddress,          // Can be TRON (T...), EVM (0x...), or BTC (bc1...)
      max_depth: 4,                         // Max hops to search (default 4)
      min_usd_value: 20.0,                  // Ignore micro-transfers under $20
      case_metadata: {
        fir_number: firNumber,              // e.g. "FIR-88/2026 Cyber Crime PS"
        loss_amount_inr: 1500000.0          // Victim loss in Rupees
      }
    })
  });
  
  const data = await response.json();
  return data; // Returns JSON ready for Cytoscape.js
}
```

### B. What the Backend Returns (JSON Shape)
```json
{
  "trace_id": "tr_8a9b7c6d",
  "seed_address": "TScamOriginVictimAddress778899AABB",
  "chain": "TRON (TRC-20)",
  "execution_time_ms": 348.0,
  "destination_found": true,
  "target_vasp": {
    "name": "Binance",
    "fiu_registered": true,
    "deposit_address": "TBinanceUserDepositForwarder8899ZZ",
    "hot_wallet": "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N",
    "sweep_tx_hash": "d4e5f60718293a4b5c6d7e8f...",
    "nodal_email": "compliance-in@binance.com",
    "law_enforcement_portal": "https://www.binance.com/en/support/law-enforcement"
  },
  "nodes": [
    { "id": "addr_1", "address": "TScam...", "node_type": "SUSPECT", "label": "Scam Origin", "balance_usd": 0.0 },
    { "id": "addr_2", "address": "TMule...", "node_type": "MULE", "label": "Mule Hop 1", "balance_usd": 15000.0 },
    { "id": "addr_3", "address": "TDeposit...", "node_type": "VASP_DEPOSIT", "label": "Binance Deposit", "vasp_name": "Binance" },
    { "id": "addr_4", "address": "THot...", "node_type": "VASP_HOT", "label": "Binance Hot Wallet", "vasp_name": "Binance" }
  ],
  "edges": [
    { "source": "addr_1", "target": "addr_2", "amount": 15000.0, "token": "USDT", "usd_value": 15000.0, "tx_hash": "0x111..." },
    { "source": "addr_2", "target": "addr_3", "amount": 14950.0, "token": "USDT", "usd_value": 14950.0, "tx_hash": "0x222..." },
    { "source": "addr_3", "target": "addr_4", "amount": 14950.0, "token": "USDT", "usd_value": 14950.0, "tx_hash": "0x333..." }
  ],
  "section_94_notice_text": "==================== FORM OF STATUTORY NOTICE ... ===================="
}
```

### C. Node Color-Coding Guide for Cytoscape.js
* `node_type === "SUSPECT"` ➡️ Color **Red (`#ef4444`)**
* `node_type === "MULE"` ➡️ Color **Amber (`#f59e0b`)**
* `node_type === "VASP_DEPOSIT"` ➡️ Color **Cyan (`#0284c7`)** (Diamond shape)
* `node_type === "VASP_HOT"` ➡️ Color **Green (`#10b981`)** (Exchange logo badge)

---

## 3. Guide for BACKEND & LEA Developers (Dev 3)

### A. How to Call the Tracer in Python
You can import the `ForensicTracer` anywhere in your backend modules:

```python
from app.models.schemas import TraceRequest, CaseMetadata
from app.core.tracer import ForensicTracer
from app.core.legal_notice import generate_section_94_bnss_notice

# Initialize tracer (loads VASP directory once in memory)
tracer = ForensicTracer()

# Run trace
req = TraceRequest(
    seed_address="0xScamOriginVictimEther998877AABBCCDDEEFF", # Supports Tron, EVM, BTC
    case_metadata=CaseMetadata(
        fir_number="FIR-12/2026 Cyber Cell",
        police_station="State Cyber Crime Police Station, Bhopal",
        investigating_officer="DSP Anjali Verma",
        loss_amount_inr=2000000.0
    )
)

result = await tracer.trace(req)

# Generate pre-filled Section 94 BNSS Notice text
legal_notice = generate_section_94_bnss_notice(result, req.case_metadata)
```

### B. What to Save in the SQLite Case Vault
When an officer saves a case, store:
1. `case_id` (Primary Key, e.g. UUID)
2. `fir_number` (String)
3. `seed_address` (String)
4. `destination_vasp` (String, e.g. "Binance")
5. `total_routed_usd` (Float)
6. `legal_notice_text` (Text)
7. `created_at` (Timestamp)

---

## 4. Guide for MACHINE LEARNING & MODEL Training (Dev 2)

### A. How to Extract Graph Features from a Node
The graph tracer gives you standard NetworkX MultiDiGraph edges. You can compute:

```python
def extract_node_features(node_address: str, incoming_edges: list, outgoing_edges: list) -> dict:
    in_degree = len(incoming_edges)
    out_degree = len(outgoing_edges)
    
    total_in_volume = sum(e["usd_value"] for e in incoming_edges)
    total_out_volume = sum(e["usd_value"] for e in outgoing_edges)
    
    # Fast Peeling Chain Detection Rule
    is_peel = False
    if out_degree == 2 and total_out_volume > 0:
        amounts = sorted([e["usd_value"] for e in outgoing_edges])
        ratio = amounts[0] / amounts[1]  # small split vs large split
        if ratio < 0.08:  # 92% to change, 8% peeled
            is_peel = True

    return {
        "in_degree": in_degree,
        "out_degree": out_degree,
        "volume_in": total_in_volume,
        "volume_out": total_out_volume,
        "is_peel_chain": is_peel,
        "risk_score": 0.92 if is_peel else 0.15
    }
```

---

## 5. Ready-to-Test Sample Wallets (100% Guaranteed Success)

Share these sample addresses with Dev 4 (Frontend) and Dev 3 (Backend) to test the UI immediately:

| Blockchain | Sample Address to Paste | What It Simulates | Expected Result |
| :--- | :--- | :--- | :--- |
| **TRON** | `TScamOriginVictimAddress778899AABB` | 15,000 USDT Telegram Task Scam | **Binance Hit in 348 ms** |
| **Ethereum** | `0xScamOriginVictimEther998877AABBCCDDEEFF` | 25,000 USDT Fake Stock Investment | **Binance Hit in 890 ms** |
| **Bitcoin** | `bc1qScamVictimBtcSeedAddress998877AABB` | 0.85 BTC Pig Butchering Scam | **Binance Hit in 330 ms** |

---

## 6. How to Start the Backend Locally

```powershell
# From project root:
cd e:\hackathon\backend
$env:PYTHONPATH = "."
python -m uvicorn app.main:app --reload --port 8000
```
Then open `http://127.0.0.1:8000/docs` in your browser to see the interactive Swagger UI.
