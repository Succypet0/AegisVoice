/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aegis: {
          bg: "#070B12",
          card: "#0D1424",
          cardBorder: "#1E293B",
          cyan: "#06B6D4",
          cyanGlow: "#22D3EE",
          emerald: "#10B981",
          crimson: "#EF4444",
          amber: "#F59E0B",
          muted: "#94A3B8",
        },
        cad: {
          bg: "#080C14",
          panel: "#0D1322",
          panelHeader: "#131C30",
          border: "#1E293B",
          borderAccent: "#334155",
          cyan: "#06B6D4",
          emerald: "#10B981",
          amber: "#F59E0B",
          crimson: "#EF4444",
        },
      },
      animation: {
        "radar-sweep": "radarSweep 3s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "radar": "radarSweep 4s linear infinite",
      },
      keyframes: {
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(6, 182, 212, 0.4)" },
          "100%": { boxShadow: "0 0 25px rgba(6, 182, 212, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
