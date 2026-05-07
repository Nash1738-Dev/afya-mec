from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import hash_pin, verify_pin, create_access_token, decode_token
from pydantic import BaseModel
from typing import Optional
import json, os
from datetime import datetime

router = APIRouter()
security = HTTPBearer(auto_error=False)

# File-based user store (same as frontend localStorage equivalent)
USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "users.json")
FAILED_ATTEMPTS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "failed_attempts.json")

def load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    # Default admin — PIN will be hashed on first run
    default = [{
        "id": "1",
        "name": "Admin",
        "pin_hash": hash_pin("1234"),
        "role": "admin",
        "status": "approved",
        "facility": "",
        "county": "",
        "sub_county": "",
        "cadre": "",
        "phone": "",
        "created_at": datetime.utcnow().isoformat()
    }]
    save_users(default)
    return default

def save_users(users):
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        print(f"Error saving users: {e}")

def load_failed_attempts():
    if os.path.exists(FAILED_ATTEMPTS_FILE):
        try:
            with open(FAILED_ATTEMPTS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_failed_attempts(attempts):
    try:
        with open(FAILED_ATTEMPTS_FILE, 'w') as f:
            json.dump(attempts, f)
    except:
        pass

def is_locked_out(name: str) -> tuple[bool, int]:
    """Returns (is_locked, minutes_remaining)"""
    attempts = load_failed_attempts()
    key = name.lower()
    if key not in attempts:
        return False, 0
    data = attempts[key]
    if data.get("count", 0) < 5:
        return False, 0
    locked_until = datetime.fromisoformat(data.get("locked_until", "2000-01-01"))
    if datetime.utcnow() < locked_until:
        remaining = int((locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        return True, remaining
    # Lock expired — reset
    del attempts[key]
    save_failed_attempts(attempts)
    return False, 0

def record_failed_attempt(name: str):
    attempts = load_failed_attempts()
    key = name.lower()
    if key not in attempts:
        attempts[key] = {"count": 0}
    attempts[key]["count"] = attempts[key].get("count", 0) + 1
    attempts[key]["last_attempt"] = datetime.utcnow().isoformat()
    if attempts[key]["count"] >= 5:
        from datetime import timedelta
        attempts[key]["locked_until"] = (datetime.utcnow() + timedelta(minutes=15)).isoformat()
    save_failed_attempts(attempts)

def clear_failed_attempts(name: str):
    attempts = load_failed_attempts()
    key = name.lower()
    if key in attempts:
        del attempts[key]
        save_failed_attempts(attempts)

class LoginRequest(BaseModel):
    name: str
    pin: str

class RegisterRequest(BaseModel):
    name: str
    pin: str
    facility: Optional[str] = ""
    sub_county: Optional[str] = ""
    county: Optional[str] = ""
    cadre: Optional[str] = ""
    phone: Optional[str] = ""

class ApproveRequest(BaseModel):
    user_id: str
    action: str  # 'approve' or 'reject'

@router.post("/login")
def login(data: LoginRequest):
    name = data.name.strip()
    pin = data.pin.strip()

    if not name or not pin:
        raise HTTPException(status_code=400, detail="Name and PIN are required")

    # Check lockout
    locked, minutes = is_locked_out(name)
    if locked:
        raise HTTPException(
            status_code=429,
            detail=f"Account locked due to too many failed attempts. Try again in {minutes} minute(s)."
        )

    users = load_users()
    user = next((u for u in users if u["name"].lower() == name.lower()), None)

    if not user:
        record_failed_attempt(name)
        raise HTTPException(status_code=401, detail="Invalid name or PIN")

    if user.get("status") != "approved":
        raise HTTPException(
            status_code=403,
            detail="Your account is pending approval by your sub-county admin"
        )

    if not verify_pin(pin, user.get("pin_hash", "")):
        record_failed_attempt(name)
        attempts = load_failed_attempts()
        count = attempts.get(name.lower(), {}).get("count", 0)
        remaining = max(0, 5 - count)
        raise HTTPException(
            status_code=401,
            detail=f"Invalid name or PIN. {remaining} attempt(s) remaining before lockout."
        )

    # Success
    clear_failed_attempts(name)
    token = create_access_token({
        "sub": user["id"],
        "name": user["name"],
        "role": user["role"],
        "facility": user.get("facility", ""),
        "county": user.get("county", "")
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "role": user["role"],
            "facility": user.get("facility", ""),
            "county": user.get("county", ""),
            "sub_county": user.get("sub_county", ""),
            "cadre": user.get("cadre", "")
        }
    }

@router.post("/register")
def register(data: RegisterRequest):
    users = load_users()
    pending_file = os.path.join(os.path.dirname(__file__), "..", "..", "pending_users.json")

    # Load pending
    pending = []
    if os.path.exists(pending_file):
        try:
            with open(pending_file, 'r') as f:
                pending = json.load(f)
        except:
            pass

    # Check name not taken
    all_names = [u["name"].lower() for u in users + pending]
    if data.name.strip().lower() in all_names:
        raise HTTPException(status_code=400, detail="A user with this name already exists")

    new_user = {
        "id": str(int(datetime.utcnow().timestamp())),
        "name": data.name.strip(),
        "pin_hash": hash_pin(data.pin),
        "role": "provider",
        "status": "pending",
        "facility": data.facility or "",
        "sub_county": data.sub_county or "",
        "county": data.county or "",
        "cadre": data.cadre or "",
        "phone": data.phone or "",
        "created_at": datetime.utcnow().isoformat()
    }

    pending.append(new_user)
    try:
        with open(pending_file, 'w') as f:
            json.dump(pending, f, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    return {"success": True, "message": "Registration submitted — awaiting admin approval"}

@router.get("/pending")
def get_pending_users(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    pending_file = os.path.join(os.path.dirname(__file__), "..", "..", "pending_users.json")
    if not os.path.exists(pending_file):
        return []
    try:
        with open(pending_file, 'r') as f:
            pending = json.load(f)
        # Don't send pin hashes to frontend
        return [{k: v for k, v in u.items() if k != "pin_hash"} for u in pending]
    except:
        return []

@router.post("/approve")
def approve_user(data: ApproveRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    pending_file = os.path.join(os.path.dirname(__file__), "..", "..", "pending_users.json")
    if not os.path.exists(pending_file):
        raise HTTPException(status_code=404, detail="No pending users")

    with open(pending_file, 'r') as f:
        pending = json.load(f)

    user = next((u for u in pending if u["id"] == data.user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pending = [u for u in pending if u["id"] != data.user_id]
    with open(pending_file, 'w') as f:
        json.dump(pending, f, indent=2)

    if data.action == "approve":
        users = load_users()
        users.append({**user, "status": "approved"})
        save_users(users)
        return {"success": True, "message": f"{user['name']} approved"}
    else:
        return {"success": True, "message": f"{user['name']} rejected"}

@router.post("/change-pin")
def change_pin(
    data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    users = load_users()
    user = next((u for u in users if u["id"] == payload.get("sub")), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_pin = data.get("old_pin", "")
    new_pin = data.get("new_pin", "")

    if not verify_pin(old_pin, user.get("pin_hash", "")):
        raise HTTPException(status_code=401, detail="Current PIN is incorrect")

    if len(new_pin) < 4:
        raise HTTPException(status_code=400, detail="New PIN must be at least 4 digits")

    user["pin_hash"] = hash_pin(new_pin)
    save_users(users)
    return {"success": True, "message": "PIN changed successfully"}

@router.get("/me")
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {
        "id": payload.get("sub"),
        "name": payload.get("name"),
        "role": payload.get("role"),
        "facility": payload.get("facility", ""),
        "county": payload.get("county", "")
    }

@router.get("/users")
def get_all_users(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = load_users()
    return [{k: v for k, v in u.items() if k != "pin_hash"} for u in users]

class FeedbackData(BaseModel):
    to: str = ""
    subject: str
    body: str
    from_name: Optional[str] = ""
    from_facility: Optional[str] = ""
    priority: Optional[str] = "normal"
    type: Optional[str] = "feedback"
    reply_to_email: Optional[str] = ""

@router.post("/feedback")
def send_feedback(data: FeedbackData):
    """Receive feedback and send via Brevo email"""
    import json, os
    from datetime import datetime
    from app.core.email import (
        send_email, build_feedback_html,
        build_confirmation_html, SUPPORT_EMAIL
    )

    # Log to file
    feedback_file = os.path.join(
        os.path.dirname(__file__), "..", "..", "feedback_log.json"
    )
    log = []
    if os.path.exists(feedback_file):
        try:
            with open(feedback_file, 'r') as f:
                log = json.load(f)
        except:
            pass

    entry = {
        "id": str(int(datetime.utcnow().timestamp())),
        "subject": data.subject,
        "from_name": data.from_name,
        "from_facility": data.from_facility,
        "priority": data.priority,
        "type": data.type,
        "body": data.body,
        "received_at": datetime.utcnow().isoformat(),
        "email_sent": False
    }

    # Build email data dict
    email_data = {
        "subject": data.subject,
        "body": data.body,
        "from_name": data.from_name,
        "from_facility": data.from_facility,
        "type": data.type,
        "priority": data.priority,
        "reply_to_email": data.reply_to_email or ""
    }

    # Send to support team
    result = send_email(
        to_email=SUPPORT_EMAIL,
        subject=f"[AfyaMEC {data.type.upper()}] {data.subject}",
        text_body=data.body,
        html_body=build_feedback_html(email_data),
        reply_to=data.reply_to_email or None
    )

    entry["email_sent"] = result.get("success", False)
    entry["email_error"] = result.get("error", "")

    # Send confirmation to provider if they provided email
    if data.reply_to_email:
        send_email(
            to_email=data.reply_to_email,
            subject=f"✅ AfyaMEC: We received your {data.type}",
            text_body=f"Dear {data.from_name}, we received your message: {data.subject}. We will respond within 24 hours.",
            html_body=build_confirmation_html(
                data.from_name or "Provider",
                data.subject,
                data.type
            )
        )

    log.insert(0, entry)
    log = log[:200]
    try:
        with open(feedback_file, 'w') as f:
            json.dump(log, f, indent=2)
    except:
        pass

    return {
        "success": True,
        "email_sent": result.get("success", False),
        "message": "Feedback received and email sent" if result.get("success") else "Feedback logged (email failed)"
    }