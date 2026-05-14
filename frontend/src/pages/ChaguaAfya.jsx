import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Calendar, ArrowLeft, Send, Phone,
         Shield, Info, RefreshCw, MapPin, Heart, Trash2,
         ChevronDown, ChevronUp, User, Lock, Eye, EyeOff } from 'lucide-react'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash'

// ── STORAGE ────────────────────────────────────────────────────────────────────
const novaStore = {
  getUser: () => { try { return JSON.parse(localStorage.getItem('nova_user') || 'null') } catch { return null } },
  saveUser: (u) => localStorage.setItem('nova_user', JSON.stringify(u)),
  getCycles: () => { try { return JSON.parse(localStorage.getItem('nova_cycles') || '[]') } catch { return [] } },
  saveCycles: (c) => localStorage.setItem('nova_cycles', JSON.stringify(c)),
  getChat: (p) => { try { return JSON.parse(localStorage.getItem('nova_chat_' + p) || '[]') } catch { return [] } },
  saveChat: (p, msgs) => localStorage.setItem('nova_chat_' + p, JSON.stringify(msgs.slice(-30))),
  clearChat: (p) => localStorage.removeItem('nova_chat_' + p),
  clearAll: () => {
    ['nova_user','nova_cycles'].forEach(k => localStorage.removeItem(k))
    Object.keys(localStorage).filter(k => k.startsWith('nova_chat_')).forEach(k => localStorage.removeItem(k))
  }
}

// ── TRANSLATIONS ───────────────────────────────────────────────────────────────
const T = {
  en: {
    appName: 'Nova', tagline: 'Your Health. Your Choice.',
    tabs: ['🏠 Home','🌸 My Cycle','💊 Methods','💉 Self-Inject','📅 My Date','💬 Ask Nova','📍 Find Clinic'],
    homeTitle: 'Welcome to Nova',
    homeSubtitle: 'Your private reproductive health companion — no login required for most features',
    homeCards: [
      { emoji:'🌸', title:'Track My Cycle', desc:'Period tracker + fertility insights', tab:'cycle' },
      { emoji:'💬', title:'Ask Nova AI', desc:'Chat with your health companion', tab:'ai' },
      { emoji:'📍', title:'Find a Clinic', desc:'Nearest FP facilities near you', tab:'clinic' },
      { emoji:'💊', title:'Learn Methods', desc:'Compare contraceptive options', tab:'methods' },
    ],
    privacy: '🔒 Nova is private. No personal data is uploaded. Your cycle data stays on your phone only.',
    loginTitle: 'Create Your Nova Profile',
    loginSub: 'A simple nickname + PIN keeps your cycle data private on this device',
    nickLabel: 'Your nickname (not your real name)',
    pinLabel: 'Create a 4-digit PIN',
    loginBtn: 'Create Profile',
    loginExisting: 'Already have a profile? Enter the same nickname + PIN to continue.',
    memoryNote: 'Nova remembers your chats to give you better answers. You can erase any conversation anytime.',
    eraseChat: 'Erase this chat',
    logout: 'Sign Out',
    deleteAll: 'Delete All My Data',
  },
  sw: {
    appName: 'Nova', tagline: 'Afya Yako. Chaguo Lako.',
    tabs: ['🏠 Nyumbani','🌸 Hedhi Yangu','💊 Njia','💉 Jisindanie','📅 Tarehe','💬 Uliza Nova','📍 Pata Kliniki'],
    homeTitle: 'Karibu Nova',
    homeSubtitle: 'Msaidizi wako wa faragha wa afya ya uzazi — hakuna kuingia kwa vipengele vingi',
    homeCards: [
      { emoji:'🌸', title:'Fuatilia Hedhi Yangu', desc:'Mfumo wa hedhi + mwanga wa uzazi', tab:'cycle' },
      { emoji:'💬', title:'Uliza Nova AI', desc:'Ongea na msaidizi wako wa afya', tab:'ai' },
      { emoji:'📍', title:'Pata Kliniki', desc:'Vituo vya karibu nawe', tab:'clinic' },
      { emoji:'💊', title:'Jifunze Njia', desc:'Linganisha njia za uzazi wa mpango', tab:'methods' },
    ],
    privacy: '🔒 Nova ni ya faragha. Hakuna taarifa zinazopakiwa. Data yako inabaki kwenye simu yako peke yake.',
    loginTitle: 'Unda Wasifu Wako wa Nova',
    loginSub: 'Jina la utani + PIN hufanya data yako ya hedhi kuwa ya faragha kwenye kifaa hiki',
    nickLabel: 'Jina lako la utani (si jina lako halisi)',
    pinLabel: 'Unda PIN ya nambari 4',
    loginBtn: 'Unda Wasifu',
    loginExisting: 'Una wasifu tayari? Ingiza jina la utani + PIN yako kuendelea.',
    memoryNote: 'Nova inakumbuka mazungumzo yako kukupa majibu bora. Unaweza kufuta wakati wowote.',
    eraseChat: 'Futa mazungumzo haya',
    logout: 'Toka',
    deleteAll: 'Futa Data Yangu Yote',
  }
}

