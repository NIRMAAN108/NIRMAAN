
import { useState, useEffect } from "react";
import {
  Building2,
  Search,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  ExternalLink,
  CheckCircle2,
  Activity,
  X,
  Plus,
  RotateCcw,
} from "lucide-react";
import { fetchVasps } from "../services/api";

const initialRecords = [
  {
    id: "VASP-001",
    name: "Binance",
    category: "Centralized Exchange",
    wallet: "TR7...4M1",
    network: "TRON · TRC-20",
    confidence: 92,
    risk: "High",
    status: "Identified",
    volume: "$25,000",
    evidence: "Exchange deposit pattern detected",
  },
  {
    id: "VASP-002",
    name: "Coinbase",
    category: "Centralized Exchange",
    wallet: "0x8A...72F",
    network: "Ethereum",
    confidence: 86,
    risk: "Medium",
    status: "Under Review",
    volume: "$12,500",
    evidence: "Wallet interaction pattern",
  },
  {
    id: "VASP-003",
    name: "Kraken",
    category: "Centralized Exchange",
    wallet: "bc1q...9x2",
    network: "Bitcoin",
    confidence: 74,
    risk: "Medium",
    status: "Under Review",
    volume: "$8,200",
    evidence: "Transaction cluster association",
  },
];

const emptyForm = {
  name: "",
  wallet: "",
  network: "TRON · TRC-20",
  confidence: "75",
  risk: "Medium",
  status: "Under Review",
  volume: "",
  evidence: "",
};

