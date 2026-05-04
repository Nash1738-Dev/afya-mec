// WHO MEC 6th Edition (2025) - Kenya Adapted
// Categories: 1=Use freely, 2=Generally use, 3=Usually not recommended, 4=Do not use

export const METHODS = {
  COC: { id: 'COC', name: 'Combined Oral Contraceptive', abbr: 'COC', efficacy: 99.7, type: 'hormonal', admin: 'oral' },
  POP: { id: 'POP', name: 'Progestogen-Only Pill', abbr: 'POP', efficacy: 99.7, type: 'hormonal', admin: 'oral' },
  DMPA_IM: { id: 'DMPA_IM', name: 'DMPA Injection (Depo-Provera)', abbr: 'DMPA-IM', efficacy: 99.8, type: 'hormonal', admin: 'PA', returnWeeks: 12 },
  DMPA_SC: { id: 'DMPA_SC', name: 'DMPA-SC (Sayana Press)', abbr: 'DMPA-SC', efficacy: 99.8, type: 'hormonal', admin: 'PA_SI', returnWeeks: 13 },
  NET_EN: { id: 'NET_EN', name: 'NET-EN (Noristerat)', abbr: 'NET-EN', efficacy: 99.6, type: 'hormonal', admin: 'PA', returnWeeks: 8 },
  IMPLANT: { id: 'IMPLANT', name: 'Contraceptive Implant (Implanon/Jadelle)', abbr: 'Implant', efficacy: 99.95, type: 'hormonal', admin: 'PA', returnYears: 3 },
  CU_IUD: { id: 'CU_IUD', name: 'Copper IUD (Cu-T)', abbr: 'Cu-IUD', efficacy: 99.9, type: 'non-hormonal', admin: 'PA', returnYears: 10 },
  LNG_IUS: { id: 'LNG_IUS', name: 'LNG Intrauterine System (Mirena)', abbr: 'LNG-IUS', efficacy: 99.9, type: 'hormonal', admin: 'PA', returnYears: 5 },
  CONDOM_M: { id: 'CONDOM_M', name: 'Male Condom', abbr: 'Condom (M)', efficacy: 98, type: 'barrier', admin: 'self' },
  CONDOM_F: { id: 'CONDOM_F', name: 'Female Condom', abbr: 'Condom (F)', efficacy: 95, type: 'barrier', admin: 'self' },
  LAM: { id: 'LAM', name: 'Lactational Amenorrhoea Method', abbr: 'LAM', efficacy: 98, type: 'natural', admin: 'self' },
  FAM: { id: 'FAM', name: 'Fertility Awareness Method / Cycle Beads', abbr: 'FAM', efficacy: 95, type: 'natural', admin: 'self' },
  BTL: { id: 'BTL', name: 'Female Sterilisation (BTL)', abbr: 'BTL', efficacy: 99.5, type: 'permanent', admin: 'surgical' },
  VASECTOMY: { id: 'VASECTOMY', name: 'Male Sterilisation (Vasectomy)', abbr: 'Vasectomy', efficacy: 99.9, type: 'permanent', admin: 'surgical' },
  EC_PILL: { id: 'EC_PILL', name: 'Emergency Contraceptive Pills', abbr: 'ECP', efficacy: 85, type: 'emergency', admin: 'oral' },
  EC_IUD: { id: 'EC_IUD', name: 'Emergency Cu-IUD', abbr: 'EC-IUD', efficacy: 99.9, type: 'emergency', admin: 'PA' },
};

