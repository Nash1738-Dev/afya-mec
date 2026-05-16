import { useState, useEffect, useRef } from 'react'
import { Heart, ChevronDown, ChevronUp, Trash2, Calendar,
         Bell, Shield, Info, Plus, X, Check } from 'lucide-react'

// ── STORAGE ────────────────────────────────────────────────────────────────────
const K = {
  cycles:   'nova_cycles',
  symptoms: 'nova_symptoms_log',
  sexLog:   'nova_sex_log',
  fpMethod: 'nova_fp_method',
  settings: 'nova_tracker_settings',
}
const load  = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback } }
const save  = (key, val)      => localStorage.setItem(key, JSON.stringify(val))

// ── CYCLE ENGINE ───────────────────────────────────────────────────────────────
const getPhase = (day, len = 28) => {
  const ov = len - 14
  if (day <= 5)         return { id:'menstrual',  emoji:'🔴', color:'#dc2626', en:'Menstrual',   sw:'Hedhi',       desc:{ en:'Uterine lining sheds. Energy may be low — rest is productive.', sw:'Ukuta wa mfuko wa uzazi unatolewa. Nguvu inaweza kuwa chini — kupumzika ni manufaa.' } }
  if (day <= ov - 2)    return { id:'follicular', emoji:'🌱', color:'#14a044', en:'Follicular',  sw:'Follicular',  desc:{ en:'Rising estrogen boosts energy and mood. Fertility increasing.', sw:'Estrojeni inayoongezeka huimarisha nguvu na hisia. Uzazi unaongezeka.' } }
  if (day <= ov + 2)    return { id:'ovulation',  emoji:'⭐', color:'#f59e0b', en:'Ovulation',   sw:'Ovulation',   desc:{ en:'Peak fertility. Egg released. Highest pregnancy chance this cycle.', sw:'Uzazi wa kilele. Yai limetolewa. Uwezekano mkubwa wa ujauzito.' } }
  return                       { id:'luteal',     emoji:'🌙', color:'#7c3aed', en:'Luteal',      sw:'Luteal',      desc:{ en:'Post-ovulation. Fertility declining. PMS symptoms may appear.', sw:'Baada ya ovulation. Uzazi unashuka. Dalili za PMS zinaweza kutokea.' } }
}

const getDayType = (day, len = 28) => {
  const ov = len - 14
  if (day <= 5)                               return 'period'
  if (day === ov)                             return 'ovulation'
  if (day >= ov - 4 && day <= ov + 1)        return 'fertile'
  if (day >= ov + 2 && day <= ov + 5)        return 'post_ovulation'
  if (day >= len - 3 || day <= 2)            return 'pre_period'
  return 'safe'
}

const getFertilityPct = (day, len = 28) => {
  const ov = len - 14
  const dist = Math.abs(day - ov)
  if (dist === 0) return { pct: 95, level: 'PEAK',   color: '#dc2626' }
  if (dist <= 1)  return { pct: 80, level: 'HIGH',   color: '#ea580c' }
  if (dist <= 3)  return { pct: 35, level: 'MEDIUM', color: '#f59e0b' }
  if (dist <= 5)  return { pct: 15, level: 'LOW',    color: '#84cc16' }
  return                  { pct: 3,  level: 'VERY LOW', color: '#14a044' }
}

// Return date config per FP method
const FP_METHODS = [
  { id:'dmpa_sc',  label:'DMPA-SC (Sayana Press)',   days:91,        grace:28  },
  { id:'dmpa_im',  label:'DMPA-IM (Depo)',            days:84,        grace:28  },
  { id:'net_en',   label:'NET-EN (Noristerat)',        days:56,        grace:14  },
  { id:'implant',  label:'Implant (Implanon)',         days:365*3,     grace:30  },
  { id:'jadelle',  label:'Jadelle (5 years)',          days:365*5,     grace:30  },
  { id:'cu_iud',   label:'Copper IUD',                days:365*10,    grace:30  },
  { id:'lng_ius',  label:'LNG-IUS (Mirena)',           days:365*5,     grace:30  },
  { id:'coc',      label:'Combined Pill (COC)',        days:28,        grace:0   },
  { id:'pop',      label:'Mini Pill (POP)',            days:28,        grace:0   },
  { id:'condom',   label:'Condom only',                days:null,      grace:0   },
  { id:'none',     label:'No method currently',       days:null,      grace:0   },
]

const SYMPTOMS_EN = {
  flow:  ['Spotting','Light','Medium','Heavy','Very Heavy'],
  pain:  ['None','Mild cramps','Moderate cramps','Severe cramps','Back pain','Headache'],
  mood:  ['Happy','Calm','Irritable','Anxious','Sad','Energetic','Very tired'],
  body:  ['Bloating','Breast tenderness','Acne','Nausea','Fatigue','Appetite changes','Dizzy'],
  other: ['Good sleep','Poor sleep','High energy','Low energy','Exercise done','Sick','Stressed'],
}
const SYMPTOMS_SW = {
  flow:  ['Madoa','Kidogo','Wastani','Nyingi','Nyingi Sana'],
  pain:  ['Hakuna','Maumivu madogo','Maumivu ya wastani','Maumivu makali','Maumivu ya mgongo','Maumivu ya kichwa'],
  mood:  ['Furaha','Utulivu','Hasira','Wasiwasi','Huzuni','Na nguvu','Uchovu mkubwa'],
  body:  ['Kuvimba','Maumivu ya matiti','Chunusi','Kichefuchefu','Uchovu','Mabadiliko ya hamu ya kula','Kizunguzungu'],
  other: ['Usingizi mzuri','Usingizi mbaya','Nguvu nyingi','Nguvu kidogo','Mazoezi yamefanywa','Mgonjwa','Msongo'],
}

