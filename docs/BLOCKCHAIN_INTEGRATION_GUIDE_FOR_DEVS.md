# DEVELOPER INTEGRATION GUIDE: ZERO-BLOCKCHAIN REQUIRED
**For Frontend, Backend & ML Teammates Working on NIRMAAN**
**Smart India Hackathon 2026 | Problem Statement: SIH26183**

> **TL;DR:** You do **not** need to know cryptography, Solidity, smart contracts, RPC nodes, or Web3 to build on top of our blockchain engine. Vertical 1 (Blockchain Infrastructure & Crawlers) abstracts every multi-chain detail into clean, typed JSON objects (`nodes` and `edges`) identical to standard social network or banking data.

---

## 1. The 30-Second Mental Translation

| Blockchain Concept | What It Actually Means in Plain English | Equivalent in Banking / Web |
| :--- | :--- | :--- |
| **Address** (`T...`, `0x...`, `bc1...`) | A unique user identifier / account number. | Bank Account Number / UPI ID |
| **Transaction Hash** (`tx_hash`) | A unique receipt ID proving a transfer occurred. | Bank Reference No. / UTR Number |
| **Token Transfer** | Money sent from Account A to Account B. | IMPS / NEFT / UPI Transfer |
| **Exchange Deposit Address** | A single-use forwarder wallet assigned to 1 suspect. | Virtual Account Number (VAN) |
| **Exchange Hot Wallet** | The master treasury vault of the exchange. | Central Bank Clearing Pool (Binance, CoinDCX) |
| **Deposit Sweep** | The exchange pulling money from deposit to hot wallet. | Daily Automated Treasury Consolidation |
| **Circuit Breaker** | Self-healing network shield blocking failed RPCs. | Resilient API Gateway Failover |
| **Stake 2.0 Energy Delegation** | Master wallet paying transaction fees for burner wallet. | Corporate Master Account paying employee debit fees |
| **Gas Funder** | First account that sent ETH/BNB to a burner address. | Initial account opener / funding source |
| **Co-Spent Cluster** | Bitcoin addresses spending together in 1 transaction. | Joint account holders / common ownership |

---

## 2. API Contract & Error Handling (For Frontend & Backend)

### A. Endpoint Specification: `POST /api/trace`
* **URL:** `http://127.0.0.1:8000/api/trace`
* **Method:** `POST`
* **Content-Type:** `application/json`

#### Request Payload
```json
{
  "seed_address": "TScamOriginVictimAddress778899AABB",
  "max_depth": 4,
  "min_usd_value": 20.0,
  "case_metadata": {
    "fir_number": "FIR-88/2026 Cyber Crime PS",
    "police_station": "State Cyber Crime Police Station, Bhopal",
    "investigating_officer": "DSP Anjali Verma",
    "complainant_name": "Ramesh Kumar",
    "loss_amount_inr": 1500000.0
  }
}
```

