import { useState, useEffect } from "react";
import { BriefcaseBusiness, FileText, Download, ShieldCheck, Search, ExternalLink } from "lucide-react";
import { fetchCases, getDossierDownloadUrl, getBundleDownloadUrl } from "../services/api";
import CaseDetailModal from "../components/modals/CaseDetailModal";

export default function CaseManagement({ onNavigate, title = "Case Management Vault", initialSearch = "" }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch || "");
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    fetchCases()
      .then((data) => {
        if (Array.isArray(data)) setCases(data);
      })
      .catch((err) => console.warn("Failed to fetch cases:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = cases.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.fir_number && c.fir_number.toLowerCase().includes(q)) ||
      (c.seed_address && c.seed_address.toLowerCase().includes(q)) ||
      (c.destination_vasp && c.destination_vasp.toLowerCase().includes(q)) ||
      (c.chain && c.chain.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-8 space-y-7 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <ShieldCheck size={14} /> Statutory Evidence Vault Active
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1">
            Permanent repository of investigated cyber fraud cases, Section 94 BNSS summons, and Section 63 BSA evidence bundles.
          </p>
        </div>

        <button
          onClick={() => onNavigate && onNavigate("Investigations")}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          + New Investigation
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 w-full max-w-md">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by FIR, address, or VASP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} Case{filtered.length !== 1 ? "s" : ""} Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">FIR / Case ID</th>
                <th className="px-5 py-3.5">Seed Address</th>
                <th className="px-5 py-3.5">Network</th>
                <th className="px-5 py-3.5">Target VASP</th>
                <th className="px-5 py-3.5">Loss (INR)</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                    Loading statutory case records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                    No cases match your search. Run an investigation to record evidence.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const dateStr = c.created_at
                    ? new Date(c.created_at).toLocaleDateString("en-IN")
                    : "Recent";
                  return (
                    <tr
                      key={c.case_id}
                      onClick={() => setSelectedCase(c)}
                      className="border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition group"
                      title="Click to view complete case history, trail & dossier"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-blue-700 flex items-center gap-1.5">
                          <span className="group-hover:underline">{c.fir_number}</span>
                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition text-blue-600" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.case_id}</div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 truncate max-w-[140px]" title={c.seed_address}>
                        {c.seed_address ? c.seed_address.substring(0, 12) : "N/A"}...
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">{c.chain}</td>
                      <td className="px-5 py-4 font-medium text-blue-700">
                        {c.destination_vasp || "In-Transit"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        ₹{Number(c.loss_amount_inr || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{dateStr}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedCase(c)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-2xs"
                          >
                            View
                          </button>
                          <a
                            href={getDossierDownloadUrl(c.case_id)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                            title="Download Section 94 BNSS Court Dossier"
                          >
                            PDF
                          </a>
                          <a
                            href={getBundleDownloadUrl(c.case_id)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition"
                            title="Download Section 63 BSA Evidence ZIP"
                          >
                            ZIP
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details & Complete Forensic History Modal */}
      <CaseDetailModal
        isOpen={!!selectedCase}
        caseId={selectedCase?.case_id}
        initialCaseData={selectedCase}
        onClose={() => setSelectedCase(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
