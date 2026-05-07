import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, ArrowRight, RefreshCw } from 'lucide-react'
import { METHOD_DETAILS } from '../data/methodDetails.js'

const METHOD_SWITCH_GUIDE = [
  {
    from: 'COC', to: 'DMPA_SC',
    reason: 'Tired of daily pills',
    steps: ['Confirm eligibility for DMPA-SC (check BP, MEC)', 'Give first injection immediately if still on pills', 'No need for backup — immediate protection', 'Counsel on side effect differences (irregular bleeding vs regular periods)'],
    notes: 'Can switch any time if still taking pills regularly'
  },
  {
    from: 'DMPA_IM', to: 'DMPA_SC',
    reason: 'Client wants self-injection',
    steps: ['Confirm eligibility same as DMPA-IM', 'Switch at next scheduled injection date', 'Train on self-injection technique', 'Give take-home doses if competent'],
    notes: 'Same hormone, same efficacy. Seamless switch.'
  },
  {
    from: 'COC', to: 'IMPLANT',
    reason: 'Wants long-acting, forgets pills',
    steps: ['Check MEC eligibility for implant', 'Insert implant while still on active pills', 'If not taking pills: insert day 1-5 of cycle', 'Counsel on irregular bleeding — very common'],
    notes: 'Most effective reversible switch available'
  },
  {
    from: 'CU_IUD', to: 'LNG_IUS',
    reason: 'Heavy periods with Cu-IUD',
    steps: ['Confirm no current infection/PID', 'Remove Cu-IUD and insert LNG-IUS same visit', 'Counsel: periods will dramatically reduce', 'LNG-IUS is licensed treatment for heavy periods'],
    notes: 'Excellent switch for menorrhagia — evidence-based'
  },
  {
    from: 'DMPA_IM', to: 'IMPLANT',
    reason: 'Wants to switch injectable to LARC',
    steps: ['Can insert implant any time within injection window', 'Insert up to 4 weeks after last injection', 'No backup needed if within window', 'Counsel on bleeding pattern changes'],
    notes: 'Common switch — immediate protection'
  },
  {
    from: 'IMPLANT', to: 'CU_IUD',
    reason: 'Completed implant duration or side effects',
    steps: ['Remove implant', 'Insert Cu-IUD same visit', 'Counsel on heavier periods with Cu-IUD vs implant', 'Both immediately effective'],
    notes: 'Good switch for non-hormonal preference'
  },
  {
    from: 'POP', to: 'COC',
    reason: 'Client wants regular periods back',
    steps: ['Check COC eligibility (BP, smoking, migraine)', 'Start COC on first day of next period', 'Or start immediately if still taking POP', 'Counsel that periods will regularise in 1-3 months'],
    notes: 'Only if COC eligibility criteria met'
  },
  {
    from: 'COC', to: 'LAM',
    reason: 'Postpartum and exclusively breastfeeding',
    steps: ['Confirm ALL 3 LAM criteria met', 'Discontinue COC (should already be stopped postpartum)', 'Counsel on 6-month maximum duration', 'Plan transition method for when LAM criteria no longer met'],
    notes: 'COC should not be used breastfeeding <6 months anyway'
  },
]

const CATEGORIES = [
  { label: 'All Methods', value: 'all' },
  { label: '💊 Pills', value: 'pills' },
  { label: '💉 Injectables', value: 'injectables' },
  { label: '🩹 LARC', value: 'larc' },
  { label: '🛡️ Barrier', value: 'barrier' },
  { label: '🌿 Natural', value: 'natural' },
  { label: '✂️ Permanent', value: 'permanent' },
  { label: '🆘 Emergency', value: 'emergency' },
]

const METHOD_CATEGORIES = {
  COC: 'pills', POP: 'pills',
  DMPA_IM: 'injectables', DMPA_SC: 'injectables', NET_EN: 'injectables',
  IMPLANT: 'larc', CU_IUD: 'larc', LNG_IUS: 'larc',
  CONDOM_M: 'barrier', CONDOM_F: 'barrier',
  LAM: 'natural', FAM: 'natural',
  BTL: 'permanent', VASECTOMY: 'permanent',
  EC_PILL: 'emergency', EC_IUD: 'emergency',
}

