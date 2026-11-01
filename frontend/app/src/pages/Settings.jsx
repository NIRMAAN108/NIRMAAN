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
} from "lucide-react";

export default function Settings() {
  const [officerName, setOfficerName] = useState("Inspector Rajesh Sharma");
  const [badgeId, setBadgeId] = useState("IO-77-CYBER");
  const [policeStation, setPoliceStation] = useState("Cyber Crime Police Station, South District");
  const [stateUt, setStateUt] = useState("Delhi NCT");
  const [leaEmail, setLeaEmail] = useState("io.cyber77@delhipolice.gov.in");
  const [defaultChain, setDefaultChain] = useState("TRON (TRC-20)");
  const [complianceHours, setComplianceHours] = useState("24");
  const [autoSeal, setAutoSeal] = useState(true);
  const [fiuAutoSync, setFiuAutoSync] = useState(true);
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
      }
    } catch {
      // Ignore local storage error
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
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
    setTimeout(() => setSaved(false), 3000);
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
    <div className="w-full space-y-8 p-5 sm:p-8 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <SettingsIcon size={14} /> Frontline Investigation Configuration
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Officer & System Settings</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Customize official police station credentials, default statutory requisition headers under BNSS 2023, and RPC nodes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 animate-in fade-in">
              <CheckCircle2 size={16} /> Saved to Local Profile
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RotateCcw size={13} /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Save size={13} /> Save Configuration
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Investigating Officer Credentials */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Investigating Officer & Station Profile</h2>
              <p className="text-xs text-slate-500">
                These credentials automatically populate Section 94 BNSS requisitions and Section 63 BSA certificates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Officer Legal Name & Rank:
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Badge / Personnel ID (IO-PNO):
              </label>
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Police Station / Jurisdiction:
              </label>
              <input
                type="text"
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                State / Union Territory:
              </label>
              <select
                value={stateUt}
                onChange={(e) => setStateUt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
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

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Official Law Enforcement Agency (LEA) Email:
              </label>
              <input
                type="email"
                value={leaEmail}
                onChange={(e) => setLeaEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Official notices to Binance, Bybit, CoinDCX, and WazirX will mandate reply delivery to this address.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Standards (BNSS & BSA) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Statutory Notice & Evidence Protocols</h2>
              <p className="text-xs text-slate-500">
                Governance parameters aligning with Section 94 BNSS, 2023 and Section 63 BSA, 2023.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Default Statutory Compliance Window:
              </label>
              <select
                value={complianceHours}
                onChange={(e) => setComplianceHours(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
              >
                <option value="24">24 Hours (Standard Golden Hour Requisition)</option>
                <option value="48">48 Hours (Standard Notice)</option>
                <option value="72">72 Hours (Complex Inter-VASP Scoping)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Primary Tracing Blockchain:
              </label>
              <select
                value={defaultChain}
                onChange={(e) => setDefaultChain(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
              >
                <option value="TRON (TRC-20)">TRON (TRC-20) — High-Velocity USDT Target</option>
                <option value="Ethereum (ERC-20)">Ethereum (ERC-20)</option>
                <option value="BSC (BEP-20)">BNB Smart Chain (BEP-20)</option>
                <option value="Bitcoin (UTXO)">Bitcoin (UTXO)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSeal}
                  onChange={(e) => setAutoSeal(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Automatically anchor SHA-256 digital certificate seals under Section 63 BSA for every traced graph.
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fiuAutoSync}
                  onChange={(e) => setFiuAutoSync(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Auto-sync FIU-IND registered entity database (41 domestic and offshore registered VASPs).
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Telemetry RPC Nodes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Blockchain Nodes & Connectivity</h2>
              <p className="text-xs text-slate-500">
                Frontline connections to public ledgers and forensic RPC endpoints.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">TRON FullNode</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500">api.trongrid.io · Latency: 14ms</p>
              <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 mt-2 border border-emerald-200">
                OPERATIONAL
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Ethereum Mainnet</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500">etherscan.io / alchemy · Latency: 22ms</p>
              <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 mt-2 border border-emerald-200">
                OPERATIONAL
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">BNB Smart Chain</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500">bsc-dataseed.binance.org · Latency: 18ms</p>
              <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 mt-2 border border-emerald-200">
                OPERATIONAL
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
