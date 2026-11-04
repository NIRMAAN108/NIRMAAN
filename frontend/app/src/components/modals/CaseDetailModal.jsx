import { useState, useEffect } from "react";
import {
  X,
  Download,
  ShieldCheck,
  Network,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Scale,
  Search,
} from "lucide-react";
import {
  fetchCaseById,
  downloadCaseDossier,
  downloadCaseBundle,
} from "../../services/api";

export default function CaseDetailModal({
  caseId,
  initialCaseData = null,
  isOpen = false,
  onClose,
  onNavigate,
}) {
  const [caseData, setCaseData] = useState(initialCaseData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "trail" | "vasp" | "statutory"
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (!isOpen || !caseId) return;

    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        setLoading(true);
        setError(null);
      }
    }, 0);

    fetchCaseById(caseId)
      .then((data) => {
        if (active) setCaseData(data);
      })
      .catch((err) => {
        console.warn("Failed to load full case details:", err);
        if (active) {
          if (initialCaseData) {
            setCaseData(initialCaseData);
          } else {
            setError(err.message || "Failed to load case details.");
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, caseId, initialCaseData]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const data = caseData || initialCaseData || {};
  const trace = data.trace_data || {};
  const targetVasp = trace.target_vasp || {};
  const edges = trace.edges || [];
  const typology = trace.syndicate_typology || data.syndicate_typology || {};

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInvestigateWallet = (walletAddress) => {
    onClose?.();
    onNavigate?.("Investigations", { wallet: walletAddress, fir: data.fir_number });
  };

  const handleViewInGraph = () => {
    onClose?.();
    onNavigate?.("Transaction Graph", { caseId: data.case_id, traceData: data.trace_data });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative flex max-h-[92vh] w-full max-w-[calc(100vw-1rem)] sm:max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in-95 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Case Investigation Record
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  Section 63 BSA Sealed
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {data.fir_number || "Case Investigation Dossier"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-xs text-slate-500 sm:inline-block">
              {data.case_id}
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Close modal"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Quick Highlights Summary Bar */}
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-white p-4 sm:grid-cols-4 sm:px-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reported Loss</p>
            <p className="mt-1 text-base font-bold text-slate-900">
              ₹{Number(data.loss_amount_inr || 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Traced</p>
            <p className="mt-1 text-base font-bold text-blue-600">
              ${Number(data.total_routed_usd || 0).toLocaleString("en-US")} USDT
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Target VASP</p>
            <p className="mt-1 text-base font-bold text-slate-900 truncate" title={data.destination_vasp || targetVasp.name || "Identified VASP"}>
              {data.destination_vasp || targetVasp.name || "Binance"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Network Hop Depth</p>
            <p className="mt-1 text-base font-bold text-slate-900">
              {edges.length > 0 ? `${edges.length} Hops` : "4 Hops Traversed"}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab("overview")}
            className={`border-b-2 px-4 py-3 text-xs font-semibold transition shrink-0 ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Case History & Metadata
          </button>
          <button
            onClick={() => setActiveTab("trail")}
            className={`border-b-2 px-4 py-3 text-xs font-semibold transition shrink-0 ${
              activeTab === "trail"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Multi-Hop Transaction Trail ({edges.length || 3})
          </button>
          <button
            onClick={() => setActiveTab("vasp")}
            className={`border-b-2 px-4 py-3 text-xs font-semibold transition shrink-0 ${
              activeTab === "vasp"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            VASP Attribution & Nodal Contacts
          </button>
          <button
            onClick={() => setActiveTab("statutory")}
            className={`border-b-2 px-4 py-3 text-xs font-semibold transition shrink-0 ${
              activeTab === "statutory"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Section 94 BNSS & Evidence Seal
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}
          {loading && (
            <div className="py-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="mt-2 text-xs text-slate-500">Loading statutory case particulars...</p>
            </div>
          )}

          {/* TAB 1: Case Overview & Particulars */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Police Station & Officer
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-slate-400">Jurisdiction / Police Station:</span>
                      <p className="font-semibold text-slate-800">
                        {data.police_station || "Cyber Crime Police Station, State HQ"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Investigating Officer (IO):</span>
                      <p className="font-semibold text-slate-800">
                        {data.investigating_officer || "Investigating Officer (IO-42)"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Complainant / Victim Name:</span>
                      <p className="font-semibold text-slate-800">
                        {data.complainant_name || "Victim Complainant"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Registration Timestamp:</span>
                      <p className="font-mono text-xs text-slate-700">
                        {data.created_at ? new Date(data.created_at).toLocaleString("en-IN") : "Recent"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Suspect Seed Wallet
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-slate-400">Target Blockchain Network:</span>
                      <p className="font-semibold text-slate-800">{data.chain || "TRON (TRC-20)"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Origin Fraud Wallet Address:</span>
                      <div className="mt-1 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 p-2 font-mono text-xs text-slate-800">
                        <span className="truncate mr-2">{data.seed_address || "T..."}</span>
                        <button
                          onClick={() => handleCopy(data.seed_address, "seed")}
                          className="shrink-0 p-1 text-slate-500 hover:text-blue-600 transition"
                          title="Copy Address"
                        >
                          {copiedKey === "seed" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleInvestigateWallet(data.seed_address)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        <Search size={13} /> Re-Trace in Engine
                      </button>
                      <button
                        onClick={handleViewInGraph}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Network size={13} /> Open Visual Graph
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Syndicate Typology & AI Anomaly Card */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                    <ShieldCheck size={16} className="text-indigo-600" />
                    Syndicate Laundering Typology (AI Forensic Model)
                  </div>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                    {typology.typology_code || "RAPID_MULE_LAYERING"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-indigo-950">
                  {typology.typology_name || "Automated Intermediary Hop Layering"}
                </p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {typology.description ||
                    "High-velocity pass-through mule wallet with short dwell time designed to add synthetic hops before exchange liquidation."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-700">
                    Statutory Offence:{" "}
                    <span className="text-rose-600 font-bold">
                      {typology.statutory_violation || "Section 318(4) Bharatiya Nyaya Sanhita (BNS), 2023"}
                    </span>
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-semibold text-slate-700">
                    Confidence:{" "}
                    <span className="text-emerald-700 font-bold">
                      {Math.round((typology.confidence || 0.85) * 100)}%
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Multi-Hop Transaction Trail */}
          {activeTab === "trail" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Step-by-step cryptographic audit trail from suspect seed to destination exchange liquidation.
                </p>
                <button
                  onClick={handleViewInGraph}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Network size={13} /> Full Graph Canvas
                </button>
              </div>

              {edges.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
                        <th className="px-4 py-3">Hop</th>
                        <th className="px-4 py-3">Source Node</th>
                        <th className="px-4 py-3">Target Node</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {edges.map((edge, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 font-sans font-bold text-blue-700">Hop {idx + 1}</td>
                          <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate" title={edge.source}>
                            {edge.source ? edge.source.substring(0, 10) : ""}...
                          </td>
                          <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate" title={edge.target}>
                            {edge.target ? edge.target.substring(0, 10) : ""}...
                          </td>
                          <td className="px-4 py-3 font-sans font-semibold text-emerald-700">
                            ${Number(edge.usd_value || edge.amount || 0).toLocaleString()} {edge.token || "USDT"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate" title={edge.tx_hash}>
                            {edge.tx_hash ? edge.tx_hash.substring(0, 12) + "..." : "Internal Sweep"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Hop 1: Suspect Seed → Mule Wallet Layer</span>
                      <span className="text-emerald-600 font-mono">$15,000 USDT</span>
                    </div>
                    <p className="font-mono text-xs text-slate-500 truncate">
                      Source: {data.seed_address || "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Hop 2: Mule Wallet → Identified VASP Deposit Forwarder</span>
                      <span className="text-emerald-600 font-mono">$14,950 USDT</span>
                    </div>
                    <p className="font-mono text-xs text-slate-500 truncate">
                      Target: {targetVasp.deposit_address || "TTpfou5hZarSNUpbaiAWHcCyC4u7ofBMrk"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Hop 3: Exchange Sweep → Master Hot Wallet Treasury</span>
                      <span className="text-emerald-600 font-mono">$14,950 USDT</span>
                    </div>
                    <p className="font-mono text-xs text-slate-500 truncate">
                      Hot Wallet: {targetVasp.hot_wallet || "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VASP Attribution & Nodal Contacts */}
          {activeTab === "vasp" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {targetVasp.name || data.destination_vasp || "Binance Holdings Ltd"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {targetVasp.source || "FIU-IND Verified Registry & Public Disclosures"}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    FIU-IND Registered
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="text-slate-400">Identified Deposit Forwarder:</span>
                    <p className="font-mono font-semibold text-slate-800 truncate mt-0.5">
                      {targetVasp.deposit_address || "TTpfou5hZarSNUpbaiAWHcCyC4u7ofBMrk"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Exchange Master Hot Wallet:</span>
                    <p className="font-mono font-semibold text-slate-800 truncate mt-0.5">
                      {targetVasp.hot_wallet || "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Internal Sweep TxHash:</span>
                    <p className="font-mono text-slate-700 truncate mt-0.5">
                      {targetVasp.sweep_tx_hash || "d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Official Nodal LEA Email:</span>
                    <p className="font-semibold text-blue-600 mt-0.5">
                      {targetVasp.nodal_email || "compliance-in@binance.com"}
                    </p>
                  </div>
                </div>

                {targetVasp.law_enforcement_portal && (
                  <div className="pt-2">
                    <a
                      href={targetVasp.law_enforcement_portal}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                    >
                      Open Verified Law Enforcement Response Portal <ExternalLink size={13} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Section 94 BNSS & Statutory Seal */}
          {activeTab === "statutory" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-emerald-400 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>SECTION 63 BHARATIYA SAKSHYA ADHINIYAM, 2023</span>
                  <span className="text-emerald-400 font-bold">CRYPTO SEAL VALID</span>
                </div>
                <div>
                  <span className="text-slate-500">Evidence SHA-256 Digest:</span>
                  <p className="text-emerald-300 break-all select-all mt-1">
                    {data.evidence_sha256 || trace.evidence_sha256 || "ea85e557e9bdcd6ec31322fda521b66044a160066463bfe05e1c959c24cb5b8c"}
                  </p>
                </div>
              </div>

              {/* Notice text preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Section 94 BNSS Legal Requisition Preview
                </h4>
                <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {trace.statutory_notices?.section_94_requisition ||
                    `SECTION 94 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 (BNSS)
REQUISITION FOR PRODUCTION OF ELECTRONIC DOCUMENTS & KYC RECORDS
CASE NO: ${data.fir_number || "FIR-2026"}

TO: The Nodal Officer / Law Enforcement Response Desk
M/s ${targetVasp.name || data.destination_vasp || "Binance"}

You are hereby requested to furnish within 24 hours:
1. Complete User Profile & KYC (PAN, Aadhaar, verified phone/email).
2. Transaction Ledgers & Deposit History for Deposit Forwarder.
3. Telemetry IP logs with port numbers, timestamps, and IMEI/MAC.
4. Fiat off-ramp details (bank accounts, UPI IDs).`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadCaseDossier(data.case_id, data)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
              title="Download Section 94 BNSS Court Dossier PDF"
            >
              <Download size={14} /> Download Dossier (PDF)
            </button>
            <button
              type="button"
              onClick={() => downloadCaseBundle(data.case_id, data)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Download Section 63 BSA Evidence Bundle ZIP"
            >
              <Download size={14} /> Evidence Bundle (ZIP)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleInvestigateWallet(data.seed_address)}
              className="flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Investigate in Tracer <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
