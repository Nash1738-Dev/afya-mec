import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

SMS_ENABLED = os.getenv("SMS_ENABLED", "false").lower() == "true"
AT_USERNAME = os.getenv("AT_USERNAME", "sandbox")
AT_API_KEY = os.getenv("AT_API_KEY", "")
AT_SENDER_ID = os.getenv("AT_SENDER_ID", "DigitalMEC")


def get_sms_service():
    if not SMS_ENABLED or not AT_API_KEY:
        return None
    try:
        import africastalking
        africastalking.initialize(AT_USERNAME, AT_API_KEY)
        return africastalking.SMS
    except Exception as e:
        print(f"SMS init error: {e}")
        return None


def send_sms(phone: str, message: str) -> dict:
    """Send SMS — returns result dict"""
    if not phone or not phone.strip():
        return {"success": False, "error": "No phone number"}

    # Format Kenya number
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("0"):
        phone = "+254" + phone[1:]
    elif phone.startswith("254"):
        phone = "+" + phone
    elif not phone.startswith("+"):
        phone = "+254" + phone

    # Sandbox mode — just log
    if not SMS_ENABLED:
        print(f"[SMS SANDBOX] To: {phone}")
        print(f"[SMS SANDBOX] Message: {message}")
        return {
            "success": True,
            "sandbox": True,
            "phone": phone,
            "message": message,
            "note": "SMS_ENABLED=false — message logged only"
        }

    sms = get_sms_service()
    if not sms:
        return {"success": False, "error": "SMS service not initialized"}

    try:
        response = sms.send(message, [phone], AT_SENDER_ID)
        recipients = response.get("SMSMessageData", {}).get("Recipients", [])
        if recipients and recipients[0].get("status") == "Success":
            return {"success": True, "phone": phone, "message_id": recipients[0].get("messageId")}
        else:
            return {"success": False, "error": str(response)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def build_reminder_message(client_name: str, method: str, return_date: datetime, facility_name: str = "") -> str:
    date_str = return_date.strftime("%d %B %Y")
    method_map = {
        "DMPA_IM": "Depo injection", "DMPA_SC": "Sayana Press injection",
        "NET_EN": "NET-EN injection", "COC": "contraceptive pills",
        "POP": "contraceptive pills", "IMPLANT": "implant check",
        "CU_IUD": "IUD check", "LNG_IUS": "IUS check",
        "LAM": "LAM review", "FAM": "FAM review",
    }
    method_name = method_map.get(method, "family planning")
    facility = f" at {facility_name}" if facility_name else ""

    return (
        f"Dear {client_name}, this is a reminder that your {method_name} "
        f"appointment is due on {date_str}{facility}. "
        f"Please visit us on or before this date. "
        f"Digital MEC - Kenya FP Platform"
    )


def build_overdue_message(client_name: str, method: str, facility_name: str = "") -> str:
    method_map = {
        "DMPA_IM": "Depo injection", "DMPA_SC": "Sayana Press",
        "NET_EN": "NET-EN injection", "COC": "pill refill",
        "POP": "pill refill", "IMPLANT": "implant",
        "CU_IUD": "IUD", "LNG_IUS": "IUS",
    }
    method_name = method_map.get(method, "family planning visit")
    facility = f" at {facility_name}" if facility_name else ""

    return (
        f"Dear {client_name}, you are overdue for your {method_name}{facility}. "
        f"Please visit us as soon as possible to continue your family planning. "
        f"Digital MEC - Kenya FP Platform"
    )