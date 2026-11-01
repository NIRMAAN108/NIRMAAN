import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import Investigation from "./pages/Investigation";
import TransactionGraph from "./pages/TransactionGraph";
import WalletDetails from "./pages/WalletDetails";
import VASPAttribution from "./pages/VASPAttribution";
import CaseManagement from "./pages/CaseManagement";
import IntelligenceAlerts from "./pages/IntelligenceAlerts";
import Settings from "./pages/Settings";
import HelpDocs from "./pages/HelpDocs";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [pageHistory, setPageHistory] = useState([]);
  const [navParams, setNavParams] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 1024 : false;
  });

  const navigateTo = (page, params = {}) => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
    if (page === activePage) {
      if (Object.keys(params).length > 0) {
        setNavParams(params);
      }
      return;
    }
    setPageHistory((prev) => [...prev, { page: activePage, params: navParams }]);
    setActivePage(page);
    setNavParams(params);
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
        return (
          <TransactionGraph
            caseId={navParams.caseId || null}
            traceData={navParams.traceData || null}
            onNavigate={navigateTo}
          />
        );

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

      case "Intelligence & Alerts":
        return <IntelligenceAlerts onNavigate={navigateTo} />;

      case "Settings":
        return <Settings />;

      case "Help":
      case "Help & Docs":
        return <HelpDocs />;

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
      {/* Mobile Backdrop Overlay (Active only when sidebar drawer is open on mobile screens) */}
      {!sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Responsive In-Layout Sidebar: Docked on desktop/tablet, Off-canvas drawer on mobile */}
      <aside
        className={`h-screen border-r border-slate-200 bg-white transition-all duration-300 ease-in-out flex flex-col overflow-hidden z-50 md:z-auto ${
          sidebarCollapsed
            ? "max-md:-translate-x-full max-md:w-0 max-md:hidden md:relative md:shrink-0 md:w-[72px]"
            : "fixed inset-y-0 left-0 w-[260px] shadow-2xl md:shadow-none md:relative md:shrink-0 md:w-[260px]"
        }`}
      >
        <Sidebar
          activePage={activePage}
          onNavigate={navigateTo}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />
      </aside>

      {/* Main Content Area (Permanently visible alongside sidebar, never obscured by backdrops) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <Header
            activePage={activePage}
            onNavigate={navigateTo}
            onGoBack={goBack}
            canGoBack={pageHistory.length > 0 || activePage !== "Dashboard"}
            onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
