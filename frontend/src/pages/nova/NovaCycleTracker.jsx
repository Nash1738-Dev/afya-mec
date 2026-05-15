import { useState, useEffect } from 'react'
import { Heart, ChevronDown, ChevronUp, Trash2, TrendingUp, Calendar, Activity } from 'lucide-react'

// ── STORAGE ────────────────────────────────────────────────────────────────────
const CYCLES_KEY = 'nova_cycles'
const SYMPTOMS_KEY = 'nova_symptoms_log'

const store = {
  getCycles: () => { try { return JSON.parse(localStorage.getItem(CYCLES_KEY) || '[]') } catch { return [] } },
  saveCycles: (c) => localStorage.setItem(CYCLES_KEY, JSON.stringify(c)),
  getSymptoms: () => { try { return JSON.parse(localStorage.getItem(SYMPTOMS_KEY) || '[]') } catch { return [] } },
  saveSymptoms: (s) => localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(s)),
}

// ── CYCLE PHASE ENGINE ─────────────────────────────────────────────────────────
const getPhase = (day, cycleLen = 28) => {
  const ovDay = cycleLen - 14
  if (day <= 5)               return { id: 'menstrual',   emoji: '🔴', color: '#dc2626', en: 'Menstrual',    sw: 'Hedhi',         desc: { en: 'Uterine lining sheds. Estrogen and progesterone at lowest. Energy may be low — rest is productive.', sw: 'Ukuta wa mfuko wa uzazi unatolewa. Estrojeni na projestojeni ziko chini kabisa. Nguvu inaweza kuwa chini — kupumzika ni manufaa.' } }
  if (day <= ovDay - 2)       return { id: 'follicular',  emoji: '🌱', color: '#14a044', en: 'Follicular',   sw: 'Follicular',    desc: { en: 'Rising estrogen boosts energy, mood, and focus. Follicles develop in ovaries. Great time for new projects and social activities.', sw: 'Estrojeni inayoongezeka huimarisha nguvu, hisia, na umakini. Follicles hukua kwenye ovari. Wakati mzuri wa miradi mipya.' } }
  if (day <= ovDay + 2)       return { id: 'ovulation',   emoji: '⭐', color: '#f59e0b', en: 'Ovulation',    sw: 'Ovulation',     desc: { en: 'Peak estrogen triggers egg release. Peak fertility window. Energy and libido highest. Peak communication and confidence.', sw: 'Estrojeni ya juu husababisha kutolewa kwa yai. Dirisha la uzazi wa juu. Nguvu na hamu ya ngono ni ya juu zaidi.' } }
  return                       { id: 'luteal',      emoji: '🌙', color: '#7c3aed', en: 'Luteal',      sw: 'Luteal',        desc: { en: 'Progesterone rises. Body prepares for possible pregnancy or period. PMS may occur in second half. Introspective phase.', sw: 'Projestojeni inaongezeka. Mwili hujiandaa kwa ujauzito unaowezekana au hedhi. PMS inaweza kutokea.' } }
}

const getFertility = (day, cycleLen = 28) => {
  const ovDay = cycleLen - 14
  const distFromOv = Math.abs(day - ovDay)
  if (distFromOv <= 1)  return { level: 'PEAK',   pct: 95, color: '#dc2626', en: 'Peak Fertility',   sw: 'Uzazi wa Kilele' }
  if (distFromOv <= 3)  return { level: 'HIGH',   pct: 75, color: '#ea580c', en: 'High Fertility',   sw: 'Uzazi wa Juu' }
  if (distFromOv <= 5)  return { level: 'MEDIUM', pct: 30, color: '#f59e0b', en: 'Medium Fertility', sw: 'Uzazi wa Kati' }
  return                       { level: 'LOW',    pct: 5,  color: '#14a044', en: 'Low Fertility',    sw: 'Uzazi wa Chini' }
}

