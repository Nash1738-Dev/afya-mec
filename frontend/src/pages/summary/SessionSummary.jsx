import { useNavigate } from 'react-router-dom'
import { useSession } from '../../hooks/useSession.jsx'
import { saveSession } from '../../utils/api.js'
import * as XLSX from 'xlsx'
import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Download, RotateCcw, Calendar, User, Activity } from 'lucide-react'
import { getFacilitySettings } from '../../utils/facilitySettings.js'

const METHOD_NAMES = {
  COC:'COC', POP:'POP', DMPA_IM:'DMPA-IM', DMPA_SC:'DMPA-SC',
  NET_EN:'NET-EN', IMPLANT:'Implant', CU_IUD:'Cu-IUD', LNG_IUS:'LNG-IUS',
  CONDOM_M:'Condom (M)', CONDOM_F:'Condom (F)', LAM:'LAM', FAM:'FAM',
  BTL:'BTL', VASECTOMY:'Vasectomy', EC_PILL:'ECP', EC_IUD:'EC-IUD',
}

export default function SessionSummary() {
  const navigate = useNavigate()
  const { session, resetSession } = useSession()
  const [saved, setSaved] = useState(null)
  const [saving, setSaving] = useState(false)
  const saveAttempted = useRef(false)
  const facility = getFacilitySettings()

  const c = session.client
  const v = session.vitals
  const s = session.sti

  const returnDate = session.returnDate
    ? new Date(session.returnDate).toLocaleDateString('en-KE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : '—'

  const scheduleSIReminder = async (savedData) => {
    if (session.selectedMethod !== 'DMPA_SC' || session.dmpa_sc_mode !== 'SI') return
    if (!session.client?.telephone) return

    const doses = session.dmpa_sc_si_doses || 1
    const firstDate = session.returnDate || new Date(
      Date.now() + 13 * 7 * 24 * 60 * 60 * 1000
    ).toISOString()

    try {
      const facilitySettings = getFacilitySettings()
      await fetch('/api/sms/schedule-si-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('afyamec_auth_token')}`
        },
        body: JSON.stringify({
          client_id: savedData?.client_id || session.client?.id,
          client_name: `${session.client.first_name} ${session.client.last_name}`,
          phone: session.client.telephone,
          doses,
          first_injection_date: firstDate,
          facility_name: facilitySettings.facility_name || 'AfyaMEC Facility'
        })
      })
      console.log(`✅ SI reminders scheduled for ${doses} dose(s)`)
    } catch (e) {
      console.error('SI reminder scheduling failed:', e)
    }
  }

  // Check if this was an anonymous full assessment
  const isAnon = session.client?.is_anonymous === true

  // Auto-save once when component mounts
  useEffect(() => {
    if (saveAttempted.current) return
    saveAttempted.current = true

    const autoSave = async () => {
      setSaving(true)
      
      const sessionPayload = {
        ...session,
        client: {
          ...session.client,
          dmpa_sc_mode: session.dmpa_sc_mode || null,
          dmpa_sc_si_doses: session.dmpa_sc_si_doses || 1,
          si_training_status: session.si_training_status || null,
          takehome_doses: session.dmpa_sc_mode === 'SI'  ? Math.max(0, (session.dmpa_sc_si_doses || 1) - 1)  : 0,
        }
      }

      const result = await saveSession(sessionPayload)
      setSaving(false)
      if (result.success) {
        setSaved(result.offline ? 'offline' : 'online')
        await scheduleSIReminder(result)
        // Clean up anonymous session data
        sessionStorage.removeItem('anon_session')
      } else {
        setSaved('error')
      }
    }
    autoSave()
  }, [session])

  const handleNewSession = () => {
    resetSession()
    setTimeout(() => {
      window.location.href = '/session/registration'
    }, 100)
  }

  const handlePrint = () => {
    navigate('/session/print')
  }

  const exportToExcel = () => {
    const p = session.pregnancy

    const row = {
      'Facility Name': facility.facility_name || '',
      'Facility Code': facility.facility_code || '',
      'County': facility.county || '',
      'Sub-County': facility.sub_county || '',
      'Ward': facility.ward || '',
      'Provider Name': facility.provider_name || '',
      'Provider Cadre': facility.provider_cadre || '',
      'Provider Reg No': facility.provider_number || '',
      'A: Visit Date': new Date(session.sessionDate).toLocaleDateString('en-KE'),
      'B: Reg Number': c.service_reg_number || '',
      'C: First Name': c.first_name || '',
      'C: Last Name': c.last_name || '',
      'D: Visit Type': c.visit_type === '1' ? 'New' : c.visit_type === '2' ? 'Revisit' : '',
      'E: First Ever FP User': c.first_ever_user === 'true' ? 'Y' : 'N',
      'F: Age': c.age || '',
      'G: Sex': c.sex || '',
      'H: Disability Status': c.disability_status || 0,
      'I: Telephone': c.telephone || '',
      'J: Location': c.location || '',
      'Weight (kg)': v.weight_kg || '',
      'Height (cm)': v.height_cm || '',
      'BMI': v.bmi || '',
      'BP Systolic': v.bp_systolic || '',
      'BP Diastolic': v.bp_diastolic || '',
      'BP Category': v.bp_category || '',
      'PDT Done': p.pdt_done ? 'Y' : 'N',
      'PDT Result': p.pdt_result || '',
      'Pregnancy Ruled Out': p.ruled_out ? 'Y' : 'N',
      'WHO Q1 LAM': p.checklist?.q1_lam ? 'Y' : 'N',
      'WHO Q2 Abstained': p.checklist?.q2_abstained ? 'Y' : 'N',
      'WHO Q3 Recent Birth': p.checklist?.q3_recent_birth ? 'Y' : 'N',
      'WHO Q4 Recent Period': p.checklist?.q4_recent_period ? 'Y' : 'N',
      'WHO Q5 Abortion': p.checklist?.q5_recent_abortion ? 'Y' : 'N',
      'WHO Q6 Contraceptive': p.checklist?.q6_contraceptive ? 'Y' : 'N',
      'Active MEC Conditions': (session.conditions || []).join(', '),
      'Primary Method': METHOD_NAMES[session.selectedMethod] || session.selectedMethod || '',
      'Method Visit Category': session.methodVisitCategory || '',
      'Method Change Reason': session.methodChangeReason || '',
      'Quantity Dispensed': session.quantityDispensed || '',
      'DMPA Admin Type': session.dmpaAdminType || '',
      'DMPA Take-Home Doses': session.dmpaTakeHomeDoses || '',
      'LARC Removal Reason': session.larcRemovalReason || '',
      'Counselling Done': session.counsellingDone ? 'Y' : 'N',
      'Comprehension Confirmed': session.comprehensionConfirmed ? 'Y' : 'N',
      'AH: PPFP Timing': s.ppfp_timing || '',
      'AJ: HIV Counselled': s.hiv_counselled ? 'Y' : 'N',
      'AK: HIV Tested': s.hiv_tested ? 'Y' : 'N',
      'AL: HIV Status': s.hiv_status || '',
      'AM: IPV Status': s.ipv_status || '',
      'AN: Cervical Screening Method': s.cervical_screening_method || '',
      'AO: Cervical Screening Result': s.cervical_screening_result || '',
      'AI: TB Status': s.tb_status || '',
      'AB: Condom Client Sex': s.condom_type || '',
      'AC/AD: Condoms Qty': s.condom_qty || '',
      'AF: Natural FP Counselled': s.natural_fp_counselled ? 'Y' : 'N',
      'AG: Cycle Beads Given': s.cycle_beads_given ? 'Y' : 'N',
      'AP: Referral In': s.referral_in || '',
      'AQ: Referral Out': s.referral_out || '',
      'AR: Remarks': s.remarks || '',
      'DISC: DMPA-SC Mode': session.dmpa_sc_mode || '',
      'DISC: SI Doses Dispensed': session.dmpa_sc_si_doses || '',
      'DISC: SI Training Status': session.si_training_status || '',
      'Return Date': session.returnDate
        ? new Date(session.returnDate).toLocaleDateString('en-KE')
        : '',
    }

    const ws = XLSX.utils.json_to_sheet([row])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'MOH 512')
    ws['!cols'] = Object.keys(row).map(() => ({ wch: 24 }))
    const filename = `MOH512_${c.last_name}_${c.first_name}_${new Date().toISOString().slice(0,10)}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Success Header */}
      <div className="text-center mb-4">
        <div className="flex justify-center mb-3">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle size={40} className="text-green-500"/>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Session Complete</h2>
        <p className="text-gray-500 text-sm mt-1">
          BCS+ session completed for{' '}
          {isAnon
            ? <strong className="text-teal-600">Anonymous Client ({session.client?.anon_age_bracket} yrs, {session.client?.anon_sex})</strong>
            : <strong>{c.first_name} {c.last_name}</strong>
          }
        </p>
      </div>

      {/* Save Status */}
      <div className={`flex items-center justify-center gap-2 text-sm mb-4 py-2 px-4 rounded-lg
        ${saving ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          saved === 'online' ? 'bg-green-50 text-green-700 border border-green-200' :
          saved === 'offline' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
          saved === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-gray-50 text-gray-400 border border-gray-200'}`}>
        {saving ? '⏳ Saving session...' :
         saved === 'online' ? '✅ Session saved to database' :
         saved === 'offline' ? '📱 Saved offline — will sync when connected' :
         saved === 'error' ? '⚠️ Not saved — check backend connection' :
         '⏳ Preparing...'}
      </div>

      {/* Return Date Banner */}
      {session.returnDate && (
        <div className="bg-blue-600 text-white rounded-xl p-4 mb-4 flex items-center gap-3">
          <Calendar size={28} className="flex-shrink-0"/>
          <div>
            <p className="text-sm text-blue-200">Next Return Visit</p>
            <p className="font-bold text-lg">{returnDate}</p>
            {session.dmpaAdminType === 'SI' && session.dmpaTakeHomeDoses && (
              <p className="text-xs text-blue-200 mt-1">
                🏠 Includes {session.dmpaTakeHomeDoses} take-home dose(s) for self-injection
              </p>
            )}
          </div>
        </div>
      )}

      {/* Client + Vitals */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-blue-500"/>
            <h3 className="font-bold text-gray-700 text-sm">Client</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">Name: </span>
              {isAnon
                ? <strong className="text-teal-600">Anonymous Client
                    <span className="ml-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-normal">anon</span>
                  </strong>
                : <strong>{c.first_name} {c.last_name}</strong>
              }
            </p>
            {isAnon && (
              <p><span className="text-gray-500">Age bracket: </span>{c.anon_age_bracket} yrs</p>
            )}
            <p><span className="text-gray-500">Age: </span>{c.age} yrs ({c.sex})</p>
            <p><span className="text-gray-500">Tel: </span>{c.telephone || '—'}</p>
            <p><span className="text-gray-500">Location: </span>{c.location || '—'}</p>
            <p><span className="text-gray-500">Visit: </span>
              {c.visit_type === '1' ? 'New Client' : 'Revisit'}</p>
            <p><span className="text-gray-500">Reg No: </span>
              {c.service_reg_number || '—'}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-green-500"/>
            <h3 className="font-bold text-gray-700 text-sm">Vitals</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">BP: </span>
              <strong>{v.bp_systolic}/{v.bp_diastolic} mmHg</strong>
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full
                ${v.bp_category === 'Normal' ? 'bg-green-100 text-green-700' :
                  v.bp_category === 'Elevated' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'}`}>
                {v.bp_category}
              </span>
            </p>
            <p><span className="text-gray-500">Weight: </span>{v.weight_kg} kg</p>
            <p><span className="text-gray-500">Height: </span>
              {v.height_cm ? `${v.height_cm} cm` : '—'}</p>
            <p><span className="text-gray-500">BMI: </span>{v.bmi || '—'}
              {v.bmi >= 30 &&
                <span className="ml-1 text-xs text-orange-600">⚠ Obese</span>}
            </p>
            <p><span className="text-gray-500">Pregnancy: </span>
              {session.pregnancy.ruled_out ? '✅ Ruled out' : '⚠ Not excluded'}
            </p>
          </div>
        </div>
      </div>

      {/* Method */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
          Method Dispensed
        </h3>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xl font-bold text-blue-700">
              {METHOD_NAMES[session.selectedMethod] || '—'}
            </p>
            <div className="space-y-0.5 mt-1 text-sm text-gray-500">
              {session.quantityDispensed &&
                <p>Qty: {session.quantityDispensed}</p>}
              {session.dmpaAdminType &&
                <p>Admin: {session.dmpaAdminType}</p>}
              {session.dmpaAdminType === 'SI' && session.dmpaTakeHomeDoses && (
                <p className="text-blue-600 font-medium">
                  🏠 {session.dmpaTakeHomeDoses} take-home vial(s)
                </p>
              )}
              {session.methodChangeReason &&
                <p>Change reason: {session.methodChangeReason}</p>}
              <p>Counselling: {session.counsellingDone ? '✅ Done' : '❌ Not done'}</p>
              <p>Comprehension: {session.comprehensionConfirmed
                ? '✅ Confirmed' : '⚠ Needs reinforcement'}</p>
            </div>
          </div>
          <CheckCircle size={32} className="text-green-500"/>
        </div>
        {(session.conditions || []).length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-1">
              Active MEC Conditions:
            </p>
            <div className="flex flex-wrap gap-1">
              {session.conditions.map(cond => (
                <span key={cond}
                  className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                  {cond.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Screening Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
          Screen Summary
        </h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          {[
            ['HIV Counselled', s.hiv_counselled ? '✅ Yes' : '❌ No'],
            ['HIV Tested', s.hiv_tested ? '✅ Yes' : '❌ No'],
            ['HIV Status', s.hiv_status ? `Code ${s.hiv_status}` : '—'],
            ['TB Status', s.tb_status ? `Code ${s.tb_status}` : '—'],
            ['IPV Screening', s.ipv_status ? `Code ${s.ipv_status}` : '—'],
            ['Cervical Screening', s.cervical_screening_method || '—'],
            ['Cervical Result', s.cervical_screening_result
              ? `Code ${s.cervical_screening_result}` : '—'],
            ['Condoms', s.condoms_dispensed
              ? `${s.condom_qty || '?'} (${s.condom_type || '?'})` : '❌ No'],
            ['Natural FP', s.natural_fp_counselled ? '✅ Counselled' : '—'],
            ['Cycle Beads', s.cycle_beads_given ? '✅ Given' : '—'],
            ['PPFP Timing', s.ppfp_timing ? `Code ${s.ppfp_timing}` : '—'],
            ['Referral In', s.referral_in ? `Code ${s.referral_in}` : 'None'],
            ['Referral Out', s.referral_out ? `Code ${s.referral_out}` : 'None'],
          ].map(([label, val]) => (
            <div key={label}>
              <span className="text-gray-500">{label}: </span>
              <span className="font-medium">{val}</span>
            </div>
          ))}
        </div>
        {s.remarks && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
            <strong>Remarks:</strong> {s.remarks}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">

        {/* Manual Save Button */}
        <button
          onClick={async () => {
            setSaving(true)
            const sessionPayload = {
              ...session,
              client: {
                ...session.client,
                dmpa_sc_mode: session.dmpa_sc_mode || null,
                dmpa_sc_si_doses: session.dmpa_sc_si_doses || 1,
                si_training_status: session.si_training_status || null,
                takehome_doses: session.dmpa_sc_mode === 'SI'  ? Math.max(0, (session.dmpa_sc_si_doses || 1) - 1)  : 0,
              }
            }
            const result = await saveSession(sessionPayload)
            setSaving(false)
            if (result.success) {
              setSaved(result.offline ? 'offline' : 'online')
              await scheduleSIReminder(result)
              alert('✅ Session saved successfully!')
            } else {
              alert('❌ Save failed — check backend connection')
            }
          }}
          disabled={saving || saved === 'online'}
          className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-xl transition-colors
            ${saved === 'online'
              ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-md'}`}>
          {saved === 'online' ? '✅ Already Saved to Database' :
           saving ? '⏳ Saving...' : '💾 Save to Database'}
        </button>

        <button onClick={exportToExcel}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-colors text-base">
          <Download size={20}/> Download MOH 512 Excel Export
        </button>

        <button onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-colors">
          🖨️ Print / Save as PDF
        </button>

        <button onClick={handleNewSession}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
          <RotateCcw size={18}/> Start New Client Session
        </button>

        <button onClick={() => { resetSession(); setTimeout(() => { window.location.href = '/' }, 100) }}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-xl border border-gray-300 transition-colors">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}