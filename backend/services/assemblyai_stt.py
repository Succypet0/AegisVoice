"""
AssemblyAI v3 Real-Time WebSocket Streaming Client for AegisVoice.
Connects to AssemblyAI's flagship streaming model: Universal-3.5-Pro.
Handles 16kHz mono PCM16 audio, Turn events, duress phrase triggering,
and explicit session termination.
"""

import asyncio
import json
import logging
import os
from pathlib import Path
import urllib.parse
from typing import Callable, Optional
from dotenv import load_dotenv
import websockets

# Load backend/.env
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

logger = logging.getLogger("aegis.assemblyai_stt")
logging.basicConfig(level=logging.INFO)

ASSEMBLYAI_WS_BASE = "wss://streaming.assemblyai.com/v3/ws"


class AssemblyAIStreamingClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        duress_phrase: str = "order iced coffee",
        sample_rate: int = 16000,
        on_turn: Optional[Callable[[str, bool, dict], None]] = None,
        on_duress: Optional[Callable[[str, str], None]] = None,
        on_speech_started: Optional[Callable[[], None]] = None,
        use_mock: bool = False,
    ):
        self.api_key = api_key or os.getenv("ASSEMBLYAI_API_KEY", "")
        self.duress_phrase = duress_phrase.strip().lower()
        self.sample_rate = sample_rate
        self.on_turn = on_turn
        self.on_duress = on_duress
        self.on_speech_started = on_speech_started
        self.use_mock = use_mock or not bool(self.api_key)

        self._ws = None
        self._running = False
        self._recv_task = None
        self._duress_tripped = False
        self._accumulated_transcript = []

    def _build_ws_url(self) -> str:
        prompt_text = "Emergency distress audio monitoring. Transcribe conversational distress speech accurately."
        params = {
            "sample_rate": str(self.sample_rate),
            "speech_model": "universal-3-5-pro",
            "mode": "balanced",
            "voice_focus": "near-field",
            "prompt": prompt_text,
        }
        query_string = urllib.parse.urlencode(params)
        return f"{ASSEMBLYAI_WS_BASE}?{query_string}"

    async def connect(self) -> bool:
        """Connects to AssemblyAI v3 streaming WebSocket or starts mock fallback."""
        if self.use_mock:
            logger.info("[AssemblyAI STT] Starting in deterministic MOCK mode.")
            self._running = True
            return True

        url = self._build_ws_url()
        # Raw API key in Authorization header (no Bearer prefix per AssemblyAI v3 spec)
        headers = {"Authorization": self.api_key}

        try:
            logger.info(f"[AssemblyAI STT] Connecting to {url}...")
            self._ws = await websockets.connect(
                url,
                additional_headers=headers,
                ping_interval=20,
                ping_timeout=20,
            )
            self._running = True
            self._recv_task = asyncio.create_task(self._recv_loop())
            logger.info("[AssemblyAI STT] Connected successfully to Universal-3.5-Pro!")
            return True
        except Exception as e:
            logger.warning(
                f"[AssemblyAI STT] Connection failed: {e}. Falling back to high-fidelity mock engine."
            )
            self.use_mock = True
            self._running = True
            return True

    async def send_audio(self, pcm_chunk: bytes):
        """
        Sends raw 16kHz mono PCM16 audio bytes.
        AssemblyAI expects frames between 50ms and 1000ms.
        """
        if not self._running:
            return

        if self.use_mock:
            # In mock mode, we trigger simulated distress flow when sufficient audio is received
            await self._simulate_audio_tick()
            return

        if self._ws:
            try:
                await self._ws.send(pcm_chunk)
            except Exception as e:
                logger.error(f"[AssemblyAI STT] Error sending audio chunk: {e}")

    async def _recv_loop(self):
        """Processes real-time server messages from AssemblyAI."""
        try:
            async for raw in self._ws:
                try:
                    data = json.loads(raw)
                except Exception:
                    continue

                msg_type = data.get("type")

                if msg_type == "SpeechStarted":
                    if self.on_speech_started:
                        self.on_speech_started()

                elif msg_type == "Turn":
                    transcript = data.get("transcript", "")
                    end_of_turn = data.get("end_of_turn", False)

                    if transcript:
                        # Check for duress trigger
                        if not self._duress_tripped and self.duress_phrase:
                            if self.duress_phrase in transcript.lower():
                                self._duress_tripped = True
                                logger.warning(
                                    f"[AssemblyAI STT] DURESS TRIGGER DETECTED: '{self.duress_phrase}' in transcript: '{transcript}'"
                                )
                                if self.on_duress:
                                    self.on_duress(self.duress_phrase, transcript)

                        if end_of_turn:
                            self._accumulated_transcript.append(transcript)

                        if self.on_turn:
                            self.on_turn(transcript, end_of_turn, data)

                elif msg_type == "Termination":
                    logger.info("[AssemblyAI STT] Session gracefully terminated by server.")
                    break

        except websockets.ConnectionClosed as cc:
            logger.info(f"[AssemblyAI STT] WebSocket connection closed: {cc.code} ({cc.reason})")
        except Exception as e:
            logger.error(f"[AssemblyAI STT] Error in recv loop: {e}")
        finally:
            self._running = False

    async def _simulate_audio_tick(self):
        """High-fidelity simulation for offline/demo scenarios."""
        # Simulated distress script
        turns = [
            ("Hello? Can someone hear me?", True),
            ("Someone has been following me from the supermarket...", True),
            ("Please stay away from me, don't come closer...", False),
            ("Please, I don't want any trouble, just let me order iced coffee...", True),
            ("He has a knife! Help! Someone call the police!", True),
        ]
        if not hasattr(self, "_mock_step"):
            self._mock_step = 0
            self._mock_counter = 0

        self._mock_counter += 1
        # Emit a simulated turn every ~6 chunks
        if self._mock_counter % 6 == 0 and self._mock_step < len(turns):
            text, is_final = turns[self._mock_step]
            self._mock_step += 1

            if self.on_speech_started:
                self.on_speech_started()

            if not self._duress_tripped and self.duress_phrase in text.lower():
                self._duress_tripped = True
                logger.warning(
                    f"[Mock STT] DURESS TRIGGER DETECTED: '{self.duress_phrase}' in transcript!"
                )
                if self.on_duress:
                    self.on_duress(self.duress_phrase, text)

            if is_final:
                self._accumulated_transcript.append(text)

            if self.on_turn:
                self.on_turn(
                    text,
                    is_final,
                    {
                        "type": "Turn",
                        "transcript": text,
                        "end_of_turn": is_final,
                        "utterance": text if is_final else "",
                    },
                )

    def get_full_transcript(self) -> str:
        """Returns the full accumulated transcript of the session."""
        return " ".join(self._accumulated_transcript)

    async def close(self):
        """
        Gracefully terminates session.
        MANDATORY: Sends {'type': 'Terminate'} to avoid 3-hour billing cap!
        """
        self._running = False
        if self._ws:
            try:
                logger.info("[AssemblyAI STT] Sending explicit 'Terminate' frame to AssemblyAI...")
                await self._ws.send(json.dumps({"type": "Terminate"}))
                await asyncio.sleep(0.2)
                await self._ws.close()
            except Exception as e:
                logger.debug(f"[AssemblyAI STT] Close exception: {e}")
            finally:
                self._ws = None

        if self._recv_task and not self._recv_task.done():
            self._recv_task.cancel()
        logger.info("[AssemblyAI STT] Client disconnected cleanly.")


# Standalone self-test
async def _test_streaming_client():
    print("\n--- Testing AssemblyAIStreamingClient ---")
    events = []

    def on_turn(text, is_final, raw):
        tag = "FINAL" if is_final else "partial"
        print(f"[{tag}] {text}")
        events.append((text, is_final))

    def on_duress(phrase, matched_text):
        print(f"\n[!] [DURESS ALERT] Trigger '{phrase}' caught in: '{matched_text}'!\n")

    client = AssemblyAIStreamingClient(
        duress_phrase="order iced coffee",
        on_turn=on_turn,
        on_duress=on_duress,
    )
    connected = await client.connect()
    print(f"Connected: {connected}, Mock Mode: {client.use_mock}")

    # Feed dummy PCM frames (simulating 16kHz audio: 16000 * 2 bytes/sec = 32000 bytes/sec)
    dummy_chunk = b"\x00\x00" * 1600  # 100ms chunk
    for _ in range(32):
        await client.send_audio(dummy_chunk)
        await asyncio.sleep(0.05)

    print("\nAccumulated Transcript:\n", client.get_full_transcript())
    await client.close()
    print("--- Streaming Test Complete ---\n")


if __name__ == "__main__":
    asyncio.run(_test_streaming_client())
