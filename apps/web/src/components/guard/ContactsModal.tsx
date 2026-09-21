"use client";

import React, { useEffect, useState } from "react";
import { Users, X, Phone, Key, Save, Check } from "lucide-react";

interface Contact {
  name: string;
  phone: string;
  priority: number;
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  duressPhrase: string;
  onSave: (updatedContacts: Contact[], updatedPhrase: string) => Promise<void>;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  contacts: initialContacts,
  duressPhrase: initialPhrase,
  onSave,
}) => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [duressPhrase, setDuressPhrase] = useState(initialPhrase);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  useEffect(() => {
    setDuressPhrase(initialPhrase);
  }, [initialPhrase]);

  if (!isOpen) return null;

  const handleContactChange = (index: number, field: "name" | "phone", value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    await onSave(contacts, duressPhrase);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0D1424] border border-slate-700/60 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">Emergency Safeguards</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duress Phrase Setting */}
        <div className="my-5 p-4 rounded-2xl bg-[#080D18] border border-cyan-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <label className="text-xs font-bold text-cyan-200 tracking-wider uppercase">
              Secret Duress Code Phrase
            </label>
          </div>
          <input
            type="text"
            value={duressPhrase}
            onChange={(e) => setDuressPhrase(e.target.value)}
            placeholder="e.g. Order iced coffee"
            className="w-full bg-[#0D1527] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-cyan-400"
          />
          <p className="mt-1.5 text-[11px] text-slate-400">
            Speaking this natural phrase during escort silently alerts police and SMS contacts without any alarm sound.
          </p>
        </div>

        {/* 5 Emergency Contacts */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold text-slate-300 tracking-wider uppercase">
            5 Designated Emergency Contacts
          </label>
          {contacts.map((contact, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#080D18] border border-slate-800 flex items-center space-x-2.5"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
                #{idx + 1}
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => handleContactChange(idx, "name", e.target.value)}
                  placeholder="Contact Name"
                  className="w-full bg-[#0D1527] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                />
                <div className="flex items-center space-x-1.5">
                  <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(idx, "phone", e.target.value)}
                    placeholder="+234..."
                    className="w-full bg-[#0D1527] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 transition-all shadow-lg ${
            savedSuccess
              ? "bg-emerald-500 text-white"
              : "bg-cyan-500 hover:bg-cyan-400 text-[#070B12]"
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Settings Saved & Encrypted</span>
            </>
          ) : isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Sync to Vault</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
