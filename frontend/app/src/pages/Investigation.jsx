
import { useState } from "react";
import {
  Search, ShieldCheck, Wallet, Network, FileText,
  ChevronDown, AlertCircle
} from "lucide-react";

export default function Investigation() {
  const [wallet, setWallet] = useState("");
  const [chain, setChain] = useState("TRON (TRC-20)");
  const [fir, setFir] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!wallet.trim() || !fir.trim()) return;
    setSearched(true);
  };

  return (
    <div className="p-4 sm:p-8 space-y-7">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">New Investigation</h1>
        <p className="text-slate-500 mt-2">
          Enter suspect wallet details to begin blockchain tracing.
        </p>
      </div>

      <form onSubmit={handleSearch}
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="text-blue-600" /> Investigation Details
        </h2>

        <div>
          <label className="block text-sm font-semibold mb-2">FIR / Case ID</label>
          <input value={fir} onChange={(e) => setFir(e.target.value)}
            placeholder="Example: FIR-88/2026"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Suspect Wallet Address</label>
          <input value={wallet} onChange={(e) => setWallet(e.target.value)}
            placeholder="Enter blockchain wallet address"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Blockchain Network</label>
          <div className="relative">
            <select value={chain} onChange={(e) => setChain(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-blue-500">
              <option>TRON (TRC-20)</option>
              <option>Ethereum (ERC-20)</option>
              <option>BNB Smart Chain (BEP-20)</option>
              <option>Bitcoin</option>
            </select>
            <ChevronDown className="absolute right-4 top-3.5 text-slate-500 pointer-events-none" size={18} />
          </div>
        </div>

        <button type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-7 py-3 font-semibold flex items-center gap-2">
          <Search size={19} /> Start Investigation
        </button>
      </form>

      {searched && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex gap-3 items-start">
            <AlertCircle className="text-blue-600 shrink-0" />
            <div>
              <h3 className="font-bold text-blue-900">Investigation details captured</h3>
              <p className="text-sm text-blue-800 mt-1">
                Case: {fir} · Network: {chain}
              </p>
              <p className="text-sm text-blue-800 mt-1 break-all">
                Wallet: {wallet}
              </p>
              <p className="text-xs text-blue-700 mt-3">
                Demo interface only. No blockchain API has been called yet.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-5">
        {[
          [ShieldCheck, "Evidence Tracking", "Organize investigation evidence"],
          [Network, "Transaction Analysis", "Prepare wallet tracing workflow"],
          [FileText, "Legal Documentation", "Prepare case documentation"],
        ].map(([Icon, title, desc]) => (
          <div key={title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <Icon className="text-blue-600 mb-4" size={26} />
            <h3 className="font-bold">{title}</h3>
            <p className="text-sm text-slate-500 mt-2">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