// MEC Eligibility Matrix - conditions mapped to method categories
// Format: condition_key: { METHOD_ID: category }
export const MEC_MATRIX = {
  // PREGNANCY
  pregnant: {
    COC: 4, POP: 4, DMPA_IM: 4, DMPA_SC: 4, NET_EN: 4,
    IMPLANT: 4, CU_IUD: 4, LNG_IUS: 4, LAM: 1, FAM: 1,
    CONDOM_M: 1, CONDOM_F: 1, BTL: 4, VASECTOMY: 1
  },

  // POSTPARTUM - BREASTFEEDING
  pp_bf_lt6wks: {
    COC: 4, POP: 2, DMPA_IM: 2, DMPA_SC: 2, NET_EN: 2,
    IMPLANT: 2, CU_IUD: 2, LNG_IUS: 2, CONDOM_M: 1, CONDOM_F: 1,
    LAM: 1, FAM: 2
  },
  pp_bf_6wks_6mo: {
    COC: 3, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1, CONDOM_M: 1, CONDOM_F: 1,
    LAM: 1, FAM: 1
  },
  pp_bf_gt6mo: {
    COC: 2, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1, CONDOM_M: 1, CONDOM_F: 1,
    LAM: 3, FAM: 1
  },

  // POSTPARTUM - NOT BREASTFEEDING
  pp_no_bf_lt48hrs: {
    COC: 3, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1
  },
  pp_no_bf_48hrs_4wks: {
    COC: 2, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 2, LNG_IUS: 2
  },
  pp_no_bf_gt4wks: {
    COC: 1, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1
  },

  // PERSONAL CHARACTERISTICS
  adolescent: {
    COC: 1, POP: 1, DMPA_IM: 2, DMPA_SC: 2, NET_EN: 2,
    IMPLANT: 1, CU_IUD: 2, LNG_IUS: 2, CONDOM_M: 1, CONDOM_F: 1,
    BTL: 2, VASECTOMY: 2
  },
  obesity_bmi_gte30: {
    COC: 2, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1
  },
  smoker_lt35: {
    COC: 2, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1, IMPLANT: 1
  },
  smoker_gte35: {
    COC: 4, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1, IMPLANT: 1
  },
  nulliparity: {
    CU_IUD: 2, LNG_IUS: 2
  },

  // CARDIOVASCULAR
  htn_systolic_140_159: {
    COC: 3, POP: 1, DMPA_IM: 2, DMPA_SC: 2, NET_EN: 2,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1
  },
  htn_systolic_gte160: {
    COC: 4, POP: 2, DMPA_IM: 3, DMPA_SC: 3, NET_EN: 3,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 2
  },
  history_dvt_pe: {
    COC: 4, POP: 2, DMPA_IM: 2, DMPA_SC: 2, NET_EN: 2,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 2
  },
  ischaemic_heart_disease: {
    COC: 4, POP: 2, DMPA_IM: 3, DMPA_SC: 3, NET_EN: 3,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 2
  },
  stroke: {
    COC: 4, POP: 2, DMPA_IM: 3, DMPA_SC: 3, NET_EN: 3,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 2
  },
  valvular_complicated: {
    COC: 4, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 2, LNG_IUS: 2
  },

  // MIGRAINE
  migraine_no_aura_lt35: {
    COC: 2, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1, IMPLANT: 1
  },
  migraine_no_aura_gte35: {
    COC: 3, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1, IMPLANT: 1
  },
  migraine_with_aura: {
    COC: 4, POP: 2, DMPA_IM: 2, DMPA_SC: 2, NET_EN: 2,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 2
  },

  // DIABETES
  diabetes_no_complications: {
    COC: 2, POP: 2, DMPA_IM: 2, DMPA_SC: 2, NET_EN: 2,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 2
  },
  diabetes_with_complications: {
    COC: 3, POP: 2, DMPA_IM: 2, DMPA_SC: 2, NET_EN: 2,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 2
  },
  diabetes_nephropathy_retinopathy: {
    COC: 4, POP: 2, DMPA_IM: 2, DMPA_SC: 2, NET_EN: 2,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 2
  },

  // LIVER
  viral_hepatitis_active: {
    COC: 3, POP: 3, DMPA_IM: 3, DMPA_SC: 3, NET_EN: 3,
    IMPLANT: 3, CU_IUD: 1, LNG_IUS: 3
  },
  cirrhosis_severe: {
    COC: 4, POP: 3, DMPA_IM: 3, DMPA_SC: 3, NET_EN: 3,
    IMPLANT: 3, CU_IUD: 1, LNG_IUS: 3
  },
  liver_tumour_benign: {
    COC: 4, POP: 3, DMPA_IM: 3, DMPA_SC: 3, NET_EN: 3,
    IMPLANT: 3, CU_IUD: 1, LNG_IUS: 3
  },
  liver_tumour_malignant: {
    COC: 4, POP: 4, DMPA_IM: 4, DMPA_SC: 4, NET_EN: 4,
    IMPLANT: 4, CU_IUD: 1, LNG_IUS: 4
  },

  // BREAST
  breast_cancer_current: {
    COC: 4, POP: 4, DMPA_IM: 4, DMPA_SC: 4, NET_EN: 4,
    IMPLANT: 4, CU_IUD: 1, LNG_IUS: 4
  },
  breast_cancer_past_5yrs: {
    COC: 4, POP: 4, DMPA_IM: 4, DMPA_SC: 4, NET_EN: 4,
    IMPLANT: 4, CU_IUD: 1, LNG_IUS: 4
  },
  breast_cancer_family_history: {
    COC: 1, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1
  },

  // CERVICAL
  cervical_cancer_awaiting_treatment: {
    COC: 2, POP: 1, DMPA_IM: 2, DMPA_SC: 2, NET_EN: 2,
    IMPLANT: 1, CU_IUD: 4, LNG_IUS: 4
  },
  cervical_intraepithelial_neoplasia: {
    COC: 2, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1
  },

  // HIV
  hiv_high_risk: {
    COC: 1, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1, CONDOM_M: 1, CONDOM_F: 1
  },
  hiv_positive_stage1_2: {
    COC: 1, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 2, LNG_IUS: 2, CONDOM_M: 1, CONDOM_F: 1
  },
  hiv_positive_stage3_4: {
    COC: 1, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 2, CU_IUD: 3, LNG_IUS: 3, CONDOM_M: 1, CONDOM_F: 1
  },

  // ARV INTERACTIONS
  arv_rifampicin: {
    COC: 3, POP: 3, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 3, CU_IUD: 1, LNG_IUS: 1
  },
  arv_nnrti_efavirenz: {
    COC: 2, POP: 2, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 1
  },
  arv_ritonavir_boosted_pi: {
    COC: 3, POP: 3, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 2
  },

  // ANTICONVULSANTS (CYP3A4 inducers)
  anticonvulsants_cyp3a4: {
    COC: 3, POP: 3, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 2, CU_IUD: 1, LNG_IUS: 1
  },

  // REPRODUCTIVE
  unexplained_vaginal_bleeding: {
    COC: 2, POP: 2, DMPA_IM: 3, DMPA_SC: 3, NET_EN: 3,
    IMPLANT: 3, CU_IUD: 4, LNG_IUS: 4
  },
  uterine_fibroids: {
    COC: 1, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 2, LNG_IUS: 2
  },
  past_ectopic: {
    COC: 1, POP: 2, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 3, LNG_IUS: 3
  },
  current_pid: {
    COC: 1, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 4, LNG_IUS: 4
  },
  current_sti: {
    COC: 1, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 4, LNG_IUS: 4
  },
  sepsis_puerperal: {
    CU_IUD: 4, LNG_IUS: 4
  },

  // EPILEPSY
  epilepsy: {
    COC: 1, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1
  },

  // DEPRESSION
  depression: {
    COC: 1, POP: 1, DMPA_IM: 1, DMPA_SC: 1, NET_EN: 1,
    IMPLANT: 1, CU_IUD: 1, LNG_IUS: 1
  },
};

