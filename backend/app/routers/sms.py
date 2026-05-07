from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.client import Client
from app.models.visit import Visit
from app.core.sms import send_sms, build_reminder_message, build_overdue_message
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import os

router = APIRouter()


class SMSRequest(BaseModel):
    client_id: str
    message_type: str  # 'reminder', 'overdue', 'custom'
    custom_message: Optional[str] = None


class BulkSMSRequest(BaseModel):
    message_type: str  # 'reminder', 'overdue'
    days_before: Optional[int] = 7  # Send reminder X days before return date


@router.post("/send")
def send_single_sms(data: SMSRequest, db: Session = Depends(get_db)):
    """Send SMS to a single client"""
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        return {"success": False, "error": "Client not found"}

    if not client.telephone:
        return {"success": False, "error": "Client has no phone number"}

    # Get latest visit
    visit = db.query(Visit).filter(
        Visit.client_id == client.id
    ).order_by(Visit.visit_date.desc()).first()

    facility_name = os.getenv("FACILITY_NAME", "")

    if data.message_type == "reminder" and visit and visit.return_date:
        message = build_reminder_message(
            client.first_name,
            visit.primary_method or "",
            visit.return_date,
            facility_name
        )
    elif data.message_type == "overdue":
        message = build_overdue_message(
            client.first_name,
            visit.primary_method if visit else "",
            facility_name
        )
    elif data.message_type == "custom" and data.custom_message:
        message = data.custom_message
    else:
        return {"success": False, "error": "Invalid message type or missing data"}

    result = send_sms(client.telephone, message)
    return {**result, "client_name": f"{client.first_name} {client.last_name}"}


@router.post("/send-bulk")
def send_bulk_reminders(data: BulkSMSRequest, db: Session = Depends(get_db)):
    """Send reminders to all eligible clients"""
    facility_name = os.getenv("FACILITY_NAME", "")
    results = []
    sent = 0
    failed = 0
    skipped = 0

    if data.message_type == "reminder":
        # Find clients with return date within X days
        target_date = datetime.utcnow() + timedelta(days=data.days_before)
        date_from = target_date.replace(hour=0, minute=0, second=0)
        date_to = target_date.replace(hour=23, minute=59, second=59)

        visits = db.query(Visit).filter(
            Visit.return_date >= date_from,
            Visit.return_date <= date_to
        ).all()

        for visit in visits:
            client = db.query(Client).filter(
                Client.id == visit.client_id
            ).first()
            if not client or not client.telephone:
                skipped += 1
                continue

            message = build_reminder_message(
                client.first_name,
                visit.primary_method or "",
                visit.return_date,
                facility_name
            )
            result = send_sms(client.telephone, message)
            if result["success"]:
                sent += 1
            else:
                failed += 1
            results.append({
                "client": f"{client.first_name} {client.last_name}",
                "phone": client.telephone,
                **result
            })

    elif data.message_type == "overdue":
        # Find clients overdue (return date passed and not revisited)
        cutoff = datetime.utcnow() - timedelta(weeks=16)
        visits = db.query(Visit).filter(
            Visit.visit_date <= cutoff
        ).all()

        seen_clients = set()
        for visit in visits:
            if str(visit.client_id) in seen_clients:
                continue
            seen_clients.add(str(visit.client_id))

            client = db.query(Client).filter(
                Client.id == visit.client_id
            ).first()
            if not client or not client.telephone:
                skipped += 1
                continue

            message = build_overdue_message(
                client.first_name,
                visit.primary_method or "",
                facility_name
            )
            result = send_sms(client.telephone, message)
            if result["success"]:
                sent += 1
            else:
                failed += 1
            results.append({
                "client": f"{client.first_name} {client.last_name}",
                "phone": client.telephone,
                **result
            })

    return {
        "success": True,
        "sent": sent,
        "failed": failed,
        "skipped": skipped,
        "results": results
    }


