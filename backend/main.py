"""
AegisVoice Central Switchboard (FastAPI Hub)
Manages dual-channel persistent WebSockets (/ws/guard and /ws/dispatch),
bridges live civilian audio to AssemblyAI Universal-3.5-Pro,
runs LLM Gateway crisis triage, and persists incident telemetry in TinyDB.
"""

import asyncio
from datetime import datetime, timezone
import json
import logging
import math
import os
from pathlib import Path
import struct
from typing import Any, Dict, List, Optional, Set

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import (
    create_incident,
    create_user,
    get_active_incidents,
    get_all_incidents,
    get_incident,
    get_user,
    list_users,
    record_operator_action,
    seed_default_data_if_empty,
    update_emergency_contacts,
    update_incident_gps,
    update_incident_transcript,
    update_incident_triage,
    update_user,
)
from services.assemblyai_stt import AssemblyAIStreamingClient
from services.llm_triage import triage_distress_transcript
from services.notifier import broadcast_emergency_sms

# Load environment variables
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

logger = logging.getLogger("aegis.main")
logging.basicConfig(level=logging.INFO)

# Seed database with Sarah Jenkins on startup
seed_default_data_if_empty()

app = FastAPI(
    title="AegisVoice Emergency Streaming Hub",
    version="1.0.0",
    description="Real-Time Autonomous Emergency Voice Intelligence & CAD Triage Dispatcher",
)

