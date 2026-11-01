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
  Share2,
  Camera,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Building2,
  User,
  ShieldAlert,
  Compass,
} from "lucide-react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { fetchCases, fetchCaseById, traceWallet } from "../services/api";

// Safely register dagre layout once
try {
  cytoscape.use(dagre);
} catch {
  // Ignore if already registered
}

const NODE_CONFIGS = {
  SUSPECT: {
    bg: "#991B1B",
    border: "#DC2626",
    ring: "#FEE2E2",
    title: "Suspect Origin",
    icon: Flame,
    badge: "bg-rose-50 text-rose-800 border-rose-200",
  },
  MULE: {
    bg: "#D97706",
    border: "#F59E0B",
    ring: "#FEF3C7",
    title: "Intermediary Mule",
    icon: User,
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  VASP_DEPOSIT: {
    bg: "#1D4ED8",
    border: "#3B82F6",
    ring: "#DBEAFE",
    title: "VASP Deposit Point",
    icon: Building2,
    badge: "bg-blue-50 text-blue-800 border-blue-200",
  },
  VASP_HOT: {
    bg: "#047857",
    border: "#10B981",
    ring: "#D1FAE5",
    title: "Exchange Hot Wallet",
    icon: ShieldCheck,
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  MIXER: {
    bg: "#6D28D9",
    border: "#8B5CF6",
    ring: "#EDE9FE",
    title: "Obfuscation Mixer",
    icon: AlertTriangle,
    badge: "bg-purple-50 text-purple-800 border-purple-200",
  },
  DEFAULT: {
    bg: "#475569",
    border: "#64748B",
    ring: "#F1F5F9",
    title: "Transit Node",
    icon: Wallet,
    badge: "bg-slate-50 text-slate-800 border-slate-200",
  },
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
  const [activeFir, setActiveFir] = useState("FIR-2026/CYBER");
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [layoutName, setLayoutName] = useState("dagre");
  const [copiedKey, setCopiedKey] = useState(null);
  const [exporting, setExporting] = useState(false);

  // 1. Fetch case investigations from Case Vault
  useEffect(() => {
    fetchCases()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCasesList(data);
          if (!selectedCaseId && !traceData) {
            setSelectedCaseId(data[0].case_id);
            setActiveFir(data[0].fir_number);
          }
        }
      })
      .catch((err) => console.warn("Failed to load cases list:", err));
  }, [traceData]);

  // 2. Fetch specific case details on dropdown selection
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

  // 3. React to traceData prop updates
  useEffect(() => {
    if (traceData) {
      setActiveTrace(traceData);
      if (traceData.seed_address) {
        setActiveFir(`Investigation: ${traceData.seed_address.substring(0, 10)}...`);
      }
    }
  }, [traceData]);

  // 4. Construct Cytoscape Graph Elements & High-End Aesthetic Styling
  useEffect(() => {
    if (!containerRef.current) return;

    const elements = [];
    const nodes = activeTrace?.nodes || [];
    const edges = activeTrace?.edges || [];

    if (nodes.length === 0) {
      // Clean fallback demo fixtures
      elements.push(
        { data: { id: "seed", label: "Suspect Origin\nTQiBwk...UmhUVC", cleanName: "Suspect Origin", address: "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC", node_type: "SUSPECT", balance_usd: 0, risk_score: 0.85, risk_tier: "CRITICAL", color: NODE_CONFIGS.SUSPECT.bg, borderColor: NODE_CONFIGS.SUSPECT.border } },
        { data: { id: "mule1", label: "Hop 1 Mule\nTSGRsp...BRkWVA", cleanName: "Hop 1 Mule", address: "TSGRsppW4vSaWWstQUTa2d4CWJDWBRkWVA", node_type: "MULE", balance_usd: 15000, risk_score: 0.72, risk_tier: "HIGH", color: NODE_CONFIGS.MULE.bg, borderColor: NODE_CONFIGS.MULE.border } },
        { data: { id: "dep1", label: "Binance Deposit\nTTpfou...ofBMrk", cleanName: "Binance Deposit", address: "TTpfou5hZarSNUpbaiAWHcCyC4u7ofBMrk", node_type: "VASP_DEPOSIT", balance_usd: 14950, risk_score: 0.08, risk_tier: "LOW", color: NODE_CONFIGS.VASP_DEPOSIT.bg, borderColor: NODE_CONFIGS.VASP_DEPOSIT.border } },
        { data: { id: "hot1", label: "Binance Hot Wallet\nTMuA6Y...RB4b7N", cleanName: "Binance Hot Wallet", address: "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N", node_type: "VASP_HOT", balance_usd: 14950, risk_score: 0.08, risk_tier: "LOW", color: NODE_CONFIGS.VASP_HOT.bg, borderColor: NODE_CONFIGS.VASP_HOT.border } }
      );
      elements.push(
        { data: { id: "e1", source: "seed", target: "mule1", amount: "$15,000 USDT", usd_value: 15000, tx_hash: "a1b2c3d4e5f60718293a4b5c6d7e8f90" } },
        { data: { id: "e2", source: "mule1", target: "dep1", amount: "$14,950 USDT", usd_value: 14950, tx_hash: "b2c3d4e5f60718293a4b5c6d7e8f90a1" } },
        { data: { id: "e3", source: "dep1", target: "hot1", amount: "$14,950 USDT (Sweep)", usd_value: 14950, tx_hash: "d4e5f60718293a4b5c6d7e8f90a1b2c3" } }
      );
    } else {
      nodes.forEach((n, idx) => {
        const typeInfo = NODE_CONFIGS[n.node_type] || NODE_CONFIGS.DEFAULT;
        const shortAddr = n.address ? `${n.address.substring(0, 6)}...${n.address.substring(n.address.length - 4)}` : n.id;
        
        let cleanName = typeInfo.title;
        if (n.node_type === "SUSPECT") {
          cleanName = "Suspect Origin";
        } else if (n.node_type === "MULE") {
          cleanName = n.label ? n.label.replace(/\(TRON.*?\)/gi, "").trim() : `Hop ${idx} Mule`;
        } else if (n.node_type === "VASP_DEPOSIT") {
          cleanName = `${n.vasp_name || "VASP"} Deposit`;
        } else if (n.node_type === "VASP_HOT") {
          cleanName = `${n.vasp_name || "VASP"} Hot Wallet`;
        }

        const formattedLabel = `${cleanName}\n${shortAddr}`;

        elements.push({
          group: "nodes",
          data: {
            id: n.id || n.address,
            label: formattedLabel,
            cleanName: cleanName,
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
            ringColor: typeInfo.ring,
          },
        });
      });

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
              "font-size": "9.5px",
              "font-weight": "600",
              "font-family": "ui-sans-serif, system-ui, -apple-system, sans-serif",
              "text-valign": "bottom",
              "text-margin-y": 6,
              "text-wrap": "wrap",
              "text-max-width": "115px",
              "width": 26,
              "height": 26,
              "border-width": 2,
              "border-color": "#FFFFFF",
              "border-opacity": 1,
              "shadow-blur": 5,
              "shadow-color": "rgba(0, 0, 0, 0.15)",
              "shadow-opacity": 0.5,
              "text-background-opacity": 0,
            },
          },
          {
            selector: "edge",
            style: {
              "width": 1.5,
              "line-color": "#94A3B8",
              "target-arrow-color": "#94A3B8",
              "target-arrow-shape": "triangle",
              "arrow-scale": 0.85,
              "curve-style": "bezier",
              "label": "data(amount)",
              "font-size": "8.5px",
              "font-weight": "600",
              "font-family": "ui-monospace, SFMono-Regular, monospace",
              "color": "#475569",
              "text-rotation": "autorotate",
              "text-margin-y": -7,
              "text-background-color": "#FAFAFA",
              "text-background-opacity": 0.9,
              "text-background-padding": 2,
              "text-border-width": 0,
            },
          },
          {
            selector: "node:selected",
            style: {
              "border-width": 2.5,
              "border-color": "#2563EB",
              "shadow-blur": 10,
              "shadow-color": "rgba(37, 99, 235, 0.45)",
              "color": "#1D4ED8",
            },
          },
          {
            selector: "edge:selected",
            style: {
              "width": 2,
              "line-color": "#2563EB",
              "target-arrow-color": "#2563EB",
              "color": "#1D4ED8",
            },
          },
        ],
        layout: {
          name: layoutName,
          rankDir: "LR",
          nodeSep: 50,
          rankSep: 140,
          padding: 50,
          animate: true,
          animationDuration: 400,
        },
      });

      // Tap node
      cy.on("tap", "node", (evt) => {
        const nodeData = evt.target.data();
        setSelectedNode(nodeData);
        setSelectedEdge(null);
        setInspectorOpen(true);
      });

      // Tap edge
      cy.on("tap", "edge", (evt) => {
        const edgeData = evt.target.data();
        setSelectedEdge(edgeData);
        setSelectedNode(null);
        setInspectorOpen(true);
      });

      // Tap canvas background
      cy.on("tap", (evt) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          setSelectedEdge(null);
        }
      });

      cyRef.current = cy;

      // Select suspect node by default
      const suspectNode = cy.nodes('[node_type = "SUSPECT"]');
      if (suspectNode.length > 0) {
        suspectNode[0].select();
        setSelectedNode(suspectNode[0].data());
      }
    } catch (err) {
      console.warn("Cytoscape init error:", err);
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [activeTrace, layoutName]);

  // Zoom controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(null, 60);

  // Export Canvas Image
  const handleExportPNG = () => {
    if (!cyRef.current) return;
    setExporting(true);
    try {
      const pngUri = cyRef.current.png({ full: true, scale: 2.5, bg: "#F8FAFC" });
      const link = document.createElement("a");
      const safeFir = activeFir.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `NIRMAAN_FORENSIC_GRAPH_${safeFir}.png`;
      link.href = pngUri;
      link.click();
    } catch (err) {
      console.error("Export PNG failed:", err);
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  };

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

  // Center on node from breadcrumb
  const handleCenterNode = (nodeId) => {
    if (!cyRef.current) return;
    const n = cyRef.current.nodes(`[id = "${nodeId}"]`);
    if (n.length > 0) {
      n.select();
      setSelectedNode(n[0].data());
      cyRef.current.animate({ center: { eles: n }, zoom: 1.35, duration: 400 });
    }
  };

  // Search in graph
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!cyRef.current || !search.trim()) return;
    const q = search.trim().toLowerCase();
    cyRef.current.batch(() => {
      cyRef.current.nodes().forEach((n) => {
        const d = n.data();
        const match =
          (d.address && d.address.toLowerCase().includes(q)) ||
          (d.cleanName && d.cleanName.toLowerCase().includes(q)) ||
          (d.vasp_name && d.vasp_name.toLowerCase().includes(q));

        if (match) {
          n.select();
          setSelectedNode(d);
          cyRef.current.animate({ center: { eles: n }, zoom: 1.4, duration: 400 });
        } else {
          n.unselect();
        }
      });
    });
  };

  const activeConfig = selectedNode ? NODE_CONFIGS[selectedNode.node_type] || NODE_CONFIGS.DEFAULT : null;
  const traceNodes = activeTrace?.nodes || [];
  const traceEdges = activeTrace?.edges || [];

  return (
    <div className="flex h-[calc(100vh-76px)] w-full flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Top Professional Command Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Network size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Forensic Topology Canvas</h1>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                Hierarchical DAGRE
              </span>
              <span className="hidden sm:inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                ● Live Interactive
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono truncate max-w-sm mt-0.5">
              {activeFir} · {traceEdges.length} Hops · {traceNodes.length} Nodes
            </p>
          </div>
        </div>

        {/* Controls: Case Selector, Layout, Search, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {casesList.length > 0 && (
            <div className="relative">
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-xs font-semibold text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs max-w-[210px] sm:max-w-xs truncate"
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

          {/* Layout Selector */}
          <div className="relative">
            <select
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              title="Select Graph Layout Algorithm"
            >
              <option value="dagre">Hierarchical (Left-to-Right)</option>
              <option value="breadthfirst">Tree View (Breadthfirst)</option>
              <option value="concentric">Concentric Rings</option>
              <option value="circle">Circular Radial</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Search Wallet in Canvas */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search address / node..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-44 sm:w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </form>

          {/* High-Resolution PNG Export Button */}
          <button
            type="button"
            onClick={handleExportPNG}
            disabled={exporting}
            title="Download Court Evidence Graph PNG"
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition active:scale-95"
          >
            <Camera size={14} />
            <span className="hidden sm:inline">{exporting ? "Rendering..." : "Export PNG"}</span>
          </button>
        </div>
      </div>

      {/* Main Forensic Canvas Area with Side Inspector */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Cytoscape Canvas with Technical Micro-Dot Grid */}
        <div className="relative flex-1 bg-[#FAFAFA] overflow-hidden" style={{
          backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}>
          {/* Top Breadcrumb Trail Navigation Bar */}
          {traceNodes.length > 0 && (
            <div className="absolute top-4 left-4 right-4 z-10 hidden md:flex items-center gap-1.5 overflow-x-auto rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-xs backdrop-blur-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                <Compass size={13} className="text-blue-600" /> Trace Path:
              </span>
              {traceNodes.map((n, idx) => {
                const conf = NODE_CONFIGS[n.node_type] || NODE_CONFIGS.DEFAULT;
                return (
                  <div key={n.id || idx} className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCenterNode(n.id || n.address)}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        selectedNode?.id === (n.id || n.address)
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: conf.bg }} />
                      <span>{n.vasp_name || (n.node_type === "SUSPECT" ? "Origin" : `Hop ${idx}`)}</span>
                    </button>
                    {idx < traceNodes.length - 1 && (
                      <span className="text-slate-300 text-xs font-bold">→</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Cytoscape Container */}
          <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

          {/* Floating Zoom & Fit Action Pills */}
          <div className="absolute bottom-5 left-5 z-10 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-md backdrop-blur-md">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              onClick={handleFit}
              title="Fit to Screen (Reset View)"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Floating Color Legend Pill */}
          <div className="absolute bottom-5 right-5 z-10 hidden sm:flex items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-md">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" /> Suspect Seed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" /> Mule Layer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-sky-200" /> VASP Deposit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" /> Exchange Hot Wallet
            </span>
          </div>
        </div>

        {/* Right Forensic Node & Edge Inspector (Full-width, zero truncation) */}
        {inspectorOpen && (
          <div className="w-full sm:w-[380px] absolute sm:relative inset-y-0 right-0 z-30 sm:z-auto shrink-0 border-l border-slate-200 bg-white flex flex-col h-full shadow-2xl sm:shadow-lg overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Inspector Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {selectedNode ? "Node Particulars" : selectedEdge ? "Transaction Edge" : "Forensic Telemetry"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectorOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                title="Collapse Inspector"
              >
                <X size={16} />
              </button>
            </div>

            {/* Inspector Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {selectedNode ? (
                <div className="space-y-5">
                  {/* Entity Type Badge & Risk Metric */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold border ${activeConfig?.badge}`}>
                      {activeConfig?.title || selectedNode.node_type}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-700">
                      Risk Tier: {selectedNode.risk_tier}
                    </span>
                  </div>

                  {/* Title & Identified Entity */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Identified Node
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5 leading-snug">
                      {selectedNode.cleanName || selectedNode.vasp_name || "Blockchain Address"}
                    </h3>
                  </div>

                  {/* Wallet Address with Copy & External Link */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Public Blockchain Address:</span>
                      <a
                        href={`https://tronscan.org/#/address/${selectedNode.address || selectedNode.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-sans"
                      >
                        TronScan <ExternalLink size={11} />
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-2 font-mono text-xs text-slate-800 break-all select-all bg-white p-2.5 rounded-lg border border-slate-200">
                      <span>{selectedNode.address || selectedNode.id}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedNode.address || selectedNode.id, "nodeAddr")}
                        className="shrink-0 p-1 text-slate-400 hover:text-blue-600 transition"
                        title="Copy Public Address"
                      >
                        {copiedKey === "nodeAddr" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Balance & Risk Score Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Ledger Balance
                      </span>
                      <span className="text-base font-bold text-slate-900 mt-1 block">
                        ${Number(selectedNode.balance_usd || 0).toLocaleString()} USDT
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        ML Risk Anomaly
                      </span>
                      <span className="text-base font-bold text-rose-600 mt-1 block">
                        {Math.round((selectedNode.risk_score || 0.5) * 100)}% Risk
                      </span>
                    </div>
                  </div>

                  {/* Forensic Heuristic Explanation */}
                  {selectedNode.explanation && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Forensic Heuristic Note
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {selectedNode.explanation}
                      </p>
                    </div>
                  )}

                  {/* Syndicate Laundering Typology */}
                  {selectedNode.typology && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-950">
                          {selectedNode.typology.typology_name || "Laundering Pattern"}
                        </span>
                        <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          {selectedNode.typology.typology_code}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-900 leading-relaxed">
                        {selectedNode.typology.description}
                      </p>
                      <p className="text-[11px] font-semibold text-rose-600 pt-1 border-t border-indigo-100">
                        Statutory Offence: {selectedNode.typology.statutory_violation || "Section 318(4) BNS, 2023"}
                      </p>
                    </div>
                  )}

                  {/* Action Button: Trace From This Node */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleInvestigateNode(selectedNode.address || selectedNode.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition active:scale-98"
                    >
                      <Search size={14} /> Trace From This Wallet
                    </button>
                  </div>
                </div>
              ) : selectedEdge ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                      Transaction Transfer
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {selectedEdge.amount}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Transfer Value
                    </span>
                    <p className="text-2xl font-bold text-slate-900 mt-0.5">
                      ${Number(selectedEdge.usd_value || 0).toLocaleString()} USDT
                    </p>
                  </div>

                  {/* Transaction Hash */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Transaction Hash (TxHash):
                    </span>
                    <div className="flex items-center justify-between gap-2 font-mono text-xs text-slate-800 break-all select-all bg-white p-2.5 rounded-lg border border-slate-200">
                      <span>{selectedEdge.tx_hash || "Synthetic Transaction"}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedEdge.tx_hash, "edgeTx")}
                        className="shrink-0 p-1 text-slate-400 hover:text-blue-600 transition"
                        title="Copy TxHash"
                      >
                        {copiedKey === "edgeTx" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Source and Target Addresses */}
                  <div className="space-y-3 text-xs">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <span className="text-slate-400 font-semibold block text-[11px]">Source Node:</span>
                      <p className="font-mono text-slate-800 break-all mt-0.5">{selectedEdge.source}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <span className="text-slate-400 font-semibold block text-[11px]">Target Node:</span>
                      <p className="font-mono text-slate-800 break-all mt-0.5">{selectedEdge.target}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-14 text-center text-slate-400 space-y-2">
                  <Network size={36} className="mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">Select any node or arrow</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Click any wallet circle or transfer line in the canvas to inspect ledger balances, dwell time, and statutory evidence particulars.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toggle to reopen inspector if closed */}
        {!inspectorOpen && (
          <button
            type="button"
            onClick={() => setInspectorOpen(true)}
            className="absolute top-5 right-5 z-20 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-md hover:bg-slate-50 transition"
          >
            <SlidersHorizontal size={14} /> Inspect Node
          </button>
        )}
      </div>
    </div>
  );
}
