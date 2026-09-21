"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Radio,
  Wifi,
  WifiOff,
  Clock,
  User,
  AlertTriangle,
  Siren,
  Maximize2,
  Bell,
  Sparkles,
} from "lucide-react";
import { useDispatchSocket } from "@/hooks/useDispatchSocket";
import { IncidentQueue } from "@/components/dispatch/IncidentQueue";
import { TacticalGISHUD } from "@/components/dispatch/TacticalGISHUD";
import { AudioWaveform } from "@/components/dispatch/AudioWaveform";
import { LiveTranscript } from "@/components/dispatch/LiveTranscript";
import { TriageThreatCard } from "@/components/dispatch/TriageThreatCard";
import { OperatorActions } from "@/components/dispatch/OperatorActions";
import { CADLogFeed } from "@/components/dispatch/CADLogFeed";

export default function DispatchPortalPage() {
  const {
    isConnected,
    incidents,
    selectedIncidentId,
    setSelectedIncidentId,
    transcripts,
    audioLevel,
    gps,
    latestTriage,
    activeVictim,
    isDistress,
    logs,
    dispatchAuthorities,
    broadcastSms,
    standDown,
    refreshIncidents,
  } = useDispatchSocket();

  // Find currently inspected incident
  const currentIncident =
    incidents.find((inc) => (inc.id === selectedIncidentId || inc.incident_id === selectedIncidentId)) ||
    (incidents.length > 0 ? incidents[0] : null);

  const victimData = currentIncident ? {
    name: currentIncident.victim_name || activeVictim?.name || "Civilian Protected",
    phone: currentIncident.victim_phone || activeVictim?.phone || "",
    medical_notes: currentIncident.medical_notes || activeVictim?.medical_notes || "None on record",
  } : activeVictim;

  const displayGps = currentIncident?.gps || gps;
  const safeLatitude = Number(displayGps?.latitude ?? gps?.latitude ?? 6.524379);
  const safeLongitude = Number(displayGps?.longitude ?? gps?.longitude ?? 3.379206);
  const safeAccuracy = Number(displayGps?.accuracy ?? displayGps?.accuracy_meters ?? gps?.accuracy ?? 4.5);

  const displayTriage = latestTriage || currentIncident?.triage_analysis || currentIncident?.triage_result;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0F19] text-slate-100 overflow-hidden">
      {/* Emergency Global Banner when distress is active */}
      {isDistress && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between font-mono text-xs font-bold tracking-wider animate-pulse border-b border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)] z-50">
          <div className="flex items-center gap-3">
            <Siren className="w-5 h-5 animate-bounce" />
            <span>CRITICAL INCIDENT IN PROGRESS — PRIORITY LEVEL 1 CAD DISPATCH REQUIRED</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">VICTIM: {victimData?.name || "Civilian Protected"}</span>
            <span className="bg-red-950 px-2 py-0.5 rounded border border-red-400">
              AUDIO STREAM & GPS LIVE
            </span>
          </div>
        </div>
      )}

      {/* Top CAD Header Bar */}
      <header className="h-14 bg-[#0F172A] border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            {isDistress && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
                AegisVoice CAD Command Center
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                v2.4
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              Autonomous Real-Time Emergency Audio Intelligence & Triage Portal
            </p>
          </div>
        </div>

        {/* System & Connection Status */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* WebSocket Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
              isConnected
                ? "bg-emerald-950/80 border-emerald-700/80 text-emerald-300"
                : "bg-red-950/80 border-red-700/80 text-red-300 animate-pulse"
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>CAD WS: ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span>CAD WS: DISCONNECTED</span>
              </>
            )}
          </div>

          {/* AI Engine Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AssemblyAI Universal-3.5-Pro</span>
          </div>

          {/* Operator Badge */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] leading-tight hidden lg:block">
              <div className="font-semibold text-slate-200">Operator Marcus</div>
              <div className="text-[10px] text-slate-500">Station #04</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column Tactical Command Interface */}
      <main className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Column: Feed & Audit Trail (3 cols) */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
          <div className="flex-[3] min-h-0">
            <IncidentQueue
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={(id) => setSelectedIncidentId(id)}
              onRefresh={refreshIncidents}
            />
          </div>
          <div className="flex-[2] min-h-0">
            <CADLogFeed logs={logs} />
          </div>
        </section>

        {/* Center Column: Live Tactical Radar & Stream (5 cols) */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-3 h-full overflow-hidden">
          {/* Top: Tactical GIS Satellite Telemetry HUD */}
          <div className="flex-[3] min-h-[260px]">
            <TacticalGISHUD
              latitude={safeLatitude}
              longitude={safeLongitude}
              accuracy={safeAccuracy}
              victimName={victimData?.name}
              isDistress={isDistress}
            />
          </div>

          {/* Center-Bottom: Waveform & Streaming Transcript */}
          <div className="flex-[3] flex flex-col gap-3 min-h-0">
            <AudioWaveform
              audioLevel={audioLevel}
              isDistress={isDistress}
              isStreaming={isConnected && (audioLevel > 0 || isDistress)}
            />
            <div className="flex-1 min-h-0">
              <LiveTranscript
                transcripts={transcripts}
                isDistress={isDistress}
                historicalTranscript={currentIncident?.transcript_log}
              />
            </div>
          </div>
        </section>

        {/* Right Column: AI Triage & Operator CAD Matrix (4 cols) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-3 h-full overflow-hidden">
          {/* LeMUR Structured Crisis Card */}
          <div className="flex-[3] min-h-0">
            <TriageThreatCard
              triage={displayTriage}
              isDistress={isDistress}
            />
          </div>

          {/* 1-Click CAD Dispatch Matrix */}
          <div className="flex-[3] min-h-0">
            <OperatorActions
              incidentId={selectedIncidentId || (currentIncident ? (currentIncident.id || currentIncident.incident_id) : null)}
              victim={victimData}
              isDistress={isDistress}
              onDispatch={dispatchAuthorities}
              onBroadcastSms={broadcastSms}
              onStandDown={standDown}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
