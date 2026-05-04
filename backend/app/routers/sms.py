from fastapi import APIRouter, Depends
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