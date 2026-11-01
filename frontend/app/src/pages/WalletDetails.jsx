
import { useState } from "react";
import {
  Wallet, Copy, ShieldCheck, AlertTriangle,
  ArrowDownLeft, ArrowUpRight, Search, Activity, Clock3
} from "lucide-react";

const transactions = [
  { id: "TXN-001", type: "Incoming", from: "TQ8...9K2", to: "TR7...4M1", amount: "$12,000", date: "01 Nov 2026, 10:42 AM", status: "Confirmed" },
  { id: "TXN-002", type: "Outgoing", from: "TR7...4M1", to: "TB5...2N7", amount: "$9,500", date: "01 Nov 2026, 10:35 AM", status: "Confirmed" },
  { id: "TXN-003", type: "Outgoing", from: "TR7...4M1", to: "TC4...6R3", amount: "$2,500", date: "31 Oct 2026, 04:18 PM", status: "Confirmed" },
  { id: "TXN-004", type: "Incoming", from: "TX2...8P5", to: "TR7...4M1", amount: "$5,000", date: "30 Oct 2026, 02:20 PM", status: "Confirmed" },
];

export default function WalletDetails() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const query = search.trim().toLowerCase();
  const cleanStr = (str) => (str || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanQuery = cleanStr(search);

  const filteredTransactions = transactions.filter((tx) => {
    const rawSearchableText = [
      tx.id, tx.type, tx.from, tx.to,
      tx.amount, tx.date, tx.status
    ].join(" ").toLowerCase();

    const normalizedSearchableText = cleanStr(rawSearchableText);

    // Matches standard substring OR normalized alphanumeric (e.g. 'TXN001' matches 'TXN-001', '12000' matches '$12,000')
    const matchesSearch =
      !query ||
      rawSearchableText.includes(query) ||
      (cleanQuery.length > 0 && normalizedSearchableText.includes(cleanQuery));

    const matchesFilter =
      activeFilter === "All" || tx.type === activeFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-full space-y-6 p-5 md:p-8">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
          <Wallet size={17} /> BLOCKCHAIN FORENSICS
        </div>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Wallet Details</h1>
        <p className="mt-2 text-sm text-slate-500">
          Examine wallet activity, risk indicators and transaction history.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600"><Wallet size={30} /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Selected Wallet</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">TR7...4M1</h2>
              <p className="mt-2 break-all text-sm text-slate-500">TQ8x9K2p7R4m1N6b8Y3d5F2a9C1e7M4</p>
              <span className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">TRON · TRC-20</span>
            </div>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText("TQ8x9K2p7R4m1N6b8Y3d5F2a9C1e7M4")}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Copy size={16} /> Copy Address
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Wallet Balance", value: "$15,000", icon: Wallet },
          { label: "Total Transactions", value: "24", icon: Activity },
          { label: "Incoming Volume", value: "$18,000", icon: ArrowDownLeft },
          { label: "Outgoing Volume", value: "$12,500", icon: ArrowUpRight },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Icon size={19} /></div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">{value}</h3>
            <p className="mt-1 text-xs text-slate-400">Simulated demo data</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={19} className="text-red-500" />
            <h3 className="font-bold text-slate-900">Risk Assessment</h3>
          </div>
          <div className="mt-6 flex justify-center">
            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-[10px] border-red-100">
              <span className="text-3xl font-bold text-red-600">78</span>
              <span className="text-xs text-slate-500">Risk Score</span>
            </div>
          </div>
          <div className="mt-5 text-center">
            <span className="rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600">High Risk</span>
            <p className="mt-3 text-xs leading-5 text-slate-500">Illustrative demo score, not an actual forensic assessment.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={19} className="text-blue-600" />
            <h3 className="font-bold text-slate-900">Risk Indicators</h3>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["Multiple wallet connections", "High"],
              ["Frequent outgoing transfers", "Medium"],
              ["Exchange interaction detected", "Medium"],
            ].map(([label, risk]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <span className="text-sm text-slate-700">{label}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${risk === "High" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>{risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Transaction History</h3>
            <p className="mt-1 text-xs text-slate-500">Recent wallet transactions · Demo records</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <Search size={15} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search transaction (e.g. TXN-001, TXN001)..."
                autoComplete="off"
                className="w-52 bg-transparent text-sm outline-none"
              />
              {search.length > 0 && (
                <button type="button" onClick={() => setSearch("")} className="text-xs font-semibold text-blue-600">
                  Clear
                </button>
              )}
            </form>

            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none"
            >
              <option value="All">All</option>
              <option value="Incoming">Incoming</option>
              <option value="Outgoing">Outgoing</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Transaction ID</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">From / To</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-blue-600">{tx.id}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tx.type === "Incoming" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>{tx.type}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <div>{tx.from}</div>
                    <div className="text-xs text-slate-400">to {tx.to}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{tx.amount}</td>
                  <td className="px-5 py-4 text-slate-500">{tx.date}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{tx.status}</span>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                    No matching transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          <Clock3 size={14} />
          Showing {filteredTransactions.length} of {transactions.length} demo transactions
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        NIRMAAN · Simulated wallet information · No live blockchain verification
      </p>
    </div>
  );
}
