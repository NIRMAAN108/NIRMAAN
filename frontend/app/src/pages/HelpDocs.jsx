import { useState } from "react";
import {
  BookOpen,
  Scale,
  ShieldCheck,
  FileText,
  Network,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const FAQS = [
  {
    q: "How does NIRMAAN prove digital evidence admissibility under Section 63 BSA, 2023?",
    a: "NIRMAAN computes a canonical SHA-256 cryptographic hash across the exact ordered array of transaction hashes, node addresses, and timestamps comprising the trace. This hash is embedded into an automated Section 63 Bharatiya Sakshya Adhiniyam digital evidence certificate certifying that ledger telemetry was extracted directly from immutable public blockchains without tampering.",
  },
  {
    q: "What is the statutory authority to demand KYC and transaction history from offshore exchanges?",
    a: "Under Section 94 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, an Investigating Officer (IO) is empowered to issue a written summons requiring the production of any document or electronic record necessary for investigation. Furthermore, under Section 106 & 107 BNSS, IOs can direct immediate preservation/lien on deposit balances to prevent dissipation of crime proceeds.",
  },
  {
    q: "Why is TRON TRC-20 (USDT) the primary focus of cyber crime investigations in India?",
    a: "Over 85% of cyber scam syndicates (part-time task frauds, digital arrest scams, FedEx/customs extortion) instruct victims to transfer funds or purchase USDT on TRON due to low gas fees and sub-3 second settlement times. NIRMAAN specializes in tracing high-velocity TRC-20 mule layers into registered exchange forwarders.",
  },
  {
    q: "What is a 'Peeling Chain' and how does NIRMAAN flag it?",
    a: "A peeling chain is a money-laundering technique where a large sum of cryptocurrency is split into a smaller transfer (e.g., 90%) sent to an exchange or intermediary, while the remainder (e.g., 10%) is returned to a change address, repeating rapidly. NIRMAAN's heuristic layer flags 90/10 and 80/20 smurfing patterns automatically.",
  },
  {
    q: "How do I transmit Section 94 BNSS requisitions to exchange nodal officers?",
    a: "NIRMAAN generates court-ready Section 94 BNSS requisitions pre-addressed to the official nodal law enforcement email addresses of 41 FIU-IND registered entities (e.g., compliance-in@binance.com, nodal@coindcx.com). IOs can download the certified PDF or submit directly via verified LEA response portals.",
  },
];

export default function HelpDocs() {
  const [activeFaq, setActiveFaq] = useState(0);

  return (
    <div className="w-full space-y-8 p-5 sm:p-8 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
          <BookOpen size={14} /> Official Frontline Reference
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Investigation Help & Legal Guidelines</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Comprehensive Standard Operating Procedures (SOPs) for cryptocurrency tracing under BNSS 2023, BSA 2023, and BNS 2023.
        </p>
      </div>

      {/* Quick Access Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 space-y-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white w-fit">
            <Scale size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Section 94 BNSS, 2023</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Statutory power of Investigating Officers to mandate electronic KYC documents, IP telemetry, and ledger statements from VASP nodal desks within 24 hours.
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 space-y-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white w-fit">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Section 63 BSA, 2023</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mandatory digital evidence certification replacing Section 65B IEA. Requires SHA-256 hash sealing across the full blockchain graph traversal.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 space-y-3">
          <div className="p-2.5 rounded-xl bg-amber-600 text-white w-fit">
            <Network size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Section 318(4) BNS, 2023</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Statutory penal offence for cheating and dishonestly inducing delivery of property via cyber fraud, mule accounts, and algorithmic laundering layering.
          </p>
        </div>
      </div>

      {/* Step by Step Investigation SOP */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="text-blue-600" size={20} />
          Frontline 4-Step Standard Operating Procedure (SOP)
        </h2>

        <div className="space-y-4">
          <div className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/70">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Extract Suspect Wallet from Complaint or NCRP</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Copy the victim-provided deposit address (e.g. `T...` for TRON or `0x...` for Ethereum) from the FIR or NCRP 1930 portal ticket. Paste into the NIRMAAN Multi-Hop Tracer.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/70">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Execute Automated Multi-Hop Breadth-First Search (BFS)</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                NIRMAAN traverses up to 4 hops across pass-through mule wallets in under 20 milliseconds, mapping rapid forwarding bots and peeling chains until funds reach an identified custodial exchange deposit address.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/70">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Identify Destination VASP & Internal Sweep TxHash</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                The engine matches the terminal deposit forwarder against 41 FIU-IND registered entities and identifies the exchange's internal sweep transaction into institutional hot wallets (proving custodial liquidation).
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/70">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
              4
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Download Court PDF Dossier & Dispatch Section 94 Notice</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Download the court-admissible Section 94 BNSS Legal Requisition PDF and Section 63 BSA Evidence ZIP. Transmit to the verified exchange nodal officer email address with a 24-hour compliance deadline.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="text-blue-600" size={20} />
          Frequently Asked Questions (FAQ)
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? -1 : idx)}
                  className="flex w-full items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronDown size={16} className="text-blue-600 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
