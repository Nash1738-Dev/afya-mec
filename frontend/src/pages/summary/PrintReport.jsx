import { useSession } from '../../hooks/useSession.jsx'
import { useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'
import { getFacilitySettings } from '../../utils/facilitySettings.js'

const METHOD_NAMES = {
  COC:'Combined Oral Contraceptive (COC)',
  POP:'Progestogen-Only Pill (POP)',
  DMPA_IM:'DMPA Injection — Depo-Provera (DMPA-IM)',
  DMPA_SC:'DMPA-SC — Sayana Press',
  NET_EN:'NET-EN — Noristerat',
  IMPLANT:'Contraceptive Implant (Implanon/Jadelle)',
  CU_IUD:'Copper IUD (Cu-T)',
  LNG_IUS:'LNG-IUS — Mirena',
  CONDOM_M:'Male Condom',
  CONDOM_F:'Female Condom',
  LAM:'Lactational Amenorrhoea Method (LAM)',
  FAM:'Fertility Awareness Method (FAM)',
  BTL:'Female Sterilisation (BTL)',
  VASECTOMY:'Vasectomy',
  EC_PILL:'Emergency Contraceptive Pills',
  EC_IUD:'Emergency Cu-IUD',
}

export default function PrintReport() {
  const { session } = useSession()
  const navigate = useNavigate()
  const c = session.client
  const v = session.vitals
  const s = session.sti
  const p = session.pregnancy
  const facility = getFacilitySettings()

  const returnDate = session.returnDate
    ? new Date(session.returnDate).toLocaleDateString('en-KE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : '—'

  const Row = ({ label, value }) => (
    <tr className="border-b border-gray-100">
      <td className="py-1.5 pr-4 text-gray-500 text-sm font-medium w-48">{label}</td>
      <td className="py-1.5 text-gray-800 text-sm font-semibold">{value || '—'}</td>
    </tr>
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* Screen-only controls */}
      <div className="print:hidden flex items-center justify-between mb-4">
        <button onClick={() => navigate('/session/summary')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft size={15}/> Back to Summary
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors">
          <Printer size={16}/> Print / Save as PDF
        </button>
      </div>

      {/* Printable content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 print:shadow-none print:border-none print:p-4">

        {/* Header */}
        <div className="text-center border-b-2 border-blue-700 pb-4 mb-6">
          <h1 className="text-xl font-bold text-blue-800">KENYA MINISTRY OF HEALTH</h1>
          <h2 className="text-lg font-bold text-gray-700">Family Planning Counselling Record</h2>
          {facility.facility_name && (
            <div className="mt-2 bg-blue-50 rounded-lg p-2">
              <p className="font-bold text-blue-800">{facility.facility_name}</p>
              <p className="text-xs text-blue-600">
                {[facility.ward, facility.sub_county, facility.county].filter(Boolean).join(', ')}
                {facility.facility_code && ` | KHIS Code: ${facility.facility_code}`}
              </p>
              {facility.provider_name && (
                <p className="text-xs text-blue-600 mt-0.5">
                  Provider: {facility.provider_name}
                  {facility.provider_cadre && ` (${facility.provider_cadre})`}
                  {facility.provider_number && ` | Reg: ${facility.provider_number}`}
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Digital MEC Platform — WHO MEC 6th Edition (2025) | BCS+ Protocol
          </p>
          <p className="text-sm text-gray-500">
            Date: {new Date(session.sessionDate).toLocaleDateString('en-KE', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        {/* Client Details */}
        <div className="mb-6">
          <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
            A. Client Identification
          </h3>
          <table className="w-full">
            <tbody>
              <Row label="Registration Number" value={c.service_reg_number} />
              <Row label="Full Name" value={`${c.first_name} ${c.last_name}`} />
              <Row label="Age" value={`${c.age} years`} />
              <Row label="Sex" value={c.sex === 'F' ? 'Female' : c.sex === 'M' ? 'Male' : c.sex} />
              <Row label="Telephone" value={c.telephone} />
              <Row label="Location / Landmark" value={c.location} />
              <Row label="Disability Status" value={c.disability_status == 0 ? 'None' : `Code ${c.disability_status}`} />
              <Row label="Visit Type" value={c.visit_type === '1' ? 'New Client' : 'Revisit'} />
              <Row label="First Ever FP User" value={c.first_ever_user === 'true' ? 'Yes' : 'No'} />
            </tbody>
          </table>
        </div>

        {/* Vitals */}
        <div className="mb-6">
          <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
            B. Vital Signs
          </h3>
          <table className="w-full">
            <tbody>
              <Row label="Blood Pressure" value={`${v.bp_systolic}/${v.bp_diastolic} mmHg (${v.bp_category})`} />
              <Row label="Weight" value={v.weight_kg ? `${v.weight_kg} kg` : null} />
              <Row label="Height" value={v.height_cm ? `${v.height_cm} cm` : null} />
              <Row label="BMI" value={v.bmi ? `${v.bmi} ${v.bmi >= 30 ? '(Obese — MEC trigger)' : v.bmi >= 25 ? '(Overweight)' : '(Normal)'}` : null} />
            </tbody>
          </table>
        </div>

        {/* Pregnancy */}
        <div className="mb-6">
          <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
            C. Pregnancy Exclusion
          </h3>
          <table className="w-full">
            <tbody>
              <Row label="PDT Done" value={p.pdt_done ? 'Yes' : 'No'} />
              <Row label="PDT Result" value={p.pdt_result || 'N/A'} />
              <Row label="Pregnancy Ruled Out" value={p.ruled_out ? '✓ Yes — Safe to proceed' : '✗ Not ruled out'} />
            </tbody>
          </table>
        </div>

        {/* MEC Conditions */}
        {(session.conditions || []).length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
              D. Active MEC Conditions
            </h3>
            <div className="flex flex-wrap gap-2">
              {session.conditions.map(cond => (
                <span key={cond} className="bg-orange-50 border border-orange-200 text-orange-700 text-xs px-3 py-1 rounded-full">
                  {cond.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Method */}
        <div className="mb-6">
          <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
            E. Contraceptive Method Dispensed
          </h3>
          <table className="w-full">
            <tbody>
              <Row label="Method" value={METHOD_NAMES[session.selectedMethod] || session.selectedMethod} />
              <Row label="Quantity Dispensed" value={session.quantityDispensed} />
              <Row label="Administration Type" value={session.dmpaAdminType} />
              {session.dmpaAdminType === 'SI' && (
                <Row label="Take-Home Doses" value={session.dmpaTakeHomeDoses ? `${session.dmpaTakeHomeDoses} vial(s) for self-injection` : null} />
              )}
              <Row label="Counselling Done" value={session.counsellingDone ? 'Yes' : 'No'} />
              <Row label="Comprehension Confirmed" value={session.comprehensionConfirmed ? 'Yes' : 'Needs reinforcement'} />
            </tbody>
          </table>
        </div>

        {/* STI/HIV */}
        <div className="mb-6">
          <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
            F. STI / HIV / Preventive Screening
          </h3>
          <table className="w-full">
            <tbody>
              <Row label="HIV Counselled" value={s.hiv_counselled ? 'Yes' : 'No'} />
              <Row label="HIV Tested" value={s.hiv_tested ? 'Yes' : 'No'} />
              <Row label="HIV Status" value={s.hiv_status ? `Code ${s.hiv_status}` : null} />
              <Row label="TB Status" value={s.tb_status ? `Code ${s.tb_status}` : null} />
              <Row label="IPV/GBV Screening" value={s.ipv_status ? `Code ${s.ipv_status}` : null} />
              <Row label="Cervical Screening" value={s.cervical_screening_method || null} />
              <Row label="Cervical Result" value={s.cervical_screening_result ? `Code ${s.cervical_screening_result}` : null} />
              <Row label="Condoms Dispensed" value={s.condoms_dispensed ? `${s.condom_qty || '?'} (${s.condom_type || '?'})` : 'No'} />
              <Row label="Natural FP Counselled" value={s.natural_fp_counselled ? 'Yes' : 'No'} />
              <Row label="Cycle Beads Given" value={s.cycle_beads_given ? 'Yes' : 'No'} />
              <Row label="PPFP Timing" value={s.ppfp_timing ? `Code ${s.ppfp_timing}` : null} />
              <Row label="Referral In" value={s.referral_in ? `Code ${s.referral_in}` : null} />
              <Row label="Referral Out" value={s.referral_out ? `Code ${s.referral_out}` : null} />
              <Row label="Remarks" value={s.remarks} />
            </tbody>
          </table>
        </div>

        {/* Return Date */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Next Return Visit Date</p>
              <p className="text-lg font-bold text-blue-900">{returnDate}</p>
              {session.dmpaAdminType === 'SI' && session.dmpaTakeHomeDoses && (
                <p className="text-xs text-blue-600 mt-1">
                  Client has {session.dmpaTakeHomeDoses} take-home dose(s) for self-injection
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <div className="border-b-2 border-gray-400 mb-1 h-10"/>
            <p className="text-xs text-gray-500">Provider Signature & Date</p>
          </div>
          <div>
            <div className="border-b-2 border-gray-400 mb-1 h-10"/>
            <p className="text-xs text-gray-500">Client Signature / Thumbprint & Date</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Digital MEC Platform — Kenya MOH | WHO MEC 6th Edition (2025) | BCS+ Protocol
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Printed: {new Date().toLocaleString('en-KE')}
          </p>
        </div>
      </div>
    </div>
  )
}