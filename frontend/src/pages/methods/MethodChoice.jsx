import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../hooks/useSession.jsx'
import { calculateEligibility, calculateReturnDate } from '../../data/mecEngine.js'
import { ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, XCircle, Info, Zap } from 'lucide-react'
import { METHOD_DETAILS } from '../../data/methodDetails.js'

const METHOD_INFO = {
  COC:      { icon: '💊', desc: 'Daily pill combining oestrogen & progestogen. Highly effective when taken correctly.', howTo: 'Take 1 pill daily at the same time. 21 or 28-day packs.' },
  POP:      { icon: '💊', desc: 'Progestogen-only daily pill. Good for breastfeeding mothers and those who cannot use oestrogen.', howTo: 'Take 1 pill daily — no break between packs.' },
  DMPA_IM:  { icon: '💉', desc: 'Injection given by provider every 12 weeks (3 months). Highly effective.', howTo: 'Provider-administered injection into muscle every 12 weeks.' },
  DMPA_SC:  { icon: '💉', desc: 'Subcutaneous injection every 13 weeks. Can be self-injected (SI) after training.', howTo: 'Inject under skin of abdomen/thigh. Can self-inject at home.' },
  NET_EN:   { icon: '💉', desc: 'Injection given every 8 weeks (2 months) by provider.', howTo: 'Provider-administered injection every 8 weeks.' },
  IMPLANT:  { icon: '🩹', desc: 'Small rod(s) inserted under skin of upper arm. Works for 3–5 years.', howTo: 'Provider inserts 1 or 2 rods under skin. No daily action needed.' },
  CU_IUD:   { icon: '🔩', desc: 'Small copper device placed in uterus. Works for up to 10 years. Hormone-free.', howTo: 'Provider inserts into uterus. Monthly string check recommended.' },
  LNG_IUS:  { icon: '🔩', desc: 'Hormone-releasing IUD placed in uterus. Works 5 years. Reduces periods.', howTo: 'Provider inserts into uterus. Monthly string check recommended.' },
  CONDOM_M: { icon: '🛡️', desc: 'Barrier method. Only method that protects against both pregnancy AND STIs/HIV.', howTo: 'Use correctly with every act of intercourse.' },
  CONDOM_F: { icon: '🛡️', desc: 'Female-controlled barrier method. Also protects against STIs/HIV.', howTo: 'Insert before intercourse. Can be inserted up to 8 hours before.' },
  LAM:      { icon: '🤱', desc: 'Natural method based on breastfeeding. Effective only when ALL 3 criteria are met.', howTo: 'Baby < 6 months + fully breastfeeding + no periods returned.' },
  FAM:      { icon: '📅', desc: 'Tracking fertile days using calendar, temperature, or cervical mucus.', howTo: 'Requires training and partner cooperation. Use cycle beads.' },
  BTL:      { icon: '✂️', desc: 'Permanent female sterilisation. Tubal ligation — not easily reversible.', howTo: 'Surgical procedure. Requires informed consent. Age considered.' },
  VASECTOMY:{ icon: '✂️', desc: 'Permanent male sterilisation. Very effective, simple procedure.', howTo: 'Surgical procedure for male partner. Not easily reversible.' },
  EC_PILL:  { icon: '🆘', desc: 'Emergency contraception pills. Use within 72 hours (up to 120 hrs) of unprotected sex.', howTo: 'Take as soon as possible after unprotected intercourse.' },
  EC_IUD:   { icon: '🆘', desc: 'Copper IUD as emergency contraception. Most effective EC — use within 5 days.', howTo: 'Provider inserts within 5 days of unprotected intercourse.' },
}

const CAT_CONFIG = {
  1: { label: 'Recommended', color: 'border-green-400 bg-green-50', badge: 'bg-green-500 text-white', icon: <CheckCircle size={14}/>, textColor: 'text-green-700' },
  2: { label: 'Generally Safe', color: 'border-yellow-400 bg-yellow-50', badge: 'bg-yellow-500 text-white', icon: <Info size={14}/>, textColor: 'text-yellow-700' },
  3: { label: 'Use with Caution', color: 'border-orange-400 bg-orange-50', badge: 'bg-orange-500 text-white', icon: <AlertTriangle size={14}/>, textColor: 'text-orange-700' },
  4: { label: 'Contraindicated', color: 'border-red-300 bg-red-50 opacity-60', badge: 'bg-red-500 text-white', icon: <XCircle size={14}/>, textColor: 'text-red-700' },
}

const CONDITION_LABELS = {
  obesity_bmi_gte30: 'Obesity (BMI ≥30)',
  htn_systolic_gte160: 'Severe Hypertension',
  htn_systolic_140_159: 'Hypertension Stage 1',
  smoker_gte35: 'Smoker ≥35 yrs',
  smoker_lt35: 'Smoker <35 yrs',
  adolescent: 'Adolescent (<18)',
  migraine_with_aura: 'Migraine with Aura',
  breast_cancer_current: 'Current Breast Cancer',
  hiv_positive_stage3_4: 'HIV Stage 3/4',
  arv_rifampicin: 'On Rifampicin',
  history_dvt_pe: 'DVT/PE History',
  current_pid: 'Active PID',
  current_sti: 'Active STI',
  unexplained_vaginal_bleeding: 'Unexplained Bleeding',
}

