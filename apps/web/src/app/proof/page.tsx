"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Radio,
  Sparkles,
  Cpu,
  Layers,
  ExternalLink,
  CheckCircle2,
  Lock,
  Zap,
  Activity,
  ArrowRight,
  EyeOff,
  Users,
} from "lucide-react";

export default function ProofPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#090D16] font-sans antialiased selection:bg-[#0284C7] selection:text-white">
      {/* Top Subtle Status Bar */}
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0284C7] animate-pulse" />
            <span className="font-heading font-bold text-sm tracking-tight text-[#0F172A]">
              AEGISVOICE
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
              EXECUTIVE PROOF
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-[#0284C7] hover:bg-slate-100 transition-colors"
            >
              Civilian Radar (/)
            </Link>
            <Link
              href="/dispatch"
              className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-[#0284C7] hover:bg-slate-100 transition-colors"
            >
              Dispatcher CAD (/dispatch)
            </Link>
            <a
              href="https://github.com/Succypet0/AegisVoice"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F172A] text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Hero Section: Calm, Authoritative Statement */}
        <section className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284C7] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AssemblyAI Voice Agent Hackathon Submission</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
            Quiet courage. <br />
            Invisible protection. <br />
            <span className="text-[#0284C7]">Instant rescue.</span>
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed font-normal">
            When violence strikes, touching a phone provokes assault, and screaming alerts predators.
            AegisVoice bridges civilian duress and dispatch rescue through hands-free, covert speech intelligence 
            powered by <strong>AssemblyAI Universal-3.5-Pro</strong> and <strong>Claude 3.5 Sonnet</strong> crisis triage.
          </p>
        </section>

        {/* Core Architectural Proof Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase tracking-wider">Acoustic Latency</span>
              <Activity className="w-4 h-4 text-[#0284C7]" />
            </div>
            <div className="font-heading text-3xl font-extrabold text-[#0F172A]">
              &lt; 1,200 ms
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Near-field 16kHz PCM streaming turn-by-turn with keyword recognition.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase tracking-wider">AI Crisis Triage</span>
              <Cpu className="w-4 h-4 text-[#0284C7]" />
            </div>
            <div className="font-heading text-3xl font-extrabold text-[#0F172A]">
              &lt; 3.0 s
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Structured threat cards, weapons detection, and distress scoring (1-10).
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase tracking-wider">Two-Tier Mesh</span>
              <Users className="w-4 h-4 text-[#0284C7]" />
            </div>
            <div className="font-heading text-3xl font-extrabold text-[#0F172A]">
              2 Tiers
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Tier 1: Private security & vigilantes (2m ETA) • Tier 2: Government police 112.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase tracking-wider">RAM Footprint</span>
              <Zap className="w-4 h-4 text-[#0284C7]" />
            </div>
            <div className="font-heading text-3xl font-extrabold text-[#0F172A]">
              ~160 MB
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Unified Next.js 14 + FastAPI server with zero-CORS single-URL deployment.
            </p>
          </div>
        </section>

        {/* The Two Operational Surfaces (Live Interactive Cards) */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-baseline justify-between">
            <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
              Dual Operational Surfaces
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Unified deployment under single domain
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Surface 1: Civilian Escort */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-[#0284C7]/50 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-[#0284C7]" />
                    <h3 className="font-heading font-bold text-lg text-[#0F172A]">
                      Civilian Mobile Escort Radar
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Route: /
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Mobile progressive web app engineered for hostile street environments. 
                  Enables hands-free audio streaming with screen wake locks and covert decoy protection.
                </p>

                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>1.2s Press-and-Hold:</strong> Prevents pocket misfires while arming active escort</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>Covert Duress Phrase:</strong> Trigger silent beacons while pretending to comply</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>Stealth Camouflage:</strong> 0% brightness blackout or functional calculator decoy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>Off-Thread AudioWorklet:</strong> Zero-jank downsampling to 16kHz PCM16</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Mobile-optimized interface</span>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Launch Civilian Escort</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Surface 2: Dispatcher CAD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-[#0284C7]/50 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#0284C7]" />
                    <h3 className="font-heading font-bold text-lg text-[#0F172A]">
                      Dispatcher Command Center (CAD)
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Route: /dispatch
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Mission-control console for security operators, private patrol networks, and emergency agencies. 
                  Provides instant acoustic context, telemetry, and 1-click dispatch.
                </p>

                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>Two-Tier Action Matrix:</strong> Dispatch nearest private agent (2m ETA) or escalate to police</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>Real-Time Waveform:</strong> HTML5 canvas visualizer listening to victim's pocket audio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>Streaming Transcript:</strong> Sub-second word arrivals with danger keyword badges</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>Tactical GIS HUD:</strong> Satellite telemetry coordinates with 1-click Google Maps launcher</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Desktop 3-column tactical CAD</span>
                <Link
                  href="/dispatch"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Launch Dispatcher CAD</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Architecture & AssemblyAI Stack */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
              Under The Hood: Speech Intelligence Stack
            </h2>
            <p className="text-sm text-slate-600">
              How AssemblyAI powers the hands-free defense workflow from ambient audio to responder routing:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-heading font-bold text-[#0F172A]">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center text-xs font-mono">1</span>
                <span>Universal-3.5-Pro</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connects over WebSocket with <code>near-field voice focus</code>, filtering generator hum and street noise while streaming 16kHz PCM audio turn-by-turn.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-heading font-bold text-[#0F172A]">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center text-xs font-mono">2</span>
                <span>Claude 3.5 Sonnet Gateway</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The instant distress is detected, ambient speech transcripts are analyzed in under 3 seconds to extract structured JSON (threat level, weapons, tactical brief).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-heading font-bold text-[#0F172A]">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center text-xs font-mono">3</span>
                <span>Embedded TinyDB & SMS Relay</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Local file-backed persistence without cloud database costs, coupled with instant 5-contact emergency SMS broadcast with live Google Maps telemetry.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-slate-700">AegisVoice</span>
            <span>• Built for the AssemblyAI Voice Agent Hackathon</span>
          </div>
          <div>
            <span>MIT License • Lagos, Nigeria & Worldwide</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
