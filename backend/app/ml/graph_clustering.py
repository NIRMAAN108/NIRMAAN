"""
Graph Analytics, Community Detection & Laundering Topology Clustering Engine.
Computes graph centrality, fan-out entropy, circular layering detection, and velocity metrics.
"""

from typing import List, Dict, Any, Set, Tuple, Optional
import networkx as nx
import math

def build_nx_graph(edges: List[Dict[str, Any]]) -> nx.DiGraph:
    """Constructs a directed NetworkX graph from edge dictionaries."""
    G = nx.DiGraph()
    for edge in edges:
        src = edge.get("source") or edge.get("from")
        tgt = edge.get("target") or edge.get("to")
        val = float(edge.get("usd_value") or edge.get("amount") or 0.0)
        ts = int(edge.get("timestamp") or 0)
        tx = edge.get("tx_hash", "")
        if src and tgt:
            G.add_edge(src, tgt, weight=val, timestamp=ts, tx_hash=tx)
    return G

def calculate_graph_centrality(G: nx.DiGraph, address: str) -> Dict[str, float]:
    """Computes node degree, betweenness centrality approximation, and PageRank."""
    if address not in G:
        return {
            "in_degree": 0,
            "out_degree": 0,
            "betweenness": 0.0,
            "pagerank": 0.0
        }

    in_deg = G.in_degree(address)
    out_deg = G.out_degree(address)

    try:
        pr = nx.pagerank(G, weight="weight")
        pagerank_score = pr.get(address, 0.0)
    except Exception:
        pagerank_score = 1.0 / max(1, len(G.nodes))

    try:
        bw = nx.betweenness_centrality(G)
        betweenness_score = bw.get(address, 0.0)
    except Exception:
        betweenness_score = 0.0

    return {
        "in_degree": in_deg,
        "out_degree": out_deg,
        "betweenness": round(betweenness_score, 4),
        "pagerank": round(pagerank_score, 4)
    }

def detect_circular_layering(G: nx.DiGraph, address: str) -> Dict[str, Any]:
    """
    Detects circular money routing (wash trading / round-tripping / circular mules).
    Checks if address is part of any simple directed cycle of length 2 to 5.
    """
    if address not in G:
        return {"has_cycle": False, "cycle_path": []}

    try:
        cycles = list(nx.simple_cycles(G))
        for c in cycles:
            if address in c and 2 <= len(c) <= 6:
                return {
                    "has_cycle": True,
                    "cycle_path": c,
                    "cycle_length": len(c)
                }
    except Exception:
        pass

    return {"has_cycle": False, "cycle_path": []}

def calculate_dispersion_entropy(outgoing_transfers: List[Dict[str, Any]]) -> float:
    """
    Computes Shannon entropy of outgoing transfer amounts.
    High entropy = diversified/chaotic amounts (smurfing/fan-out).
    Low entropy = equal splitting or single-hop pass-through.
    """
    if not outgoing_transfers or len(outgoing_transfers) <= 1:
        return 0.0

    values = [float(tx.get("usd_value") or tx.get("amount") or 0.0) for tx in outgoing_transfers]
    total = sum(values)
    if total <= 0:
        return 0.0

    probabilities = [v / total for v in values if v > 0]
    entropy = -sum(p * math.log2(p) for p in probabilities if p > 0)
    return round(entropy, 3)

def compute_transfer_velocity(
    incoming_transfers: List[Dict[str, Any]],
    outgoing_transfers: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Calculates dwell time (seconds between first receipt and first forward).
    Laundering syndicates use automated bot forwarders with dwell times under 300s (5 mins).
    """
    if not incoming_transfers or not outgoing_transfers:
        return {
            "dwell_time_seconds": None,
            "is_rapid_forwarder": False,
            "velocity_tier": "NORMAL"
        }

    in_times = [int(tx.get("timestamp") or 0) for tx in incoming_transfers if int(tx.get("timestamp") or 0) > 0]
    out_times = [int(tx.get("timestamp") or 0) for tx in outgoing_transfers if int(tx.get("timestamp") or 0) > 0]

    if not in_times or not out_times:
        return {
            "dwell_time_seconds": None,
            "is_rapid_forwarder": False,
            "velocity_tier": "NORMAL"
        }

    first_in = min(in_times)
    first_out = min(out_times)
    dwell = max(0, first_out - first_in)

    if dwell <= 300:
        tier = "ULTRA_RAPID (<5m)"
        rapid = True
    elif dwell <= 1800:
        tier = "RAPID (<30m)"
        rapid = True
    elif dwell <= 7200:
        tier = "MODERATE (<2h)"
        rapid = False
    else:
        tier = "SLOW (>2h)"
        rapid = False

    return {
        "dwell_time_seconds": dwell,
        "is_rapid_forwarder": rapid,
        "velocity_tier": tier
    }
