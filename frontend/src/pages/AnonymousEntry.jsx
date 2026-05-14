import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserX, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'
import API from '../utils/api.js'
import { METHOD_DETAILS } from '../data/methodDetails.js'

const AGE_BRACKETS = [
  { value: '10-14', label: '10–14 years', flag: 'adolescent' },
  { value: '15-19', label: '15–19 years', flag: 'adolescent' },
  { value: '20-24', label: '20–24 years (Youth)', flag: 'youth' },
  { value: '25-49', label: '25–49 years (Adult)', flag: 'adult' },
  { value: '50+', label: '50+ years', flag: 'adult' },
]

const METHODS = [
  { id: 'COC', label: 'COC — Combined Oral Contraceptive', category: 'Pills' },
  { id: 'POP', label: 'POP — Progestogen-Only Pill', category: 'Pills' },
  { id: 'EC_PILL', label: 'Emergency Contraceptive Pill', category: 'Pills' },
  { id: 'DMPA_IM', label: 'DMPA-IM — Depo Injection', category: 'Injectables' },
  { id: 'DMPA_SC', label: 'DMPA-SC — Sayana Press', category: 'Injectables' },
  { id: 'NET_EN', label: 'NET-EN — Noristerat', category: 'Injectables' },
  { id: 'IMPLANT_1ROD', label: 'Implant — 1 Rod (Implanon)', category: 'LARC' },
  { id: 'IMPLANT_2ROD', label: 'Implant — 2 Rods (Jadelle)', category: 'LARC' },
  { id: 'CU_IUD', label: 'Copper IUD (Cu-T)', category: 'LARC' },
  { id: 'LNG_IUS', label: 'LNG-IUS (Mirena)', category: 'LARC' },
  { id: 'CONDOM_M', label: 'Male Condom', category: 'Condoms' },
  { id: 'CONDOM_F', label: 'Female Condom', category: 'Condoms' },
  { id: 'CONDOM_BOTH', label: 'Both Male & Female Condoms', category: 'Condoms' },
  { id: 'LAM', label: 'LAM', category: 'Natural FP' },
  { id: 'FAM', label: 'FAM / Cycle Beads', category: 'Natural FP' },
  { id: 'BTL', label: 'BTL — Female Sterilisation', category: 'Permanent' },
  { id: 'VASECTOMY', label: 'Vasectomy', category: 'Permanent' },
]

const METHOD_CATEGORIES = [...new Set(METHODS.map(m => m.category))]

