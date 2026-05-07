from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime

class Visit(Base):
    __tablename__ = "visits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facility_code = Column(String, index=True)
    provider_name = Column(String)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    provider_id = Column(String)
    provider_name_recorded = Column(String)
    
    is_anonymous = Column(Boolean, default=False)
    anon_sex = Column(String(1))
    anon_age_bracket = Column(String)  # e.g. "10-14", "15-19", "20-24", "25+"
    
    visit_date = Column(DateTime, default=datetime.utcnow)
    visit_type = Column(Integer)  # 1=New, 2=Revisit
    first_ever_user = Column(Boolean)

    # Vitals
    weight_kg = Column(Float)
    height_cm = Column(Float)
    bmi_calculated = Column(Float)
    bp_systolic = Column(Integer)
    bp_diastolic = Column(Integer)

    # Pregnancy screening
    pdt_done = Column(Boolean, default=False)
    pdt_result = Column(String)  # negative, positive
    pregnancy_checklist = Column(JSON)  # stores answers to 6 questions

    # MEC Screener answers
    mec_conditions = Column(JSON)  # all medical conditions

    # Method
    primary_method = Column(String)
    method_visit_category = Column(Integer)  # 1=New, 2=Removal, 3=Reinsertion, 4=Checkup
    method_change_reason = Column(String)
    mec_category_assigned = Column(Integer)
    quantity_dispensed = Column(Float)
    dmpa_sc_admin_type = Column(String)  # PA or SI
    dmpa_sc_take_home_doses = Column(Integer)
    dmpa_sc_mode = Column(String(5))  # SI or PA
    dmpa_sc_si_new = Column(Integer, default=0)
    dmpa_sc_si_revisit = Column(Integer, default=0)
    dmpa_sc_si_doses_new = Column(Integer, default=0)
    dmpa_sc_si_doses_revisit = Column(Integer, default=0)
    dmpa_sc_pa_new = Column(Integer, default=0)
    dmpa_sc_pa_revisit = Column(Integer, default=0)
    larc_removal_reason = Column(Integer)

    # HIV/STI/Preventive
    hiv_counselled = Column(Boolean)
    hiv_tested = Column(Boolean)
    hiv_status = Column(Integer)  # 1-4
    hiv_who_stage = Column(Integer)  # 1-4
    tb_status = Column(Integer)
    ipv_rc_status = Column(Integer)
    cervical_screening_method = Column(String)
    cervical_screening_result = Column(Integer)

    # Condoms & Natural FP
    condoms_client_sex = Column(String)
    condoms_qty_dispensed = Column(Integer)
    natural_fp_counselled = Column(Boolean)
    cycle_beads_given = Column(Boolean)

    # PPFP & Referral
    ppfp_timing = Column(Integer)
    fp_counselled = Column(Boolean)
    referral_in = Column(Integer)
    referral_out = Column(Integer)
    remarks = Column(Text)

    # Auto-calculated
    return_date = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)