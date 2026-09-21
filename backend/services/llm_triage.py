"""
AssemblyAI LLM Gateway Emergency Crisis Triage Engine for AegisVoice.
Calls AssemblyAI LLM Gateway (https://llm-gateway.assemblyai.com/v1/chat/completions)
using flagship model claude-sonnet-4-6 to perform rapid structured emergency assessment.
"""

import json
import logging
import os
from pathlib import Path
import re
from typing import Any, Dict, Optional
from dotenv import load_dotenv
import httpx

# Load backend/.env
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

logger = logging.getLogger("aegis.llm_triage")
logging.basicConfig(level=logging.INFO)

LLM_GATEWAY_URL = "https://llm-gateway.assemblyai.com/v1/chat/completions"
PRIMARY_MODEL = "claude-sonnet-4-6"
FALLBACK_MODEL = "gemini-2.5-pro"

SYSTEM_PROMPT = """You are the AegisVoice Autonomous Emergency CAD Triage Analyst.
Your duty is to rapidly analyze audio distress transcripts from active civilian emergency scenarios (e.g. stalkers, assaults, armed robberies, domestic violence, medical trauma) and provide structured intelligence for emergency responders (Police, EMS, Fire) and Computer-Aided Dispatch (CAD) operators.

You MUST return ONLY a valid JSON object (no markdown, no preamble) with the following exact keys:
{
  "threat_level": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "FALSE_ALARM",
  "emergency_type": "<concise incident category, e.g. Active Stalking / Threatened Assault, Armed Robbery, Medical Distress, Domestic Confrontation, False Alarm>",
  "caller_distress_score": <float between 1.0 and 10.0 representing caller panic and physical danger>,
  "weapons_detected": "<description of weapon mentioned like 'knife', 'firearm', or 'none_observed'>",
  "suspect_count": "<inferred number of aggressors or 'unknown'>",
  "recommended_action": "IMMEDIATE_POLICE_DISPATCH" | "DISPATCH_EMS" | "NOTIFY_CONTACTS_STANDBY" | "STAND_DOWN_FALSE_ALARM",
  "tactical_summary": "<1 to 2 clear, urgent sentences summarizing the danger, context, and immediate intervention required>"
}"""


def _clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Cleans markdown fences or surrounding commentary to parse valid JSON."""
    raw_text = raw_text.strip()
    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if match:
        clean = match.group(0)
    else:
        clean = raw_text
    return json.loads(clean)


def _heuristic_fallback_triage(transcript: str, user_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """High-fidelity local fallback if network or API keys are unavailable."""
    text_lower = transcript.lower()
    threat_level = "HIGH"
    weapons = "none_observed"
    action = "IMMEDIATE_POLICE_DISPATCH"
    score = 8.5
    category = "Active Distress / Confrontation"

    if any(w in text_lower for w in ["gun", "shoot", "knife", "blade", "weapon", "cut", "kill"]):
        threat_level = "CRITICAL"
        score = 9.8
        weapons = "deadly_weapon_indicated"
        action = "IMMEDIATE_POLICE_DISPATCH"
        category = "Armed Violent Confrontation"
    elif any(w in text_lower for w in ["following", "stalking", "behind me", "creeping", "shadowing"]):
        threat_level = "CRITICAL"
        score = 9.2
        category = "Active Stalking & Confrontation"
        action = "IMMEDIATE_POLICE_DISPATCH"
    elif any(w in text_lower for w in ["help", "hurt", "attack", "touch me", "leave me alone"]):
        threat_level = "CRITICAL"
        score = 9.0
        category = "Imminent Assault"
        action = "IMMEDIATE_POLICE_DISPATCH"
    elif any(w in text_lower for w in ["chest pain", "can't breathe", "faint", "bleeding", "stroke"]):
        threat_level = "CRITICAL"
        score = 8.9
        category = "Acute Medical Distress"
        action = "DISPATCH_EMS"

    victim_name = user_profile.get("name", "Civilian") if user_profile else "Civilian"

    return {
        "threat_level": threat_level,
        "emergency_type": category,
        "caller_distress_score": score,
        "weapons_detected": weapons,
        "suspect_count": "1 or more aggressors",
        "recommended_action": action,
        "tactical_summary": f"{victim_name} triggered emergency escort beacon. Transcript indicates active danger; immediate intervention recommended.",
        "_source": "heuristic_fallback",
    }


async def triage_distress_transcript(
    transcript: str,
    user_profile: Optional[Dict[str, Any]] = None,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Submits distress transcript to AssemblyAI LLM Gateway (Claude 3.5 Sonnet).
    Returns structured incident triage JSON.
    """
    if not transcript or not transcript.strip():
        return {
            "threat_level": "LOW",
            "emergency_type": "Silent Escort Monitoring",
            "caller_distress_score": 1.0,
            "weapons_detected": "none_observed",
            "suspect_count": "none",
            "recommended_action": "STAND_DOWN_FALSE_ALARM",
            "tactical_summary": "No audio transcript recorded during this interval.",
        }

    key = api_key or os.getenv("ASSEMBLYAI_API_KEY", "")

    # If no key is set, use the heuristic engine immediately
    if not key or key == "your_assemblyai_api_key_here":
        logger.info("[LLM Triage] No valid API key found. Using heuristic triage engine.")
        return _heuristic_fallback_triage(transcript, user_profile)

    user_context = ""
    if user_profile:
        user_context = (
            f"Victim Profile: Name: {user_profile.get('name', 'Unknown')}, "
            f"Medical Notes: {user_profile.get('medical_notes', 'None')}. "
        )

    user_message = f"{user_context}Distress Transcript: \"{transcript}\""

    headers = {
        "Authorization": key,  # Raw API key (no Bearer prefix)
        "Content-Type": "application/json",
    }

    # Attempt primary model (claude-sonnet-4-6), fall back to gemini-2.5-pro
    models_to_try = [PRIMARY_MODEL, FALLBACK_MODEL]

    for model in models_to_try:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            "temperature": 0.1,
            "max_tokens": 1000,
        }

        try:
            logger.info(f"[LLM Triage] Calling AssemblyAI LLM Gateway with model '{model}'...")
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(LLM_GATEWAY_URL, headers=headers, json=payload)

            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = _clean_json_response(content)
                parsed["_model_used"] = model
                parsed["_source"] = "assemblyai_llm_gateway"
                logger.info(
                    f"[LLM Triage] Triage completed successfully via {model}: "
                    f"Threat={parsed.get('threat_level')}, Distress={parsed.get('caller_distress_score')}"
                )
                return parsed
            else:
                logger.warning(
                    f"[LLM Triage] Model {model} returned status {resp.status_code}: {resp.text}"
                )
        except Exception as e:
            logger.warning(f"[LLM Triage] Error calling LLM Gateway with {model}: {e}")

    logger.info("[LLM Triage] Gateway requests unsuccessful; executing heuristic emergency triage.")
    return _heuristic_fallback_triage(transcript, user_profile)


# Standalone self-test
async def _test_triage():
    print("\n--- Testing AssemblyAI LLM Gateway Triage ---")
    sample_transcript = (
        "Someone has been following me down this dark alley. "
        "Please don't hurt me! Put that knife away! Let me order iced coffee! Someone help!"
    )
    user = {
        "name": "Sarah Jenkins",
        "medical_notes": "Asthma, Blood Type O+",
    }

    result = await triage_distress_transcript(sample_transcript, user)
    print("\n[Triage Result]:")
    print(json.dumps(result, indent=2))
    print("\n--- Triage Test Complete ---\n")


if __name__ == "__main__":
    import asyncio
    asyncio.run(_test_triage())
