
import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import Investigation from "./pages/Investigation";
import TransactionGraph from "./pages/TransactionGraph";
import WalletDetails from "./pages/WalletDetails";
import VASPAttribution from "./pages/VASPAttribution";
import CaseManagement from "./pages/CaseManagement";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard onNavigate={setActivePage} />;

      case "Investigations":
        return <Investigation onNavigate={setActivePage} />;

      case "Transaction Graph":
        return <TransactionGraph />;

      case "Wallet Details":
        return <WalletDetails />;

      case "VASP Attribution":
        return <VASPAttribution />;

      case "Legal Dossiers":
        return <CaseManagement onNavigate={setActivePage} title="Legal Evidence Dossiers & Certificates" />;

      case "Case Management":
        return <CaseManagement onNavigate={setActivePage} title="Case Management Vault" />;

      default:
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {activePage}
            </h1>
            <p className="mt-2 text-slate-500">
              This module is coming in the next development phase.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      <aside className="hidden h-screen w-[280px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white lg:flex">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <Header />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