// ── AI PERSONAS ────────────────────────────────────────────────────────────────
const PERSONAS = [
  {
    id: 'mama_afya', name: 'Mama Afya', emoji: '👩🏾‍⚕️', color: '#14a044',
    tagline: { en: 'Warm community health worker', sw: 'Mfanyakazi wa afya ya jamii' },
    prompt: (lang, nick) => `You are Mama Afya, a warm and experienced community health worker in Kenya. Speak like a caring, trusted older sister or community auntie. Address the user as ${nick}. ${lang === 'sw' ? 'Jibu kwa Kiswahili cha kawaida, kama mama anayezungumza na mtoto wake.' : 'Use warm, simple English.'} You are knowledgeable about family planning, menstrual health, and reproductive rights. Never judge. Keep responses short (under 120 words), practical, and encouraging. ONLY answer questions about reproductive health, family planning, periods, and related topics. For anything else say you specialise in health only.`
  },
  {
    id: 'sista', name: 'Sista', emoji: '💜', color: '#7c3aed',
    tagline: { en: 'Your peer — real talk, no judgment', sw: 'Rafiki yako — mazungumzo ya kweli' },
    prompt: (lang, nick) => `You are Sista, a cool relatable peer health companion for young Kenyan women aged 18-28. Address the user as ${nick}. ${lang === 'sw' ? 'Tumia Sheng na Kiswahili, kama msichana wa mtaa.' : 'Speak like a clued-up friend — casual, no jargon, real talk.'} You know about FP, periods, relationships, and self-care. NEVER shame anyone. Keep it short (under 120 words), fun, and honest. ONLY answer questions about reproductive health, family planning, and related topics. Never answer off-topic questions.`
  },
  {
    id: 'daktari', name: 'Daktari Nova', emoji: '🩺', color: '#0d7377',
    tagline: { en: 'Evidence-based and friendly', sw: 'Kitaalamu lakini rafiki' },
    prompt: (lang, nick) => `You are Daktari Nova, a friendly but evidence-based health professional assistant. Address the user as ${nick}. ${lang === 'sw' ? 'Jibu kwa Kiswahili cha kitaalamu lakini rahisi kuelewa.' : 'Speak clearly and professionally but warmly.'} You cite WHO MEC and Kenya MOH guidelines where relevant. Always recommend clinic visits for clinical decisions. Keep responses under 120 words, accurate, and non-judgmental. ONLY answer questions about reproductive health and family planning.`
  },
  {
    id: 'safe_space', name: 'Safe Space', emoji: '🌈', color: '#ec4899',
    tagline: { en: 'Inclusive, affirming, zero judgment', sw: 'Nafasi salama — hakuna hukumu' },
    prompt: (lang, nick) => `You are Safe Space, an inclusive and affirming health companion for ALL young people regardless of gender identity, sexuality, or background. Address the user as ${nick}. ${lang === 'sw' ? 'Jibu kwa Kiswahili cha upole na kujumuisha kila mtu.' : 'Speak with warmth, radical inclusivity, and zero judgment.'} Affirm everyone\'s right to reproductive health. Keep responses under 120 words. ONLY answer questions about reproductive health, family planning, and related topics. Never answer off-topic questions.`
  }
]

// ── CYCLE HELPERS ──────────────────────────────────────────────────────────────
const getPhase = (day) => {
  if (day <= 5)  return { phase:'menstrual',   emoji:'🔴', color:'#dc2626', en:'Menstrual Phase',   sw:'Awamu ya Hedhi',      fpNote:{ en:'Lowest fertility. Good time to discuss starting contraception with a provider.', sw:'Uzazi wa chini. Wakati mzuri wa kujadili kuanza uzazi wa mpango.' } }
  if (day <= 13) return { phase:'follicular',  emoji:'🌱', color:'#14a044', en:'Follicular Phase',  sw:'Awamu ya Follicular',  fpNote:{ en:'Rising energy and fertility. Implant and DMPA-SC work in all phases.', sw:'Nguvu na uzazi vinaongezeka. Kipandikizi na DMPA-SC vinafanya kazi katika awamu zote.' } }
  if (day <= 16) return { phase:'ovulation',   emoji:'⭐', color:'#f59e0b', en:'Ovulation',         sw:'Ovulation',            fpNote:{ en:'⚠️ PEAK FERTILITY — highest chance of pregnancy. Use contraception consistently every time.', sw:'⚠️ UZAZI WA JUU KABISA — uwezekano mkubwa wa ujauzito. Tumia uzazi wa mpango kila wakati.' } }
  return           { phase:'luteal',           emoji:'🌙', color:'#7c3aed', en:'Luteal Phase',      sw:'Awamu ya Luteal',      fpNote:{ en:'Post-ovulation. Fertility decreasing. PMS symptoms may appear.', sw:'Baada ya ovulation. Uzazi unashuka. Dalili za PMS zinaweza kutokea.' } }
}

const getFertility = (day) => {
  if (day >= 11 && day <= 17) return { level:'HIGH',   color:'#dc2626', pct:85 }
  if (day >= 8  && day <= 20) return { level:'MEDIUM', color:'#f59e0b', pct:40 }
  return                              { level:'LOW',    color:'#14a044', pct:5  }
}

