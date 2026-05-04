from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.client import Client
from app.models.visit import Visit
from fastapi.responses import StreamingResponse
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import io
from datetime import datetime

router = APIRouter()

@router.get("/moh512")
def export_moh512(db: Session = Depends(get_db)):
    clients = db.query(Client).all()
    visits = db.query(Visit).order_by(Visit.visit_date.desc()).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "MOH 512"

    headers = [
        "A: Visit Date","B: Reg Number","C: First Name","C: Last Name",
        "D: Visit Type","E: First FP User","F: Age","G: Sex",
        "H: Disability","I: Telephone","J: Location",
        "Weight (kg)","Height (cm)","BMI","BP Systolic","BP Diastolic",
        "PDT Done","PDT Result","Pregnancy Ruled Out",
        "MEC Conditions","Primary Method","Qty Dispensed",
        "DMPA Admin","Take-Home Doses",
        "AJ: HIV Counselled","AK: HIV Tested","AL: HIV Status",
        "AI: TB Status","AM: IPV Status",
        "AN: Cervical Method","AO: Cervical Result",
        "Condom Type","Condom Qty",
        "AF: Natural FP","AG: Cycle Beads",
        "AH: PPFP Timing","AP: Referral In","AQ: Referral Out",
        "AR: Remarks","Return Date"
    ]

    # Header styling
    header_fill = PatternFill("solid", fgColor="1E3A5F")
    header_font = Font(bold=True, color="FFFFFF", size=10)
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center', wrap_text=True)
        ws.column_dimensions[cell.column_letter].width = 18

    ws.row_dimensions[1].height = 40

    client_map = {str(c.id): c for c in clients}

    for row_num, v in enumerate(visits, 2):
        c = client_map.get(str(v.client_id))
        if not c:
            continue
        row_data = [
            v.visit_date.strftime('%d/%m/%Y') if v.visit_date else '',
            c.service_registration_number or '',
            c.first_name or '',
            c.last_name or '',
            'New' if v.visit_type == 1 else 'Revisit',
            'Y' if v.first_ever_user else 'N',
            c.age or '',
            c.sex or '',
            c.disability_status or 0,
            c.telephone or '',
            c.location_landmark or '',
            v.weight_kg or '',
            v.height_cm or '',
            v.bmi_calculated or '',
            v.bp_systolic or '',
            v.bp_diastolic or '',
            'Y' if v.pdt_done else 'N',
            v.pdt_result or '',
            'Y' if (v.pregnancy_checklist and any(v.pregnancy_checklist.values())) else 'N',
            ', '.join(v.mec_conditions) if v.mec_conditions else '',
            v.primary_method or '',
            v.quantity_dispensed or '',
            v.dmpa_sc_admin_type or '',
            v.dmpa_sc_take_home_doses or '',
            'Y' if v.hiv_counselled else 'N',
            'Y' if v.hiv_tested else 'N',
            v.hiv_status or '',
            v.tb_status or '',
            v.ipv_rc_status or '',
            v.cervical_screening_method or '',
            v.cervical_screening_result or '',
            v.condoms_client_sex or '',
            v.condoms_qty_dispensed or '',
            'Y' if v.natural_fp_counselled else 'N',
            'Y' if v.cycle_beads_given else 'N',
            v.ppfp_timing or '',
            v.referral_in or '',
            v.referral_out or '',
            v.remarks or '',
            v.return_date.strftime('%d/%m/%Y') if v.return_date else '',
        ]
        for col, val in enumerate(row_data, 1):
            cell = ws.cell(row=row_num, column=col, value=val)
            cell.alignment = Alignment(horizontal='left')
            if row_num % 2 == 0:
                cell.fill = PatternFill("solid", fgColor="F0F4F8")

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    filename = f"MOH512_Export_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )