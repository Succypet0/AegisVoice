"use client";

import React, { useState } from "react";
import {
  Siren,
  Send,
  ShieldCheck,
  PhoneCall,
  UserCheck,
  AlertOctagon,
  Check,
} from "lucide-react";

interface OperatorActionsProps {
  incidentId: string | null;
  victim: any | null;
  isDistress: boolean;
  onDispatch: (incidentId: string, operator: string) => Promise<void>;
  onBroadcastSms: (incidentId: string, operator: string) => Promise<void>;
  onStandDown: (incidentId: string, operator: string) => Promise<void>;
}

export const OperatorActions: React.FC<OperatorActionsProps> = ({
  incidentId,
  victim,
  isDistress,
  onDispatch,
  onBroadcastSms,
  onStandDown,
}) => {
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [standDownLoading, setStandDownLoading] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const handleDispatch = async () => {
    if (!incidentId) return;
    setDispatchLoading(true);
    try {
      await onDispatch(incidentId, "Operator_Marcus");
      setDispatched(true);
    } finally {
      setDispatchLoading(false);
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
      setDispatched(false);
      setSmsSent(false);
    } finally {
      setStandDownLoading(false);
    }
  };

  const victimName = victim?.name || "Civilian Protected";
  const victimPhone = victim?.phone || "Phone on file";
  const victimMedical = victim?.medical_notes || "None on file";

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              CAD Command & Tactical Matrix
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            OP: Marcus (CAD #402)
          </span>
        </div>

        {/* Victim Profile Details */}
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
          <div className="flex justify-between">
            <span className="text-slate-500">EMERGENCY ROUTE:</span>
            <span className="text-slate-300">Lagos 767 / NCC 112</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Matrix */}
      <div className="space-y-2 pt-2">
        {/* 1-Click Dispatch */}
        <button
          onClick={handleDispatch}
          disabled={!incidentId || dispatchLoading || dispatched}
          className={`w-full py-3 px-4 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
            dispatched
              ? "bg-emerald-700 text-white cursor-default"
              : "bg-red-600 hover:bg-red-500 text-white shadow-red-900/40 active:scale-[0.98] disabled:opacity-50"
          }`}
        >
          {dispatched ? (
            <>
              <Check className="w-4 h-4" />
              AUTHORITIES DISPATCHED (EN ROUTE)
            </>
          ) : (
            <>
              <Siren className={`w-4 h-4 ${isDistress ? "animate-bounce" : ""}`} />
              {dispatchLoading ? "GENERATING CAD TICKET..." : "1-CLICK DISPATCH AUTHORITIES"}
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* Broadcast SMS */}
          <button
            onClick={handleSms}
            disabled={!incidentId || smsLoading || smsSent}
            className={`py-2.5 px-3 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              smsSent
                ? "bg-emerald-950 border-emerald-600 text-emerald-300"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 active:scale-[0.98] disabled:opacity-50"
            }`}
          >
            {smsSent ? (
              <>
                <Check className="w-3.5 h-3.5" />
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
            className="py-2.5 px-3 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            STAND DOWN
          </button>
        </div>
      </div>
    </div>
  );
};