export default function MethodChoice() {
  const navigate = useNavigate()
  const { session, updateSession, setSession } = useSession()
  const [selected, setSelected] = useState(session.selectedMethod)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [detailView, setDetailView] = useState(null)
  const [visitCat, setVisitCat] = useState(session.methodVisitCategory || '')
  const [changeReason, setChangeReason] = useState(session.methodChangeReason || '')

  const results = calculateEligibility(session.conditions || [])
  const filtered = filter === 'all' ? results : results.filter(r => r.category <= (filter === 'safe' ? 2 : 3))

  const handleSelect = (methodId) => {
    if (results.find(r => r.method.id === methodId)?.category === 4) return
    setSelected(methodId)
    setExpanded(methodId)
  }

  const handleNext = () => {
    if (!selected) return
    const returnDate = calculateReturnDate(selected)
    setSession(prev => ({
      ...prev,
      selectedMethod: selected,
      methodVisitCategory: visitCat,
      methodChangeReason: changeReason,
      returnDate: returnDate.toISOString(),
    }))
    navigate('/session/counselling')
  }

  const activeConditionLabels = (session.conditions || [])
    .filter(c => CONDITION_LABELS[c])
    .map(c => CONDITION_LABELS[c])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Zap className="text-blue-600" size={24}/> Method Choice
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Stage 4 of 6 — BCS+ Method Choice | <strong>{session.client.first_name} {session.client.last_name}</strong>
        </p>
      </div>

      {/* Active conditions summary */}
      {activeConditionLabels.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
          <p className="text-orange-700 text-sm font-semibold mb-2 flex items-center gap-1">
            <AlertTriangle size={14}/> Active MEC conditions affecting eligibility:
          </p>
          <div className="flex flex-wrap gap-1">
            {activeConditionLabels.map(c => (
              <span key={c} className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-medium">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Visit category for revisit */}
      {session.client.visit_type === '2' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Visit Category</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {val:'1', label:'New/First Insertion'},
              {val:'2', label:'Removal'},
              {val:'3', label:'Reinsertion/Restart'},
              {val:'4', label:'Routine Check-up'},
            ].map(opt => (
              <button key={opt.val}
                onClick={() => setVisitCat(opt.val)}
                className={`py-2 rounded-lg border-2 text-sm font-medium transition-colors
                  ${visitCat === opt.val ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          {visitCat === '2' || visitCat === '3' ? (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-600 mb-1">Reason for method change/removal:</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={changeReason}
                onChange={e => setChangeReason(e.target.value)}
              >
                <option value="">Select reason...</option>
                <option value="side_effects">Side effects</option>
                <option value="wants_pregnancy">Wants to conceive</option>
                <option value="method_failure">Method failure</option>
                <option value="duration_complete">Duration complete</option>
                <option value="partner_family">Partner/family pressure</option>
                <option value="switching_method">Switching to another method</option>
                <option value="other">Other</option>
              </select>
            </div>
          ) : null}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          {val:'all', label:'All Methods'},
          {val:'safe', label:'✓ Recommended Only'},
          {val:'caution', label:'Including Cat 3'},
        ].map(f => (
          <button key={f.val}
            onClick={() => setFilter(f.val)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
              ${filter === f.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Method Cards */}
      <div className="space-y-3 mb-4">
        {filtered.map(result => {
          const cfg = CAT_CONFIG[result.category]
          const info = METHOD_INFO[result.method.id]
          const isSelected = selected === result.method.id
          const isExpanded = expanded === result.method.id
          const blocked = result.category === 4

          return (
            <div key={result.method.id}
              onClick={() => !blocked && handleSelect(result.method.id)}
              className={`rounded-xl border-2 p-4 transition-all
                ${blocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : cfg.color}
                ${!blocked && !isSelected ? 'hover:border-blue-300' : ''}`}>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{info?.icon}</span>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{result.method.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-gray-600">{result.method.efficacy}% effective</span>
                      <span>•</span>
                      <span className="capitalize">{result.method.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${cfg.badge}`}>
                    {cfg.icon} Cat {result.category}
                  </span>
                  {isSelected && <CheckCircle size={20} className="text-blue-600"/>}
                </div>
              </div>

              {/* Category label */}
              <div className={`text-xs font-semibold mt-2 ${cfg.textColor}`}>
                {cfg.label}
                {result.reasons.length > 0 && (
                  <span className="font-normal ml-1">
                    — due to: {result.reasons.map(r => CONDITION_LABELS[r] || r.replace(/_/g,' ')).join(', ')}
                  </span>
                )}
              </div>

              {/* Expanded info */}
              {isExpanded && !blocked && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-2">{info?.desc}</p>
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-2">
                    <strong>How to use:</strong> {info?.howTo}
                  </p>
                  {result.method.returnWeeks && (
                    <p className="text-xs text-blue-600 mb-2 font-medium">
                      📅 Return visit: every {result.method.returnWeeks} weeks
                    </p>
                  )}
                  {result.method.returnYears && (
                    <p className="text-xs text-blue-600 mb-2 font-medium">
                      📅 Duration: up to {result.method.returnYears} years
                    </p>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setDetailView(result.method.id) }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline">
                    📖 View full method details →
                  </button>
                </div>
              )}
            </div>
          )
        })}
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
                <button onClick={() => { setDetailView(null); handleSelect(detailView) }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
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

      {/* Selected summary */}
      {selected && (
        <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 mb-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-blue-600 flex-shrink-0"/>
          <div>
            <p className="font-bold text-blue-800">
              Selected: {METHOD_INFO[selected]?.icon} {results.find(r => r.method.id === selected)?.method.name}
            </p>
            <p className="text-blue-600 text-sm">Tap the card again to expand details, or proceed to counselling.</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/session/screener')}
          className="flex items-center gap-1 px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium">
          <ChevronLeft size={16}/> Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selected}
          className={`flex items-center gap-2 font-bold py-3 px-8 rounded-xl shadow transition-colors
            ${selected ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          Next: Counselling <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  )
}