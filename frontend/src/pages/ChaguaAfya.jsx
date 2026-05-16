import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, Calendar, ArrowLeft, Send, Phone,
  Shield, Info, RefreshCw, MapPin, Heart, Trash2,
  ChevronDown, ChevronUp, Eye, EyeOff, Plus, X,
  Bell, AlertCircle, CheckCircle, HelpCircle, Droplets,
  Thermometer, Smile, Frown, Meh, Sun, Moon, Activity
} from 'lucide-react'

// ─────────────────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────────────────
const novaStore = {
  getUser: () => { try { return JSON.parse(localStorage.getItem('nova_user') || 'null') } catch { return null } },
  saveUser: u => localStorage.setItem('nova_user', JSON.stringify(u)),
  getCycles: () => { try { return JSON.parse(localStorage.getItem('nova_cycles') || '[]') } catch { return [] } },
  saveCycles: c => localStorage.setItem('nova_cycles', JSON.stringify(c)),
  getLogs: () => { try { return JSON.parse(localStorage.getItem('nova_logs') || '{}') } catch { return {} } },
  saveLogs: l => localStorage.setItem('nova_logs', JSON.stringify(l)),
  getChat: p => { try { return JSON.parse(localStorage.getItem('nova_chat_' + p) || '[]') } catch { return [] } },
  saveChat: (p, m) => localStorage.setItem('nova_chat_' + p, JSON.stringify(m.slice(-40))),
  clearChat: p => localStorage.removeItem('nova_chat_' + p),
  getMethod: () => { try { return JSON.parse(localStorage.getItem('nova_fp_method') || 'null') } catch { return null } },
  saveMethod: m => localStorage.setItem('nova_fp_method', JSON.stringify(m)),
  clearAll: () => {
    ['nova_user','nova_cycles','nova_logs','nova_fp_method']
      .forEach(k => localStorage.removeItem(k))
    Object.keys(localStorage).filter(k => k.startsWith('nova_chat_'))
      .forEach(k => localStorage.removeItem(k))
  }
}

// ─────────────────────────────────────────────────────────
//  CYCLE HELPERS
// ─────────────────────────────────────────────────────────
const parseDate = s => new Date(s + 'T00:00:00')
const fmt = d => d.toISOString().split('T')[0]
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const diffDays = (a, b) => Math.round((b - a) / 86400000)

function computeCycleInfo(cycles, cycleLen = 28, periodLen = 5) {
  if (!cycles.length) return null
  const sorted = [...cycles].sort((a, b) => new Date(a.start) - new Date(b.start))
  const last = sorted[sorted.length - 1]
  const start = parseDate(last.start)
  const today = new Date(); today.setHours(0,0,0,0)
  const dayOfCycle = diffDays(start, today) + 1

  // Phases
  const ovulationDay = cycleLen - 14
  const fertileStart = ovulationDay - 5
  const fertileEnd = ovulationDay + 1

  // Next period
  const nextPeriodStart = addDays(start, cycleLen)
  const nextPeriodEnd = addDays(nextPeriodStart, periodLen - 1)

  // Phase name
  let phase, phaseColor, phaseDesc
  if (dayOfCycle <= periodLen) {
    phase = 'Menstrual'; phaseColor = '#e53e3e'
    phaseDesc = 'Your period. Rest, stay hydrated, use pads/tampons/cups as preferred.'
  } else if (dayOfCycle <= fertileStart) {
    phase = 'Follicular'; phaseColor = '#38a169'
    phaseDesc = 'Post-period, energy rising. Low fertility — generally safe days.'
  } else if (dayOfCycle <= fertileEnd) {
    phase = 'Ovulatory (Fertile Window)'; phaseColor = '#dd6b20'
    phaseDesc = 'Highest chance of pregnancy. Avoid unprotected sex if not planning a baby.'
  } else {
    phase = 'Luteal'; phaseColor = '#805ad5'
    phaseDesc = 'Post-ovulation. Fertility decreasing. PMS symptoms may appear.'
  }

  // Pregnancy likelihood label
  let pregnancyLikelihood, pregnancyColor
  if (dayOfCycle >= fertileStart && dayOfCycle <= fertileEnd) {
    pregnancyLikelihood = 'HIGH'; pregnancyColor = '#e53e3e'
  } else if (dayOfCycle === fertileStart - 1 || dayOfCycle === fertileEnd + 1) {
    pregnancyLikelihood = 'MEDIUM'; pregnancyColor = '#dd6b20'
  } else if (dayOfCycle <= periodLen) {
    pregnancyLikelihood = 'VERY LOW'; pregnancyColor = '#38a169'
  } else {
    pregnancyLikelihood = 'LOW'; pregnancyColor = '#38a169'
  }

  return {
    start, last, dayOfCycle, cycleLen, periodLen,
    ovulationDay, fertileStart, fertileEnd,
    nextPeriodStart, nextPeriodEnd,
    phase, phaseColor, phaseDesc,
    pregnancyLikelihood, pregnancyColor
  }
}

function getDayType(dateStr, cycles, info) {
  if (!info || !cycles.length) return 'none'
  const d = parseDate(dateStr)
  const today = new Date(); today.setHours(0,0,0,0)
  const { start, fertileStart, fertileEnd, ovulationDay, cycleLen, periodLen, nextPeriodStart, nextPeriodEnd } = info

  const dayN = diffDays(start, d) + 1

  // Actual logged period days
  for (const cyc of cycles) {
    const cs = parseDate(cyc.start)
    const ce = addDays(cs, (cyc.length || periodLen) - 1)
    if (d >= cs && d <= ce) return 'period'
  }

  // Current cycle phases
  if (dayN >= 1 && dayN <= periodLen) return 'period'
  if (dayN >= fertileStart && dayN <= ovulationDay) return 'fertile'
  if (dayN === ovulationDay) return 'ovulation'
  if (dayN > periodLen && dayN < fertileStart) return 'safe'
  if (dayN > ovulationDay && dayN < cycleLen) return 'luteal'

  // Predicted next period
  if (d >= nextPeriodStart && d <= nextPeriodEnd) return 'predicted'

  return 'none'
}

// ─────────────────────────────────────────────────────────
//  TRANSLATIONS
// ─────────────────────────────────────────────────────────
const T = {
  en: {
    appName: 'Nova', tagline: 'Your Health. Your Choice.',
    tabs: ['🏠 Home','🌸 My Cycle','💊 Methods','💉 Self-Inject','📅 Return Date','💬 Ask Nova','📍 Find Clinic'],
    privacy: '🔒 Your data stays on your phone only. Nothing is uploaded.',
  },
  sw: {
    appName: 'Nova', tagline: 'Afya Yako. Chaguo Lako.',
    tabs: ['🏠 Nyumbani','🌸 Mzunguko Wangu','💊 Njia','💉 Jichome','📅 Tarehe ya Kurudi','💬 Uliza Nova','📍 Pata Kliniki'],
    privacy: '🔒 Data yako iko kwenye simu yako tu. Hakuna kinachopakiwa.',
  }
}

