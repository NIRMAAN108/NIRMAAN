import { useState, useEffect, useRef } from "react";
import {
  Menu, ArrowLeft, Home, Search, Bell, Grid3X3,
  ChevronDown, X, ShieldCheck,
  ExternalLink, BriefcaseBusiness, Network, Wallet, FileText,
  Settings, CircleHelp, ArrowRight
} from "lucide-react";

export default function Header({
  activePage = "Dashboard",
  onNavigate,
  onGoBack,
  canGoBack = false,
  onToggleSidebar,
  sidebarCollapsed = false
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [officerProfile, setOfficerProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("nirmaan_officer_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          name: parsed.officerName || "Inspector Rajesh Sharma",
          badge: parsed.badgeId || "IO-77-CYBER",
          station: parsed.policeStation || "Cyber Crime Police Station",
          state: parsed.stateUt || "Delhi NCT",
          email: parsed.leaEmail || "io.cyber77@delhipolice.gov.in"
        };
      }
    } catch {
      // ignore
    }
    return {
      name: "Inspector Rajesh Sharma",
      badge: "IO-77-CYBER",
      station: "Cyber Crime Police Station",
      state: "Delhi NCT",
      email: "io.cyber77@delhipolice.gov.in"
    };
  });

  const refreshOfficerProfile = () => {
    try {
      const stored = localStorage.getItem("nirmaan_officer_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        setOfficerProfile((prev) => ({
          name: parsed.officerName || prev.name,
          badge: parsed.badgeId || prev.badge,
          station: parsed.policeStation || prev.station,
          state: parsed.stateUt || prev.state,
          email: parsed.leaEmail || prev.email
        }));
      }
    } catch {
      // ignore
    }
  };
  const officerInitials = (officerProfile.name || "IO")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("") || "IO";

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
    <header className="h-[76px] bg-white border-b border-slate-200 flex items-center justify-between px-2 sm:px-4 lg:px-8 sticky top-0 z-30 shadow-xs">
      {/* Left: Navigation Controls & Breadcrumbs */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 mr-1 sm:mr-3">
        {/* Toggle Sidebar Button (Collapse / Expand) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition active:scale-95"
        >
          <Menu size={18} className="sm:w-5 sm:h-5" />
        </button>

        {/* Go Back Arrow */}
        <button
          type="button"
          onClick={onGoBack}
          disabled={!canGoBack}
          title={canGoBack ? "Go Back to Previous Page" : "At Root Page"}
          className={`p-1.5 sm:p-2 rounded-xl border transition flex items-center justify-center text-xs font-semibold ${
            canGoBack
              ? "border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 cursor-pointer shadow-xs"
              : "border-slate-100 text-slate-300 cursor-not-allowed"
          }`}
        >
          <ArrowLeft size={16} />
        </button>

        {/* Go Home Button (hidden on mobile, visible on sm+) */}
        <button
          type="button"
          onClick={() => onNavigate?.("Dashboard")}
          title="Return to Main Dashboard"
          className={`hidden sm:flex p-1.5 sm:p-2 rounded-xl border transition text-xs font-semibold items-center justify-center shadow-xs active:scale-95 ${
            activePage === "Dashboard"
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600"
          }`}
        >
          <Home size={16} />
        </button>
      </div>

      {/* Center: Global Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="relative min-w-0 flex-1 max-w-[550px] mx-1 sm:mx-2"
      >
        <Search className="absolute left-3 top-3 sm:left-3.5 sm:top-3 text-slate-400" size={16} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Wallet, FIR, or TxID... (Ctrl + K)"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-8 sm:py-2.5 sm:pl-10 sm:pr-10 text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-inner truncate"
        />
        <div className="absolute right-2 top-2 sm:right-2.5 sm:top-2.5 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 rounded text-slate-400 hover:text-slate-600 text-xs"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
            className={`p-2 sm:p-2.5 rounded-xl border transition ${
              showAppsMenu
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-blue-600"
            }`}
          >
            <Grid3X3 size={18} />
          </button>

          {showAppsMenu && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                  href="/standalone-graph.html"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-2 rounded-xl text-left hover:bg-indigo-50 text-indigo-700 transition mt-1 border-t border-slate-100 pt-2"
                >
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                    <ExternalLink size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold">Cytoscape Visualizer</div>
                    <div className="text-[10px] text-indigo-500">Open standalone graph canvas (New Tab)</div>
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
            <div className="absolute right-0 mt-2 w-84 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
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
              if (!showProfileMenu) refreshOfficerProfile();
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-blue-200">
              {officerInitials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-none max-w-[130px] truncate">
                {officerProfile.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {officerProfile.badge}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200 shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-blue-100">
                    {officerInitials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {officerProfile.name}
                  </div>
                  <div className="text-slate-500 text-[11px] truncate">
                    {officerProfile.station}
                  </div>
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    <span>Sec. 94 BNSS Session Active</span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Badge ID:</span>
                  <span className="font-mono font-medium text-slate-800">{officerProfile.badge}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Jurisdiction:</span>
                  <span className="font-medium text-slate-800">{officerProfile.state}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Official LEA Email:</span>
                  <span className="font-mono text-[10px] text-slate-700 truncate max-w-[150px]">{officerProfile.email}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">Legal Standard:</span>
                  <span className="font-medium text-slate-800">Sec 94 BNSS / 63 BSA</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 mt-2.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.("Settings");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <Settings size={14} className="text-slate-500" />
                    <span>Officer & System Settings</span>
                  </div>
                  <ArrowRight size={13} className="text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.("Case Management");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness size={14} className="text-slate-500" />
                    <span>Case Vault</span>
                  </div>
                  <ArrowRight size={13} className="text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.("Transaction Graph");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <Network size={14} className="text-slate-500" />
                    <span>Transaction Graph</span>
                  </div>
                  <ArrowRight size={13} className="text-slate-400" />
                </button>
                <a
                  href="/standalone-graph.html"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 font-medium text-blue-700 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink size={14} className="text-blue-600" />
                    <span>Standalone Cytoscape Canvas</span>
                  </div>
                  <span className="text-[10px] text-blue-500 font-mono">NEW TAB</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.("Help & Documentation");
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 font-medium text-slate-700 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <CircleHelp size={14} className="text-slate-500" />
                    <span>Help & Statutory Protocols</span>
                  </div>
                  <ArrowRight size={13} className="text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
