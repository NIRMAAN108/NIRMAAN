import { useState, useEffect, useRef } from "react";
import {
  Menu, ArrowLeft, Home, Search, Bell, Grid3X3,
  ChevronDown, X, ShieldCheck, CheckCircle2,
  ExternalLink, BriefcaseBusiness, Network, Wallet, FileText, AlertTriangle
} from "lucide-react";

export default function Header({
  activePage = "Dashboard",
  onNavigate,
  onGoBack,
  canGoBack = false,
  onToggleSidebar
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchInputRef = useRef(null);
  const appsMenuRef = useRef(null);
  const alertsMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Keyboard shortcut Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setShowAppsMenu(false);
        setShowAlertsMenu(false);
        setShowProfileMenu(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (appsMenuRef.current && !appsMenuRef.current.contains(e.target)) {
        setShowAppsMenu(false);
      }
      if (alertsMenuRef.current && !alertsMenuRef.current.contains(e.target)) {
        setShowAlertsMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Route smartly based on input shape
    if (
      q.startsWith("T") ||
      q.startsWith("0x") ||
      q.startsWith("0X") ||
      q.startsWith("bc1") ||
      q.startsWith("1") ||
      q.startsWith("3")
    ) {
      onNavigate?.("Investigations", { wallet: q });
    } else if (
      q.toLowerCase().startsWith("fir") ||
      q.toLowerCase().startsWith("ncrp") ||
      q.toLowerCase().startsWith("case_")
    ) {
      onNavigate?.("Case Management", { search: q });
    } else {
      onNavigate?.("Investigations", { wallet: q });
    }
  };

  const apps = [
    { name: "Dashboard", desc: "Overview & Intelligence", icon: Home, page: "Dashboard" },
    { name: "Investigations", desc: "Multi-Hop BFS Tracer", icon: Search, page: "Investigations" },
    { name: "Transaction Graph", desc: "Visual Node Topology", icon: Network, page: "Transaction Graph" },
    { name: "Wallet Details", desc: "Ledger History & Analytics", icon: Wallet, page: "Wallet Details" },
    { name: "VASP Attribution", desc: "Exchange Registry (41 VASPs)", icon: ShieldCheck, page: "VASP Attribution" },
    { name: "Legal Dossiers", desc: "Section 94 BNSS & 63 BSA", icon: FileText, page: "Legal Dossiers" },
    { name: "Case Management", desc: "Court Evidence Vault", icon: BriefcaseBusiness, page: "Case Management" },
  ];

  const alerts = [
    {
      id: 1,
      title: "Section 63 BSA Evidence Sealed",
      desc: "SHA-256 seal computed and anchored for FIR-88/2026.",
      time: "2m ago",
      type: "success"
    },
    {
      id: 2,
      title: "Binance Hot Wallet Sweep Identified",
      desc: "Sweep consolidation detected: 0x9522... -> 0x3f5c...",
      time: "14m ago",
      type: "info"
    },
    {
      id: 3,
      title: "High Peeling Ratio Flagged",
      desc: "Algorithmic 90/10 smurfing pattern detected on TRON node.",
      time: "1h ago",
      type: "warning"
    }
  ];

  return (
    <header className="h-[76px] bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-xs">
      {/* Left: Navigation Controls & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 mr-4">
        {/* Toggle Sidebar Button (Always accessible) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          title="Toggle Navigation Sidebar"
          className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition active:scale-95"
        >
          <Menu size={20} />
        </button>

        {/* Go Back Arrow */}
        <button
          type="button"
          onClick={onGoBack}
          disabled={!canGoBack}
          title={canGoBack ? "Go Back to Previous Page" : "At Root Page"}
          className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
            canGoBack
              ? "border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 cursor-pointer shadow-xs"
              : "border-slate-100 text-slate-300 cursor-not-allowed"
          }`}
        >
          <ArrowLeft size={16} />
          <span className="hidden xl:inline">Back</span>
        </button>

        {/* Go Home Button */}
        <button
          type="button"
          onClick={() => onNavigate?.("Dashboard")}
          title="Return to Main Dashboard"
          className={`p-2 rounded-xl border border-slate-200 transition text-xs font-semibold flex items-center gap-1 shadow-xs active:scale-95 ${
            activePage === "Dashboard"
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"
          }`}
        >
          <Home size={16} />
          <span className="hidden xl:inline">Home</span>
        </button>

        {/* Breadcrumb Trail */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium pl-1">
          <span
            onClick={() => onNavigate?.("Dashboard")}
            className="text-slate-400 hover:text-blue-600 cursor-pointer transition"
          >
            NIRMAAN
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
            {activePage}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="relative flex-1 max-w-[550px] mx-2"
      >
        <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Wallet, FIR, or TxID... (Ctrl + K)"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-16 text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-inner"
        />
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 rounded text-slate-400 hover:text-slate-600 text-xs"
            >
              <X size={14} />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-500 border border-slate-300/60">
            Ctrl K
          </span>
        </div>
      </form>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Module Quick Switcher */}
        <div className="relative" ref={appsMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowAppsMenu(!showAppsMenu);
              setShowAlertsMenu(false);
              setShowProfileMenu(false);
            }}
            title="Forensic Modules Quick Switcher"
            className={`p-2.5 rounded-xl border transition ${
              showAppsMenu
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-blue-600"
            }`}
          >
            <Grid3X3 size={19} />
          </button>

          {showAppsMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 px-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Forensic Modules</span>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">Active Core</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {apps.map((app) => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.name}
                      type="button"
                      onClick={() => {
                        onNavigate?.(app.page);
                        setShowAppsMenu(false);
                      }}
                      className={`flex items-center gap-3 p-2 rounded-xl text-left transition ${
                        activePage === app.page
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${activePage === app.page ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{app.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{app.desc}</div>
                      </div>
                    </button>
                  );
                })}
                {/* Cytoscape Standalone View */}
                <a
                  href="/app/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-2 rounded-xl text-left hover:bg-indigo-50 text-indigo-700 transition mt-1 border-t border-slate-100 pt-2"
                >
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                    <ExternalLink size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold">Cytoscape Visualizer</div>
                    <div className="text-[10px] text-indigo-500">Open standalone graph canvas</div>
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Intelligence Alerts */}
        <div className="relative" ref={alertsMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowAlertsMenu(!showAlertsMenu);
              setShowAppsMenu(false);
              setShowProfileMenu(false);
            }}
            title="Real-time Forensic Alerts"
            className={`relative p-2.5 rounded-xl border transition ${
              showAlertsMenu
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-blue-600"
            }`}
          >
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          </button>

          {showAlertsMenu && (
            <div className="absolute right-0 mt-2 w-84 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 px-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tactical Intelligence Alerts</span>
                <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">3 New</span>
              </div>
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{a.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{a.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{a.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.("Case Management");
                    setShowAlertsMenu(false);
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  View All Cases & Audit Logs →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Officer Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowAppsMenu(false);
              setShowAlertsMenu(false);
            }}
            className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border transition ${
              showProfileMenu
                ? "bg-slate-100 border-slate-300"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              A
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-none">Officer</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">IO-CYBER-8842</div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-2 px-1">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  A
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Investigating Officer</div>
                  <div className="text-slate-500 text-[11px]">Cyber Crime Police Station</div>
                  <div className="text-emerald-600 text-[10px] font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Authenticated Session Active
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-600 py-1">
                <div className="flex justify-between py-1 px-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400">Jurisdiction:</span>
                  <span className="font-medium text-slate-800">MHA / I4C Portal</span>
                </div>
                <div className="flex justify-between py-1 px-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400">Statutory Authority:</span>
                  <span className="font-medium text-slate-800">Sec 94 BNSS / 63 BSA</span>
                </div>
                <div className="flex justify-between py-1 px-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400">Engine Build:</span>
                  <span className="font-mono text-slate-800">v2.0-SEC63 (WAL)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.("Case Management");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-between"
                >
                  <span>Case Management Vault</span>
                  <BriefcaseBusiness size={14} className="text-slate-400" />
                </button>
                <a
                  href="/app/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-50 font-semibold text-blue-600 flex items-center justify-between"
                >
                  <span>Cytoscape Canvas</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
