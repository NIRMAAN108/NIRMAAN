"""
Graph Analytics, Community Detection & Laundering Topology Clustering Engine.
Computes graph centrality, fan-out entropy, circular layering detection, and velocity metrics.
"""

from typing import Any, Dict, List, Optional
import math

import networkx as nx


def _safe_amount(tx: Dict[str, Any]) -> Optional[float]:
    """Return a finite, non-negative transfer amount, or None if invalid."""
    raw = tx.get("usd_value")
    if raw is None:
        raw = tx.get("amount")
    if isinstance(raw, bool) or raw is None:
        return None
    try:
        value = float(raw)
    except (TypeError, ValueError, OverflowError):
        return None
    if not math.isfinite(value) or value <= 0 or not value.is_integer():
        return None
    return value


def _safe_timestamp(tx: Dict[str, Any]) -> Optional[int]:
    """Return a positive integer timestamp, or None if invalid."""
    raw = tx.get("timestamp")
    if isinstance(raw, bool) or raw is None:
        return None
    try:
        value = float(raw)
    except (TypeError, ValueError, OverflowError):
        return None
    if not math.isfinite(value) or value <= 0:
        return None
    return int(value)


def build_nx_graph(edges: List[Dict[str, Any]]) -> nx.DiGraph:
    """Construct a directed graph, retaining edges with safely normalized metadata."""
    graph = nx.DiGraph()
    for edge in edges:
        if not isinstance(edge, dict):
            continue
        src = edge.get("source") or edge.get("from")
        tgt = edge.get("target") or edge.get("to")
        if not src or not tgt:
            continue

        # Missing amounts default to zero for compatibility; malformed,
        # non-finite, Boolean, or negative amounts invalidate the edge.
        raw_amount = edge.get("usd_value")
        if raw_amount is None:
            raw_amount = edge.get("amount")
        if raw_amount is None:
            amount = 0.0
        else:
            amount = _safe_amount({"usd_value": raw_amount})
            if amount is None:
                continue

        # Keep invalid/missing timestamps as 0 so downstream consumers receive
        # a stable integer field rather than None.
        timestamp = _safe_timestamp(edge)
        graph.add_edge(
            src,
            tgt,
            weight=amount,
            timestamp=timestamp if timestamp is not None else 0,
            tx_hash=edge.get("tx_hash", ""),
        )
    return graph


def calculate_graph_centrality(G: nx.DiGraph, address: str) -> Dict[str, float]:
    """Compute degree, approximate betweenness, and PageRank for a node."""
    if address not in G:
        return {
            "in_degree": 0,
            "out_degree": 0,
            "betweenness": 0.0,
            "pagerank": 0.0,
        }

    try:
        pagerank = nx.pagerank(G, weight="weight").get(address, 0.0)
    except (nx.NetworkXException, ZeroDivisionError, ValueError):
        pagerank = 1.0 / max(1, len(G.nodes))

    try:
        betweenness = nx.betweenness_centrality(
            G, k=min(100, len(G)) if len(G) > 100 else None, seed=42
        ).get(address, 0.0)
    except (nx.NetworkXException, ValueError):
        betweenness = 0.0

    return {
        "in_degree": G.in_degree(address),
        "out_degree": G.out_degree(address),
        "betweenness": round(float(betweenness), 4),
        "pagerank": round(float(pagerank), 4),
    }


def detect_circular_layering(G: nx.DiGraph, address: str) -> Dict[str, Any]:
    """Find a directed cycle of length 2–6 containing address, with a search cap."""
    if address not in G:
        return {"has_cycle": False, "cycle_path": [], "search_complete": True}

    explored = 0
    try:
        for cycle in nx.simple_cycles(G, length_bound=6):
            explored += 1
            if len(cycle) >= 2 and address in cycle:
                return {
                    "has_cycle": True,
                    "cycle_path": cycle,
                    "cycle_length": len(cycle),
                    "search_complete": True,
                }
            if explored >= 5000:
                return {
                    "has_cycle": False,
                    "cycle_path": [],
                    "search_complete": False,
                }
    except (nx.NetworkXException, ValueError):
        pass

    return {"has_cycle": False, "cycle_path": [], "search_complete": True}


def calculate_dispersion_entropy(outgoing_transfers: List[Dict[str, Any]]) -> float:
    """Compute Shannon entropy over valid positive outgoing transfer amounts."""
    if not outgoing_transfers or len(outgoing_transfers) <= 1:
        return 0.0

    values = []
    for tx in outgoing_transfers:
        if not isinstance(tx, dict):
            continue
        value = _safe_amount(tx)
        if value is not None and value > 0:
            values.append(value)

    total = sum(values)
    if not values or not math.isfinite(total) or total <= 0:
        return 0.0

    probabilities = [value / total for value in values]
    entropy = -sum(p * math.log2(p) for p in probabilities if p > 0)
    return round(entropy, 3)


def compute_transfer_velocity(
    incoming_transfers: List[Dict[str, Any]],
    outgoing_transfers: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Calculate time from the earliest valid receipt to the first valid forward
    occurring at or after that receipt.
    """
    normal = {
        "dwell_time_seconds": None,
        "is_rapid_forwarder": False,
        "velocity_tier": "NORMAL",
    }
    if not incoming_transfers or not outgoing_transfers:
        return normal

    in_times = [
        timestamp
        for tx in incoming_transfers
        if isinstance(tx, dict)
        for timestamp in [_safe_timestamp(tx)]
        if timestamp is not None
    ]
    out_times = [
        timestamp
        for tx in outgoing_transfers
        if isinstance(tx, dict)
        for timestamp in [_safe_timestamp(tx)]
        if timestamp is not None
    ]
    if not in_times or not out_times:
        return normal

    first_in = min(in_times)
    eligible_outgoing = [timestamp for timestamp in out_times if timestamp >= first_in]
    if not eligible_outgoing:
        return normal

    dwell = min(eligible_outgoing) - first_in
    if dwell <= 300:
        tier, rapid = "ULTRA_RAPID (<5m)", True
    elif dwell <= 1800:
        tier, rapid = "RAPID (<30m)", True
    elif dwell <= 7200:
        tier, rapid = "MODERATE (<2h)", False
    else:
        tier, rapid = "SLOW (>2h)", False

    return {
        "dwell_time_seconds": dwell,
        "is_rapid_forwarder": rapid,
        "velocity_tier": tier,
    }