@router.get("/status")
def get_sms_status():
    """Check SMS service status"""
    sms_enabled = os.getenv("SMS_ENABLED", "false").lower() == "true"
    at_username = os.getenv("AT_USERNAME", "sandbox")
    at_key = os.getenv("AT_API_KEY", "")

    return {
        "enabled": sms_enabled,
        "mode": "live" if (sms_enabled and at_username != "sandbox") else "sandbox",
        "username": at_username,
        "api_key_configured": bool(at_key),
        "message": "SMS active" if sms_enabled else "SMS in sandbox mode — messages logged only"
    }


@router.get("/preview/{client_id}")
def preview_sms(client_id: str, message_type: str = "reminder", db: Session = Depends(get_db)):
    """Preview SMS message for a client without sending"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        return {"success": False, "error": "Client not found"}

    visit = db.query(Visit).filter(
        Visit.client_id == client.id
    ).order_by(Visit.visit_date.desc()).first()

    facility_name = os.getenv("FACILITY_NAME", "")

    if message_type == "reminder" and visit and visit.return_date:
        message = build_reminder_message(
            client.first_name, visit.primary_method or "",
            visit.return_date, facility_name
        )
    else:
        message = build_overdue_message(
            client.first_name,
            visit.primary_method if visit else "",
            facility_name
        )

    return {
        "client": f"{client.first_name} {client.last_name}",
        "phone": client.telephone or "No phone",
        "message": message,
        "char_count": len(message),
        "sms_count": (len(message) // 160) + 1
    }

@router.post("/callback")
async def sms_callback(request: Request):
    """Receive incoming SMS from Africa's Talking"""
    try:
        body = await request.form()
        from_number = body.get("from", "")
        to_number = body.get("to", "")
        text = body.get("text", "").strip().upper()
        message_id = body.get("id", "")

        # Log incoming message
        import json, os
        log_file = os.path.join(os.path.dirname(__file__), "..", "..", "sms_inbox.json")
        inbox = []
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    inbox = json.load(f)
            except:
                pass

        entry = {
            "id": message_id,
            "from": from_number,
            "to": to_number,
            "text": text,
            "received_at": datetime.utcnow().isoformat(),
            "processed": False
        }

        # Auto-responses
        response_text = None

        if text in ("STOP", "UNSUBSCRIBE", "OPT OUT", "OPTOUT"):
            entry["action"] = "opted_out"
            response_text = "You have been unsubscribed from AfyaMEC reminders. Reply START to re-subscribe."
        elif text in ("START", "SUBSCRIBE", "YES"):
            entry["action"] = "opted_in"
            response_text = "You are now subscribed to AfyaMEC appointment reminders. Reply STOP to unsubscribe."
        elif text in ("HELP", "INFO"):
            response_text = "AfyaMEC FP Reminders. Reply STOP to unsubscribe. For help call your facility."
        elif text.startswith("DATE"):
            response_text = "Please visit your health facility to check your next appointment date."
        else:
            entry["action"] = "received"

        entry["auto_response"] = response_text
        inbox.insert(0, entry)
        inbox = inbox[:500]  # Keep last 500 messages

        with open(log_file, 'w') as f:
            json.dump(inbox, f, indent=2)

        # Send auto-response if needed
        if response_text and SMS_ENABLED:
            try:
                sms = africastalking.SMS
                sms.send(response_text, [from_number], SENDER_ID)
            except Exception as e:
                print(f"Auto-response failed: {e}")

        return {"status": "processed"}
    except Exception as e:
        print(f"SMS callback error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/inbox")
def get_sms_inbox():
    """Get received SMS messages"""
    import json, os
    log_file = os.path.join(os.path.dirname(__file__), "..", "..", "sms_inbox.json")
    if not os.path.exists(log_file):
        return []
    try:
        with open(log_file, 'r') as f:
            return json.load(f)
    except:
        return []


