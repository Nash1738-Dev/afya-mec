import { useState, useEffect } from 'react'
import { Calendar, Save, Trash2, Bell, ChevronDown } from 'lucide-react'

// ── STORAGE ────────────────────────────────────────────────────────────────────
const STORE_KEY = 'nova_return_dates'
const getStored = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]') } catch { return [] } }
const saveStored = (d) => localStorage.setItem(STORE_KEY, JSON.stringify(d))

// ── METHOD RETURN DATE CONFIG ──────────────────────────────────────────────────
// All intervals in days
const METHODS = [
  {
    id: 'dmpa_sc',
    emoji: '💉',
    name: { en: 'DMPA-SC (Sayana Press)', sw: 'DMPA-SC (Sayana Press)' },
    color: '#14a044',
    intervalDays: 91,       // 13 weeks
    graceDays: 28,          // +4 weeks grace = 17 weeks total
    hasSI: true,            // has self-injection option
    siDoses: [1,2,3,4],     // take-home dose options
    siIntervalDays: 91,     // each take-home adds 13 weeks
    returnLabel: { en: 'Next injection due', sw: 'Sindano ijayo' },
    graceLabel: { en: 'Grace period ends (17 weeks)', sw: 'Muda wa neema unaisha (wiki 17)' },
    graceWarning: { en: 'After this date, rule out pregnancy before injecting.', sw: 'Baada ya tarehe hii, hakikisha huna ujauzito kabla ya kusindania.' },
    notes: {
      en: ['Shake vigorously 30 seconds before injecting (MAPS — Mix step)', 'If late beyond grace period, see a provider before next dose', 'No periods while on DMPA-SC is normal and safe'],
      sw: ['Tikisa kwa nguvu sekunde 30 kabla ya sindano (MAPS — Changanya)', 'Ukichelewa zaidi ya muda wa neema, ona mtoa huduma', 'Kutokuwa na hedhi kwenye DMPA-SC ni kawaida na salama']
    }
  },
  {
    id: 'dmpa_im',
    emoji: '💉',
    name: { en: 'DMPA-IM (Depo Injection)', sw: 'DMPA-IM (Sindano ya Depo)' },
    color: '#059669',
    intervalDays: 84,       // 12 weeks
    graceDays: 28,          // +4 weeks grace = 16 weeks total
    hasSI: false,
    returnLabel: { en: 'Next injection due', sw: 'Sindano ijayo' },
    graceLabel: { en: 'Grace period ends (16 weeks)', sw: 'Muda wa neema unaisha (wiki 16)' },
    graceWarning: { en: 'After this date, rule out pregnancy before injecting.', sw: 'Baada ya tarehe hii, hakikisha huna ujauzito kabla ya sindano.' },
    notes: {
      en: ['Must be given by a trained provider', 'If late beyond grace period, see a provider before next dose'],
      sw: ['Lazima ipewe na mtoa huduma aliyefunzwa', 'Ukichelewa zaidi ya muda wa neema, ona mtoa huduma']
    }
  },
  {
    id: 'net_en',
    emoji: '💉',
    name: { en: 'NET-EN (Noristerat)', sw: 'NET-EN (Noristerat)' },
    color: '#0891b2',
    intervalDays: 56,       // 8 weeks
    graceDays: 14,          // +2 weeks grace = 10 weeks total
    hasSI: false,
    returnLabel: { en: 'Next injection due', sw: 'Sindano ijayo' },
    graceLabel: { en: 'Grace period ends (10 weeks)', sw: 'Muda wa neema unaisha (wiki 10)' },
    graceWarning: { en: 'After this date, rule out pregnancy before injecting.', sw: 'Baada ya tarehe hii, hakikisha huna ujauzito.' },
    notes: {
      en: ['Given every 8 weeks (stricter than DMPA)', 'Must be given by a trained provider'],
      sw: ['Hutolewa kila wiki 8 (kali zaidi kuliko DMPA)', 'Lazima ipewe na mtoa huduma aliyefunzwa']
    }
  },
  {
    id: 'coc',
    emoji: '💊',
    name: { en: 'Combined Pill (COC)', sw: 'Kidonge cha Pamoja (COC)' },
    color: '#ec4899',
    intervalDays: 28,       // monthly resupply
    graceDays: 0,
    hasSI: false,
    returnLabel: { en: 'Next resupply visit', sw: 'Ziara ya kujaza dawa' },
    graceLabel: null,
    notes: {
      en: ['Take one pill every day at the same time', 'If you miss 2+ pills, use backup contraception for 7 days', 'Collect 3-month supply to avoid running out'],
      sw: ['Chukua kidonge kimoja kila siku kwa wakati mmoja', 'Ukikosa vidonge 2+, tumia njia ya kuzuia ujauzito ya ziada kwa siku 7', 'Chukua akiba ya miezi 3 ili kuepuka kukosa']
    }
  },
  {
    id: 'pop',
    emoji: '💊',
    name: { en: 'Progestogen-Only Pill (POP)', sw: 'Kidonge cha Projestojeni (POP)' },
    color: '#d946ef',
    intervalDays: 28,
    graceDays: 0,
    hasSI: false,
    returnLabel: { en: 'Next resupply visit', sw: 'Ziara ya kujaza dawa' },
    graceLabel: null,
    notes: {
      en: ['Take every day — no pill-free week', 'If more than 3 hours late, use backup for 48 hours', 'Safe for breastfeeding mothers'],
      sw: ['Chukua kila siku — hakuna wiki ya kukosa', 'Ukichelewa zaidi ya masaa 3, tumia njia ya ziada kwa masaa 48', 'Salama kwa mama wanaonyonyesha']
    }
  },
  {
    id: 'implant',
    emoji: '🔵',
    name: { en: 'Implant (Implanon/Jadelle)', sw: 'Kipandikizi (Implanon/Jadelle)' },
    color: '#7c3aed',
    intervalDays: 365 * 3,  // Implanon 3 years (use Jadelle option separately)
    graceDays: 30,
    hasSI: false,
    returnLabel: { en: 'Replacement due (Implanon — 3 years)', sw: 'Badilisha (Implanon — miaka 3)' },
    graceLabel: { en: 'Do not delay beyond this date', sw: 'Usichelewesha zaidi ya tarehe hii' },
    graceWarning: { en: 'Implant effectiveness ends. See provider immediately.', sw: 'Ufanisi wa kipandikizi unaisha. Ona mtoa huduma mara moja.' },
    notes: {
      en: ['Implanon NXT: 3 years | Jadelle: 5 years', 'Can be removed anytime if you want to get pregnant', 'Effectiveness does NOT decline before expiry date'],
      sw: ['Implanon NXT: miaka 3 | Jadelle: miaka 5', 'Inaweza kuondolewa wakati wowote ukitaka kupata mimba', 'Ufanisi HAUPUNGUI kabla ya tarehe ya kumalizika']
    }
  },
  {
    id: 'jadelle',
    emoji: '🔵',
    name: { en: 'Jadelle Implant (5 years)', sw: 'Kipandikizi Jadelle (miaka 5)' },
    color: '#6d28d9',
    intervalDays: 365 * 5,
    graceDays: 30,
    hasSI: false,
    returnLabel: { en: 'Replacement due (5 years)', sw: 'Badilisha (miaka 5)' },
    graceLabel: { en: 'Do not delay beyond this date', sw: 'Usichelewesha zaidi ya tarehe hii' },
    graceWarning: { en: 'Jadelle effectiveness ends. See provider immediately.', sw: 'Ufanisi wa Jadelle unaisha. Ona mtoa huduma mara moja.' },
    notes: {
      en: ['Jadelle lasts 5 years — longer than Implanon', 'Check strings/rod is still palpable annually', 'Can be removed anytime for pregnancy'],
      sw: ['Jadelle inadumu miaka 5 — zaidi ya Implanon', 'Angalia kama fimbo bado inahisiwa kila mwaka', 'Inaweza kuondolewa wakati wowote']
    }
  },
  {
    id: 'cu_iud',
    emoji: '🔩',
    name: { en: 'Copper IUD (Cu-T)', sw: 'IUD ya Shaba (Cu-T)' },
    color: '#f59e0b',
    intervalDays: 365 * 10,
    graceDays: 30,
    hasSI: false,
    returnLabel: { en: 'Replacement due (10–12 years)', sw: 'Badilisha (miaka 10–12)' },
    graceLabel: { en: 'See provider for check or replacement', sw: 'Ona mtoa huduma kwa ukaguzi au kubadilisha' },
    graceWarning: { en: 'Copper IUD effectiveness may be declining. Get checked.', sw: 'Ufanisi wa IUD ya shaba unaweza kupungua. Fanyiwa ukaguzi.' },
    notes: {
      en: ['Check strings monthly after period ends', 'Most effective emergency contraception within 5 days', 'No hormones — safe for all women including breastfeeding'],
      sw: ['Angalia nyuzi kila mwezi baada ya hedhi', 'Njia bora ya dharura ndani ya siku 5', 'Hakuna homoni — salama kwa wanawake wote']
    }
  },
  {
    id: 'lng_ius',
    emoji: '🔩',
    name: { en: 'LNG-IUS (Mirena)', sw: 'LNG-IUS (Mirena)' },
    color: '#ea580c',
    intervalDays: 365 * 5,
    graceDays: 30,
    hasSI: false,
    returnLabel: { en: 'Replacement due (5–7 years)', sw: 'Badilisha (miaka 5–7)' },
    graceLabel: { en: 'See provider for replacement', sw: 'Ona mtoa huduma kubadilisha' },
    graceWarning: { en: 'LNG-IUS effectiveness ends. See provider.', sw: 'Ufanisi wa LNG-IUS unaisha. Ona mtoa huduma.' },
    notes: {
      en: ['Mirena lasts 5-7 years depending on age at insertion', 'Often reduces or stops periods — normal and safe', 'Good for women with heavy periods'],
      sw: ['Mirena inadumu miaka 5-7 kutegemea umri wa kuwekwa', 'Mara nyingi hupunguza au kusimamisha hedhi — kawaida na salama', 'Nzuri kwa wanawake wenye hedhi nzito']
    }
  },
]