const getFPAdvice = (phase, lang) => ({
  menstrual: {
    en: 'Lowest fertility but NOT zero — sperm can survive 5 days. Continue your chosen contraceptive method. Good time to discuss FP with a provider.',
    sw: 'Uzazi wa chini lakini SI sifuri — manii inaweza kuishi siku 5. Endelea na njia yako ya uzazi wa mpango. Wakati mzuri wa kujadili FP na mtoa huduma.'
  },
  follicular: {
    en: 'Fertility rising toward ovulation. DMPA-SC, implant, and IUD protect in all phases. If using FAM or LAM, begin careful tracking now.',
    sw: 'Uzazi unaongezeka kuelekea ovulation. DMPA-SC, kipandikizi, na IUD huilinda katika awamu zote. Ikiwa unatumia FAM au LAM, anza kufuatilia kwa makini sasa.'
  },
  ovulation: {
    en: '⚠️ PEAK FERTILITY — highest pregnancy chance. Condoms, DMPA-SC, implant, IUD, and pills all work now. Unprotected sex has highest pregnancy risk in this window.',
    sw: '⚠️ UZAZI WA KILELE — uwezekano mkubwa wa ujauzito. Kondomu, DMPA-SC, kipandikizi, IUD, na vidonge vyote vinafanya kazi sasa.'
  },
  luteal: {
    en: 'Post-ovulation. Fertility declining. If period is late, consider a pregnancy test. PMS symptoms are normal — iron-rich foods and light exercise help.',
    sw: 'Baada ya ovulation. Uzazi unashuka. Ikiwa hedhi imechelewa, fikiria mtihani wa ujauzito. Dalili za PMS ni za kawaida — vyakula vyenye chuma na mazoezi ya kawaida husaidia.'
  }
}[phase.id][lang])

// ── SYMPTOM CATEGORIES ─────────────────────────────────────────────────────────
const SYMPTOM_CATEGORIES = {
  en: {
    flow: { label: 'Flow', options: ['Spotting', 'Light', 'Medium', 'Heavy', 'Very Heavy'] },
    pain: { label: 'Pain', options: ['None', 'Mild cramps', 'Moderate cramps', 'Severe cramps', 'Back pain', 'Headache'] },
    mood: { label: 'Mood', options: ['Happy', 'Calm', 'Irritable', 'Anxious', 'Sad', 'Energetic', 'Tired'] },
    body: { label: 'Body', options: ['Bloating', 'Breast tenderness', 'Acne', 'Nausea', 'Fatigue', 'Appetite changes'] },
    other: { label: 'Other', options: ['Good sleep', 'Poor sleep', 'High libido', 'Low libido', 'Exercise done', 'Sick'] },
  },
  sw: {
    flow: { label: 'Mtiririko', options: ['Madoa', 'Kidogo', 'Wastani', 'Nyingi', 'Nyingi Sana'] },
    pain: { label: 'Maumivu', options: ['Hakuna', 'Maumivu madogo', 'Maumivu ya wastani', 'Maumivu makali', 'Maumivu ya mgongo', 'Maumivu ya kichwa'] },
    mood: { label: 'Hisia', options: ['Furaha', 'Utulivu', 'Hasira', 'Wasiwasi', 'Huzuni', 'Na nguvu', 'Uchovu'] },
    body: { label: 'Mwili', options: ['Kuvimba', 'Maumivu ya matiti', 'Chunusi', 'Kichefuchefu', 'Uchovu', 'Mabadiliko ya hamu ya kula'] },
    other: { label: 'Nyingine', options: ['Usingizi mzuri', 'Usingizi mbaya', 'Hamu ya ngono juu', 'Hamu ya ngono chini', 'Mazoezi yamefanywa', 'Mgonjwa'] },
  }
}