# Enable CORS for air-gapped civilian (port 3000) and dispatch CAD (port 3001) frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Connection Managers
class DispatchManager:
    """Manages CAD operator WebSocket connections and incident event broadcasting."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"[CAD Manager] Operator connected. Active dispatchers: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"[CAD Manager] Operator disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        if not self.active_connections:
            return
        payload = json.dumps(message)
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.active_connections.discard(d)


dispatch_hub = DispatchManager()


# Active Escort Session State
class EscortSessionState:
    def __init__(self):
        self.active: bool = False
        self.incident_id: Optional[str] = None
        self.user_id: str = "usr_sarah_01"
        self.user_profile: Optional[Dict[str, Any]] = None
        self.current_gps: Dict[str, Any] = {"latitude": 6.524379, "longitude": 3.379206, "accuracy": 4.5}
        self.stt_client: Optional[AssemblyAIStreamingClient] = None
        self.is_distress: bool = False
        self.transcript_buffer: List[str] = []

    def reset(self):
        self.active = False
        self.incident_id = None
        self.is_distress = False
        self.transcript_buffer = []
        if self.stt_client:
            asyncio.create_task(self.stt_client.close())
            self.stt_client = None


session_state = EscortSessionState()


def _calculate_audio_energy(pcm_bytes: bytes) -> float:
    """Computes RMS energy level (0.0 to 100.0) from raw 16kHz mono PCM16 bytes."""
    if not pcm_bytes or len(pcm_bytes) < 2:
        return 0.0
    count = len(pcm_bytes) // 2
    try:
        shorts = struct.unpack(f"<{count}h", pcm_bytes)
        sum_squares = sum(s * s for s in shorts)
        rms = math.sqrt(sum_squares / count)
        # Normalize to 0 - 100 range (32767 is max amplitude)
        normalized = min(100.0, (rms / 32767.0) * 300.0)
        return round(normalized, 1)
    except Exception:
        return 0.0


# REST Schemas
class UserRegisterRequest(BaseModel):
    name: str
    phone: str
    duress_phrase: str
    medical_notes: Optional[str] = ""
    emergency_contacts: Optional[List[Dict[str, Any]]] = None


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    duress_phrase: Optional[str] = None
    medical_notes: Optional[str] = None
    emergency_contacts: Optional[List[Dict[str, Any]]] = None


class OperatorActionRequest(BaseModel):
    action: str  # "DISPATCH_CONFIRMED", "BROADCAST_SMS", "FALSE_ALARM"
    operator_name: str = "Operator"
    notes: Optional[str] = None


# REST Endpoints
@app.get("/api/health")
async def health_check():
    key_configured = bool(os.getenv("ASSEMBLYAI_API_KEY"))
    return {
        "status": "online",
        "service": "AegisVoice Emergency Hub",
        "assemblyai_configured": key_configured,
        "active_escort": session_state.active,
        "active_incident": session_state.incident_id,
        "cad_operators_connected": len(dispatch_hub.active_connections),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/register")
async def register_user(payload: UserRegisterRequest):
    data = payload.model_dump()
    user_id = create_user(data)
    new_user = get_user(user_id)
    return {"status": "success", "user_id": user_id, "user": new_user}


@app.get("/api/users")
async def fetch_users():
    return {"users": list_users()}


@app.get("/api/user/{user_id}")
async def fetch_user(user_id: str):
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/api/user/{user_id}")
async def modify_user(user_id: str, payload: UserUpdateRequest):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    success = update_user(user_id, updates)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update user profile")
    return {"status": "success", "user": get_user(user_id)}


@app.get("/api/incidents")
async def fetch_incidents():
    return {"incidents": get_all_incidents()}


@app.get("/api/incidents/active")
async def fetch_active_incidents():
    return {"active_incidents": get_active_incidents()}


@app.get("/api/incidents/{incident_id}")
async def fetch_incident(incident_id: str):
    inc = get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@app.post("/api/incidents/{incident_id}/action")
async def handle_operator_action(incident_id: str, req: OperatorActionRequest):
    inc = get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    user_profile = get_user(inc.get("user_id", "usr_sarah_01"))

    if req.action == "DISPATCH_CONFIRMED":
        record_operator_action(
            incident_id=incident_id,
            action_taken="DISPATCH_CONFIRMED",
            reviewed_by=req.operator_name,
            new_status="DISPATCHED",
        )
        await dispatch_hub.broadcast({
            "type": "ACTION_CONFIRMED",
            "incident_id": incident_id,
            "action": "DISPATCH_CONFIRMED",
            "cad_ticket": f"CAD-2026-{incident_id[-4:]}",
            "operator": req.operator_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        return {"status": "dispatched", "incident_id": incident_id}

    elif req.action == "BROADCAST_SMS":
        sms_res = await broadcast_emergency_sms(
            user_profile=user_profile or {},
            incident_id=incident_id,
            gps_coords=inc.get("gps"),
            custom_note=req.notes,
        )
        record_operator_action(
            incident_id=incident_id,
            action_taken="CONTACTS_ALERTED",
            reviewed_by=req.operator_name,
            contacts_notified=True,
        )
        await dispatch_hub.broadcast({
            "type": "SMS_BROADCAST_COMPLETE",
            "incident_id": incident_id,
            "contacts_notified": sms_res["contacts_count"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        return {"status": "sms_broadcast_complete", "details": sms_res}

    elif req.action == "FALSE_ALARM":
        record_operator_action(
            incident_id=incident_id,
            action_taken="FALSE_ALARM",
            reviewed_by=req.operator_name,
            new_status="FALSE_ALARM",
        )
        session_state.reset()
        await dispatch_hub.broadcast({
            "type": "INCIDENT_STAND_DOWN",
            "incident_id": incident_id,
            "status": "FALSE_ALARM",
            "operator": req.operator_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        return {"status": "false_alarm_recorded", "incident_id": incident_id}

    raise HTTPException(status_code=400, detail=f"Unknown operator action: {req.action}")


# =====================================================================
# WEBSOCKET 1: /ws/guard (Civilian Mobile PWA)
# =====================================================================
@app.websocket("/ws/guard")
async def websocket_guard_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("[Guard WS] Civilian mobile PWA connected.")

    # Load default profile initially
    user_profile = session_state.user_profile or get_user("usr_sarah_01")
    duress_phrase = user_profile.get("duress_phrase", "order iced coffee") if user_profile else "order iced coffee"

    loop = asyncio.get_running_loop()

    # Callbacks for AssemblyAI Streaming Client
    def on_stt_turn(transcript: str, is_final: bool, raw_data: dict):
        if is_final and transcript:
            session_state.transcript_buffer.append(transcript)
            full_text = " ".join(session_state.transcript_buffer)
            if session_state.incident_id:
                update_incident_transcript(session_state.incident_id, full_text)

        # Broadcast real-time streaming turn to dispatchers
        asyncio.run_coroutine_threadsafe(
            dispatch_hub.broadcast({
                "type": "TRANSCRIPT_UPDATE",
                "incident_id": session_state.incident_id,
                "transcript": transcript,
                "is_final": is_final,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
            loop,
        )

    def on_stt_duress(phrase: str, matched_text: str):
        logger.warning(f"[Guard WS] DURESS TRIGGER TRIP: phrase '{phrase}' in '{matched_text}'")
        asyncio.run_coroutine_threadsafe(_trigger_emergency("DURESS_PHRASE", matched_text), loop)

    def on_stt_speech():
        asyncio.run_coroutine_threadsafe(
            dispatch_hub.broadcast({
                "type": "SPEECH_DETECTED",
                "incident_id": session_state.incident_id,
            }),
            loop,
        )

    async def _trigger_emergency(trigger_type: str, context_text: str = ""):
        session_state.is_distress = True
        logger.warning(f"[Guard WS] TRIP EMERGENCY PROTOCOL: {trigger_type}")

        # Create or update incident in TinyDB
        if not session_state.incident_id:
            incident_id = create_incident({
                "user_id": session_state.user_id,
                "trigger_type": trigger_type,
                "status": "ACTIVE_TRIAGE",
                "gps": session_state.current_gps,
                "transcript_log": context_text,
            })
            session_state.incident_id = incident_id
        else:
            incident_id = session_state.incident_id

        # Alert CAD Operator immediately
        await dispatch_hub.broadcast({
            "type": "INCIDENT_ALERT",
            "incident_id": incident_id,
            "trigger_type": trigger_type,
            "threat_level": "CRITICAL",
            "victim": session_state.user_profile,
            "gps": session_state.current_gps,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Run AssemblyAI LLM Gateway triage in background
        asyncio.create_task(_run_llm_triage_async(incident_id, context_text))

    async def _run_llm_triage_async(incident_id: str, context_text: str):
        full_transcript = " ".join(session_state.transcript_buffer) or context_text
        triage_data = await triage_distress_transcript(full_transcript, session_state.user_profile)
        update_incident_triage(incident_id, triage_data)
        await dispatch_hub.broadcast({
            "type": "TRIAGE_UPDATE",
            "incident_id": incident_id,
            "triage": triage_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    try:
        while True:
            # Handle mixed messages: binary PCM audio frames OR text JSON control messages
            msg = await websocket.receive()

            if "bytes" in msg and msg["bytes"]:
                pcm_data = msg["bytes"]
                # 1. Compute audio energy level and send to CAD waveform
                energy = _calculate_audio_energy(pcm_data)
                await dispatch_hub.broadcast({
                    "type": "AUDIO_LEVEL",
                    "incident_id": session_state.incident_id,
                    "level": energy,
                })

                # 2. Forward PCM frame to AssemblyAI Streaming STT
                if session_state.stt_client and session_state.active:
                    await session_state.stt_client.send_audio(pcm_data)

            elif "text" in msg and msg["text"]:
                try:
                    event = json.loads(msg["text"])
                except Exception:
                    continue

                event_type = event.get("type")

                if event_type == "START_ESCORT":
                    session_state.active = True
                    target_user_id = event.get("user_id", "usr_sarah_01")
                    session_state.user_id = target_user_id

                    found_profile = get_user(target_user_id) or get_user("usr_sarah_01")
                    session_state.user_profile = found_profile

                    duress_override = event.get("duress_phrase") or (
                        found_profile.get("duress_phrase") if found_profile else duress_phrase
                    )

                    # Initialize STT Client connecting to AssemblyAI Universal-3.5-Pro
                    stt = AssemblyAIStreamingClient(
                        duress_phrase=duress_override,
                        on_turn=on_stt_turn,
                        on_duress=on_stt_duress,
                        on_speech_started=on_stt_speech,
                    )
                    await stt.connect()
                    session_state.stt_client = stt

                    # Create initial incident in monitoring state
                    inc_id = create_incident({
                        "user_id": session_state.user_id,
                        "trigger_type": "ESCORT_ENGAGED",
                        "status": "MONITORING",
                        "gps": session_state.current_gps,
                        "transcript_log": "",
                    })
                    session_state.incident_id = inc_id

                    await websocket.send_text(json.dumps({
                        "type": "ESCORT_CONFIRMED",
                        "incident_id": inc_id,
                        "status": "ARMED_AND_ENCRYPTED",
                    }))

                    await dispatch_hub.broadcast({
                        "type": "ESCORT_STARTED",
                        "incident_id": inc_id,
                        "victim": session_state.user_profile,
                        "gps": session_state.current_gps,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                    logger.info(f"[Guard WS] Escort Armed. Incident ID: {inc_id}")

                elif event_type == "PANIC_TRIGGER":
                    logger.warning("[Guard WS] Slide-to-Panic triggered by user touch gesture!")
                    await _trigger_emergency("MANUAL_PANIC_SLIDER", "User slid manual panic button.")

                elif event_type == "ACOUSTIC_TRIGGER":
                    logger.warning("[Guard WS] Sudden acoustic decibel spike trigger!")
                    await _trigger_emergency("ACOUSTIC_DECIBEL_THRESHOLD", "Acoustic decibel scream/impact spike.")

                elif event_type == "GPS_UPDATE":
                    gps_data = event.get("gps", {})
                    session_state.current_gps = gps_data
                    if session_state.incident_id:
                        update_incident_gps(session_state.incident_id, gps_data)
                    await dispatch_hub.broadcast({
                        "type": "GPS_UPDATE",
                        "incident_id": session_state.incident_id,
                        "gps": gps_data,
                    })

                elif event_type == "STOP_ESCORT":
                    logger.info("[Guard WS] Civilian ended escort session.")
                    if session_state.stt_client:
                        await session_state.stt_client.close()
                    session_state.reset()
                    await websocket.send_text(json.dumps({"type": "ESCORT_TERMINATED"}))
                    await dispatch_hub.broadcast({
                        "type": "ESCORT_ENDED",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })

    except WebSocketDisconnect:
        logger.info("[Guard WS] Civilian WebSocket disconnected.")
        if session_state.stt_client:
            await session_state.stt_client.close()
        session_state.reset()
    except Exception as e:
        logger.error(f"[Guard WS] Error: {e}")
        if session_state.stt_client:
            await session_state.stt_client.close()
        session_state.reset()


# =====================================================================
# WEBSOCKET 2: /ws/dispatch (CAD Operator Command Dashboard)
# =====================================================================
@app.websocket("/ws/dispatch")
async def websocket_dispatch_endpoint(websocket: WebSocket):
    await dispatch_hub.connect(websocket)
    try:
        # Send initial CAD dashboard state
        recent_incidents = get_all_incidents()
        active_user = session_state.user_profile
        if not active_user:
            if recent_incidents and recent_incidents[0].get("user_id"):
                active_user = get_user(recent_incidents[0]["user_id"])
            if not active_user:
                active_user = get_user("usr_sarah_01")

        await websocket.send_text(json.dumps({
            "type": "INITIAL_CAD_STATE",
            "active_escort": session_state.active,
            "active_incident_id": session_state.incident_id,
            "active_victim": active_user,
            "current_gps": session_state.current_gps,
            "is_distress": session_state.is_distress,
            "recent_incidents": recent_incidents[:10],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }))

        while True:
            # Handle inbound operator commands via WebSocket
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
            except Exception:
                continue

            cmd = msg.get("action")
            incident_id = msg.get("incident_id") or session_state.incident_id

            if cmd and incident_id:
                # Reuse the operator action handler
                req = OperatorActionRequest(
                    action=cmd,
                    operator_name=msg.get("operator", "CAD_Operator_Marcus"),
                    notes=msg.get("notes"),
                )
                await handle_operator_action(incident_id, req)

    except WebSocketDisconnect:
        dispatch_hub.disconnect(websocket)
    except Exception as e:
        logger.error(f"[CAD WS] Error: {e}")
        dispatch_hub.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
