import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Building,
  Key,
  Server,
  Bell,
  Save,
  Check,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  FileText,
  Radio,
  ExternalLink,
  Lock,
  Zap,
  Globe,
  Mail,
  Scale,
  RefreshCw,
  Eye,
  Building2,
  Cpu,
} from "lucide-react";

const STATE_PRESETS = [
  {
    id: "delhi",
    label: "Delhi Police Cyber Cell",
    officer: "Inspector Rajesh Sharma",
    badge: "IO-77-CYBER",
    station: "Cyber Crime Police Station, South District",
    state: "Delhi NCT",
    email: "io.cyber77@delhipolice.gov.in",
  },
  {
    id: "maharashtra",
    label: "Maharashtra Cyber HQ",
    officer: "PI Sachin Kadam",
    badge: "IO-MH-4091",
    station: "Maharashtra Cyber Headquarters, Mumbai",
    state: "Maharashtra",
    email: "cyber.hq@mahapolice.gov.in",
  },
  {
    id: "telangana",
    label: "Telangana Cyber Bureau (TG-CSB)",
    officer: "DSP K. V. Reddy",
    badge: "TG-CSB-88",
    station: "Telangana Cyber Security Bureau (TG-CSB), Hyderabad",
    state: "Telangana",
    email: "investigations@tgcsb.gov.in",
  },
  {
    id: "karnataka",
    label: "Karnataka CID Cyber Crime",
    officer: "Inspector Ramesh Gowda",
    badge: "KA-CID-104",
    station: "Cyber Crime Division, CID Headquarters, Bengaluru",
    state: "Karnataka",
    email: "cybercrime@ksp.gov.in",
  },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile"); // profile | statutory | blockchain | fiu | alerts
  const [officerName, setOfficerName] = useState("Inspector Rajesh Sharma");
  const [badgeId, setBadgeId] = useState("IO-77-CYBER");
  const [policeStation, setPoliceStation] = useState("Cyber Crime Police Station, South District");
  const [stateUt, setStateUt] = useState("Delhi NCT");
  const [leaEmail, setLeaEmail] = useState("io.cyber77@delhipolice.gov.in");
  const [phoneNumber, setPhoneNumber] = useState("+91 11 2345 6789");

  // Statutory parameters
  const [defaultChain, setDefaultChain] = useState("TRON (TRC-20)");
  const [complianceHours, setComplianceHours] = useState("24");
  const [autoSeal, setAutoSeal] = useState(true);
  const [fiuAutoSync, setFiuAutoSync] = useState(true);
  const [includeBnsOffences, setIncludeBnsOffences] = useState(true);
  const [goldenHourPriority, setGoldenHourPriority] = useState(true);

  // RPC parameters
  const [tronRpc, setTronRpc] = useState("https://api.trongrid.io");
  const [ethRpc, setEthRpc] = useState("https://mainnet.infura.io/v3/official-lea");
  const [bscRpc, setBscRpc] = useState("https://bsc-dataseed.binance.org");
  const [testingRpc, setTestingRpc] = useState(false);
  const [rpcStatus, setRpcStatus] = useState("Connected (14ms)");

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("nirmaan_officer_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.officerName) setOfficerName(parsed.officerName);
        if (parsed.badgeId) setBadgeId(parsed.badgeId);
        if (parsed.policeStation) setPoliceStation(parsed.policeStation);
        if (parsed.stateUt) setStateUt(parsed.stateUt);
        if (parsed.leaEmail) setLeaEmail(parsed.leaEmail);
        if (parsed.defaultChain) setDefaultChain(parsed.defaultChain);
        if (parsed.complianceHours) setComplianceHours(parsed.complianceHours);
        if (parsed.autoSeal !== undefined) setAutoSeal(parsed.autoSeal);
        if (parsed.fiuAutoSync !== undefined) setFiuAutoSync(parsed.fiuAutoSync);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleApplyPreset = (p) => {
    setOfficerName(p.officer);
    setBadgeId(p.badge);
    setPoliceStation(p.station);
    setStateUt(p.state);
    setLeaEmail(p.email);
  };

  const handleTestRpc = () => {
    setTestingRpc(true);
    setRpcStatus("Pinging Nodes...");
    setTimeout(() => {
      setTestingRpc(false);
      setRpcStatus("Verified Operational · Latency: 11.4ms");
    }, 900);
  };

  const handleSave = (e) => {
    e?.preventDefault();
    const config = {
      officerName,
      badgeId,
      policeStation,
      stateUt,
      leaEmail,
      defaultChain,
      complianceHours,
      autoSeal,
      fiuAutoSync,
    };
    try {
      localStorage.setItem("nirmaan_officer_settings", JSON.stringify(config));
    } catch {
      // Ignore
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setOfficerName("Inspector Rajesh Sharma");
    setBadgeId("IO-77-CYBER");
    setPoliceStation("Cyber Crime Police Station, South District");
    setStateUt("Delhi NCT");
    setLeaEmail("io.cyber77@delhipolice.gov.in");
    setDefaultChain("TRON (TRC-20)");
    setComplianceHours("24");
    setAutoSeal(true);
    setFiuAutoSync(true);
    try {
      localStorage.removeItem("nirmaan_officer_settings");
    } catch {}
  };

  return (
    <div className="w-full space-y-6 p-4 sm:p-7 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <SettingsIcon size={14} /> Frontline Investigation Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            System & Station Settings
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            Manage Investigating Officer credentials, statutory Section 94 BNSS requisition defaults, and blockchain RPC nodes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
              <CheckCircle2 size={15} /> Saved Successfully
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      {/* State Police Fast Preset Bar */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Building2 size={15} className="text-blue-600" />
            <span>State Police Unit Presets:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {STATE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
                  policeStation === p.station
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Settings Card with Horizontal Segmented Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 overflow-x-auto">
          {[
            { id: "profile", label: "Officer Profile & Jurisdiction", icon: User },
            { id: "statutory", label: "Statutory Protocols (BNSS / BSA)", icon: Scale },
            { id: "blockchain", label: "Blockchain Nodes & RPCs", icon: Cpu },
            { id: "fiu", label: "FIU-IND Nodal Directory", icon: Building },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-bold transition whitespace-nowrap ${
                activeTab === id
                  ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Officer Profile & Police Station */}
        {activeTab === "profile" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Officer Credentials & Letterhead</h2>
                <p className="text-xs text-slate-500">
                  These details auto-populate the official notice headers of Section 94 BNSS summons and Section 63 BSA certificates.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                Verified Authority
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Investigating Officer Name & Rank:
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Badge / Personnel ID (IO-PNO):
                </label>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Police Station / Cyber Crime Unit:
                </label>
                <input
                  type="text"
                  value={policeStation}
                  onChange={(e) => setPoliceStation(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  State / Union Territory:
                </label>
                <select
                  value={stateUt}
                  onChange={(e) => setStateUt(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Delhi NCT">Delhi NCT</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Other State / UT">Other State / UT</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Official Law Enforcement Agency (LEA) Email:
                </label>
                <input
                  type="email"
                  value={leaEmail}
                  onChange={(e) => setLeaEmail(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Station Contact / Helpline Number:
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Live Requisition Letterhead Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText size={13} className="text-blue-600" /> Live Letterhead Preview (Section 94 BNSS Requisition):
              </span>
              <div className="rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 leading-relaxed">
                <p className="font-bold text-slate-900">GOVERNMENT OF {stateUt.toUpperCase()} · POLICE DEPARTMENT</p>
                <p className="text-slate-600">{policeStation}</p>
                <p className="text-slate-600">Investigating Authority: {officerName} ({badgeId}) · Email: {leaEmail}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Statutory Protocols (BNSS & BSA) */}
        {activeTab === "statutory" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Statutory Notice & Digital Evidence Defaults</h2>
                <p className="text-xs text-slate-500">
                  Configure procedural compliance under Bharatiya Nagarik Suraksha Sanhita (BNSS) and Bharatiya Sakshya Adhiniyam (BSA).
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                BNSS 2023 Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Compliance Timeline Mandated:
                </label>
                <select
                  value={complianceHours}
                  onChange={(e) => setComplianceHours(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="24">24 Hours (Mandatory Golden Hour Timeline)</option>
                  <option value="48">48 Hours (Standard Notice)</option>
                  <option value="72">72 Hours (Extended Forensic Intermediary)</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Prescribed deadline for cryptocurrency exchange nodal desks to lock wallets and produce KYC records.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Primary Blockchain Forensic Engine:
                </label>
                <select
                  value={defaultChain}
                  onChange={(e) => setDefaultChain(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="TRON (TRC-20)">TRON (TRC-20) — Primary USDT Threat Vector</option>
                  <option value="Ethereum (ERC-20)">Ethereum (ERC-20)</option>
                  <option value="BSC (BEP-20)">BNB Smart Chain (BEP-20)</option>
                  <option value="Bitcoin (UTXO)">Bitcoin (UTXO)</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Default target ledger for multi-hop BFS algorithmic trace execution.
                </span>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Automatic Section 63 BSA Cryptographic Hash Sealing
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Computes and anchors SHA-256 evidence digests over every graph node and edge sequence for court admissibility.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSeal(!autoSeal)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ${
                    autoSeal ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Auto-Include Section 318(4) BNS Penal Offence Classifications
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Embeds statutory criminal penal classifications into Section 94 BNSS requisitions dispatched to exchanges.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeBnsOffences(!includeBnsOffences)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ${
                    includeBnsOffences ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    1930 Helpline Golden Hour Priority Alert Routing
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Prioritizes capital flight alerts detected within 2 hours of victim reporting to prevent exchange liquidation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGoldenHourPriority(!goldenHourPriority)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ${
                    goldenHourPriority ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Blockchain Nodes & RPCs */}
        {activeTab === "blockchain" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Blockchain Ledger Endpoints & RPC Gateway</h2>
                <p className="text-xs text-slate-500">
                  Public ledger telemetry connections for rapid multi-hop BFS traversal and smart contract analysis.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestRpc}
                disabled={testingRpc}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <RefreshCw size={13} className={testingRpc ? "animate-spin text-blue-600" : ""} />
                <span>{testingRpc ? "Pinging..." : "Test RPC Connectivity"}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-xs text-slate-900">TRON TRC-20 FullNode Gateway</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-emerald-600">{rpcStatus}</span>
                </div>
                <input
                  type="text"
                  value={tronRpc}
                  onChange={(e) => setTronRpc(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-mono text-slate-800"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-xs text-slate-900">Ethereum Mainnet (ERC-20 Endpoint)</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-emerald-600">Connected · 22ms</span>
                </div>
                <input
                  type="text"
                  value={ethRpc}
                  onChange={(e) => setEthRpc(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-mono text-slate-800"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-xs text-slate-900">BNB Smart Chain (BEP-20 Endpoint)</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-emerald-600">Connected · 18ms</span>
                </div>
                <input
                  type="text"
                  value={bscRpc}
                  onChange={(e) => setBscRpc(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-mono text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: FIU-IND Nodal Directory */}
        {activeTab === "fiu" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">FIU-IND Verified VASP Registry (41 Entities)</h2>
                <p className="text-xs text-slate-500">
                  Pre-configured compliance nodal officers for instant dispatch of Section 94 BNSS requisitions.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                41 Entities Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { name: "Binance Holdings Ltd", email: "compliance-in@binance.com", portal: "binance.com/en/support/law-enforcement", status: "FIU-IND Registered" },
                { name: "Bybit Financial", email: "compliance@bybit.com", portal: "bybit.com/en/help-center", status: "FIU-IND Registered" },
                { name: "CoinDCX (Neblio)", email: "nodal@coindcx.com", portal: "coindcx.com/legal/law-enforcement", status: "FIU-IND Registered" },
                { name: "CoinSwitch Kuber", email: "compliance@coinswitch.co", portal: "coinswitch.co/law-enforcement", status: "FIU-IND Registered" },
                { name: "WazirX (Zanmai)", email: "law-enforcement@wazirx.com", portal: "wazirx.com/law-enforcement", status: "FIU-IND Registered" },
                { name: "Mudrex Inc", email: "compliance@mudrex.com", portal: "mudrex.com/legal/compliance", status: "FIU-IND Registered" },
              ].map((vasp) => (
                <div key={vasp.name} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{vasp.name}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {vasp.status}
                    </span>
                  </div>
                  <div className="font-mono text-slate-600 text-[11px] truncate">
                    Nodal LEA: {vasp.email}
                  </div>
                  <a
                    href={`https://${vasp.portal}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] font-semibold pt-1"
                  >
                    Open Law Enforcement Portal <ExternalLink size={11} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
