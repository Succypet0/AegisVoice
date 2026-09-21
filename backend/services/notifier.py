"""
Emergency SMS and Alert Notification Relay for AegisVoice.
Supports:
1. Termii API (for Nigeria networks: MTN, Airtel, Glo, 9mobile)
2. Twilio API (international fallback)
3. High-fidelity Simulation Logger (for zero-cost hackathon demos and offline testing)
"""

from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
import httpx

# Load backend/.env
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

logger = logging.getLogger("aegis.notifier")
logging.basicConfig(level=logging.INFO)

TERMII_SEND_URL = "https://api.ng.termii.com/api/sms/send"


def _normalize_nigerian_phone(phone: str) -> str:
    """Normalizes phone numbers to Termii format (e.g. 2348012345678)."""
    digits = "".join(ch for ch in phone if ch.isdigit())
    if digits.startswith("0") and len(digits) == 11:
        return "234" + digits[1:]
    if digits.startswith("234"):
        return digits
    return digits


async def _send_termii_sms(to_phone: str, message: str, api_key: str, sender_id: str = "N-Alert") -> Dict[str, Any]:
    """Sends real SMS via Termii API to Nigerian mobile carriers."""
    norm_phone = _normalize_nigerian_phone(to_phone)
    payload = {
        "to": norm_phone,
        "from": sender_id,
        "sms": message,
        "type": "plain",
        "channel": "generic",
        "api_key": api_key,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(TERMII_SEND_URL, json=payload)
        return {
            "status": "success" if resp.status_code == 200 else "error",
            "provider": "termii",
            "code": resp.status_code,
            "response": resp.text,
        }
    except Exception as e:
        logger.error(f"[Notifier] Termii send error to {norm_phone}: {e}")
        return {"status": "error", "provider": "termii", "error": str(e)}


async def _send_twilio_sms(to_phone: str, message: str) -> Dict[str, Any]:
    """Sends SMS via Twilio API."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_PHONE_NUMBER")

    if not (account_sid and auth_token and from_number):
        return {"status": "skipped", "reason": "twilio_credentials_missing"}

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    data = {"To": to_phone, "From": from_number, "Body": message}
    try:
        async with httpx.AsyncClient(auth=(account_sid, auth_token), timeout=10.0) as client:
            resp = await client.post(url, data=data)
        return {
            "status": "success" if resp.status_code in [200, 201] else "error",
            "provider": "twilio",
            "code": resp.status_code,
            "response": resp.text,
        }
    except Exception as e:
        logger.error(f"[Notifier] Twilio send error to {to_phone}: {e}")
        return {"status": "error", "provider": "twilio", "error": str(e)}


async def broadcast_emergency_sms(
    user_profile: Dict[str, Any],
    incident_id: str,
    gps_coords: Optional[Dict[str, Any]] = None,
    custom_note: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Broadcasts emergency distress SMS alerts to all linked emergency contacts.
    Falls back gracefully to simulated carrier dispatch if live SMS keys are unconfigured.
    """
    victim_name = user_profile.get("name", "Aegis User")
    contacts = user_profile.get("emergency_contacts", [])

    lat = gps_coords.get("latitude", 6.524379) if gps_coords else 6.524379
    lon = gps_coords.get("longitude", 3.379206) if gps_coords else 3.379206
    maps_link = f"https://maps.google.com/?q={lat},{lon}"

    time_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")

    sms_body = (
        f"[AEGIS EMERGENCY ALERT]\n"
        f"{victim_name} has triggered active distress protocol at {time_str}.\n"
        f"Location: {maps_link}\n"
        f"CAD dispatchers alerted. Audio monitoring active. Contact 112/authorities if needed."
    )
    if custom_note:
        sms_body += f"\nNote: {custom_note}"

    termii_key = os.getenv("TERMII_API_KEY", "").strip()
    termii_sender = os.getenv("TERMII_SENDER_ID", "N-Alert").strip()
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()

    delivery_results: List[Dict[str, Any]] = []

    print(f"\n================ [EMERGENCY SMS BROADCAST START] ================")
    print(f"Incident ID: {incident_id}")
    print(f"Victim: {victim_name}")
    print(f"GPS Coordinates: ({lat}, {lon})")
    print(f"Message Body:\n{sms_body}")
    print(f"Recipients ({len(contacts)} contacts):")

    for contact in contacts:
        name = contact.get("name", "Contact")
        phone = contact.get("phone", "")
        priority = contact.get("priority", 0)

        result_item = {
            "name": name,
            "phone": phone,
            "priority": priority,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        if termii_key:
            logger.info(f"[Notifier] Routing SMS to {name} ({phone}) via Termii...")
            res = await _send_termii_sms(phone, sms_body, termii_key, termii_sender)
            result_item["delivery"] = res
            print(f"  [+] Priority {priority}: {name} ({phone}) -> Termii Status: {res.get('status')}")
        elif twilio_sid:
            logger.info(f"[Notifier] Routing SMS to {name} ({phone}) via Twilio...")
            res = await _send_twilio_sms(phone, sms_body)
            result_item["delivery"] = res
            print(f"  [+] Priority {priority}: {name} ({phone}) -> Twilio Status: {res.get('status')}")
        else:
            # High-fidelity Simulation Logger
            result_item["delivery"] = {
                "status": "simulated_sent",
                "provider": "aegis_carrier_simulator",
                "channel": "cellular_sms",
                "delivered": True,
            }
            print(f"  [SIMULATED SMS] Priority {priority}: {name} ({phone}) -> Delivered (MTN/Airtel/Glo Gateway)")

        delivery_results.append(result_item)

    print(f"================ [EMERGENCY SMS BROADCAST END] ==================\n")

    return {
        "incident_id": incident_id,
        "victim_name": victim_name,
        "sms_body": sms_body,
        "contacts_count": len(contacts),
        "results": delivery_results,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Standalone self-test
async def _test_notifier():
    print("\n--- Testing Emergency Notification Relay ---")
    mock_user = {
        "name": "Sarah Jenkins",
        "emergency_contacts": [
            {"name": "Mom (Helen)", "phone": "+2348033334455", "priority": 1},
            {"name": "Mark (Brother)", "phone": "+2348055556677", "priority": 2},
            {"name": "Elena (Roommate)", "phone": "+2348077778899", "priority": 3},
            {"name": "David (Partner)", "phone": "+2348099990011", "priority": 4},
            {"name": "Neighborhood Security", "phone": "+2348022223344", "priority": 5},
        ],
    }
    mock_gps = {"latitude": 6.524379, "longitude": 3.379206}
    res = await broadcast_emergency_sms(mock_user, "inc_test_001", mock_gps)
    print(f"Broadcast completed for {res['contacts_count']} contacts.")
    print("--- Notifier Test Complete ---\n")


if __name__ == "__main__":
    import asyncio
    asyncio.run(_test_notifier())
