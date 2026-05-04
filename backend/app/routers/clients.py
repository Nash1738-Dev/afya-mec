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

@router.get("/{client_id}")
def get_client(client_id: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    visits = db.query(Visit).filter(
        Visit.client_id == client.id
    ).order_by(Visit.visit_date.desc()).all()
    return {
        "id": str(client.id),
        "service_reg_number": client.service_registration_number,
        "first_name": client.first_name,
        "last_name": client.last_name,
        "age": client.age,
        "sex": client.sex,
        "telephone": client.telephone,
        "location": client.location_landmark,
        "visits": [
            {
                "id": str(v.id),
                "visit_date": v.visit_date.isoformat(),
                "primary_method": v.primary_method,
                "return_date": v.return_date.isoformat() if v.return_date else None,
                "visit_type": v.visit_type,
            } for v in visits
        ]
    }

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