// ─────────────────────────────────────────────────────────
//  FP METHODS  (user-friendly language)
// ─────────────────────────────────────────────────────────
const METHODS = [
  {
    id: 'dmpa_sc', emoji: '💉', color: '#e53e3e', name: { en: 'Sayana Press (Self-inject)', sw: 'Sayana Press (Jichome)' },
    efficacy: '99%', duration: { en: 'Every 3 months', sw: 'Kila miezi 3' },
    howItWorks: { en: 'A tiny injection under your skin once every 3 months. You can do it yourself at home after training.', sw: 'Sindano ndogo chini ya ngozi mara moja kila miezi 3. Unaweza kujichomea nyumbani baada ya mafunzo.' },
    goodFor: { en: ['You want long-term protection without daily pills', 'You value privacy — no visible device', 'You want to self-inject at home'], sw: ['Unataka ulinzi wa muda mrefu bila vidonge vya kila siku', 'Unathamini faragha', 'Unataka kujichomea nyumbani'] },
    sideEffects: { en: ['Periods may become irregular or stop — this is NORMAL and safe', 'Spotting between periods', 'May take a few months for fertility to return after stopping'], sw: ['Hedhi inaweza kuwa ya kawaida au kusimama — hii ni KAWAIDA na salama', 'Madoa kati ya hedhi', 'Inaweza kuchukua miezi michache kupata mimba baada ya kusimama'] },
    returnDate: 90
  },
  {
    id: 'dmpa_im', emoji: '💉', color: '#fc8181', name: { en: 'Depo-Provera (Injection)', sw: 'Depo-Provera (Sindano)' },
    efficacy: '99%', duration: { en: 'Every 3 months', sw: 'Kila miezi 3' },
    howItWorks: { en: 'A hormone injection into your muscle at a clinic every 3 months. Very effective and convenient.', sw: 'Sindano ya homoni kwenye misuli yako kliniki kila miezi 3.' },
    goodFor: { en: ['Want highly effective protection', 'Prefer clinic-administered method', 'Want something that lasts 3 months'], sw: ['Unataka ulinzi wa hali ya juu', 'Unapendelea njia inayotolewa klinikini'] },
    sideEffects: { en: ['Irregular periods or no periods', 'Weight changes possible', 'Fertility may take 6–12 months to return'], sw: ['Hedhi isiyo ya kawaida au kutokuwa na hedhi', 'Mabadiliko ya uzito yanawezekana'] },
    returnDate: 90
  },
  {
    id: 'implant', emoji: '🦾', color: '#805ad5', name: { en: 'Implant (Arm Rod)', sw: 'Kipandikizi (Fimbo ya Mkono)' },
    efficacy: '99.9%', duration: { en: 'Up to 3–5 years', sw: 'Hadi miaka 3–5' },
    howItWorks: { en: 'A matchstick-sized rod placed under the skin of your upper arm by a trained provider. You can\'t feel it, but it works silently for years.', sw: 'Fimbo ndogo inayowekwa chini ya ngozi ya mkono wako wa juu na mtoa huduma aliyefunzwa.' },
    goodFor: { en: ['You want "set it and forget it" protection', 'You don\'t want to think about contraception daily', 'Breastfeeding mothers'], sw: ['Unataka ulinzi wa "weka na usisahau"', 'Mama wanaonyonyesha'] },
    sideEffects: { en: ['Irregular bleeding especially in first months', 'May stop periods completely', 'Small scar at insertion site'], sw: ['Kutokwa na damu bila mpangilio hasa miezi ya kwanza', 'Inaweza kusimamisha hedhi kabisa'] },
    returnDate: 365 * 3
  },
  {
    id: 'iud_copper', emoji: '🌀', color: '#2b6cb0', name: { en: 'Copper IUD (Coil)', sw: 'IUD ya Shaba (Coil)' },
    efficacy: '99.4%', duration: { en: 'Up to 10–12 years', sw: 'Hadi miaka 10–12' },
    howItWorks: { en: 'A small T-shaped copper device placed inside the uterus by a provider. Copper is naturally sperm-unfriendly. No hormones!', sw: 'Kifaa kidogo cha shaba chenye umbo la T kilichowekwa ndani ya uterasi. Hakuna homoni!' },
    goodFor: { en: ['You want hormone-free contraception', 'You want the most long-lasting option', 'Emergency contraception (up to 5 days after unprotected sex)'], sw: ['Unataka uzazi wa mpango bila homoni', 'Unaweza pia kutumika kama uzazi wa dharura'] },
    sideEffects: { en: ['Periods may be heavier or more painful especially at first', 'Spotting for first few months', 'Cramps after insertion'], sw: ['Hedhi inaweza kuwa nzito zaidi au yenye maumivu zaidi mwanzoni'] },
    returnDate: 365 * 10
  },
  {
    id: 'pill', emoji: '💊', color: '#38a169', name: { en: 'Daily Pill (COC)', sw: 'Kidonge cha Kila Siku' },
    efficacy: '91–99%', duration: { en: 'Daily', sw: 'Kila siku' },
    howItWorks: { en: 'A small pill you take every day at the same time. It stops ovulation so there\'s no egg to fertilize.', sw: 'Kidonge kidogo unachokula kila siku kwa wakati mmoja. Kinazuia ovulation.' },
    goodFor: { en: ['You\'re good at daily routines', 'Want easy-to-stop option', 'Want to control your cycle timing'], sw: ['Una utaratibu mzuri wa kila siku', 'Unataka chaguo rahisi la kusimamisha'] },
    sideEffects: { en: ['Nausea (usually goes away after a few weeks)', 'Must take at same time daily — easy to forget!', 'No protection against STIs'], sw: ['Kichefuchefu (kawaida huisha baada ya wiki chache)', 'Lazima uchukue wakati mmoja kila siku — rahisi kusahau!'] },
    returnDate: 28
  },
  {
    id: 'condom', emoji: '🛡️', color: '#718096', name: { en: 'Male Condom', sw: 'Kondomu ya Mwanaume' },
    efficacy: '85–98%', duration: { en: 'Single use', sw: 'Matumizi ya mara moja' },
    howItWorks: { en: 'A thin sheath worn over the penis during sex. Physically blocks sperm AND protects against STIs including HIV.', sw: 'Kifuniko nyembamba kinachovalishwa kwenye uume wakati wa ngono. Kuzuia manii NA STI.' },
    goodFor: { en: ['Dual protection — STIs AND pregnancy', 'No hormones or doctor visit needed', 'Good as backup method with other contraception'], sw: ['Ulinzi wa pande mbili — STI NA mimba', 'Hakuna homoni au ziara ya daktari', 'Nzuri kama njia ya chelezo'] },
    sideEffects: { en: ['Must be used correctly every time', 'Can break if not used properly', 'Some people have latex sensitivity'], sw: ['Lazima itumike vizuri kila wakati', 'Inaweza kuvunjika ikiwa haitumiwi vizuri'] },
    returnDate: null
  },
  {
    id: 'emergency', emoji: '🚨', color: '#e53e3e', name: { en: 'Emergency Pill (P2/Postinor)', sw: 'Kidonge cha Dharura (P2/Postinor)' },
    efficacy: '75–89%', duration: { en: 'Within 72 hours of unprotected sex', sw: 'Ndani ya masaa 72 baada ya ngono bila kinga' },
    howItWorks: { en: 'NOT a regular contraceptive. Taken after unprotected sex to reduce pregnancy risk. The sooner you take it, the better it works. Does NOT cause abortion.', sw: 'SI uzazi wa mpango wa kawaida. Huchukuliwa baada ya ngono bila kinga kupunguza hatari ya mimba. Haifanyi utoaji mimba.' },
    goodFor: { en: ['Unprotected sex happened', 'Condom broke or was forgotten', 'You were forced (please also seek support)'], sw: ['Ngono bila kinga ilitokea', 'Kondomu ilivunjika au ilisahauliwa'] },
    sideEffects: { en: ['Nausea, vomiting (common)', 'Next period may be early or late', 'Not for regular use — has lower effectiveness than regular methods'], sw: ['Kichefuchefu, kutapika (kawaida)', 'Hedhi inayofuata inaweza kuwa ya mapema au ya kuchelewa'] },
    returnDate: null
  }
]

// ─────────────────────────────────────────────────────────
//  AI PERSONAS
// ─────────────────────────────────────────────────────────
const YOUTH_VOICE = `You have deep knowledge of what young Kenyan women and girls face around reproductive health, based on real community insights:
- Partner pressure to not use contraception: "boyfriend wangu hataki nit umie depo", "anasema akipata ataniacha"
- Side effects fears: "hii depo inapoteza feelings", "implant inafanya uzito", "nikichukua sindano nitakuwa barren"
- Stigma at clinics: "daktari alinisomba mbele ya watu", "wauguzi wanacheka"
- Financial barriers: "si ninunue food ama nende kliniki", bus fare, taking half a day off work
- Misinformation from friends: "jirani yangu alisema implant ilihamia kichwa chake"
- Real relief and wins: "nimefurahi nimepata SI nikaweza kujichomea nyumbani faragha", "implant ilibadilisha maisha yangu"
- Period struggles: "hedhi yangu inaniua, maumivu mob sana", "flow yangu inafanya niwe home for 3 days"
- Pregnancy scares: "nilikuwa late siku 5 nilikuwa naona vitu", "nilijaribu pregnancy test usiku wa manane"`