// ── FAQS ───────────────────────────────────────────────────────────────────────
const FAQS = {
  en: [
    { q: 'What is a normal cycle length?', a: 'Normal cycles range from 21 to 35 days. The "28-day average" is just that — an average. Your personal cycle length is unique to you. Track 3+ cycles to find your pattern. Cycles under 21 or over 35 days should be discussed with a provider.' },
    { q: 'Why do I miss periods sometimes?', a: 'Stress, illness, significant weight loss or gain, intense exercise, travel across time zones, and hormonal contraception can all cause late or missed periods. A missed period after unprotected sex warrants a pregnancy test.' },
    { q: 'What is ovulation and when does it happen?', a: 'Ovulation is when your ovary releases an egg. It typically happens about 14 days BEFORE your next period (not 14 days after your last period starts — unless your cycle is exactly 28 days). You can detect ovulation by tracking cervical mucus (becomes clear and stretchy like egg white) or basal body temperature (slight rise after ovulation).' },
    { q: 'When am I most fertile?', a: 'Your fertile window is approximately 5 days before ovulation plus the day of ovulation itself (6 days total). Sperm can survive up to 5 days. Eggs survive 12-24 hours. For a 28-day cycle, your fertile window is roughly days 10-15. For YOUR cycle: subtract 14 from your average cycle length to estimate your ovulation day.' },
    { q: 'Can I get pregnant during my period?', a: 'Unlikely but possible, especially if you have short cycles (21-24 days) or long periods (7+ days). Sperm can survive 5 days, so sex at the end of a period can lead to pregnancy if ovulation occurs early in the next cycle. No phase of the cycle is completely safe without contraception.' },
    { q: 'What is PMS and is it normal?', a: 'Premenstrual Syndrome (PMS) is a collection of physical and emotional symptoms that occur 1-2 weeks before your period. Common symptoms include bloating, breast tenderness, mood swings, fatigue, and food cravings. PMS is caused by hormonal changes and is very common — up to 75% of women experience it. PMDD (Premenstrual Dysphoric Disorder) is a severe form that significantly impacts daily life and requires medical attention.' },
    { q: 'What does my cervical mucus tell me?', a: 'Cervical mucus changes throughout your cycle: After period — dry or minimal. Follicular phase — white/creamy, thicker. Approaching ovulation — clear, wet, stretchy like raw egg white (most fertile). After ovulation — thicker, white, less. This is the basis of the Billings Ovulation Method (natural family planning).' },
    { q: 'Is it normal to have no period on DMPA-SC?', a: 'Yes — very common and completely safe. Up to 70% of women stop having periods after 1 year on DMPA. Your blood is NOT building up inside — the uterine lining simply does not build up in the first place. This is actually a health benefit for many women. It does not mean the method is failing or that you are pregnant.' },
    { q: 'What is the best contraceptive for each phase?', a: 'Methods like DMPA-SC, implant, IUD, COC, and POP protect throughout all cycle phases. Natural methods (FAM, LAM) require careful cycle tracking and have more requirements. For maximum protection: pair a hormonal/LARC method with condoms for dual STI+pregnancy protection.' },
    { q: 'When should I see a doctor about my periods?', a: 'See a provider if: periods last more than 7 days, bleeding is very heavy (soaking a pad/tampon every hour for 2+ hours), severe pain affecting daily activities, periods suddenly stop for 3+ months without known cause (like pregnancy or contraception), or you have irregular cycles with unexplained symptoms.' },
  ],
  sw: [
    { q: 'Urefu wa mzunguko wa kawaida ni nini?', a: 'Mzunguko wa kawaida ni siku 21 hadi 35. "Wastani wa siku 28" ni wastani tu. Urefu wa mzunguko wako ni wa kipekee kwako. Fuatilia mzunguko 3+ kupata mfumo wako. Mzunguko chini ya siku 21 au zaidi ya siku 35 unapaswa kujadiliwa na mtoa huduma.' },
    { q: 'Kwa nini hedhi yangu inakosekana wakati mwingine?', a: 'Msongo wa mawazo, ugonjwa, kupungua au kuongezeka kwa uzito kwa kiasi kikubwa, mazoezi ya kina, safari za kuvuka maeneo ya wakati, na uzazi wa mpango wa homoni vinaweza kusababisha hedhi kuchelewa au kukosekana. Hedhi iliyokosekana baada ya ngono bila kinga inahitaji mtihani wa ujauzito.' },
    { q: 'Ovulation ni nini na inatokea lini?', a: 'Ovulation ni wakati ovari yako inatoa yai. Kawaida hutokea siku 14 KABLA ya hedhi yako ijayo. Unaweza kugundua ovulation kwa kufuatilia kamasi ya seviksi (inakuwa wazi na inayonyoosheka kama nyeupe ya yai) au joto la mwili la msingi.' },
    { q: 'Ni lini mimi ni na uzazi zaidi?', a: 'Dirisha lako la uzazi ni takriban siku 5 kabla ya ovulation pamoja na siku ya ovulation yenyewe (jumla ya siku 6). Manii inaweza kuishi hadi siku 5. Mayai yanaishi masaa 12-24. Kwa mzunguko wa siku 28, dirisha lako la uzazi ni takriban siku 10-15.' },
    { q: 'Ninaweza kupata ujauzito wakati wa hedhi?', a: 'Ni nadra lakini inawezekana, hasa ikiwa una mzunguko mfupi (siku 21-24) au hedhi ndefu (siku 7+). Manii inaweza kuishi siku 5, kwa hivyo ngono mwishoni mwa hedhi inaweza kusababisha ujauzito ikiwa ovulation inatokea mapema katika mzunguko unaofuata.' },
    { q: 'PMS ni nini na ni ya kawaida?', a: 'Ugonjwa wa Kabla ya Hedhi (PMS) ni mkusanyiko wa dalili za kimwili na kihisia zinazotokea wiki 1-2 kabla ya hedhi yako. Dalili za kawaida ni pamoja na kuvimba, maumivu ya matiti, mabadiliko ya hisia, uchovu, na kutamani chakula. PMS husababishwa na mabadiliko ya homoni na ni ya kawaida sana.' },
    { q: 'Kamasi ya seviksi yangu inaniambia nini?', a: 'Kamasi ya seviksi hubadilika katika mzunguko wako: Baada ya hedhi — kavu au kidogo. Awamu ya follicular — nyeupe/ya cream, nzito zaidi. Karibu na ovulation — wazi, yenye unyevu, inayonyoosheka kama nyeupe mbichi ya yai (uzazi wa juu zaidi). Baada ya ovulation — nzito zaidi, nyeupe, kidogo.' },
    { q: 'Je, ni kawaida kutokuwa na hedhi kwenye DMPA-SC?', a: 'Ndiyo — kawaida sana na salama kabisa. Hadi 70% ya wanawake huacha kupata hedhi baada ya mwaka 1 wa DMPA. Damu HAIKUSANYIKI ndani — ukuta wa mfuko wa uzazi haujengi tu. Hii ni faida ya kiafya kwa wanawake wengi.' },
    { q: 'Ni uzazi wa mpango gani bora kwa kila awamu?', a: 'Njia kama DMPA-SC, kipandikizi, IUD, COC, na POP zinalinda katika awamu zote za mzunguko. Njia za asili (FAM, LAM) zinahitaji ufuatiliaji wa makini wa mzunguko.' },
    { q: 'Ni lini ninapaswa kuona daktari kuhusu hedhi yangu?', a: 'Ona mtoa huduma ikiwa: hedhi inadumu zaidi ya siku 7, kutokwa damu kunakuwa kwingi sana, maumivu makali yanayoathiri shughuli za kila siku, hedhi inaacha ghafla kwa miezi 3+ bila sababu inayojulikana, au una mzunguko usio wa kawaida na dalili zisizoeleweka.' },
  ]
}

