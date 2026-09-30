"use client";

import React, { useState } from "react";
import {
  Siren,
  Send,
  ShieldCheck,
  UserCheck,
  Check,
  Users,
  Navigation,
  ShieldAlert,
} from "lucide-react";

interface OperatorActionsProps {
  incidentId: string | null;
  victim: any | null;
  isDistress: boolean;
  recommendedTier?: "TIER_1" | "TIER_2" | null;
  onDispatch?: (incidentId: string, operator: string) => Promise<void>;
  onDispatchTier1?: (incidentId: string, operator: string) => Promise<void>;
  onDispatchTier2?: (incidentId: string, operator: string) => Promise<void>;
  onBroadcastSms: (incidentId: string, operator: string) => Promise<void>;
  onStandDown: (incidentId: string, operator: string) => Promise<void>;
}

export const OperatorActions: React.FC<OperatorActionsProps> = ({
  incidentId,
  victim,
  isDistress,
  recommendedTier = "TIER_1",
  onDispatch,
  onDispatchTier1,
  onDispatchTier2,
  onBroadcastSms,
  onStandDown,
}) => {
  const [tier1Loading, setTier1Loading] = useState(false);
  const [tier2Loading, setTier2Loading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [standDownLoading, setStandDownLoading] = useState(false);

  const [tier1Dispatched, setTier1Dispatched] = useState(false);
  const [tier2Dispatched, setTier2Dispatched] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const handleDispatchTier1 = async () => {
    if (!incidentId) return;
    setTier1Loading(true);
    try {
      if (onDispatchTier1) {
        await onDispatchTier1(incidentId, "Operator_Marcus");
      } else if (onDispatch) {
        await onDispatch(incidentId, "Operator_Marcus");
      }
      setTier1Dispatched(true);
    } finally {
      setTier1Loading(false);
    }
  };

  const handleDispatchTier2 = async () => {
    if (!incidentId) return;
    setTier2Loading(true);
    try {
      if (onDispatchTier2) {
        await onDispatchTier2(incidentId, "Operator_Marcus");
      } else if (onDispatch) {
        await onDispatch(incidentId, "Operator_Marcus");
      }
      setTier2Dispatched(true);
    } finally {
      setTier2Loading(false);
    }
  };

  const handleSms = async () => {
    if (!incidentId) return;
    setSmsLoading(true);
    try {
      await onBroadcastSms(incidentId, "Operator_Marcus");
      setSmsSent(true);
    } finally {
      setSmsLoading(false);
    }
  };

  const handleStandDown = async () => {
    if (!incidentId) return;
    setStandDownLoading(true);
    try {
      await onStandDown(incidentId, "Operator_Marcus");
      setTier1Dispatched(false);
      setTier2Dispatched(false);
      setSmsSent(false);
    } finally {
      setStandDownLoading(false);
    }
  };

  const victimName = victim?.name || "Civilian Protected";
  const victimPhone = victim?.phone || "Phone on file";
  const victimMedical = victim?.medical_notes || "None on file";

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Two-Tier CAD Tactical Matrix
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            OP: Marcus (CAD #402)
          </span>
        </div>

        {/* Victim Profile Details & Real-Time Tier Status */}
        <div className="bg-[#070B12] rounded-lg p-3 my-3 border border-slate-800/80 text-xs space-y-1.5 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">VICTIM IDENTITY:</span>
            <span className="font-semibold text-slate-200">{victimName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">DIRECT LINE:</span>
            <span className="text-cyan-400">{victimPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">MEDICAL RECORD:</span>
            <span className="text-amber-300 truncate max-w-[180px]">{victimMedical}</span>
          </div>
          <div className="flex justify-between border-t border-slate-800/60 pt-1.5 mt-1.5">
            <span className="text-slate-500">TIER 1 (AEGIS PATROL):</span>
            <span className={tier1Dispatched ? "text-emerald-400 font-bold" : "text-slate-400"}>
              {tier1Dispatched ? "Patrol Alpha (2m ETA)" : "Standby (Nearest: 250m)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">TIER 2 (GOVT POLICE):</span>
            <span className={tier2Dispatched ? "text-red-400 font-bold" : "text-slate-400"}>
              {tier2Dispatched ? "Escalated (CAD-2026)" : "Standby (112 / 767)"}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Tier Action Buttons Matrix */}
      <div className="space-y-2 pt-2">
        {/* Tier 1 Button: Aegis Private Security / Vigilante Agent */}
        <button
          onClick={handleDispatchTier1}
          disabled={!incidentId || tier1Loading || tier1Dispatched}
          className={`w-full py-2.5 px-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all border shadow-md ${
            tier1Dispatched
              ? "bg-emerald-950/80 border-emerald-600 text-emerald-300 cursor-default"
              : recommendedTier === "TIER_1"
              ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-950/50 active:scale-[0.98]"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-[0.98]"
          }`}
        >
          <div className="flex items-center gap-2">
            {tier1Dispatched ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Users className="w-4 h-4 text-cyan-300" />
            )}
            <div className="text-left leading-tight">
              <div>
                {tier1Dispatched
                  ? "TIER 1: AEGIS AGENTS DEPLOYED"
                  : tier1Loading
                  ? "PINGING NEAREST PATROL..."
                  : "DISPATCH AEGIS AGENTS (TIER 1)"}
              </div>
              <div className="text-[10px] font-normal text-slate-300">
                {tier1Dispatched
                  ? "Patrol Alpha Intercepting • ETA 2m 15s"
                  : "Nearest unit: Patrol Alpha (250m away)"}
              </div>
            </div>
          </div>
          {!tier1Dispatched && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
              2M ETA
            </span>
          )}
        </button>

        {/* Tier 2 Button: Government Police / 112 / 767 Escalation */}
        <button
          onClick={handleDispatchTier2}
          disabled={!incidentId || tier2Loading || tier2Dispatched}
          className={`w-full py-2.5 px-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all border shadow-md ${
            tier2Dispatched
              ? "bg-red-950/80 border-red-600 text-red-300 cursor-default"
              : recommendedTier === "TIER_2" || isDistress
              ? "bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-950/50 active:scale-[0.98]"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-[0.98]"
          }`}
        >
          <div className="flex items-center gap-2">
            {tier2Dispatched ? (
              <Check className="w-4 h-4 text-red-400" />
            ) : (
              <Siren className={`w-4 h-4 ${isDistress ? "animate-bounce text-yellow-300" : "text-red-400"}`} />
            )}
            <div className="text-left leading-tight">
              <div>
                {tier2Dispatched
                  ? "TIER 2: GOVERNMENT FORCES ESCALATED"
                  : tier2Loading
                  ? "GENERATING POLICE TICKET..."
                  : "ESCALATE TO POLICE 112 / 767 (TIER 2)"}
              </div>
              <div className="text-[10px] font-normal text-slate-300">
                {tier2Dispatched
                  ? "CAD Ticket Active • Tactical Units Notified"
                  : "For armed robbery, firearms & lethal distress"}
              </div>
            </div>
          </div>
          {!tier2Dispatched && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-mono">
              GOVT 112
            </span>
          )}
        </button>

        {/* Auxiliary Controls: SMS Broadcast & Stand Down */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Broadcast SMS */}
          <button
            onClick={handleSms}
            disabled={!incidentId || smsLoading || smsSent}
            className={`py-2 px-3 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              smsSent
                ? "bg-emerald-950 border-emerald-600 text-emerald-300"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 active:scale-[0.98] disabled:opacity-50"
            }`}
          >
            {smsSent ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                5 CONTACTS ALERTED
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                {smsLoading ? "BROADCASTING..." : "BROADCAST SMS (5)"}
              </>
            )}
          </button>

          {/* Stand Down */}
          <button
            onClick={handleStandDown}
            disabled={!incidentId || standDownLoading}
            className="py-2 px-3 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            STAND DOWN
          </button>
        </div>
      </div>
    </div>
  );
};
