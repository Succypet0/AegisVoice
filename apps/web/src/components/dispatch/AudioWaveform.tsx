"use client";

import React, { useEffect, useRef } from "react";
import { Activity, Volume2, MicOff } from "lucide-react";

interface AudioWaveformProps {
  audioLevel: number; // 0.0 to 1.0
  isDistress: boolean;
  isStreaming: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioLevel,
  isDistress,
  isStreaming,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<number[]>(new Array(64).fill(0.05));
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Push new smoothed audio level into buffer
    const smoothed = Math.max(0.04, Math.min(1.0, audioLevel));
    historyRef.current.push(smoothed);
    if (historyRef.current.length > 64) {
      historyRef.current.shift();
    }
  }, [audioLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;

    const render = () => {
      frame++;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const bars = historyRef.current;
      const barWidth = width / bars.length;
      const centerY = height / 2;

      // Base line
      ctx.strokeStyle = isDistress ? "rgba(239, 68, 68, 0.2)" : "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Render vertical energy bars
      bars.forEach((val, i) => {
        const x = i * barWidth;
        // Add subtle synthetic jitter if actively streaming
        const jitter = isStreaming ? Math.sin(frame * 0.1 + i * 0.4) * 0.05 * val : 0;
        const barHeight = Math.max(4, (val + jitter) * (height - 12));

        const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
        if (isDistress) {
          gradient.addColorStop(0, "#EF4444");
          gradient.addColorStop(0.5, "#DC2626");
          gradient.addColorStop(1, "#991B1B");
        } else {
          gradient.addColorStop(0, "#22D3EE");
          gradient.addColorStop(0.5, "#06B6D4");
          gradient.addColorStop(1, "#0891B2");
        }

        ctx.fillStyle = gradient;
        const w = Math.max(2, barWidth - 1.5);
        ctx.fillRect(x, centerY - barHeight / 2, w, barHeight);
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDistress, isStreaming]);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity
            className={`w-4 h-4 ${isDistress ? "text-red-500 animate-pulse" : "text-cyan-400"}`}
          />
          <span className="text-xs font-mono tracking-wider font-semibold text-slate-300 uppercase">
            Live 16kHz PCM Stream
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          {isStreaming ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <Volume2 className="w-3.5 h-3.5" />
              {Math.round(audioLevel * 100)}% RMS
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500">
              <MicOff className="w-3.5 h-3.5" />
              STANDBY
            </span>
          )}
        </div>
      </div>

      <div className="h-20 w-full bg-[#070B12] rounded-lg border border-slate-800/80 relative overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full h-full object-cover"
        />
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[11px] font-mono text-slate-500 uppercase tracking-widest">
            Awaiting Civilian Audio Stream
          </div>
        )}
      </div>
    </div>
  );
};
