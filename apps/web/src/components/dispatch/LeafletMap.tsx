"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Compass } from "lucide-react";

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  victimName?: string;
  isDistress?: boolean;
}

export const LeafletMap = dynamic<LeafletMapProps>(
  () => import("./LeafletMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#070B12] flex items-center justify-center font-mono text-xs text-slate-500">
        <Compass className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
        Loading Tactical GIS Radar...
      </div>
    ),
  }
);
