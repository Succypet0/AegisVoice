"use client";

import { useCallback, useEffect, useRef, useState } from "react";
function getDispatchWsUrl(): string {
  if (process.env.NEXT_PUBLIC_DISPATCH_WS_URL) {
    return process.env.NEXT_PUBLIC_DISPATCH_WS_URL;
  }
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backend) {
    const proto = backend.startsWith("https") ? "wss:" : "ws:";
    const host = backend.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `${proto}//${host}/ws/dispatch`;
  }
  return "ws://localhost:8000/ws/dispatch";
}

const WS_DISPATCH_URL = getDispatchWsUrl();
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface TranscriptTurn {
  id: string;
  text: string;
  isFinal: boolean;
  timestamp: string;
}

export interface CADLog {
  id: string;
  message: string;
  timestamp: string;
  level: "critical" | "warning" | "info" | "success";
}

export function useDispatchSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptTurn[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [gps, setGps] = useState<{ latitude: number; longitude: number; accuracy: number }>({
    latitude: 6.524379,
    longitude: 3.379206,
    accuracy: 4.5,
  });
  const [latestTriage, setLatestTriage] = useState<any | null>(null);
  const [activeVictim, setActiveVictim] = useState<any | null>(null);
  const [isDistress, setIsDistress] = useState(false);
  const [logs, setLogs] = useState<CADLog[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<any>(null);

  const addLog = useCallback((message: string, level: "critical" | "warning" | "info" | "success" = "info") => {
    const newLog: CADLog = {
      id: Math.random().toString(36).substring(7),
      message,
      timestamp: new Date().toLocaleTimeString(),
      level,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Fetch initial incidents list via REST
  const refreshIncidents = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/incidents`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch (e) {
      console.warn("[CAD] Failed to fetch incidents:", e);
    }
  }, []);

  useEffect(() => {
    refreshIncidents();
    const interval = setInterval(refreshIncidents, 6000);
    return () => clearInterval(interval);
  }, [refreshIncidents]);

  // Connect WebSocket to /ws/dispatch
  useEffect(() => {
    let unmounted = false;

    function connect() {
      try {
        const ws = new WebSocket(WS_DISPATCH_URL);

        ws.onopen = () => {
          if (unmounted) return;
          setIsConnected(true);
          addLog("Secure CAD link established with Aegis Voice Engine.", "success");
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
          } catch (err) {
            console.warn("[CAD WS] Non-JSON message:", err);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (!unmounted) {
            reconnectTimerRef.current = setTimeout(connect, 3000);
          }
        };

        wsRef.current = ws;
      } catch (err) {
        console.warn("[CAD WS] Connection error:", err);
        if (!unmounted) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [addLog]);

  const handleServerMessage = (data: any) => {
    switch (data.type) {
      case "INITIAL_CAD_STATE":
        if (data.recent_incidents) {
          setIncidents(data.recent_incidents);
          if (!data.active_incident_id && data.recent_incidents.length > 0) {
            setSelectedIncidentId((prev) => prev || data.recent_incidents[0].id || data.recent_incidents[0].incident_id);
          }
        }
        if (data.active_incident_id) {
          setSelectedIncidentId(data.active_incident_id);
          setIsDistress(data.is_distress || false);
        }
        if (data.active_victim) setActiveVictim(data.active_victim);
        if (data.current_gps) setGps(data.current_gps);
        break;

      case "ESCORT_STARTED":
        setSelectedIncidentId(data.incident_id);
        setActiveVictim(data.victim);
        if (data.gps) setGps(data.gps);
        setIsDistress(false);
        setTranscripts([]);
        setLatestTriage(null);
        addLog(`Escort armed for ${data.victim?.name || "Civilian Protected"}. Audio stream active.`, "info");
        refreshIncidents();
        break;

      case "INCIDENT_ALERT":
        setSelectedIncidentId(data.incident_id);
        setIsDistress(true);
        if (data.victim) setActiveVictim(data.victim);
        if (data.gps) setGps(data.gps);
        addLog(
          `CRITICAL DISTRESS TRIGGER: ${data.trigger_type} detected for ${data.victim?.name || "Civilian"}!`,
          "critical"
        );
        refreshIncidents();
        // Browser chime
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        } catch (e) {}
        break;

      case "AUDIO_LEVEL":
        setAudioLevel(data.level || 0);
        break;

      case "TRANSCRIPT_UPDATE":
        if (data.transcript) {
          setTranscripts((prev) => {
            const last = prev[prev.length - 1];
            if (last && !last.isFinal) {
              return [
                ...prev.slice(0, -1),
                { id: last.id, text: data.transcript, isFinal: data.is_final, timestamp: data.timestamp },
              ];
            } else {
              return [
                ...prev,
                { id: Math.random().toString(), text: data.transcript, isFinal: data.is_final, timestamp: data.timestamp },
              ];
            }
          });
        }
        break;

      case "TRIAGE_UPDATE":
        setLatestTriage(data.triage);
        addLog(
          `LLM Triage Complete: Threat=${data.triage?.threat_level} | Distress=${data.triage?.caller_distress_score}/10 | Rec=${data.triage?.recommended_action}`,
          "warning"
        );
        refreshIncidents();
        break;

      case "GPS_UPDATE":
        if (data.gps) setGps(data.gps);
        break;

      case "ACTION_CONFIRMED":
        addLog(`CAD Dispatch Ticket ${data.cad_ticket} generated by ${data.operator}. Police en route.`, "success");
        refreshIncidents();
        break;

      case "SMS_BROADCAST_COMPLETE":
        addLog(`Emergency SMS Broadcast dispatched to ${data.contacts_notified} family contacts.`, "success");
        refreshIncidents();
        break;

      case "INCIDENT_STAND_DOWN":
        setIsDistress(false);
        addLog(`Incident stand down confirmed by ${data.operator}. Case marked False Alarm.`, "info");
        refreshIncidents();
        break;

      case "ESCORT_ENDED":
        addLog("Civilian concluded escorted route safely.", "info");
        setIsDistress(false);
        refreshIncidents();
        break;
    }
  };

  // Actions
  const dispatchAuthorities = async (incidentId: string, operatorName: string = "Operator_Marcus") => {
    try {
      await fetch(`${BACKEND_URL}/api/incidents/${incidentId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DISPATCH_CONFIRMED", operator_name: operatorName }),
      });
    } catch (e) {
      console.error("[CAD] Action error:", e);
    }
  };

  const broadcastSms = async (incidentId: string, operatorName: string = "Operator_Marcus") => {
    try {
      await fetch(`${BACKEND_URL}/api/incidents/${incidentId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "BROADCAST_SMS", operator_name: operatorName }),
      });
    } catch (e) {
      console.error("[CAD] Action error:", e);
    }
  };

  const standDown = async (incidentId: string, operatorName: string = "Operator_Marcus") => {
    try {
      await fetch(`${BACKEND_URL}/api/incidents/${incidentId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "FALSE_ALARM", operator_name: operatorName }),
      });
    } catch (e) {
      console.error("[CAD] Action error:", e);
    }
  };

  return {
    isConnected,
    incidents,
    selectedIncidentId,
    setSelectedIncidentId,
    transcripts,
    audioLevel,
    gps,
    latestTriage,
    activeVictim,
    isDistress,
    logs,
    dispatchAuthorities,
    broadcastSms,
    standDown,
    refreshIncidents,
  };
}
