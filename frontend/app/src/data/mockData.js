/**
 * Standard Forensic Presets & Benchmark Scenarios
 * Verified across TRON, EVM (Ethereum & BSC), and Bitcoin mainnets.
 */

export const FORENSIC_PRESETS = [
  {
    id: "tron_demo",
    name: "TRON Demo · ₹15L Telegram Scam",
    address: "TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC",
    chain: "tron",
    chainLabel: "TRON (TRC-20)",
    fir: "FIR-88/2026 Cyber Cell Delhi",
    lossInr: 1500000,
    expectedExchange: "Binance",
    badge: "TRON",
    color: "#F25022"
  },
  {
    id: "evm_demo",
    name: "EVM Demo · ₹25L CEX Layering",
    address: "0x95222290DD7853684454F4275E597E3A63725F78",
    chain: "ethereum",
    chainLabel: "Ethereum (ERC-20)",
    fir: "FIR-42/2026 Mumbai Cyber",
    lossInr: 2500000,
    expectedExchange: "Binance",
    badge: "Ethereum",
    color: "#00A4EF"
  },
  {
    id: "btc_demo",
    name: "BTC Demo · ₹50L Pig Butchering",
    address: "bc1qqyqszqgpqyqszqgpqyqszqgpqyqszqgpyfl4f3",
    chain: "bitcoin",
    chainLabel: "Bitcoin (UTXO)",
    fir: "FIR-109/2026 Bengaluru CID",
    lossInr: 5000000,
    expectedExchange: "Binance",
    badge: "Bitcoin",
    color: "#FFB900"
  },
  {
    id: "binance_live",
    name: "Live Binance 14 Vault (EVM)",
    address: "0x28C6c06298d514Db089934071355E5743bf21d60",
    chain: "ethereum",
    chainLabel: "Ethereum (ERC-20)",
    fir: "LEA-LIVE-EVM-AUDIT",
    lossInr: 0,
    expectedExchange: "Binance",
    badge: "Live EVM",
    color: "#7FBA00"
  },
  {
    id: "wazirx_live",
    name: "Live WazirX Exploiter (CRITICAL)",
    address: "0x320623b8E4fC038011325F334c45e7216c74763B",
    chain: "ethereum",
    chainLabel: "Ethereum (ERC-20)",
    fir: "FIR-WAZIRX-HEIST/2024",
    lossInr: 18000000000,
    expectedExchange: "WazirX",
    badge: "Critical",
    color: "#C42B1C"
  },
  {
    id: "tron_live",
    name: "Live Active TRON Mainnet",
    address: "TMuA6YqfCeX8EhbfYEg5y7S4DnxJRB4b7N",
    chain: "tron",
    chainLabel: "TRON (TRC-20)",
    fir: "LEA-LIVE-TRON-AUDIT",
    lossInr: 0,
    expectedExchange: "Binance",
    badge: "Live TRON",
    color: "#F25022"
  }
];
