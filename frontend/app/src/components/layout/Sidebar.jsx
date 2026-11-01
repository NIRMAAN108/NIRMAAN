import {
  LayoutDashboard,
  Search,
  Network,
  Wallet,
  Building2,
  FileText,
  BriefcaseBusiness,
  Bell,
  Settings,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function BrandLogo({ size = 40 }) {
  return (
    <div
      className="grid grid-cols-2 gap-[2px] overflow-hidden rounded-full shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="bg-[#F25022]" />
      <span className="bg-[#7FBA00]" />
      <span className="bg-[#00A4EF]" />
      <span className="bg-[#FFB900]" />
    </div>
  );
}

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Investigations", icon: Search },
  { name: "Transaction Graph", icon: Network },
  { name: "Wallet Details", icon: Wallet },
  { name: "VASP Attribution", icon: Building2 },
  { name: "Legal Dossiers", icon: FileText },
  { name: "Case Management", icon: BriefcaseBusiness },
  { name: "Intelligence & Alerts", icon: Bell },
];

export default function Sidebar({
  activePage = "Dashboard",
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}) {
  return (
    <div className={`flex h-full min-h-0 w-full flex-col overflow-y-auto bg-white transition-all duration-300 ${
      collapsed ? "px-2 py-4 items-center" : "p-5"
    }`}>
      {/* Brand & Collapse Header */}
      <div className={`mb-7 flex w-full shrink-0 items-center ${
        collapsed ? "flex-col gap-3 justify-center" : "justify-between px-1"
      }`}>
        <div
          onClick={() => onNavigate?.("Dashboard")}
          className="flex items-center gap-3 cursor-pointer select-none"
          title="NIRMAAN ChainTrace AI"
        >
          <BrandLogo size={collapsed ? 36 : 40} />
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">NIRMAAN</h1>
              <p className="text-xs font-semibold text-blue-600">ChainTrace AI</p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {/* Navigation Modules */}
      <nav className={`w-full shrink-0 space-y-1.5 ${collapsed ? "flex flex-col items-center" : ""}`}>
        {navigation.map(({ name, icon: Icon }) => {
          const isActive = activePage === name;

          if (collapsed) {
            return (
              <button
                key={name}
                type="button"
                onClick={() => onNavigate?.(name)}
                title={name}
                aria-label={name}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition ${
                  isActive
                    ? "bg-[#0866D9] text-white shadow-md shadow-blue-500/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={20} />
                {/* Floating tooltip on hover */}
                <span className="pointer-events-none absolute left-full ml-3 z-50 hidden whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
                  {name}
                </span>
              </button>
            );
          }

          return (
            <button
              key={name}
              type="button"
              onClick={() => onNavigate?.(name)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                isActive
                  ? "bg-[#0866D9] text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={19} className="shrink-0" />
              <span className="truncate">{name}</span>
            </button>
          );
        })}
      </nav>

      {/* Secondary Settings / Help */}
      <div className={`mt-6 w-full shrink-0 space-y-1.5 border-t border-slate-200 pt-4 ${
        collapsed ? "flex flex-col items-center" : ""
      }`}>
        {collapsed ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate?.("Settings")}
              title="Settings"
              className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
                activePage === "Settings"
                  ? "bg-[#0866D9] text-white shadow-md shadow-blue-500/25"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Settings size={18} />
              <span className="pointer-events-none absolute left-full ml-3 z-50 hidden whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
                Settings
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("Help & Docs")}
              title="Help & Documentation"
              className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
                activePage === "Help & Docs" || activePage === "Help"
                  ? "bg-[#0866D9] text-white shadow-md shadow-blue-500/25"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <CircleHelp size={18} />
              <span className="pointer-events-none absolute left-full ml-3 z-50 hidden whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
                Help & Docs
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onNavigate?.("Settings")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activePage === "Settings"
                  ? "bg-[#0866D9] text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Settings size={18} className="shrink-0" />
              <span>Settings</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.("Help & Docs")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activePage === "Help & Docs" || activePage === "Help"
                  ? "bg-[#0866D9] text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <CircleHelp size={18} className="shrink-0" />
              <span>Help & Docs</span>
            </button>
          </>
        )}
      </div>

      {/* Footer System Status */}
      <div className={`mt-auto shrink-0 pt-6 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
            title="SIH26183 Operational (TRON TRC-20)"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <BrandLogo size={28} />
            <div className="overflow-hidden whitespace-nowrap text-left">
              <p className="text-xs font-bold text-slate-800">SIH26183</p>
              <p className="text-[11px] text-slate-500">TRON TRC-20 Engine</p>
              <p className="mt-0.5 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Operational
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
