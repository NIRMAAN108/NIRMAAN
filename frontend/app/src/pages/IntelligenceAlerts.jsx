import { useState } from "react";
import {
  Bell,
  ShieldAlert,
  ShieldCheck,
  Search,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Activity,
  Network,
  Zap,
  Building2,
} from "lucide-react";

const INITIAL_ALERTS = [
  {
    id: "ALT-2026-901",
    title: "Golden Hour Capital Flight Flagged",
    fir: "FIR-2026/CYBER/88912",
    wallet: "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
    chain: "TRON (TRC-20)",
    amount: "$14,950 USDT",
    targetVasp: "Binance Holdings Ltd",
    severity: "CRITICAL",
    time: "4 minutes ago",
    typology: "RAPID_FORWARDING_BOT (dwell=1200s)",
    description: "Multi-hop pass-through mule wallet forwarding funds to known Binance deposit infrastructure within golden hour window.",
    status: "ACTION_REQUIRED",
  },
  {
    id: "ALT-2026-902",
    title: "Algorithmic 90/10 Peeling Chain Detected",
    fir: "FIR-2026/MUMBAI/1042",
    wallet: "TSGRsppW4vSaWWstQUTa2d4CWJDWBRkWVA",
    chain: "TRON (TRC-20)",
    amount: "$88,400 USDT",
    targetVasp: "Bybit Financial",
    severity: "HIGH",
    time: "18 minutes ago",
    typology: "PEELING_CHAIN_SMURF",
    description: "Automated splitting where 90% is peeled into intermediary mules and 10% change output retained to evade heuristic thresholds.",
    status: "INVESTIGATING",
  },
  {
    id: "ALT-2026-903",
    title: "Section 63 BSA Tamper-Proof Seal Computed",
    fir: "FIR-E2E-AUDIT/2026",
    wallet: "TTpfou5hZarSNUpbaiAWHcCyC4u7ofBMrk",
    chain: "TRON (TRC-20)",
    amount: "$18,500 USDT",
    targetVasp: "Binance",
    severity: "MEDIUM",
    time: "42 minutes ago",
    typology: "EXCHANGE_SWEEP_CONFIRMED",
    description: "Deposit forwarder consolidation into Master Hot Wallet confirmed; SHA-256 digital certificate generated.",
    status: "SEALED",
  },
  {
    id: "ALT-2026-904",
    title: "High-Volume Unregistered VASP Interaction",
    fir: "FIR-2026/BLR/5512",
    wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    chain: "Ethereum (ERC-20)",
    amount: "$124,000 USDT",
    targetVasp: "FixedFloat (Offshore)",
    severity: "CRITICAL",
    time: "1 hour ago",
    typology: "NON_COMPLIANT_OFFSHORE_MIXER",
    description: "Proceeds routed towards non-FIU registered foreign instant swap exchange with no designated Indian nodal officer.",
    status: "ACTION_REQUIRED",
  },
  {
    id: "ALT-2026-905",
    title: "Pass-Through Mule Cluster Convergence",
    fir: "FIR-TEST/2026",
    wallet: "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N",
    chain: "TRON (TRC-20)",
    amount: "$25,000 USDT",
    targetVasp: "CoinDCX",
    severity: "LOW",
    time: "2 hours ago",
    typology: "STANDARD_RAPID_MULE",
    description: "Identified domestic FIU-registered exchange deposit point with verified Section 94 nodal contact.",
    status: "RESOLVED",
  },
];

const SEVERITY_STYLES = {
  CRITICAL: {
    bg: "bg-rose-50 border-rose-200 text-rose-700",
    badge: "bg-rose-600 text-white",
    dot: "bg-rose-500",
  },
  HIGH: {
    bg: "bg-amber-50 border-amber-200 text-amber-700",
    badge: "bg-amber-500 text-white",
    dot: "bg-amber-500",
  },
  MEDIUM: {
    bg: "bg-blue-50 border-blue-200 text-blue-700",
    badge: "bg-blue-600 text-white",
    dot: "bg-blue-500",
  },
  LOW: {
    bg: "bg-slate-50 border-slate-200 text-slate-700",
    badge: "bg-slate-600 text-white",
    dot: "bg-slate-500",
  },
};

