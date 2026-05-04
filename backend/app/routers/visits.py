from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.client import Client
from app.models.visit import Visit
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
import uuid
from datetime import datetime

router = APIRouter()

class SessionData(BaseModel):
    client: Dict[str, Any] = {}
    vitals: Dict[str, Any] = {}
    pregnancy: Dict[str, Any] = {}
    conditions: List[str] = []
    conditionDetails: Dict[str, Any] = {}
    selectedMethod: Optional[str] = None
    methodVisitCategory: Optional[str] = None
    methodChangeReason: Optional[str] = None
    quantityDispensed: Optional[Any] = None
    dmpaAdminType: Optional[str] = None
    dmpaTakeHomeDoses: Optional[Any] = None
    larcRemovalReason: Optional[Any] = None
    counsellingDone: Optional[bool] = False
    comprehensionConfirmed: Optional[bool] = False
    sti: Dict[str, Any] = {}
    returnDate: Optional[str] = None
    sessionDate: Optional[str] = None

    class Config:
        extra = 'allow'

@router.post("/save")
def save_session(data: SessionData, db: Session = Depends(get_db)):
    # Extra safety — convert any boolean integers back to proper types
    c = dict(data.client) if data.client else {}
    v = dict(data.vitals) if data.vitals else {}
    s = dict(data.sti) if data.sti else {}

    def safe_int(val):
        try:
            if val is None or val == '' or val == 'null':
                return None
            return int(val)
        except:
            return None

    def safe_float(val):
        try:
            if val is None or val == '' or val == 'null':
                return None
            return float(val)
        except:
            return None

    def safe_bool(val):
        if isinstance(val, bool):
            return val
        if isinstance(val, str):
            return val.lower() in ('true', 'yes', '1')
        return bool(val) if val else False

    def safe_str(val):
        if val is None or val == 'null':
            return ''
        return str(val)

    # Find or create client
    client = None
    if c.get("service_reg_number") and c.get("service_reg_number") != '':
        client = db.query(Client).filter(
            Client.service_registration_number == c["service_reg_number"]
        ).first()

    if not client and c.get("telephone") and c.get("telephone") != '':
        client = db.query(Client).filter(
            Client.telephone == c["telephone"]
        ).first()

    if not client:
        reg_num = c.get("service_reg_number") or f"AUTO-{uuid.uuid4().hex[:6].upper()}"
        client = Client(
            id=uuid.uuid4(),
            service_registration_number=reg_num,
            first_name=safe_str(c.get("first_name")),
            last_name=safe_str(c.get("last_name")),
            age=safe_int(c.get("age")) or 0,
            sex=safe_str(c.get("sex")),
            telephone=safe_str(c.get("telephone")),
            location_landmark=safe_str(c.get("location")),
            disability_status=safe_int(c.get("disability_status")) or 0,
        )
        db.add(client)
        db.flush()
    else:
        if c.get("age"):
            client.age = safe_int(c.get("age")) or client.age
        if c.get("telephone"):
            client.telephone = safe_str(c.get("telephone"))
        if c.get("location"):
            client.location_landmark = safe_str(c.get("location"))

    # Parse dates
    visit_date = datetime.utcnow()
    if data.sessionDate:
        try:
            visit_date = datetime.fromisoformat(data.sessionDate.replace('Z', ''))
        except:
            pass

    return_date = None
    if data.returnDate:
        try:
            return_date = datetime.fromisoformat(data.returnDate.replace('Z', ''))
        except:
            pass

    # Get pregnancy checklist safely
    checklist = data.pregnancy.get("checklist", {})
    if not isinstance(checklist, dict):
        checklist = {}

    visit = Visit(
        id=uuid.uuid4(),
        client_id=client.id,
        facility_code=c.get("facility_code", ""),
        provider_name=c.get("provider_name", ""),
        visit_date=visit_date,
        visit_type=safe_int(c.get("visit_type")) or 1,
        first_ever_user=safe_bool(c.get("first_ever_user")),
        weight_kg=safe_float(v.get("weight_kg")),
        height_cm=safe_float(v.get("height_cm")),
        bmi_calculated=safe_float(v.get("bmi")),
        bp_systolic=safe_int(v.get("bp_systolic")),
        bp_diastolic=safe_int(v.get("bp_diastolic")),
        pdt_done=safe_bool(data.pregnancy.get("pdt_done")),
        pdt_result=safe_str(data.pregnancy.get("pdt_result")),
        pregnancy_checklist=checklist,
        mec_conditions=data.conditions or [],
        primary_method=safe_str(data.selectedMethod) or None,
        method_visit_category=safe_int(data.methodVisitCategory),
        method_change_reason=safe_str(data.methodChangeReason) or None,
        mec_category_assigned=None,
        quantity_dispensed=safe_float(data.quantityDispensed),
        dmpa_sc_admin_type=safe_str(data.dmpaAdminType) or None,
        dmpa_sc_take_home_doses=safe_int(data.dmpaTakeHomeDoses),
        larc_removal_reason=safe_int(data.larcRemovalReason),
        hiv_counselled=safe_bool(s.get("hiv_counselled")),
        hiv_tested=safe_bool(s.get("hiv_tested")),
        hiv_status=safe_int(s.get("hiv_status")),
        hiv_who_stage=safe_int(s.get("hiv_who_stage")),
        tb_status=safe_int(s.get("tb_status")),
        ipv_rc_status=safe_int(s.get("ipv_status")),
        cervical_screening_method=safe_str(s.get("cervical_screening_method")) or None,
        cervical_screening_result=safe_int(s.get("cervical_screening_result")),
        condoms_client_sex=safe_str(s.get("condom_type")) or None,
        condoms_qty_dispensed=safe_int(s.get("condom_qty")),
        natural_fp_counselled=safe_bool(s.get("natural_fp_counselled")),
        cycle_beads_given=safe_bool(s.get("cycle_beads_given")),
        ppfp_timing=safe_int(s.get("ppfp_timing")),
        fp_counselled=safe_bool(data.counsellingDone),
        referral_in=safe_int(s.get("referral_in")),
        referral_out=safe_int(s.get("referral_out")),
        remarks=safe_str(s.get("remarks")),
        return_date=return_date,
    )
    db.add(visit)
    db.commit()

    return {
        "success": True,
        "client_id": str(client.id),
        "visit_id": str(visit.id),
        "message": f"Session saved for {client.first_name} {client.last_name}"
    }

