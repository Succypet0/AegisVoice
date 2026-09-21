"use client";

import React, { useEffect, useRef } from "react";
import { MessageSquare, AlertTriangle, ShieldAlert, Clock } from "lucide-react";
import { TranscriptTurn } from "@/hooks/useDispatchSocket";

interface LiveTranscriptProps {
  transcripts: TranscriptTurn[];
  isDistress: boolean;
  historicalTranscript?: string;
}

const CRITICAL_KEYWORDS = [
  "gun",
  "knife",
  "weapon",
  "stab",
  "shot",
  "kill",
  "blood",
  "bleeding",
  "iced coffee",
  "help",
  "choking",
];

const WARNING_KEYWORDS = [
  "following",
  "behind me",
  "scared",
  "alone",
  "running",
  "attacker",
  "grabbed",
  "shadow",
  "suspicious",
  "break in",
];

function highlightKeywords(text: string) {
  const words = text.split(/(\s+)/);
  return words.map((word, idx) => {
    const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (CRITICAL_KEYWORDS.some((kw) => kw.includes(clean) && clean.length > 2)) {
      return (
        <span
          key={idx}
          className="bg-red-950/90 text-red-300 font-bold px-1.5 py-0.5 rounded border border-red-700/60 inline-flex items-center gap-0.5 mx-0.5"
        >
          <AlertTriangle className="w-3 h-3 text-red-400 inline" />
          {word}
        </span>
      );
    }
    if (WARNING_KEYWORDS.some((kw) => kw.includes(clean) && clean.length > 2)) {
      return (
        <span
          key={idx}
          className="bg-amber-950/80 text-amber-300 font-semibold px-1 py-0.5 rounded border border-amber-700/50 inline-block mx-0.5"
        >
          {word}
        </span>
      );
    }
    return <span key={idx}>{word}</span>;
  });
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  transcripts,
  isDistress,
  historicalTranscript,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, historicalTranscript]);

  const hasLiveTurns = transcripts.length > 0;
  const hasHistory = !!historicalTranscript && historicalTranscript.trim().length > 0;

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col h-full min-h-[320px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare
            className={`w-4 h-4 ${isDistress ? "text-red-400" : "text-cyan-400"}`}
          />
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            AssemblyAI Universal-3.5-Pro Live Transcript
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isDistress && (
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-400 font-semibold animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              DURESS DETECTED
            </span>
          )}
          <span className="text-[11px] font-mono text-slate-400">
            {hasLiveTurns ? `${transcripts.length} turns` : hasHistory ? "Archived Turn" : "0 turns"}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto mt-3 pr-2 space-y-3 font-sans text-sm"
      >
        {!hasLiveTurns && !hasHistory ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-2 text-center">
            <MessageSquare className="w-6 h-6 text-slate-600" />
            <p>Awaiting speech input...</p>
            <p className="text-[10px] text-slate-600">
              Spoken words from civilian mobile escort will stream in real-time.
            </p>
          </div>
        ) : !hasLiveTurns && hasHistory ? (
          <div className="p-3.5 rounded-lg text-sm border bg-[#070B12] border-slate-800/80 text-slate-200">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2 pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1 text-cyan-400">
                <Clock className="w-3 h-3" />
                Recorded Incident Audio Log
              </span>
              <span className="text-emerald-400 font-semibold uppercase text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                Finalized Turn
              </span>
            </div>
            <p className="leading-relaxed break-words text-slate-100">
              {highlightKeywords(historicalTranscript!)}
            </p>
          </div>
        ) : (
          transcripts.map((turn, index) => (
            <div
              key={turn.id || index}
              className={`p-3 rounded-lg text-sm border transition-all ${
                turn.isFinal
                  ? "bg-[#070B12] border-slate-800/80 text-slate-200"
                  : "bg-cyan-950/20 border-cyan-900/40 text-cyan-200/90 italic"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {turn.timestamp || "Live"}
                </span>
                <span
                  className={
                    turn.isFinal
                      ? "text-emerald-500 font-semibold uppercase text-[9px]"
                      : "text-amber-400 font-semibold uppercase text-[9px]"
                  }
                >
                  {turn.isFinal ? "Final" : "Provisional"}
                </span>
              </div>
              <p className="leading-relaxed break-words">
                {highlightKeywords(turn.text)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
