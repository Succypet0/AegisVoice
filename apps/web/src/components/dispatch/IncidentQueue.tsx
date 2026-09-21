"use client";

import React, { useState } from "react";
import {
  ListFilter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Radio,
  ChevronRight,
} from "lucide-react";

interface IncidentQueueProps {
  incidents: any[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  onRefresh: () => Promise<void>;
}

export const IncidentQueue: React.FC<IncidentQueueProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === "ACTIVE") return inc.status === "ACTIVE" || inc.status === "IN_PROGRESS";
    if (filter === "RESOLVED") return inc.status === "RESOLVED" || inc.status === "FALSE_ALARM";
    return true;
  });

  const getThreatBadge = (level?: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-950 text-red-400 border-red-800";
      case "HIGH":
        return "bg-amber-950 text-amber-400 border-amber-800";
      case "MEDIUM":
        return "bg-yellow-950 text-yellow-400 border-yellow-800";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            CAD Incident Feed ({filteredIncidents.length})
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 my-3 bg-[#070B12] p-1 rounded-lg border border-slate-800">
        {(["ALL", "ACTIVE", "RESOLVED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
              filter === tab
                ? "bg-slate-800 text-cyan-300 shadow"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredIncidents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs">
            No incidents found for current filter.
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const incId = inc.id || inc.incident_id;
            const isSelected = selectedIncidentId === incId;
            const isDistress = inc.status === "ACTIVE" || inc.threat_level === "CRITICAL";

            return (
              <div
                key={incId}
                onClick={() => onSelectIncident(incId)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#1E293B] border-cyan-500 shadow-lg shadow-cyan-950/40"
                    : "bg-[#070B12] border-slate-800/80 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-200">
                    {incId}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getThreatBadge(
                      inc.threat_level
                    )}`}
                  >
                    {inc.threat_level || "MONITORING"}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    {inc.victim_name || "Registered Civilian"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {inc.status}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="truncate max-w-[140px]">
                    {inc.trigger_type || "Escort Route"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {inc.created_at ? new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
