"use client";

import React from "react";
import {
  Crosshair,
  Compass,
  ExternalLink,
  Shield,
  AlertTriangle,
  Radio,
  Satellite,
  Navigation,
} from "lucide-react";

interface TacticalGISHUDProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  victimName?: string;
  isDistress?: boolean;
}

export const TacticalGISHUD: React.FC<TacticalGISHUDProps> = ({
  latitude = 6.524379,
  longitude = 3.379206,
  accuracy = 4.5,
  victimName = "Civilian Protected",
  isDistress = false,
}) => {
  const safeLat = typeof latitude === "number" && !isNaN(latitude) ? latitude : 6.524379;
  const safeLng = typeof longitude === "number" && !isNaN(longitude) ? longitude : 3.379206;
  const safeAcc = typeof accuracy === "number" && !isNaN(accuracy) ? accuracy : 4.5;

  const mapsUrl = `https://www.google.com/maps?q=${safeLat},${safeLng}`;

  return (
    <div className="w-full h-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-2">
          <Satellite
            className={`w-4 h-4 ${isDistress ? "text-red-400 animate-pulse" : "text-cyan-400"}`}
          />
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            Tactical GIS Satellite Telemetry
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1 ${
              isDistress
                ? "bg-red-950/80 border-red-700 text-red-400 animate-pulse"
                : "bg-cyan-950/60 border-cyan-800 text-cyan-300"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDistress ? "bg-red-500 animate-ping" : "bg-cyan-400"
              }`}
            />
            {isDistress ? "CRITICAL BEACON LOCK" : "GNSS FIX: ACTIVE"}
          </span>
        </div>
      </div>

      {/* Center Radar Crosshairs & Telemetry Box */}
      <div className="my-auto py-2 grid grid-cols-1 md:grid-cols-12 gap-4 items-center z-10">
        {/* Radar Circular Sweep Graphic */}
        <div className="md:col-span-5 flex items-center justify-center">
          <div className="relative w-36 h-36 rounded-full border border-slate-700/80 bg-[#070B12] flex items-center justify-center shadow-inner">
            {/* Concentric rings */}
            <div className="absolute w-28 h-28 rounded-full border border-dashed border-slate-800" />
            <div className="absolute w-16 h-16 rounded-full border border-slate-800" />
            {/* Axis crosshairs */}
            <div className="absolute w-full h-[1px] bg-slate-800/80" />
            <div className="absolute h-full w-[1px] bg-slate-800/80" />

            {/* Rotating radar sweep beam */}
            <div
              className={`absolute inset-0 rounded-full animate-spin ${
                isDistress
                  ? "bg-gradient-to-tr from-transparent via-red-500/10 to-transparent"
                  : "bg-gradient-to-tr from-transparent via-cyan-500/10 to-transparent"
              }`}
              style={{ animationDuration: "3s" }}
            />

            {/* Center target indicator */}
            <div className="relative flex items-center justify-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                  isDistress
                    ? "bg-red-500/20 border-red-500 shadow-[0_0_12px_#ef4444]"
                    : "bg-cyan-500/20 border-cyan-400 shadow-[0_0_12px_#06b6d4]"
                }`}
              >
                <Crosshair
                  className={`w-4 h-4 ${isDistress ? "text-red-400 animate-spin" : "text-cyan-300"}`}
                />
              </div>
              <span
                className={`absolute -inset-1 rounded-full animate-ping opacity-75 ${
                  isDistress ? "bg-red-500" : "bg-cyan-400"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Live Coordinate Figures & Metrics */}
        <div className="md:col-span-7 flex flex-col justify-center gap-2">
          {/* Latitude */}
          <div className="bg-[#070B12] border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between font-mono">
            <span className="text-[11px] text-slate-400 uppercase flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-cyan-400" />
              Latitude:
            </span>
            <span className="text-sm font-bold text-slate-100 tracking-wider">
              {safeLat.toFixed(6)}&deg; N
            </span>
          </div>

          {/* Longitude */}
          <div className="bg-[#070B12] border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between font-mono">
            <span className="text-[11px] text-slate-400 uppercase flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-cyan-400" />
              Longitude:
            </span>
            <span className="text-sm font-bold text-slate-100 tracking-wider">
              {safeLng.toFixed(6)}&deg; E
            </span>
          </div>

          {/* Precision & Target details */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-[#070B12]/80 border border-slate-800/60 rounded-md p-1.5">
              <span className="text-slate-500 block">PRECISION RADIUS</span>
              <span className="text-cyan-300 font-bold mt-0.5 block">&plusmn;{safeAcc} meters</span>
            </div>
            <div className="bg-[#070B12]/80 border border-slate-800/60 rounded-md p-1.5 truncate">
              <span className="text-slate-500 block">TARGET CITIZEN</span>
              <span className="text-slate-200 font-bold mt-0.5 block truncate">{victimName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action & External Map Link */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Real-time Geolocation Stream: Online</span>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-200 hover:text-cyan-100 font-mono text-xs font-semibold transition-all active:scale-95 shadow-sm"
          title="Open victim coordinates in Google Maps in a new tab"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
