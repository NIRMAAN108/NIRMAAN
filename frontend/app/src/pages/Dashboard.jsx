
import {
  FileText, Wallet, ShieldCheck, Activity,
  Clock, Search, ArrowRight, TrendingUp
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
    <div className="w-full space-y-8 p-5 sm:p-8 lg:p-10">

      {/* Welcome Section */}
      <section className="flex flex-col justify-between gap-6 rounded-2xl bg-white px-6 py-8 sm:px-9 sm:py-10 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
            NIRMAAN · Intelligence Dashboard
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome back, Officer
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-500">
            Monitor, trace and investigate blockchain transactions with AI-powered intelligence.
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-100 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          System Operational
        </span>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, color }) => (
          <div
            key={title}
            className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${colors[color].split(" ")[0]}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h2 className="mt-3 text-3xl font-bold text-slate-900">{value}</h2>
                <p className="mt-2 text-xs text-slate-400">Simulated demo metric</p>
              </div>
              <div className={`rounded-xl p-4 ${colors[color].split(" ").slice(1).join(" ")}`}>
                <Icon size={26} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Recent Investigations - Full Width */}
      <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900">
              <Clock className="text-blue-600" size={23} />
              Recent Investigations
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Overview of recently accessed investigation cases
            </p>
          </div>

          <button
            onClick={() => onNavigate("Investigations")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            View all <ArrowRight size={15} className="ml-1 inline" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50 text-sm text-slate-500">
                <th className="px-5 py-4 font-semibold">Case ID</th>
                <th className="px-5 py-4 font-semibold">Blockchain</th>
                <th className="px-5 py-4 font-semibold">Exchange</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr
                  key={item[0]}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-5 py-5 font-semibold text-blue-700">{item[0]}</td>
                  <td className="px-5 py-5 text-sm text-slate-600">{item[1]}</td>
                  <td className="px-5 py-5 text-sm font-medium text-slate-700">{item[2]}</td>
                  <td className="px-5 py-5">
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                      item[3] === "Completed"
                        ? "bg-green-50 text-green-700"
                        : item[3] === "In Progress"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}>
                      {item[3]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Illustrative demo data — not live investigation records.
        </p>
      </section>

      {/* Network Intelligence - Moved Below */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Network Intelligence</h2>
              <p className="mt-2 text-sm text-slate-500">Demo attribution confidence</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <TrendingUp size={24} />
            </div>
          </div>

          <h3 className="mt-7 text-4xl font-bold text-slate-900">99.2%</h3>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[99.2%] rounded-full bg-blue-600" />
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Simulated confidence metric for demonstration.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Blockchain Engine</h2>
          <p className="mt-2 text-sm text-slate-500">
            Current demonstration environment
          </p>

          <div className="mt-7 flex items-center justify-between rounded-xl bg-slate-50 p-5">
            <div>
              <p className="text-sm font-semibold text-slate-800">TRON TRC-20</p>
              <p className="mt-1 text-xs text-slate-500">Demo Mode</p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              Operational
            </span>
          </div>
        </div>
      </section>

      {/* Start Investigation */}
      <section className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-blue-100 bg-white p-7 shadow-sm sm:flex-row sm:items-center sm:p-9">
        <div className="flex items-center gap-5">
          <div className="rounded-xl bg-blue-50 p-4 text-blue-600">
            <Search size={29} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Start a new investigation
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Trace a suspect wallet across blockchain transactions.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("Investigations")}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700"
        >
          Investigate Wallet <ArrowRight size={18} />
        </button>
      </section>

      <p className="pb-2 text-center text-xs text-slate-400">
        NIRMAAN ChainTrace AI · SIH26183 · Demo Interface
      </p>
    </div>
  );
}
