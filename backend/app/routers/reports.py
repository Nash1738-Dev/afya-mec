from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.database import get_db
from app.models.visit import Visit
from app.models.client import Client
from datetime import datetime
import json, os

router = APIRouter()

REPORT_HISTORY_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "report_history.json")

def load_history():
    if os.path.exists(REPORT_HISTORY_FILE):
        try:
            with open(REPORT_HISTORY_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return []

def save_to_history(period, data):
    history = load_history()
    history = [h for h in history if h['period'] != period]
    history.insert(0, {'period': period, 'data': data, 'generated': datetime.utcnow().isoformat()})
    history = history[:24]
    try:
        with open(REPORT_HISTORY_FILE, 'w') as f:
            json.dump(history, f)
    except:
        pass

@router.get("/moh711/history")
def get_report_history():
    history = load_history()
    return [{'period': h['period'], 'data': h['data']} for h in history]

@router.get("/moh711/{period}")
def generate_moh711(period: str, db: Session = Depends(get_db)):
    try:
        year = int(period[:4])
        month = int(period[4:])
    except:
        return {"success": False, "error": "Invalid period — use YYYYMM"}

    visits = db.query(Visit).filter(
        extract('year', Visit.visit_date) == year,
        extract('month', Visit.visit_date) == month
    ).all()

    client_ids = [v.client_id for v in visits]
    clients_map = {}
    if client_ids:
        clients_map = {str(c.id): c for c in db.query(Client).filter(
            Client.id.in_(client_ids)
        ).all()}

    fp = {
        'first_ever_users': 0,
        'pop_new': 0, 'pop_revisit': 0,
        'coc_new': 0, 'coc_revisit': 0,
        'ecp_new': 0, 'ecp_revisit': 0,
        'dmpa_im_new': 0, 'dmpa_im_revisit': 0,
        'dmpa_sc_new': 0, 'dmpa_sc_revisit': 0,
        'net_en_new': 0, 'net_en_revisit': 0,
        'condom_m': 0, 'condom_f': 0, 'condom_both': 0,
        'natural_fp': 0, 'cycle_beads': 0,
        'implant_1rod_new': 0, 'implant_1rod_revisit': 0,
        'implant_2rod_new': 0, 'implant_2rod_revisit': 0,
        'iud_hormonal_new': 0, 'iud_hormonal_revisit': 0,
        'iud_non_hormonal_new': 0, 'iud_non_hormonal_revisit': 0,
        'btl_new': 0, 'vasectomy_new': 0,
        'iud_removals': 0, 'implant_removals': 0,
        'total_fp_clients': 0,
        'adolescent_10_14': 0, 'adolescent_15_19': 0,
        'youth_20_24': 0, 'adults_25_plus': 0,
        'ppfp_48hrs': 0, 'ppfp_3days_6wks': 0,
        'post_abortion_fp': 0,
    }

    cervical = {
        'via_lt25': 0, 'via_25_49': 0, 'via_50plus': 0,
        'pap_smear': 0, 'hpv_test': 0,
        'positive_via': 0, 'positive_cytology': 0, 'positive_hpv': 0,
        'cryotherapy': 0, 'leep': 0,
        'hiv_positive_screened': 0,
    }

    total_new = 0
    total_revisit = 0

    for v in visits:
        method = v.primary_method or ''
        is_new = v.visit_type == 1
        suffix = 'new' if is_new else 'revisit'

        if is_new:
            total_new += 1
        else:
            total_revisit += 1

        if v.first_ever_user:
            fp['first_ever_users'] += 1

        if method == 'POP':
            fp[f'pop_{suffix}'] += 1
        elif method == 'COC':
            fp[f'coc_{suffix}'] += 1
        elif method in ('EC_PILL', 'EC_IUD'):
            fp[f'ecp_{suffix}'] += 1
        elif method == 'DMPA_IM':
            fp[f'dmpa_im_{suffix}'] += 1
        elif method == 'DMPA_SC':
            fp[f'dmpa_sc_{suffix}'] += 1
        elif method == 'NET_EN':
            fp[f'net_en_{suffix}'] += 1
        elif method == 'CONDOM_M':
            fp['condom_m'] += 1
        elif method == 'CONDOM_F':
            fp['condom_f'] += 1
        elif method == 'CONDOM_BOTH':
            fp['condom_both'] += 1
        elif method == 'IMPLANT':
            fp[f'implant_1rod_{suffix}'] += 1
        elif method == 'LNG_IUS':
            fp[f'iud_hormonal_{suffix}'] += 1
        elif method == 'CU_IUD':
            fp[f'iud_non_hormonal_{suffix}'] += 1
        elif method == 'BTL':
            fp['btl_new'] += 1
        elif method == 'VASECTOMY':
            fp['vasectomy_new'] += 1

        if v.method_visit_category == 2:
            if method in ('CU_IUD', 'LNG_IUS'):
                fp['iud_removals'] += 1
            elif method == 'IMPLANT':
                fp['implant_removals'] += 1

        if v.natural_fp_counselled:
            fp['natural_fp'] += 1
        if v.cycle_beads_given:
            fp['cycle_beads'] += 1

        if v.ppfp_timing == 2:
            fp['ppfp_48hrs'] += 1
        elif v.ppfp_timing == 3:
            fp['ppfp_3days_6wks'] += 1

        client = clients_map.get(str(v.client_id))
        age_bracket = getattr(v, 'anon_age_bracket', None) if getattr(v, 'is_anonymous', False) else None
        age = client.age if client else 0

        if age_bracket == '10-14' or (not age_bracket and 10 <= age <= 14):
            fp['adolescent_10_14'] += 1
        elif age_bracket == '15-19' or (not age_bracket and 15 <= age <= 19):
            fp['adolescent_15_19'] += 1
        elif age_bracket == '20-24' or (not age_bracket and 20 <= age <= 24):
            fp['youth_20_24'] += 1
        elif age_bracket in ('25-49', '25+') or (not age_bracket and age >= 25):
            fp['adults_25_plus'] += 1

        if v.cervical_screening_method and v.cervical_screening_method not in ('none', ''):
            if age < 25:
                cervical['via_lt25'] += 1
            elif 25 <= age <= 49:
                cervical['via_25_49'] += 1
            else:
                cervical['via_50plus'] += 1

            if v.cervical_screening_method == 'PAP':
                cervical['pap_smear'] += 1
            elif v.cervical_screening_method == 'HPV':
                cervical['hpv_test'] += 1

            if v.cervical_screening_result in (2, 3):
                cervical['positive_via'] += 1
            if v.cervical_screening_result == 3:
                cervical['cryotherapy'] += 1

            if v.hiv_status == 2:
                cervical['hiv_positive_screened'] += 1

        if v.primary_method:
            fp['total_fp_clients'] += 1

    result = {
        "success": True,
        "period": period,
        "year": year,
        "month": month,
        "summary": {
            "total_visits": len(visits),
            "new_clients": total_new,
            "revisits": total_revisit,
        },
        "fp_section": fp,
        "cervical": cervical,
    }

    save_to_history(period, result)
    return result