export default function VASPAttribution() {
  const [records, setRecords] = useState(initialRecords);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("VASP-001");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchVasps()
      .then((data) => {
        const vaspsData = data?.vasps ? Object.values(data.vasps) : (Array.isArray(data) ? data : []);
        if (vaspsData.length > 0) {
          const formatted = vaspsData.map((v, i) => {
            const hotWallet = (Array.isArray(v.known_hot_wallets) && v.known_hot_wallets.length > 0)
              ? v.known_hot_wallets[0]
              : (v.hot_wallet || v.address || "Active Hot Wallet");

            let network = v.chain ? v.chain.toUpperCase() : "MULTI-CHAIN";
            if (!v.chain && hotWallet && typeof hotWallet === "string") {
              if (hotWallet.startsWith("T")) network = "TRON · TRC-20";
              else if (hotWallet.startsWith("0x")) network = "Ethereum · ERC-20";
              else if (hotWallet.startsWith("bc1") || hotWallet.startsWith("1") || hotWallet.startsWith("3")) network = "Bitcoin · UTXO";
            }

            return {
              id: `VASP-${String(i + 1).padStart(3, "0")}`,
              name: v.name || "Exchange",
              category: "Centralized Exchange",
              wallet: hotWallet,
              network: network,
              confidence: v.confidence === "HIGH" ? 98 : (v.fiu_registered ? 95 : 85),
              risk: v.fiu_registered ? "Low" : "High",
              status: "Identified",
              volume: "$100,000+",
              evidence: `Verified ${v.fiu_registered ? "FIU-IND Registered" : "Global"} VASP Registry`
            };
          });
          setRecords(formatted);
          if (formatted.length > 0) {
            setSelectedId(formatted[0].id);
          }
        }
      })
      .catch((err) => console.debug("Could not fetch live VASPs:", err));
  }, []);

  const selected = records.find((record) => record.id === selectedId);

  const filteredRecords = records.filter((record) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      record.name,
      record.wallet,
      record.network,
      record.id,
      record.status,
      record.risk,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);

    const matchesFilter =
      filter === "All" || record.status === filter;

    return matchesSearch && matchesFilter;
  });

  const riskStyle = (risk) =>
    risk === "High"
      ? "bg-red-50 text-red-600"
      : risk === "Low"
      ? "bg-green-50 text-green-700"
      : "bg-amber-50 text-amber-700";

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newRecord = {
      id: `VASP-${String(records.length + 1).padStart(3, "0")}`,
      name: form.name.trim(),
      category: "Centralized Exchange",
      wallet: form.wallet.trim(),
      network: form.network,
      confidence: Number(form.confidence),
      risk: form.risk,
      status: form.status,
      volume: form.volume.trim(),
      evidence: form.evidence.trim(),
    };

    setRecords((current) => [newRecord, ...current]);
    setSelectedId(newRecord.id);
    setSearch("");
    setFilter("All");
    setForm(emptyForm);
    setShowModal(false);
  };

  const resetFilters = () => {
    setSearch("");
    setFilter("All");
  };

  return (
    <div className="min-h-full space-y-6 p-5 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Building2 size={17} />
            BLOCKCHAIN FORENSICS
          </div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            VASP Attribution
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Identify potential Virtual Asset Service Providers associated with suspicious wallets.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={17} />
          New Attribution
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "VASP Identified", value: records.filter((r) => r.status === "Identified").length, icon: Building2 },
          { label: "Wallet Associations", value: records.length, icon: Wallet },
          { label: "High Risk Associations", value: records.filter((r) => r.risk === "High").length, icon: AlertTriangle },
          { label: "Evidence Records", value: records.length, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Icon size={19} />
              </div>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              {String(value).padStart(2, "0")}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              FIU-IND Verified Registry
            </p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* VASP Directory */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5">
            <div>
              <h2 className="font-bold text-slate-900">
                Identified VASPs
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Potential exchange associations
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search exchange or wallet..."
                  className="min-w-0 flex-1 text-sm outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none"
              >
                <option value="All">All Status</option>
                <option value="Identified">Identified</option>
                <option value="Under Review">Under Review</option>
              </select>

              <button
                onClick={resetFilters}
                title="Reset search and filters"
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-500 hover:bg-slate-50"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredRecords.map((record) => (
              <button
                key={record.id}
                onClick={() => setSelectedId(record.id)}
                className={`w-full p-5 text-left transition hover:bg-blue-50/50 ${
                  selectedId === record.id
                    ? "bg-blue-50/70"
                    : "bg-white"
                }`}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Building2 size={21} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">
                        {record.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {record.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskStyle(record.risk)}`}>
                      {record.risk} Risk
                    </span>
                    <ExternalLink size={15} className="text-slate-400" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                  <div className="col-span-2 min-w-0 sm:col-span-1">
                    <p className="font-medium text-slate-400">Wallet</p>
                    <p
                      className="mt-1 truncate font-mono font-semibold text-slate-700"
                      title={record.wallet}
                    >
                      {record.wallet}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-400">Confidence</p>
                    <p className="mt-1 font-semibold text-blue-700">
                      {record.confidence}%
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-400">Status</p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {record.status}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {filteredRecords.length === 0 && (
              <div className="p-8 text-center">
                <Search className="mx-auto mb-3 text-slate-300" size={30} />
                <p className="text-sm font-semibold text-slate-700">
                  No matching VASP records found.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
                >
                  Clear search and filters
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Showing {filteredRecords.length} of {records.length} registered exchanges
          </div>
        </section>

        {/* Attribution Details */}
        <section className="space-y-5">
          {selected && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-900">
                    Attribution Details
                  </h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selected.status === "Identified"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {selected.status}
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Selected VASP</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {selected.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {selected.id}
                  </p>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Attribution Confidence
                    </span>
                    <span className="text-xl font-bold text-blue-700">
                      {selected.confidence}%
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${selected.confidence}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Official attribution score · Verified Registry
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-xs text-slate-400">Associated Wallet</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                      {selected.wallet}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Blockchain Network</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selected.network}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Associated Volume</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selected.volume}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Risk Classification</p>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskStyle(selected.risk)}`}>
                      {selected.risk} Risk
                    </span>
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={19} className="text-blue-600" />
                  <h3 className="font-bold text-slate-900">
                    Evidence Summary
                  </h3>
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 p-4">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Attribution Indicator
                    </p>
                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      {selected.evidence}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-2">
                    <Activity size={15} />
                    Evidence Status
                  </span>
                  <span className="font-semibold text-slate-700">
                    Verified Registry Record
                  </span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* New Attribution Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="my-6 w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create New Attribution
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Add a verified VASP association record.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  VASP / Exchange Name *
                  <input
                    required
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="e.g. Binance"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Wallet Address *
                  <input
                    required
                    value={form.wallet}
                    onChange={(e) => updateForm("wallet", e.target.value)}
                    placeholder="Enter wallet address"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Blockchain Network
                  <select
                    value={form.network}
                    onChange={(e) => updateForm("network", e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option>TRON · TRC-20</option>
                    <option>Ethereum</option>
                    <option>Bitcoin</option>
                    <option>BNB Smart Chain</option>
                    <option>Polygon</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Associated Volume *
                  <input
                    required
                    value={form.volume}
                    onChange={(e) => updateForm("volume", e.target.value)}
                    placeholder="e.g. $10,000"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Confidence Score (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={form.confidence}
                    onChange={(e) => updateForm("confidence", e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Risk Classification
                  <select
                    value={form.risk}
                    onChange={(e) => updateForm("risk", e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Attribution Status
                  <select
                    value={form.status}
                    onChange={(e) => updateForm("status", e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option>Under Review</option>
                    <option>Identified</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Evidence / Attribution Indicator *
                  <textarea
                    required
                    rows={3}
                    value={form.evidence}
                    onChange={(e) => updateForm("evidence", e.target.value)}
                    placeholder="Describe the supporting evidence..."
                    className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add Attribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statutory Law Enforcement Advisory */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-900">
        <div className="flex items-center gap-2 font-semibold text-blue-800">
          <ShieldCheck size={16} className="text-blue-600" />
          FIU-IND & LEA Statutory Advisory
        </div>
        <p className="mt-1 text-slate-600">
          VASP entity attributions are cross-referenced with FIU-IND registered Reporting Entities and verified exchange deposit clusters. Requisitions for KYC records and transaction freeze directives must be issued under Section 94 BNSS to the designated Nodal Compliance Officer.
        </p>
      </div>
    </div>
  );
}
