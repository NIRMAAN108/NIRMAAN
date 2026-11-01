
import { Search, Bell, Grid3X3, ChevronDown } from "lucide-react";

export default function Header() {
  return (
    <header className="h-[76px] bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="relative w-[55%] max-w-[700px]">
        <Search className="absolute left-4 top-3 text-slate-500" size={20} />
        <input
          type="text"
          placeholder="Search by Wallet / TxID / Case ID... (Ctrl + K)"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex items-center gap-7">
        <button className="text-slate-600 hover:text-blue-600">
          <Grid3X3 size={21} />
        </button>

        <button className="relative text-slate-600 hover:text-blue-600">
          <Bell size={21} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
        </button>

        <button className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
            A
          </div>
          <span className="text-sm font-medium text-slate-800">Officer</span>
          <ChevronDown size={16} className="text-slate-500" />
        </button>
      </div>
    </header>
  );
}