export default function AnonymousEntry() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const [sex, setSex] = useState('')
  const [ageBracket, setAgeBracket] = useState('')
  const [method, setMethod] = useState('')
  const [visitType, setVisitType] = useState('')
  const [firstEverUser, setFirstEverUser] = useState('')
  const [naturalFP, setNaturalFP] = useState(false)
  const [cycleBeads, setCycleBeads] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [detailView, setDetailView] = useState(null)
  const [assessmentType, setAssessmentType] = useState('quick')

  const canSubmit = assessmentType === 'full'
    ? sex && ageBracket && visitType
    : sex && ageBracket && method && visitType

  const handleSubmit = async () => {
    if (!canSubmit) return

    // Full assessment — store anonymous context and route to session flow
    if (assessmentType === 'full') {
      const anonData = {
        is_anonymous: true,
        anon_sex: sex,
        anon_age_bracket: ageBracket,
        visit_type: visitType,
        first_ever_user: firstEverUser,
        facility_code: facility.facility_code || '',
        provider_name: facility.provider_name || '',
        // Approximate age for MEC engine
        age: ageBracket === '10-14' ? 12
           : ageBracket === '15-19' ? 17
           : ageBracket === '20-24' ? 22
           : ageBracket === '25-49' ? 35 : 55,
      }
      // Store in sessionStorage so PreChoice can read it
      sessionStorage.setItem('anon_session', JSON.stringify(anonData))
      navigate('/session/pre-choice?anon=true')
      return
    }

    // Quick entry — existing behaviour unchanged
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        client: {
          first_name: 'Anonymous',
          last_name: 'Client',
          age: ageBracket === '10-14' ? 12 : ageBracket === '15-19' ? 17 :
               ageBracket === '20-24' ? 22 : ageBracket === '25-49' ? 35 : 55,
          sex: sex,
          visit_type: visitType,
          first_ever_user: firstEverUser,
          disability_status: 0,
          facility_code: facility.facility_code || '',
          provider_name: facility.provider_name || '',
        },
        vitals: { bp_systolic: '', bp_diastolic: '', weight_kg: '', bp_category: '' },
        pregnancy: { pdt_done: false, ruled_out: true, checklist: {} },
        conditions: [],
        conditionDetails: {},
        selectedMethod: method.replace('_1ROD','').replace('_2ROD',''),
        methodVisitCategory: visitType === '1' ? '1' : '2',
        quantityDispensed: '1',
        counsellingDone: true,
        comprehensionConfirmed: true,
        sti: { natural_fp_counselled: naturalFP, cycle_beads_given: cycleBeads },
        is_anonymous: true,
        anon_sex: sex,
        anon_age_bracket: ageBracket,
        sessionDate: new Date().toISOString(),
        returnDate: null,
      }
      const res = await API.post('/visits/save-anonymous', payload)
      if (res.data) setSubmitted(true)
    } catch (e) {
      setError(e.response?.data?.detail || 'Network error — check backend connection')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="max-w-sm mx-auto text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle size={48} className="text-green-500"/>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Submitted</h2>
        <p className="text-gray-500 mb-6">Anonymous entry recorded successfully</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-gray-400">Sex:</span> <strong>{sex === 'F' ? 'Female' : sex === 'M' ? 'Male' : sex}</strong></div>
            <div><span className="text-gray-400">Age:</span> <strong>{ageBracket} yrs</strong></div>
            <div className="col-span-2"><span className="text-gray-400">Method:</span> <strong>{METHODS.find(m => m.id === method)?.label}</strong></div>
          </div>
        </div>
        <div className="space-y-2">
          <button onClick={() => { setSex(''); setAgeBracket(''); setMethod(''); setVisitType(''); setFirstEverUser(''); setSubmitted(false) }}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors">
            + Add Another Anonymous Entry
          </button>
          <button onClick={() => navigate('/')}
            className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const grouped = METHOD_CATEGORIES.map(cat => ({
    category: cat,
    methods: METHODS.filter(m => m.category === cat)
  }))

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate('/')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back
      </button>

      {/* Header */}
      <div className="rounded-2xl p-5 mb-5 text-white"
        style={{background: 'linear-gradient(135deg, #0d7377 0%, #0f766e 100%)'}}>
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 p-2.5 rounded-xl">
            <UserX size={24}/>
          </div>
          <div>
            <h2 className="text-xl font-bold">Anonymous Quick Entry</h2>
            <p className="text-teal-100 text-sm mt-0.5">
              Client declined to share personal details
            </p>
          </div>
        </div>
        <div className="mt-3 bg-white bg-opacity-10 rounded-lg px-3 py-2 text-xs text-teal-100">
          ℹ️ Only minimum data will be recorded — sex, age bracket, and method issued.
          This data still counts towards MOH 711 statistics.
        </div>
      </div>

      <div className="space-y-4">
        {/* Assessment Type */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Assessment Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: 'quick', label: '⚡ Quick Entry', desc: 'Method + demographics only' },
              { val: 'full', label: '🩺 Full Assessment', desc: 'Vitals + pregnancy + MEC + method' }
            ].map(opt => (
              <button key={opt.val}
                onClick={() => setAssessmentType(opt.val)}
                className={`text-left p-3 rounded-xl border-2 transition-colors
                  ${assessmentType === opt.val
                    ? 'border-teal-500 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-teal-300'}`}
                style={assessmentType === opt.val ? {background:'#0d7377'} : {}}>
                <p className="font-bold text-sm">{opt.label}</p>
                <p className={`text-xs mt-0.5 ${assessmentType === opt.val ? 'text-teal-100' : 'text-gray-400'}`}>
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
          {assessmentType === 'full' && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-700">
                🩺 Full assessment uses the standard BCS+ clinical flow — vitals, pregnancy checklist, MEC screening, then method choice. Data saves as anonymous.
              </p>
            </div>
          )}
        </div>

        {/* Sex */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Sex of Client <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 'F', label: '♀ Female' },
              { val: 'M', label: '♂ Male' },
              { val: 'I', label: '⚧ Other' },
            ].map(opt => (
              <button key={opt.val}
                onClick={() => setSex(opt.val)}
                className={`py-3 rounded-xl border-2 text-sm font-bold transition-colors
                  ${sex === opt.val
                    ? 'border-teal-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-teal-300'}`}
                style={sex === opt.val ? {background: '#0d7377'} : {}}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age Bracket */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Approximate Age Bracket <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {AGE_BRACKETS.map(b => (
              <button key={b.value}
                onClick={() => setAgeBracket(b.value)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors flex items-center justify-between
                  ${ageBracket === b.value
                    ? 'border-teal-500 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-teal-300'}`}
                style={ageBracket === b.value ? {background: '#0d7377'} : {}}>
                <span>{b.label}</span>
                {b.flag === 'adolescent' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    ${ageBracket === b.value ? 'bg-white bg-opacity-20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                    Adolescent
                  </span>
                )}
                {b.flag === 'youth' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    ${ageBracket === b.value ? 'bg-white bg-opacity-20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    Youth
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Visit Type */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Visit Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[{val:'1', label:'New Client'}, {val:'2', label:'Revisit'}].map(opt => (
              <button key={opt.val}
                onClick={() => setVisitType(opt.val)}
                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-colors
                  ${visitType === opt.val
                    ? 'border-teal-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-teal-300'}`}
                style={visitType === opt.val ? {background: '#0d7377'} : {}}>
                {opt.label}
              </button>
            ))}
          </div>
          {visitType === '1' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-500 mb-2">First ever FP user?</label>
              <div className="grid grid-cols-2 gap-2">
                {[{val:'true', label:'Yes — 1st ever'}, {val:'false', label:'No'}].map(opt => (
                  <button key={opt.val}
                    onClick={() => setFirstEverUser(opt.val)}
                    className={`py-2 rounded-lg border-2 text-xs font-semibold transition-colors
                      ${firstEverUser === opt.val
                        ? 'border-teal-400 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-500 hover:border-teal-200'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Method — only for quick entry */}
        {assessmentType === 'quick' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Method Issued <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {grouped.map(group => (
              <div key={group.category}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  {group.category}
                </p>
                <div className="space-y-1">
                  {group.methods.map(m => (
                    <button key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border-2 text-sm transition-colors flex items-center justify-between
                        ${method === m.id
                          ? 'border-teal-500 text-white font-semibold'
                          : 'border-gray-100 text-gray-700 hover:border-teal-200 hover:bg-teal-50'}`}
                      style={method === m.id ? {background: '#0d7377'} : {}}>
                      <span>{method === m.id ? '✓ ' : ''}{m.label}</span>
                      <button
                        onClick={e => { e.stopPropagation(); setDetailView(m.id.replace('_1ROD','').replace('_2ROD','')) }}
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2
                          ${method === m.id ? 'bg-white bg-opacity-20 text-white' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}>
                        📖
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Natural FP extras */}
          {(method === 'FAM' || method === 'LAM') && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={naturalFP}
                  onChange={e => setNaturalFP(e.target.checked)}
                  className="w-4 h-4 accent-teal-600"/>
                <span className="text-sm text-gray-600">Natural FP counselled</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={cycleBeads}
                  onChange={e => setCycleBeads(e.target.checked)}
                  className="w-4 h-4 accent-teal-600"/>
                <span className="text-sm text-gray-600">Cycle beads given</span>
              </label>
            </div>
          )}
        </div>
        )} {/* end quick entry method */}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl text-base shadow-lg transition-all
            ${canSubmit && !submitting
              ? 'text-white hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          style={canSubmit && !submitting ? {background: 'linear-gradient(135deg, #0d7377 0%, #14a044 100%)'} : {}}>
          {submitting
            ? '⏳ Submitting...'
            : assessmentType === 'full'
              ? <><ChevronRight size={18}/> Continue to Full Assessment</>
              : <><CheckCircle size={18}/> Submit Anonymous Entry</>
          }
        </button>
      </div>

      {/* Full Method Detail Modal */}
      {detailView && (() => {
        const d = METHOD_DETAILS[detailView]
        if (!d) return null
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-4">
              {/* Header */}
              <div className="bg-blue-600 text-white p-5 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{d.emoji}</span>
                    <div>
                      <h2 className="font-bold text-lg">{d.name}</h2>
                      <p className="text-blue-200 text-sm">{d.category}</p>
                    </div>
                  </div>
                  <button onClick={() => setDetailView(null)}
                    className="text-blue-200 hover:text-white text-2xl font-bold">×</button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-blue-700 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold">{d.efficacy_perfect}%</div>
                    <div className="text-xs text-blue-200">Perfect use</div>
                  </div>
                  <div className="bg-blue-700 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold">{d.efficacy_typical}%</div>
                    <div className="text-xs text-blue-200">Typical use</div>
                  </div>
                  <div className="bg-blue-700 rounded-lg p-2 text-center">
                    <div className="text-xs font-bold leading-tight">{d.duration}</div>
                    <div className="text-xs text-blue-200">Duration</div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4 max-h-96 overflow-y-auto">

                {/* STI Protection badge */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                  ${d.stis_protection ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                  {d.stis_protection ? '✅ Protects against STIs/HIV' : '⚠️ Does NOT protect against STIs — offer condoms'}
                </div>

                {/* Mechanism */}
                <div>
                  <h3 className="font-bold text-gray-700 text-sm mb-2">🔬 Mechanism of Action</h3>
                  <ul className="space-y-1">
                    {d.mechanism.map((m, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-blue-400 mt-0.5">•</span> {m}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contraceptive Benefits */}
                <div>
                  <h3 className="font-bold text-gray-700 text-sm mb-2">✅ Contraceptive Benefits</h3>
                  <ul className="space-y-1">
                    {d.contraceptive_benefits.map((b, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-green-400 mt-0.5">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Non-Contraceptive Benefits */}
                {d.non_contraceptive_benefits?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-700 text-sm mb-2">🌟 Non-Contraceptive Benefits</h3>
                    <ul className="space-y-1">
                      {d.non_contraceptive_benefits.map((b, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-purple-400 mt-0.5">★</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Side Effects */}
                <div>
                  <h3 className="font-bold text-gray-700 text-sm mb-2">⚠️ Common Side Effects</h3>
                  <ul className="space-y-1">
                    {d.side_effects.map((s, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-orange-400 mt-0.5">!</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Danger Signs */}
                {d.danger_signs && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <h3 className="font-bold text-red-700 text-sm mb-2 flex items-center gap-1">
                      🚨 {d.danger_signs.title}
                    </h3>
                    <div className="space-y-2">
                      {d.danger_signs.signs.map((s, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                            {s.letter}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-red-700">{s.word}</p>
                            <p className="text-xs text-red-600">{s.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* How to Use */}
                <div>
                  <h3 className="font-bold text-gray-700 text-sm mb-2">📋 How to Use</h3>
                  <ol className="space-y-1">
                    {d.how_to_use.map((h, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-blue-500 font-bold flex-shrink-0">{i+1}.</span> {h}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* DMPA-SC self-injection steps */}
                {d.self_injection_steps && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <h3 className="font-bold text-blue-700 text-sm mb-2">🏠 Self-Injection Steps (SI Clients)</h3>
                    <ol className="space-y-1">
                      {d.self_injection_steps.map((s, i) => (
                        <li key={i} className="text-xs text-blue-700 flex items-start gap-1">
                          <span className="font-bold flex-shrink-0">{i+1}.</span> {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Counselling Points */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <h3 className="font-bold text-yellow-700 text-sm mb-2">💬 Key Counselling Points</h3>
                  <ul className="space-y-1">
                    {d.counselling_points.map((c, i) => (
                      <li key={i} className="text-xs text-yellow-800 flex items-start gap-1">
                        <span className="text-yellow-500 mt-0.5">→</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Return Date */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-green-700">📅 Return Date: {d.return_date}</p>
                  <p className="text-xs text-green-600 mt-0.5">Follow-up: {d.follow_up}</p>
                </div>

                {/* Who can / cannot use */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-green-700 mb-1">✅ Who Can Use</p>
                    <p className="text-xs text-green-600">{d.who_can_use}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-red-700 mb-1">❌ Who Cannot Use</p>
                    <p className="text-xs text-red-600">{d.who_cannot_use}</p>
                  </div>
                </div>

                {/* Video resources for DMPA-SC */}
                {d.video_resources && (
                  <div>
                    <h3 className="font-bold text-gray-700 text-sm mb-2">🎥 Training Videos</h3>
                    {d.video_resources.map((v, i) => (
                      <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2 hover:bg-blue-100 transition-colors">
                        <span className="text-2xl">▶️</span>
                        <div>
                          <p className="text-sm font-semibold text-blue-700">{v.title}</p>
                          <p className="text-xs text-blue-500">{v.source} • {v.duration}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <button onClick={() => { setDetailView(null); setMethod(detailView) }}
                  className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                  style={{background: '#0d7377'}}>
                  Select This Method
                </button>
                <button onClick={() => setDetailView(null)}
                  className="px-4 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}