const FAQS = {
  en: [
    { q:'What is a normal cycle length?', a:'Normal cycles range from 21 to 35 days. The 28-day cycle is just an average — most women vary. Track yours for 3 months to know your personal pattern.' },
    { q:'Why do I miss periods sometimes?', a:'Stress, illness, weight changes, travel, and hormonal contraception can cause missed or late periods. If you\'ve had unprotected sex and miss a period, take a pregnancy test.' },
    { q:'When am I most fertile?', a:'Ovulation typically happens 14 days before your next period. Sperm can survive 5 days, so your fertile window is roughly days 10-17 of a 28-day cycle.' },
    { q:'Can I get pregnant during my period?', a:'It\'s unlikely but possible — especially with short cycles. Sperm can survive up to 5 days. If you ovulate early, sex during your period could lead to pregnancy.' },
    { q:'Is it normal to have no period on DMPA-SC?', a:'Yes — very normal and completely safe. Most women stop having periods after 3-6 months on DMPA. Your blood is NOT building up inside your body. This is actually a benefit for many women.' },
    { q:'What is the best method for a breastfeeding mother?', a:'POP (progestogen-only pill), DMPA-SC, or implant are all safe from 6 weeks postpartum while breastfeeding. Avoid COC in the first 6 months. Ask your provider for the best fit.' },
  ],
  sw: [
    { q:'Urefu wa mzunguko wa kawaida ni nini?', a:'Mzunguko wa kawaida ni siku 21 hadi 35. Mzunguko wa siku 28 ni wastani tu — wanawake wengi wanatofautiana. Fuatilia wako kwa miezi 3.' },
    { q:'Kwa nini hedhi yangu inakosekana?', a:'Msongo, ugonjwa, mabadiliko ya uzito, safari, na uzazi wa mpango wa homoni vinaweza kusababisha hedhi kukosekana au kuchelewa.' },
    { q:'Ni lini mimi ni na uzazi zaidi?', a:'Ovulation kawaida hutokea siku 14 kabla ya hedhi yako ijayo. Manii inaweza kuishi siku 5, kwa hivyo dirisha lako la uzazi ni takriban siku 10-17.' },
    { q:'Ninaweza kupata ujauzito wakati wa hedhi?', a:'Ni nadra lakini inawezekana — hasa na mzunguko mfupi. Manii inaweza kuishi hadi siku 5.' },
    { q:'Je, ni kawaida kutokuwa na hedhi kwenye DMPA-SC?', a:'Ndiyo — kawaida sana na salama kabisa. Wanawake wengi huacha kupata hedhi baada ya miezi 3-6 ya DMPA. Damu HAIKUSANYIKI ndani ya mwili wako.' },
    { q:'Njia bora kwa mama anayenyonyesha ni ipi?', a:'POP, DMPA-SC, au kipandikizi ni salama kutoka wiki 6 baada ya kujifungua ukiwa unanyonyesha. Epuka COC katika miezi 6 ya kwanza.' },
  ]
}

const METHODS = [
  { id:'dmpa_sc', emoji:'💉', name:{ en:'Sayana Press (Self-injection)', sw:'Sayana Press (Kujisindania)' }, efficacy:'99%', duration:{ en:'13 weeks', sw:'Wiki 13' }, color:'#14a044',
    desc:{ en:'Give yourself the injection at home. Works 13 weeks. Most women stop periods — this is normal and safe.', sw:'Jipe sindano nyumbani. Inafanya kazi wiki 13. Wanawake wengi huacha hedhi — kawaida na salama.' },
    pros:{ en:['Private — no one needs to know','Can do at home','No daily pill','Reversible'], sw:['Faragha','Unaweza kufanya nyumbani','Hakuna kidonge cha kila siku','Inaweza kubadilishwa'] },
    cons:{ en:['Training needed first','Irregular bleeding initially'], sw:['Mafunzo yanahitajika','Kutokwa damu isiyo ya kawaida mwanzoni'] } },
  { id:'implant', emoji:'🔵', name:{ en:'Implant (Implanon/Jadelle)', sw:'Kipandikizi' }, efficacy:'99%+', duration:{ en:'3–5 years', sw:'Miaka 3–5' }, color:'#7c3aed',
    desc:{ en:'Tiny rod under arm skin. Most effective reversible method. Nothing to remember daily.', sw:'Fimbo ndogo chini ya ngozi ya mkono. Njia bora zaidi ya kubadilishwa. Hakuna cha kukumbuka kila siku.' },
    pros:{ en:['Most effective','Nothing to remember','Very private','Removable anytime'], sw:['Bora zaidi','Hakuna cha kukumbuka','Faragha sana','Inaweza kuondolewa wakati wowote'] },
    cons:{ en:['Provider needed to insert/remove','May cause irregular bleeding'], sw:['Inahitaji mtoa huduma','Inaweza kusababisha kutokwa damu isiyo ya kawaida'] } },
  { id:'coc', emoji:'💊', name:{ en:'Combined Pill (COC)', sw:'Kidonge cha Pamoja (COC)' }, efficacy:'91–99%', duration:{ en:'Daily', sw:'Kila siku' }, color:'#ec4899',
    desc:{ en:'Daily pill at same time every day. Not for breastfeeding mothers in first 6 months.', sw:'Kidonge kila siku kwa wakati mmoja. Si kwa mama anayenyonyesha miezi 6 ya kwanza.' },
    pros:{ en:['Easy to use','Lighter periods','Stop anytime'], sw:['Rahisi kutumia','Hedhi nyepesi','Simama wakati wowote'] },
    cons:{ en:['Must take every day','Not for smokers 35+'], sw:['Lazima uchukuliwe kila siku','Si kwa wavutaji sigara 35+'] } },
  { id:'condom', emoji:'🛡️', name:{ en:'Condom', sw:'Kondomu' }, efficacy:'85–98%', duration:{ en:'Single use', sw:'Matumizi moja' }, color:'#0d7377',
    desc:{ en:'ONLY method protecting against BOTH pregnancy AND HIV/STIs. Use every time.', sw:'Njia PEKEE inayolinda dhidi ya ujauzito NA VVU/STI. Tumia kila wakati.' },
    pros:{ en:['Protects against HIV/STIs','No hormones','Available everywhere'], sw:['Inalinda dhidi ya VVU/STI','Hakuna homoni','Inapatikana kila mahali'] },
    cons:{ en:['Must use every time'], sw:['Lazima itumike kila wakati'] } },
]

