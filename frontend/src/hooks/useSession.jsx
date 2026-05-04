import { createContext, useContext, useState } from 'react'

const SessionContext = createContext(null)

export const initialSession = {
  client: {
    service_reg_number: '',
    first_name: '',
    last_name: '',
    age: '',
    sex: '',
    telephone: '',
    location: '',
    disability_status: 0,
    visit_type: '',
    first_ever_user: '',
  },
  vitals: {
    weight_kg: '',
    height_cm: '',
    bmi: null,
    bp_systolic: '',
    bp_diastolic: '',
    bp_category: '',
  },
  pregnancy: {
    pdt_done: false,
    pdt_result: '',
    checklist: {
      q1_lam: false,
      q2_abstained: false,
      q3_recent_birth: false,
      q4_recent_period: false,
      q5_recent_abortion: false,
      q6_contraceptive: false,
    },
    ruled_out: false,
  },
  conditions: [],
  conditionDetails: {},
  selectedMethod: null,
  methodVisitCategory: '',
  methodChangeReason: '',
  quantityDispensed: '',
  dmpaAdminType: '',
  dmpaTakeHomeDoses: '',
  larcRemovalReason: '',
  counsellingDone: false,
  comprehensionConfirmed: false,
  sti: {
    hiv_counselled: false,
    hiv_tested: false,
    hiv_status: '',
    hiv_who_stage: '',
    tb_status: '',
    ipv_status: '',
    cervical_screening_method: '',
    cervical_screening_result: '',
    condoms_dispensed: false,
    condom_type: '',
    condom_qty: '',
    natural_fp_counselled: false,
    cycle_beads_given: false,
    ppfp_timing: '',
    referral_in: '',
    referral_out: '',
    remarks: '',
  },
  returnDate: null,
  sessionDate: new Date().toISOString(),
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(initialSession)

  // Deep update for nested sections
  const updateSession = (section, data) => {
    setSession(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && !Array.isArray(prev[section])
        ? { ...prev[section], ...data }
        : data
    }))
  }

  const resetSession = () => {
    setSession({
      client: {
        service_reg_number: '',
        first_name: '',
        last_name: '',
        age: '',
        sex: '',
        telephone: '',
        location: '',
        disability_status: 0,
        visit_type: '',
        first_ever_user: '',
      },
      vitals: {
        weight_kg: '',
        height_cm: '',
        bmi: null,
        bp_systolic: '',
        bp_diastolic: '',
        bp_category: '',
      },
      pregnancy: {
        pdt_done: false,
        pdt_result: '',
        checklist: {
          q1_lam: false,
          q2_abstained: false,
          q3_recent_birth: false,
          q4_recent_period: false,
          q5_recent_abortion: false,
          q6_contraceptive: false,
        },
        ruled_out: false,
      },
      conditions: [],
      conditionDetails: {},
      selectedMethod: null,
      methodVisitCategory: '',
      methodChangeReason: '',
      quantityDispensed: '',
      dmpaAdminType: '',
      dmpaTakeHomeDoses: '',
      larcRemovalReason: '',
      counsellingDone: false,
      comprehensionConfirmed: false,
      sti: {
        hiv_counselled: false,
        hiv_tested: false,
        hiv_status: '',
        hiv_who_stage: '',
        tb_status: '',
        ipv_status: '',
        cervical_screening_method: '',
        cervical_screening_result: '',
        condoms_dispensed: false,
        condom_type: '',
        condom_qty: '',
        natural_fp_counselled: false,
        cycle_beads_given: false,
        ppfp_timing: '',
        referral_in: '',
        referral_out: '',
        remarks: '',
      },
      returnDate: null,
      sessionDate: new Date().toISOString(),
    })
  }

  return (
    <SessionContext.Provider value={{ session, updateSession, setSession, resetSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within SessionProvider')
  return context
}