@router.get("/")
def get_all_visits(db: Session = Depends(get_db)):
    visits = db.query(Visit).order_by(Visit.visit_date.desc()).limit(500).all()
    return [
        {
            "id": str(v.id),
            "client_id": str(v.client_id),
            "visit_date": v.visit_date.isoformat(),
            "primary_method": v.primary_method,
            "visit_type": v.visit_type,
            "return_date": v.return_date.isoformat() if v.return_date else None,
        }
        for v in visits
    ]

class AnonymousVisitData(BaseModel):
    client: Dict[str, Any] = {}
    vitals: Dict[str, Any] = {}
    pregnancy: Dict[str, Any] = {}
    conditions: List[str] = []
    conditionDetails: Dict[str, Any] = {}
    selectedMethod: Optional[str] = None
    methodVisitCategory: Optional[str] = None
    quantityDispensed: Optional[Any] = None
    counsellingDone: Optional[bool] = True
    comprehensionConfirmed: Optional[bool] = True
    sti: Dict[str, Any] = {}
    is_anonymous: Optional[bool] = True
    anon_sex: Optional[str] = None
    anon_age_bracket: Optional[str] = None
    sessionDate: Optional[str] = None
    returnDate: Optional[str] = None

    class Config:
        extra = 'allow'

@router.post("/save-anonymous")
def save_anonymous_visit(data: AnonymousVisitData, db: Session = Depends(get_db)):
    def safe_int(val):
        try:
            if val is None or val == '': return None
            return int(val)
        except: return None
    def safe_float(val):
        try:
            if val is None or val == '': return None
            return float(val)
        except: return None
    def safe_bool(val):
        if isinstance(val, bool): return val
        if isinstance(val, str): return val.lower() in ('true','yes','1')
        return bool(val) if val else False
    def safe_str(val):
        if val is None or val == 'null': return ''
        return str(val)

    # Create anonymous client record
    import uuid as uuid_module
    anon_reg = f"ANON-{uuid_module.uuid4().hex[:8].upper()}"

    client = Client(
        id=uuid.uuid4(),
        service_registration_number=anon_reg,
        first_name='Anonymous',
        last_name='Client',
        age=safe_int(data.client.get('age')) or 25,
        sex=safe_str(data.anon_sex or data.client.get('sex', 'F')),
        telephone='',
        location_landmark='',
        disability_status=0,
        facility_code=safe_str(data.client.get('facility_code')),
    )
    db.add(client)
    db.flush()

    visit_date = datetime.utcnow()
    if data.sessionDate:
        try:
            visit_date = datetime.fromisoformat(data.sessionDate.replace('Z',''))
        except: pass

    s = data.sti

    visit = Visit(
        id=uuid.uuid4(),
        client_id=client.id,
        facility_code=safe_str(data.client.get('facility_code')),
        provider_name=safe_str(data.client.get('provider_name')),
        visit_date=visit_date,
        visit_type=safe_int(data.client.get('visit_type')) or 1,
        first_ever_user=safe_bool(data.client.get('first_ever_user')),
        is_anonymous=True,
        anon_sex=safe_str(data.anon_sex),
        anon_age_bracket=safe_str(data.anon_age_bracket),
        primary_method=safe_str(data.selectedMethod) or None,
        method_visit_category=safe_int(data.methodVisitCategory),
        quantity_dispensed=safe_float(data.quantityDispensed),
        fp_counselled=True,
        natural_fp_counselled=safe_bool(s.get('natural_fp_counselled')),
        cycle_beads_given=safe_bool(s.get('cycle_beads_given')),
        mec_conditions=[],
        pregnancy_checklist={},
        hiv_counselled=False,
        hiv_tested=False,
    )
    db.add(visit)
    db.commit()

    return {
        "success": True,
        "visit_id": str(visit.id),
        "reg_number": anon_reg,
        "message": "Anonymous entry recorded"
    }