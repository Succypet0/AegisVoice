"""
AegisVoice TinyDB Persistence Layer
Provides lightweight document storage for users, emergency contacts, and active/historical incidents.
"""

from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from tinydb import Query, TinyDB

DB_DIR = Path(__file__).resolve().parent / "data"
DB_FILE = DB_DIR / "safety_db.json"


def _ensure_db_dir():
    DB_DIR.mkdir(parents=True, exist_ok=True)


def get_db() -> TinyDB:
    _ensure_db_dir()
    return TinyDB(str(DB_FILE))


def seed_default_data_if_empty():
    """Seeds default user Sarah Jenkins and sample incident if database is fresh."""
    db = get_db()
    users_table = db.table("users")
    incidents_table = db.table("incidents")

    if len(users_table) == 0:
        default_user = {
            "user_id": "usr_sarah_01",
            "name": "Sarah Jenkins",
            "phone": "+2348012345678",
            "duress_phrase": "Order iced coffee",
            "medical_notes": "Asthma, Blood Type O+",
            "emergency_contacts": [
                {"name": "Mom (Helen)", "phone": "+2348033334455", "priority": 1},
                {"name": "Mark (Brother)", "phone": "+2348055556677", "priority": 2},
                {"name": "Elena (Roommate)", "phone": "+2348077778899", "priority": 3},
                {"name": "David (Partner)", "phone": "+2348099990011", "priority": 4},
                {"name": "Neighborhood Security", "phone": "+2348022223344", "priority": 5},
            ],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        users_table.insert(default_user)

    if len(incidents_table) == 0:
        sample_incident = {
            "incident_id": "inc_20260915_001",
            "user_id": "usr_sarah_01",
            "timestamp": "2026-09-15T15:20:10Z",
            "trigger_type": "DURESS_PHRASE",
            "status": "RESOLVED",
            "gps": {
                "latitude": 6.524379,
                "longitude": 3.379206,
                "accuracy_meters": 4.5,
            },
            "transcript_log": "Someone is following me... please don't hurt me, just let me order iced coffee...",
            "triage_analysis": {
                "threat_level": "CRITICAL",
                "emergency_type": "Active Stalking / Threatened Assault",
                "caller_distress_score": 9.4,
                "weapons_detected": "none_observed",
                "recommended_action": "IMMEDIATE_POLICE_DISPATCH",
                "tactical_summary": "Victim cornered, aggressor approaching, immediate intervention required.",
            },
            "operator_actions": {
                "reviewed_by": "Operator_Marcus",
                "action_taken": "DISPATCH_CONFIRMED",
                "contacts_notified": True,
                "dispatched_at": "2026-09-15T15:20:45Z",
            },
        }
        incidents_table.insert(sample_incident)
    db.close()


import uuid


# User Operations
def create_user(user_data: Dict[str, Any]) -> str:
    """Creates and persists a new user profile in TinyDB."""
    db = get_db()
    users_table = db.table("users")
    user_id = user_data.get("user_id") or f"usr_{uuid.uuid4().hex[:8]}"
    user_data["user_id"] = user_id
    if "created_at" not in user_data:
        user_data["created_at"] = datetime.now(timezone.utc).isoformat()
    if "emergency_contacts" not in user_data:
        user_data["emergency_contacts"] = []
    users_table.insert(user_data)
    db.close()
    return user_id


def list_users() -> List[Dict[str, Any]]:
    """Retrieves all registered user profiles."""
    db = get_db()
    users_table = db.table("users")
    users = users_table.all()
    db.close()
    return users


def get_user(user_id: str = "usr_sarah_01") -> Optional[Dict[str, Any]]:
    db = get_db()
    users_table = db.table("users")
    user_query = Query()
    result = users_table.get(user_query.user_id == user_id)
    db.close()
    return result


def update_user(user_id: str, updates: Dict[str, Any]) -> bool:
    db = get_db()
    users_table = db.table("users")
    user_query = Query()
    updated_ids = users_table.update(updates, user_query.user_id == user_id)
    db.close()
    return len(updated_ids) > 0


def get_emergency_contacts(user_id: str = "usr_sarah_01") -> List[Dict[str, Any]]:
    user = get_user(user_id)
    if user and "emergency_contacts" in user:
        return user["emergency_contacts"]
    return []


def update_emergency_contacts(user_id: str, contacts: List[Dict[str, Any]]) -> bool:
    return update_user(user_id, {"emergency_contacts": contacts})


# Incident Operations
def create_incident(incident_data: Dict[str, Any]) -> str:
    db = get_db()
    incidents_table = db.table("incidents")

    incident_id = incident_data.get(
        "incident_id",
        f"inc_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    )
    incident_data["incident_id"] = incident_id
    incident_data["id"] = incident_id  # Frontend expects `id`
    if "timestamp" not in incident_data:
        incident_data["timestamp"] = datetime.now(timezone.utc).isoformat()
    if "status" not in incident_data:
        incident_data["status"] = "ACTIVE_TRIAGE"

    # Auto-enrich with victim metadata
    user_id = incident_data.get("user_id")
    if user_id:
        users_table = db.table("users")
        user_query = Query()
        user = users_table.get(user_query.user_id == user_id)
        if user:
            if "victim_name" not in incident_data:
                incident_data["victim_name"] = user.get("name", "Civilian Protected")
            if "victim_phone" not in incident_data:
                incident_data["victim_phone"] = user.get("phone", "")
            if "medical_notes" not in incident_data:
                incident_data["medical_notes"] = user.get("medical_notes", "")
            if "emergency_contacts" not in incident_data:
                incident_data["emergency_contacts"] = user.get("emergency_contacts", [])

    incidents_table.insert(incident_data)
    db.close()
    return incident_id


def get_incident(incident_id: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    incidents_table = db.table("incidents")
    incident_query = Query()
    result = incidents_table.get(
        (incident_query.incident_id == incident_id) | (incident_query.id == incident_id)
    )
    db.close()
    return result


def _enrich_incident(inc: Dict[str, Any], users_map: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    inc["id"] = inc.get("incident_id") or inc.get("id")
    triage = inc.get("triage_analysis") or {}
    if "threat_level" not in inc:
        inc["threat_level"] = triage.get(
            "threat_level",
            "MONITORING" if inc.get("status") == "MONITORING" else "EVALUATING"
        )
    user_id = inc.get("user_id")
    if user_id and user_id in users_map:
        user = users_map[user_id]
        if not inc.get("victim_name"):
            inc["victim_name"] = user.get("name", "Civilian Protected")
        if not inc.get("victim_phone"):
            inc["victim_phone"] = user.get("phone", "")
        if not inc.get("medical_notes"):
            inc["medical_notes"] = user.get("medical_notes", "")
    elif not inc.get("victim_name"):
        inc["victim_name"] = "Registered Civilian"
    return inc


def get_all_incidents() -> List[Dict[str, Any]]:
    db = get_db()
    incidents_table = db.table("incidents")
    users_table = db.table("users")
    users_map = {u.get("user_id"): u for u in users_table.all() if u.get("user_id")}
    all_incidents = incidents_table.all()
    enriched = [_enrich_incident(dict(inc), users_map) for inc in all_incidents]
    db.close()
    # Sort by timestamp descending
    return sorted(enriched, key=lambda x: x.get("timestamp", ""), reverse=True)


def get_active_incidents() -> List[Dict[str, Any]]:
    db = get_db()
    incidents_table = db.table("incidents")
    users_table = db.table("users")
    users_map = {u.get("user_id"): u for u in users_table.all() if u.get("user_id")}
    incident_query = Query()
    active = incidents_table.search(
        (incident_query.status == "ACTIVE_TRIAGE") |
        (incident_query.status == "ACTIVE_DISTRESS") |
        (incident_query.status == "DISPATCHED")
    )
    enriched = [_enrich_incident(dict(inc), users_map) for inc in active]
    db.close()
    return sorted(enriched, key=lambda x: x.get("timestamp", ""), reverse=True)


def update_incident_transcript(incident_id: str, text: str) -> bool:
    db = get_db()
    incidents_table = db.table("incidents")
    incident_query = Query()
    updated_ids = incidents_table.update(
        {"transcript_log": text},
        (incident_query.incident_id == incident_id) | (incident_query.id == incident_id)
    )
    db.close()
    return len(updated_ids) > 0


def update_incident_triage(incident_id: str, triage_data: Dict[str, Any]) -> bool:
    db = get_db()
    incidents_table = db.table("incidents")
    incident_query = Query()
    updated_ids = incidents_table.update(
        {"triage_analysis": triage_data},
        (incident_query.incident_id == incident_id) | (incident_query.id == incident_id)
    )
    db.close()
    return len(updated_ids) > 0


def update_incident_gps(incident_id: str, gps_data: Dict[str, Any]) -> bool:
    db = get_db()
    incidents_table = db.table("incidents")
    incident_query = Query()
    updated_ids = incidents_table.update(
        {"gps": gps_data},
        (incident_query.incident_id == incident_id) | (incident_query.id == incident_id)
    )
    db.close()
    return len(updated_ids) > 0


def record_operator_action(
    incident_id: str,
    action_taken: str,
    reviewed_by: str = "Operator",
    contacts_notified: bool = False,
    new_status: Optional[str] = None
) -> bool:
    db = get_db()
    incidents_table = db.table("incidents")
    incident_query = Query()

    update_payload: Dict[str, Any] = {
        "operator_actions": {
            "reviewed_by": reviewed_by,
            "action_taken": action_taken,
            "contacts_notified": contacts_notified,
            "dispatched_at": datetime.now(timezone.utc).isoformat(),
        }
    }
    if new_status:
        update_payload["status"] = new_status
    elif action_taken == "DISPATCH_CONFIRMED":
        update_payload["status"] = "DISPATCHED"
    elif action_taken == "FALSE_ALARM":
        update_payload["status"] = "FALSE_ALARM"

    updated_ids = incidents_table.update(
        update_payload,
        (incident_query.incident_id == incident_id) | (incident_query.id == incident_id)
    )
    db.close()
    return len(updated_ids) > 0


# Self-test when executed directly
if __name__ == "__main__":
    seed_default_data_if_empty()
    u = get_user("usr_sarah_01")
    print(f"[TinyDB Test] Found user: {u['name']}, Phone: {u['phone']}, Contacts: {len(u['emergency_contacts'])}")
    incs = get_all_incidents()
    print(f"[TinyDB Test] Found {len(incs)} total incident(s). Latest ID: {incs[0]['incident_id']}")
