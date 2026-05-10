import os
import httpx
from datetime import datetime

def _get_config():
    return {
        "api_key": os.getenv("BREVO_API_KEY", ""),
        "sender_email": os.getenv("BREVO_SENDER_EMAIL", "nashfelix2000@gmail.com"),
        "sender_name": os.getenv("BREVO_SENDER_NAME", "AfyaMEC Platform"),
        "support_email": os.getenv("SUPPORT_EMAIL", "felix_ontita@insupplyhealth.com"),
    }

# Keep these for backward compat with build_feedback_html
BREVO_API_KEY = ""
BREVO_SENDER_EMAIL = "nashfelix2000@gmail.com"
BREVO_SENDER_NAME = "AfyaMEC Platform"
SUPPORT_EMAIL = "felix_ontita@insupplyhealth.com"


def send_email(
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str = None,
    reply_to: str = None
) -> dict:
    """Send email via Brevo API"""
    cfg = _get_config()
    
    # Update module-level vars so HTML templates stay current
    global BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, SUPPORT_EMAIL
    BREVO_API_KEY = cfg["api_key"]
    BREVO_SENDER_EMAIL = cfg["sender_email"]
    BREVO_SENDER_NAME = cfg["sender_name"]
    SUPPORT_EMAIL = cfg["support_email"]

    if not cfg["api_key"]:
        return {"success": False, "error": "Brevo API key not configured"}

    payload = {
        "sender": {"name": cfg["sender_name"], "email": cfg["sender_email"]},
        "to": [{"email": to_email}],
        "subject": subject,
        "textContent": text_body,
    }

    if html_body:
        payload["htmlContent"] = html_body

    if reply_to:
        payload["replyTo"] = {"email": reply_to}

    try:
        with httpx.Client(timeout=15) as client:
            res = client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": cfg["api_key"],
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                json=payload
            )
            if res.status_code == 201:
                return {"success": True, "message_id": res.json().get("messageId")}
            else:
                return {
                    "success": False,
                    "error": f"Brevo error {res.status_code}: {res.text}"
                }
    except Exception as e:
        return {"success": False, "error": str(e)}


def build_feedback_html(data: dict) -> str:
    """Build professional HTML email for feedback"""
    type_colors = {
        "feedback": "#0d7377",
        "bug": "#dc2626",
        "feature": "#7c3aed"
    }
    priority_colors = {
        "low": "#14a044",
        "normal": "#f59e0b",
        "urgent": "#dc2626"
    }
    type_label = data.get("type", "feedback").upper()
    priority_label = data.get("priority", "normal").upper()
    color = type_colors.get(data.get("type", "feedback"), "#0d7377")
    p_color = priority_colors.get(data.get("priority", "normal"), "#f59e0b")

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background:#f8fafb; padding:20px; margin:0;">
  <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">

    <div style="background:linear-gradient(135deg,#0d7377,#14a044); padding:24px; text-align:center;">
      <h1 style="color:white; margin:0; font-size:22px;">🌿 AfyaMEC</h1>
      <p style="color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:14px;">
        Kenya Digital Family Planning Platform
      </p>
    </div>

    <div style="padding:20px 24px 0;">
      <div style="display:inline-block; background:{color}; color:white;
        padding:4px 14px; border-radius:20px; font-size:12px; font-weight:bold;">
        {type_label}
      </div>
      <div style="display:inline-block; background:{p_color}; color:white;
        padding:4px 14px; border-radius:20px; font-size:12px; font-weight:bold; margin-left:8px;">
        {priority_label} PRIORITY
      </div>
    </div>

    <div style="padding:20px 24px;">
      <h2 style="color:#1a202c; font-size:18px; margin:0 0 16px;">
        {data.get('subject', 'No Subject')}
      </h2>

      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
        <tr>
          <td style="padding:8px 12px; background:#f0fdfa; border-left:4px solid #0d7377;
            border-radius:4px; font-size:13px;">
            <strong>From:</strong> {data.get('from_name', 'Unknown Provider')}<br/>
            <strong>Facility:</strong> {data.get('from_facility', 'Not specified')}<br/>
            <strong>Reply to:</strong> {data.get('reply_to_email', BREVO_SENDER_EMAIL)}<br/>
            <strong>Sent:</strong> {datetime.utcnow().strftime('%d %B %Y at %H:%M UTC')}
          </td>
        </tr>
      </table>

      <div style="background:#f8fafb; border-radius:8px; padding:16px;
        font-size:14px; line-height:1.6; color:#374151; border:1px solid #e5e7eb;">
        {data.get('body', '').replace(chr(10), '<br/>')}
      </div>
    </div>

    <div style="padding:16px 24px; background:#f8fafb; border-top:1px solid #e5e7eb;
      text-align:center;">
      <p style="color:#9ca3af; font-size:12px; margin:0;">
        This message was sent via AfyaMEC — Kenya Family Planning Platform<br/>
        <a href="mailto:{SUPPORT_EMAIL}" style="color:#0d7377;">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  </div>
</body>
</html>
"""


def build_confirmation_html(provider_name: str, subject: str, msg_type: str) -> str:
    """Build confirmation email sent back to the provider"""
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background:#f8fafb; padding:20px; margin:0;">
  <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px;
    overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">

    <div style="background:linear-gradient(135deg,#0d7377,#14a044); padding:24px; text-align:center;">
      <h1 style="color:white; margin:0; font-size:22px;">🌿 AfyaMEC</h1>
      <p style="color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:14px;">
        Kenya Digital Family Planning Platform
      </p>
    </div>

    <div style="padding:32px 24px; text-align:center;">
      <div style="font-size:48px; margin-bottom:16px;">✅</div>
      <h2 style="color:#1a202c; font-size:20px; margin:0 0 12px;">
        Message Received!
      </h2>
      <p style="color:#6b7280; font-size:14px; line-height:1.6; margin:0 0 20px;">
        Dear <strong>{provider_name}</strong>,<br/><br/>
        Thank you for your <strong>{msg_type}</strong>.<br/>
        We have received your message: <em>"{subject}"</em><br/><br/>
        Our support team will review and respond within <strong>24 hours</strong>.
      </p>

      <div style="background:#f0fdfa; border-radius:8px; padding:16px;
        border:1px solid #ccfbf1; font-size:13px; color:#0d7377;">
        <strong>Support Contact:</strong><br/>
        📧 {SUPPORT_EMAIL}<br/>
        📱 WhatsApp: +254725622786
      </div>
    </div>

    <div style="padding:16px 24px; background:#f8fafb; border-top:1px solid #e5e7eb;
      text-align:center;">
      <p style="color:#9ca3af; font-size:12px; margin:0;">
        AfyaMEC — Informed Choice · Better Health
      </p>
    </div>
  </div>
</body>
</html>
"""