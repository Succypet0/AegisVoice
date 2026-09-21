"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Mic,
  Plus,
  Users,
  EyeOff,
  Calculator as CalcIcon,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import { TacticalRadar } from "@/components/guard/TacticalRadar";
import { SlideToPanic } from "@/components/guard/SlideToPanic";
import { DecoyMode } from "@/components/guard/DecoyMode";
import { ContactsModal } from "@/components/guard/ContactsModal";
import { RegistrationWizard, UserProfile } from "@/components/guard/RegistrationWizard";
import { useAudioStream } from "@/hooks/useAudioStream";
import { useWakeLock } from "@/hooks/useWakeLock";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function GuardPage() {
  const {
    isArmed,
    isConnected,
    incidentId,
    audioLevel,
    isDistress,
    gps,
    startEscort,
    stopEscort,
    triggerPanic,
  } = useAudioStream();

  const { isLocked, requestLock, releaseLock } = useWakeLock();

  // App UI states
  const [decoyMode, setDecoyMode] = useState<"normal" | "blackout" | "calculator">("normal");
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Active User Profile
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aegis_user_id") || "usr_sarah_01";
    }
    return "usr_sarah_01";
  });
  const [activeUserName, setActiveUserName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aegis_user_name") || "Sarah Jenkins";
    }
    return "Sarah Jenkins";
  });
  const [duressPhrase, setDuressPhrase] = useState("Order iced coffee");
  const [contacts, setContacts] = useState([
    { name: "Mom (Helen)", phone: "+2348033334455", priority: 1 },
    { name: "Mark (Brother)", phone: "+2348055556677", priority: 2 },
    { name: "Elena (Roommate)", phone: "+2348077778899", priority: 3 },
    { name: "David (Partner)", phone: "+2348099990011", priority: 4 },
    { name: "Neighborhood Security", phone: "+2348022223344", priority: 5 },
  ]);

  // Load user profile on mount or prompt registration if new
  useEffect(() => {
    async function initUser() {
      const storedId = localStorage.getItem("aegis_user_id");
      const storedName = localStorage.getItem("aegis_user_name");

      if (!storedId) {
        // First-time user: automatically open Registration Wizard
        setIsWizardOpen(true);
        return;
      }

      setActiveUserId(storedId);
      if (storedName) setActiveUserName(storedName);

      try {
        const res = await fetch(`${BACKEND_URL}/api/user/${storedId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.name) setActiveUserName(data.name);
          if (data.duress_phrase) setDuressPhrase(data.duress_phrase);
          if (data.emergency_contacts && data.emergency_contacts.length > 0) {
            setContacts(data.emergency_contacts);
          }
        }
      } catch (err) {
        console.warn("[Guard PWA] Offline or backend not reachable yet, using local profile.");
      }
    }
    initUser();
  }, []);

  const handleActivate = async () => {
    const ok = await startEscort(duressPhrase, activeUserId);
    if (ok) {
      await requestLock();
    }
  };

  const handleDeactivate = async () => {
    stopEscort();
    await releaseLock();
  };

  const handleSaveContacts = async (updatedContacts: any[], updatedPhrase: string) => {
    setContacts(updatedContacts);
    setDuressPhrase(updatedPhrase);
    try {
      await fetch(`${BACKEND_URL}/api/user/${activeUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duress_phrase: updatedPhrase,
          emergency_contacts: updatedContacts,
        }),
      });
    } catch (e) {
      console.warn("[Guard PWA] Failed to save to backend:", e);
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setActiveUserId(profile.user_id);
    setActiveUserName(profile.name);
    setDuressPhrase(profile.duress_phrase);
    if (profile.emergency_contacts && profile.emergency_contacts.length > 0) {
      setContacts(profile.emergency_contacts);
    }
    setIsWizardOpen(false);
  };

  const handleSelectSarahDemo = async () => {
    const sarahId = "usr_sarah_01";
    setActiveUserId(sarahId);
    setActiveUserName("Sarah Jenkins");
    localStorage.setItem("aegis_user_id", sarahId);
    localStorage.setItem("aegis_user_name", "Sarah Jenkins");

    try {
      const res = await fetch(`${BACKEND_URL}/api/user/${sarahId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.duress_phrase) setDuressPhrase(data.duress_phrase);
        if (data.emergency_contacts) setContacts(data.emergency_contacts);
      }
    } catch (e) {
      setDuressPhrase("Order iced coffee");
    }
    setIsWizardOpen(false);
  };

  return (
    <>
      {/* Stealth Decoy Screens */}
      <DecoyMode mode={decoyMode} onSetMode={setDecoyMode} isArmed={isArmed} />

      {/* Emergency Contacts Modal */}
      <ContactsModal
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        contacts={contacts}
        duressPhrase={duressPhrase}
        onSave={handleSaveContacts}
      />

      {/* Civilian Onboarding / Profile Vault Wizard */}
      <RegistrationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        canDismiss={!!activeUserId}
        onRegistered={handleOnboardingComplete}
        onSelectSarahDemo={handleSelectSarahDemo}
      />

      <main className="w-full max-w-md mx-auto min-h-screen px-4 py-5 flex flex-col justify-between select-none">
        {/* ================= TOP STATUS BAR ================= */}
        <header className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-300 font-medium tracking-wide">
              Status:
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              {isDistress ? "Distress Alerting" : isArmed ? "Armed & Encrypted" : "Armed & Encrypted"}
            </span>
            <span className="relative flex h-2.5 w-2.5 ml-0.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isDistress ? "bg-red-400" : isArmed ? "bg-emerald-400" : "bg-emerald-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isDistress ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : isArmed ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                }`}
              />
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Covert Decoy Buttons */}
            <button
              onClick={() => setDecoyMode("blackout")}
              title="Stealth Blackout Screen"
              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 active:scale-95 transition-all"
            >
              <EyeOff className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDecoyMode("calculator")}
              title="Calculator Disguise"
              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 active:scale-95 transition-all"
            >
              <CalcIcon className="w-4 h-4" />
            </button>

            {/* Logo Title */}
            <span className="text-sm font-black tracking-widest text-slate-200 uppercase">
              AEGISVOICE
            </span>
          </div>
        </header>

        {/* Tactical User Vault Badge */}
        <div className="mt-2.5 mb-1 px-3 py-1.5 rounded-xl bg-[#0D1526]/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 truncate">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400 text-[11px] shrink-0">Vault Escort:</span>
            <span className="text-slate-200 font-bold text-xs truncate max-w-[130px]">
              {activeUserName}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 shrink-0 active:scale-95 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Switch / New</span>
          </button>
        </div>

        {/* ================= TACTICAL RADAR ================= */}
        <section className="flex-1 flex flex-col items-center justify-center">
          <TacticalRadar
            isArmed={isArmed}
            isDistress={isDistress}
            audioLevel={audioLevel}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
          />
        </section>

        {/* ================= CARD GRID ================= */}
        <section className="grid grid-cols-2 gap-3.5 my-2">
          {/* Card 1: Stealth Audio Mode */}
          <div className="p-3.5 rounded-2xl bg-[#0B1322] border border-cyan-950/80 shadow-md flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-2.5">
                <Activity className={`w-4 h-4 ${isArmed ? "animate-pulse" : ""}`} />
              </div>
              <h3 className="text-[13px] font-bold text-white tracking-wide uppercase leading-tight mb-1">
                STEALTH<br />AUDIO MODE
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-normal leading-snug mt-1.5">
              {isArmed
                ? `Active. 16kHz PCM stream online. Level: ${audioLevel}dB`
                : "Secure Listening Active. Recording ambient audio and analysis."}
            </p>
          </div>

          {/* Card 2: Duress Wake Word Active */}
          <div className="p-3.5 rounded-2xl bg-[#0B1322] border border-cyan-950/80 shadow-md flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-2.5">
                <Mic className="w-4 h-4" />
              </div>
              <h3 className="text-[13px] font-bold text-white tracking-wide uppercase leading-tight mb-1">
                DURESS WAKE<br />WORD ACTIVE
              </h3>
            </div>
            {/* Duress phrase pill matching mockup */}
            <div className="mt-2.5 px-2.5 py-1.5 rounded-xl bg-[#070D18] border border-cyan-900/60 flex items-center justify-center">
              <span className="text-xs font-semibold text-slate-100 truncate text-center">
                {duressPhrase}
              </span>
            </div>
          </div>
        </section>

        {/* ================= BOTTOM PANIC & CONTACTS ================= */}
        <footer className="mt-2 p-3.5 rounded-2xl bg-[#0B1322] border border-slate-800/80 shadow-lg">
          {/* Emergency Contacts Row */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                EMERGENCY CONTACTS
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                {contacts.length} Contacts Linked
              </span>
            </div>

            {/* Avatar Stack + Add Button */}
            <div className="flex items-center space-x-1">
              <div className="flex -space-x-1.5 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="inline-block h-6 w-6 rounded-full bg-slate-700/80 border border-slate-900 flex items-center justify-center text-[10px] text-slate-300 font-bold"
                  >
                    👤
                  </div>
                ))}
              </div>
              <button
                onClick={() => setIsContactsOpen(true)}
                className="h-6 w-6 rounded-full bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 flex items-center justify-center text-cyan-300 text-xs font-bold ml-1 active:scale-95 transition-all"
                title="Manage Contacts & Duress Code"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Slide-to-Panic Bar */}
          <SlideToPanic onPanic={triggerPanic} isDistress={isDistress} />
        </footer>
      </main>
    </>
  );
}