// Return date calculator
export function calculateReturnDate(method, dispensedDate = new Date(), takeHomeDoses = 0) {
  const date = new Date(dispensedDate)
  switch(method) {
    case 'DMPA_IM':
      date.setDate(date.getDate() + 84)  // 12 weeks
      break
    case 'DMPA_SC':
      // Each dose = 13 weeks. Take-home doses extend the return date
      const doses = parseInt(takeHomeDoses) || 0
      date.setDate(date.getDate() + (91 * (doses + 1)))  // 13 weeks x (given + takehome)
      break
    case 'NET_EN':
      date.setDate(date.getDate() + 56)  // 8 weeks
      break
    case 'COC':
    case 'POP':
      date.setMonth(date.getMonth() + 3)
      break
    case 'IMPLANT':
      date.setFullYear(date.getFullYear() + 3)
      break
    case 'CU_IUD':
      date.setFullYear(date.getFullYear() + 10)
      break
    case 'LNG_IUS':
      date.setFullYear(date.getFullYear() + 5)
      break
    case 'LAM':
      date.setMonth(date.getMonth() + 6)
      break
    default:
      date.setMonth(date.getMonth() + 3)
  }
  return date
}

// Core eligibility calculator
export function calculateEligibility(activeConditions) {
  const results = {};

  Object.keys(METHODS).forEach(methodId => {
    let maxCategory = 1;
    let triggeringConditions = [];

    activeConditions.forEach(condition => {
      if (MEC_MATRIX[condition] && MEC_MATRIX[condition][methodId]) {
        const cat = MEC_MATRIX[condition][methodId];
        if (cat > maxCategory) {
          maxCategory = cat;
          triggeringConditions = [condition];
        } else if (cat === maxCategory && cat > 1) {
          triggeringConditions.push(condition);
        }
      }
    });

    results[methodId] = {
      method: METHODS[methodId],
      category: maxCategory,
      canUse: maxCategory <= 2,
      needsJudgment: maxCategory === 3,
      contraindicated: maxCategory === 4,
      reasons: triggeringConditions,
    };
  });

  // Sort by efficacy descending, then by category ascending
  return Object.values(results).sort((a, b) => {
    if (a.category !== b.category) return a.category - b.category;
    return b.method.efficacy - a.method.efficacy;
  });
}

// Auto-detect conditions from vitals
export function deriveConditionsFromVitals(vitals, demographics) {
  const conditions = [];

  // BMI
  if (vitals.bmi >= 30) conditions.push('obesity_bmi_gte30');

  // Blood pressure
  if (vitals.bp_systolic >= 160 || vitals.bp_diastolic >= 100) {
    conditions.push('htn_systolic_gte160');
  } else if (vitals.bp_systolic >= 140 || vitals.bp_diastolic >= 90) {
    conditions.push('htn_systolic_140_159');
  }

  // Age + smoking
  if (demographics.smoker) {
    if (demographics.age >= 35) conditions.push('smoker_gte35');
    else conditions.push('smoker_lt35');
  }

  // Adolescent
  if (demographics.age < 18) conditions.push('adolescent');

  return conditions;
}