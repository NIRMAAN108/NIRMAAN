
import {
  FileText, Wallet, ShieldCheck, Activity,
  Clock, Search, ArrowRight
} from "lucide-react";

const stats = [
  { title: "Total Cases", value: "248", icon: FileText, color: "blue" },
  { title: "Wallets Traced", value: "1,842", icon: Wallet, color: "green" },
  { title: "VASP Identified", value: "126", icon: ShieldCheck, color: "yellow" },
  { title: "Active Investigations", value: "36", icon: Activity, color: "red" },
];

const cases = [
  ["FIR-88/2026", "TRON · TRC-20", "Binance", "In Progress"],
  ["FIR-91/2026", "Ethereum · ERC-20", "Bybit", "Under Review"],
  ["FIR-94/2026", "BSC · BEP-20", "CoinDCX", "Completed"],
];

const colors = {
  blue: "border-blue-500 bg-blue-50 text-blue-600",
  green: "border-green-500 bg-green-50 text-green-600",
  yellow: "border-yellow-500 bg-yellow-50 text-yellow-600",
  red: "border-red-500 bg-red-50 text-red-600",
};

export default function Dashboard({ onNavigate }) {
  return (
    <div className="p-4 sm:p-8 space-y-7">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, Officer</h1>
          <p className="text-slate-500 mt-2">Monitor, trace and investigate blockchain transactions with AI.</p>
        </div>
        <span className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm">● System Operational</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map(({ title, value, icon: Icon, color }) => (
          <div key={title} className={`bg-white border border-slate-200 border-l-4 ${colors[color].split(" ")[0]} rounded-2xl p-6 shadow-sm`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500">{title}</p>
                <h2 className="text-3xl font-bold mt-2 text-slate-900">{value}</h2>
              </div>
              <div className={`p-4 rounded-xl ${colors[color].split(" ").slice(1).join(" ")}`}>
                <Icon size={25} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="text-blue-600" /> Recent Investigations</h2>
            <button onClick={() => onNavigate("Investigations")} className="text-blue-600 text-sm font-semibold">View all →</button>
          </div>
          <div className="min-w-[560px]">
            <div className="grid grid-cols-4 bg-slate-50 p-3 text-sm font-semibold text-slate-600">
              <span>Case ID</span><span>Blockchain</span><span>Exchange</span><span>Status</span>
            </div>
            {cases.map((item) => (
              <div key={item[0]} className="grid grid-cols-4 p-4 border-b border-slate-100 text-sm">
                <span className="font-semibold text-blue-700">{item[0]}</span>
                <span>{item[1]}</span><span>{item[2]}</span><span>{item[3]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">Illustrative demo data — not live records.</p>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-lg">Network Intelligence</h2>
          <h3 className="text-4xl font-bold mt-6">99.2%</h3>
          <p className="text-sm text-slate-500 mt-1">Demo attribution confidence</p>
          <div className="h-2 bg-slate-100 rounded-full mt-5">
            <div className="h-full w-[99.2%] bg-blue-600 rounded-full" />
          </div>
          <hr className="my-6" />
          <p className="font-semibold text-sm">Blockchain Engine</p>
          <p className="text-sm text-green-600 mt-2">● TRON TRC-20 · Demo Mode</p>
        </section>
      </div>

      <section className="bg-white border border-blue-100 rounded-2xl p-7 flex flex-wrap items-center justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-xl"><Search size={30} /></div>
          <div>
            <h2 className="text-xl font-bold">Start a new investigation</h2>
            <p className="text-sm text-slate-500 mt-2">Trace a suspect wallet across blockchain transactions.</p>
          </div>
        </div>
        <button onClick={() => onNavigate("Investigations")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
          Investigate Wallet <ArrowRight size={18} />
        </button>
      </section>
      <p className="text-xs text-slate-400 text-center">NIRMAAN ChainTrace AI · SIH26183 · Demo Interface</p>
    </div>
  );
}
