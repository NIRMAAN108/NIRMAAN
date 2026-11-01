import { useEffect, useRef, useState, useMemo } from "react";
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
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  FolderOpen,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { fetchCases, fetchCaseById, traceWallet } from "../services/api";

// Safely register dagre layout
try {
  cytoscape.use(dagre);
} catch {
  // Ignore if already registered
}

const NODE_COLORS = {
  SUSPECT: { bg: "#EF4444", border: "#B91C1C", text: "Suspect Origin", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  MULE: { bg: "#F59E0B", border: "#D97706", text: "Intermediary Mule", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  VASP_DEPOSIT: { bg: "#0284C7", border: "#0369A1", text: "VASP Deposit Forwarder", badge: "bg-sky-50 text-sky-700 border-sky-200" },
  VASP_HOT: { bg: "#10B981", border: "#047857", text: "Exchange Hot Wallet", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  MIXER: { bg: "#8B5CF6", border: "#6D28D9", text: "Obfuscation Mixer", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  DEFAULT: { bg: "#64748B", border: "#475569", text: "Standard Node", badge: "bg-slate-50 text-slate-700 border-slate-200" },
};

export default function TransactionGraph({
  caseId = null,
  traceData = null,
  onNavigate,
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  const [casesList, setCasesList] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || "");
  const [activeTrace, setActiveTrace] = useState(traceData || null);
  const [activeFir, setActiveFir] = useState("Live Investigation");
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [layoutName, setLayoutName] = useState("dagre");
  const [copiedKey, setCopiedKey] = useState(null);

  // 1. Load cases list for dropdown selection
  useEffect(() => {
    fetchCases()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCasesList(data);
          // If no caseId was provided and no traceData, default to first case
          if (!selectedCaseId && !traceData) {
            setSelectedCaseId(data[0].case_id);
            setActiveFir(data[0].fir_number);
          }
        }
      })
      .catch((err) => console.warn("Failed to load cases list:", err));
  }, [traceData]);

  // 2. Load case trace data when selectedCaseId changes
  useEffect(() => {
    if (!selectedCaseId) return;

    setLoading(true);
    fetchCaseById(selectedCaseId)
      .then((res) => {
        if (res.trace_data) {
          setActiveTrace(res.trace_data);
          setActiveFir(res.fir_number || `Case ${selectedCaseId}`);
        }
      })
      .catch((err) => {
        console.warn("Failed to load case trace:", err);
      })
      .finally(() => setLoading(false));
  }, [selectedCaseId]);

  // If initial traceData changes from props, use it
  useEffect(() => {
    if (traceData) {
      setActiveTrace(traceData);
      if (traceData.seed_address) {
        setActiveFir(`Investigation: ${traceData.seed_address.substring(0, 10)}...`);
      }
    }
  }, [traceData]);

  // 3. Initialize or update Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Build elements from activeTrace
    const elements = [];
    const nodes = activeTrace?.nodes || [];
    const edges = activeTrace?.edges || [];

    if (nodes.length === 0) {
      // Clean fallback demo if completely empty
      elements.push(
        { data: { id: "seed", label: "Suspect Origin\nTQiBwk...UmhUVC", address: "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", node_type: "SUSPECT", balance_usd: 0, risk_score: 0.85, risk_tier: "CRITICAL" } },
        { data: { id: "mule1", label: "Hop 1 Mule\nTSGRsp...BRkWVA", address: "TSGRsppW4vSaWWstQUTa2d4CWJDWBRkWVA", node_type: "MULE", balance_usd: 15000, risk_score: 0.72, risk_tier: "HIGH" } },
        { data: { id: "dep1", label: "Binance Deposit\nTTpfou...ofBMrk", address: "TTpfou5hZarSNUpbaiAWHcCyC4u7ofBMrk", node_type: "VASP_DEPOSIT", balance_usd: 14950, risk_score: 0.08, risk_tier: "LOW" } },
        { data: { id: "hot1", label: "Binance Hot Wallet\nTMuA6Y...RB4b7N", address: "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N", node_type: "VASP_HOT", balance_usd: 14950, risk_score: 0.08, risk_tier: "LOW" } }
      );
      elements.push(
        { data: { id: "e1", source: "seed", target: "mule1", amount: "$15,000 USDT", usd_value: 15000, tx_hash: "a1b2c3d4e5f60718293a4b5c6d7e8f90" } },
        { data: { id: "e2", source: "mule1", target: "dep1", amount: "$14,950 USDT", usd_value: 14950, tx_hash: "b2c3d4e5f60718293a4b5c6d7e8f90a1" } },
        { data: { id: "e3", source: "dep1", target: "hot1", amount: "$14,950 USDT (Sweep)", usd_value: 14950, tx_hash: "d4e5f60718293a4b5c6d7e8f90a1b2c3" } }
      );
    } else {
      // Add real nodes from trace
      nodes.forEach((n) => {
        const typeInfo = NODE_COLORS[n.node_type] || NODE_COLORS.DEFAULT;
        let shortAddr = n.address ? `${n.address.substring(0, 6)}...${n.address.substring(n.address.length - 4)}` : n.id;
        let displayLabel = n.label || shortAddr;
        if (n.vasp_name) {
          displayLabel = `${n.vasp_name}\n${shortAddr}`;
        }

        elements.push({
          group: "nodes",
          data: {
            id: n.id || n.address,
            label: displayLabel,
            address: n.address,
            node_type: n.node_type || "MULE",
            vasp_name: n.vasp_name || null,
            balance_usd: n.balance_usd || 0,
            risk_score: n.risk_score || 0.5,
            risk_tier: n.risk_tier || "MEDIUM",
            flags: n.flags || [],
            explanation: n.explanation || "",
            typology: n.typology || null,
            color: typeInfo.bg,
            borderColor: typeInfo.border,
          },
        });
      });

      // Add real edges from trace
      edges.forEach((e, idx) => {
        elements.push({
          group: "edges",
          data: {
            id: `edge_${idx}_${e.source}_${e.target}`,
            source: e.source,
            target: e.target,
            amount: `$${Number(e.usd_value || e.amount || 0).toLocaleString()} ${e.token || "USDT"}`,
            usd_value: e.usd_value || e.amount || 0,
            tx_hash: e.tx_hash || "",
            timestamp: e.timestamp || null,
          },
        });
      });
    }

    // Destroy prior cytoscape instance if exists
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements: elements,
        boxSelectionEnabled: false,
        autounselectify: false,
        style: [
          {
            selector: "node",
            style: {
              "background-color": "data(color)",
              "label": "data(label)",
              "color": "#1E293B",
              "font-size": "10px",
              "font-weight": "bold",
              "font-family": "ui-sans-serif, system-ui, sans-serif",
              "text-valign": "bottom",
              "text-margin-y": 6,
              "text-wrap": "wrap",
              "text-max-width": "120px",
              "width": 42,
              "height": 42,
              "border-width": 3,
              "border-color": "#FFFFFF",
              "border-opacity": 0.9,
              "shadow-blur": 8,
              "shadow-color": "rgba(0,0,0,0.12)",
              "shadow-opacity": 0.8,
            },
          },
          {
            selector: "edge",
            style: {
              "width": 3,
              "line-color": "#94A3B8",
              "target-arrow-color": "#64748B",
              "target-arrow-shape": "triangle",
              "arrow-scale": 1.2,
              "curve-style": "bezier",
              "label": "data(amount)",
              "font-size": "10px",
              "font-weight": "bold",
              "font-family": "ui-monospace, SFMono-Regular, monospace",
              "color": "#0F172A",
              "text-rotation": "autorotate",
              "text-margin-y": -10,
              "text-background-color": "#F8FAFC",
              "text-background-opacity": 0.95,
              "text-background-padding": 3,
              "text-background-shape": "roundrectangle",
              "text-border-color": "#CBD5E1",
              "text-border-width": 1,
              "text-border-opacity": 0.8,
            },
          },
          {
            selector: "node:selected",
            style: {
              "border-width": 4,
              "border-color": "#2563EB",
              "border-opacity": 1,
              "shadow-blur": 16,
              "shadow-color": "#2563EB",
              "shadow-opacity": 0.5,
            },
          },
          {
            selector: "edge:selected",
            style: {
              "width": 4,
              "line-color": "#2563EB",
              "target-arrow-color": "#2563EB",
              "text-border-color": "#2563EB",
              "text-color": "#2563EB",
            },
          },
        ],
        layout: {
          name: layoutName === "dagre" ? "dagre" : layoutName,
          rankDir: "LR",
          nodeSep: 60,
          rankSep: 110,
          padding: 50,
          animate: true,
          animationDuration: 400,
        },
      });

      // Node click listener
      cy.on("tap", "node", (evt) => {
        const nodeData = evt.target.data();
        setSelectedNode(nodeData);
        setSelectedEdge(null);
      });

      // Edge click listener
      cy.on("tap", "edge", (evt) => {
        const edgeData = evt.target.data();
        setSelectedEdge(edgeData);
        setSelectedNode(null);
      });

      // Background click listener
      cy.on("tap", (evt) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          setSelectedEdge(null);
        }
      });

      cyRef.current = cy;

      // Select first suspect node by default if available
      const suspectNode = cy.nodes('[node_type = "SUSPECT"]');
      if (suspectNode.length > 0) {
        suspectNode[0].select();
        setSelectedNode(suspectNode[0].data());
      }
    } catch (err) {
      console.warn("Cytoscape init fallback:", err);
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [activeTrace, layoutName]);

  // Handle Search Highlighting
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!cyRef.current || !search.trim()) return;

    const q = search.trim().toLowerCase();
    cyRef.current.batch(() => {
      cyRef.current.nodes().forEach((n) => {
        const data = n.data();
        const match =
          (data.address && data.address.toLowerCase().includes(q)) ||
          (data.label && data.label.toLowerCase().includes(q)) ||
          (data.vasp_name && data.vasp_name.toLowerCase().includes(q));

        if (match) {
          n.select();
          setSelectedNode(data);
          cyRef.current.animate({ center: { eles: n }, zoom: 1.4 });
        } else {
          n.unselect();
        }
      });
    });
  };

  // Zoom controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(null, 50);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInvestigateNode = (address) => {
    if (!address) return;
    onNavigate?.("Investigations", { wallet: address, fir: activeFir });
  };

  const activeNodeColor = selectedNode ? NODE_COLORS[selectedNode.node_type] || NODE_COLORS.DEFAULT : null;

  return (
    <div className="flex h-[calc(100vh-76px)] w-full flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Network size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900">Multi-Hop Visual Topology</h1>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                Cytoscape DAGRE Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono truncate max-w-md">
              {activeFir}
            </p>
          </div>
        </div>

        {/* Case Selector Dropdown & Search */}
        <div className="flex items-center gap-2">
          {casesList.length > 0 && (
            <div className="relative">
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-xs font-semibold text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                title="Select Case Investigation from Vault"
              >
                {casesList.map((c) => (
                  <option key={c.case_id} value={c.case_id}>
                    {c.fir_number} · {c.destination_vasp || "In-Transit"} (${Number(c.total_routed_usd || 0).toLocaleString()} USDT)
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          )}

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search wallet in graph..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 sm:w-60 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </form>

          {/* Layout Toggle */}
          <button
            type="button"
            onClick={() => setLayoutName(layoutName === "dagre" ? "circle" : "dagre")}
            title="Toggle Layout (Hierarchical vs Circular)"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
          >
            <Layers size={16} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area + Side Inspector */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Cytoscape Canvas */}
        <div className="relative flex-1 bg-white">
          <div ref={containerRef} className="h-full w-full" />

          {/* Canvas Floating Controls */}
          <div className="absolute bottom-5 left-5 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-md backdrop-blur-xs">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleFit}
              title="Fit to Screen"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Color Legend Badge */}
          <div className="absolute top-4 left-4 hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Suspect Seed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Mule Hop
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> VASP Deposit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Hot Wallet
            </span>
          </div>
        </div>

        {/* Node & Edge Inspector Side Drawer */}
        <div className="w-80 sm:w-96 border-l border-slate-200 bg-white p-5 overflow-y-auto space-y-5 shadow-xs">
          {selectedNode ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${activeNodeColor?.badge}`}>
                  {activeNodeColor?.text || selectedNode.node_type}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Risk Tier: {selectedNode.risk_tier}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Node Identifier</p>
                <h3 className="mt-1 text-base font-bold text-slate-900 break-words">
                  {selectedNode.vasp_name || selectedNode.label?.replace("\n", " ") || "Blockchain Node"}
                </h3>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Wallet Public Address:</span>
                <div className="flex items-center justify-between gap-2 font-mono text-xs text-slate-800 break-all">
                  <span>{selectedNode.address || selectedNode.id}</span>
                  <button
                    onClick={() => handleCopy(selectedNode.address || selectedNode.id, "nodeAddr")}
                    className="shrink-0 p-1 text-slate-500 hover:text-blue-600 transition"
                    title="Copy Address"
                  >
                    {copiedKey === "nodeAddr" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-slate-400 block font-semibold">Ledger Balance:</span>
                  <span className="mt-1 font-bold text-slate-900 block text-sm">
                    ${Number(selectedNode.balance_usd || 0).toLocaleString()} USDT
                  </span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-slate-400 block font-semibold">ML Risk Score:</span>
                  <span className="mt-1 font-bold text-rose-600 block text-sm">
                    {Math.round((selectedNode.risk_score || 0.5) * 100)}%
                  </span>
                </div>
              </div>

              {selectedNode.explanation && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                  <span className="font-semibold text-slate-500 block mb-1">Forensic Heuristic Note:</span>
                  <p className="text-slate-700 leading-relaxed">{selectedNode.explanation}</p>
                </div>
              )}

              {selectedNode.typology && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs space-y-1">
                  <span className="font-bold text-indigo-900 block">
                    {selectedNode.typology.typology_name || "Laundering Pattern"}
                  </span>
                  <p className="text-indigo-800 text-[11px] leading-relaxed">
                    {selectedNode.typology.description}
                  </p>
                  <span className="font-semibold text-rose-600 block text-[11px] pt-1">
                    Offence: {selectedNode.typology.statutory_violation || "Sec 318(4) BNS, 2023"}
                  </span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleInvestigateNode(selectedNode.address || selectedNode.id)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  <Search size={14} /> Trace From This Wallet
                </button>
              </div>
            </div>
          ) : selectedEdge ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                  Transaction Edge
                </span>
                <span className="text-xs font-mono text-emerald-600 font-bold">
                  {selectedEdge.amount}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">Transfer Value</span>
                <p className="text-xl font-bold text-slate-900">
                  ${Number(selectedEdge.usd_value || 0).toLocaleString()} USDT
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Transaction Hash (TxHash):</span>
                <div className="flex items-center justify-between gap-2 font-mono text-xs text-slate-800 break-all">
                  <span>{selectedEdge.tx_hash || "Synthetic Transaction"}</span>
                  <button
                    onClick={() => handleCopy(selectedEdge.tx_hash, "edgeTx")}
                    className="shrink-0 p-1 text-slate-500 hover:text-blue-600 transition"
                    title="Copy TxHash"
                  >
                    {copiedKey === "edgeTx" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Source Node:</span>
                  <p className="font-mono text-slate-700 truncate">{selectedEdge.source}</p>
                </div>
                <div>
                  <span className="text-slate-400">Target Node:</span>
                  <p className="font-mono text-slate-700 truncate">{selectedEdge.target}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Network size={32} className="mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Select any node or transaction edge</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Click any wallet circle or connecting transfer arrow to inspect real balances, risk scoring, and evidence particulars.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
