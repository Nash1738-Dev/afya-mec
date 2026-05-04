import os
import httpx
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DHIS2_BASE_URL = os.getenv("DHIS2_BASE_URL", "https://dhis2.health.go.ke")
DHIS2_USERNAME = os.getenv("DHIS2_USERNAME", "")
DHIS2_PASSWORD = os.getenv("DHIS2_PASSWORD", "")
DHIS2_ORG_UNIT = os.getenv("DHIS2_ORG_UNIT", "")
DHIS2_ENABLED = os.getenv("DHIS2_ENABLED", "false").lower() == "true"

# Kenya DHIS2 / KHIS data element IDs for family planning
# These are the standard KHIS data element UIDs
# Replace with actual IDs from your KHIS instance
KHIS_DATA_ELEMENTS = {
    "COC_new": "placeholder_COC_new_uid",
    "COC_revisit": "placeholder_COC_revisit_uid",
    "POP_new": "placeholder_POP_new_uid",
    "POP_revisit": "placeholder_POP_revisit_uid",
    "DMPA_IM_new": "placeholder_DMPA_IM_new_uid",
    "DMPA_IM_revisit": "placeholder_DMPA_IM_revisit_uid",
    "DMPA_SC_new": "placeholder_DMPA_SC_new_uid",
    "DMPA_SC_revisit": "placeholder_DMPA_SC_revisit_uid",
    "NET_EN_new": "placeholder_NET_EN_new_uid",
    "NET_EN_revisit": "placeholder_NET_EN_revisit_uid",
    "IMPLANT_new": "placeholder_IMPLANT_new_uid",
    "IMPLANT_revisit": "placeholder_IMPLANT_revisit_uid",
    "CU_IUD_new": "placeholder_CU_IUD_new_uid",
    "CU_IUD_revisit": "placeholder_CU_IUD_revisit_uid",
    "LNG_IUS_new": "placeholder_LNG_IUS_new_uid",
    "LNG_IUS_revisit": "placeholder_LNG_IUS_revisit_uid",
    "CONDOM_M_new": "placeholder_CONDOM_M_new_uid",
    "CONDOM_F_new": "placeholder_CONDOM_F_new_uid",
    "BTL_new": "placeholder_BTL_new_uid",
    "VASECTOMY_new": "placeholder_VASECTOMY_new_uid",
    "total_fp_clients": "placeholder_total_fp_uid",
    "total_new_acceptors": "placeholder_new_acceptors_uid",
}

# KHIS dataset UID for MOH 711
KHIS_DATASET_UID = "placeholder_dataset_uid"


def get_auth():
    return (DHIS2_USERNAME, DHIS2_PASSWORD)


def test_connection() -> dict:
    """Test connection to DHIS2/KHIS"""
    if not DHIS2_ENABLED:
        return {
            "success": False,
            "mode": "disabled",
            "message": "DHIS2 integration disabled — set DHIS2_ENABLED=true in .env"
        }
    try:
        with httpx.Client(timeout=10) as client:
            res = client.get(
                f"{DHIS2_BASE_URL}/api/me",
                auth=get_auth()
            )
            if res.status_code == 200:
                data = res.json()
                return {
                    "success": True,
                    "username": data.get("username"),
                    "display_name": data.get("displayName"),
                    "message": "Connected to KHIS successfully"
                }
            else:
                return {
                    "success": False,
                    "status_code": res.status_code,
                    "message": f"Authentication failed: {res.status_code}"
                }
    except Exception as e:
        return {"success": False, "message": str(e)}


def build_moh711_payload(
    period: str,
    org_unit: str,
    method_counts: dict,
    new_counts: dict,
    revisit_counts: dict
) -> dict:
    """Build DHIS2 dataValueSet payload for MOH 711"""
    data_values = []

    for method, count in method_counts.items():
        new_key = f"{method}_new"
        revisit_key = f"{method}_revisit"

        if new_key in KHIS_DATA_ELEMENTS and KHIS_DATA_ELEMENTS[new_key] != f"placeholder_{new_key}_uid":
            data_values.append({
                "dataElement": KHIS_DATA_ELEMENTS[new_key],
                "value": str(new_counts.get(method, 0)),
                "period": period,
                "orgUnit": org_unit,
            })

        if revisit_key in KHIS_DATA_ELEMENTS and KHIS_DATA_ELEMENTS[revisit_key] != f"placeholder_{revisit_key}_uid":
            data_values.append({
                "dataElement": KHIS_DATA_ELEMENTS[revisit_key],
                "value": str(revisit_counts.get(method, 0)),
                "period": period,
                "orgUnit": org_unit,
            })

    return {
        "dataSet": KHIS_DATASET_UID,
        "completeDate": datetime.now().strftime("%Y-%m-%d"),
        "period": period,
        "orgUnit": org_unit,
        "dataValues": data_values
    }


def push_to_dhis2(payload: dict) -> dict:
    """Push data value set to DHIS2"""
    if not DHIS2_ENABLED:
        return {
            "success": False,
            "sandbox": True,
            "message": "DHIS2 disabled — payload generated but not sent",
            "payload": payload
        }

    try:
        with httpx.Client(timeout=30) as client:
            res = client.post(
                f"{DHIS2_BASE_URL}/api/dataValueSets",
                auth=get_auth(),
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            if res.status_code in (200, 201):
                return {
                    "success": True,
                    "response": res.json(),
                    "message": "Data pushed to KHIS successfully"
                }
            else:
                return {
                    "success": False,
                    "status_code": res.status_code,
                    "message": f"Push failed: {res.text}"
                }
    except Exception as e:
        return {"success": False, "message": str(e)}