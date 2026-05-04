from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
import os

router = APIRouter()


@router.get("/status")
def get_dhis2_status():
    return {
        "enabled": False,
        "base_url": os.getenv("DHIS2_BASE_URL", ""),
        "username_configured": bool(os.getenv("DHIS2_USERNAME", "")),
        "password_configured": bool(os.getenv("DHIS2_PASSWORD", "")),
        "org_unit": os.getenv("DHIS2_ORG_UNIT", ""),
        "data_elements_configured": False,
        "message": "Disabled — configure credentials in .env"
    }


@router.get("/test")
def test_dhis2_connection():
    return {"success": False, "message": "DHIS2 disabled — configure credentials first"}


@router.get("/preview/{period}")
def preview_moh711(period: str, db: Session = Depends(get_db)):
    return {"success": False, "message": "Configure DHIS2 credentials first"}


@router.post("/push")
def push_moh711(db: Session = Depends(get_db)):
    return {"success": False, "message": "DHIS2 disabled"}


@router.get("/history")
def get_push_history():
    return {"history": [], "message": "No push history"}