import { useState } from "react";
import {
  Search, ShieldCheck, Wallet, Network, FileText,
  ChevronDown, CheckCircle, AlertTriangle, Loader2, ArrowRight, Download
} from "lucide-react";
import { traceWallet, createCase, getDossierDownloadUrl, getBundleDownloadUrl } from "../services/api";
import { FORENSIC_PRESETS } from "../data/mockData";

export default function Investigation({ onNavigate, initialWallet = "", initialFir = "" }) {
  const [wallet, setWallet] = useState(initialWallet || "");
  const [chain, setChain] = useState("tron");
  const [fir, setFir] = useState(initialFir || (initialWallet ? "FIR-2026/CYBER/AUTO" : ""));
  const [lossAmount, setLossAmount] = useState(1500000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [traceResult, setTraceResult] = useState(null);
  const [caseId, setCaseId] = useState(null);

  const [prevInitialWallet, setPrevInitialWallet] = useState(initialWallet);
  const [prevInitialFir, setPrevInitialFir] = useState(initialFir);

  if (initialWallet !== prevInitialWallet || initialFir !== prevInitialFir) {
    setPrevInitialWallet(initialWallet);
    setPrevInitialFir(initialFir);
    if (initialWallet) {
      setWallet(initialWallet);
      if (!fir) setFir("FIR-2026/CYBER/AUTO");
    }
    if (initialFir) {
      setFir(initialFir);
    }
  }

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
    setCaseId(null);

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

      try {
        const totalRouted = (data.edges || []).reduce((acc, e) => acc + (parseFloat(e.usd_value) || 0), 0);
        const saved = await createCase({
          fir_number: fir.trim(),
          police_station: "Cyber Crime Police Station",
          investigating_officer: "Investigating Officer",
          complainant_name: "Complainant Victim",
          loss_amount_inr: Number(lossAmount) || 0.0,
          seed_address: data.seed_address,
          chain: data.chain,
          destination_vasp: data.target_vasp?.name || "Pending Attribution",
          total_routed_usd: Math.round(totalRouted * 100) / 100,
          evidence_sha256: data.evidence_sha256,
          trace_data: data
        });
        if (saved && saved.case_id) {
          setCaseId(saved.case_id);
        }
      } catch (saveErr) {
        console.warn("Auto-save case vault error:", saveErr);
      }
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

          {/* Download Official Legal Artifacts & Open Graph */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate?.("Transaction Graph", { traceData: traceResult, caseId: caseId })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Network size={14} /> Open Visual Graph Topology
            </button>
            {caseId && (
              <>
                <a
                  href={getDossierDownloadUrl(caseId)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                >
                  <Download size={14} /> Download Court PDF Dossier
                </a>
                <a
                  href={getBundleDownloadUrl(caseId)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition"
                >
                  <Download size={14} /> Download Section 63 ZIP Bundle
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {/* Feature Pillar Cards (Interactive Shortcuts) */}
      <div className="grid sm:grid-cols-3 gap-5">
        {[
          {
            icon: ShieldCheck,
            title: "Automated Section 94 BNSS",
            desc: "Drafts court-ready legal notices to exchange nodal officers within 24 hours.",
            badge: "Open Legal Dossiers →",
            target: "Legal Dossiers",
          },
          {
            icon: Network,
            title: "Peeling & Mixer Detection",
            desc: "Machine learning heuristic layer flags smurfing, peeling ratios, and coin mixers.",
            badge: "Open Visual Graph →",
            target: "Transaction Graph",
          },
          {
            icon: FileText,
            title: "Section 63 BSA Certification",
            desc: "Produces cryptographically verified digital evidence certificates with SHA-256.",
            badge: "Open Evidence Vault →",
            target: "Case Management",
          },
        ].map(({ icon: Icon, title, desc, badge, target }) => (
          <div
            key={title}
            onClick={() => onNavigate && onNavigate(target)}
            className="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition duration-200 flex flex-col justify-between"
            role="button"
            tabIndex={0}
            title={`Click to open ${title}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Icon size={22} />
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {desc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>{badge}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
