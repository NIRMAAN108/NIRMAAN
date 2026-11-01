
import { useMemo, useRef, useState } from "react";
import {
  Network,
  Search,
  Download,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Activity,
  X,
} from "lucide-react";

const nodes = [
  { id: "W1", x: 100, y: 220, label: "Source Wallet", address: "TQ8...9K2", amount: "$25,000", type: "source", risk: "High" },
  { id: "W2", x: 310, y: 105, label: "Wallet 02", address: "TR7...4M1", amount: "$12,000", type: "normal", risk: "Medium" },
  { id: "W3", x: 310, y: 335, label: "Wallet 03", address: "TX2...8P5", amount: "$8,000", type: "normal", risk: "Low" },
  { id: "W4", x: 540, y: 105, label: "Wallet 04", address: "TB5...2N7", amount: "$9,500", type: "normal", risk: "Medium" },
  { id: "W5", x: 540, y: 335, label: "Wallet 05", address: "TC4...6R3", amount: "$5,500", type: "normal", risk: "High" },
  { id: "W6", x: 770, y: 220, label: "Exchange", address: "Binance (Demo)", amount: "$15,000", type: "exchange", risk: "Medium" },
];

const edges = [
  { from: "W1", to: "W2", label: "$12,000", x1: 125, y1: 205, x2: 285, y2: 120 },
  { from: "W1", to: "W3", label: "$8,000", x1: 125, y1: 235, x2: 285, y2: 320 },
  { from: "W2", to: "W4", label: "$9,500", x1: 335, y1: 105, x2: 515, y2: 105 },
  { from: "W3", to: "W5", label: "$5,500", x1: 335, y1: 335, x2: 515, y2: 335 },
  { from: "W4", to: "W6", label: "$9,500", x1: 565, y1: 120, x2: 745, y2: 205 },
  { from: "W5", to: "W6", label: "$5,500", x1: 565, y1: 320, x2: 745, y2: 235 },
];

