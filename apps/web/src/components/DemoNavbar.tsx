"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Radio } from "lucide-react";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/+$/, "");

export const DemoNavbar: React.FC = () => {
  const pathname = usePathname();
  const isDispatch = pathname?.startsWith("/dispatch");
  const isGuard = !isDispatch;
  const [hubStatus, setHubStatus] = useState<"checking" | "online" | "waking">("checking");

  useEffect(() => {
    let unmounted = false;

    const checkHub = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${BACKEND_URL}/health`, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!unmounted) {
          if (res.ok) {
            setHubStatus("online");
          } else {
            setHubStatus("waking");
          }
        }
      } catch {
        if (!unmounted) {
          setHubStatus("waking");
        }
      }
    };

    // Immediate warmup probe on page load
    checkHub();

    // 15-second client keepalive interval (acts as local keep-alive while browsing)
    const interval = setInterval(checkHub, 15000);
    return () => {
      unmounted = true;
      clearInterval(interval);
    };
  }, []);

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

      {/* Dynamic Backend Status Pill & Keep-Alive */}
      <div className="flex items-center space-x-2 text-[10px] font-mono">
        {hubStatus === "online" ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-semibold tracking-wide">
              SATELLITE ONLINE
            </span>
          </>
        ) : hubStatus === "waking" ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-amber-400 font-semibold tracking-wide animate-pulse">
              WAKING CLOUD HUB (~30s)...
            </span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500" />
            </span>
            <span className="text-slate-400">CONNECTING HUB...</span>
          </>
        )}
      </div>
    </nav>
  );
};