@router.post("/send-bulk")
def send_bulk_reminders(data: dict, db: Session = Depends(get_db)):
    """Send reminders to all overdue clients"""
    from app.models.client import Client
    from app.models.visit import Visit
    from sqlalchemy import func
    from datetime import timedelta

    weeks_overdue = data.get("weeks_overdue", 16)
    cutoff_date = datetime.utcnow() - timedelta(weeks=weeks_overdue)

    # Find overdue clients with phone numbers
    clients = db.query(Client).filter(
        Client.telephone.isnot(None),
        Client.telephone != ""
    ).all()

    sent = 0
    failed = 0
    skipped = 0
    results = []

    facility_name = data.get("facility_name", "your health facility")

    for client in clients:
        # Get last visit
        last_visit = db.query(Visit).filter(
            Visit.client_id == client.id
        ).order_by(Visit.visit_date.desc()).first()

        if not last_visit:
            skipped += 1
            continue

        if last_visit.visit_date > cutoff_date:
            skipped += 1
            continue

        # Format phone
        phone = client.telephone.replace(" ", "").replace("-", "")
        if phone.startswith("0"):
            phone = "+254" + phone[1:]
        elif not phone.startswith("+"):
            phone = "+254" + phone

        method = last_visit.primary_method or "family planning"
        weeks_since = int((datetime.utcnow() - last_visit.visit_date).days / 7)

        message = (
            f"Dear {client.first_name}, this is a reminder from {facility_name}. "
            f"You are due for your {method} appointment "
            f"({weeks_since} weeks since last visit). "
            f"Please visit us soon. Reply STOP to opt out."
        )

        if SMS_ENABLED:
            try:
                sms = africastalking.SMS
                response = sms.send(message, [phone], SENDER_ID)
                recipients = response.get("SMSMessageData", {}).get("Recipients", [])
                if recipients and recipients[0].get("status") == "Success":
                    sent += 1
                    results.append({"name": f"{client.first_name} {client.last_name}", "status": "sent", "phone": phone})
                else:
                    failed += 1
                    results.append({"name": f"{client.first_name} {client.last_name}", "status": "failed"})
            except Exception as e:
                failed += 1
                results.append({"name": f"{client.first_name} {client.last_name}", "status": "error", "error": str(e)})
        else:
            sent += 1
            results.append({"name": f"{client.first_name} {client.last_name}", "status": "sandbox", "message": message})

    return {
        "success": True,
        "sent": sent,
        "failed": failed,
        "skipped": skipped,
        "total_clients": len(clients),
        "results": results,
        "sandbox": not SMS_ENABLED
    }


@router.post("/schedule-si-reminder")
def schedule_si_reminder(data: dict, db: Session = Depends(get_db)):
    """Schedule DMPA-SC SI reminders for a client"""
    import json, os
    from datetime import datetime, timedelta

    reminders_file = os.path.join(
        os.path.dirname(__file__), "..", "..", "si_reminders.json"
    )
    reminders = []
    if os.path.exists(reminders_file):
        try:
            with open(reminders_file, 'r') as f:
                reminders = json.load(f)
        except:
            pass

    client_id = data.get("client_id")
    client_name = data.get("client_name")
    phone = data.get("phone")
    doses = int(data.get("doses", 1))
    first_injection_date = data.get("first_injection_date")  # ISO string
    facility_name = data.get("facility_name", "your health facility")

    if not first_injection_date:
        return {"success": False, "error": "First injection date required"}

    base_date = datetime.fromisoformat(first_injection_date)
    scheduled = []

    # Schedule reminder for each dose (every 13 weeks)
    for dose_num in range(1, doses + 1):
        injection_date = base_date + timedelta(weeks=13 * (dose_num - 1))
        reminder_date = injection_date - timedelta(days=3)  # 3 days before

        reminder = {
            "id": f"{client_id}_{dose_num}_{int(datetime.utcnow().timestamp())}",
            "client_id": client_id,
            "client_name": client_name,
            "phone": phone,
            "dose_number": dose_num,
            "total_doses": doses,
            "injection_date": injection_date.isoformat(),
            "reminder_date": reminder_date.isoformat(),
            "facility_name": facility_name,
            "sent": False,
            "created_at": datetime.utcnow().isoformat()
        }
        reminders.append(reminder)
        scheduled.append({
            "dose": dose_num,
            "injection_date": injection_date.strftime("%d %b %Y"),
            "reminder_date": reminder_date.strftime("%d %b %Y")
        })

    # Remove old reminders for same client
    reminders = [r for r in reminders
                 if r.get("client_id") != client_id or
                 r.get("created_at", "") > (
                     datetime.utcnow() - timedelta(days=1)
                 ).isoformat()]

    try:
        with open(reminders_file, 'w') as f:
            json.dump(reminders, f, indent=2)
    except Exception as e:
        return {"success": False, "error": str(e)}

    return {
        "success": True,
        "scheduled": scheduled,
        "total_reminders": len(scheduled)
    }


