import { useState } from "react";
import {
  Search, ShieldCheck, Wallet, Network, FileText,
  ChevronDown, CheckCircle, AlertTriangle, Loader2, ArrowRight
} from "lucide-react";
import { traceWallet } from "../services/api";
import { FORENSIC_PRESETS } from "../data/mockData";

export default function Investigation({ onNavigate }) {
  const [wallet, setWallet] = useState("");
  const [chain, setChain] = useState("tron");
  const [fir, setFir] = useState("");
  const [lossAmount, setLossAmount] = useState(1500000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [traceResult, setTraceResult] = useState(null);

  const applyPreset = (preset) => {
    setWallet(preset.address);
    setChain(preset.chain);
    setFir(preset.fir);
    setLossAmount(preset.lossInr);
    setError(null);
    setTraceResult(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!wallet.trim() || !fir.trim()) {
      setError("Please provide both a valid FIR/Case ID and a suspect wallet address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTraceResult(null);

    try {
      const data = await traceWallet({
        seed_address: wallet.trim(),
        chain: chain,
        max_depth: 4,
        min_usd_value: 20.0,
        case_metadata: {
          fir_number: fir.trim(),
          police_station: "Cyber Crime Police Station",
          investigating_officer: "Investigating Officer",
          loss_amount_inr: Number(lossAmount) || 0.0
        }
      });
      setTraceResult(data);
    } catch (err) {
      setError(err.message || "Failed to execute blockchain trace. Please verify the address format.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-7 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
          Microsoft Azure & AI Forensic Core Active
        </div>
        <h1 className="text-3xl font-bold text-slate-900">New Blockchain Investigation</h1>
        <p className="text-slate-500 mt-1">
          Initiate multi-hop graph pathfinding and automated VASP deposit sweep attribution.
        </p>
      </div>

      {/* Quick Benchmark Presets */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          1-Click Benchmark Scenarios (Verified Forensic Trails)
        </p>
        <div className="flex flex-wrap gap-2">
          {FORENSIC_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className="text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 transition flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSearch}
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
          <Wallet className="text-blue-600" /> Investigation Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">FIR / Case ID</label>
            <input value={fir} onChange={(e) => setFir(e.target.value)}
              placeholder="e.g. FIR-88/2026 Delhi Cyber"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700">Reported Loss Amount (INR ₹)</label>
            <input type="number" value={lossAmount} onChange={(e) => setLossAmount(e.target.value)}
              placeholder="1500000"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">Suspect Wallet Address</label>
          <input value={wallet} onChange={(e) => setWallet(e.target.value)}
            placeholder="Enter TRON (T...), Ethereum/BSC (0x...), or Bitcoin address"
            className="w-full font-mono text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">Blockchain Network</label>
          <div className="relative">
            <select value={chain} onChange={(e) => setChain(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-blue-500 text-sm">
              <option value="tron">TRON (TRC-20 USDT)</option>
              <option value="ethereum">Ethereum (ERC-20 USDT)</option>
              <option value="bsc">Binance Smart Chain (BEP-20 BNB/USDT)</option>
              <option value="bitcoin">Bitcoin (UTXO)</option>
            </select>
            <ChevronDown className="absolute right-4 top-3.5 text-slate-500 pointer-events-none" size={18} />
          </div>
        </div>

        <button type="submit" disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-7 py-3.5 font-semibold flex items-center gap-2 text-sm shadow-md shadow-blue-500/20 transition">
          {isLoading ? (
            <>
              <Loader2 size={19} className="animate-spin" />
              Traversing Public Ledger...
            </>
          ) : (
            <>
              <Search size={19} />
              Execute Automated Trace
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3 items-start">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900">Trace Execution Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {traceResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">
                <CheckCircle size={14} /> Trace Complete · {traceResult.execution_time_ms} ms
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                Forensic Attribution Verdict
              </h2>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Trace ID: {traceResult.trace_id}
            </div>
          </div>

          {/* VASP Destination Card */}
          {traceResult.destination_found && traceResult.target_vasp ? (
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Target Exchange Identified</span>
                  <h3 className="text-2xl font-bold text-blue-950 mt-1">
                    {traceResult.target_vasp.name}
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    FIU-IND Status: {traceResult.target_vasp.fiu_registered ? "Registered (Compliant)" : "Unregistered"} · Nodal: {traceResult.target_vasp.nodal_email}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Hops Traversed</span>
                  <span className="text-2xl font-bold text-slate-900">{traceResult.edges?.length || 0} Hops</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-blue-200/60 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Identified Deposit Forwarder:</span>
                  <span className="text-slate-800 break-all">{traceResult.target_vasp.deposit_address}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Associated Hot Wallet:</span>
                  <span className="text-slate-800 break-all">{traceResult.target_vasp.hot_wallet}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
              No known centralized exchange deposit sweep was detected within {traceResult.max_depth || 4} hops.
            </div>
          )}

          {/* Statutory Evidence Seal */}
          {traceResult.evidence_sha256 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono">
              <span className="text-slate-500 block font-semibold">Section 63 BSA Tamper-Proof Cryptographic Seal:</span>
              <span className="text-slate-800 break-all">{traceResult.evidence_sha256}</span>
            </div>
          )}
        </div>
      )}

      {/* Feature Pillar Cards */}
      <div className="grid sm:grid-cols-3 gap-5">
        {[
          [ShieldCheck, "Automated Section 94 BNSS", "Drafts court-ready legal notices to exchange nodal officers within 24 hours."],
          [Network, "Peeling & Mixer Detection", "Machine learning heuristic layer flags smurfing, peeling ratios, and coin mixers."],
          [FileText, "Section 63 BSA Certification", "Produces cryptographically verified digital evidence certificates with SHA-256."],
        ].map(([Icon, title, desc]) => (
          <div key={title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <Icon className="text-blue-600 mb-3" size={24} />
            <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
