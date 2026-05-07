from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.client import Client
from app.models.visit import Visit
import uuid
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

@router.get("/")
def get_all_clients(facility_code: str = None, db: Session = Depends(get_db)):
    query = db.query(Client)
    if facility_code:
        query = query.filter(Client.facility_code == facility_code)
    clients = query.order_by(Client.created_at.desc()).all()
    result = []
    for c in clients:
        visits = db.query(Visit).filter(
            Visit.client_id == c.id
        ).order_by(Visit.visit_date.desc()).all()
        result.append({
            "id": str(c.id),
            "facility_code": c.facility_code or "",
            "service_reg_number": c.service_registration_number,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "age": c.age,
            "sex": c.sex,
            "telephone": c.telephone,
            "location": c.location_landmark,
            "disability_status": c.disability_status,
            "created_at": c.created_at.isoformat(),
            "total_visits": len(visits),
            "last_visit": visits[0].visit_date.isoformat() if visits else None,
            "last_method": visits[0].primary_method if visits else None,
        })
    return result

@router.get("/search")
def search_clients(q: str = "", db: Session = Depends(get_db)):
    if not q or len(q) < 2:
        return []
    q_lower = q.lower().strip()
    clients = db.query(Client).all()
    results = []
    for c in clients:
        full_name = f"{c.first_name} {c.last_name}".lower()
        phone = (c.telephone or "").replace(" ", "")
        if q_lower in phone:
            results.append(c)
            continue
        query_words = q_lower.split()
        if all(word in full_name for word in query_words):
            results.append(c)
            continue
        if q_lower in c.first_name.lower() or q_lower in c.last_name.lower():
            results.append(c)

    output = []
    for c in results[:10]:
        visits = db.query(Visit).filter(
            Visit.client_id == c.id
        ).order_by(Visit.visit_date.desc()).all()
        output.append({
            "id": str(c.id),
            "first_name": c.first_name,
            "last_name": c.last_name,
            "age": c.age,
            "sex": c.sex,
            "telephone": c.telephone or "",
            "location": c.location_landmark or "",
            "service_reg_number": c.service_registration_number or "",
            "total_visits": len(visits),
            "last_visit": visits[0].visit_date.isoformat() if visits else None,
            "last_method": visits[0].primary_method if visits else None,
        })
    return output

@router.get("/{client_id}")
def get_client(client_id: str, db: Session = Depends(get_db)):
    try:
        import uuid as uuid_module
        # Validate UUID format before querying
        try:
            uuid_module.UUID(client_id)
        except ValueError:
            raise HTTPException(status_code=404, detail=f"Client not found: invalid ID format")

        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        visits = db.query(Visit).filter(
            Visit.client_id == client.id
        ).order_by(Visit.visit_date.desc()).all()

        return {
            "id": str(client.id),
            "facility_code": client.facility_code or "",
            "service_reg_number": client.service_registration_number,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "age": client.age,
            "sex": client.sex,
            "telephone": client.telephone,
            "location": client.location_landmark,
            "disability_status": client.disability_status,
            "created_at": client.created_at.isoformat(),
            "total_visits": len(visits),
            "last_visit": visits[0].visit_date.isoformat() if visits else None,
            "last_method": visits[0].primary_method if visits else None,
            "visits": [{
                "id": str(v.id),
                "visit_date": v.visit_date.isoformat(),
                "visit_type": v.visit_type,
                "primary_method": v.primary_method,
                "bp_systolic": getattr(v, 'bp_systolic', None),
                "bp_diastolic": getattr(v, 'bp_diastolic', None),
                "weight_kg": getattr(v, 'weight_kg', None),
                "return_date": v.return_date.isoformat() if v.return_date else None,
                "provider_name": getattr(v, 'provider_name', None),
            } for v in visits]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ClientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    telephone: Optional[str] = None
    location: Optional[str] = None

@router.put("/{client_id}")
def update_client(client_id: str, data: ClientUpdate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if data.first_name is not None:
        client.first_name = data.first_name
    if data.last_name is not None:
        client.last_name = data.last_name
    if data.age is not None:
        client.age = data.age
    if data.sex is not None:
        client.sex = data.sex
    if data.telephone is not None:
        client.telephone = data.telephone
    if data.location is not None:
        client.location_landmark = data.location
    db.commit()
    return {"success": True, "message": "Client updated"}

@router.get("/{client_id}/visits")
def get_client_visits(client_id: str, db: Session = Depends(get_db)):
    """Get all visits for a client with full details"""
    from sqlalchemy import desc
    try:
        visits = db.query(Visit).filter(
            Visit.client_id == client_id
        ).order_by(desc(Visit.visit_date)).limit(10).all()

        return [{
            "id": str(v.id),
            "visit_date": v.visit_date.isoformat(),
            "visit_type": v.visit_type,
            "primary_method": v.primary_method,
            "method_visit_category": v.method_visit_category,
            "bp_systolic": getattr(v, 'bp_systolic', None),
            "bp_diastolic": getattr(v, 'bp_diastolic', None),
            "bp_category": getattr(v, 'bp_category', None),
            "weight_kg": getattr(v, 'weight_kg', None),
            "quantity_dispensed": v.quantity_dispensed,
            "return_date": v.return_date.isoformat() if v.return_date else None,
            "dmpa_sc_mode": getattr(v, 'dmpa_sc_mode', None),
            "first_ever_user": v.first_ever_user,
            "natural_fp_counselled": v.natural_fp_counselled,
            "mec_conditions": v.mec_conditions or [],
            "provider_name": getattr(v, 'provider_name', None),
        } for v in visits]
    except Exception as e:
        return []

@router.delete("/{client_id}")
def delete_client(client_id: str, reason: str = "client_request", db: Session = Depends(get_db)):
    try:
        import uuid as uuid_module
        try:
            uuid_module.UUID(client_id)
        except ValueError:
            raise HTTPException(status_code=404, detail="Client not found: invalid ID format")
            
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
            
        # Delete related visits to prevent foreign key errors
        db.query(Visit).filter(Visit.client_id == client.id).delete()
        
        db.delete(client)
        db.commit()
        
        return {"success": True, "message": "Client deleted successfully", "reason": reason}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))