const FAQS_EN = [
  { q:'What is Day 1 of my cycle?', a:'Day 1 is the FIRST day of your actual period bleeding — not spotting. This is always Day 1, no matter how long your last cycle was. Everything else is counted from this day.' },
  { q:'What is a normal cycle length?', a:'Normal cycles range from 21 to 35 days. The "28-day cycle" is just an average — most women vary. Track at least 3 cycles to find YOUR pattern. Cycles under 21 or over 35 days regularly should be discussed with a provider.' },
  { q:'When am I most fertile?', a:'Ovulation typically happens 14 days BEFORE your next period — not 14 days after your period starts (unless your cycle is exactly 28 days). Your fertile window is roughly 5 days before ovulation plus the day itself. Sperm survives 5 days, eggs survive 12-24 hours.' },
  { q:'Can I get pregnant during my period?', a:'Unlikely but possible — especially with short cycles (21-24 days) or long periods (7+ days). Sperm can survive 5 days. No phase of the cycle is completely "safe" without contraception. Always use your chosen FP method.' },
  { q:'Is it normal to have no period on DMPA-SC?', a:'Yes — very common and completely safe. Up to 70% of women stop having periods after 1 year on DMPA. Your blood is NOT building up inside — the uterine lining simply does not build up. This is actually a health benefit for many women. It does NOT mean the method is failing.' },
  { q:'What is PMS and is it normal?', a:'Premenstrual Syndrome (PMS) affects up to 75% of women. Symptoms occur 1-2 weeks before your period: bloating, breast tenderness, mood swings, fatigue, food cravings. Caused by hormonal changes. PMDD is a severe form that significantly impacts daily life — if this affects you, please see a provider.' },
  { q:'What does cervical mucus tell me?', a:'It changes throughout your cycle: After period — dry or minimal. Follicular phase — white/creamy, thicker. Near ovulation — clear, wet, stretchy like raw egg white (MOST FERTILE). After ovulation — thicker, white, less. Tracking this alongside your calendar increases accuracy.' },
  { q:'When should I see a provider about my periods?', a:'See a provider if: periods last more than 7 days, you soak a pad every hour for 2+ hours, severe pain affects daily activities, periods stop for 3+ months without contraception, or you have irregular cycles with unexplained symptoms.' },
  { q:'What if I am late for my injection?', a:'DMPA-SC: you have up to 17 weeks (not just 13) before you must see a provider. DMPA-IM: up to 16 weeks. Within the grace period — inject as normal. After the grace period — visit a clinic first to rule out pregnancy before your next dose.' },
  { q:'Can I track if I am on implant or IUD?', a:'Yes! Log today as Day 1 when your implant/IUD was inserted. The tracker will remind you when your replacement is due. With implant and IUD, your periods may be irregular or absent — this is normal. Log what you experience.' },
]
const FAQS_SW = [
  { q:'Siku ya 1 ya mzunguko wangu ni nini?', a:'Siku 1 ni SIKU YA KWANZA ya kutokwa damu ya hedhi halisi — si madoa. Hii ni siku 1 kila wakati, bila kujali urefu wa mzunguko wako wa mwisho. Kila kitu kingine kinahesabiwa kutoka siku hii.' },
  { q:'Urefu wa kawaida wa mzunguko ni nini?', a:'Mzunguko wa kawaida ni siku 21 hadi 35. Mzunguko wa siku 28 ni wastani tu — wanawake wengi wanatofautiana. Fuatilia mzunguko 3+ kupata mfumo WAKO. Mzunguko chini ya siku 21 au zaidi ya siku 35 mara kwa mara unapaswa kujadiliwa na mtoa huduma.' },
  { q:'Ni lini mimi ni na uzazi zaidi?', a:'Ovulation kawaida hutokea siku 14 KABLA ya hedhi yako ijayo. Dirisha lako la uzazi ni takriban siku 5 kabla ya ovulation pamoja na siku yenyewe. Manii inaweza kuishi siku 5, mayai yanaishi masaa 12-24.' },
  { q:'Ninaweza kupata ujauzito wakati wa hedhi?', a:'Ni nadra lakini inawezekana — hasa na mzunguko mfupi. Hakuna awamu ya mzunguko ambayo ni salama kabisa bila uzazi wa mpango. Endelea kutumia njia yako ya FP uliyochagua.' },
  { q:'Je, ni kawaida kutokuwa na hedhi kwenye DMPA-SC?', a:'Ndiyo — kawaida sana na salama kabisa. Hadi 70% ya wanawake huacha kupata hedhi baada ya mwaka 1 wa DMPA. Damu HAIKUSANYIKI ndani. Hii ni faida ya kiafya kwa wanawake wengi. HAIMAANISHI njia inashindwa.' },
  { q:'PMS ni nini?', a:'Ugonjwa wa Kabla ya Hedhi (PMS) huathiri hadi 75% ya wanawake. Dalili hutokea wiki 1-2 kabla ya hedhi: kuvimba, maumivu ya matiti, mabadiliko ya hisia, uchovu. Husababishwa na mabadiliko ya homoni.' },
  { q:'Kamasi ya seviksi inaniambia nini?', a:'Inabadilika katika mzunguko wako: Baada ya hedhi — kavu. Awamu ya follicular — nyeupe/ya cream. Karibu na ovulation — wazi, yenye unyevu, inayonyoosheka kama nyeupe mbichi ya yai (UZAZI WA JUU ZAIDI). Baada ya ovulation — nzito zaidi, nyeupe.' },
  { q:'Ninapaswa kuona mtoa huduma lini?', a:'Ona mtoa huduma ikiwa: hedhi inadumu zaidi ya siku 7, kutokwa damu kwingi sana, maumivu makali yanayoathiri shughuli za kila siku, hedhi inaacha ghafla kwa miezi 3+ bila uzazi wa mpango.' },
  { q:'Nifanye nini nikichelewa kwa sindano?', a:'DMPA-SC: una hadi wiki 17 (si wiki 13 tu) kabla ya kuona mtoa huduma. DMPA-IM: hadi wiki 16. Ndani ya muda wa neema — sindana kawaida. Baada ya muda wa neema — tembelea kliniki kwanza kuhakikisha huna ujauzito.' },
  { q:'Ninaweza kufuatilia nikiwa na kipandikizi au IUD?', a:'Ndiyo! Rekodi leo kama Siku 1 wakati kipandikizi/IUD yako iliwekwa. Mfumo utakukumbusha wakati wa kubadilisha. Na kipandikizi na IUD, hedhi yako inaweza kuwa isiyo ya kawaida au kutokuwepo — hii ni kawaida.' },
]

