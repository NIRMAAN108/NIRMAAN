
import {
  LayoutDashboard,
  Search,
  Network,
  FileText,
  BriefcaseBusiness,
  Bell,
  Settings,
  CircleHelp,
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
  { name: "Legal Dossiers", icon: FileText },
  { name: "Case Management", icon: BriefcaseBusiness },
  { name: "Intelligence & Alerts", icon: Bell },
];

export default function Sidebar({ activePage = "Dashboard", onNavigate }) {
  return (
    <aside className="w-[260px] min-h-screen bg-white border-r border-slate-200 flex flex-col p-5 shrink-0">
      <div className="flex items-center gap-3 mb-12 px-2">
        <BrandLogo size={44} />
        <div>
          <h1 className="text-xl font-bold text-slate-900">NIRMAAN</h1>
          <p className="text-sm text-slate-500">ChainTrace AI</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navigation.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => onNavigate?.(name)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition ${
              activePage === name
                ? "bg-[#0866D9] text-white shadow-md shadow-blue-100"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Icon size={20} />
            {name}
          </button>
        ))}
      </nav>

      <div className="mt-6 pt-5 border-t border-slate-200 space-y-2">
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm text-slate-700 hover:bg-slate-100">
          <Settings size={20} /> Settings
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm text-slate-700 hover:bg-slate-100">
          <CircleHelp size={20} /> Help
        </button>
      </div>

      <div className="mt-auto pt-8">
        <div className="flex items-center gap-3">
          <BrandLogo size={34} />
          <div>
            <p className="font-semibold text-sm text-slate-900">SIH26183</p>
            <p className="text-xs text-slate-500">TRON TRC-20 Engine</p>
            <p className="text-xs text-green-600 mt-1">● Operational</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
