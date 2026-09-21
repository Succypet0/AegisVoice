"use client";

import React from "react";
import { Terminal, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { CADLog } from "@/hooks/useDispatchSocket";

interface CADLogFeedProps {
  logs: CADLog[];
}

export const CADLogFeed: React.FC<CADLogFeedProps> = ({ logs }) => {
  const getLogStyle = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-400 font-semibold";
      case "warning":
        return "text-amber-400";
      case "success":
        return "text-emerald-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col h-full min-h-[160px]">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
        <Terminal className="w-4 h-4 text-cyan-400" />
        CAD Operational Audit Trail
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] mt-2 pr-1">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">No CAD events logged yet.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
              <span className={getLogStyle(log.level)}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