const MAPS_STEPS = {
  en: [
    { letter:'M', word:'Mix',         icon:'🔄', instruction:'Shake the Sayana Press device vigorously for 30 seconds until the liquid looks cloudy and milky.',            tip:'If you do not shake well, the medicine may not work properly.' },
    { letter:'A', word:'Activate',    icon:'🔘', instruction:'Firmly push the needle cap and reservoir port together until you hear or feel a click.',                      tip:'You MUST hear or feel the click. No click = not ready to inject.' },
    { letter:'P', word:'Pinch',       icon:'🤏', instruction:'Pinch a fold of skin on your lower belly (2 fingers from navel) or upper thigh. Keep pinching throughout.',  tip:'Hold the pinch firmly for the entire injection.' },
    { letter:'S', word:'Self-inject', icon:'💉', instruction:'Insert needle at 45° angle into pinched skin. Slowly squeeze reservoir until completely empty (~5 seconds).', tip:'Remove needle while still pinching. Press gently — do NOT rub the site.' },
  ],
  sw: [
    { letter:'M', word:'Changanya',   icon:'🔄', instruction:'Tikisa kifaa kwa nguvu kwa sekunde 30 hadi dawa ionekane na ukungu kama maziwa.',                              tip:'Usitikise vizuri, dawa inaweza kutofanya kazi.' },
    { letter:'A', word:'Washa',       icon:'🔘', instruction:'Bonyeza kofia ya sindano na bandari pamoja kwa nguvu hadi usikie au uhisi kubonyeza.',                          tip:'LAZIMA usikie kubonyeza. Hakuna click = haiko tayari.' },
    { letter:'P', word:'Piga Pinch',  icon:'🤏', instruction:'Piga ngozi kwenye tumbo la chini (vidole 2 kutoka kitovuni) au mapaja ya juu. Endelea kushikilia.',              tip:'Shika pinch kwa nguvu wakati wote wa sindano.' },
    { letter:'S', word:'Jisindanie',  icon:'💉', instruction:'Ingiza sindano kwa pembe ya 45°. Bonyeza polepole hadi tupu (sekunde ~5).',                                      tip:'Toa sindano ukishikilia ngozi. Bonyeza kidogo — USISUGUE.' },
  ]
}