export default function TransactionGraph() {
  const [selectedNode, setSelectedNode] = useState("W1");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [riskFilter, setRiskFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [zoom, setZoom] = useState(1);
  const graphRef = useRef(null);

  const visibleNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch =
        `${node.id} ${node.label} ${node.address}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesRisk =
        riskFilter === "All" || node.risk === riskFilter;

      const matchesType =
        typeFilter === "All" || node.type === typeFilter;

      return matchesSearch && matchesRisk && matchesType;
    });
  }, [search, riskFilter, typeFilter]);

  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const selected = visibleNodes.find((node) => node.id === selectedNode);

  const nodeColor = (type) => {
    if (type === "source") return "#2563EB";
    if (type === "exchange") return "#16A34A";
    return "#64748B";
  };

  const changeZoom = (amount) => {
    setZoom((current) =>
      Math.min(1.8, Math.max(0.6, Number((current + amount).toFixed(2))))
    );
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await graphRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen is not available:", error);
    }
  };

  const resetFilters = () => {
    setRiskFilter("All");
    setTypeFilter("All");
    setSearch("");
  };

  return (
    <div className="min-h-full space-y-6 p-5 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Network size={16} />
            BLOCKCHAIN FORENSICS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Transaction Graph
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Visualize wallet connections and trace the flow of funds.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Download size={17} />
          Export Graph
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Wallets", value: "06", icon: Wallet },
          { label: "Transactions", value: "06", icon: Activity },
          { label: "Total Volume", value: "$25,000", icon: ArrowUpRight },
          { label: "Risk Alerts", value: "02", icon: AlertTriangle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <Icon size={19} />
                </div>
              </div>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                {item.value}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Simulated demo data
              </p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Wallet Network Visualization
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Investigation ID: FIR-88/2026 · Demo Network
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <Search size={15} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search wallet..."
                className="w-32 text-sm outline-none md:w-40"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters((current) => !current)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                showFilters || riskFilter !== "All" || typeFilter !== "All"
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <Filter size={15} />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-end gap-4 border-b border-slate-100 bg-slate-50 p-4">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Risk Level
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none"
              >
                <option value="All">All Risks</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Wallet Type
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none"
              >
                <option value="All">All Types</option>
                <option value="source">Source Wallet</option>
                <option value="normal">Normal Wallet</option>
                <option value="exchange">Exchange</option>
              </select>
            </label>

            <button
              onClick={resetFilters}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
            >
              Reset Filters
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px]">
          <div
            ref={graphRef}
            className="min-w-0 border-b border-slate-100 bg-white xl:border-b-0 xl:border-r"
          >
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                Source Wallet
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                Wallet
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                Exchange
              </span>
              <span className="ml-auto text-xs font-medium text-slate-400">
                Zoom: {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="relative min-h-[420px] overflow-auto bg-slate-50/70 p-3">
              {visibleNodes.length > 0 ? (
                <svg
                  viewBox="0 0 870 440"
                  className="h-[420px] min-w-[700px] w-full"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: "transform 180ms ease",
                  }}
                >
                  {edges
                    .filter(
                      (edge) =>
                        visibleNodeIds.has(edge.from) &&
                        visibleNodeIds.has(edge.to)
                    )
                    .map((edge) => (
                      <g key={`${edge.from}-${edge.to}`}>
                        <line
                          x1={edge.x1}
                          y1={edge.y1}
                          x2={edge.x2}
                          y2={edge.y2}
                          stroke="#CBD5E1"
                          strokeWidth="2.5"
                        />
                        <rect
                          x={(edge.x1 + edge.x2) / 2 - 30}
                          y={(edge.y1 + edge.y2) / 2 - 12}
                          width="60"
                          height="23"
                          rx="7"
                          fill="white"
                          stroke="#E2E8F0"
                        />
                        <text
                          x={(edge.x1 + edge.x2) / 2}
                          y={(edge.y1 + edge.y2) / 2 + 4}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#475569"
                          fontWeight="600"
                        >
                          {edge.label}
                        </text>
                      </g>
                    ))}

                  {visibleNodes.map((node) => (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node.id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={selectedNode === node.id ? 27 : 23}
                        fill={nodeColor(node.type)}
                        stroke={selectedNode === node.id ? "#BFDBFE" : "white"}
                        strokeWidth={selectedNode === node.id ? 7 : 4}
                      />
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fontSize="12"
                        fill="white"
                        fontWeight="700"
                      >
                        {node.id}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 48}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#334155"
                        fontWeight="600"
                      >
                        {node.label}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 64}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#94A3B8"
                      >
                        {node.address}
                      </text>
                    </g>
                  ))}
                </svg>
              ) : (
                <div className="flex min-h-[390px] items-center justify-center text-center">
                  <div>
                    <Search className="mx-auto mb-3 text-slate-300" size={32} />
                    <p className="font-semibold text-slate-700">
                      No wallets found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try changing your search or filters.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="mt-3 text-sm font-semibold text-blue-600"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}

              <div className="absolute bottom-5 right-5 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <button
                  onClick={() => changeZoom(0.2)}
                  disabled={zoom >= 1.8}
                  title="Zoom in"
                  aria-label="Zoom in"
                  className="p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ZoomIn size={17} />
                </button>
                <div className="h-px bg-slate-100" />
                <button
                  onClick={() => changeZoom(-0.2)}
                  disabled={zoom <= 0.6}
                  title="Zoom out"
                  aria-label="Zoom out"
                  className="p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ZoomOut size={17} />
                </button>
                <div className="h-px bg-slate-100" />
                <button
                  onClick={toggleFullscreen}
                  title="Toggle fullscreen"
                  aria-label="Toggle fullscreen"
                  className="p-2.5 text-slate-600 hover:bg-slate-50"
                >
                  <Maximize2 size={17} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-blue-600" />
              <h3 className="font-bold text-slate-900">Node Details</h3>
            </div>

            {selected ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Selected Wallet</p>
                  <h4 className="mt-1 font-bold text-slate-900">
                    {selected.label}
                  </h4>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    {selected.address}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Wallet ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selected.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Transaction Amount</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {selected.amount}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Risk Classification</p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      selected.risk === "High"
                        ? "bg-red-50 text-red-600"
                        : selected.risk === "Medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {selected.risk} Risk
                  </span>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                    <ShieldCheck size={16} />
                    Investigation Note
                  </div>
                  <p className="mt-2 text-xs leading-5 text-blue-700">
                    This is simulated wallet information for UI demonstration.
                    No live blockchain verification has been performed.
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                Select a visible wallet to view details.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {visibleNodes.length} of {nodes.length} demo wallets
          </span>
          <span className="font-medium text-amber-600">
            Demo visualization · Not live blockchain data
          </span>
        </div>
      </div>
    </div>
  );
}