export default function IntelligenceAlerts({ onNavigate }) {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [networkFilter, setNetworkFilter] = useState("ALL");
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInvestigate = (alert) => {
    onNavigate?.("Investigations", { wallet: alert.wallet, fir: alert.fir });
  };

  const handleViewGraph = () => {
    onNavigate?.("Transaction Graph");
  };

  const handleDismiss = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredAlerts = alerts.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.wallet.toLowerCase().includes(q) ||
      item.fir.toLowerCase().includes(q) ||
      item.targetVasp.toLowerCase().includes(q);

    const matchesSeverity = severityFilter === "ALL" || item.severity === severityFilter;
    const matchesNetwork = networkFilter === "ALL" || item.chain.includes(networkFilter);

    return matchesSearch && matchesSeverity && matchesNetwork;
  });

  return (
    <div className="w-full space-y-7 p-5 sm:p-8 lg:p-10 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Zap size={14} /> National Cyber Threat Telemetry
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Intelligence & Tactical Alerts</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Continuous algorithmic surveillance monitoring rapid layering bots, peeling chains, and high-velocity exchange inflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAlerts(INITIAL_ALERTS)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw size={13} /> Reset Feed
          </button>
          <button
            onClick={() => onNavigate?.("Investigations")}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            + New Investigation
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Alerts</span>
            <ShieldAlert size={18} className="text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{alerts.length}</p>
          <p className="mt-1 text-xs text-rose-600 font-medium">2 Critical Golden Hour cases</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Intercepted Inflow</span>
            <Building2 size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">$270,850</p>
          <p className="mt-1 text-xs text-blue-600 font-medium">USDT across 5 exchanges</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Node Monitors</span>
            <Activity size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">100%</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">TRON, ETH, BSC synchronized</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">FIU VASPs Active</span>
            <ShieldCheck size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">41</p>
          <p className="mt-1 text-xs text-slate-500">Direct Nodal LEA Desks</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by wallet, FIR, or exchange..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold text-slate-600">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  severityFilter === s ? "bg-white text-blue-600 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Network Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold text-slate-600">
            {["ALL", "TRON", "Ethereum"].map((n) => (
              <button
                key={n}
                onClick={() => setNetworkFilter(n)}
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  networkFilter === n ? "bg-white text-blue-600 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            <Bell size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No alerts match the selected filters.</p>
            <p className="text-xs text-slate-400 mt-1">Clear your search query or adjust severity thresholds.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const sev = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.LOW;

            return (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${sev.dot} animate-pulse shrink-0`} />
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sev.badge}`}>
                      {alert.severity}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{alert.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Clock size={13} />
                    <span>{alert.time}</span>
                    <span>·</span>
                    <span>{alert.id}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>

                {/* Key Particulars Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">FIR Reference:</span>
                    <span className="font-semibold text-slate-800">{alert.fir}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Intercepted Value:</span>
                    <span className="font-bold text-blue-700">{alert.amount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Target VASP:</span>
                    <span className="font-semibold text-slate-800">{alert.targetVasp}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Network:</span>
                    <span className="font-semibold text-slate-800">{alert.chain}</span>
                  </div>
                </div>

                {/* Suspect Address Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-slate-400 shrink-0 font-sans font-semibold">Flagged Wallet:</span>
                    <span className="truncate text-slate-800 select-all">{alert.wallet}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(alert.wallet, alert.id)}
                    className="shrink-0 flex items-center gap-1 text-slate-500 hover:text-blue-600 font-sans font-medium transition"
                  >
                    {copiedKey === alert.id ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">Typology:</span>
                    <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                      {alert.typology}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleViewGraph(alert)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
                    >
                      <Network size={13} /> View Graph
                    </button>
                    <button
                      onClick={() => handleInvestigate(alert)}
                      className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition flex items-center gap-1"
                    >
                      Launch Investigation <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