// ── NOVA LOGIN ─────────────────────────────────────────────────────────────────
function NovaLogin({ lang, onLogin }) {
  const t = T[lang]
  const [nick, setNick] = useState('')
  const [pin, setPin]   = useState('')
  const [show, setShow] = useState(false)
  const [err,  setErr]  = useState('')
  const existing = novaStore.getUser()

  const submit = () => {
    if (nick.trim().length < 2) { setErr(lang==='sw' ? 'Ingiza jina la utani' : 'Enter a nickname (min 2 chars)'); return }
    if (pin.length < 4)         { setErr(lang==='sw' ? 'PIN lazima iwe nambari 4' : 'PIN must be 4 digits'); return }
    if (existing) {
      if (existing.nickname.toLowerCase() !== nick.toLowerCase() || existing.pin !== pin) {
        setErr(lang==='sw' ? 'Jina au PIN si sahihi' : 'Nickname or PIN incorrect'); return
      }
      onLogin(existing)
    } else {
      const u = { nickname: nick.trim(), pin, createdAt: new Date().toISOString() }
      novaStore.saveUser(u); onLogin(u)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌸</div>
          <h1 className="text-3xl font-bold text-white">Nova</h1>
          <p className="text-pink-100 text-sm mt-1">{t.tagline}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="font-bold text-gray-800 text-lg mb-1">{t.loginTitle}</h2>
          <p className="text-gray-500 text-xs mb-4">{t.loginSub}</p>
          {existing && <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 mb-4"><p className="text-xs text-pink-700">{t.loginExisting}</p></div>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t.nickLabel}</label>
              <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder={lang==='sw' ? 'Mfano: Zawadi' : 'e.g. Aisha, Wanjiru'}
                value={nick} onChange={e => { setNick(e.target.value); setErr('') }}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t.pinLabel}</label>
              <div className="relative">
                <input className="w-full border border-gray-300 rounded-xl px-3 pr-10 py-2.5 text-sm tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
                  type={show ? 'text' : 'password'} inputMode="numeric" maxLength={4}
                  placeholder="••••" value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g,'').slice(0,4)); setErr('') }}
                  onKeyDown={e => e.key==='Enter' && submit()}/>
                <button onClick={() => setShow(!show)} className="absolute right-3 top-3 text-gray-400">
                  {show ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>
            {err && <p className="text-xs text-red-600">{err}</p>}
            <button onClick={submit} disabled={!nick.trim() || pin.length < 4}
              className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition-colors"
              style={{background: nick && pin.length===4 ? 'linear-gradient(135deg,#ec4899,#f59e0b)' : undefined}}>
              {t.loginBtn}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            {lang==='sw' ? '🔒 Data yako inabaki kwenye simu yako peke yake.' : '🔒 Your data stays on your device only. Nova never uploads personal data.'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── CYCLE TRACKER ──────────────────────────────────────────────────────────────
function CycleTracker({ lang, user }) {
  const [cycles, setCycles] = useState(novaStore.getCycles())
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [symptoms,  setSymptoms]  = useState([])
  const [section,   setSection]   = useState('log')
  const [openFaq,   setOpenFaq]   = useState(null)

  const save = () => {
    if (!startDate) return
    const updated = [{ id:Date.now(), start:startDate, end:endDate, symptoms }, ...cycles].slice(0,24)
    setCycles(updated); novaStore.saveCycles(updated)
    setStartDate(''); setEndDate(''); setSymptoms([])
  }

  const last = cycles[0]
  const day  = last ? Math.max(1, Math.ceil((new Date() - new Date(last.start))/(1000*60*60*24))) : null
  const phase     = day ? getPhase(day)      : null
  const fertility = day ? getFertility(day)  : null

  const symptomList = lang==='sw'
    ? ['Maumivu','Uchovu','Kukasiriana','Uvimbe','Kutokwa damu nyingi','Kutokwa damu kidogo','Hisia nzuri']
    : ['Cramps','Fatigue','Mood swings','Bloating','Heavy flow','Light flow','Feeling good']

  return (
    <div className="space-y-4">
      {phase && day && (
        <div className="rounded-2xl p-5 text-white shadow-lg" style={{background:`linear-gradient(135deg,${phase.color},${phase.color}aa)`}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 font-medium">{lang==='sw' ? 'Awamu ya Sasa' : 'Current Phase'}</p>
              <p className="text-2xl font-bold mt-1">{phase.emoji} {phase[lang]}</p>
              <p className="text-sm opacity-90 mt-0.5">{lang==='sw' ? `Siku ${day} ya mzunguko` : `Day ${day} of your cycle`}</p>
            </div>
            <div className="text-center bg-white/20 rounded-2xl px-4 py-3">
              <p className="text-3xl font-black">{fertility.pct}%</p>
              <p className="text-xs opacity-80 leading-tight">{lang==='sw' ? 'Uwezekano\nwa ujauzito' : 'Pregnancy\nchance'}</p>
              <span className="text-xs font-bold bg-white/30 px-2 py-0.5 rounded-full mt-1 inline-block">{fertility.level}</span>
            </div>
          </div>
          <div className="mt-3 bg-white/15 rounded-xl p-3">
            <p className="text-xs leading-relaxed">{phase.fpNote[lang]}</p>
          </div>
        </div>
      )}

      {/* Section switcher */}
      <div className="flex gap-2">
        {[
          { key:'log',     label: lang==='sw' ? '📝 Rekodi'  : '📝 Log'     },
          { key:'history', label: lang==='sw' ? '📊 Historia': '📊 History' },
          { key:'faqs',    label: 'FAQ' },
        ].map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${section===s.key ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            style={section===s.key ? {background:'linear-gradient(135deg,#ec4899,#f59e0b)'} : {}}>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'log' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-gray-800">{lang==='sw' ? '📝 Rekodi Hedhi Yako' : '📝 Log Your Period'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{lang==='sw' ? 'Ilianza:' : 'Started:'}</label>
              <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                value={startDate} onChange={e => setStartDate(e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{lang==='sw' ? 'Iliisha:' : 'Ended:'}</label>
              <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                value={endDate} onChange={e => setEndDate(e.target.value)}/>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">{lang==='sw' ? 'Dalili:' : 'Symptoms (tap all that apply):'}</p>
            <div className="flex flex-wrap gap-2">
              {symptomList.map(s => (
                <button key={s}
                  onClick={() => setSymptoms(p => p.includes(s) ? p.filter(x => x!==s) : [...p,s])}
                  className={`text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${symptoms.includes(s) ? 'text-white border-pink-400' : 'border-gray-200 text-gray-600'}`}
                  style={symptoms.includes(s) ? {background:'#ec4899'} : {}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button onClick={save} disabled={!startDate}
            className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300"
            style={{background: startDate ? 'linear-gradient(135deg,#ec4899,#f59e0b)' : undefined}}>
            {lang==='sw' ? '💾 Hifadhi Rekodi' : '💾 Save Record'}
          </button>
        </div>
      )}

      {section === 'history' && (
        <div className="space-y-3">
          {cycles.length === 0
            ? <div className="text-center py-10 text-gray-400"><Heart size={32} className="mx-auto mb-2 opacity-30"/><p className="text-sm">{lang==='sw' ? 'Bado hakuna rekodi.' : 'No records yet. Start tracking!'}</p></div>
            : cycles.map(c => {
                const dur = c.end ? Math.ceil((new Date(c.end)-new Date(c.start))/(1000*60*60*24)) : null
                return (
                  <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{new Date(c.start).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}</p>
                      {dur && <p className="text-xs text-gray-500">{lang==='sw' ? `Siku ${dur}` : `${dur} days`}</p>}
                    </div>
                    {c.symptoms?.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {c.symptoms.slice(0,3).map(s => <span key={s} className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{s}</span>)}
                      </div>
                    )}
                  </div>
                )
              })
          }
        </div>
      )}

      {section === 'faqs' && (
        <div className="space-y-2">
          {FAQS[lang].map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpenFaq(openFaq===i ? null : i)}>
                <p className="text-sm font-medium text-gray-700 pr-2">{faq.q}</p>
                {openFaq===i ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0"/> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0"/>}
              </button>
              {openFaq===i && <div className="px-4 pb-4"><p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── AI WITH PERSONAS ───────────────────────────────────────────────────────────
function AskNova({ lang, user }) {
  const t = T[lang]
  const [persona,  setPersona]  = useState(null)
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (persona) setMessages(novaStore.getChat(persona.id))
  }, [persona])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, loading])

  const send = async (text) => {
    const msg = text || input
    if (!msg.trim() || loading || !persona) return
    setInput('')
    const next = [...messages, { role:'user', content:msg }]
    setMessages(next); novaStore.saveChat(persona.id, next)
    setLoading(true)
    try {
      if (!GEMINI_KEY) throw new Error('no-key')
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            system_instruction: { parts: [{ text: persona.prompt(lang, user.nickname) }] },
            contents: next.map(m => ({ role: m.role==='user'?'user':'model', parts:[{text:m.content}] })),
            generation_config: { temperature:0.7, max_output_tokens:250 }
          })
        }
      )
      if (res.status===429) throw new Error('429')
      const data = await res.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!reply) throw new Error('empty')
      const final = [...next, { role:'assistant', content:reply }]
      setMessages(final); novaStore.saveChat(persona.id, final)
    } catch(e) {
      const r = e.message==='429'
        ? (lang==='sw' ? '⏳ Subiri sekunde 30 kisha jaribu tena.' : '⏳ Too many requests. Wait 30 seconds.')
        : e.message==='no-key'
          ? (lang==='sw' ? 'ℹ️ AI haipo. Wasiliana na kliniki yako.' : 'ℹ️ AI offline. Please contact your nearest clinic.')
          : (lang==='sw' ? '⚠️ Hitilafu. Jaribu tena.' : '⚠️ Error. Please try again.')
      const final = [...next, { role:'assistant', content:r }]
      setMessages(final); novaStore.saveChat(persona.id, final)
    } finally { setLoading(false) }
  }

  const clearMemory = () => {
    if (!window.confirm(lang==='sw' ? 'Futa historia ya mazungumzo haya?' : 'Clear this chat history?')) return
    novaStore.clearChat(persona.id); setMessages([])
  }

  if (!persona) return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-gray-800 text-lg">{t.aiTitle}</h2>
        <p className="text-sm text-gray-500">{lang==='sw' ? 'Chagua msaidizi wako:' : 'Choose your Nova companion:'}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PERSONAS.map(p => (
          <button key={p.id} onClick={() => setPersona(p)}
            className="bg-white rounded-2xl border-2 p-4 text-left hover:shadow-md transition-all hover:-translate-y-0.5"
            style={{borderColor: p.color + '40'}}>
            <div className="text-3xl mb-2">{p.emoji}</div>
            <p className="font-bold text-gray-800 text-sm">{p.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{p.tagline[lang]}</p>
            {novaStore.getChat(p.id).length > 0 && (
              <p className="text-xs mt-2 font-medium" style={{color:p.color}}>
                {lang==='sw' ? '💬 Mazungumzo yaliyohifadhiwa' : '💬 Saved conversation'}
              </p>
            )}
          </button>
        ))}
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
        <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-blue-700">{t.memoryNote}</p>
      </div>
    </div>
  )

  const starters = lang==='sw'
    ? ['Ninajua nini kuhusu awamu za mzunguko wangu?','Je, DMPA-SC ni salama kwangu?','Nina maswali kuhusu uzazi wa mpango']
    : ['What should I know about my cycle phases?','Is DMPA-SC safe for me?','I have questions about family planning']

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setPersona(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14}/> {lang==='sw' ? 'Badilisha' : 'Change'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{persona.emoji}</span>
          <span className="font-bold text-gray-700 text-sm">{persona.name}</span>
        </div>
        <button onClick={clearMemory} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
          <Trash2 size={12}/> {t.eraseChat}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-gray-500 text-center mb-3">
                {lang==='sw' ? `${user.nickname}, uliza ${persona.name}:` : `${user.nickname}, ask ${persona.name}:`}
              </p>
              {starters.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 hover:bg-pink-50 hover:border-pink-300 transition-colors flex items-center justify-between gap-2">
                  <span>{q}</span><ChevronRight size={12} className="text-gray-400 flex-shrink-0"/>
                </button>
              ))}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                <p className="text-xs text-amber-700">{t.memoryNote}</p>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role==='user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
                style={{background: m.role==='user' ? '#374151' : persona.color}}>
                {m.role==='user' ? user.nickname[0]?.toUpperCase() : persona.emoji}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${m.role==='user' ? 'text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'}`}
                style={m.role==='user' ? {background:'#374151'} : {}}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{background:persona.color}}>
                {persona.emoji}
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-gray-300" style={{animation:`bounce 1s infinite ${i*0.2}s`}}/>)}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>
        <div className="p-3 border-t border-gray-100 flex gap-2 bg-white">
          <button onClick={() => { setMessages([]); novaStore.clearChat(persona.id) }} className="text-gray-400 hover:text-pink-600 flex-shrink-0">
            <RefreshCw size={14}/>
          </button>
          <input className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            placeholder={lang==='sw' ? 'Andika swali lako...' : 'Type your question...'}
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && send()}/>
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${input.trim() ? '' : 'bg-gray-300'}`}
            style={input.trim() ? {background:persona.color} : {}}>
            <Send size={14}/>
          </button>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
    </div>
  )
}