@router.post("/send-due-reminders")
def send_due_si_reminders():
    """Send all due DMPA-SC SI reminders — run daily"""
    import json, os
    from datetime import datetime, timedelta

    reminders_file = os.path.join(
        os.path.dirname(__file__), "..", "..", "si_reminders.json"
    )
    if not os.path.exists(reminders_file):
        return {"success": True, "sent": 0, "message": "No reminders scheduled"}

    with open(reminders_file, 'r') as f:
        reminders = json.load(f)

    today = datetime.utcnow().date()
    sent_count = 0
    results = []

    MAPS_STEPS = (
        "📋 DMPA-SC Self-Injection Steps (MAPS):\n"
        "🔵 MIX: Shake the device vigorously for 30 seconds\n"
        "🔵 ACTIVATE: Push needle cap and port together firmly\n"
        "🔵 PINCH: Pinch skin on abdomen or thigh — form a tent\n"
        "🔵 SELF-INJECT: Insert at 45° and squeeze slowly until empty\n"
        "📹 Watch video: https://www.youtube.com/watch?v=KI4eZniwmkA\n"
    )

    for i, reminder in enumerate(reminders):
        if reminder.get("sent"):
            continue

        reminder_date = datetime.fromisoformat(
            reminder["reminder_date"]
        ).date()

        if reminder_date > today:
            continue

        # Due today or overdue
        phone = reminder["phone"]
        if not phone:
            continue

        # Format phone
        phone = phone.replace(" ", "").replace("-", "")
        if phone.startswith("0"):
            phone = "+254" + phone[1:]
        elif not phone.startswith("+"):
            phone = "+254" + phone

        dose_num = reminder["dose_number"]
        total_doses = reminder["total_doses"]
        injection_date = datetime.fromisoformat(
            reminder["injection_date"]
        ).strftime("%d %b %Y")

        message = (
            f"Dear {reminder['client_name'].split()[0]}, "
            f"your DMPA-SC dose {dose_num}/{total_doses} "
            f"is due on {injection_date}. "
            f"Remember to self-inject!\n\n"
            f"{MAPS_STEPS}"
            f"If you have concerns, call {reminder['facility_name']}. "
            f"Reply STOP to opt out."
        )

        if SMS_ENABLED:
            try:
                sms = africastalking.SMS
                response = sms.send(message, [phone], SENDER_ID)
                recipients = response.get(
                    "SMSMessageData", {}
                ).get("Recipients", [])
                if recipients and recipients[0].get("status") == "Success":
                    reminders[i]["sent"] = True
                    reminders[i]["sent_at"] = datetime.utcnow().isoformat()
                    sent_count += 1
                    results.append({
                        "client": reminder["client_name"],
                        "status": "sent",
                        "dose": dose_num
                    })
            except Exception as e:
                results.append({
                    "client": reminder["client_name"],
                    "status": "error",
                    "error": str(e)
                })
        else:
            # Sandbox — mark as sent with log
            reminders[i]["sent"] = True
            reminders[i]["sent_at"] = datetime.utcnow().isoformat()
            reminders[i]["sandbox"] = True
            reminders[i]["message_preview"] = message
            sent_count += 1
            results.append({
                "client": reminder["client_name"],
                "status": "sandbox",
                "dose": dose_num,
                "message": message
            })

    try:
        with open(reminders_file, 'w') as f:
            json.dump(reminders, f, indent=2)
    except:
        pass

    return {
        "success": True,
        "sent": sent_count,
        "results": results,
        "sandbox": not SMS_ENABLED
    }


@router.get("/si-reminders")
def get_si_reminders():
    """Get all scheduled SI reminders"""
    import json, os
    reminders_file = os.path.join(
        os.path.dirname(__file__), "..", "..", "si_reminders.json"
    )
    if not os.path.exists(reminders_file):
        return []
    try:
        with open(reminders_file, 'r') as f:
            return json.load(f)
    except:
        return []