#### Success Response (`200 OK`)
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
    "sweep_tx_hash": "d4e5f60718293a4b5c6d7e8f0123456789abcdef",
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
  "section_94_notice_text": "==================== FORM OF STATUTORY NOTICE (SECTION 94 BNSS, 2023) ... ===================="
}
```

---

### B. Standardized HTTP Error Handling Matrix

The backend enforces standardized error responses under RFC 7807 (`{"detail": "..."}`). Here is how Frontend and Backend should handle each HTTP code:

| HTTP Status | Trigger Condition | Backend Behavior | Frontend Action Recommended |
| :--- | :--- | :--- | :--- |
| **`200 OK`** | Trace completed successfully (or dead-end reached). | Returns full graph, nodes, edges, VASP status. | Render Cytoscape.js graph and enable PDF Export button. |
| **`400 Bad Request`** | Malformed cryptocurrency address format. | Returns `{"detail": "Invalid cryptocurrency address format..."}` | Display inline red form warning under address input box. |
| **`404 Not Found`** | Address not found on any supported blockchain. | Returns `{"detail": "Wallet address not found on active explorers."}` | Show Toast: *"Address not found on TRON, EVM, or Bitcoin networks."* |
| **`422 Unprocessable`** | Pydantic schema validation error (`loss < 0`, `depth < 1`). | Returns field-level validation errors array. | Highlight the offending input field in the modal. |
| **`429 Rate Limit`** | Downstream RPC rate-limited our crawler. | Handled internally by Circuit Breaker with exponential backoff. If exhausted, returns `429`. | Show Banner: *"Upstream explorer busy. Retrying in 5 seconds..."* |
| **`500 Server Error`** | Unhandled internal backend logic error. | Formatted JSON envelope: `{"detail": "Forensic trace failed: <message>"}`. | Show friendly alert with copyable Trace ID for error logs. |
| **`504 Timeout`** | External explorer API took > 12s to respond. | Bounded by `timeout=12.0s`. Returns structured 504. | Show Modal: *"Network latency high. Suggest switching to local fixture."* |

---

## 3. Guide for FRONTEND Developers (Dev 4)

### A. How to Call the Backend API (TypeScript / JavaScript)
```typescript
async function traceSuspectWallet(walletAddress: string, firNumber: string, lossAmount: number) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/trace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seed_address: walletAddress.trim(),
        max_depth: 4,
        min_usd_value: 20.0,
        case_metadata: {
          fir_number: firNumber,
          loss_amount_inr: lossAmount
        }
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || `HTTP Error ${response.status}`);
    }
    
    const traceData = await response.json();
    return traceData;
  } catch (error) {
    console.error("Trace failed:", error);
    throw error;
  }
}
```

### B. Cytoscape.js Node Styling Specification
Map the `node_type` field directly to visual elements:

```javascript
const cytoscapeStyles = [
  {
    selector: 'node[node_type = "SUSPECT"]',
    style: {
      'background-color': '#ef4444', // Red
      'shape': 'ellipse',
      'label': 'data(label)',
      'color': '#ffffff',
      'font-weight': 'bold',
      'border-width': 3,
      'border-color': '#b91c1c'
    }
  },
  {
    selector: 'node[node_type = "MULE"]',
    style: {
      'background-color': '#f59e0b', // Amber
      'shape': 'round-rectangle',
      'label': 'data(label)',
      'color': '#1f2937'
    }
  },
  {
    selector: 'node[node_type = "VASP_DEPOSIT"]',
    style: {
      'background-color': '#0284c7', // Cyan
      'shape': 'diamond',
      'width': 50,
      'height': 50,
      'label': 'data(label)'
    }
  },
  {
    selector: 'node[node_type = "VASP_HOT"]',
    style: {
      'background-color': '#10b981', // Green
      'shape': 'hexagon',
      'width': 60,
      'height': 60,
      'label': 'data(label)',
      'font-weight': 'bold'
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 3,
      'line-color': '#64748b',
      'target-arrow-color': '#64748b',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(amount) + " " + data(token)'
    }
  }
];
```

---

## 4. Guide for BACKEND & LEA Developers (Dev 3)

### A. How to Call the Tracer in Python Directly
```python
from app.models.schemas import TraceRequest, CaseMetadata
from app.core.tracer import ForensicTracer
from app.core.legal_notice import generate_section_94_bnss_notice, generate_section_63_bsa_certificate

# Initialize tracer once (in-memory VASP cache)
tracer = ForensicTracer()

# Run trace
req = TraceRequest(
    seed_address="0x28C6c06298d514Db089934071355E5743bf21d60",
    case_metadata=CaseMetadata(
        fir_number="FIR-42/2026 Cyber Cell",
        police_station="State Cyber Crime PS, Bengaluru",
        investigating_officer="Inspector Vikramaditya Rao",
        loss_amount_inr=5000000.0
    )
)

result = await tracer.trace(req)

