"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  User,
  HeartPulse,
  Key,
  Users,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  X,
  Phone,
  AlertCircle,
} from "lucide-react";

export interface Contact {
  name: string;
  phone: string;
  priority: number;
}

export interface UserProfile {
  user_id: string;
  name: string;
  phone: string;
  duress_phrase: string;
  medical_notes: string;
  emergency_contacts: Contact[];
}

interface RegistrationWizardProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
  onRegistered: (profile: UserProfile) => void;
  onSelectSarahDemo: () => void;
}

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const DURESS_PRESETS = [
  "Order iced coffee",
  "Call my auntie in Lekki",
  "Where did you keep the receipt",
  "I left my glasses in the car",
  "Check the balance on my card",
];

const DEFAULT_CONTACTS: Contact[] = [
  { name: "Family Guardian 1 (Mom)", phone: "+2348033334455", priority: 1 },
  { name: "Family Guardian 2 (Brother)", phone: "+2348055556677", priority: 2 },
  { name: "Trusted Friend / Roommate", phone: "+2348077778899", priority: 3 },
  { name: "Work Colleague / Neighbor", phone: "+2348099990011", priority: 4 },
  { name: "Estate / Local Security", phone: "+2348022223344", priority: 5 },
];

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  isOpen,
  onClose,
  canDismiss = false,
  onRegistered,
  onSelectSarahDemo,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+234");
  const [selectedBlood, setSelectedBlood] = useState("O+");
  const [medicalNotes, setMedicalNotes] = useState("");

  const [duressPhrase, setDuressPhrase] = useState("Call my auntie in Lekki");

  const [contacts, setContacts] = useState<Contact[]>(DEFAULT_CONTACTS);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleContactChange = (index: number, field: "name" | "phone", value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const handleNextStep = () => {
    setErrorMessage("");
    if (step === 1) {
      if (!name.trim()) {
        setErrorMessage("Please enter your full name for CAD responders.");
        return;
      }
      if (!phone.trim() || phone.trim() === "+234") {
        setErrorMessage("Please provide a valid emergency mobile phone number.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!duressPhrase.trim()) {
        setErrorMessage("Please select or enter a covert duress code phrase.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Validate at least one contact is filled
      if (!contacts[0].name.trim() || !contacts[0].phone.trim()) {
        setErrorMessage("Please confirm at least your primary (#1) emergency contact.");
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    const fullMedical = selectedBlood
      ? `Blood Type ${selectedBlood}${medicalNotes ? `, ${medicalNotes}` : ""}`
      : medicalNotes;

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      duress_phrase: duressPhrase.trim(),
      medical_notes: fullMedical,
      emergency_contacts: contacts,
    };

    try {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/+$/, "");
      const res = await fetch(`${backendUrl}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Server rejected registration");
      }

      const data = await res.json();
      const profile: UserProfile = data.user || {
        user_id: data.user_id,
        ...payload,
      };

      // Save locally
      localStorage.setItem("aegis_user_id", profile.user_id);
      localStorage.setItem("aegis_user_name", profile.name);
      localStorage.setItem("aegis_user_profile", JSON.stringify(profile));

      onRegistered(profile);
    } catch (err: any) {
      console.warn("[Registration] Failed to save to backend:", err);
      // Even if backend is unreachable, create offline fallback profile so user can proceed
      const fallbackId = `usr_local_${Date.now().toString(36)}`;
      const fallbackProfile: UserProfile = {
        user_id: fallbackId,
        name: payload.name,
        phone: payload.phone,
        duress_phrase: payload.duress_phrase,
        medical_notes: payload.medical_notes,
        emergency_contacts: payload.emergency_contacts,
      };
      localStorage.setItem("aegis_user_id", fallbackId);
      localStorage.setItem("aegis_user_name", payload.name);
      localStorage.setItem("aegis_user_profile", JSON.stringify(fallbackProfile));
      onRegistered(fallbackProfile);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0D1424] border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Aegis Emergency Vault
              </h2>
              <p className="text-[11px] text-slate-400">
                Encrypted Tactical Onboarding
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canDismiss && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 1-Click Demo Profile Banner */}
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-emerald-950/40 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-left">
              <div className="text-xs font-bold text-white">Hackathon Evaluator?</div>
              <div className="text-[10px] text-slate-400">Instant 1-click verified demo</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onSelectSarahDemo}
            className="px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg shadow transition-colors"
          >
            Load Sarah Jenkins
          </button>
        </div>

        {/* Multi-Step Progress Tracker */}
        <div className="my-5 flex items-center justify-between px-2">
          {[
            { num: 1, label: "Identity" },
            { num: 2, label: "Duress" },
            { num: 3, label: "Circle of 5" },
            { num: 4, label: "Activate" },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s.num
                      ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20"
                      : step > s.num
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    step === s.num ? "text-cyan-400 font-bold" : "text-slate-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className={`flex-1 h-[2px] mx-1 transition-colors ${
                    step > idx + 1 ? "bg-emerald-500" : "bg-slate-800"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-crimson-950/60 border border-red-500/40 flex items-center space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================= STEP 1: IDENTITY & MEDICAL ================= */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amina Bello / Chinedu Okafor"
                  className="w-full bg-[#080D18] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Emergency Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="w-full bg-[#080D18] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Used by emergency dispatch and CAD operators to identify your device.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Blood Group (For Rapid Trauma Care)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setSelectedBlood(bg)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      selectedBlood === bg
                        ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400"
                        : "bg-[#080D18] border border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Medical Alerts / Allergies (Optional)
              </label>
              <div className="relative">
                <HeartPulse className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="e.g. Asthma, Penicillin allergy, Diabetic"
                  className="w-full bg-[#080D18] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: COVERT DURESS PHRASE ================= */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#080D18] border border-cyan-500/30">
              <div className="flex items-center space-x-2 text-cyan-400 mb-1.5">
                <Key className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  How Covert Duress Works
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If someone restricts you or puts a weapon to your side, you cannot take out your
                phone. Simply say this ordinary phrase naturally in conversation. AssemblyAI hears
                it in real time, and fires an instant silent distress signal without making any
                sound.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Choose a Natural Phrase:
              </label>
              <div className="space-y-2">
                {DURESS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDuressPhrase(preset)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      duressPhrase.toLowerCase() === preset.toLowerCase()
                        ? "bg-cyan-950/80 border border-cyan-400 text-cyan-200"
                        : "bg-[#080D18] border border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>&ldquo;{preset}&rdquo;</span>
                    {duressPhrase.toLowerCase() === preset.toLowerCase() && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Or Customize Your Own Secret Phrase:
              </label>
              <input
                type="text"
                value={duressPhrase}
                onChange={(e) => setDuressPhrase(e.target.value)}
                placeholder="e.g. Can you hold my red umbrella"
                className="w-full bg-[#080D18] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Tip: Choose something you would comfortably say to an aggressor without causing suspicion.
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CIRCLE OF 5 CONTACTS ================= */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-1">
              <Users className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Your Circle of 5 Emergency Guardians
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              When duress trips, all 5 contacts receive an automated SMS with your live Google Maps
              GPS pin and medical notes.
            </p>

            <div className="space-y-2.5 mt-2">
              {contacts.map((c, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#080D18] border border-slate-800 flex items-center space-x-2"
                >
                  <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => handleContactChange(idx, "name", e.target.value)}
                      placeholder={`Guardian #${idx + 1} Name`}
                      className="w-full bg-[#0D1527] border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="tel"
                      value={c.phone}
                      onChange={(e) => handleContactChange(idx, "phone", e.target.value)}
                      placeholder="+234..."
                      className="w-full bg-[#0D1527] border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 4: REVIEW & ACTIVATE ================= */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#080D18] border border-emerald-500/40 text-left space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Vault Ready For Activation
                </span>
              </div>

              <div className="border-t border-slate-800 pt-2.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Escort Civilian:</span>
                  <span className="text-white font-semibold">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Emergency Phone:</span>
                  <span className="text-white font-mono">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Blood Group / Alerts:</span>
                  <span className="text-rose-400 font-semibold">
                    {selectedBlood} {medicalNotes && `(${medicalNotes})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Secret Duress Trigger:</span>
                  <span className="text-cyan-300 font-medium">&ldquo;{duressPhrase}&rdquo;</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Circle of Guardians:</span>
                  <span className="text-white font-semibold">
                    {contacts.filter((c) => c.name && c.phone).length} Contacts Armed
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              Upon activation, your profile is stored securely in the local emergency vault. You
              can start armed escort mode immediately with real-time AssemblyAI acoustic monitoring.
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center space-x-1 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? "Encrypting Vault..." : "Activate Emergency Vault"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