// ── HELPERS ────────────────────────────────────────────────────────────────────
const fmt = (d) => d instanceof Date && !isNaN(d)
  ? d.toLocaleDateString('en-KE', { weekday:'short', year:'numeric', month:'short', day:'numeric' })
  : '—'

const daysUntil = (d) => {
  if (!d) return null
  const diff = Math.ceil((d - new Date()) / (1000*60*60*24))
  return diff
}

const countdownColor = (days) => {
  if (days === null) return 'text-gray-400'
  if (days < 0)   return 'text-red-600'
  if (days <= 7)  return 'text-red-500'
  if (days <= 14) return 'text-amber-500'
  return 'text-teal-600'
}

const countdownBg = (days) => {
  if (days === null) return 'bg-gray-50 border-gray-200'
  if (days < 0)   return 'bg-red-50 border-red-300'
  if (days <= 7)  return 'bg-red-50 border-red-200'
  if (days <= 14) return 'bg-amber-50 border-amber-200'
  return 'bg-teal-50 border-teal-200'
}

const countdownLabel = (days, lang) => {
  if (days === null) return ''
  if (days < 0)  return lang === 'sw' ? `${Math.abs(days)} siku zilizopita!` : `${Math.abs(days)} days overdue!`
  if (days === 0) return lang === 'sw' ? 'Leo!' : 'Today!'
  if (days === 1) return lang === 'sw' ? 'Kesho' : 'Tomorrow'
  return lang === 'sw' ? `Siku ${days} zilizobaki` : `${days} days left`
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function NovaReturnDate({ lang = 'en' }) {
  const [saved,      setSaved]      = useState(getStored())
  const [activeView, setActiveView] = useState('calculate') // 'calculate' | 'saved'
  const [method,     setMethod]     = useState(null)
  const [lastDate,   setLastDate]   = useState('')
  const [siDoses,    setSiDoses]    = useState(1)
  const [label,      setLabel]      = useState('')
  const [result,     setResult]     = useState(null)
  const [saved_msg,  setSavedMsg]   = useState(false)

  // Refresh countdown every minute
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n+1), 60000)
    return () => clearInterval(t)
  }, [])

  const calculate = () => {
    if (!method || !lastDate) return
    const base = new Date(lastDate)

    // For DMPA-SC SI with multiple doses, the next date is after all doses
    const totalDays = method.hasSI
      ? method.intervalDays * siDoses
      : method.intervalDays

    const nextDate  = new Date(base.getTime() + totalDays * 24*60*60*1000)
    const graceDate = method.graceDays > 0
      ? new Date(nextDate.getTime() + method.graceDays * 24*60*60*1000)
      : null

    // For SI: calculate individual dose dates
    const doseDates = method.hasSI && siDoses > 1
      ? Array.from({length: siDoses}, (_, i) =>
          new Date(base.getTime() + method.intervalDays * (i+1) * 24*60*60*1000))
      : null

    setResult({ method, nextDate, graceDate, doseDates, lastDate, siDoses: method.hasSI ? siDoses : null })
  }

  const saveResult = () => {
    if (!result) return
    const entry = {
      id: Date.now(),
      methodId:  result.method.id,
      methodName: result.method.name,
      emoji: result.method.emoji,
      color: result.method.color,
      lastDate:  result.lastDate,
      nextDate:  result.nextDate.toISOString(),
      graceDate: result.graceDate ? result.graceDate.toISOString() : null,
      doseDates: result.doseDates ? result.doseDates.map(d => d.toISOString()) : null,
      siDoses:   result.siDoses,
      label:     label || result.method.name[lang],
      savedAt:   new Date().toISOString(),
    }
    const updated = [entry, ...saved].slice(0, 10)
    setSaved(updated); saveStored(updated)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  const deleteEntry = (id) => {
    const updated = saved.filter(e => e.id !== id)
    setSaved(updated); saveStored(updated)
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="font-bold text-gray-800 text-lg">
          {lang === 'sw' ? '📅 Tarehe ya Kurudi' : '📅 Return Date Calculator'}
        </h2>
        <p className="text-sm text-gray-500">
          {lang === 'sw' ? 'Kwa njia zote za uzazi wa mpango' : 'For all family planning methods'}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {[
          { key:'calculate', label: lang==='sw' ? '🧮 Hesabu' : '🧮 Calculate' },
          { key:'saved',     label: lang==='sw' ? `💾 Zilizohifadhiwa (${saved.length})` : `💾 Saved (${saved.length})` },
        ].map(v => (
          <button key={v.key} onClick={() => setActiveView(v.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors
              ${activeView===v.key ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            style={activeView===v.key ? {background:'linear-gradient(135deg,#ec4899,#f59e0b)'} : {}}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── CALCULATE VIEW ── */}
      {activeView === 'calculate' && (
        <div className="space-y-4">

          {/* Step 1: Select method */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              {lang==='sw' ? 'Hatua 1 — Chagua Njia' : 'Step 1 — Select Method'}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {METHODS.map(m => (
                <button key={m.id} onClick={() => { setMethod(m); setResult(null); setSiDoses(1) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-colors
                    ${method?.id === m.id ? 'text-white' : 'border-gray-100 text-gray-700 hover:border-gray-300 bg-white'}`}
                  style={method?.id === m.id ? {background: m.color, borderColor: m.color} : {}}>
                  <span className="text-xl flex-shrink-0">{m.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm leading-tight">{m.name[lang]}</p>
                    <p className={`text-xs mt-0.5 ${method?.id===m.id ? 'opacity-80' : 'text-gray-400'}`}>
                      {lang==='sw' ? `Muda: siku ${m.intervalDays}` : `Interval: ${m.intervalDays} days`}
                      {m.hasSI && (lang==='sw' ? ' · Inaweza kujisindania' : ' · SI available')}
                    </p>
                  </div>
                  {method?.id === m.id && <span className="text-white text-lg">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: SI doses (DMPA-SC only) */}
          {method?.hasSI && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                {lang==='sw' ? 'Hatua 2 — Dozi za Kujisindania (SI)' : 'Step 2 — Self-Injection Doses'}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                {lang==='sw'
                  ? 'Una dozi ngapi za DMPA-SC za kujisindania nyumbani? (ikijumuisha ya leo)'
                  : 'How many DMPA-SC doses do you have for self-injection at home? (including today\'s dose)'}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4].map(n => (
                  <button key={n} onClick={() => { setSiDoses(n); setResult(null) }}
                    className={`py-3 rounded-xl border-2 font-bold text-sm transition-colors
                      ${siDoses === n ? 'text-white' : 'border-gray-200 text-gray-600 bg-white'}`}
                    style={siDoses === n ? {background:'#14a044', borderColor:'#14a044'} : {}}>
                    {n} {lang==='sw' ? (n===1?'dozi':'dozi') : (n===1?'dose':'doses')}
                  </button>
                ))}
              </div>
              {siDoses > 1 && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs text-green-700">
                    {lang==='sw'
                      ? `✅ Dozi ${siDoses} za kujisindania = miadi ijayo baada ya wiki ${siDoses * 13}`
                      : `✅ ${siDoses} SI doses = next clinic visit in ${siDoses * 13} weeks`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Date */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              {lang==='sw'
                ? (method?.hasSI ? 'Hatua 3 — Tarehe ya Sindano ya Kwanza' : 'Hatua 2 — Tarehe ya Huduma ya Mwisho')
                : (method?.hasSI ? 'Step 3 — Date of First/Last Dose' : 'Step 2 — Date of Last Service')}
            </p>
            <input type="date"
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              value={lastDate}
              onChange={e => { setLastDate(e.target.value); setResult(null) }}
              aria-label={lang==='sw' ? 'Tarehe ya huduma ya mwisho' : 'Date of last service'}
            />
          </div>

          {/* Optional label */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              {lang==='sw' ? 'Lebo (si lazima)' : 'Label (optional)'}
            </p>
            <input
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder={lang==='sw' ? 'Mfano: Sindano yangu ya kwanza' : 'e.g. My first injection'}
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>

          {/* Calculate button */}
          <button onClick={calculate}
            disabled={!method || !lastDate}
            className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-300 disabled:shadow-none transition-all"
            style={method && lastDate ? {background:'linear-gradient(135deg,#ec4899,#f59e0b)'} : {}}>
            <Calendar size={18}/>
            {lang==='sw' ? 'Hesabu Tarehe' : 'Calculate Dates'}
          </button>

          {/* RESULT ── */}
          {result && (
            <div className="space-y-3">

              {/* Main return date */}
              <div className={`rounded-2xl border-2 p-5 ${countdownBg(daysUntil(result.nextDate))}`}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{color: result.method.color}}>
                  {result.method.returnLabel[lang]}
                </p>
                <p className="text-xl font-bold text-gray-800">{fmt(result.nextDate)}</p>
                <div className={`mt-2 text-lg font-black ${countdownColor(daysUntil(result.nextDate))}`}>
                  {countdownLabel(daysUntil(result.nextDate), lang)}
                </div>
              </div>

              {/* Grace period */}
              {result.graceDate && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">
                    {result.method.graceLabel[lang]}
                  </p>
                  <p className="text-base font-bold text-amber-700">{fmt(result.graceDate)}</p>
                  <p className="text-xs text-amber-600 mt-1.5">⚠️ {result.method.graceWarning[lang]}</p>
                </div>
              )}

              {/* SI dose schedule */}
              {result.doseDates && result.doseDates.length > 1 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">
                    {lang==='sw' ? '💉 Ratiba ya Dozi za SI' : '💉 SI Dose Schedule'}
                  </p>
                  <div className="space-y-2">
                    {result.doseDates.map((d, i) => {
                      const days = daysUntil(d)
                      return (
                        <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {i+1}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-gray-700">
                                {lang==='sw' ? `Dozi ${i+1}` : `Dose ${i+1}`}
                                {i === result.doseDates.length-1 && (
                                  <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                    {lang==='sw' ? 'Kliniki' : 'Clinic'}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">{fmt(d)}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold ${countdownColor(days)}`}>
                            {countdownLabel(days, lang)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Method notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                  {lang==='sw' ? 'ℹ️ Ukumbusho wa Njia' : 'ℹ️ Method Reminders'}
                </p>
                {result.method.notes[lang].map((n, i) => (
                  <p key={i} className="text-xs text-blue-700 mb-1">• {n}</p>
                ))}
              </div>

              {/* Save button */}
              <button onClick={saveResult}
                className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-2xl transition-colors"
                style={{background: saved_msg ? '#14a044' : '#374151'}}>
                {saved_msg
                  ? <><span>✅</span> {lang==='sw' ? 'Imehifadhiwa!' : 'Saved!'}</>
                  : <><Save size={16}/> {lang==='sw' ? 'Hifadhi Tarehe Hii' : 'Save This Date'}</>
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SAVED VIEW ── */}
      {activeView === 'saved' && (
        <div className="space-y-3">
          {saved.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar size={36} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm font-medium">
                {lang==='sw' ? 'Hakuna tarehe zilizohifadhiwa bado.' : 'No saved dates yet.'}
              </p>
              <p className="text-xs mt-1">
                {lang==='sw' ? 'Hesabu na uhifadhi tarehe ya kurudi.' : 'Calculate and save a return date above.'}
              </p>
            </div>
          ) : saved.map(e => {
            const nextDate  = new Date(e.nextDate)
            const graceDate = e.graceDate ? new Date(e.graceDate) : null
            const days      = daysUntil(nextDate)
            return (
              <div key={e.id} className={`rounded-2xl border-2 p-4 ${countdownBg(days)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-2xl">{e.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">{e.label || e.methodName?.[lang]}</p>
                      <p className="text-xs text-gray-500">{e.methodName?.[lang]}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteEntry(e.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={14}/>
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">{lang==='sw' ? 'Tarehe ya Kurudi:' : 'Return Date:'}</p>
                    <p className="text-sm font-bold text-gray-800">{fmt(nextDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${countdownColor(days)}`}>
                      {days !== null && Math.abs(days)}
                    </p>
                    <p className={`text-xs font-semibold ${countdownColor(days)}`}>
                      {days !== null && (days < 0
                        ? (lang==='sw' ? 'siku zilizopita' : 'days overdue')
                        : (lang==='sw' ? 'siku zilizobaki' : 'days left'))}
                    </p>
                  </div>
                </div>

                {graceDate && days < 0 && (
                  <div className="mt-2 bg-red-100 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-700 font-medium">
                      ⚠️ {lang==='sw'
                        ? `Umechelewa! Muda wa neema unaisha ${fmt(graceDate)}`
                        : `Overdue! Grace period ends ${fmt(graceDate)}`}
                    </p>
                  </div>
                )}

                {/* Dose schedule if SI */}
                {e.doseDates && e.doseDates.length > 1 && (
                  <div className="mt-2 space-y-1">
                    {e.doseDates.map((d, i) => {
                      const dd = daysUntil(new Date(d))
                      return (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            {lang==='sw' ? `Dozi ${i+1}` : `Dose ${i+1}`}: {fmt(new Date(d))}
                          </span>
                          <span className={`font-bold ${countdownColor(dd)}`}>
                            {countdownLabel(dd, lang)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {saved.length > 0 && (
            <button onClick={() => { if(window.confirm(lang==='sw'?'Futa tarehe zote?':'Delete all saved dates?')) { setSaved([]); saveStored([]) } }}
              className="w-full text-red-400 border border-red-200 text-xs font-semibold py-2.5 rounded-xl hover:bg-red-50">
              {lang==='sw' ? 'Futa Zote' : 'Delete All'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
