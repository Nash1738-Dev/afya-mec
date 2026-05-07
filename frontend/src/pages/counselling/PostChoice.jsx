import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../hooks/useSession.jsx'
import { ChevronRight, ChevronLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import { calculateReturnDate } from '../../data/mecEngine.js'

const METHOD_NAMES = {
  COC:'Combined Oral Contraceptive', POP:'Progestogen-Only Pill',
  DMPA_IM:'DMPA Injection (Depo)', DMPA_SC:'DMPA-SC (Sayana Press)',
  NET_EN:'NET-EN (Noristerat)', IMPLANT:'Implant (Implanon/Jadelle)',
  CU_IUD:'Copper IUD', LNG_IUS:'LNG-IUS (Mirena)',
  CONDOM_M:'Male Condom', CONDOM_F:'Female Condom',
  LAM:'LAM', FAM:'Fertility Awareness Method',
  BTL:'Female Sterilisation (BTL)', VASECTOMY:'Vasectomy',
  EC_PILL:'Emergency Contraceptive Pills', EC_IUD:'Emergency Cu-IUD',
}

const IMPLANT_TYPES = [
  { value: '1', label: '1-Rod (Implanon/Nexplanon)' },
  { value: '2', label: '2-Rod (Jadelle)' },
]

export default function PostChoice() {
  const navigate = useNavigate()
  const { session, updateSession, setSession } = useSession()
  const method = session.selectedMethod
  const methodName = METHOD_NAMES[method] || method

  const [provision, setProvision] = useState({
    qty: session.quantityDispensed || '',
    dmpa_admin: session.dmpaAdminType || '',
    dmpa_takehome: session.dmpaTakeHomeDoses || '',
    implant_type: '',
    larc_removal_reason: session.larcRemovalReason || '',
    counselling_done: session.counsellingDone || false,
    comprehension: session.comprehensionConfirmed || false,
  })

  const [sti, setSti] = useState(session.sti)

  const updateSti = (field, value) => setSti(prev => ({ ...prev, [field]: value }))
  const updateProv = (field, value) => setProvision(prev => ({ ...prev, [field]: value }))

  const handleNext = () => {
    // Determine take-home doses based on method
    let takeHome = 0
    if (method === 'DMPA_SC' && session.dmpa_sc_mode === 'SI') {
      takeHome = Math.max(0, (session.dmpa_sc_si_doses || 1) - 1)
    } else {
      takeHome = parseInt(provision.dmpa_takehome) || 0
    }

    const returnDate = calculateReturnDate(
      method,
      new Date(),
      takeHome
    )

    setSession(prev => ({
      ...prev,
      quantityDispensed: provision.qty,
      dmpaAdminType: provision.dmpa_admin,
      dmpaTakeHomeDoses: takeHome,
      larcRemovalReason: provision.larc_removal_reason,
      counsellingDone: provision.counselling_done,
      comprehensionConfirmed: provision.comprehension,
      returnDate: returnDate.toISOString(),
      sti: sti,
    }))
    navigate('/session/summary')
  }

  const Toggle = ({ value, onChange, labelYes = 'Yes', labelNo = 'No' }) => (
    <div className="flex gap-2">
      {[{ val: false, label: labelNo }, { val: true, label: labelYes }].map(opt => (
        <button key={String(opt.val)}
          onClick={() => onChange(opt.val)}
          className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors
            ${value === opt.val
              ? opt.val ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-400 border-gray-400 text-white'
              : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'}`}>
          {opt.label}
        </button>
      ))}
    </div>
  )

  const Select = ({ value, onChange, options, placeholder }) => (
    <select
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">📋 Post-Choice Counselling</h2>
        <p className="text-gray-500 text-sm mt-1">
          Stage 5 of 6 | <strong>{session.client.first_name} {session.client.last_name}</strong>
          {' — '}<span className="text-blue-600 font-semibold">{methodName}</span>
        </p>
      </div>

      {/* METHOD PROVISION */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">💊 Method Provision</h3>

        {/* DISC Section 2 — DMPA-SC Full Data Capture */}
        {session.selectedMethod === 'DMPA_SC' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-4">
            <h3 className="font-bold text-blue-700 text-sm flex items-center gap-2">
              💉 DMPA-SC — DISC Section 2 Data
            </h3>

            {/* SI vs PA Mode */}
            <div>
              <label className="block text-xs font-bold text-blue-600 mb-2">
                Administration Mode *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'SI', label: '🏠 Self-Injection (SI)', desc: 'Client self-injects at home' },
                  { val: 'PA', label: '🏥 Provider-Administered (PA)', desc: 'Provider injects at clinic' }
                ].map(opt => (
                  <button key={opt.val}
                    onClick={() => updateSession('dmpa_sc_mode', opt.val)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors
                      ${session.dmpa_sc_mode === opt.val
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-blue-200 hover:border-blue-300 bg-white'}`}>
                    <p className={`font-bold text-xs ${session.dmpa_sc_mode === opt.val ? 'text-white' : 'text-gray-700'}`}>
                      {opt.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${session.dmpa_sc_mode === opt.val ? 'text-blue-100' : 'text-gray-400'}`}>
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* SI-specific fields */}
            {session.dmpa_sc_mode === 'SI' && (
              <div className="space-y-3 pt-2 border-t border-blue-200">
                <p className="text-xs font-bold text-blue-600">
                  Self-Injection (SI) Details — DISC Indicators
                </p>

                {/* Doses dispensed */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    DMPA-SC SI Doses Dispensed This Visit
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateSession('dmpa_sc_si_doses',
                        Math.max(1, (session.dmpa_sc_si_doses || 1) - 1))}
                      className="w-9 h-9 rounded-lg bg-white border border-blue-300 text-blue-600 font-bold text-lg flex items-center justify-center hover:bg-blue-50">
                      −
                    </button>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-blue-700">
                        {session.dmpa_sc_si_doses || 1}
                      </span>
                      <p className="text-xs text-gray-400">dose(s)</p>
                    </div>
                    <button
                      onClick={() => updateSession('dmpa_sc_si_doses',
                        Math.min(4, (session.dmpa_sc_si_doses || 1) + 1))}
                      className="w-9 h-9 rounded-lg bg-white border border-blue-300 text-blue-600 font-bold text-lg flex items-center justify-center hover:bg-blue-50">
                      +
                    </button>
                    <div className="text-xs text-gray-500">
                      <p>1 = clinic only</p>
                      <p>2-4 = take-home doses</p>
                    </div>
                  </div>
                </div>

                {/* Take-home doses info */}
                {(session.dmpa_sc_si_doses || 1) > 1 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-green-700 mb-1">
                      📦 Take-home doses: {(session.dmpa_sc_si_doses || 1) - 1}
                    </p>
                    <p className="text-xs text-green-600">
                      Client given {(session.dmpa_sc_si_doses || 1) - 1} take-home dose(s).
                      Return date auto-adjusted by {((session.dmpa_sc_si_doses || 1) - 1) * 13} weeks.
                    </p>
                  </div>
                )}

                {/* Client trained? */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    SI Training Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'trained_today', label: '✅ Trained today' },
                      { val: 'previously_trained', label: '📋 Previously trained' },
                    ].map(opt => (
                      <button key={opt.val}
                        onClick={() => updateSession('si_training_status', opt.val)}
                        className={`py-2 px-3 rounded-lg border-2 text-xs font-semibold transition-colors text-left
                          ${session.si_training_status === opt.val
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-500 hover:border-green-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DISC data confirmation */}
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs font-bold text-gray-600 mb-1">📊 DISC Data Summary</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>Method: DMPA-SC | Mode: <strong className="text-blue-600">{session.dmpa_sc_mode || 'Not selected'}</strong></p>
                <p>Visit type: <strong>{session.client?.visit_type === '1' ? 'New' : 'Revisit'}</strong></p>
                {session.dmpa_sc_mode === 'SI' && (
                  <>
                    <p>Doses dispensed: <strong className="text-green-600">{session.dmpa_sc_si_doses || 1}</strong></p>
                    <p>Take-home doses: <strong>{Math.max(0, (session.dmpa_sc_si_doses || 1) - 1)}</strong></p>
                  </>
                )}
                <p className="text-teal-500 font-medium mt-1">
                  ✅ This data will auto-populate your DISC monthly report
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quantity */}
        {['COC','POP','NET_EN','CONDOM_M','CONDOM_F','EC_PILL'].includes(method) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Quantity Dispensed {['COC','POP'].includes(method) ? '(cycles)' : ['CONDOM_M','CONDOM_F'].includes(method) ? '(pieces)' : '(units)'}
            </label>
            <input type="number" min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter quantity"
              value={provision.qty}
              onChange={e => updateProv('qty', e.target.value)} />
          </div>
        )}

        {/* DMPA specific */}
        {['DMPA_IM','NET_EN'].includes(method) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Administration Type</label>
            <div className="flex gap-2">
              {[
                { val: 'PA', label: '👩‍⚕️ Provider Administered (PA)' },
              ].map(opt => (
                <button key={opt.val}
                  onClick={() => updateProv('dmpa_admin', opt.val)}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-colors
                    ${provision.dmpa_admin === opt.val ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Implant type */}
        {method === 'IMPLANT' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Implant Type</label>
            <Select value={provision.implant_type}
              onChange={v => updateProv('implant_type', v)}
              options={IMPLANT_TYPES} placeholder="Select implant type..." />
          </div>
        )}

        {/* LARC removal reason */}
        {session.methodVisitCategory === '2' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Removal Reason</label>
            <Select value={provision.larc_removal_reason}
              onChange={v => updateProv('larc_removal_reason', v)}
              options={[
                {value:'1',label:'1 — Side effects'},{value:'2',label:'2 — Wants pregnancy'},
                {value:'3',label:'3 — Method failure'},{value:'4',label:'4 — Duration complete'},
                {value:'5',label:'5 — Partner/family pressure'},{value:'6',label:'6 — Other'},
              ]} />
          </div>
        )}

        {/* Counselling confirmation */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Method counselling completed using brochure?
            </label>
            <Toggle value={provision.counselling_done} onChange={v => updateProv('counselling_done', v)} labelYes="Yes — Done" labelNo="Not Yet" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Client comprehension confirmed?
            </label>
            <Toggle value={provision.comprehension} onChange={v => updateProv('comprehension', v)} labelYes="Yes — Understood" labelNo="Needs Reinforcement" />
          </div>
        </div>
      </div>

      {/* STI/HIV & PREVENTIVE SCREENING */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">🔬 STI/HIV & Preventive Screening</h3>

        <div className="space-y-4">
          {/* HIV */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">HIV Counselling & Testing</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">HIV Counselled?</p>
                <Toggle value={sti.hiv_counselled} onChange={v => updateSti('hiv_counselled', v)} labelYes="Yes" labelNo="No" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">HIV Tested Today?</p>
                <Toggle value={sti.hiv_tested} onChange={v => updateSti('hiv_tested', v)} labelYes="Yes" labelNo="No" />
              </div>
            </div>
            {sti.hiv_tested && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">HIV Result:</p>
                <Select value={sti.hiv_status}
                  onChange={v => updateSti('hiv_status', v)}
                  options={[
                    {value:'1',label:'1 — Negative'},
                    {value:'2',label:'2 — Positive'},
                    {value:'3',label:'3 — Indeterminate'},
                    {value:'4',label:'4 — Declined'},
                  ]} />
              </div>
            )}
          </div>

          {/* TB */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">TB Status</label>
            <Select value={sti.tb_status} onChange={v => updateSti('tb_status', v)}
              options={[
                {value:'1',label:'1 — No TB / not screened'},
                {value:'2',label:'2 — On TB treatment'},
                {value:'3',label:'3 — Presumptive TB'},
                {value:'4',label:'4 — TB contact'},
              ]} />
          </div>

          {/* IPV */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">IPV / GBV Screening</label>
            <Select value={sti.ipv_status} onChange={v => updateSti('ipv_status', v)}
              options={[
                {value:'1',label:'1 — Screened — Negative'},
                {value:'2',label:'2 — Screened Positive — Counselled'},
                {value:'3',label:'3 — Screened Positive — Referred'},
              ]} />
          </div>

          {/* Cervical Screening */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cervical Cancer Screening</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Method Used:</p>
                <Select value={sti.cervical_screening_method}
                  onChange={v => updateSti('cervical_screening_method', v)}
                  options={[
                    {value:'VIA',label:'VIA'},
                    {value:'PAP',label:'Pap Smear'},
                    {value:'HPV',label:'HPV Test'},
                    {value:'none',label:'Not Done'},
                  ]} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Result:</p>
                <Select value={sti.cervical_screening_result}
                  onChange={v => updateSti('cervical_screening_result', v)}
                  options={[
                    {value:'1',label:'1 — Normal'},
                    {value:'2',label:'2 — Abnormal — Treated'},
                    {value:'3',label:'3 — Abnormal — Referred'},
                    {value:'4',label:'4 — Suspected Cancer'},
                  ]} />
              </div>
            </div>
          </div>

          {/* Condoms */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Condoms Dispensed?</label>
            <Toggle value={sti.condoms_dispensed} onChange={v => updateSti('condoms_dispensed', v)} labelYes="Yes" labelNo="No" />
            {sti.condoms_dispensed && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Select value={sti.condom_type} onChange={v => updateSti('condom_type', v)}
                  options={[{value:'M',label:'Male Condoms'},{value:'F',label:'Female Condoms'},{value:'B',label:'Both'}]} />
                <input type="number" min="1" placeholder="Quantity"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={sti.condom_qty}
                  onChange={e => updateSti('condom_qty', e.target.value)} />
              </div>
            )}
          </div>

          {/* Natural FP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Natural FP Counselled?</label>
              <Toggle value={sti.natural_fp_counselled} onChange={v => updateSti('natural_fp_counselled', v)} labelYes="Yes" labelNo="No" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Cycle Beads Given?</label>
              <Toggle value={sti.cycle_beads_given} onChange={v => updateSti('cycle_beads_given', v)} labelYes="Yes" labelNo="No" />
            </div>
          </div>

          {/* PPFP */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">PPFP Timing (if applicable)</label>
            <Select value={sti.ppfp_timing} onChange={v => updateSti('ppfp_timing', v)}
              options={[
                {value:'1',label:'1 — Antenatal'},
                {value:'2',label:'2 — <48 hrs postpartum'},
                {value:'3',label:'3 — 48 hrs – 6 weeks'},
                {value:'4',label:'4 — >6 weeks'},
              ]} placeholder="N/A — Not postpartum" />
          </div>

          {/* Referral */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Referral IN:</label>
              <Select value={sti.referral_in} onChange={v => updateSti('referral_in', v)}
                options={[{value:'1',label:'1 — Self'},{value:'2',label:'2 — Community'},{value:'3',label:'3 — Other facility'}]}
                placeholder="None" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Referral OUT:</label>
              <Select value={sti.referral_out} onChange={v => updateSti('referral_out', v)}
                options={[{value:'1',label:'1 — RH Services'},{value:'2',label:'2 — HIV Services'},{value:'3',label:'3 — Other'}]}
                placeholder="None" />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks / Notes</label>
            <textarea rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Any additional clinical notes..."
              value={sti.remarks}
              onChange={e => updateSti('remarks', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('/session/methods')}
          className="flex items-center gap-1 px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium">
          <ChevronLeft size={16}/> Back
        </button>
        <button onClick={handleNext}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow transition-colors">
          Next: Session Summary <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  )
}