export default function MethodsResource() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [activeTab, setActiveTab] = useState('methods') // 'methods' | 'switch'
  const [switchFrom, setSwitchFrom] = useState(null)

  const methods = Object.values(METHOD_DETAILS)
  const filtered = methods.filter(m => {
    const matchSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.abbr.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'all' || METHOD_CATEGORIES[m.id] === category
    return matchSearch && matchCat
  })

  const EFFICACY_COLOR = (pct) => {
    if (pct >= 99) return { bg: 'bg-green-100', text: 'text-green-700' }
    if (pct >= 95) return { bg: 'bg-teal-100', text: 'text-teal-700' }
    if (pct >= 87) return { bg: 'bg-amber-100', text: 'text-amber-700' }
    return { bg: 'bg-red-100', text: 'text-red-700' }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Dashboard
      </button>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800">
          📚 Methods Resource Centre
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Complete contraceptive method guide + method switching counselling
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { key: 'methods', label: '📚 Method Library', desc: '16 methods with full details' },
          { key: 'switch', label: '🔄 Method Switching', desc: 'Counselling on switching methods' },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`p-3 rounded-xl border-2 text-left transition-colors
              ${activeTab === tab.key
                ? 'text-white border-transparent'
                : 'border-gray-200 hover:border-teal-300 bg-white'}`}
            style={activeTab === tab.key ? {background:'linear-gradient(135deg,#0d7377,#14a044)'} : {}}>
            <p className={`font-bold text-sm ${activeTab === tab.key ? 'text-white' : 'text-gray-700'}`}>
              {tab.label}
            </p>
            <p className={`text-xs mt-0.5 ${activeTab === tab.key ? 'text-teal-100' : 'text-gray-400'}`}>
              {tab.desc}
            </p>
          </button>
        ))}
      </div>

      {/* ── METHOD LIBRARY ── */}
      {activeTab === 'methods' && (
        <>
          {/* Search */}
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-3 text-gray-400"/>
            <input
              className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Search methods..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {CATEGORIES.map(cat => (
              <button key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                  ${category === cat.value
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={category === cat.value ? {background:'#0d7377'} : {}}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Method Cards Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {filtered.map(method => {
              const eff = EFFICACY_COLOR(method.efficacy_typical)
              return (
                <button key={method.id}
                  onClick={() => setSelectedMethod(method)}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-left hover:border-teal-400 hover:shadow-md transition-all card-hover">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{method.emoji}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${eff.bg} ${eff.text}`}>
                      {method.efficacy_typical}%
                    </span>
                  </div>
                  <p className="font-bold text-gray-800 text-sm leading-tight">{method.abbr}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{method.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded
                      ${method.stis_protection ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {method.stis_protection ? '🛡️ STI' : 'No STI'}
                    </span>
                    <ArrowRight size={12} className="text-gray-400"/>
                  </div>
                </button>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No methods match your search
            </div>
          )}
        </>
      )}

      {/* ── METHOD SWITCH GUIDE ── */}
      {activeTab === 'switch' && (
        <div className="space-y-3">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-2">
            <p className="text-sm text-teal-700 font-medium">
              💡 Use this guide when a client wants to switch from one method to another.
              Always verify MEC eligibility for the new method before switching.
            </p>
          </div>

          {METHOD_SWITCH_GUIDE.map((guide, i) => {
            const fromMethod = METHOD_DETAILS[guide.from]
            const toMethod = METHOD_DETAILS[guide.to]
            const isOpen = switchFrom === i

            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setSwitchFrom(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="text-center">
                      <span className="text-lg">{fromMethod?.emoji || '💊'}</span>
                      <p className="text-xs font-bold text-gray-600">{fromMethod?.abbr || guide.from}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <ArrowRight size={18} className="mx-auto text-teal-500"/>
                      <p className="text-xs text-gray-400 mt-0.5">{guide.reason}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-lg">{toMethod?.emoji || '💉'}</span>
                      <p className="text-xs font-bold text-gray-600">{toMethod?.abbr || guide.to}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 flex-shrink-0 text-xs">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-600 mb-1">
                        📋 Switching steps:
                      </p>
                      <ol className="space-y-1">
                        {guide.steps.map((step, si) => (
                          <li key={si} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="bg-teal-100 text-teal-700 font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                              {si+1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <p className="text-xs text-amber-700">
                        💡 <strong>Note:</strong> {guide.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── METHOD DETAIL MODAL ── */}
      {selectedMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-4">
            {/* Header */}
            <div className="text-white p-5 rounded-t-2xl"
              style={{background:'linear-gradient(135deg,#0d7377,#0f766e)'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedMethod.emoji}</span>
                  <div>
                    <h2 className="font-bold text-lg">{selectedMethod.name}</h2>
                    <p className="text-teal-200 text-sm">{selectedMethod.category}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMethod(null)}
                  className="text-white hover:text-teal-200 text-2xl font-bold">×</button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">{selectedMethod.efficacy_perfect}%</div>
                  <div className="text-xs text-teal-200">Perfect use</div>
                </div>
                <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">{selectedMethod.efficacy_typical}%</div>
                  <div className="text-xs text-teal-200">Typical use</div>
                </div>
                <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
                  <div className="text-xs font-bold leading-tight">{selectedMethod.duration}</div>
                  <div className="text-xs text-teal-200">Duration</div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
              {/* STI Protection */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                ${selectedMethod.stis_protection
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                {selectedMethod.stis_protection
                  ? '✅ Protects against STIs/HIV'
                  : '⚠️ Does NOT protect against STIs — offer condoms'}
              </div>

              {/* Mechanism */}
              <div>
                <h3 className="font-bold text-gray-700 text-sm mb-2">🔬 Mechanism of Action</h3>
                <ul className="space-y-1">
                  {selectedMethod.mechanism.map((m, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-blue-400 mt-0.5">•</span> {m}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="font-bold text-gray-700 text-sm mb-2">✅ Contraceptive Benefits</h3>
                <ul className="space-y-1">
                  {selectedMethod.contraceptive_benefits.map((b, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-green-400 mt-0.5">✓</span> {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Non-contraceptive benefits */}
              {selectedMethod.non_contraceptive_benefits?.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-700 text-sm mb-2">🌟 Non-Contraceptive Benefits</h3>
                  <ul className="space-y-1">
                    {selectedMethod.non_contraceptive_benefits.map((b, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-purple-400 mt-0.5">★</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Side Effects */}
              <div>
                <h3 className="font-bold text-gray-700 text-sm mb-2">⚠️ Side Effects</h3>
                <ul className="space-y-1">
                  {selectedMethod.side_effects.map((s, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-orange-400 mt-0.5">!</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Danger Signs */}
              {selectedMethod.danger_signs && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <h3 className="font-bold text-red-700 text-sm mb-2">
                    🚨 {selectedMethod.danger_signs.title}
                  </h3>
                  <div className="space-y-2">
                    {selectedMethod.danger_signs.signs.map((s, i) => (
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

              {/* How to use */}
              <div>
                <h3 className="font-bold text-gray-700 text-sm mb-2">📋 How to Use</h3>
                <ol className="space-y-1">
                  {selectedMethod.how_to_use.map((h, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-blue-500 font-bold flex-shrink-0">{i+1}.</span> {h}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Counselling points */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <h3 className="font-bold text-yellow-700 text-sm mb-2">💬 Key Counselling Points</h3>
                <ul className="space-y-1">
                  {selectedMethod.counselling_points.map((c, i) => (
                    <li key={i} className="text-xs text-yellow-800 flex items-start gap-1">
                      <span className="text-yellow-500 mt-0.5">→</span> {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Return date */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-bold text-green-700">📅 Return Date: {selectedMethod.return_date}</p>
                <p className="text-xs text-green-600 mt-0.5">Follow-up: {selectedMethod.follow_up}</p>
              </div>

              {/* Who can / cannot use */}
              <div className="space-y-2">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-green-700 mb-1">✅ Who Can Use</p>
                  <p className="text-xs text-green-600">{selectedMethod.who_can_use}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-700 mb-1">❌ Who Cannot Use</p>
                  <p className="text-xs text-red-600">{selectedMethod.who_cannot_use}</p>
                </div>
              </div>

              {/* DMPA-SC SI steps */}
              {selectedMethod.self_injection_steps && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <h3 className="font-bold text-blue-700 text-sm mb-2">🏠 Self-Injection Steps</h3>
                  <ol className="space-y-1">
                    {selectedMethod.self_injection_steps.map((s, i) => (
                      <li key={i} className="text-xs text-blue-700 flex items-start gap-1">
                        <span className="font-bold flex-shrink-0">{i+1}.</span> {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setSelectedMethod(null)}
                className="w-full border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}