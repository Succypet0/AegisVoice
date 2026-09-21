"use client";

import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Crosshair,
  Sparkles,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface TriageData {
  threat_level?: string;
  emergency_type?: string;
  caller_distress_score?: number;
  weapons_detected?: string;
  recommended_action?: string;
  summary?: string;
  triage_engine?: string;
}

interface TriageThreatCardProps {
  triage: TriageData | null;
  isDistress: boolean;
}

export const TriageThreatCard: React.FC<TriageThreatCardProps> = ({
  triage,
  isDistress,
}) => {
  if (!triage && !isDistress) {
    return (
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs h-full min-h-[220px]">
        <Sparkles className="w-6 h-6 text-slate-600 mb-2" />
        <p className="font-semibold text-slate-400">Autonomous LLM Triage Engine</p>
        <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
          Standing by. When distress is triggered, AssemblyAI LLM Gateway will parse the acoustic transcript into structured threat cards.
        </p>
      </div>
    );
  }

  const threat = triage?.threat_level || (isDistress ? "CRITICAL" : "LOW");
  const distressScore = triage?.caller_distress_score || (isDistress ? 9 : 2);
  const emergencyType = triage?.emergency_type || (isDistress ? "PHYSICAL_ASSAULT / DURESS" : "ROUTINE_ESCORT");
  const weapons = triage?.weapons_detected || "None Mentioned / Unconfirmed";
  const action = triage?.recommended_action || (isDistress ? "IMMEDIATE_POLICE_DISPATCH" : "CONTINUE_MONITORING");
  const summary = triage?.summary || "Audio stream triggered panic protocol. Triage analyzing caller acoustic stress and transcript semantics.";

  const getThreatColor = () => {
    switch (threat) {
      case "CRITICAL":
        return {
          badge: "bg-red-950 border-red-600 text-red-400",
          glow: "border-red-900/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
          bar: "bg-red-500",
        };
      case "HIGH":
        return {
          badge: "bg-amber-950 border-amber-600 text-amber-400",
          glow: "border-amber-900/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
          bar: "bg-amber-500",
        };
      case "MEDIUM":
        return {
          badge: "bg-yellow-950 border-yellow-600 text-yellow-400",
          glow: "border-yellow-900/60",
          bar: "bg-yellow-500",
        };
      default:
        return {
          badge: "bg-emerald-950 border-emerald-600 text-emerald-400",
          glow: "border-emerald-900/40",
          bar: "bg-emerald-500",
        };
    }
  };

  const style = getThreatColor();

  return (
    <div
      className={`bg-[#0F172A] border rounded-xl p-4 flex flex-col justify-between transition-all ${style.glow}`}
    >
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              AssemblyAI LeMUR Crisis Triage
            </h3>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold tracking-wider uppercase border ${style.badge}`}
          >
            {threat}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 my-3">
          <div className="bg-[#070B12] p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              Emergency Classification
            </span>
            <span className="text-xs font-bold font-mono text-slate-100 block mt-0.5 truncate">
              {emergencyType}
            </span>
          </div>

          <div className="bg-[#070B12] p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              Weapons Detected
            </span>
            <span className="text-xs font-bold font-mono text-rose-300 block mt-0.5 truncate">
              {weapons}
            </span>
          </div>
        </div>

        {/* Distress Gauge */}
        <div className="bg-[#070B12] p-2.5 rounded-lg border border-slate-800 mb-3">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
            <span>CALLER DISTRESS SCORE</span>
            <span className="font-bold text-slate-200">{distressScore} / 10</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${style.bar}`}
              style={{ width: `${distressScore * 10}%` }}
            />
          </div>
        </div>

        {/* Tactical Summary */}
        <div className="text-xs text-slate-300 bg-[#070B12]/60 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase mb-1">
            <FileText className="w-3 h-3 text-cyan-400" />
            Tactical Situation Rationale
          </div>
          <p className="leading-relaxed text-[12px]">{summary}</p>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
        <span className="text-slate-400">RECOMMENDED ACTION:</span>
        <span className="text-red-400 font-bold tracking-wider">{action}</span>
      </div>
    </div>
  );
};
