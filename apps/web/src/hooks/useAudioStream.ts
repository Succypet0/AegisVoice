"use client";

import { useCallback, useEffect, useRef, useState } from "react";
function getGuardWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backend) {
    const proto = backend.startsWith("https") ? "wss:" : "ws:";
    const host = backend.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `${proto}//${host}/ws/guard`;
  }
  return "ws://localhost:8000/ws/guard";
}

const WS_GUARD_URL = getGuardWsUrl();

export interface GPSCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useAudioStream() {
  const [isArmed, setIsArmed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [isDistress, setIsDistress] = useState(false);
  const [gps, setGps] = useState<GPSCoords>({
    latitude: 6.524379,
    longitude: 3.379206,
    accuracy: 4.5,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Initialize Geolocation Tracking
  useEffect(() => {
    if ("geolocation" in navigator) {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newGps: GPSCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setGps(newGps);
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({ type: "GPS_UPDATE", gps: newGps })
            );
          }
        },
        (err) => console.warn("[Geolocation] Error:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }
    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, []);

  const connectWebSocketWithRetry = useCallback(
    async (
      duressPhrase: string,
      userId: string = "usr_sarah_01",
      userProfile?: any,
      maxAttempts = 4
    ): Promise<WebSocket> => {
      // Warm-up ping to wake up sleeping Render backend if needed
      try {
        const backendBase = WS_GUARD_URL.replace(/^wss:/, "https:")
          .replace(/^ws:/, "http:")
          .replace(/\/ws\/guard$/, "");
        fetch(`${backendBase}/health`, { method: "GET" }).catch(() => {});
      } catch {}

      let lastError: any = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const ws = await new Promise<WebSocket>((resolve, reject) => {
            const socket = new WebSocket(WS_GUARD_URL);
            socket.binaryType = "arraybuffer";

            const timer = setTimeout(() => {
              try {
                socket.close();
              } catch {}
              reject(new Error("Connection timeout, server may still be booting."));
            }, 8000);

            socket.onopen = () => {
              clearTimeout(timer);
              setIsConnected(true);
              socket.send(
                JSON.stringify({
                  type: "START_ESCORT",
                  user_id: userProfile?.user_id || userId,
                  duress_phrase: duressPhrase,
                  gps,
                  user_profile: userProfile,
                })
              );
              resolve(socket);
            };

            socket.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                if (data.type === "ESCORT_CONFIRMED") {
                  setIncidentId(data.incident_id);
                  setIsArmed(true);
                } else if (data.type === "INCIDENT_ALERT") {
                  setIsDistress(true);
                } else if (data.type === "ESCORT_TERMINATED") {
                  setIsArmed(false);
                  setIsDistress(false);
                }
              } catch (e) {
                // Binary or non-json message
              }
            };

            socket.onerror = (err) => {
              clearTimeout(timer);
              setIsConnected(false);
              reject(err);
            };

            socket.onclose = () => {
              setIsConnected(false);
            };

            wsRef.current = socket;
          });

          return ws;
        } catch (err) {
          lastError = err;
          if (attempt < maxAttempts) {
            console.log(
              `[Guard WS] Connection attempt ${attempt} waiting for hub... retrying in 2.5s`
            );
            await new Promise((r) => setTimeout(r, 2500));
          }
        }
      }
      throw lastError || new Error("Failed to connect to Aegis Emergency Hub after retries.");
    },
    [gps]
  );

  const startEscort = async (
    duressPhrase: string = "order iced coffee",
    userId: string = "usr_sarah_01",
    userProfile?: any
  ) => {
    try {
      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Initialize Web Audio Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      // 3. Load AudioWorklet downsampler
      await audioContext.audioWorklet.addModule("/audio-processor.js");

      // 4. Create AudioWorkletNode
      const workletNode = new AudioWorkletNode(audioContext, "downsampler-processor", {
        processorOptions: {
          targetSampleRate: 16000,
          bufferSize: 2048, // ~128ms
        },
      });
      workletNodeRef.current = workletNode;

      // 5. Connect WebSocket with auto-retry
      const ws = await connectWebSocketWithRetry(duressPhrase, userId, userProfile);

      // 6. Handle PCM frames from AudioWorklet
      workletNode.port.onmessage = (e) => {
        if (e.data && e.data.type === "PCM_CHUNK") {
          const buffer = e.data.buffer;

          // Compute instantaneous RMS level for visualization
          const int16 = new Int16Array(buffer);
          let sumSquares = 0;
          for (let i = 0; i < int16.length; i++) {
            sumSquares += int16[i] * int16[i];
          }
          const rms = Math.sqrt(sumSquares / int16.length);
          const normalized = Math.min(100, (rms / 32768) * 350);
          setAudioLevel(Math.round(normalized));

          // Acoustic scream/spike detector (>88% amplitude)
          if (normalized > 88) {
            triggerAcousticSpike();
          }

          // Send raw binary 16kHz PCM frame over WebSocket
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(buffer);
          }
        }
      };

      // 7. Pipe mic input to worklet
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(workletNode);
      // Connect to a silent dummy destination to keep processor active without echoing to speaker
      const muteGain = audioContext.createGain();
      muteGain.gain.value = 0;
      workletNode.connect(muteGain);
      muteGain.connect(audioContext.destination);

      setIsArmed(true);
      return true;
    } catch (err: any) {
      console.error("[AudioStream] Failed to start escort:", err);
      if (err?.name === "NotAllowedError" || err?.message?.toLowerCase().includes("permission")) {
        alert("Microphone permission required for Armed Escort mode.");
      } else {
        alert("Aegis Satellite Hub is waking up. Please give it a few seconds and try activating again.");
      }
      return false;
    }
  };

  const stopEscort = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STOP_ESCORT" }));
      wsRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsArmed(false);
    setIsDistress(false);
    setAudioLevel(0);
    setIncidentId(null);
  };

  const triggerPanic = () => {
    setIsDistress(true);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "PANIC_TRIGGER" }));
    }
    // Haptic vibration feedback (3 short pulses)
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  };

  const triggerAcousticSpike = () => {
    if (!isDistress && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ACOUSTIC_TRIGGER" }));
      setIsDistress(true);
    }
  };

  return {
    isArmed,
    isConnected,
    incidentId,
    audioLevel,
    isDistress,
    gps,
    startEscort,
    stopEscort,
    triggerPanic,
    triggerAcousticSpike,
  };
}
