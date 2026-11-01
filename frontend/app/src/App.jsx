
import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import Investigation from "./pages/Investigation";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard onNavigate={setActivePage} />;
      case "Investigations":
        return <Investigation />;
      default:
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {activePage}
            </h1>
            <p className="text-slate-500 mt-2">
              This module is coming in the next development phase.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <div className="hidden lg:block">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
        />
      </div>

      <main className="flex-1 min-w-0">
        <Header />
        {renderPage()}
      </main>
    </div>
  );
}