const PERSONAS = {
  sista: {
    name: 'Sista',
    emoji: '💜',
    color: '#805ad5',
    bgColor: '#faf5ff',
    tagline: 'Your ride-or-die health bestie',
    systemPrompt: (lang, nick) => `You are Sista — a young Kenyan woman's closest, most trusted health bestie. You are warm, real, funny when appropriate, and totally non-judgmental. You speak like someone FROM the community, not a health worker talking down. Address the user as ${nick}. ${lang === 'sw' ? 'Jibu kwa Kiswahili au Sheng — ongea kama rafiki wa karibu.' : 'Mix English with a bit of Sheng/Swahili naturally — like "pole sana", "aki", "si you know", "shida gani".'}

${YOUTH_VOICE}

PERSONALITY:
- Lead with EMPATHY before information. If someone shares a problem, first say "pole" or validate before giving info.
- Use light humour when appropriate ("aki mbona partner wengine wana upuzi 😅")
- Be REAL — don't be corporate or clinical. Sound like a text from your best friend who happens to know health stuff.
- Never shame anyone for their choices, situation, or past.
- If someone has partner pressure issues, validate them and give practical advice.
- Keep responses SHORT — under 120 words unless they need detailed info.
- ONLY answer questions about reproductive health, family planning, periods, relationships as they relate to sexual health. For anything else redirect warmly.
- Always end with a question or encouragement to continue the conversation.`
  },
  safespace: {
    name: 'Safe Space',
    emoji: '🌈',
    color: '#2b6cb0',
    bgColor: '#ebf8ff',
    tagline: 'Inclusive, affirming, zero judgment',
    systemPrompt: (lang, nick) => `You are Safe Space — an inclusive and deeply affirming reproductive health companion for ALL young people, regardless of gender identity, sexuality, relationship status, or background. Address the user as ${nick}. ${lang === 'sw' ? 'Jibu kwa Kiswahili cha upole na kujumuisha kila mtu.' : 'Speak with warmth, radical inclusivity, and zero judgment.'}

${YOUTH_VOICE}

PERSONALITY:
- Affirm EVERYONE's right to reproductive health, pleasure, and safety.
- NEVER assume gender, sexuality, or relationship type. Use inclusive language.
- Validate the unique challenges LGBTQ+ individuals face in accessing health care in Kenya.
- Be a safe container for questions people are scared to ask anywhere else.
- If someone shares stigma or discrimination they've faced, acknowledge it as real and wrong.
- Keep responses under 130 words. Clear, warm, affirming.
- ONLY answer questions about reproductive health, family planning, periods, sexual health, relationships.`
  },
  mamafya: {
    name: 'Mama Afya',
    emoji: '🌺',
    color: '#c05621',
    bgColor: '#fffaf0',
    tagline: 'Trusted community health wisdom',
    systemPrompt: (lang, nick) => `You are Mama Afya — a warm, experienced community health worker and trusted mother figure who has supported thousands of women and girls in Kenya. Address the user as ${nick}. ${lang === 'sw' ? 'Jibu kwa Kiswahili cha upole, kama mama anayezungumza na mtoto wake.' : 'Speak warmly like a trusted auntie who has seen it all and judges nothing.'}

${YOUTH_VOICE}

PERSONALITY:
- Warm, wise, experienced — but NEVER preachy or judgmental.
- Ground your advice in real Kenyan community experience.
- Reference the challenges women face in accessing health care without minimising them.
- When someone is scared or confused, be extra gentle.
- Keep responses under 130 words. Practical, caring, grounded.
- ONLY answer questions about reproductive health, family planning, periods, maternal health, relationships.`
  },
  daktari: {
    name: 'Daktari Nova',
    emoji: '🩺',
    color: '#276749',
    bgColor: '#f0fff4',
    tagline: 'Clear medical facts, human voice',
    systemPrompt: (lang, nick) => `You are Daktari Nova — a friendly Kenyan doctor who gives clear, accurate medical information in plain language. Not cold or clinical. Address the user as ${nick}. ${lang === 'sw' ? 'Jibu kwa Kiswahili cha wazi na rahisi kuelewa.' : 'Speak like a doctor who is also your friend — accurate but human.'}

PERSONALITY:
- Lead with the medical facts, but always humanise them.
- Debunk myths with evidence: "There's no proof that implants travel to the brain — that's a common fear but medically impossible."
- When side effects are real, acknowledge them honestly AND contextualise: "Yes, your period may change — here's why that's usually safe."
- Keep responses under 140 words. Accurate, clear, kind.
- ALWAYS add disclaimer when relevant: "Please see a healthcare provider for personal medical advice."
- ONLY answer questions about reproductive health, family planning, sexual health, periods, medications.`
  }
}

// ─────────────────────────────────────────────────────────
//  FAQS
// ─────────────────────────────────────────────────────────
const CYCLE_FAQS = [
  { q: 'What are "safe days"?', a: 'Safe days are the days in your cycle when pregnancy is least likely. Generally the days right after your period ends and the days just before your next period. However, cycles vary — there are NO 100% safe days without contraception. Always use a method if you don\'t want to get pregnant.' },
  { q: 'What is the fertile window?', a: 'The fertile window is the 5–6 days around ovulation (when your ovary releases an egg). An egg lives 12–24 hours, but sperm can survive 5 days inside you — so sex in the days BEFORE ovulation can lead to pregnancy.' },
  { q: 'My period is late. Am I pregnant?', a: 'Not necessarily! Periods can be late due to stress, weight changes, illness, travel, or hormonal changes. If you had unprotected sex, take a pregnancy test to be sure. A home test is accurate from the first day of a missed period. Always see a healthcare provider for confirmation.' },
  { q: 'Can I get pregnant during my period?', a: 'It\'s unlikely but possible, especially if you have a short cycle. Sperm can survive 5 days, and if you ovulate soon after your period, you could conceive. Use contraception if you don\'t want to get pregnant.' },
  { q: 'What does "ovulation" mean?', a: 'Ovulation is when your ovary releases an egg — usually around day 14 of a 28-day cycle (but varies!). This is when you\'re most fertile. Signs include clear stretchy discharge (like egg white), mild one-sided cramping, or a slight rise in body temperature.' },
  { q: 'Why is my period painful?', a: 'Period pain (dysmenorrhoea) is common and caused by uterine contractions. Mild to moderate pain is normal. Severe pain that stops your daily activities, very heavy bleeding, or pain outside your period could signal conditions like endometriosis — see a doctor.' },
  { q: 'I\'m on Depo/Implant and my period stopped. Is that normal?', a: 'Yes! Hormonal contraceptives like Depo-Provera and the implant commonly cause periods to become irregular or stop completely. This is SAFE and NOT a sign of pregnancy. Your uterine lining is just thinner. Periods usually return after stopping the method.' },
  { q: 'Can I track my cycle while on contraception?', a: 'Yes! Tracking while on hormonal contraception mainly helps you understand your body and spot unusual symptoms. Note that hormonal methods change your natural cycle, so the fertility predictions won\'t apply — use your method for pregnancy prevention.' }
]