// ── CLINIC FINDER ──────────────────────────────────────────────────────────────
function ClinicFinder({ lang }) {
  const t = T[lang]
  const [status,   setStatus]   = useState('idle')
  const [clinics,  setClinics]  = useState([])
  const [coords,   setCoords]   = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const findClinics = () => {
    if (!navigator.geolocation) { setErrorMsg(lang==='sw' ? 'Kivinjari chako hakisaidii GPS.' : 'Your browser does not support location.'); setStatus('error'); return }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ latitude, longitude })
        setStatus('searching')
        await search(latitude, longitude)
      },
      () => { setErrorMsg(lang==='sw' ? 'Hukuruhusu ufikiaji wa eneo. Tafadhali ruhusu katika mipangilio ya kivinjari.' : 'Location access denied. Please allow location access in your browser settings and try again.'); setStatus('error') },
      { timeout:10000, maximumAge:60000 }
    )
  }

  const search = async (lat, lng) => {
    if (!GEMINI_KEY) { setErrorMsg(lang==='sw' ? 'Huduma ya AI haipo sasa hivi.' : 'AI service unavailable. Please call 0800 723 253 for referrals.'); setStatus('error'); return }
    try {
      const prompt = `I need to find the 3 nearest family planning clinics or health facilities to latitude ${lat.toFixed(4)}, longitude ${lng.toFixed(4)} in Kenya. Use Google Search to find real facilities near these coordinates. Return ONLY a valid JSON array with no markdown formatting, like this:
[{"name":"Facility Name","type":"Hospital or Health Centre or Clinic","distance":"approx X km","address":"Area, Sub-county, County","services":"Family planning, MCH, etc","phone":"number or null"}]
Focus on government health facilities that offer family planning services. Return exactly 3 results.`

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            contents:[{ role:'user', parts:[{ text:prompt }] }],
            tools:[{ google_search:{} }],
            generation_config:{ temperature:0.1, max_output_tokens:600 }
          })
        }
      )
      if (res.status===429) throw new Error('429')
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || ''
      const clean = text.replace(/```json|```/g,'').trim()
      const parsed = JSON.parse(clean)
      if (!Array.isArray(parsed)) throw new Error('bad-format')
      setClinics(parsed); setStatus('done')
    } catch(e) {
      if (e.message==='429') setErrorMsg(lang==='sw' ? '⏳ Subiri sekunde 30 kisha jaribu tena.' : '⏳ Rate limit. Wait 30 seconds and try again.')
      else setErrorMsg(lang==='sw' ? 'Imeshindwa kupata matokeo. Jaribu tena au piga simu 0800 723 253.' : 'Could not get results. Try again or call 0800 723 253.')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-gray-800 text-lg">{t.clinicTitle}</h2>
        <p className="text-sm text-gray-500">{lang==='sw' ? 'Tunapata vituo 3 vya karibu nawe.' : 'We\'ll find the 3 nearest health facilities to you.'}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <Info size={14} className="text-amber-500 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-amber-700">{lang==='sw'
          ? '⚠️ Tangazo: Matokeo yanategemea data zilizopo na huenda yasiwe sahihi kila wakati. Piga simu kwanza kuthibitisha huduma.'
          : '⚠️ Disclaimer: Results are based on available data and may not always be accurate. Always call ahead to confirm services are available.'}</p>
      </div>

      {status==='idle' && (
        <button onClick={findClinics}
          className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-0.5"
          style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
          <MapPin size={18}/> {lang==='sw' ? 'Pata Kliniki za Karibu' : 'Find Nearest Clinics'}
        </button>
      )}

      {(status==='locating' || status==='searching') && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-pink-500"/>
          <p className="text-sm text-gray-600">
            {status==='locating'
              ? (lang==='sw' ? '📍 Inapata eneo lako...' : '📍 Getting your location...')
              : (lang==='sw' ? '🔍 Inatafuta vituo vya karibu...' : '🔍 Searching for nearby facilities...')}
          </p>
          {coords && <p className="text-xs text-gray-400 mt-1">{coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</p>}
        </div>
      )}

      {status==='error' && (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
          <button onClick={() => setStatus('idle')}
            className="w-full text-white font-bold py-3 rounded-xl"
            style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
            {lang==='sw' ? 'Jaribu Tena' : 'Try Again'}
          </button>
        </div>
      )}

      {status==='done' && clinics.length > 0 && (
        <div className="space-y-3">
          {clinics.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-pink-600"/>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.type} · {c.distance}</p>
                <p className="text-xs text-gray-400">{c.address}</p>
                {c.services && <p className="text-xs text-teal-600 mt-1">✅ {c.services}</p>}
                {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-pink-600 mt-1 hover:underline"><Phone size={10}/> {c.phone}</a>}
              </div>
              <span className="text-lg font-black text-pink-300">#{i+1}</span>
            </div>
          ))}
          <button onClick={() => { setStatus('idle'); setClinics([]) }}
            className="w-full text-pink-600 border border-pink-300 font-bold py-2.5 rounded-xl text-sm hover:bg-pink-50">
            {lang==='sw' ? '🔄 Tafuta Tena' : '🔄 Search Again'}
          </button>
        </div>
      )}

      <a href="tel:0800723253"
        className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
          <Phone size={18} className="text-teal-600"/>
        </div>
        <div>
          <p className="font-bold text-gray-800 text-sm">{lang==='sw' ? 'Simu ya Afya — Bila Malipo' : 'Kenya Health Line — Free'}</p>
          <p className="text-xl font-black text-teal-600">0800 723 253</p>
        </div>
      </a>
    </div>
  )
}

