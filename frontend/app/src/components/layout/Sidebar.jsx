
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
  X,
} from "lucide-react";

function BrandLogo({ size = 42 }) {
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

export default function Sidebar({ activePage = "Dashboard", onNavigate, onClose }) {
  const handleNav = (name) => {
    onNavigate?.(name);
    onClose?.();
  };

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-y-auto bg-white p-5">
      <div className="mb-8 flex shrink-0 items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">NIRMAAN</h1>
            <p className="text-xs font-semibold text-blue-600">ChainTrace AI</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition md:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="shrink-0 space-y-1.5">
        {navigation.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => handleNav(name)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
              activePage === name
                ? "bg-[#0866D9] text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon size={19} />
            {name}
          </button>
        ))}
      </nav>

      <div className="mt-6 shrink-0 space-y-2 border-t border-slate-200 pt-5">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
          <Settings size={19} /> Settings
        </button>
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
          <CircleHelp size={19} /> Help
        </button>
      </div>

      <div className="mt-auto shrink-0 pt-8">
        <div className="flex items-center gap-3">
          <BrandLogo size={34} />
          <div>
            <p className="text-sm font-semibold text-slate-900">SIH26183</p>
            <p className="text-xs text-slate-500">TRON TRC-20 Engine</p>
            <p className="mt-1 text-xs text-green-600">● Operational</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