// ── INSIGHTS ENGINE ────────────────────────────────────────────────────────────
const generateInsights = (cycles, lang) => {
  if (cycles.length < 2) return []
  const insights = []
  const lengths = []
  for (let i = 0; i < cycles.length - 1; i++) {
    const len = Math.ceil((new Date(cycles[i].start) - new Date(cycles[i+1].start)) / (1000*60*60*24))
    if (len > 15 && len < 60) lengths.push(len)
  }
  if (lengths.length > 0) {
    const avg = Math.round(lengths.reduce((a,b) => a+b, 0) / lengths.length)
    const min = Math.min(...lengths)
    const max = Math.max(...lengths)
    insights.push({ icon: '📊', text: lang === 'sw' ? `Urefu wa wastani wa mzunguko: siku ${avg} (${min}–${max})` : `Average cycle length: ${avg} days (${min}–${max})` })
    if (max - min > 7) insights.push({ icon: '⚠️', text: lang === 'sw' ? 'Mzunguko wako unatofautiana kwa zaidi ya siku 7 — mzunguko usio wa kawaida. Zingatia kuongea na mtoa huduma.' : 'Your cycles vary by more than 7 days — irregular pattern. Consider discussing with a provider.' })
    if (avg < 21 || avg > 35) insights.push({ icon: '🩺', text: lang === 'sw' ? 'Urefu wako wa wastani wa mzunguko uko nje ya mipaka ya kawaida (siku 21-35). Tafadhali zingatia kuona mtoa huduma.' : 'Your average cycle length is outside normal range (21-35 days). Please consider seeing a provider.' })
  }
  const durList = cycles.filter(c => c.end).map(c => Math.ceil((new Date(c.end) - new Date(c.start)) / (1000*60*60*24)))
  if (durList.length > 0) {
    const avgDur = Math.round(durList.reduce((a,b) => a+b, 0) / durList.length)
    insights.push({ icon: '🗓️', text: lang === 'sw' ? `Muda wa wastani wa hedhi: siku ${avgDur}` : `Average period duration: ${avgDur} days` })
    if (avgDur > 7) insights.push({ icon: '⚠️', text: lang === 'sw' ? 'Muda wa wastani wa hedhi unazidi siku 7. Inashauriwa kuona mtoa huduma.' : 'Average period duration exceeds 7 days. Recommended to see a provider.' })
  }
  return insights
}

