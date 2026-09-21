"use client";

import React, { useState } from "react";
import { EyeOff, Calculator, X } from "lucide-react";

interface DecoyModeProps {
  mode: "normal" | "blackout" | "calculator";
  onSetMode: (mode: "normal" | "blackout" | "calculator") => void;
  isArmed: boolean;
}

export const DecoyMode: React.FC<DecoyModeProps> = ({ mode, onSetMode, isArmed }) => {
  // Calculator state
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);

  if (mode === "blackout") {
    return (
      <div
        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none cursor-pointer"
        onDoubleClick={() => onSetMode("normal")}
      >
        {/* Subtle, nearly invisible hint for demo */}
        <span className="text-[10px] text-zinc-900/60 font-mono tracking-widest uppercase pointer-events-none">
          Double-tap anywhere to reveal
        </span>
      </div>
    );
  }

  if (mode === "calculator") {
    const handleNum = (n: string) => {
      setCalcDisplay((prev) => (prev === "0" ? n : prev + n));
    };

    const handleOp = (operator: string) => {
      setPrevVal(parseFloat(calcDisplay));
      setOp(operator);
      setCalcDisplay("0");
    };

    const handleEquals = () => {
      if (prevVal !== null && op) {
        const current = parseFloat(calcDisplay);
        let res = current;
        if (op === "+") res = prevVal + current;
        if (op === "-") res = prevVal - current;
        if (op === "×") res = prevVal * current;
        if (op === "÷") res = current !== 0 ? prevVal / current : 0;
        setCalcDisplay(String(res));
        setPrevVal(null);
        setOp(null);
      }
    };

    const handleClear = () => {
      setCalcDisplay("0");
      setPrevVal(null);
      setOp(null);
    };

    return (
      <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col justify-between p-6 select-none">
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-zinc-500 font-mono">Standard Calculator</span>
          <button
            onClick={() => onSetMode("normal")}
            className="p-2 text-zinc-500 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-right text-4xl text-white font-mono font-light py-8 px-2 overflow-hidden">
          {calcDisplay}
        </div>

        <div className="grid grid-cols-4 gap-3 pb-8">
          {["C", "±", "%", "÷"].map((btn) => (
            <button
              key={btn}
              onClick={() => (btn === "C" ? handleClear() : handleOp(btn))}
              className="h-16 rounded-2xl bg-zinc-800 text-cyan-400 text-xl font-medium active:bg-zinc-700"
            >
              {btn}
            </button>
          ))}
          {["7", "8", "9", "×"].map((btn) => (
            <button
              key={btn}
              onClick={() => (btn === "×" ? handleOp(btn) : handleNum(btn))}
              className={`h-16 rounded-2xl ${
                btn === "×" ? "bg-cyan-600 text-white" : "bg-zinc-900 text-white"
              } text-xl font-medium active:opacity-75`}
            >
              {btn}
            </button>
          ))}
          {["4", "5", "6", "-"].map((btn) => (
            <button
              key={btn}
              onClick={() => (btn === "-" ? handleOp(btn) : handleNum(btn))}
              className={`h-16 rounded-2xl ${
                btn === "-" ? "bg-cyan-600 text-white" : "bg-zinc-900 text-white"
              } text-xl font-medium active:opacity-75`}
            >
              {btn}
            </button>
          ))}
          {["1", "2", "3", "+"].map((btn) => (
            <button
              key={btn}
              onClick={() => (btn === "+" ? handleOp(btn) : handleNum(btn))}
              className={`h-16 rounded-2xl ${
                btn === "+" ? "bg-cyan-600 text-white" : "bg-zinc-900 text-white"
              } text-xl font-medium active:opacity-75`}
            >
              {btn}
            </button>
          ))}
          <button
            onClick={() => handleNum("0")}
            className="col-span-2 h-16 rounded-2xl bg-zinc-900 text-white text-xl font-medium active:opacity-75"
          >
            0
          </button>
          <button
            onClick={() => handleNum(".")}
            className="h-16 rounded-2xl bg-zinc-900 text-white text-xl font-medium active:opacity-75"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="h-16 rounded-2xl bg-emerald-600 text-white text-xl font-medium active:opacity-75"
          >
            =
          </button>
        </div>
      </div>
    );
  }

  return null;
};