// ── DATE CALCULATOR ────────────────────────────────────────────────────────────
function DateCalc({ lang }) {
  const [lastDate, setLastDate] = useState('')
  const [result,   setResult]   = useState(null)
  const calc = () => {
    if (!lastDate) return
    const d = new Date(lastDate)
    setResult({ next: new Date(d.getTime()+91*24*60*60*1000), grace: new Date(d.getTime()+119*24*60*60*1000) })
  }
  const fmt = (d) => d.toLocaleDateString('en-KE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <label className="block text-sm text-gray-600 mb-2 font-medium">{lang==='sw' ? 'Tarehe ya sindano ya mwisho:' : 'Date of last injection:'}</label>
        <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
          value={lastDate} onChange={e => { setLastDate(e.target.value); setResult(null) }}/>
        <button onClick={calc} disabled={!lastDate} className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300"
          style={{background: lastDate ? 'linear-gradient(135deg,#ec4899,#f59e0b)' : undefined}}>
          {lang==='sw' ? 'Hesabu' : 'Calculate'}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          <div className="bg-teal-50 border border-teal-300 rounded-2xl p-5">
            <p className="text-xs text-teal-600 font-bold uppercase tracking-wide mb-1">{lang==='sw' ? 'Sindano ijayo:' : 'Next injection due:'}</p>
            <p className="text-xl font-bold text-teal-700">{fmt(result.next)}</p>
          </div>
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wide mb-1">{lang==='sw' ? 'Muda wa neema unaisha:' : 'Grace period ends:'}</p>
            <p className="text-base font-bold text-amber-700">{fmt(result.grace)}</p>
            <p className="text-xs text-amber-600 mt-2">⚠️ {lang==='sw' ? 'Baada ya tarehe hii, ona mtoa huduma kabla ya kusindania.' : 'After this date, see a provider before injecting.'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── METHOD MODAL ───────────────────────────────────────────────────────────────
function MethodModal({ method, lang, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{method.emoji}</span>
            <div>
              <p className="font-bold text-gray-800">{method.name[lang]}</p>
              <p className="text-xs text-gray-400">{method.efficacy} · {method.duration[lang]}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{method.desc[lang]}</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-bold text-green-700 text-sm mb-2">✅ {lang==='sw' ? 'Faida' : 'Benefits'}</p>
            {method.pros[lang].map((p,i) => <p key={i} className="text-sm text-green-700 mb-1">• {p}</p>)}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-bold text-amber-700 text-sm mb-2">⚠️ {lang==='sw' ? 'Kumbuka' : 'Things to Know'}</p>
            {method.cons[lang].map((c,i) => <p key={i} className="text-sm text-amber-700 mb-1">• {c}</p>)}
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
            <p className="text-sm text-teal-700">🏥 {lang==='sw' ? 'Ongea na mtoa huduma kupata njia inayofaa kwako.' : 'Talk to a health provider to find the right method for you.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function ChaguaAfya() {
  const navigate = useNavigate()
  const [lang,           setLang]           = useState('en')
  const [activeTab,      setActiveTab]      = useState('home')
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [user,           setUser]           = useState(novaStore.getUser())
  const [showLogin,      setShowLogin]      = useState(false)
  const t = T[lang]

  const PROTECTED = ['cycle','ai']

  const goTab = (tab) => {
    if (PROTECTED.includes(tab) && !user) { setShowLogin(true); return }
    setActiveTab(tab); setShowLogin(false)
  }

  const onLogin  = (u) => { setUser(u); setShowLogin(false); setActiveTab('cycle') }
  const onLogout = ()  => { setUser(null); setActiveTab('home') }
  const onDeleteAll = () => {
    if (!window.confirm(lang==='sw' ? 'Futa data yote ya Nova?' : 'Delete ALL Nova data? This cannot be undone.')) return
    novaStore.clearAll(); setUser(null); setActiveTab('home')
  }

  if (showLogin && !user) return <NovaLogin lang={lang} onLogin={onLogin}/>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 text-white shadow-lg" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20" aria-label="Back">
              <ArrowLeft size={18}/>
            </button>
            <div>
              <p className="font-bold text-base leading-tight">🌸 Nova</p>
              <p className="text-xs opacity-80 leading-tight">{t.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-1 bg-white/20 rounded-xl px-2 py-1">
                <User size={12}/><span className="text-xs font-bold">{user.nickname}</span>
              </div>
            )}
            <div className="flex bg-white/20 rounded-xl overflow-hidden">
              {['en','sw'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${lang===l ? 'bg-white text-pink-600' : 'text-white'}`}
                  aria-pressed={lang===l}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto bg-white border-b border-gray-200 shadow-sm">
        <div className="flex max-w-lg mx-auto px-2 py-2 gap-1 min-w-max">
          {['home','cycle','methods','inject','date','ai','clinic'].map((key,i) => (
            <button key={key} onClick={() => goTab(key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors
                ${activeTab===key ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              style={activeTab===key ? {background:'linear-gradient(135deg,#ec4899,#f59e0b)'} : {}}
              aria-selected={activeTab===key}>
              {t.tabs[i]}{PROTECTED.includes(key) && !user ? ' 🔒' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-10">

        {/* HOME */}
        {activeTab==='home' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5 text-white shadow-lg" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
              <h1 className="text-xl font-bold">{t.homeTitle}</h1>
              <p className="text-sm mt-1 opacity-90">{t.homeSubtitle}</p>
              {user && <p className="text-sm mt-2 font-semibold">👋 {lang==='sw' ? `Karibu tena, ${user.nickname}!` : `Welcome back, ${user.nickname}!`}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {t.homeCards.map((card,i) => (
                <button key={i} onClick={() => goTab(card.tab)}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-left hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="text-3xl mb-2">{card.emoji}</div>
                  <p className="font-bold text-gray-800 text-sm">{card.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
                  {PROTECTED.includes(card.tab) && !user && <p className="text-xs text-pink-400 mt-1">🔒 {lang==='sw' ? 'Ingia kwanza' : 'Sign in first'}</p>}
                </button>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <Shield size={14} className="text-blue-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-blue-700">{t.privacy}</p>
            </div>
            {user && (
              <div className="flex gap-2">
                <button onClick={onLogout} className="flex-1 flex items-center justify-center gap-1 border border-gray-300 text-gray-500 text-xs py-2 rounded-xl hover:bg-gray-50">
                  <Lock size={12}/> {t.logout}
                </button>
                <button onClick={onDeleteAll} className="flex-1 flex items-center justify-center gap-1 border border-red-200 text-red-400 text-xs py-2 rounded-xl hover:bg-red-50">
                  <Trash2 size={12}/> {t.deleteAll}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab==='cycle'   && user     && <CycleTracker lang={lang} user={user}/>}
        {activeTab==='ai'      && user     && <AskNova      lang={lang} user={user}/>}
        {activeTab==='clinic'             && <ClinicFinder lang={lang}/>}
        {activeTab==='date'               && <DateCalc     lang={lang}/>}
        {activeTab==='inject'             && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">{lang==='sw' ? 'Kujisindania Sayana Press' : 'Sayana Press Self-Injection'}</h2>
            {MAPS_STEPS[lang].map((step,i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
                    style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
                    {step.letter}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{step.word}</p>
                    <p className="text-xs text-gray-400">{lang==='sw' ? `Hatua ${i+1} ya 4` : `Step ${i+1} of 4`}</p>
                  </div>
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{step.instruction}</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-700">💡 {step.tip}</p>
                </div>
              </div>
            ))}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="font-bold text-red-700 text-sm mb-2">🚨 {lang==='sw' ? 'Nenda kliniki MARA MOJA ukiona:' : 'Go to clinic IMMEDIATELY if you notice:'}</p>
              {(lang==='sw'
                ? ['Maumivu makali ya kichwa na mabadiliko ya maono','Uvimbe, usaha mahali pa sindano','Maumivu makali ya tumbo']
                : ['Severe headache with vision changes','Swelling or pus at injection site','Severe abdominal pain']
              ).map((s,i) => <p key={i} className="text-sm text-red-600 mb-1">• {s}</p>)}
            </div>
          </div>
        )}
        {activeTab==='methods' && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-800 text-lg">{lang==='sw' ? 'Njia za Uzazi wa Mpango' : 'Contraceptive Methods'}</h2>
            {METHODS.map(m => (
              <button key={m.id} onClick={() => setSelectedMethod(m)}
                className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-left hover:shadow-md transition-all flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:m.color+'20'}}>{m.emoji}</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{m.name[lang]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.efficacy} · {m.duration[lang]}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400"/>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMethod && <MethodModal method={selectedMethod} lang={lang} onClose={() => setSelectedMethod(null)}/>}
    </div>
  )
}