// ── CALENDAR VIEW ──────────────────────────────────────────────────────────────
function CycleCalendar({ cycles, lang }) {
  const today = new Date()
  const year  = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay    = new Date(year, month, 1).getDay()
  const monthName   = today.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })

  const periodDays = new Set()
  cycles.forEach(c => {
    const s = new Date(c.start)
    const e = c.end ? new Date(c.end) : new Date(s.getTime() + 4*24*60*60*1000)
    for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
      if (d.getFullYear() === year && d.getMonth() === month) {
        periodDays.add(d.getDate())
      }
    }
  })

  const last = cycles[0]
  const predictedDays = new Set()
  if (last && cycles.length >= 2) {
    const prev = cycles[1]
    const cycleLen = Math.ceil((new Date(last.start) - new Date(prev.start)) / (1000*60*60*24))
    if (cycleLen > 15 && cycleLen < 60) {
      const nextStart = new Date(new Date(last.start).getTime() + cycleLen*24*60*60*1000)
      for (let d = new Date(nextStart); d <= new Date(nextStart.getTime() + 4*24*60*60*1000); d.setDate(d.getDate()+1)) {
        if (d.getFullYear() === year && d.getMonth() === month) {
          predictedDays.add(d.getDate())
        }
      }
    }
  }

  const days = ['S','M','T','W','T','F','S']

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <p className="font-bold text-gray-700 text-sm mb-3 text-center">{monthName}</p>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((d,i) => <div key={i} className="text-center text-xs text-gray-400 font-bold">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`}/>)}
        {Array.from({length: daysInMonth}).map((_,i) => {
          const day = i + 1
          const isToday    = day === today.getDate()
          const isPeriod   = periodDays.has(day)
          const isPredicted = predictedDays.has(day)
          return (
            <div key={day} className={`aspect-square rounded-full flex items-center justify-center text-xs font-semibold transition-colors
              ${isPeriod    ? 'bg-red-400 text-white' :
                isPredicted ? 'bg-pink-200 text-pink-700' :
                isToday     ? 'bg-teal-500 text-white' :
                              'text-gray-700'}`}>
              {day}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-400"/><span className="text-xs text-gray-500">{lang==='sw'?'Hedhi':'Period'}</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-pink-200"/><span className="text-xs text-gray-500">{lang==='sw'?'Inatarajiwa':'Predicted'}</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-teal-500"/><span className="text-xs text-gray-500">{lang==='sw'?'Leo':'Today'}</span></div>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function NovaCycleTracker({ lang = 'en', user }) {
  const [cycles,       setCycles]       = useState(store.getCycles())
  const [symptomLog,   setSymptomLog]   = useState(store.getSymptoms())
  const [section,      setSection]      = useState('overview')
  const [startDate,    setStartDate]    = useState('')
  const [endDate,      setEndDate]      = useState('')
  const [selectedSyms, setSelectedSyms] = useState({})
  const [cycleLength,  setCycleLength]  = useState(28)
  const [openFaq,      setOpenFaq]      = useState(null)
  const [todayNote,    setTodayNote]    = useState('')

  // Compute current cycle day
  const last = cycles[0]
  const today = new Date()
  const cycleDay = last
    ? Math.max(1, Math.ceil((today - new Date(last.start)) / (1000*60*60*24)))
    : null

  // Auto-detect cycle length from history
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

  const phase     = cycleDay ? getPhase(cycleDay, cycleLength)     : null
  const fertility = cycleDay ? getFertility(cycleDay, cycleLength) : null
  const fpAdvice  = phase    ? getFPAdvice(phase, lang)            : null
  const insights  = generateInsights(cycles, lang)

  // Predict next period
  const predictedNext = (() => {
    if (!last || cycles.length < 2) return null
    const prev = cycles[1]
    const len  = Math.ceil((new Date(last.start) - new Date(prev.start)) / (1000*60*60*24))
    if (len < 15 || len > 60) return null
    return new Date(new Date(last.start).getTime() + len*24*60*60*1000)
  })()

  const daysUntilNext = predictedNext
    ? Math.ceil((predictedNext - today) / (1000*60*60*24))
    : null

  const savePeriod = () => {
    if (!startDate) return
    const entry = { id: Date.now(), start: startDate, end: endDate || null, symptoms: Object.values(selectedSyms).flat() }
    const updated = [entry, ...cycles].slice(0, 36)
    setCycles(updated); store.saveCycles(updated)
    setStartDate(''); setEndDate(''); setSelectedSyms({})
  }

  const saveSymptomEntry = () => {
    const syms = Object.values(selectedSyms).flat()
    if (!syms.length && !todayNote) return
    const entry = {
      id: Date.now(),
      date: today.toISOString().slice(0,10),
      day: cycleDay,
      phase: phase?.id,
      symptoms: syms,
      note: todayNote
    }
    const updated = [entry, ...symptomLog].slice(0, 90)
    setSymptomLog(updated); store.saveSymptoms(updated)
    setSelectedSyms({}); setTodayNote('')
  }

  const toggleSym = (cat, sym) => {
    setSelectedSyms(prev => {
      const catSyms = prev[cat] || []
      return { ...prev, [cat]: catSyms.includes(sym) ? catSyms.filter(s=>s!==sym) : [...catSyms, sym] }
    })
  }

  const deleteCycle = (id) => {
    const updated = cycles.filter(c => c.id !== id)
    setCycles(updated); store.saveCycles(updated)
  }

  const symCategories = SYMPTOM_CATEGORIES[lang]
  const faqs = FAQS[lang]

  const sections = [
    { key: 'overview', label: lang==='sw' ? '🏠 Muhtasari' : '🏠 Overview' },
    { key: 'log',      label: lang==='sw' ? '📝 Rekodi'    : '📝 Log' },
    { key: 'symptoms', label: lang==='sw' ? '💊 Dalili'    : '💊 Symptoms' },
    { key: 'history',  label: lang==='sw' ? '📊 Historia'  : '📊 History' },
    { key: 'insights', label: lang==='sw' ? '💡 Mwanga'    : '💡 Insights' },
    { key: 'faqs',     label: 'FAQ' },
  ]

  return (
    <div className="space-y-4">

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
      {section === 'overview' && (
        <div className="space-y-4">

          {/* Phase card */}
          {phase && cycleDay ? (
            <div className="rounded-2xl p-5 text-white shadow-lg"
              style={{background:`linear-gradient(135deg,${phase.color},${phase.color}bb)`}}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-bold opacity-80 uppercase tracking-wide">
                    {lang==='sw' ? 'Awamu ya Sasa' : 'Current Phase'}
                  </p>
                  <p className="text-3xl font-black mt-1">{phase.emoji} {phase[lang]}</p>
                  <p className="text-sm opacity-90 mt-1">
                    {lang==='sw' ? `Siku ${cycleDay} ya mzunguko (urefu wa wastani: siku ${cycleLength})` : `Day ${cycleDay} of cycle (avg length: ${cycleLength} days)`}
                  </p>
                </div>
                <div className="text-center bg-white/25 rounded-2xl px-3 py-2 ml-3">
                  <p className="text-2xl font-black">{fertility.pct}%</p>
                  <p className="text-xs opacity-80 leading-tight">{lang==='sw' ? 'Uzazi' : 'Fertility'}</p>
                  <p className="text-xs font-bold mt-0.5 bg-white/20 rounded-full px-2 py-0.5">{fertility.level}</p>
                </div>
              </div>
              <p className="text-sm opacity-90 mt-3 leading-relaxed">{phase.desc[lang]}</p>
            </div>
          ) : (
            <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5 text-center">
              <p className="text-4xl mb-2">🌸</p>
              <p className="font-bold text-pink-700">
                {lang==='sw' ? `Karibu, ${user?.nickname || 'Nova'}!` : `Welcome, ${user?.nickname || 'Nova'}!`}
              </p>
              <p className="text-sm text-pink-600 mt-1">
                {lang==='sw' ? 'Rekodi tarehe ya mwanzo wa hedhi yako kupata mwanga wa mzunguko wako.' : 'Log your last period start date to see cycle insights.'}
              </p>
              <button onClick={() => setSection('log')}
                className="mt-3 text-white text-sm font-bold px-5 py-2.5 rounded-xl"
                style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
                {lang==='sw' ? '+ Rekodi Hedhi' : '+ Log Period'}
              </button>
            </div>
          )}

          {/* FP advice */}
          {fpAdvice && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">
                💊 {lang==='sw' ? 'Ushauri wa FP' : 'FP Advice'}
              </p>
              <p className="text-sm text-teal-700 leading-relaxed">{fpAdvice}</p>
            </div>
          )}

          {/* Next period prediction */}
          {predictedNext && (
            <div className={`rounded-xl border p-4 ${daysUntilNext !== null && daysUntilNext <= 3 ? 'bg-red-50 border-red-200' : daysUntilNext !== null && daysUntilNext <= 7 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1"
                style={{color: daysUntilNext !== null && daysUntilNext <= 3 ? '#dc2626' : daysUntilNext !== null && daysUntilNext <= 7 ? '#d97706' : '#2563eb'}}>
                🔮 {lang==='sw' ? 'Hedhi Inayotarajiwa' : 'Predicted Next Period'}
              </p>
              <p className="text-base font-bold text-gray-800">
                {predictedNext.toLocaleDateString('en-KE', {weekday:'long', month:'long', day:'numeric'})}
              </p>
              {daysUntilNext !== null && (
                <p className="text-sm font-semibold mt-1"
                  style={{color: daysUntilNext <= 3 ? '#dc2626' : daysUntilNext <= 7 ? '#d97706' : '#6b7280'}}>
                  {daysUntilNext < 0
                    ? (lang==='sw' ? `${Math.abs(daysUntilNext)} siku zilizopita` : `${Math.abs(daysUntilNext)} days ago`)
                    : daysUntilNext === 0
                      ? (lang==='sw' ? 'Leo!' : 'Today!')
                      : (lang==='sw' ? `Siku ${daysUntilNext} zilizobaki` : `${daysUntilNext} days away`)}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {lang==='sw' ? '* Inatarajiwa — inaweza kutofautiana kwa siku 2-3' : '* Predicted — may vary by 2-3 days'}
              </p>
            </div>
          )}

          {/* Calendar */}
          {cycles.length > 0 && <CycleCalendar cycles={cycles} lang={lang}/>}

          {/* Quick stats */}
          {cycles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: lang==='sw' ? 'Mzunguko' : 'Cycles', value: cycles.length },
                { label: lang==='sw' ? 'Urefu wa Wastani' : 'Avg Length', value: cycleLength + (lang==='sw' ? ' siku' : 'd') },
                { label: lang==='sw' ? 'Siku Hadi Ijayo' : 'Days to Next', value: daysUntilNext !== null ? (daysUntilNext < 0 ? lang==='sw'?'Imepita':'Past' : daysUntilNext) : '—' },
              ].map((s,i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                  <p className="text-xl font-black text-pink-500">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LOG PERIOD ── */}
      {section === 'log' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-800">
              {lang==='sw' ? '📝 Rekodi Hedhi Mpya' : '📝 Log New Period'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">
                  {lang==='sw' ? '🔴 Ilianza:' : '🔴 Started:'}
                </label>
                <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={startDate} onChange={e => setStartDate(e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">
                  {lang==='sw' ? '⚪ Iliisha (si lazima):' : '⚪ Ended (optional):'}
                </label>
                <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={endDate} onChange={e => setEndDate(e.target.value)}/>
              </div>
            </div>

            {/* Flow symptoms */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {lang==='sw' ? 'Mtiririko wa Hedhi:' : 'Flow:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {symCategories.flow.options.map(s => (
                  <button key={s}
                    onClick={() => toggleSym('flow', s)}
                    className={`text-xs px-3 py-1.5 rounded-full border-2 transition-colors
                      ${(selectedSyms.flow||[]).includes(s) ? 'text-white border-pink-400' : 'border-gray-200 text-gray-600'}`}
                    style={(selectedSyms.flow||[]).includes(s) ? {background:'#ec4899'} : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Pain symptoms */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {lang==='sw' ? 'Maumivu:' : 'Pain:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {symCategories.pain.options.map(s => (
                  <button key={s}
                    onClick={() => toggleSym('pain', s)}
                    className={`text-xs px-3 py-1.5 rounded-full border-2 transition-colors
                      ${(selectedSyms.pain||[]).includes(s) ? 'text-white border-red-400' : 'border-gray-200 text-gray-600'}`}
                    style={(selectedSyms.pain||[]).includes(s) ? {background:'#ef4444'} : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={savePeriod} disabled={!startDate}
              className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition-colors"
              style={{background: startDate ? 'linear-gradient(135deg,#ec4899,#f59e0b)' : undefined}}>
              {lang==='sw' ? '💾 Hifadhi Rekodi ya Hedhi' : '💾 Save Period Record'}
            </button>
          </div>

          {/* Cycle length setting */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-3">
              {lang==='sw' ? '⚙️ Mipangilio ya Mzunguko' : '⚙️ Cycle Settings'}
            </h3>
            <label className="block text-xs text-gray-500 mb-2">
              {lang==='sw' ? 'Urefu wa kawaida wa mzunguko wako (siku):' : 'Your typical cycle length (days):'}
            </label>
            <div className="flex items-center gap-4">
              <input type="range" min={21} max={35} value={cycleLength}
                onChange={e => setCycleLength(Number(e.target.value))}
                className="flex-1 accent-pink-500"/>
              <span className="text-2xl font-black text-pink-500 w-10 text-center">{cycleLength}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {lang==='sw' ? '* Hupatikana moja kwa moja kutoka kwa rekodi zako ikiwa una historia ya kutosha' : '* Auto-detected from your records when you have enough history'}
            </p>
          </div>
        </div>
      )}

      {/* ── SYMPTOMS ── */}
      {section === 'symptoms' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                {lang==='sw' ? '💊 Rekodi Dalili za Leo' : "💊 Today's Symptom Log"}
              </h3>
              {phase && (
                <span className="text-xs font-bold px-2 py-1 rounded-full text-white"
                  style={{background: phase.color}}>
                  {phase.emoji} {lang==='sw' ? `Siku ${cycleDay}` : `Day ${cycleDay}`}
                </span>
              )}
            </div>

            {Object.entries(symCategories).map(([catKey, cat]) => (
              <div key={catKey}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{cat.label}:</p>
                <div className="flex flex-wrap gap-2">
                  {cat.options.map(s => {
                    const active = (selectedSyms[catKey]||[]).includes(s)
                    const colors = { flow:'#ec4899', pain:'#ef4444', mood:'#8b5cf6', body:'#f59e0b', other:'#14a044' }
                    return (
                      <button key={s} onClick={() => toggleSym(catKey, s)}
                        className={`text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${active ? 'text-white' : 'border-gray-200 text-gray-600'}`}
                        style={active ? {background: colors[catKey], borderColor: colors[catKey]} : {}}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {lang==='sw' ? 'Maelezo (si lazima):' : 'Notes (optional):'}
              </p>
              <textarea rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                placeholder={lang==='sw' ? 'Maelezo yoyote ya leo...' : 'Any notes for today...'}
                value={todayNote} onChange={e => setTodayNote(e.target.value)}/>
            </div>

            <button onClick={saveSymptomEntry}
              disabled={!Object.values(selectedSyms).flat().length && !todayNote}
              className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300"
              style={{background: Object.values(selectedSyms).flat().length || todayNote ? 'linear-gradient(135deg,#ec4899,#f59e0b)' : undefined}}>
              {lang==='sw' ? '💾 Hifadhi Dalili za Leo' : "💾 Save Today's Symptoms"}
            </button>
          </div>

          {/* Recent symptom history */}
          {symptomLog.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {lang==='sw' ? 'Dalili za Hivi Karibuni' : 'Recent Symptom History'}
              </p>
              {symptomLog.slice(0,7).map((entry,i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-gray-700">{entry.date}</p>
                    {entry.phase && (
                      <span className="text-xs text-gray-400">{lang==='sw'?'Siku':'Day'} {entry.day} · {entry.phase}</span>
                    )}
                  </div>
                  {entry.symptoms?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.symptoms.map(s => <span key={s} className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  )}
                  {entry.note && <p className="text-xs text-gray-500 mt-1 italic">"{entry.note}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {section === 'history' && (
        <div className="space-y-3">
          {cycles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Heart size={36} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm font-medium">{lang==='sw' ? 'Bado hakuna rekodi.' : 'No records yet.'}</p>
              <p className="text-xs mt-1">{lang==='sw' ? 'Anza kufuatilia hedhi yako.' : 'Start logging your period above.'}</p>
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
                    <p className="font-bold text-gray-800 text-sm">
                      {new Date(c.start).toLocaleDateString('en-KE',{day:'numeric',month:'long',year:'numeric'})}
                    </p>
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
                  <button onClick={() => deleteCycle(c.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-2">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── INSIGHTS ── */}
      {section === 'insights' && (
        <div className="space-y-4">
          {cycles.length < 2 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-700 font-medium">
                {lang==='sw' ? 'Rekodi hedhi angalau 2 kupata mwanga.' : 'Log at least 2 periods to see insights.'}
              </p>
            </div>
          ) : (
            <>
              {insights.map((ins,i) => (
                <div key={i} className={`rounded-xl border p-4 ${ins.icon==='⚠️'||ins.icon==='🩺' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                  <p className={`text-sm font-medium ${ins.icon==='⚠️'||ins.icon==='🩺' ? 'text-amber-800' : 'text-blue-800'}`}>
                    {ins.icon} {ins.text}
                  </p>
                </div>
              ))}

              {/* Phase guide for today */}
              {phase && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 mb-3">
                    {lang==='sw' ? '📋 Mwongozo wa Awamu za Mzunguko' : '📋 Cycle Phase Guide'}
                  </h3>
                  <div className="space-y-3">
                    {['menstrual','follicular','ovulation','luteal'].map(pid => {
                      const p = getPhase(pid === 'menstrual' ? 1 : pid === 'follicular' ? 8 : pid === 'ovulation' ? 14 : 22, 28)
                      const isActive = p.id === phase.id
                      return (
                        <div key={pid}
                          className={`rounded-xl p-3 border-2 transition-colors ${isActive ? 'border-pink-300' : 'border-gray-100'}`}
                          style={isActive ? {background: p.color + '15'} : {}}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{p.emoji}</span>
                            <p className="font-bold text-gray-800 text-sm">{p[lang]}</p>
                            {isActive && <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold">{lang==='sw'?'Sasa':'Now'}</span>}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{p.desc[lang]}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── FAQS ── */}
      {section === 'faqs' && (
        <div className="space-y-2">
          {faqs.map((faq,i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                onClick={() => setOpenFaq(openFaq===i ? null : i)}>
                <p className="text-sm font-medium text-gray-700 pr-3 leading-snug">{faq.q}</p>
                {openFaq===i ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0"/> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0"/>}
              </button>
              {openFaq===i && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
