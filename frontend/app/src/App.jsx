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
  const [pageHistory, setPageHistory] = useState([]);
  const [navParams, setNavParams] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigateTo = (page, params = {}) => {
    if (page === activePage) {
      if (Object.keys(params).length > 0) {
        setNavParams(params);
      }
      return;
    }
    setPageHistory((prev) => [...prev, { page: activePage, params: navParams }]);
    setActivePage(page);
    setNavParams(params);
    setSidebarOpen(false);
  };

  const goBack = () => {
    if (pageHistory.length > 0) {
      const prev = pageHistory[pageHistory.length - 1];
      setPageHistory((h) => h.slice(0, -1));
      setActivePage(prev.page);
      setNavParams(prev.params || {});
    } else {
      setActivePage("Dashboard");
      setNavParams({});
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard onNavigate={navigateTo} />;

      case "Investigations":
        return (
          <Investigation
            onNavigate={navigateTo}
            initialWallet={navParams.wallet || ""}
            initialFir={navParams.fir || ""}
          />
        );

      case "Transaction Graph":
        return <TransactionGraph />;

      case "Wallet Details":
        return <WalletDetails />;

      case "VASP Attribution":
        return <VASPAttribution />;

      case "Legal Dossiers":
        return (
          <CaseManagement
            onNavigate={navigateTo}
            title="Legal Evidence Dossiers & Certificates"
            initialSearch={navParams.search || ""}
          />
        );

      case "Case Management":
        return (
          <CaseManagement
            onNavigate={navigateTo}
            title="Case Management Vault"
            initialSearch={navParams.search || ""}
          />
        );

      default:
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {activePage}
            </h1>
            <p className="mt-2 text-slate-500">
              This module is active and connected to intelligence telemetry.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden h-screen w-[280px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white md:flex">
        <Sidebar
          activePage={activePage}
          onNavigate={navigateTo}
        />
      </aside>

      {/* Mobile / Scaled Screen Slide-over Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex w-[280px] max-w-xs flex-1 flex-col bg-white shadow-2xl">
            <Sidebar
              activePage={activePage}
              onNavigate={navigateTo}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <Header
            activePage={activePage}
            onNavigate={navigateTo}
            onGoBack={goBack}
            canGoBack={pageHistory.length > 0 || activePage !== "Dashboard"}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
