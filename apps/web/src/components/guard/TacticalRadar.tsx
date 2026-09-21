"use client";

import React, { useState, useRef, useEffect } from "react";
import { Shield, ShieldAlert, Radio } from "lucide-react";

interface TacticalRadarProps {
  isArmed: boolean;
  isDistress: boolean;
  audioLevel: number;
  onActivate: () => void;
  onDeactivate: () => void;
}

export const TacticalRadar: React.FC<TacticalRadarProps> = ({
  isArmed,
  isDistress,
  audioLevel,
  onActivate,
  onDeactivate,
}) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<any>(null);

  const startHold = () => {
    if (isArmed) {
      onDeactivate();
      return;
    }
    setIsHolding(true);
    setHoldProgress(0);
    const startTime = Date.now();
    const duration = 1200; // 1.2 seconds hold

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(holdTimerRef.current);
        setIsHolding(false);
        setHoldProgress(0);
        onActivate();
        if ("vibrate" in navigator) {
          navigator.vibrate(200);
        }
      }
    }, 30);
  };

  const cancelHold = () => {
    if (isHolding) {
      clearInterval(holdTimerRef.current);
      setIsHolding(false);
      setHoldProgress(0);
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, []);

  const glowColor = isDistress
    ? "rgba(239, 68, 68, 0.8)"
    : isArmed
    ? "rgba(16, 185, 129, 0.8)"
    : "rgba(6, 182, 212, 0.7)";

  const borderColor = isDistress
    ? "border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.7)]"
    : isArmed
    ? "border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.7)]"
    : "border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.6)]";

  return (
    <div className="relative flex flex-col items-center justify-center my-6">
      {/* Outer Glow Halo */}
      <div
        className={`relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border-2 ${borderColor} flex items-center justify-center transition-all duration-500 bg-[#070D18]/90 overflow-hidden cursor-pointer select-none`}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
      >
        {/* Concentric Radar Grid Circles */}
        <div className="absolute inset-6 rounded-full border border-cyan-500/20" />
        <div className="absolute inset-14 rounded-full border border-cyan-500/25" />
        <div className="absolute inset-24 rounded-full border border-cyan-500/30" />

        {/* Crosshair Lines */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/20" />
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/20" />

        {/* Dynamic Rotating Radar Sweep Beam */}
        {(isArmed || isHolding) && (
          <div
            className="absolute inset-0 pointer-events-none animate-radar-sweep origin-center"
            style={{
              background: isDistress
                ? "conic-gradient(from 0deg, transparent 0deg 300deg, rgba(239, 68, 68, 0.4) 360deg)"
                : "conic-gradient(from 0deg, transparent 0deg 300deg, rgba(6, 182, 212, 0.4) 360deg)",
            }}
          />
        )}

        {/* Voice Audio Energy Pulse Ring */}
        {isArmed && audioLevel > 5 && (
          <div
            className="absolute rounded-full border border-cyan-400/50 pointer-events-none transition-all duration-100"
            style={{
              width: `${Math.min(95, 45 + audioLevel * 0.5)}%`,
              height: `${Math.min(95, 45 + audioLevel * 0.5)}%`,
              boxShadow: `0 0 20px ${glowColor}`,
            }}
          />
        )}

        {/* Hold Progress Indicator Ring */}
        {isHolding && (
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="transparent"
              stroke="#06B6D4"
              strokeWidth="4"
              strokeDasharray="1000"
              strokeDashoffset={1000 - (holdProgress / 100) * 1000}
              className="transition-all duration-75"
            />
          </svg>
        )}

        {/* Central Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
          {/* Shield Icon with Arrow */}
          <div className="relative mb-3 flex items-center justify-center">
            {isDistress ? (
              <ShieldAlert className="w-12 h-12 text-red-400 animate-bounce" />
            ) : isArmed ? (
              <Shield className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            ) : (
              <div className="relative">
                <Shield className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-cyan-200">
                  ↗
                </span>
              </div>
            )}
          </div>

          {/* Action Text */}
          <span className="text-white font-extrabold tracking-wider text-base sm:text-lg leading-tight uppercase">
            {isDistress
              ? "DISTRESS ACTIVE\nSTREAMING SOS"
              : isArmed
              ? "ESCORT ARMED\nMONITORING"
              : isHolding
              ? `ARMING... ${Math.round(holdProgress)}%`
              : "HOLD TO\nACTIVATE\nESCORT"}
          </span>

          <span className="mt-2 text-[10px] text-cyan-300/80 tracking-widest uppercase">
            {isArmed ? "Tap to Disarm" : "16kHz Linear PCM"}
          </span>
        </div>
      </div>
    </div>
  );
};