// ── DATE HELPERS ───────────────────────────────────────────────────────────────
const fmt = (d, opts = {}) => d ? new Date(d).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric', ...opts }) : '—'
const fmtFull = (d) => d ? new Date(d).toLocaleDateString('en-KE', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : '—'
const daysUntil = (d) => d ? Math.ceil((new Date(d) - new Date()) / (1000*60*60*24)) : null
const addDays = (d, n) => new Date(new Date(d).getTime() + n*24*60*60*1000)

// ── FAQ FLOATING BUTTON ────────────────────────────────────────────────────────
function FAQModal({ lang, onClose }) {
  const faqs = lang === 'sw' ? FAQS_SW : FAQS_EN
  const [open, setOpen] = useState(null)
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="font-bold text-gray-800">❓ {lang==='sw' ? 'Maswali ya Kawaida' : 'Frequently Asked Questions'}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500"/>
          </button>
        </div>
        <div className="p-4 space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-gray-50 rounded-xl overflow-hidden">
              <button className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpen(open===i ? null : i)}>
                <p className="text-sm font-medium text-gray-700 pr-3">{faq.q}</p>
                {open===i ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0"/> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0"/>}
              </button>
              {open===i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── COLOR-CODED CALENDAR ───────────────────────────────────────────────────────
function CycleCalendar({ cycles, cycleLen, sexLog, lang, onDayTap }) {
  const [viewDate, setViewDate] = useState(new Date())
  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const firstDay    = new Date(year, month, 1).getDay()
  const today       = new Date()
  const monthName   = viewDate.toLocaleDateString('en-KE', { month:'long', year:'numeric' })

  // Build period day sets from logged cycles
  const periodDays = new Set()
  cycles.forEach(c => {
    const s = new Date(c.start)
    const e = c.end ? new Date(c.end) : addDays(s, 4)
    for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
      if (d.getFullYear()===year && d.getMonth()===month) periodDays.add(d.getDate())
    }
  })

  // Build predicted days from last cycle
  const last = cycles[0]
  const predictedPeriodDays = new Set()
  const predictedOvDay = { day: null }
  if (last && cycles.length >= 2) {
    const prev = cycles[1]
    const len  = Math.ceil((new Date(last.start) - new Date(prev.start)) / (1000*60*60*24))
    if (len > 15 && len < 60) {
      const nextStart = addDays(last.start, len)
      for (let i = 0; i <= 4; i++) {
        const d = addDays(nextStart, i)
        if (d.getFullYear()===year && d.getMonth()===month) predictedPeriodDays.add(d.getDate())
      }
    }
  }

  // For each day of current month, compute what type it is based on last period
  const getDayInfo = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    if (periodDays.has(day)) return { type:'period', color:'#dc2626', bg:'#fef2f2' }
    if (predictedPeriodDays.has(day)) return { type:'predicted', color:'#ec4899', bg:'#fdf2f8' }

    if (!last) return { type:'normal', color:'#374151', bg:'transparent' }

    const cycleStart = new Date(last.start)
    const thisDate   = new Date(year, month, day)
    const cycleDay   = Math.ceil((thisDate - cycleStart) / (1000*60*60*24)) + 1

    if (cycleDay < 1 || cycleDay > cycleLen + 7) return { type:'normal', color:'#374151', bg:'transparent' }

    const type = getDayType(cycleDay, cycleLen)
    const colors = {
      period:        { color:'#dc2626', bg:'#fef2f2' },
      ovulation:     { color:'#ffffff', bg:'#f59e0b' },
      fertile:       { color:'#ea580c', bg:'#fff7ed' },
      post_ovulation:{ color:'#7c3aed', bg:'#f5f3ff' },
      pre_period:    { color:'#be185d', bg:'#fdf4ff' },
      safe:          { color:'#059669', bg:'#f0fdf4' },
    }
    return { type, ...(colors[type] || { color:'#374151', bg:'transparent' }) }
  }

  // Sex log for this month
  const sexDays = new Set(
    (sexLog || [])
      .filter(s => { const d = new Date(s.date); return d.getFullYear()===year && d.getMonth()===month })
      .map(s => new Date(s.date).getDate())
  )

  const dayLetters = ['S','M','T','W','T','F','S']

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <button onClick={() => setViewDate(new Date(year, month-1, 1))}
          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
          ‹
        </button>
        <p className="font-bold text-gray-700 text-sm">{monthName}</p>
        <button onClick={() => setViewDate(new Date(year, month+1, 1))}
          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0 px-2 pt-2">
        {dayLetters.map((d,i) => (
          <div key={i} className="text-center text-xs text-gray-400 font-bold py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0 px-2 pb-3">
        {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`} className="py-1"/>)}
        {Array.from({length: daysInMonth}).map((_,i) => {
          const day = i + 1
          const isToday = day===today.getDate() && month===today.getMonth() && year===today.getFullYear()
          const info    = getDayInfo(day)
          const hasSex  = sexDays.has(day)
          const isDay1  = cycles[0] && day===new Date(cycles[0].start).getDate() && month===new Date(cycles[0].start).getMonth() && year===new Date(cycles[0].start).getFullYear()

          return (
            <button key={day}
              onClick={() => onDayTap && onDayTap(day, month, year, info)}
              className="relative py-0.5 flex flex-col items-center justify-center"
              style={{minHeight:'36px'}}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${isToday ? 'ring-2 ring-teal-500 ring-offset-1' : ''}`}
                style={{background: info.bg, color: info.color}}>
                {isDay1 && <span className="absolute -top-0.5 text-[8px] text-red-500 font-black leading-none">D1</span>}
                {day}
              </div>
              {hasSex && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-0.5"/>}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { color:'#dc2626', bg:'#fef2f2', label: lang==='sw' ? 'Hedhi' : 'Period' },
            { color:'#f59e0b', bg:'#f59e0b', label: lang==='sw' ? 'Ovulation' : 'Ovulation' },
            { color:'#ea580c', bg:'#fff7ed', label: lang==='sw' ? 'Kuzaa sana' : 'Fertile' },
            { color:'#059669', bg:'#f0fdf4', label: lang==='sw' ? 'Salama' : 'Safe days' },
            { color:'#ec4899', bg:'#fdf2f8', label: lang==='sw' ? 'Inatarajiwa' : 'Predicted' },
            { color:'#6b7280', bg:'transparent', label: lang==='sw' ? '• Ngono' : '• Sex logged', dot: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              {item.dot
                ? <div className="w-3 h-3 rounded-full bg-purple-400 flex-shrink-0"/>
                : <div className="w-4 h-4 rounded-full flex-shrink-0" style={{background: item.bg, border:`1.5px solid ${item.color}`}}/>
              }
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── FP METHOD SETUP ────────────────────────────────────────────────────────────
function FPSetup({ lang, onSave, current }) {
  const [onFP, setOnFP]         = useState(current?.onFP ?? null)
  const [methodId, setMethodId] = useState(current?.methodId || '')
  const [startDate, setStartDate] = useState(current?.startDate || '')

  const method = FP_METHODS.find(m => m.id === methodId)
  const returnDate = method?.days && startDate
    ? addDays(startDate, method.days).toISOString().slice(0,10)
    : null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
      <h3 className="font-bold text-gray-800">
        💊 {lang==='sw' ? 'Njia Yangu ya FP' : 'My FP Method'}
      </h3>
      <p className="text-xs text-gray-500">
        {lang==='sw'
          ? 'Hii itasaidia kufuatilia tarehe ya kurudi na kukupa ukumbusho'
          : 'This helps track your return date and sends you reminders'}
      </p>

      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          {lang==='sw' ? 'Je, unatumia njia ya uzazi wa mpango?' : 'Are you currently using a FP method?'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: true,  label: lang==='sw' ? '✅ Ndiyo' : '✅ Yes' },
            { val: false, label: lang==='sw' ? '❌ Hapana' : '❌ No / Not sure' },
          ].map(opt => (
            <button key={String(opt.val)} onClick={() => setOnFP(opt.val)}
              className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-colors
                ${onFP===opt.val ? 'text-white' : 'border-gray-200 text-gray-600'}`}
              style={onFP===opt.val ? {background:'#0d7377', borderColor:'#0d7377'} : {}}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {onFP === true && (
        <>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              {lang==='sw' ? 'Chagua njia:' : 'Select method:'}
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {FP_METHODS.filter(m => m.id !== 'none').map(m => (
                <button key={m.id} onClick={() => setMethodId(m.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl border-2 text-sm transition-colors
                    ${methodId===m.id ? 'text-white' : 'border-gray-100 text-gray-700 hover:border-gray-300'}`}
                  style={methodId===m.id ? {background:'#14a044', borderColor:'#14a044'} : {}}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {methodId && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {lang==='sw'
                  ? (methodId.includes('implant') || methodId.includes('iud') || methodId.includes('ius') || methodId.includes('jadelle')
                    ? 'Tarehe ya kuweka:' : 'Tarehe ya huduma ya mwisho:')
                  : (methodId.includes('implant') || methodId.includes('iud') || methodId.includes('ius') || methodId.includes('jadelle')
                    ? 'Date inserted:' : 'Date of last dose/service:')}
              </p>
              <input type="date"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={startDate} onChange={e => setStartDate(e.target.value)}/>
            </div>
          )}

          {returnDate && method?.days && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <p className="text-xs font-bold text-teal-700 mb-1">
                📅 {lang==='sw' ? 'Tarehe ya Kurudi:' : 'Return Date:'}
              </p>
              <p className="text-sm font-bold text-teal-800">{fmtFull(returnDate)}</p>
              {daysUntil(returnDate) !== null && (
                <p className={`text-xs font-semibold mt-1 ${daysUntil(returnDate) < 0 ? 'text-red-600' : daysUntil(returnDate) <= 14 ? 'text-amber-600' : 'text-teal-600'}`}>
                  {daysUntil(returnDate) < 0
                    ? `⚠️ ${Math.abs(daysUntil(returnDate))} ${lang==='sw'?'siku zilizopita — tafadhali tembela kliniki':'days overdue — please visit a clinic'}`
                    : daysUntil(returnDate) === 0
                      ? (lang==='sw' ? '🔔 Leo ni siku ya kurudi!' : '🔔 Return date is today!')
                      : `${daysUntil(returnDate)} ${lang==='sw'?'siku zilizobaki':'days remaining'}`}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {onFP !== null && (
        <button onClick={() => onSave({ onFP, methodId: onFP ? methodId : 'none', startDate: onFP ? startDate : '', returnDate })}
          disabled={onFP && (!methodId || !startDate)}
          className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition-colors"
          style={{background: 'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
          <Check size={16} className="inline mr-1"/>
          {lang==='sw' ? 'Hifadhi' : 'Save FP Info'}
        </button>
      )}
    </div>
  )
}

// ── SEX LOG MODAL ──────────────────────────────────────────────────────────────
function SexLogModal({ date, cycleDay, cycleLen, lang, onSave, onClose }) {
  const [protected_, setProtected] = useState(null)
  const fertility = cycleDay ? getFertilityPct(cycleDay, cycleLen) : null

  const DISCLAIMER = lang==='sw'
    ? '⚕️ Kumbuka: Hii si mbadala wa dawa ya daktari. Njia ya kalenda peke yake si ya kuaminika. Tumia njia yako ya FP kila wakati.'
    : '⚕️ Reminder: This is not a substitute for medical advice. Calendar-based methods alone are unreliable. Always use your chosen FP method.'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">💜 {lang==='sw' ? 'Rekodi Ngono' : 'Log Sex'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>

        <p className="text-xs text-gray-500 mb-4">{fmt(new Date(date))}</p>

        {fertility && cycleDay && (
          <div className={`rounded-xl p-3 mb-4 border ${
            fertility.level === 'PEAK' ? 'bg-red-50 border-red-200' :
            fertility.level === 'HIGH' ? 'bg-orange-50 border-orange-200' :
            fertility.level === 'MEDIUM' ? 'bg-amber-50 border-amber-200' :
            'bg-green-50 border-green-200'
          }`}>
            <p className="text-xs font-bold mb-0.5" style={{color: fertility.color}}>
              {lang==='sw' ? 'Uwezekano wa ujauzito siku hii:' : 'Pregnancy likelihood on this day:'}
              {' '}{fertility.pct}% — {fertility.level}
            </p>
            <p className="text-xs text-gray-600">
              {lang==='sw' ? `Siku ${cycleDay} ya mzunguko` : `Cycle day ${cycleDay}`}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            {lang==='sw' ? 'Je, ulitumia ulinzi?' : 'Was protection used?'}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { val: true,  label: lang==='sw' ? '✅ Ndiyo (kondomu/FP)' : '✅ Yes (condom/FP)' },
              { val: false, label: lang==='sw' ? '⚠️ Hapana' : '⚠️ No protection' },
            ].map(opt => (
              <button key={String(opt.val)} onClick={() => setProtected(opt.val)}
                className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-colors
                  ${protected_===opt.val ? 'text-white' : 'border-gray-200 text-gray-600'}`}
                style={protected_===opt.val ? {background: opt.val ? '#14a044' : '#dc2626'} : {}}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {protected_ === false && fertility && fertility.level !== 'VERY LOW' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-red-700 font-medium">
              {lang==='sw'
                ? `⚠️ Ngono bila kinga kwenye ${fertility.level === 'PEAK' || fertility.level === 'HIGH' ? 'dirisha la uzazi wa juu' : 'mzunguko wa kati'} — fikiria uzazi wa mpango wa dharura (P2/EC) ikiwa haukuwa na ulinzi.`
                : `⚠️ Unprotected sex during ${fertility.level === 'PEAK' || fertility.level === 'HIGH' ? 'peak/high fertility window' : 'mid-cycle'} — consider emergency contraception (ECP/P2) if no other protection was used.`}
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-blue-700">{DISCLAIMER}</p>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 text-sm font-semibold py-2.5 rounded-xl">
            {lang==='sw' ? 'Funga' : 'Cancel'}
          </button>
          <button onClick={() => { if (protected_ !== null) onSave({ protected: protected_ }); onClose() }}
            disabled={protected_ === null}
            className="flex-1 text-white text-sm font-bold py-2.5 rounded-xl disabled:bg-gray-300"
            style={{background: 'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
            {lang==='sw' ? 'Hifadhi' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── FP STATUS CARD ─────────────────────────────────────────────────────────────
function FPStatusCard({ fp, lang, onEdit }) {
  if (!fp || !fp.onFP || !fp.methodId || fp.methodId === 'none') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-amber-700">💊 {lang==='sw' ? 'Njia ya FP' : 'FP Method'}</p>
          <p className="text-sm text-amber-600">{lang==='sw' ? 'Bado haijasanidiwa' : 'Not set up yet'}</p>
        </div>
        <button onClick={onEdit}
          className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-bold">
          {lang==='sw' ? 'Weka' : 'Set up'}
        </button>
      </div>
    )
  }

  const method = FP_METHODS.find(m => m.id === fp.methodId)
  const days   = fp.returnDate ? daysUntil(fp.returnDate) : null
  const urgent = days !== null && days <= 14
  const overdue = days !== null && days < 0

  return (
    <div className={`rounded-xl border p-4 ${overdue ? 'bg-red-50 border-red-300' : urgent ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide mb-0.5"
            style={{color: overdue ? '#dc2626' : urgent ? '#d97706' : '#059669'}}>
            💊 {method?.label || fp.methodId}
          </p>
          {fp.returnDate && method?.days && (
            <>
              <p className="text-xs text-gray-600">
                {lang==='sw' ? 'Tarehe ya kurudi:' : 'Return date:'} {fmt(fp.returnDate)}
              </p>
              <p className={`text-sm font-bold mt-1 ${overdue ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-green-700'}`}>
                {overdue
                  ? `⚠️ ${Math.abs(days)} ${lang==='sw'?'siku zilizopita':'days overdue'}`
                  : days === 0
                    ? (lang==='sw' ? '🔔 Siku ya kurudi ni leo!' : '🔔 Return date is today!')
                    : `${days} ${lang==='sw'?'siku zilizobaki':'days to return date'}`}
              </p>
              {/* Progress bar */}
              {method?.days && fp.startDate && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((method.days - (days||0)) / method.days) * 100))}%`,
                        background: overdue ? '#dc2626' : urgent ? '#f59e0b' : '#14a044'
                      }}/>
                  </div>
                </div>
              )}
            </>
          )}
          {fp.methodId === 'condom' && (
            <p className="text-xs text-green-600 mt-1">{lang==='sw' ? '✅ Kondomu kila wakati' : '✅ Use condom every time'}</p>
          )}
        </div>
        <button onClick={onEdit} className="text-xs text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
          {lang==='sw' ? 'Hariri' : 'Edit'}
        </button>
      </div>

      {/* Urgent reminder */}
      {(urgent || overdue) && (
        <div className={`mt-3 rounded-lg px-3 py-2 ${overdue ? 'bg-red-100' : 'bg-amber-100'}`}>
          <p className={`text-xs font-bold ${overdue ? 'text-red-700' : 'text-amber-700'}`}>
            🔔 {overdue
              ? (lang==='sw' ? 'Umechelewa — tafadhali tembela kliniki mara moja' : 'Overdue — please visit your clinic soon')
              : (lang==='sw' ? 'Karibu na tarehe ya kurudi — panga ziara yako ya kliniki' : 'Return date approaching — plan your clinic visit')}
          </p>
        </div>
      )}
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function NovaCycleTracker({ lang = 'en', user }) {
  const [cycles,     setCycles]     = useState(() => load(K.cycles, []))
  const [symptomLog, setSymptomLog] = useState(() => load(K.symptoms, []))
  const [sexLog,     setSexLog]     = useState(() => load(K.sexLog, []))
  const [fp,         setFp]         = useState(() => load(K.fpMethod, null))
  const [section,    setSection]    = useState('overview')
  const [showFAQ,    setShowFAQ]    = useState(false)
  const [showFPSetup,setShowFPSetup]= useState(false)
  const [sexModal,   setSexModal]   = useState(null) // {day, month, year}

  // Log form state
  const [startDate,    setStartDate]    = useState('')
  const [endDate,      setEndDate]      = useState('')
  const [selectedSyms, setSelectedSyms] = useState({})
  const [cycleLength,  setCycleLength]  = useState(28)
  const [todayNote,    setTodayNote]    = useState('')
  const [logSaved,     setLogSaved]     = useState(false)

  // Auto-detect cycle length
  useEffect(() => {
    if (cycles.length >= 2) {
      const lens = []
      for (let i = 0; i < Math.min(cycles.length-1, 6); i++) {
        const l = Math.ceil((new Date(cycles[i].start) - new Date(cycles[i+1].start)) / (1000*60*60*24))
        if (l > 15 && l < 60) lens.push(l)
      }
      if (lens.length) setCycleLength(Math.round(lens.reduce((a,b)=>a+b,0)/lens.length))
    }
  }, [cycles])

  // Current cycle day
  const last = cycles[0]
  const today = new Date()
  const cycleDay = last
    ? Math.max(1, Math.ceil((today - new Date(last.start)) / (1000*60*60*24)))
    : null

  const phase     = cycleDay ? getPhase(cycleDay, cycleLength) : null
  const fertility = cycleDay ? getFertilityPct(cycleDay, cycleLength) : null

  // Predicted next period
  const predictedNext = (() => {
    if (!last || cycles.length < 2) return null
    const prev = cycles[1]
    const len  = Math.ceil((new Date(last.start) - new Date(prev.start)) / (1000*60*60*24))
    if (len < 15 || len > 60) return null
    return addDays(last.start, len)
  })()
  const daysToNext = predictedNext ? daysUntil(predictedNext) : null

  // Insights
  const getInsights = () => {
    if (cycles.length < 2) return []
    const lens = []
    for (let i = 0; i < cycles.length-1; i++) {
      const l = Math.ceil((new Date(cycles[i].start)-new Date(cycles[i+1].start))/(1000*60*60*24))
      if (l>15 && l<60) lens.push(l)
    }
    const insights = []
    if (lens.length > 0) {
      const avg = Math.round(lens.reduce((a,b)=>a+b,0)/lens.length)
      const min = Math.min(...lens), max = Math.max(...lens)
      insights.push({ icon:'📊', ok:true, text: lang==='sw' ? `Wastani wa mzunguko: siku ${avg} (${min}–${max})` : `Average cycle: ${avg} days (${min}–${max})` })
      if (max-min > 7) insights.push({ icon:'⚠️', ok:false, text: lang==='sw' ? 'Mzunguko wako unatofautiana kwa zaidi ya siku 7 — fikiria kuona mtoa huduma' : 'Your cycles vary by more than 7 days — consider seeing a provider' })
      if (avg < 21 || avg > 35) insights.push({ icon:'🩺', ok:false, text: lang==='sw' ? 'Urefu wa wastani wa mzunguko uko nje ya kawaida (siku 21-35)' : 'Average cycle length is outside normal range (21-35 days)' })
    }
    const durs = cycles.filter(c=>c.end).map(c=>Math.ceil((new Date(c.end)-new Date(c.start))/(1000*60*60*24)))
    if (durs.length > 0) {
      const avgDur = Math.round(durs.reduce((a,b)=>a+b,0)/durs.length)
      insights.push({ icon:'🗓️', ok:true, text: lang==='sw' ? `Wastani wa muda wa hedhi: siku ${avgDur}` : `Average period duration: ${avgDur} days` })
      if (avgDur > 7) insights.push({ icon:'⚠️', ok:false, text: lang==='sw' ? 'Muda wa wastani wa hedhi unazidi siku 7 — fikiria kuona mtoa huduma' : 'Average period exceeds 7 days — consider seeing a provider' })
    }
    return insights
  }

  const savePeriod = () => {
    if (!startDate) return
    const entry = { id:Date.now(), start:startDate, end:endDate||null, symptoms:Object.values(selectedSyms).flat() }
    const updated = [entry, ...cycles].slice(0,36)
    setCycles(updated); save(K.cycles, updated)
    setStartDate(''); setEndDate(''); setSelectedSyms({})
    setLogSaved(true); setTimeout(() => setLogSaved(false), 2000)
  }

  const saveSymptoms = () => {
    const syms = Object.values(selectedSyms).flat()
    if (!syms.length && !todayNote) return
    const entry = { id:Date.now(), date:today.toISOString().slice(0,10), day:cycleDay, phase:phase?.id, symptoms:syms, note:todayNote }
    const updated = [entry, ...symptomLog].slice(0,90)
    setSymptomLog(updated); save(K.symptoms, updated)
    setSelectedSyms({}); setTodayNote('')
    setLogSaved(true); setTimeout(() => setLogSaved(false), 2000)
  }

  const saveSex = (day, month, year, data) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const existing = sexLog.filter(s => s.date !== dateStr)
    const updated = [{ date:dateStr, ...data }, ...existing].slice(0,90)
    setSexLog(updated); save(K.sexLog, updated)
  }

  const saveFP = (data) => {
    setFp(data); save(K.fpMethod, data); setShowFPSetup(false)
  }

  const deleteCycle = (id) => {
    const updated = cycles.filter(c => c.id !== id)
    setCycles(updated); save(K.cycles, updated)
  }

  const toggleSym = (cat, sym) => setSelectedSyms(prev => {
    const catSyms = prev[cat] || []
    return { ...prev, [cat]: catSyms.includes(sym) ? catSyms.filter(s=>s!==sym) : [...catSyms, sym] }
  })

  const handleDayTap = (day, month, year, info) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const cycleStart = last ? new Date(last.start) : null
    const thisDate   = new Date(year, month, day)
    const cd = cycleStart ? Math.ceil((thisDate - cycleStart)/(1000*60*60*24))+1 : null
    setSexModal({ day, month, year, date:dateStr, cycleDay:cd })
  }

  const symCats = lang==='sw' ? SYMPTOMS_SW : SYMPTOMS_EN
  const sections = [
    { key:'overview',  label: lang==='sw' ? '🏠 Nyumbani'  : '🏠 Overview' },
    { key:'calendar',  label: lang==='sw' ? '📅 Kalenda'   : '📅 Calendar' },
    { key:'log',       label: lang==='sw' ? '📝 Rekodi'    : '📝 Log' },
    { key:'symptoms',  label: lang==='sw' ? '💊 Dalili'    : '💊 Symptoms' },
    { key:'fp',        label: lang==='sw' ? '💉 Njia ya FP': '💉 My FP' },
    { key:'insights',  label: lang==='sw' ? '💡 Mwanga'    : '💡 Insights' },
    { key:'history',   label: lang==='sw' ? '📊 Historia'  : '📊 History' },
  ]

  return (
    <div className="space-y-4 pb-20">

      {/* Section tabs */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1.5 min-w-max pb-1">
          {sections.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors
                ${section===s.key ? 'text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
              style={section===s.key ? {background:'linear-gradient(135deg,#ec4899,#f59e0b)'} : {}}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      {section==='overview' && (
        <div className="space-y-4">
          {/* Phase card */}
          {phase && cycleDay ? (
            <div className="rounded-2xl p-5 text-white shadow-lg"
              style={{background:`linear-gradient(135deg,${phase.color},${phase.color}bb)`}}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-bold opacity-80 uppercase tracking-wide">{lang==='sw' ? 'Awamu ya Sasa' : 'Current Phase'}</p>
                  <p className="text-3xl font-black mt-1">{phase.emoji} {phase[lang]}</p>
                  <p className="text-sm opacity-90 mt-1">{lang==='sw' ? `Siku ${cycleDay} ya mzunguko (urefu: siku ${cycleLength})` : `Day ${cycleDay} of cycle (length: ${cycleLength} days)`}</p>
                </div>
                <div className="text-center bg-white/25 rounded-2xl px-3 py-2 ml-3 flex-shrink-0">
                  <p className="text-2xl font-black">{fertility?.pct}%</p>
                  <p className="text-xs opacity-80 leading-tight">{lang==='sw' ? 'Uzazi' : 'Fertility'}</p>
                  <p className="text-xs font-bold mt-0.5 bg-white/20 rounded-full px-2 py-0.5">{fertility?.level}</p>
                </div>
              </div>
              <p className="text-sm opacity-90 mt-3 leading-relaxed">{phase.desc[lang]}</p>
            </div>
          ) : (
            <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5 text-center">
              <p className="text-4xl mb-2">🌸</p>
              <p className="font-bold text-pink-700">{lang==='sw' ? `Karibu, ${user?.nickname}!` : `Welcome, ${user?.nickname}!`}</p>
              <p className="text-sm text-pink-600 mt-1">{lang==='sw' ? 'Rekodi tarehe ya mwanzo wa hedhi yako ili kuanza.' : 'Log your last period start date to begin.'}</p>
              <button onClick={() => setSection('log')}
                className="mt-3 text-white text-sm font-bold px-5 py-2.5 rounded-xl"
                style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
                {lang==='sw' ? '+ Rekodi Hedhi' : '+ Log Period'}
              </button>
            </div>
          )}

          {/* FP Status */}
          <FPStatusCard fp={fp} lang={lang} onEdit={() => setSection('fp')}/>

          {/* Next period prediction */}
          {predictedNext && (
            <div className={`rounded-xl border p-4 ${daysToNext !== null && daysToNext <= 3 ? 'bg-red-50 border-red-200' : daysToNext !== null && daysToNext <= 7 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{color: daysToNext !== null && daysToNext <= 3 ? '#dc2626' : daysToNext !== null && daysToNext <= 7 ? '#d97706' : '#2563eb'}}>
                🔮 {lang==='sw' ? 'Hedhi Inayotarajiwa' : 'Predicted Next Period'}
              </p>
              <p className="text-base font-bold text-gray-800">{fmtFull(predictedNext)}</p>
              {daysToNext !== null && (
                <p className="text-sm font-semibold mt-1" style={{color: daysToNext<=3?'#dc2626':daysToNext<=7?'#d97706':'#6b7280'}}>
                  {daysToNext < 0
                    ? `${Math.abs(daysToNext)} ${lang==='sw'?'siku zilizopita':'days ago'}`
                    : daysToNext === 0 ? (lang==='sw'?'Leo!':'Today!')
                    : `${daysToNext} ${lang==='sw'?'siku zilizobaki':'days away'}`}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">* {lang==='sw'?'Inatarajiwa — inaweza kutofautiana':'Predicted — may vary by 2-3 days'}</p>
            </div>
          )}

          {/* Quick stats */}
          {cycles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: lang==='sw'?'Mzunguko':'Cycles',        value: cycles.length },
                { label: lang==='sw'?'Urefu wa Wastani':'Avg Length', value: cycleLength+(lang==='sw'?' siku':'d') },
                { label: lang==='sw'?'Hadi Ijayo':'Days to Next', value: daysToNext!==null?(daysToNext<0?(lang==='sw'?'Imepita':'Past'):daysToNext):'—' },
              ].map((s,i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
                  <p className="text-xl font-black text-pink-500">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR ── */}
      {section==='calendar' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 text-center">
            {lang==='sw' ? 'Bonyeza siku yoyote kurekodi ngono' : 'Tap any day to log sex activity'}
          </p>
          <CycleCalendar cycles={cycles} cycleLen={cycleLength} sexLog={sexLog} lang={lang} onDayTap={handleDayTap}/>
        </div>
      )}

      {/* ── LOG PERIOD ── */}
      {section==='log' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-800">🔴 {lang==='sw'?'Rekodi Hedhi Mpya':'Log New Period'}</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-700 font-medium">
                {lang==='sw'
                  ? 'ℹ️ Siku ya 1 ni siku ya KWANZA ya kutokwa damu halisi — si madoa tu'
                  : 'ℹ️ Day 1 = the FIRST day of actual bleeding — not spotting'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">{lang==='sw'?'🔴 Ilianza (Siku 1):':'🔴 Started (Day 1):'}</label>
                <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={startDate} onChange={e => setStartDate(e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">{lang==='sw'?'⚪ Iliisha (si lazima):':'⚪ Ended (optional):'}</label>
                <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={endDate} onChange={e => setEndDate(e.target.value)}/>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{lang==='sw'?'Mtiririko:':'Flow:'}</p>
              <div className="flex flex-wrap gap-2">
                {symCats.flow.map(s => (
                  <button key={s} onClick={() => toggleSym('flow',s)}
                    className={`text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${(selectedSyms.flow||[]).includes(s)?'text-white border-pink-400':'border-gray-200 text-gray-600'}`}
                    style={(selectedSyms.flow||[]).includes(s)?{background:'#ec4899'}:{}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{lang==='sw'?'Maumivu:':'Pain:'}</p>
              <div className="flex flex-wrap gap-2">
                {symCats.pain.map(s => (
                  <button key={s} onClick={() => toggleSym('pain',s)}
                    className={`text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${(selectedSyms.pain||[]).includes(s)?'text-white border-red-400':'border-gray-200 text-gray-600'}`}
                    style={(selectedSyms.pain||[]).includes(s)?{background:'#ef4444'}:{}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={savePeriod} disabled={!startDate}
              className={`w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition-all ${logSaved?'bg-green-500':''}`}
              style={!logSaved && startDate ? {background:'linear-gradient(135deg,#ec4899,#f59e0b)'} : {}}>
              {logSaved ? `✅ ${lang==='sw'?'Imehifadhiwa!':'Saved!'}` : (lang==='sw'?'💾 Hifadhi Rekodi ya Hedhi':'💾 Save Period Record')}
            </button>
          </div>

          {/* Cycle length slider */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-3">⚙️ {lang==='sw'?'Urefu wa Mzunguko':'Cycle Length'}</h3>
            <label className="block text-xs text-gray-500 mb-2">
              {lang==='sw'?'Urefu wa kawaida wa mzunguko wako (siku):':'Your typical cycle length (days):'}
            </label>
            <div className="flex items-center gap-4">
              <input type="range" min={21} max={35} value={cycleLength}
                onChange={e => setCycleLength(Number(e.target.value))}
                className="flex-1 accent-pink-500"/>
              <span className="text-2xl font-black text-pink-500 w-10 text-center">{cycleLength}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {lang==='sw'?'* Hupatikana moja kwa moja kutoka kwa historia yako':'* Auto-detected from your history when available'}
            </p>
          </div>
        </div>
      )}

      {/* ── SYMPTOMS ── */}
      {section==='symptoms' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">💊 {lang==='sw'?"Dalili za Leo":"Today's Symptoms"}</h3>
              {phase && <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{background:phase.color}}>{phase.emoji} {lang==='sw'?`Siku ${cycleDay}`:`Day ${cycleDay}`}</span>}
            </div>
            {Object.entries(symCats).map(([catKey, options]) => {
              const catColors = { flow:'#ec4899', pain:'#ef4444', mood:'#8b5cf6', body:'#f59e0b', other:'#14a044' }
              const catLabels_en = { flow:'Flow', pain:'Pain', mood:'Mood', body:'Body', other:'Other' }
              const catLabels_sw = { flow:'Mtiririko', pain:'Maumivu', mood:'Hisia', body:'Mwili', other:'Nyingine' }
              return (
                <div key={catKey}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    {lang==='sw' ? catLabels_sw[catKey] : catLabels_en[catKey]}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {options.map(s => {
                      const active = (selectedSyms[catKey]||[]).includes(s)
                      return (
                        <button key={s} onClick={() => toggleSym(catKey,s)}
                          className={`text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${active?'text-white':'border-gray-200 text-gray-600'}`}
                          style={active ? {background:catColors[catKey], borderColor:catColors[catKey]} : {}}>
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{lang==='sw'?'Maelezo:':'Notes:'}</p>
              <textarea rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                placeholder={lang==='sw'?'Maelezo yoyote ya leo...':'Any notes for today...'}
                value={todayNote} onChange={e => setTodayNote(e.target.value)}/>
            </div>
            <button onClick={saveSymptoms}
              disabled={!Object.values(selectedSyms).flat().length && !todayNote}
              className={`w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition-all ${logSaved?'bg-green-500':''}`}
              style={!logSaved && (Object.values(selectedSyms).flat().length || todayNote) ? {background:'linear-gradient(135deg,#ec4899,#f59e0b)'} : {}}>
              {logSaved ? `✅ ${lang==='sw'?'Imehifadhiwa!':'Saved!'}` : (lang==='sw'?"💾 Hifadhi Dalili za Leo":"💾 Save Today's Symptoms")}
            </button>
          </div>
          {symptomLog.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{lang==='sw'?'Dalili za Hivi Karibuni':'Recent'}</p>
              {symptomLog.slice(0,5).map((e,i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-gray-700">{e.date}</p>
                    {e.phase && <span className="text-xs text-gray-400">{lang==='sw'?'Siku':'Day'} {e.day}</span>}
                  </div>
                  {e.symptoms?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {e.symptoms.map(s => <span key={s} className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  )}
                  {e.note && <p className="text-xs text-gray-500 mt-1 italic">"{e.note}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FP METHOD ── */}
      {section==='fp' && (
        <FPSetup lang={lang} onSave={saveFP} current={fp}/>
      )}

      {/* ── INSIGHTS ── */}
      {section==='insights' && (
        <div className="space-y-4">
          {cycles.length < 2 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-700">{lang==='sw'?'Rekodi hedhi angalau 2 kupata mwanga.':'Log at least 2 periods to see insights.'}</p>
            </div>
          ) : (
            <>
              {getInsights().map((ins,i) => (
                <div key={i} className={`rounded-xl border p-4 ${!ins.ok?'bg-amber-50 border-amber-200':'bg-blue-50 border-blue-200'}`}>
                  <p className={`text-sm font-medium ${!ins.ok?'text-amber-800':'text-blue-800'}`}>{ins.icon} {ins.text}</p>
                </div>
              ))}
              {/* Phase guide */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-3">📋 {lang==='sw'?'Mwongozo wa Awamu':'Phase Guide'}</h3>
                <div className="space-y-2">
                  {['menstrual','follicular','ovulation','luteal'].map(pid => {
                    const p = getPhase(pid==='menstrual'?1:pid==='follicular'?8:pid==='ovulation'?14:22, 28)
                    const isActive = p.id === phase?.id
                    return (
                      <div key={pid} className={`rounded-xl p-3 border-2 ${isActive?'border-pink-300':'border-gray-100'}`}
                        style={isActive?{background:p.color+'15'}:{}}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{p.emoji}</span>
                          <p className="font-bold text-gray-800 text-sm">{p[lang]}</p>
                          {isActive && <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold">{lang==='sw'?'Sasa':'Now'}</span>}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{p.desc[lang]}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {section==='history' && (
        <div className="space-y-3">
          {cycles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Heart size={36} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">{lang==='sw'?'Bado hakuna rekodi.':'No records yet.'}</p>
            </div>
          ) : cycles.map((c,i) => {
            const dur = c.end ? Math.ceil((new Date(c.end)-new Date(c.start))/(1000*60*60*24)) : null
            const cycLen = i < cycles.length-1
              ? Math.ceil((new Date(c.start)-new Date(cycles[i+1].start))/(1000*60*60*24))
              : null
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-red-500">D1</span>
                      <p className="font-bold text-gray-800 text-sm">{fmt(c.start)}</p>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      {dur   && <span>🩸 {lang==='sw'?`Siku ${dur}`:`${dur} days`}</span>}
                      {cycLen && cycLen>15 && cycLen<60 && <span>🔄 {lang==='sw'?`Mzunguko: siku ${cycLen}`:`Cycle: ${cycLen}d`}</span>}
                    </div>
                    {c.symptoms?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.symptoms.slice(0,4).map(s => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteCycle(c.id)} className="text-gray-300 hover:text-red-400 ml-2">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── FLOATING FAQ BUTTON ── */}
      <button onClick={() => setShowFAQ(true)}
        className="fixed bottom-24 right-4 w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white text-lg z-30 hover:scale-105 transition-transform"
        style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
        ❓
      </button>

      {/* ── MODALS ── */}
      {showFAQ && <FAQModal lang={lang} onClose={() => setShowFAQ(false)}/>}

      {sexModal && (
        <SexLogModal
          date={sexModal.date}
          cycleDay={sexModal.cycleDay}
          cycleLen={cycleLength}
          lang={lang}
          onSave={(data) => saveSex(sexModal.day, sexModal.month, sexModal.year, data)}
          onClose={() => setSexModal(null)}
        />
      )}

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
    </div>
  )
}