# Generate Legal Notices under new Indian criminal laws (effective July 1, 2024)
section_94_notice = generate_section_94_bnss_notice(result, req.case_metadata)
section_63_certificate = generate_section_63_bsa_certificate(result, req.case_metadata)
```

### B. What to Save in the SQLite Case Vault
When an officer saves an investigation, persist:
1. `case_id` (UUID string)
2. `fir_number` (String, e.g. "FIR-88/2026")
3. `seed_address` (String)
4. `chain` (String, e.g. "TRON (TRC-20)")
5. `target_vasp_name` (String, e.g. "Binance")
6. `target_deposit_wallet` (String)
7. `total_routed_usd` (Float)
8. `evidence_sha256_hash` (String, from `section_63_certificate["sha256_hash"]`)
9. `notice_content_text` (Text)
10. `created_at` (ISO 8601 Timestamp)

---

## 5. Guide for MACHINE LEARNING & MODEL Training (Dev 2)

### A. How to Hook into Graph Traversal
The `ForensicTracer` outputs standard NetworkX `MultiDiGraph` structures. You can inspect node in/out degree, hop timing, and peel ratios.

```python
def classify_node_risk(node_address: str, in_edges: list, out_edges: list) -> dict:
    """
    Dev 2 can inject ML embeddings or heuristic classifiers here.
    """
    in_volume = sum(e["usd_value"] for e in in_edges)
    out_volume = sum(e["usd_value"] for e in out_edges)
    
    # Peeling Chain Rule: 1 large in, 1 small out (peeled fee), 1 large out (change)
    is_peeling = False
    if len(out_edges) == 2 and out_volume > 0:
        sorted_vals = sorted([e["usd_value"] for e in out_edges])
        if (sorted_vals[0] / sorted_vals[1]) < 0.10:
            is_peeling = True
            
    risk_score = 0.95 if is_peeling else 0.15
    return {
        "address": node_address,
        "is_peeling_chain": is_peeling,
        "anomaly_risk_score": risk_score
    }
```

### B. Advanced Forensic Data Hooks Built for ML
Vertical 1 has implemented three specialized deanonymization functions ready for your models:
1. **TRON Stake 2.0 Delegator Hook (`fetch_energy_delegator`)**: Deanonymizes the parent wallet paying energy fees for suspect TRON burner wallets.
2. **EVM Gas Funder Detector (`fetch_gas_funder`)**: Identifies the genesis ETH/BNB funder that activated a suspect burner address.
3. **Bitcoin Multi-Input Co-Spent Cluster Resolver (`fetch_co_spent_cluster`)**: Groups all Bitcoin addresses controlled by the same private key via the Satoshi common-spend heuristic.

---

## 6. Guaranteed Test Wallets (100% Reliable for Demos)

Share these verified addresses with teammates for immediate frontend/backend testing:

| Network | Sample Address | Scam Scenario | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TRON (TRC-20)** | `TScamOriginVictimAddress778899AABB` | ₹15 Lakh Telegram Task Scam | **Binance Hit in 348 ms** |
| **Ethereum (ERC-20)** | `0xScamOriginVictimEther998877AABBCCDDEEFF` | ₹25 Lakh Fake Stock Investment | **Binance Hit in 890 ms** |
| **Bitcoin (UTXO)** | `bc1qScamVictimBtcSeedAddress998877AABB` | ₹50 Lakh Pig Butchering Scam | **Binance Hit in 330 ms** |
| **Live Mainnet TRON** | `TQEcAiapoEi47qkviQ4bZyVp3fVswNfaGy` | Real Mainnet USDT TRC-20 Transactor | **Live 15 Transfers Parsed** |
| **Live Mainnet EVM** | `0x28C6c06298d514Db089934071355E5743bf21d60` | Binance Hot Wallet 14 (Ethereum) | **Live 12 Transfers Parsed** |
| **Live Mainnet BTC** | `bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h` | Binance Cold Treasury (Bitcoin) | **Live 63 Txs Parsed** |

---

## 7. How to Run the Backend Locally

```powershell
# Open terminal at project root
cd e:\hackathon\backend
$env:PYTHONPATH = "."
python -m uvicorn app.main:app --reload --port 8000
```
Visit `http://127.0.0.1:8000/docs` to interact with Swagger UI.
Visit `http://127.0.0.1:8000/frontend/index.html` (or open directly) to see the interactive Cytoscape graph.