// ─────────────────────────────────────────────────────────
//  CYCLE TRACKER COMPONENT
// ─────────────────────────────────────────────────────────
function CycleTracker({ lang, nick }) {
  const [cycles, setCycles] = useState(() => novaStore.getCycles())
  const [logs, setLogs] = useState(() => novaStore.getLogs())
  const [fpMethod, setFpMethod] = useState(() => novaStore.getMethod())
  const [viewDate, setViewDate] = useState(new Date())
  const [showLogModal, setShowLogModal] = useState(null) // date string
  const [showMethodSetup, setShowMethodSetup] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [showPeriodForm, setShowPeriodForm] = useState(false)
  const [periodInput, setPeriodInput] = useState({ start: fmt(new Date()), length: 5 })
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const [cycleLen] = useState(28)
  const [periodLen] = useState(5)

  const info = computeCycleInfo(cycles, cycleLen, periodLen)
  const today = new Date(); today.setHours(0,0,0,0)
  const todayStr = fmt(today)

  // Check return date reminder
  useEffect(() => {
    if (fpMethod && fpMethod.returnDate) {
      const rd = parseDate(fpMethod.returnDate)
      const daysLeft = diffDays(today, rd)
      if (daysLeft >= 0 && daysLeft <= 14) setShowReminder(true)
    }
  }, [fpMethod])

  const saveCycles = c => { setCycles(c); novaStore.saveCycles(c) }
  const saveLogs = l => { setLogs(l); novaStore.saveLogs(l) }
  const saveMethod = m => { setFpMethod(m); novaStore.saveMethod(m) }

  // Calendar grid
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const getDayColor = (dateStr) => {
    const type = getDayType(dateStr, cycles, info)
    const log = logs[dateStr] || {}
    if (type === 'period') return { bg: '#e53e3e', text: '#fff', label: 'Period' }
    if (type === 'predicted') return { bg: '#feb2b2', text: '#742a2a', label: 'Predicted' }
    if (type === 'ovulation') return { bg: '#dd6b20', text: '#fff', label: 'Ovulation' }
    if (type === 'fertile') return { bg: '#fbd38d', text: '#744210', label: 'Fertile' }
    if (type === 'safe') return { bg: '#c6f6d5', text: '#22543d', label: 'Safe' }
    if (type === 'luteal') return { bg: '#e9d8fd', text: '#44337a', label: 'Luteal' }
    return { bg: 'transparent', text: '#1a202c', label: '' }
  }

  const LogModal = ({ dateStr }) => {
    const [local, setLocal] = useState(logs[dateStr] || { mood: '', flow: '', symptoms: [], hadSex: false, usedContraception: false, notes: '' })
    const moods = ['😊','😐','😔','😠','😴','🤢']
    const flows = ['Light','Medium','Heavy','Spotting','None']
    const symptomList = ['Cramps','Headache','Bloating','Tender breasts','Back pain','Fatigue','Nausea','Mood swings']

    const save = () => {
      const updated = { ...logs, [dateStr]: local }
      saveLogs(updated)
      setShowLogModal(null)
    }

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowLogModal(null)}>
        <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">Log {dateStr}</h3>
            <button onClick={() => setShowLogModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
          </div>

          {/* Mood */}
          <p className="text-sm font-semibold text-gray-600 mb-2">How are you feeling?</p>
          <div className="flex gap-2 mb-4">
            {moods.map(m => (
              <button key={m} onClick={() => setLocal(l => ({ ...l, mood: m }))}
                className={`text-2xl p-2 rounded-xl transition-all ${local.mood === m ? 'bg-pink-100 scale-110' : 'hover:bg-gray-100'}`}>{m}</button>
            ))}
          </div>

          {/* Flow */}
          <p className="text-sm font-semibold text-gray-600 mb-2">Flow today?</p>
          <div className="flex gap-2 flex-wrap mb-4">
            {flows.map(f => (
              <button key={f} onClick={() => setLocal(l => ({ ...l, flow: f }))}
                className={`px-3 py-1 rounded-full text-sm border transition-all ${local.flow === f ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 hover:border-red-300'}`}>{f}</button>
            ))}
          </div>

          {/* Symptoms */}
          <p className="text-sm font-semibold text-gray-600 mb-2">Any symptoms?</p>
          <div className="flex gap-2 flex-wrap mb-4">
            {symptomList.map(s => (
              <button key={s} onClick={() => setLocal(l => ({
                ...l, symptoms: l.symptoms.includes(s) ? l.symptoms.filter(x => x !== s) : [...l.symptoms, s]
              }))}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${local.symptoms.includes(s) ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-300 hover:border-purple-300'}`}>{s}</button>
            ))}
          </div>

          {/* Sex log */}
          <div className="bg-gray-50 rounded-2xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-600">Had sex today?</p>
              <button onClick={() => setLocal(l => ({ ...l, hadSex: !l.hadSex }))}
                className={`w-12 h-6 rounded-full transition-all relative ${local.hadSex ? 'bg-pink-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${local.hadSex ? 'left-6' : 'left-0.5'}`}/>
              </button>
            </div>
            {local.hadSex && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Used contraception?</p>
                <button onClick={() => setLocal(l => ({ ...l, usedContraception: !l.usedContraception }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${local.usedContraception ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${local.usedContraception ? 'left-6' : 'left-0.5'}`}/>
                </button>
              </div>
            )}
            {/* Pregnancy likelihood if had unprotected sex */}
            {local.hadSex && !local.usedContraception && info && (
              <div className={`mt-3 p-2 rounded-xl bg-${info.pregnancyColor === '#e53e3e' ? 'red' : 'yellow'}-50 border border-${info.pregnancyColor === '#e53e3e' ? 'red' : 'yellow'}-200`}>
                <p className="text-xs font-bold" style={{ color: info.pregnancyColor }}>
                  Pregnancy likelihood today: {info.pregnancyLikelihood}
                </p>
                <p className="text-xs text-gray-500 mt-1">⚠️ Disclaimer: This is an estimate only. It does not replace medical advice. Always use contraception if you do not want to get pregnant.</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <textarea
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-pink-400 mb-4"
            rows={2} placeholder="Any notes for today..."
            value={local.notes} onChange={e => setLocal(l => ({ ...l, notes: e.target.value }))}
          />

          <button onClick={save} className="w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>Save Log</button>
        </div>
      </div>
    )
  }

  const MethodSetupModal = () => {
    const [sel, setSel] = useState(fpMethod?.methodId || '')
    const [startDate, setStartDate] = useState(fpMethod?.startDate || fmt(today))
    const [onMethod, setOnMethod] = useState(fpMethod ? 'yes' : 'no')

    const save = () => {
      if (onMethod === 'no') { saveMethod(null); setShowMethodSetup(false); return }
      if (!sel) return
      const method = METHODS.find(m => m.id === sel)
      if (!method || !method.returnDate) { saveMethod({ methodId: sel, startDate, returnDate: null }); setShowMethodSetup(false); return }
      const rd = fmt(addDays(parseDate(startDate), method.returnDate))
      saveMethod({ methodId: sel, startDate, returnDate: rd, methodName: method.name.en })
      setShowMethodSetup(false)
    }

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMethodSetup(false)}>
        <div className="bg-white rounded-3xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
          <h3 className="font-bold text-gray-800 text-lg mb-4">💊 My Contraceptive Method</h3>

          <p className="text-sm text-gray-600 mb-3">Are you currently on a family planning method?</p>
          <div className="flex gap-3 mb-4">
            {['yes','no'].map(v => (
              <button key={v} onClick={() => setOnMethod(v)}
                className={`flex-1 py-2 rounded-xl border font-semibold text-sm transition-all capitalize ${onMethod === v ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-300'}`}>{v}</button>
            ))}
          </div>

          {onMethod === 'yes' && (
            <>
              <p className="text-sm text-gray-600 mb-2">Which method?</p>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {METHODS.filter(m => m.returnDate).map(m => (
                  <button key={m.id} onClick={() => setSel(m.id)}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${sel === m.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'}`}>
                    {m.emoji} {m.name.en} <span className="text-gray-400">({m.duration.en})</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-2">When did you start / last get it?</p>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 focus:outline-none focus:border-pink-400" />
            </>
          )}

          <button onClick={save} className="w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 relative pb-20">

      {/* Return date reminder banner */}
      {showReminder && fpMethod && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
          <Bell size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-orange-800 text-sm">⏰ Return Date Coming Up!</p>
            <p className="text-xs text-orange-700 mt-1">
              Your {fpMethod.methodName} return date is <strong>{fpMethod.returnDate}</strong>.{' '}
              {diffDays(today, parseDate(fpMethod.returnDate)) === 0 ? '🚨 Today!' : `${diffDays(today, parseDate(fpMethod.returnDate))} days away.`}
            </p>
            <p className="text-xs text-orange-600 mt-1">Book your appointment now so you don't have a gap in protection.</p>
          </div>
          <button onClick={() => setShowReminder(false)} className="text-orange-400"><X size={16}/></button>
        </div>
      )}

      {/* Phase card */}
      {info ? (
        <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${info.phaseColor}, ${info.phaseColor}cc)` }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold opacity-80">TODAY — CYCLE DAY {info.dayOfCycle}</p>
              <p className="text-xl font-bold mt-1">{info.phase}</p>
              <p className="text-xs opacity-90 mt-1 max-w-xs">{info.phaseDesc}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Pregnancy likelihood</p>
              <p className="text-lg font-bold">{info.pregnancyLikelihood}</p>
              <p className="text-xs opacity-75 mt-1">Next period: {fmt(info.nextPeriodStart)}</p>
            </div>
          </div>
          <p className="text-xs opacity-60 mt-2">⚠️ Estimate only. Does not replace medical advice or contraception.</p>
        </div>
      ) : (
        <div className="bg-pink-50 rounded-2xl p-4 text-center border border-pink-100">
          <p className="text-gray-600 text-sm mb-3">Log your first period to start tracking your cycle</p>
          <button onClick={() => setShowPeriodForm(true)}
            className="px-6 py-2 rounded-full text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>+ Log First Period</button>
        </div>
      )}

      {/* FP method card */}
      {fpMethod ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 font-semibold">MY METHOD</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">{fpMethod.methodName || fpMethod.methodId}</p>
              {fpMethod.returnDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Return date: <span className="font-semibold text-orange-600">{fpMethod.returnDate}</span>
                  {' '}({Math.max(0, diffDays(today, parseDate(fpMethod.returnDate)))} days)
                </p>
              )}
            </div>
            <button onClick={() => setShowMethodSetup(true)} className="text-xs text-pink-500 font-semibold">Change</button>
          </div>
          {fpMethod.returnDate && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Started: {fpMethod.startDate}</span>
                <span>Return: {fpMethod.returnDate}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                {(() => {
                  const total = diffDays(parseDate(fpMethod.startDate), parseDate(fpMethod.returnDate))
                  const elapsed = diffDays(parseDate(fpMethod.startDate), today)
                  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
                  const color = pct > 85 ? '#e53e3e' : pct > 70 ? '#dd6b20' : '#38a169'
                  return <div className="h-full rounded-full transition-all" style={{ width: pct + '%', background: color }} />
                })()}
              </div>
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => setShowMethodSetup(true)}
          className="w-full bg-purple-50 border border-purple-100 rounded-2xl p-3 text-left flex items-center gap-3">
          <span className="text-2xl">💊</span>
          <div>
            <p className="font-semibold text-purple-800 text-sm">Track my contraceptive method</p>
            <p className="text-xs text-purple-600">Get return date reminders</p>
          </div>
          <ChevronRight size={16} className="text-purple-400 ml-auto" />
        </button>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
            className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={16}/></button>
          <p className="font-bold text-gray-800">{monthName}</p>
          <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
            className="p-2 rounded-xl hover:bg-gray-100 rotate-180"><ArrowLeft size={16}/></button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['S','M','T','W','T','F','S'].map((d,i) => (
            <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {Array(firstDay).fill(null).map((_,i) => <div key={'e'+i}/>)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const isToday = dateStr === todayStr
            const dayColor = getDayColor(dateStr)
            const log = logs[dateStr]
            return (
              <button key={day} onClick={() => setShowLogModal(dateStr)}
                className="relative aspect-square flex flex-col items-center justify-center rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: dayColor.bg !== 'transparent' ? dayColor.bg : isToday ? '#f0fff4' : 'transparent',
                  color: dayColor.bg !== 'transparent' ? dayColor.text : isToday ? '#276749' : '#1a202c',
                  border: isToday ? '2px solid #38a169' : '2px solid transparent',
                  fontWeight: isToday ? 700 : 400
                }}>
                {day}
                {log && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {log.hadSex && <div className="w-1 h-1 rounded-full bg-pink-400"/>}
                    {log.mood && <div className="w-1 h-1 rounded-full bg-yellow-400"/>}
                    {log.flow && log.flow !== 'None' && <div className="w-1 h-1 rounded-full bg-red-400"/>}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { color: '#e53e3e', label: 'Period' },
            { color: '#feb2b2', label: 'Predicted period' },
            { color: '#fbd38d', label: 'Fertile window' },
            { color: '#dd6b20', label: 'Ovulation day' },
            { color: '#c6f6d5', label: 'Safe days' },
            { color: '#38a169', label: 'Today', border: true },
          ].map(({ color, label, border }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: color, border: border ? '2px solid #38a169' : 'none' }}/>
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">Tap any day to log symptoms, mood, flow, or sex</p>
      </div>

      {/* Log period button */}
      {info && (
        <button onClick={() => setShowPeriodForm(true)}
          className="w-full py-3 rounded-2xl text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
          🩸 Log Period Start
        </button>
      )}

      {showPeriodForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPeriodForm(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-4">🩸 Log Period</h3>
            <p className="text-sm text-gray-600 mb-2">Period start date (Day 1)</p>
            <input type="date" value={periodInput.start} onChange={e => setPeriodInput(p => ({ ...p, start: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 focus:outline-none focus:border-pink-400" />
            <p className="text-sm text-gray-600 mb-2">How many days did it last?</p>
            <div className="flex gap-2 mb-4">
              {[3,4,5,6,7,8].map(n => (
                <button key={n} onClick={() => setPeriodInput(p => ({ ...p, length: n }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${periodInput.length === n ? 'bg-red-500 text-white border-red-500' : 'border-gray-200'}`}>{n}</button>
              ))}
            </div>
            <button onClick={() => {
              const updated = [...cycles.filter(c => c.start !== periodInput.start), { start: periodInput.start, length: periodInput.length }]
              saveCycles(updated)
              setShowPeriodForm(false)
            }}
              className="w-full py-3 rounded-2xl text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>Save</button>
          </div>
        </div>
      )}

      {showLogModal && <LogModal dateStr={showLogModal} />}
      {showMethodSetup && <MethodSetupModal />}

      {/* FAQ floating button */}
      <button
        onClick={() => setShowFAQ(true)}
        className="fixed bottom-24 right-4 w-12 h-12 rounded-full shadow-lg text-white flex items-center justify-center z-40"
        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
        <HelpCircle size={22} />
      </button>

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowFAQ(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-lg">❓ Cycle FAQs</h3>
              <button onClick={() => setShowFAQ(false)} className="text-gray-400"><X size={20}/></button>
            </div>
            <div className="space-y-3">
              {CYCLE_FAQS.map((faq, i) => (
                <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <button onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                    className="w-full text-left p-4 flex justify-between items-start gap-2 hover:bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800">{faq.q}</p>
                    {expandedFAQ === i ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-0.5"/> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-0.5"/>}
                  </button>
                  {expandedFAQ === i && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//  AI CHAT COMPONENT
// ─────────────────────────────────────────────────────────
function AskNova({ lang, nick }) {
  const [selectedPersona, setSelectedPersona] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEnd = useRef(null)

  useEffect(() => {
    if (selectedPersona) {
      const saved = novaStore.getChat(selectedPersona)
      setMessages(saved)
    }
  }, [selectedPersona])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading || !selectedPersona) return
    const userMsg = { role: 'user', content: input.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const persona = PERSONAS[selectedPersona]
      const systemPrompt = persona.systemPrompt(lang, nick || 'friend')

      const apiMessages = updated.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages
        })
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Sorry, I couldn\'t respond right now. Please try again.'
      const withReply = [...updated, { role: 'assistant', content: reply }]
      setMessages(withReply)
      novaStore.saveChat(selectedPersona, withReply)
    } catch (err) {
      const withErr = [...updated, { role: 'assistant', content: 'Network error. Please check your connection and try again.' }]
      setMessages(withErr)
    }
    setLoading(false)
  }

  if (!selectedPersona) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="font-bold text-gray-800 text-lg">Who do you want to talk to?</p>
          <p className="text-sm text-gray-500 mt-1">Choose your companion — each one has a different personality</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PERSONAS).map(([key, p]) => (
            <button key={key} onClick={() => setSelectedPersona(key)}
              className="rounded-2xl p-4 text-left transition-all hover:scale-105 active:scale-95 shadow-sm border border-gray-100"
              style={{ background: p.bgColor }}>
              <p className="text-3xl mb-2">{p.emoji}</p>
              <p className="font-bold text-sm" style={{ color: p.color }}>{p.name}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{p.tagline}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-center text-gray-400">💬 Conversations are saved on your phone. You can erase them anytime.</p>
      </div>
    )
  }

  const persona = PERSONAS[selectedPersona]

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-3">
        <button onClick={() => setSelectedPersona(null)} className="p-1 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} className="text-gray-600"/>
        </button>
        <div className="text-2xl">{persona.emoji}</div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: persona.color }}>{persona.name}</p>
          <p className="text-xs text-gray-400">{persona.tagline}</p>
        </div>
        <button onClick={() => { novaStore.clearChat(selectedPersona); setMessages([]) }}
          className="text-xs text-gray-400 flex items-center gap-1 hover:text-red-500">
          <Trash2 size={14}/> Erase
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">{persona.emoji}</p>
            <p className="font-semibold text-sm" style={{ color: persona.color }}>{persona.name} is here</p>
            <p className="text-xs text-gray-400 mt-1">Ask anything about your health, periods, FP methods...</p>
            <div className="mt-4 space-y-2">
              {[
                lang === 'sw' ? 'Je, depo inafanya uzito kuongezeka?' : 'Does Depo cause weight gain?',
                lang === 'sw' ? 'Niko na maumivu ya hedhi mob sana' : 'My period cramps are really bad',
                lang === 'sw' ? 'Ni njia gani bora kwa faragha?' : 'Which method is best for privacy?'
              ].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="block w-full text-left text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-pink-300 hover:bg-pink-50">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1"
                style={{ background: persona.bgColor }}>{persona.emoji}</div>
            )}
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'text-white rounded-br-sm'
                : 'text-gray-800 rounded-bl-sm border border-gray-100'
            }`}
              style={m.role === 'user'
                ? { background: `linear-gradient(135deg, ${persona.color}, ${persona.color}cc)` }
                : { background: persona.bgColor }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2" style={{ background: persona.bgColor }}>{persona.emoji}</div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-100" style={{ background: persona.bgColor }}>
              <div className="flex gap-1">{[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: persona.color, animationDelay: i * 0.15 + 's' }}/>
              ))}</div>
            </div>
          </div>
        )}
        <div ref={messagesEnd}/>
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={`Ask ${persona.name}...`}
          className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400"
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${persona.color}, ${persona.color}bb)` }}>
          <Send size={16}/>
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//  FIND CLINIC
// ─────────────────────────────────────────────────────────
function FindClinic({ lang }) {
  const [status, setStatus] = useState('idle') // idle | locating | searching | done | error
  const [clinics, setClinics] = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  const KENYA_HEALTH_LINE = '0800 723 253'

  const findClinics = () => {
    setStatus('locating')
    setClinics([])
    setErrorMsg('')

    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMsg('Location not supported by your browser. Please call the health line below.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setStatus('searching')
        try {
          // Use Anthropic API with web_search to find nearby clinics
          const query = `Find 3 nearest public health facilities or family planning clinics near latitude ${latitude}, longitude ${longitude} in Kenya. For each provide: name, address/area, distance estimate, and services (family planning, DMPA, implants). Format as JSON array with fields: name, address, distance, services, phone.`

          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1000,
              tools: [{ type: 'web_search_20250305', name: 'web_search' }],
              messages: [{
                role: 'user',
                content: `Search for the 3 nearest public health facilities or family planning clinics near GPS coordinates: ${latitude}, ${longitude} in Kenya. Return ONLY a JSON array (no markdown, no extra text) with exactly this structure:
[{"name":"Facility Name","address":"Area/Street, Nairobi","distance":"~0.5 km","services":"Family planning, DMPA, implants","phone":"0700000000 or Not listed"}]
Use real health facility data from Kenya Master Health Facility List or Google Maps. If you cannot find specific facilities near these exact coordinates, find facilities in the nearest major area.`
              }]
            })
          })

          const data = await res.json()
          const fullText = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')

          // Extract JSON from response
          const jsonMatch = fullText.match(/\[[\s\S]*?\]/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (Array.isArray(parsed) && parsed.length > 0) {
              setClinics(parsed.slice(0, 3))
              setStatus('done')
              return
            }
          }

          // Fallback: try to parse the whole response as JSON
          try {
            const parsed = JSON.parse(fullText.trim())
            if (Array.isArray(parsed) && parsed.length > 0) {
              setClinics(parsed.slice(0, 3))
              setStatus('done')
              return
            }
          } catch {}

          setStatus('error')
          setErrorMsg('Could not find facilities near you. Please call the health line or visit your nearest public hospital.')
        } catch (err) {
          setStatus('error')
          setErrorMsg('Could not get results. Please check your connection or call the health line below.')
        }
      },
      (err) => {
        setStatus('error')
        if (err.code === 1) {
          setErrorMsg('Location access denied. Please enable location in your browser settings, or call the health line.')
        } else {
          setErrorMsg('Could not determine your location. Please call the health line below.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="font-bold text-gray-800 text-lg">📍 Find a Clinic Near You</p>
        <p className="text-sm text-gray-500 mt-1">We'll find the 3 nearest health facilities to you</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex gap-2">
        <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-yellow-700">Results are based on available data and may not always be accurate. Always call ahead to confirm services are available.</p>
      </div>

      {status === 'idle' && (
        <button onClick={findClinics}
          className="w-full py-4 rounded-2xl text-white font-bold text-base"
          style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
          📍 Find Clinics Near Me
        </button>
      )}

      {(status === 'locating' || status === 'searching') && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin mx-auto mb-3"/>
          <p className="text-sm text-gray-600">
            {status === 'locating' ? '📡 Getting your location...' : '🔍 Searching for clinics near you...'}
          </p>
        </div>
      )}

      {status === 'error' && (
        <>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-sm text-red-600 text-center">{errorMsg}</p>
          </div>
          <button onClick={findClinics}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
            Try Again
          </button>
        </>
      )}

      {status === 'done' && clinics.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600">Nearest facilities found:</p>
          {clinics.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>{i + 1}</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">📍 {c.address}</p>
                  {c.distance && <p className="text-xs text-green-600 mt-0.5">🚶 {c.distance}</p>}
                  {c.services && <p className="text-xs text-blue-600 mt-1">✅ {c.services}</p>}
                  {c.phone && c.phone !== 'Not listed' && (
                    <a href={`tel:${c.phone}`} className="text-xs text-pink-600 mt-1 flex items-center gap-1 font-semibold">
                      <Phone size={12}/> {c.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          <button onClick={findClinics} className="w-full py-2 rounded-2xl border border-pink-300 text-pink-600 text-sm font-semibold flex items-center justify-center gap-2">
            <RefreshCw size={14}/> Search Again
          </button>
        </div>
      )}

      {/* Always show health line */}
      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
          <Phone size={18} className="text-teal-600"/>
        </div>
        <div>
          <p className="font-bold text-teal-800 text-sm">Kenya Health Line — Free</p>
          <a href={`tel:${KENYA_HEALTH_LINE}`} className="text-lg font-bold text-teal-600">{KENYA_HEALTH_LINE}</a>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//  METHODS COMPONENT
// ─────────────────────────────────────────────────────────
function MethodsTab({ lang }) {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all') // all | hormonal | non-hormonal | emergency

  const categories = [
    { id: 'all', label: '⭐ All' },
    { id: 'long', label: '📅 Long-term' },
    { id: 'short', label: '💊 Short-term' },
    { id: 'emergency', label: '🚨 Emergency' }
  ]

  const filterMethod = m => {
    if (filter === 'all') return true
    if (filter === 'long') return ['dmpa_sc','dmpa_im','implant','iud_copper'].includes(m.id)
    if (filter === 'short') return ['pill','condom'].includes(m.id)
    if (filter === 'emergency') return m.id === 'emergency'
    return true
  }

  if (selected) {
    const m = selected
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-600 text-sm hover:text-gray-800">
          <ArrowLeft size={16}/> Back to all methods
        </button>
        <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)` }}>
          <p className="text-4xl mb-2">{m.emoji}</p>
          <p className="font-bold text-xl">{m.name[lang] || m.name.en}</p>
          <div className="flex gap-3 mt-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">{m.efficacy} effective</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">{m.duration[lang] || m.duration.en}</span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="font-bold text-blue-800 text-sm mb-2">💡 How it works</p>
          <p className="text-sm text-blue-700 leading-relaxed">{m.howItWorks[lang] || m.howItWorks.en}</p>
        </div>

        <div className="bg-green-50 rounded-2xl p-4">
          <p className="font-bold text-green-800 text-sm mb-2">✅ Good for you if...</p>
          <ul className="space-y-1">
            {(m.goodFor[lang] || m.goodFor.en).map((g, i) => (
              <li key={i} className="text-sm text-green-700 flex gap-2"><span>•</span>{g}</li>
            ))}
          </ul>
        </div>

        <div className="bg-orange-50 rounded-2xl p-4">
          <p className="font-bold text-orange-800 text-sm mb-2">⚠️ Things to know</p>
          <ul className="space-y-1">
            {(m.sideEffects[lang] || m.sideEffects.en).map((s, i) => (
              <li key={i} className="text-sm text-orange-700 flex gap-2"><span>•</span>{s}</li>
            ))}
          </ul>
        </div>

        {m.returnDate && (
          <div className="bg-purple-50 rounded-2xl p-4">
            <p className="font-bold text-purple-800 text-sm">⏰ Return / Refill</p>
            <p className="text-sm text-purple-700 mt-1">
              You need to come back every <strong>{m.returnDate >= 365 ? `${Math.round(m.returnDate/365)} year(s)` : `${m.returnDate} days`}</strong>.
              Set a reminder so you don't have a gap in protection.
            </p>
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-3">
          <p className="text-xs text-gray-500 text-center">This information is educational only. Always speak to a healthcare provider before starting, stopping, or switching methods.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="font-bold text-gray-800 text-lg">💊 Contraceptive Methods</p>
      <p className="text-sm text-gray-500">Explained in plain language — for you, not a textbook</p>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {categories.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${filter === c.id ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
            style={filter === c.id ? { background: 'linear-gradient(135deg, #f093fb, #f5576c)' } : {}}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {METHODS.filter(filterMethod).map(m => (
          <button key={m.id} onClick={() => setSelected(m)}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md transition-all flex items-center gap-4 active:scale-98">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: m.color + '20' }}>{m.emoji}</div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{m.name[lang] || m.name.en}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.efficacy} effective · {m.duration[lang] || m.duration.en}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300"/>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center">Always speak to a healthcare provider for personal advice.</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//  RETURN DATE TAB  (enhanced)
// ─────────────────────────────────────────────────────────
function ReturnDateTab({ lang }) {
  const [method, setMethod] = useState(() => novaStore.getMethod())
  const [showing, setShowing] = useState('summary') // summary | calculator | tips

  const today = new Date(); today.setHours(0,0,0,0)

  const daysUntilReturn = method?.returnDate ? diffDays(today, parseDate(method.returnDate)) : null
  const urgency = daysUntilReturn === null ? null : daysUntilReturn <= 0 ? 'overdue' : daysUntilReturn <= 7 ? 'urgent' : daysUntilReturn <= 14 ? 'soon' : 'ok'

  const urgencyConfig = {
    overdue: { color: '#e53e3e', bg: '#fff5f5', icon: '🚨', msg: 'OVERDUE! You may have a gap in protection. Visit a facility today.' },
    urgent:  { color: '#dd6b20', bg: '#fffaf0', icon: '⚠️', msg: 'Due very soon! Book your appointment now.' },
    soon:    { color: '#d69e2e', bg: '#fffff0', icon: '📅', msg: 'Coming up — book your appointment this week.' },
    ok:      { color: '#38a169', bg: '#f0fff4', icon: '✅', msg: 'You\'re on track. Keep it up!' }
  }

  // Quick calculator for people without a method tracked
  const [calcMethod, setCalcMethod] = useState('')
  const [calcDate, setCalcDate] = useState(fmt(today))
  const [calcResult, setCalcResult] = useState(null)

  const calculate = () => {
    const m = METHODS.find(x => x.id === calcMethod)
    if (!m || !m.returnDate) return
    const rd = addDays(parseDate(calcDate), m.returnDate)
    setCalcResult({ method: m, returnDate: fmt(rd), daysLeft: diffDays(today, rd) })
  }

  const returnTips = [
    { icon: '📱', title: 'Set a phone reminder', tip: 'Put a recurring alarm in your calendar 2 weeks before your return date.' },
    { icon: '👩‍⚕️', title: 'Book ahead', tip: 'Don\'t wait until the last day. Book your appointment 1 week before the date.' },
    { icon: '🏥', title: 'Know your nearest facility', tip: 'Identify at least 2 facilities near you in case one is closed.' },
    { icon: '💬', title: 'Tell a trusted person', tip: 'Let a friend or family member know your schedule so they can remind you.' },
    { icon: '🔄', title: 'If you miss your date', tip: 'Don\'t panic — use a condom as backup and visit a facility as soon as possible. For Depo, there\'s a 2-week grace period.' },
    { icon: '📝', title: 'Bring your records', tip: 'Take your FP card or any documents showing your last visit to the next appointment.' }
  ]

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {[['summary','📅 My Status'],['calculator','🔢 Calculator'],['tips','💡 Tips']].map(([id, label]) => (
          <button key={id} onClick={() => setShowing(id)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${showing === id ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
            style={showing === id ? { background: 'linear-gradient(135deg, #f093fb, #f5576c)' } : {}}>{label}</button>
        ))}
      </div>

      {/* Summary */}
      {showing === 'summary' && (
        <>
          {method ? (
            <>
              <div className="rounded-2xl p-4 border" style={{ background: urgencyConfig[urgency].bg, borderColor: urgencyConfig[urgency].color + '40' }}>
                <p className="text-2xl mb-1">{urgencyConfig[urgency].icon}</p>
                <p className="font-bold text-sm" style={{ color: urgencyConfig[urgency].color }}>{method.methodName || method.methodId}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: urgencyConfig[urgency].color }}>
                  {daysUntilReturn === null ? '—' : daysUntilReturn <= 0 ? `${Math.abs(daysUntilReturn)} days overdue` : `${daysUntilReturn} days to go`}
                </p>
                <p className="text-xs mt-1" style={{ color: urgencyConfig[urgency].color }}>{urgencyConfig[urgency].msg}</p>
                <p className="text-xs text-gray-500 mt-2">Return date: <strong>{method.returnDate}</strong></p>
              </div>

              {/* Progress bar */}
              {method.startDate && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Started: {method.startDate}</span>
                    <span>Return: {method.returnDate}</span>
                  </div>
                  {(() => {
                    const total = diffDays(parseDate(method.startDate), parseDate(method.returnDate))
                    const elapsed = diffDays(parseDate(method.startDate), today)
                    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
                    const color = pct > 90 ? '#e53e3e' : pct > 75 ? '#dd6b20' : '#38a169'
                    return (
                      <>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: pct + '%', background: color }}/>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(pct)}% of protection period used</p>
                      </>
                    )
                  })()}
                </div>
              )}

              <button onClick={() => { novaStore.saveMethod(null); setMethod(null) }}
                className="text-xs text-gray-400 text-center w-full">Clear my method</button>
            </>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <p className="text-3xl mb-3">📅</p>
              <p className="font-semibold text-gray-700 text-sm mb-2">No method tracked yet</p>
              <p className="text-xs text-gray-500 mb-4">Use the calculator below to find your return date, or set up tracking in My Cycle.</p>
              <button onClick={() => setShowing('calculator')} className="px-6 py-2 rounded-full text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>Open Calculator</button>
            </div>
          )}
        </>
      )}

      {/* Calculator */}
      {showing === 'calculator' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Find out when to go back based on your method</p>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">My method</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {METHODS.filter(m => m.returnDate).map(m => (
                <button key={m.id} onClick={() => setCalcMethod(m.id)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${calcMethod === m.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                  {m.emoji} {m.name.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Date I got it / last got it</p>
            <input type="date" value={calcDate} onChange={e => setCalcDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-400"/>
          </div>
          <button onClick={calculate} disabled={!calcMethod}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>Calculate Return Date</button>

          {calcResult && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="font-bold text-green-800">Your return date: {calcResult.returnDate}</p>
              <p className="text-sm text-green-700 mt-1">{calcResult.daysLeft > 0 ? `${calcResult.daysLeft} days from today` : 'This date has passed!'}</p>
              <button onClick={() => {
                const m = calcResult.method
                const saved = { methodId: m.id, methodName: m.name.en, startDate: calcDate, returnDate: calcResult.returnDate }
                novaStore.saveMethod(saved); setMethod(saved); setShowing('summary')
              }}
                className="mt-3 text-xs text-pink-600 font-semibold">Save to My Tracker →</button>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {showing === 'tips' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 font-semibold">How to never miss your return date</p>
          {returnTips.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
              <span className="text-xl flex-shrink-0">{t.icon}</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//  SELF-INJECT TAB
// ─────────────────────────────────────────────────────────
function SelfInjectTab({ lang }) {
  const [step, setStep] = useState(0)
  const t = lang === 'sw'

  const steps = [
    { title: t ? 'Jiandae' : 'Prepare', icon: '🧼',
      content: t
        ? ['Osha mikono vizuri kwa sabuni na maji kwa sekunde 20','Angalia kifaa chako — vipu na piston zimekuwepo?','Angalia tarehe ya mwisho wa matumizi kwenye kifaa','Tafuta mahali safi na tulivu pa kujichomea']
        : ['Wash your hands thoroughly with soap and water for 20 seconds','Check your device — is the plunger and needle intact?','Check the expiry date on your device','Find a clean, comfortable place to self-inject'] },
    { title: t ? 'Eneo la Sindano' : 'Injection Site', icon: '📍',
      content: t
        ? ['Mbele ya paja au tumbo la chini (sentimita 5 chini ya kitovu)','Geuza maeneo kila wakati unapojichomea','Epuka maeneo ya ngozi iliyoathirika, michubuko, au unene','Safisha eneo na pamba ya pombe — subiri ikauke']
        : ['Front of thigh OR lower abdomen (5cm below belly button)','Rotate sites each time you inject','Avoid areas with broken skin, bruises, or lumps','Clean the site with an alcohol swab — let it dry completely'] },
    { title: t ? 'Sindano' : 'Inject', icon: '💉',
      content: t
        ? ['Pinda ngozi kwa vidole vyako (cm 2-3 ya ngozi)','Ingiza sindano WIMA (90°) haraka na ujasiri','Achilia ngozi uliyo pinda','Songa pistoni polepole hadi mwisho — sekunde 5-7','Toa sindano haraka katika pembe ile ile'] 
        : ['Pinch the skin gently between your fingers (2-3cm fold)','Insert the needle STRAIGHT (90°) with a quick confident motion','Release the pinched skin','Push the plunger slowly all the way down — take 5-7 seconds','Remove the needle quickly at the same angle'] },
    { title: t ? 'Baada ya Sindano' : 'After Injecting', icon: '✅',
      content: t
        ? ['Bonyeza eneo kwa pamba — usisugue','Tupa sindano MARA MOJA kwenye chombo salama (si takataka za kawaida)','Ikiwa eneo linaendelea kutokwa na damu, bonyeza kwa dakika 2','Rekodi tarehe yako kwenye Nova na weka kumbukumbu ya tarehe ya kurudi']
        : ['Press the site with a swab — do NOT rub','Dispose the device IMMEDIATELY in a safe sharps container (not regular trash)','If the site bleeds, press for 2 minutes','Log your date in Nova and set a reminder for your next return date'] },
    { title: t ? 'Dalili za Kutahadhari' : 'Warning Signs', icon: '🚨',
      content: t
        ? ['Maumivu makali ya kichwa au mabadiliko ya maono → Nenda hospitali','Kuvimba, usaha, au joto la kupita kiasi mahali pa sindano → Tafuta matibabu','Maumivu makali ya tumbo → Nenda kliniki','Majeraha ya moyo: kupumua kwa shida, maumivu ya kifua → 911/kliniki ya karibu']
        : ['Severe headache or vision changes → Go to hospital immediately','Swelling, pus, or excessive heat at injection site → Seek care','Severe abdominal pain → Visit clinic','Chest pain or difficulty breathing → Emergency services immediately'] }
  ]

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="font-bold text-gray-800 text-lg">💉 DMPA-SC Self-Injection Guide</p>
        <p className="text-xs text-gray-500 mt-1">Sayana Press · Step-by-step</p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {steps.map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{ background: i === step ? '#f5576c' : i < step ? '#fbd38d' : '#e2e8f0', transform: i === step ? 'scale(1.4)' : 'scale(1)' }}/>
        ))}
      </div>

      {/* Step card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
          <p className="text-3xl mb-1">{steps[step].icon}</p>
          <p className="text-xs font-semibold opacity-80">STEP {step + 1} OF {steps.length}</p>
          <p className="font-bold text-lg">{steps[step].title}</p>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            {steps[step].content.map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>{i + 1}</div>
                <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-30">← Previous</button>
        <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}
          className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>Next →</button>
      </div>

      {step === steps.length - 1 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="font-bold text-green-800">🎉 Well done!</p>
          <p className="text-sm text-green-700 mt-1">You've completed all the self-injection steps. Remember to log your date and set your return date reminder in Nova.</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl p-3">
        <p className="text-xs text-gray-500 text-center">This is a guide only. Ensure you've been trained by a qualified healthcare provider before self-injecting for the first time.</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//  HOME TAB
// ─────────────────────────────────────────────────────────
function HomeTab({ lang, setActiveTab, nick, setNick }) {
  const [editingNick, setEditingNick] = useState(false)
  const [tempNick, setTempNick] = useState(nick || '')
  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? '🌅 Good morning' : hour < 17 ? '☀️ Good afternoon' : '🌙 Good evening'

  const cards = [
    { emoji: '🌸', title: 'Track My Cycle', desc: 'Period tracker, safe days & fertility', tab: 'cycle', color: '#fed7e2' },
    { emoji: '💬', title: 'Ask Nova AI', desc: 'Chat with Sista, Mama Afya & more', tab: 'ai', color: '#e9d8fd' },
    { emoji: '📍', title: 'Find a Clinic', desc: 'Nearest FP facilities near you', tab: 'clinic', color: '#bee3f8' },
    { emoji: '💊', title: 'Learn Methods', desc: 'Compare all contraceptive options', tab: 'methods', color: '#c6f6d5' },
    { emoji: '💉', title: 'Self-Inject Guide', desc: 'Step-by-step Sayana Press', tab: 'selfInject', color: '#fed7e2' },
    { emoji: '📅', title: 'Return Date', desc: 'Track & reminders for your method', tab: 'returnDate', color: '#fefcbf' }
  ]

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <p className="text-sm opacity-90">{greeting}{nick ? `, ${nick}` : ''}!</p>
        <p className="font-bold text-xl mt-0.5">Welcome to Nova 🌸</p>
        <p className="text-xs opacity-75 mt-1">Your private reproductive health companion</p>
        {!nick && (
          <button onClick={() => setEditingNick(true)} className="mt-2 text-xs bg-white/20 px-3 py-1 rounded-full">
            + Set your nickname for a personal experience
          </button>
        )}
      </div>

      {editingNick && (
        <div className="bg-white rounded-2xl border border-pink-100 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">What should we call you?</p>
          <div className="flex gap-2">
            <input value={tempNick} onChange={e => setTempNick(e.target.value)} placeholder="Nickname (optional)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400"/>
            <button onClick={() => { setNick(tempNick); setEditingNick(false) }}
              className="px-4 py-2 rounded-xl text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>Save</button>
          </div>
        </div>
      )}

      {/* Quick cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => (
          <button key={c.tab} onClick={() => setActiveTab(c.tab)}
            className="rounded-2xl p-4 text-left hover:scale-105 active:scale-95 transition-all shadow-sm"
            style={{ background: c.color }}>
            <p className="text-2xl mb-2">{c.emoji}</p>
            <p className="font-bold text-gray-800 text-sm">{c.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{c.desc}</p>
          </button>
        ))}
      </div>

      {/* Privacy note */}
      <div className="bg-gray-50 rounded-2xl p-3 flex gap-2">
        <Shield size={16} className="text-gray-400 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-gray-500">🔒 Nova is private. All your data stays on your phone only. Nothing is uploaded or shared.</p>
      </div>

      {/* Clear data */}
      <button onClick={() => { if(window.confirm('Clear all Nova data? This cannot be undone.')) { novaStore.clearAll(); window.location.reload() } }}
        className="text-xs text-gray-300 text-center w-full">Clear all my data</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//  MAIN NOVA APP
// ─────────────────────────────────────────────────────────
export default function ChaguaAfya() {
  const navigate = useNavigate()
  const [lang, setLang] = useState('en')
  const [activeTab, setActiveTab] = useState('home')
  const [nick, setNick] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nova_user') || 'null')?.nick || '' } catch { return '' }
  })

  const saveNick = (n) => {
    setNick(n)
    try { localStorage.setItem('nova_user', JSON.stringify({ nick: n })) } catch {}
  }

  const tabs = [
    { id: 'home', label: '🏠', title: 'Home' },
    { id: 'cycle', label: '🌸', title: 'My Cycle' },
    { id: 'methods', label: '💊', title: 'Methods' },
    { id: 'selfInject', label: '💉', title: 'Self-Inject' },
    { id: 'returnDate', label: '📅', title: 'Return' },
    { id: 'ai', label: '💬', title: 'Ask Nova' },
    { id: 'clinic', label: '📍', title: 'Find Clinic' },
  ]

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab lang={lang} setActiveTab={setActiveTab} nick={nick} setNick={saveNick}/>
      case 'cycle': return <CycleTracker lang={lang} nick={nick}/>
      case 'methods': return <MethodsTab lang={lang}/>
      case 'selfInject': return <SelfInjectTab lang={lang}/>
      case 'returnDate': return <ReturnDateTab lang={lang}/>
      case 'ai': return <AskNova lang={lang} nick={nick || 'friend'}/>
      case 'clinic': return <FindClinic lang={lang}/>
      default: return <HomeTab lang={lang} setActiveTab={setActiveTab} nick={nick} setNick={saveNick}/>
    }
  }

  const currentTabTitle = tabs.find(t => t.id === activeTab)?.title || 'Nova'

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 text-white" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <div className="flex items-center px-4 py-3 gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 flex-shrink-0">
            <ArrowLeft size={16}/>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌸</span>
              <p className="font-bold text-base leading-none">Nova</p>
              <span className="text-xs opacity-70">· {currentTabTitle}</span>
            </div>
            <p className="text-xs opacity-70 leading-none mt-0.5">Your Health. Your Choice.</p>
          </div>
          <div className="flex gap-1">
            {['EN','SW'].map(l => (
              <button key={l} onClick={() => setLang(l.toLowerCase())}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${lang === l.toLowerCase() ? 'bg-white text-pink-600' : 'bg-white/20 text-white'}`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Tab bar (scrollable) */}
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === t.id ? 'bg-white text-pink-600' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              <span>{t.label}</span>
              <span className="hidden sm:inline">{t.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {renderTab()}
      </div>
    </div>
  )
}
