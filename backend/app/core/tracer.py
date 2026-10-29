"""
Core Blockchain Tracing & Heuristic VASP Resolver Engine
Bounded BFS pathfinding using NetworkX with Exchange Deposit Sweep Detection.
"""
import os
import json
import time
import uuid
import logging
from typing import Dict, Any, Tuple, Optional, List
import networkx as nx

from app.models.schemas import TraceRequest, TraceResponse, GraphNode, GraphEdge, TargetVASP
from app.crawlers.tron import TronCrawler

logger = logging.getLogger("nirmaan.core.tracer")

class ForensicTracer:
    def __init__(self, vasp_db_path: Optional[str] = None):
        if not vasp_db_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            vasp_db_path = os.path.join(base_dir, "data", "vasp_directory.json")
        
        self.vasp_db = self._load_vasp_directory(vasp_db_path)
        self.crawler = TronCrawler()

    def _load_vasp_directory(self, path: str) -> Dict[str, Any]:
        """Loads and indexes known VASP hot wallets for O(1) matching."""
        hot_wallet_index = {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for vasp_key, vasp_info in data.get("vasps", {}).items():
                    for addr in vasp_info.get("known_hot_wallets", []):
                        hot_wallet_index[addr] = {
                            "vasp_key": vasp_key,
                            "name": vasp_info["name"],
                            "fiu_registered": vasp_info["fiu_registered"],
                            "nodal_email": vasp_info["nodal_email"],
                            "law_enforcement_portal": vasp_info["law_enforcement_portal"]
                        }
        except Exception as e:
            logger.error(f"Failed to load VASP directory from {path}: {e}")
        return hot_wallet_index

    async def trace(self, req: TraceRequest) -> TraceResponse:
        start_time = time.time()
        trace_id = f"tr_{uuid.uuid4().hex[:8]}"

        G = nx.MultiDiGraph()
        # queue elements: (current_address, current_depth, node_type)
        queue = [(req.seed_address, 0, "SUSPECT")]
        visited = set()

        nodes_map: Dict[str, GraphNode] = {
            req.seed_address: GraphNode(
                id=req.seed_address,
                address=req.seed_address,
                node_type="SUSPECT",
                label="Scam Origin (Suspect)",
                balance_usd=0.0
            )
        }
        edges_list: List[GraphEdge] = []
        found_target_vasp: Optional[TargetVASP] = None

        while queue:
            curr_addr, depth, curr_type = queue.pop(0)

            if depth >= req.max_depth or curr_addr in visited:
                continue
            visited.add(curr_addr)

            # Check if this address itself is directly a known VASP hot wallet
            if curr_addr in self.vasp_db:
                v_meta = self.vasp_db[curr_addr]
                nodes_map[curr_addr].node_type = "VASP_HOT"
                nodes_map[curr_addr].label = f"{v_meta['name']} Hot Wallet"
                nodes_map[curr_addr].vasp_name = v_meta["name"]
                if not found_target_vasp:
                    found_target_vasp = TargetVASP(
                        name=v_meta["name"],
                        fiu_registered=v_meta["fiu_registered"],
                        deposit_address=curr_addr,
                        hot_wallet=curr_addr,
                        nodal_email=v_meta["nodal_email"],
                        law_enforcement_portal=v_meta["law_enforcement_portal"]
                    )
                continue

            # Fetch outbound transfers
            transfers = await self.crawler.fetch_transfers(curr_addr)

            for tx in transfers:
                recipient = tx["to"]
                amount = tx["amount"]

                # Apply value pruning constraint
                if amount < req.min_usd_value:
                    continue

                # Classify recipient
                is_known_hot = recipient in self.vasp_db

                # Deposit Sweep Heuristic:
                # If current node is an intermediary mule and sends into a known hot wallet,
                # then current node is an exchange deposit forwarder!
                if is_known_hot:
                    recipient_meta = self.vasp_db[recipient]
                    # Mark current address as user deposit address
                    if curr_addr in nodes_map and nodes_map[curr_addr].node_type != "SUSPECT":
                        nodes_map[curr_addr].node_type = "VASP_DEPOSIT"
                        nodes_map[curr_addr].label = f"{recipient_meta['name']} Deposit Forwarder"
                        nodes_map[curr_addr].vasp_name = recipient_meta["name"]

                    # Mark recipient as hot wallet
                    recipient_type = "VASP_HOT"
                    recipient_label = f"{recipient_meta['name']} Master Hot Wallet"
                    recipient_vasp = recipient_meta["name"]

                    if not found_target_vasp:
                        found_target_vasp = TargetVASP(
                            name=recipient_meta["name"],
                            fiu_registered=recipient_meta["fiu_registered"],
                            deposit_address=curr_addr,
                            hot_wallet=recipient,
                            sweep_tx_hash=tx["tx_hash"],
                            nodal_email=recipient_meta["nodal_email"],
                            law_enforcement_portal=recipient_meta["law_enforcement_portal"]
                        )
                else:
                    recipient_type = "MULE"
                    recipient_label = f"Intermediary Mule (Hop {depth + 1})"
                    recipient_vasp = None

                if recipient not in nodes_map:
                    nodes_map[recipient] = GraphNode(
                        id=recipient,
                        address=recipient,
                        node_type=recipient_type,
                        label=recipient_label,
                        vasp_name=recipient_vasp,
                        balance_usd=amount
                    )

                # Record edge
                edge_obj = GraphEdge(
                    source=curr_addr,
                    target=recipient,
                    tx_hash=tx["tx_hash"],
                    amount=amount,
                    token="USDT",
                    usd_value=amount,
                    timestamp=tx["timestamp"]
                )
                edges_list.append(edge_obj)

                # If we hit an exchange hot wallet, terminate exploration on this path
                if not is_known_hot:
                    queue.append((recipient, depth + 1, "MULE"))

        exec_time = round((time.time() - start_time) * 1000, 2)

        return TraceResponse(
            trace_id=trace_id,
            seed_address=req.seed_address,
            chain="TRON (TRC-20)",
            execution_time_ms=exec_time,
            destination_found=found_target_vasp is not None,
            target_vasp=found_target_vasp,
            nodes=list(nodes_map.values()),
            edges=edges_list
        )
