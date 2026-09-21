"use client";

import React, { useState, useRef, useEffect } from "react";
import { Shield, ChevronRight } from "lucide-react";

interface SlideToPanicProps {
  onPanic: () => void;
  isDistress: boolean;
}

export const SlideToPanic: React.FC<SlideToPanicProps> = ({ onPanic, isDistress }) => {
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const handleStart = (clientX: number) => {
    if (isDistress) return;
    setIsDragging(true);
    startXRef.current = clientX - sliderPos;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const maxSlide = trackRect.width - 64; // Handle width = 64px
    const currentX = clientX - startXRef.current;
    const clamped = Math.max(0, Math.min(maxSlide, currentX));
    setSliderPos(clamped);

    // Trip emergency at 75% slide distance
    if (clamped >= maxSlide * 0.75) {
      setIsDragging(false);
      setSliderPos(maxSlide);
      onPanic();
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!isDistress) {
      setSliderPos(0);
    }
  };

  return (
    <div className="w-full mt-4 select-none">
      <div
        ref={trackRef}
        className={`relative h-16 w-full rounded-2xl p-1.5 flex items-center transition-all duration-300 border ${
          isDistress
            ? "bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
            : "bg-[#0B1220]/90 border-slate-800 shadow-inner"
        }`}
        onMouseMove={(e) => isDragging && handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onTouchMove={(e) => isDragging && handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
      >
        {/* Sliding Thumb Handle */}
        <div
          className={`relative z-20 h-13 w-16 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-75 shadow-lg ${
            isDistress
              ? "bg-red-600 text-white"
              : "bg-gradient-to-r from-cyan-500 to-teal-400 text-[#070B12]"
          }`}
          style={{ transform: `translateX(${sliderPos}px)` }}
          onMouseDown={(e) => handleStart(e.clientX)}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        >
          <Shield className="w-6 h-6 fill-current" />
        </div>

        {/* Track Label Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center pl-8">
          <span className={`text-sm font-bold tracking-wide uppercase ${isDistress ? "text-red-400" : "text-slate-100"}`}>
            {isDistress ? "PANIC ALARM TRIGGERED" : "Slide-to-Panic"}
          </span>
          <div className="flex items-center text-[10px] text-slate-400 tracking-wider uppercase font-medium">
            <span>{isDistress ? "SOS BEACON ACTIVE" : "Slide right to activate panic alarm"}</span>
            {!isDistress && <ChevronRight className="w-3 h-3 text-cyan-400 ml-1 animate-pulse" />}
          </div>
        </div>
      </div>
    </div>
  );
};
