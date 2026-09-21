"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Radio, ExternalLink } from "lucide-react";

export const DemoNavbar: React.FC = () => {
  const pathname = usePathname();
  const isDispatch = pathname?.startsWith("/dispatch");
  const isGuard = !isDispatch;

  return (
    <nav className="h-9 bg-[#04070D] border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between z-[9999] shrink-0 select-none">
      {/* Brand & Demo Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase hidden sm:inline">
          AEGISVOICE UNIFIED
        </span>

        <div className="flex items-center rounded-lg bg-[#0A101D] border border-slate-800 p-0.5 text-[11px] font-mono">
          <Link
            href="/"
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition-all ${
              isGuard
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Civilian Escort (/)</span>
          </Link>

          <Link
            href="/dispatch"
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition-all ${
              isDispatch
                ? "bg-red-500/20 text-red-300 font-bold border border-red-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Dispatcher CAD (/dispatch)</span>
          </Link>
        </div>
      </div>

      {/* Backend Status Pill */}
      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="hidden md:inline">FastAPI Hub:</span>
        <span className="text-emerald-400 font-semibold">:8000</span>
      </div>
    </nav>
  );
};
