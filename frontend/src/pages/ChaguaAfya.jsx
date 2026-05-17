import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ArrowLeft, Send, Phone, Shield, Info,
  RefreshCw, MapPin, Heart, Trash2, ChevronDown, ChevronUp,
  User, Lock, Eye, EyeOff, LogOut, Share2, Copy, Check,
  UserPlus, X, Calendar, Users, Link, AlertTriangle,
  Grid, Fingerprint
} from 'lucide-react'
import NovaCycleTracker from './nova/NovaCycleTracker'

const GEMINI_KEY   = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash'

// ── STORAGE ────────────────────────────────────────────────────────────────────
const K = {
  user:         'nova_user',
  cycles:       'nova_cycles',
  chatPrefix:   'nova_chat_',
  quickUnlock:  'nova_quick_unlock',
  partnerShare: 'nova_partner_share',
}

const store = {
  get:  (k, fb=null) => { try { const v=localStorage.getItem(k); return v!==null?JSON.parse(v):fb } catch { return fb } },
  set:  (k, v)  => localStorage.setItem(k, JSON.stringify(v)),
  del:  (k)     => localStorage.removeItem(k),
  clearAll: () => {
    ;[K.user, K.cycles, K.quickUnlock, K.partnerShare, 'nova_viewing_partner'].forEach(k=>localStorage.removeItem(k))
    Object.keys(localStorage).filter(k=>k.startsWith(K.chatPrefix)).forEach(k=>localStorage.removeItem(k))
  }
}

// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    appName:'Nova', tagline:'Your Health. Your Choice.',
    tabs:['🏠 Home','🌸 My Cycle','💊 Methods','💉 Self-Inject','📅 My Date','💬 Ask Nova','📍 Find Clinic'],
    homeTitle:'Welcome to Nova',
    homeSubtitle:'Private reproductive health — most features need no login',
    homeCards:[
      { emoji:'🌸', title:'Track My Cycle',  desc:'Period tracker + fertility insights', tab:'cycle'   },
      { emoji:'💬', title:'Ask Nova AI',      desc:'Chat with your health companion',     tab:'ai'      },
      { emoji:'📍', title:'Find a Clinic',    desc:'Nearest FP facilities near you',      tab:'clinic'  },
      { emoji:'💊', title:'Learn Methods',    desc:'Compare contraceptive options',        tab:'methods' },
    ],
    privacy:'🔒 Nova is private. Your cycle data stays on your phone only.',
    loginTitle:'Create Your Nova Profile',
    loginSub:'A nickname + PIN keeps your cycle data private on this device',
    nickLabel:'Your nickname (not your real name)',
    pinLabel:'4-digit PIN',
    loginBtn:'Create Profile',
    loginExisting:'Already have a profile? Enter your nickname + PIN.',
    memoryNote:'Nova remembers your chats to give better answers. Erase anytime.',
    eraseChat:'Erase chat',
    logout:'Sign Out',
    deleteAll:'Delete All My Data',
    guestBrowse:'Browse as Guest',
    unlockTitle:'Quick Unlock',
    partnerShareLabel:'Share My Calendar',
    partnerShareDesc:'Let your partner view your cycle calendar',
    shareCode:'Your share code',
    partnerActive:'Partner access active',
    viewingPartner:'Viewing Partner Calendar',
    stopViewing:'Stop Viewing',
    revokeAccess:'Revoke Access',
  },
  sw: {
    appName:'Nova', tagline:'Afya Yako. Chaguo Lako.',
    tabs:['🏠 Nyumbani','🌸 Hedhi Yangu','💊 Njia','💉 Jisindanie','📅 Tarehe','💬 Uliza Nova','📍 Pata Kliniki'],
    homeTitle:'Karibu Nova',
    homeSubtitle:'Afya ya uzazi ya faragha — vipengele vingi havihitaji kuingia',
    homeCards:[
      { emoji:'🌸', title:'Fuatilia Hedhi',  desc:'Mfumo wa hedhi + mwanga wa uzazi',    tab:'cycle'   },
      { emoji:'💬', title:'Uliza Nova AI',    desc:'Ongea na msaidizi wa afya',            tab:'ai'      },
      { emoji:'📍', title:'Pata Kliniki',     desc:'Vituo vya karibu nawe',                tab:'clinic'  },
      { emoji:'💊', title:'Jifunze Njia',     desc:'Linganisha njia za uzazi wa mpango',   tab:'methods' },
    ],
    privacy:'🔒 Nova ni ya faragha. Data yako inabaki kwenye simu yako peke yake.',
    loginTitle:'Unda Wasifu Wako wa Nova',
    loginSub:'Jina la utani + PIN hufanya data yako kuwa ya faragha',
    nickLabel:'Jina lako la utani (si jina lako halisi)',
    pinLabel:'PIN ya nambari 4',
    loginBtn:'Unda Wasifu',
    loginExisting:'Una wasifu tayari? Ingiza jina la utani + PIN yako.',
    memoryNote:'Nova inakumbuka mazungumzo kukupa majibu bora. Futa wakati wowote.',
    eraseChat:'Futa mazungumzo',
    logout:'Toka',
    deleteAll:'Futa Data Yangu Yote',
    guestBrowse:'Tembelea kama Mgeni',
    unlockTitle:'Fungua Haraka',
    partnerShareLabel:'Shiriki Kalenda Yangu',
    partnerShareDesc:'Mruhusu mpenzi wako kuona kalenda yako ya hedhi',
    shareCode:'Nambari yako ya kushiriki',
    partnerActive:'Ufikiaji wa mpenzi unaendelea',
    viewingPartner:'Unaona Kalenda ya Mpenzi',
    stopViewing:'Acha Kuona',
    revokeAccess:'Vua Ruhusa',
  }
}

// ── AI PERSONAS ───────────────────────────────────────────────────────────────
const PERSONAS = [
  {
    id:'mama_afya', name:'Mama Afya', emoji:'👩🏾‍⚕️', color:'#14a044',
    tagline:{ en:'Warm community health worker', sw:'Mfanyakazi wa afya ya jamii' },
    prompt:(lang,nick)=>`You are Mama Afya, a warm experienced community health worker in Kenya. Speak like a trusted caring older sister or auntie. Address user as ${nick}. ${lang==='sw'?'Jibu kwa Kiswahili cha kawaida.':'Use warm simple English.'} ONLY answer reproductive health, family planning, menstrual health. Under 120 words. Never judge. Encourage clinic visits for serious concerns.`
  },
  {
    id:'sista', name:'Sista', emoji:'💜', color:'#7c3aed',
    tagline:{ en:'Your peer — real talk, no judgment', sw:'Rafiki yako — mazungumzo ya kweli' },
    prompt:(lang,nick)=>`You are Sista, a cool relatable peer health companion for young Kenyan women 18-28. Address user as ${nick}. ${lang==='sw'?'Tumia Sheng na Kiswahili.':'Speak like a clued-up friend — casual, real talk.'} ONLY answer FP, periods, relationships (SRH context). Under 120 words. NEVER shame anyone.`
  },
  {
    id:'daktari', name:'Daktari Nova', emoji:'🩺', color:'#0d7377',
    tagline:{ en:'Evidence-based and friendly', sw:'Kitaalamu lakini rafiki' },
    prompt:(lang,nick)=>`You are Daktari Nova, a friendly evidence-based health assistant. Address user as ${nick}. ${lang==='sw'?'Jibu kwa Kiswahili cha kitaalamu lakini rahisi.':'Speak clearly and professionally but warmly.'} Cite WHO MEC and Kenya MOH guidelines. ONLY FP and reproductive health. Under 120 words.`
  },
  {
    id:'safe_space', name:'Safe Space', emoji:'🌈', color:'#ec4899',
    tagline:{ en:'Inclusive, affirming, zero judgment', sw:'Nafasi salama — hakuna hukumu' },
    prompt:(lang,nick)=>`You are Safe Space, an inclusive affirming health companion for ALL people regardless of gender, sexuality, or background. Address user as ${nick}. ${lang==='sw'?'Jibu kwa Kiswahili cha upole na kujumuisha kila mtu.':'Speak with warmth and radical inclusivity.'} ONLY FP and reproductive health. Under 120 words. Never judge.`
  }
]

// ── METHODS DATA ──────────────────────────────────────────────────────────────
const METHODS = [
  { id:'dmpa_sc', emoji:'💉', name:{ en:'Sayana Press (Self-injection)', sw:'Sayana Press (Kujisindania)' }, efficacy:'99%', duration:{ en:'13 weeks', sw:'Wiki 13' }, color:'#14a044',
    desc:{ en:'Give yourself the injection at home every 13 weeks. Most women stop periods — normal and safe.', sw:'Jipe sindano nyumbani kila wiki 13. Wanawake wengi huacha hedhi — kawaida na salama.' },
    pros:{ en:['Private — no one needs to know','Can do at home','No daily pill','Reversible'], sw:['Faragha','Unaweza kufanya nyumbani','Hakuna kidonge cha kila siku','Inaweza kubadilishwa'] },
    cons:{ en:['Training needed first','Irregular bleeding initially'], sw:['Mafunzo yanahitajika','Kutokwa damu isiyo ya kawaida mwanzoni'] } },
  { id:'implant', emoji:'🔵', name:{ en:'Implant (Implanon/Jadelle)', sw:'Kipandikizi' }, efficacy:'99%+', duration:{ en:'3–5 years', sw:'Miaka 3–5' }, color:'#7c3aed',
    desc:{ en:'Tiny rod under arm skin. Most effective reversible method. Nothing to remember.', sw:'Fimbo ndogo chini ya ngozi ya mkono. Njia bora zaidi ya kubadilishwa. Hakuna cha kukumbuka.' },
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
  { id:'iud', emoji:'🔩', name:{ en:'Copper IUD (Cu-T)', sw:'IUD ya Shaba' }, efficacy:'99%+', duration:{ en:'10–12 years', sw:'Miaka 10–12' }, color:'#f59e0b',
    desc:{ en:'T-shaped device in the womb. No hormones. Also works as emergency contraception within 5 days.', sw:'Kifaa chenye umbo T kwenye mfuko wa uzazi. Hakuna homoni. Inaweza pia kutumika kama uzazi wa dharura ndani ya siku 5.' },
    pros:{ en:['Hormone-free','Emergency contraception option','Long lasting','Removable anytime'], sw:['Bila homoni','Chaguo la uzazi wa dharura','Inadumu muda mrefu','Inaweza kuondolewa wakati wowote'] },
    cons:{ en:['Provider needed','Heavier periods possible','No STI protection'], sw:['Inahitaji mtoa huduma','Hedhi nzito zaidi','Haizuii STI'] } },
]

const MAPS_STEPS = {
  en:[
    { letter:'M', word:'Mix',         icon:'🔄', instruction:'Shake the Sayana Press device vigorously for 30 seconds until the liquid looks cloudy and milky.',            tip:'If you do not shake well, the medicine may not work properly.' },
    { letter:'A', word:'Activate',    icon:'🔘', instruction:'Firmly push the needle cap and reservoir port together until you hear or feel a click.',                      tip:'You MUST hear or feel the click. No click = not ready to inject.' },
    { letter:'P', word:'Pinch',       icon:'🤏', instruction:'Pinch a fold of skin on your lower belly (2 fingers from navel) or upper thigh. Keep pinching throughout.',  tip:'Hold the pinch firmly for the entire injection.' },
    { letter:'S', word:'Self-inject', icon:'💉', instruction:'Insert needle at 45° angle into pinched skin. Slowly squeeze reservoir until completely empty (~5 seconds).',  tip:'Remove needle while still pinching. Press gently — do NOT rub the site.' },
  ],
  sw:[
    { letter:'M', word:'Changanya',  icon:'🔄', instruction:'Tikisa kifaa kwa nguvu kwa sekunde 30 hadi dawa ionekane na ukungu kama maziwa.', tip:'Usitikise vizuri, dawa inaweza kutofanya kazi.' },
    { letter:'A', word:'Washa',      icon:'🔘', instruction:'Bonyeza kofia na bandari pamoja kwa nguvu hadi usikie au uhisi kubonyeza.',        tip:'LAZIMA usikie kubonyeza. Hakuna click = haiko tayari.' },
    { letter:'P', word:'Piga Pinch', icon:'🤏', instruction:'Piga ngozi kwenye tumbo la chini au mapaja ya juu. Endelea kushikilia hadi mwisho.', tip:'Shika pinch kwa nguvu wakati wote wa sindano.' },
    { letter:'S', word:'Jisindanie', icon:'💉', instruction:'Ingiza sindano kwa pembe ya 45°. Bonyeza polepole hadi tupu (sekunde ~5).', tip:'Toa sindano ukishikilia ngozi. Bonyeza kidogo — USISUGUE.' },
  ]
}

// ── FAQs ──────────────────────────────────────────────────────────────────────
const FAQS = {
  en:[
    { q:'What is a normal cycle length?', a:'Normal cycles range from 21 to 35 days. The 28-day cycle is just an average — most women vary. Track yours for 3 months to know your personal pattern.' },
    { q:'When am I most fertile?', a:'Ovulation typically happens 14 days before your next period. Sperm can survive 5 days, so your fertile window is roughly days 10-17 of a 28-day cycle.' },
    { q:'Can I get pregnant during my period?', a:"It's unlikely but possible — especially with short cycles. Sperm can survive up to 5 days. If you ovulate early, sex during your period could lead to pregnancy." },
    { q:'Is no period normal on DMPA-SC?', a:'Yes — very normal and completely safe. Most women stop having periods after 3-6 months on DMPA. Your blood is NOT building up. This is actually a benefit.' },
    { q:'Best method for a breastfeeding mother?', a:'POP, DMPA-SC, or implant are all safe from 6 weeks postpartum while breastfeeding. Avoid COC in the first 6 months. Ask your provider.' },
    { q:'What is emergency contraception?', a:'ECP (P2/Postinor) must be taken within 72 hours of unprotected sex — sooner is better. The copper IUD within 5 days is the most effective EC option.' },
  ],
  sw:[
    { q:'Urefu wa mzunguko wa kawaida ni nini?', a:'Mzunguko wa kawaida ni siku 21 hadi 35. Mzunguko wa siku 28 ni wastani tu — wanawake wengi wanatofautiana. Fuatilia wako kwa miezi 3.' },
    { q:'Ni lini mimi ni na uzazi zaidi?', a:'Ovulation kawaida hutokea siku 14 kabla ya hedhi yako ijayo. Manii inaweza kuishi siku 5, kwa hivyo dirisha lako la uzazi ni takriban siku 10-17.' },
    { q:'Ninaweza kupata ujauzito wakati wa hedhi?', a:"Ni nadra lakini inawezekana — hasa na mzunguko mfupi. Manii inaweza kuishi hadi siku 5." },
    { q:'Je, ni kawaida kutokuwa na hedhi kwenye DMPA-SC?', a:'Ndiyo — kawaida sana na salama. Wanawake wengi huacha kupata hedhi baada ya miezi 3-6 ya DMPA. Damu HAIKUSANYIKI ndani ya mwili wako. Hii ni faida.' },
    { q:'Njia bora kwa mama anayenyonyesha?', a:'POP, DMPA-SC, au kipandikizi ni salama kutoka wiki 6 baada ya kujifungua ukiwa unanyonyesha. Epuka COC katika miezi 6 ya kwanza.' },
    { q:'Uzazi wa mpango wa dharura ni nini?', a:'Vidonge vya dharura (P2/Postinor) lazima vichukuliwe ndani ya masaa 72 baada ya ngono bila kinga. IUD ya shaba ndani ya siku 5 ndiyo njia bora zaidi ya dharura.' },
  ]
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 1 — QUICK UNLOCK
// ══════════════════════════════════════════════════════════════════════════════
function QuickUnlockSetup({ lang, onDone, onSkip }) {
  const [method, setMethod]           = useState(null)
  const [pin, setPin]                 = useState('')
  const [confirmPin, setConfirmPin]   = useState('')
  const [step, setStep]               = useState(2)
  const [pattern, setPattern]         = useState([])
  const [confirmPattern, setConfirmPattern] = useState([])
  const [err, setErr]                 = useState('')
  const GRID = [1,2,3,4,5,6,7,8,9]

  const saveAndDone = (m, value) => { store.set(K.quickUnlock,{method:m,value,enabled:true}); onDone() }

  const handlePinNext = () => {
    if(step===2){ if(pin.length<4){setErr('Enter 4 digits');return}; setStep(3); setErr(''); return }
    if(confirmPin!==pin){setErr('PINs do not match');setConfirmPin('');return}
    saveAndDone('pin',pin)
  }

  const toggleDot = (n) => {
    if(step===2){ if(pattern.includes(n)) return; setPattern(p=>[...p,n]) }
    else { if(confirmPattern.includes(n)) return; setConfirmPattern(p=>[...p,n]) }
  }

  const submitPattern = () => {
    if(step===2){if(pattern.length<4){setErr('Connect at least 4 dots');return};setStep(3);setErr('');setConfirmPattern([]);return}
    if(JSON.stringify(confirmPattern)!==JSON.stringify(pattern)){setErr('Patterns do not match');setConfirmPattern([]);return}
    saveAndDone('pattern',pattern)
  }

  if(!method) return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className="text-3xl mb-2">🔐</div>
          <h3 className="font-bold text-gray-800">Set Up Quick Unlock</h3>
          <p className="text-xs text-gray-500 mt-1">Unlock Nova instantly next time without re-entering your full password</p>
        </div>
        <div className="space-y-2 mb-3">
          <button onClick={()=>setMethod('pin')}
            className="w-full flex items-center gap-3 bg-purple-50 border-2 border-purple-200 rounded-xl p-4 hover:border-purple-400 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Lock size={18} className="text-purple-600"/></div>
            <div className="text-left"><p className="font-bold text-gray-800 text-sm">PIN Code</p><p className="text-xs text-gray-500">4-digit quick PIN</p></div>
          </button>
          <button onClick={()=>setMethod('pattern')}
            className="w-full flex items-center gap-3 bg-pink-50 border-2 border-pink-200 rounded-xl p-4 hover:border-pink-400 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center"><Grid size={18} className="text-pink-600"/></div>
            <div className="text-left"><p className="font-bold text-gray-800 text-sm">Pattern Lock</p><p className="text-xs text-gray-500">Draw a pattern on a 3×3 grid</p></div>
          </button>
        </div>
        <button onClick={onSkip} className="w-full text-xs text-gray-400 py-2 hover:text-gray-600">Skip for now</button>
      </div>
    </div>
  )

  if(method==='pin') return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <button onClick={()=>{setMethod(null);setPin('');setConfirmPin('');setStep(2)}} className="mb-4 text-gray-400"><ArrowLeft size={18}/></button>
        <h3 className="font-bold text-gray-800 mb-1">{step===2?'Create Quick PIN':'Confirm Quick PIN'}</h3>
        <p className="text-xs text-gray-500 mb-4">{step===2?'Choose a 4-digit PIN':'Enter the PIN again to confirm'}</p>
        <input className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-bold focus:outline-none focus:border-purple-400"
          type="password" inputMode="numeric" maxLength={4} placeholder="••••" autoFocus
          value={step===2?pin:confirmPin}
          onChange={e=>{const v=e.target.value.replace(/\D/g,'').slice(0,4);step===2?setPin(v):setConfirmPin(v);setErr('')}}
          onKeyDown={e=>e.key==='Enter'&&handlePinNext()}/>
        {err&&<p className="text-xs text-red-500 mt-2 text-center">{err}</p>}
        <button onClick={handlePinNext} disabled={step===2?pin.length<4:confirmPin.length<4}
          className="w-full mt-4 text-white font-bold py-3 rounded-xl disabled:bg-gray-300"
          style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}}>
          {step===2?'Next →':'Set PIN ✓'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <button onClick={()=>{setMethod(null);setPattern([]);setConfirmPattern([]);setStep(2)}} className="mb-4 text-gray-400"><ArrowLeft size={18}/></button>
        <h3 className="font-bold text-gray-800 mb-1">{step===2?'Draw Your Pattern':'Confirm Your Pattern'}</h3>
        <p className="text-xs text-gray-500 mb-4">{step===2?'Connect at least 4 dots in any order':'Draw the same pattern again'}</p>
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl mb-3">
          {GRID.map(n=>{
            const cur=step===2?pattern:confirmPattern; const idx=cur.indexOf(n); const active=idx>=0
            return (
              <button key={n} onClick={()=>toggleDot(n)}
                style={{
                  width:'100%', paddingTop:'100%', position:'relative',
                  ...(active?{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}:{background:'#fff'})
                }}
                className={`rounded-full border-2 transition-all ${active?'border-purple-500':'border-gray-300'}`}>
                <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}
                  className={`text-sm font-black ${active?'text-white':'text-gray-400'}`}>
                  {active?idx+1:'·'}
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 text-center mb-2">{(step===2?pattern:confirmPattern).length} / 9 dots — min 4</p>
        {err&&<p className="text-xs text-red-500 text-center mb-2">{err}</p>}
        <div className="flex gap-2">
          <button onClick={()=>step===2?setPattern([]):setConfirmPattern([])} className="flex-1 border border-gray-300 text-gray-600 font-bold py-2.5 rounded-xl text-sm">Clear</button>
          <button onClick={submitPattern} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm" style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}}>
            {step===2?'Next →':'Confirm ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}

function QuickUnlockScreen({ onUnlock, onFallback }) {
  const config = store.get(K.quickUnlock)
  const [pin, setPin]       = useState('')
  const [pattern, setPattern] = useState([])
  const [err, setErr]       = useState('')
  const GRID = [1,2,3,4,5,6,7,8,9]

  const checkPin = (val) => {
    if(val.length<4) return
    if(val===config.value) onUnlock()
    else { setErr('Wrong PIN'); setPin('') }
  }

  const checkPattern = () => {
    if(JSON.stringify(pattern)===JSON.stringify(config.value)) onUnlock()
    else { setErr('Wrong pattern'); setPattern([]) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌸</div>
          <h1 className="text-3xl font-bold text-white">Nova</h1>
          <p className="text-pink-100 text-sm mt-1">Welcome back</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h3 className="font-bold text-gray-800 text-center mb-4">
            {config.method==='pin'?'🔐 Enter your Quick PIN':'🔐 Draw your Pattern'}
          </h3>
          {config.method==='pin'&&(
            <>
              <input className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-bold focus:outline-none focus:border-pink-400 mb-3"
                type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={pin} autoFocus
                onChange={e=>{const v=e.target.value.replace(/\D/g,'').slice(0,4);setPin(v);setErr('');checkPin(v)}}/>
              {err&&<p className="text-xs text-red-500 text-center mb-2">{err}</p>}
            </>
          )}
          {config.method==='pattern'&&(
            <>
              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl mb-3">
                {GRID.map(n=>{const idx=pattern.indexOf(n);const active=idx>=0;return(
                  <button key={n} onClick={()=>{if(!active){setPattern(p=>[...p,n]);setErr('')}}}
                    style={{width:'100%',paddingTop:'100%',position:'relative',...(active?{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}:{background:'#fff'})}}
                    className={`rounded-full border-2 transition-all ${active?'border-pink-500':'border-gray-300'}`}>
                    <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}
                      className={`text-sm font-black ${active?'text-white':'text-gray-400'}`}>
                      {active?idx+1:'·'}
                    </span>
                  </button>
                )})}
              </div>
              <p className="text-xs text-gray-400 text-center mb-2">{pattern.length} / 9 — min 4 to unlock</p>
              {err&&<p className="text-xs text-red-500 text-center mb-2">{err}</p>}
              <div className="flex gap-2">
                <button onClick={()=>setPattern([])} className="flex-1 border border-gray-300 text-gray-600 font-bold py-2.5 rounded-xl text-sm">Clear</button>
                <button onClick={checkPattern} disabled={pattern.length<4} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm disabled:bg-gray-300" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>Unlock</button>
              </div>
            </>
          )}
          <button onClick={onFallback} className="w-full mt-4 text-xs text-gray-400 py-2 hover:text-gray-600">
            Use nickname + PIN instead
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 2 — NOVA LOGIN (with Guest option)
// ══════════════════════════════════════════════════════════════════════════════
function NovaLogin({ lang, onLogin, onGuest }) {
  const t = T[lang]
  const [nick, setNick]   = useState('')
  const [pin, setPin]     = useState('')
  const [show, setShow]   = useState(false)
  const [err, setErr]     = useState('')
  const existing = store.get(K.user)

  const submit = () => {
    if(nick.trim().length<2){setErr('Enter a nickname (min 2 chars)');return}
    if(pin.length<4){setErr('PIN must be 4 digits');return}
    if(existing){
      if(existing.nickname.toLowerCase()!==nick.toLowerCase()||existing.pin!==pin){setErr('Nickname or PIN incorrect');return}
      onLogin(existing,false)
    } else {
      const u={nickname:nick.trim(),pin,createdAt:new Date().toISOString()}
      store.set(K.user,u); onLogin(u,true)
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
          {existing&&<div className="bg-pink-50 border border-pink-200 rounded-xl p-3 mb-4"><p className="text-xs text-pink-700">{t.loginExisting}</p></div>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t.nickLabel}</label>
              <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder={lang==='sw'?'Mfano: Zawadi':'e.g. Aisha, Wanjiru'}
                value={nick} onChange={e=>{setNick(e.target.value);setErr('')}}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t.pinLabel}</label>
              <div className="relative">
                <input className="w-full border border-gray-300 rounded-xl px-3 pr-10 py-2.5 text-sm tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
                  type={show?'text':'password'} inputMode="numeric" maxLength={4} placeholder="••••" value={pin}
                  onChange={e=>{setPin(e.target.value.replace(/\D/g,'').slice(0,4));setErr('')}}
                  onKeyDown={e=>e.key==='Enter'&&submit()}/>
                <button onClick={()=>setShow(!show)} className="absolute right-3 top-3 text-gray-400">
                  {show?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
            </div>
            {err&&<p className="text-xs text-red-600">{err}</p>}
            <button onClick={submit} disabled={!nick.trim()||pin.length<4}
              className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition-colors"
              style={{background:nick&&pin.length===4?'linear-gradient(135deg,#ec4899,#f59e0b)':undefined}}>
              {t.loginBtn}
            </button>
            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200"/><span className="text-xs text-gray-400">or</span><div className="flex-1 h-px bg-gray-200"/>
            </div>
            {/* Guest access */}
            <button onClick={onGuest}
              className="w-full border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
              <Eye size={14}/> {t.guestBrowse}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            🔒 {lang==='sw'?'Data yako inabaki kwenye simu yako peke yake.':'Your data stays on your device only.'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 3 — PARTNER CALENDAR SHARING
// ══════════════════════════════════════════════════════════════════════════════
function generateCode() { return Math.random().toString(36).substring(2,8).toUpperCase() }

function PartnerShareModal({ lang, cycles, user, onClose, initialMode='menu' }) {
  const t = T[lang]
  const [config, setConfig]       = useState(()=>store.get(K.partnerShare))
  const [mode, setMode]           = useState(initialMode)
  // Pre-fill code if coming from deep link
  const [inputCode, setInputCode] = useState(()=>{ const c=store.get('nova_pending_view_code'); if(c){store.del('nova_pending_view_code');return c} return '' })
  const [copied, setCopied]       = useState(false)
  const [codeErr, setCodeErr]     = useState('')

  const createShare = () => {
    const code = generateCode()
    const snapshot = { code, owner:user.nickname, cycles:cycles.slice(0,12), createdAt:new Date().toISOString() }
    store.set(K.partnerShare, snapshot); setConfig(snapshot); setMode('share')
  }

  const APP_URL = 'https://jellyfish-app-7kmt9.ondigitalocean.app/chagua-afya'
  const VIEW_URL = `${APP_URL}?action=view-partner&code=${config?.code||''}`

  const shareWhatsApp = () => {
    const msg = `Hi! I'm sharing my Nova cycle calendar with you. 🌸\n\nTap this link to view my calendar directly:\n👉 ${VIEW_URL}\n\nOr open Nova manually:\n1. Go to: ${APP_URL}\n2. Tap *"View Partner Calendar"* on the Home tab\n3. Enter code: *${config?.code}*\n\n_Nova is a private health app — your personal data is never shared._`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank')
  }

  const copyCode = () => {
    const text = `Nova share code: ${config?.code}\n\nView my cycle calendar directly:\n${VIEW_URL}\n\nOr go to Home → "View Partner Calendar" → enter: ${config?.code}`
    navigator.clipboard.writeText(text).catch(()=>{})
    setCopied(true); setTimeout(()=>setCopied(false),2500)
  }

  const viewPartner = () => {
    const code = inputCode.trim().toUpperCase()
    if(!code){setCodeErr('Enter a code');return}
    // Demo: look up from same device (production would fetch from backend via code)
    const snap = store.get(K.partnerShare)
    if(snap&&snap.code===code){
      store.set('nova_viewing_partner',{code,owner:snap.owner,cycles:snap.cycles})
      onClose()
    } else {
      setCodeErr(lang==='sw'?'Nambari hii haipatikani. Omba mpenzi wako akupe nambari sahihi.':'Code not found. Ask your partner to share their code again.')
    }
  }

  const revoke = () => { store.del(K.partnerShare); store.del('nova_viewing_partner'); setConfig(null); setMode('menu') }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode!=='menu'&&<button onClick={()=>setMode('menu')} className="text-gray-400 mr-1"><ArrowLeft size={16}/></button>}
            <p className="font-bold text-gray-800">💑 {t.partnerShareLabel}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xl">×</button>
        </div>

        <div className="p-5 space-y-4">
          {mode==='menu'&&(
            <>
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                <p className="text-sm text-pink-700 leading-relaxed">
                  {lang==='sw'
                    ?'Shiriki kalenda yako ya hedhi na mpenzi wako kwa usalama. Wanaweza kuona awamu, siku za uzazi wa juu, na tarehe za hedhi peke yake.'
                    :'Safely share your cycle calendar with your partner. They can view your phases, high-fertility days, and period dates only.'}
                </p>
              </div>

              {/* My share status */}
              {config?(
                <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-green-700 text-sm">✅ {t.partnerActive}</p>
                    <button onClick={()=>setMode('revoke_confirm')} className="text-xs text-red-400 hover:text-red-600 underline">{t.revokeAccess}</button>
                  </div>
                  <p className="text-xs text-green-600 mb-3">Code: <span className="font-black tracking-widest text-base ml-1">{config.code}</span></p>
                  <div className="flex gap-2">
                    <button onClick={()=>setMode('share')} className="flex-1 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
                      style={{background:'linear-gradient(135deg,#14a044,#0d7377)'}}>
                      <Share2 size={12}/> Show Code
                    </button>
                  </div>
                </div>
              ):(
                <button onClick={createShare} className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                  style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
                  <Share2 size={18}/> {t.partnerShareLabel}
                </button>
              )}

              {/* View partner's calendar */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                <p className="font-bold text-purple-700 text-sm mb-2">👥 {lang==='sw'?'Ona Kalenda ya Mpenzi':'View Partner Calendar'}</p>
                <p className="text-xs text-purple-600 mb-3">
                  {lang==='sw'?'Ingiza nambari uliyopewa na mpenzi wako.':'Enter the code your partner shared with you.'}
                </p>
                <div className="flex gap-2">
                  <input className="flex-1 border border-purple-300 rounded-xl px-3 py-2 text-sm font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="ABC123" maxLength={6} value={inputCode}
                    onChange={e=>{setInputCode(e.target.value.toUpperCase());setCodeErr('')}}/>
                  <button onClick={viewPartner} disabled={inputCode.length<6}
                    className="text-white font-bold px-4 rounded-xl text-sm disabled:bg-gray-300"
                    style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}}>View</button>
                </div>
                {codeErr&&<p className="text-xs text-red-500 mt-2">{codeErr}</p>}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-blue-700">
                  {lang==='sw'?'Nambari inaweza kufutwa wakati wowote. Data inabaki kwenye simu yako.'
                  :'Share code can be revoked anytime. Calendar data stays on your device.'}
                </p>
              </div>
            </>
          )}

          {mode==='share'&&config&&(
            <>
              <p className="text-sm text-gray-600 text-center">
                {lang==='sw'?'Tuma nambari hii kwa mpenzi wako:':'Send this code to your partner:'}
              </p>
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl p-6 text-center">
                <p className="text-5xl font-black tracking-[0.3em] text-pink-600">{config.code}</p>
                <p className="text-xs text-gray-400 mt-2">{lang==='sw'?'Nambari ya kushiriki kalenda':'Calendar share code'}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={copyCode} className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-50">
                  {copied?<Check size={14} className="text-green-500"/>:<Copy size={14}/>}
                  {copied?'Copied!':'Copy Code'}
                </button>
                <button onClick={shareWhatsApp} className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl text-sm" style={{background:'#25d366'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  ⚠️ {lang==='sw'?'Shiriki nambari hii na mpenzi wako anayekuamini tu.':'Share this code only with a trusted partner.'}
                </p>
              </div>
            </>
          )}

          {mode==='view'&&(
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-sm text-purple-700 leading-relaxed">
                  {lang==='sw'
                    ?'Ingiza nambari uliyopewa na mpenzi wako. Utaweza kuona kalenda yake ya hedhi tu.'
                    :"Enter the code your partner shared with you. You'll be able to view their cycle calendar only."}
                </p>
              </div>
              <div className="bg-white border-2 border-purple-200 rounded-2xl p-5">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  {lang==='sw'?'🔑 Nambari ya Mpenzi Wako:':'🔑 Your Partner\'s Share Code:'}
                </label>
                <input
                  className="w-full border-2 border-purple-300 rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.3em] uppercase focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  placeholder="ABC123"
                  maxLength={6}
                  value={inputCode}
                  autoFocus
                  onChange={e=>{setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''));setCodeErr('')}}
                />
                {codeErr&&<p className="text-xs text-red-500 mt-2 text-center">{codeErr}</p>}
                <button
                  onClick={viewPartner}
                  disabled={inputCode.length<6}
                  className="w-full mt-4 text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition-colors"
                  style={{background:inputCode.length===6?'linear-gradient(135deg,#7c3aed,#ec4899)':undefined}}>
                  {lang==='sw'?'Tazama Kalenda →':'View Calendar →'}
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-blue-700">
                  {lang==='sw'
                    ?'Utaona rekodi za hedhi peke yake. Taarifa nyingine za kibinafsi hazitaonekana.'
                    :'You will only see period records. No other personal data will be visible.'}
                </p>
              </div>
            </div>
          )}

          {mode==='revoke_confirm'&&(
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                <AlertTriangle size={32} className="text-red-500 mx-auto mb-3"/>
                <p className="font-bold text-red-700 mb-2">
                  {lang==='sw'?'Vua Ruhusa ya Mpenzi?':'Revoke Partner Access?'}
                </p>
                <p className="text-sm text-red-600">
                  {lang==='sw'?'Nambari ya sasa itafutwa. Mpenzi wako hataweza kuona kalenda yako tena na nambari hiyo.'
                  :'The current code will be deleted. Your partner can no longer view your calendar with that code.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setMode('menu')} className="flex-1 border border-gray-300 text-gray-600 font-bold py-3 rounded-xl">
                  {lang==='sw'?'Rudi':'Cancel'}
                </button>
                <button onClick={revoke} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600">
                  {lang==='sw'?'Ndiyo, Vua':'Yes, Revoke'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PartnerCalendarView({ lang, onStop }) {
  const data = store.get('nova_viewing_partner')
  if (!data) return null
  const { owner, cycles } = data
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 text-white flex items-center justify-between"
        style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}}>
        <div className="flex items-center gap-3">
          <Users size={20}/>
          <div>
            <p className="font-bold text-sm">{lang==='sw'?'Unaona Kalenda ya':'Viewing Calendar of'}</p>
            <p className="text-lg font-black">{owner}</p>
          </div>
        </div>
        <button onClick={onStop} className="bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 text-xs font-bold">
          {lang==='sw'?'Acha':'Stop'}
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
        <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-purple-500"/>
          {lang==='sw'?'Historia ya Hedhi (Inayoshirikiwa)':'Period History (Shared)'}
        </p>
        {(!cycles||cycles.length===0)
          ?<p className="text-sm text-gray-400 text-center py-4">{lang==='sw'?'Hakuna rekodi bado.':'No records yet.'}</p>
          :cycles.map((c,i)=>{
            const dur=c.end?Math.ceil((new Date(c.end)-new Date(c.start))/(1000*60*60*24)):null
            return (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-purple-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 flex-shrink-0"/>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(c.start+'T12:00:00').toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}
                    </p>
                    {c.end&&<p className="text-xs text-gray-400">→ {new Date(c.end+'T12:00:00').toLocaleDateString('en-KE',{day:'numeric',month:'short'})}</p>}
                  </div>
                </div>
                {dur&&<span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{dur}d</span>}
              </div>
            )
          })
        }
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-2">
        <Shield size={14} className="text-purple-500 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-purple-700">
          {lang==='sw'?'Unaona rekodi za hedhi peke yake. Taarifa nyingine za kibinafsi hazionekani.'
          :'You are viewing period records only. All other personal data is private.'}
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// AI CHAT
// ══════════════════════════════════════════════════════════════════════════════
function FaqItem({ faq }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button className="w-full flex items-center justify-between px-4 py-3 text-left" onClick={()=>setOpen(!open)}>
        <p className="text-sm font-medium text-gray-700 pr-2">{faq.q}</p>
        {open?<ChevronUp size={14} className="text-gray-400 flex-shrink-0"/>:<ChevronDown size={14} className="text-gray-400 flex-shrink-0"/>}
      </button>
      {open&&<div className="px-4 pb-4"><p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p></div>}
    </div>
  )
}

function AskNova({ lang, user }) {
  const t = T[lang]
  const [persona, setPersona]   = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const endRef = useRef(null)

  useEffect(()=>{ if(persona) setMessages(store.get(K.chatPrefix+persona.id,[])) },[persona])
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[messages,loading])

  const send = async (text) => {
    const msg = text||input
    if(!msg.trim()||loading||!persona) return
    setInput('')
    const next=[...messages,{role:'user',content:msg}]
    setMessages(next); store.set(K.chatPrefix+persona.id,next)
    setLoading(true)
    try {
      if(!GEMINI_KEY) throw new Error('no-key')
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            system_instruction:{parts:[{text:persona.prompt(lang,user?.nickname||'friend')}]},
            contents:next.map(m=>({role:m.role==='user'?'user':'model',parts:[{text:m.content}]})),
            generation_config:{temperature:0.7,max_output_tokens:250}
          })
        }
      )
      if(res.status===429) throw new Error('429')
      const data = await res.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      if(!reply) throw new Error('empty')
      const final=[...next,{role:'assistant',content:reply}]
      setMessages(final); store.set(K.chatPrefix+persona.id,final)
    } catch(e) {
      const r=e.message==='429'?(lang==='sw'?'⏳ Subiri sekunde 30.':'⏳ Too many requests. Wait 30 seconds.')
        :e.message==='no-key'?(lang==='sw'?'ℹ️ AI haipo. Wasiliana na kliniki.':'ℹ️ AI offline. Contact your nearest clinic.')
        :(lang==='sw'?'⚠️ Hitilafu. Jaribu tena.':'⚠️ Error. Please try again.')
      const final=[...next,{role:'assistant',content:r}]
      setMessages(final); store.set(K.chatPrefix+persona.id,final)
    } finally { setLoading(false) }
  }

  const clearMemory = () => {
    if(!window.confirm(lang==='sw'?'Futa historia ya mazungumzo haya?':'Clear this chat history?')) return
    store.del(K.chatPrefix+persona.id); setMessages([])
  }

  if(!persona) return (
    <div className="space-y-4">
      <div><h2 className="font-bold text-gray-800 text-lg">{lang==='sw'?'Uliza Nova':'Ask Nova'}</h2><p className="text-sm text-gray-500">{lang==='sw'?'Chagua msaidizi wako:':'Choose your Nova companion:'}</p></div>
      <div className="grid grid-cols-2 gap-3">
        {PERSONAS.map(p=>(
          <button key={p.id} onClick={()=>setPersona(p)} className="bg-white rounded-2xl border-2 p-4 text-left hover:shadow-md transition-all hover:-translate-y-0.5" style={{borderColor:p.color+'40'}}>
            <div className="text-3xl mb-2">{p.emoji}</div>
            <p className="font-bold text-gray-800 text-sm">{p.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{p.tagline[lang]}</p>
            {store.get(K.chatPrefix+p.id,[]).length>0&&<p className="text-xs mt-2 font-medium" style={{color:p.color}}>{lang==='sw'?'💬 Mazungumzo yaliyohifadhiwa':'💬 Saved conversation'}</p>}
          </button>
        ))}
      </div>
      {/* FAQs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100"><p className="font-bold text-gray-700 text-sm">❓ {lang==='sw'?'Maswali ya Kawaida':'Common Questions'}</p></div>
        <div className="divide-y divide-gray-50">{FAQS[lang].map((faq,i)=><FaqItem key={i} faq={faq}/>)}</div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
        <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-blue-700">{t.memoryNote}</p>
      </div>
    </div>
  )

  const starters=lang==='sw'
    ?['Ninajua nini kuhusu awamu za mzunguko wangu?','Je, DMPA-SC ni salama kwangu?','Nina maswali kuhusu uzazi wa mpango']
    :['What should I know about my cycle phases?','Is DMPA-SC safe for me?','I have questions about family planning']

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={()=>setPersona(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={14}/>{lang==='sw'?'Badilisha':'Change'}</button>
        <div className="flex items-center gap-2"><span className="text-xl">{persona.emoji}</span><span className="font-bold text-gray-700 text-sm">{persona.name}</span></div>
        <button onClick={clearMemory} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"><Trash2 size={12}/>{t.eraseChat}</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length===0&&(
            <div className="space-y-2 pt-2">
              <p className="text-xs text-gray-500 text-center mb-3">{lang==='sw'?`Uliza ${persona.name}:`:`Ask ${persona.name}:`}</p>
              {starters.map((q,i)=>(
                <button key={i} onClick={()=>send(q)} className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 hover:bg-pink-50 hover:border-pink-300 transition-colors flex items-center justify-between gap-2">
                  <span>{q}</span><ChevronRight size={12} className="text-gray-400 flex-shrink-0"/>
                </button>
              ))}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2"><p className="text-xs text-amber-700">{t.memoryNote}</p></div>
            </div>
          )}
          {messages.map((m,i)=>(
            <div key={i} className={`flex gap-2 ${m.role==='user'?'flex-row-reverse':''}`}>
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white" style={{background:m.role==='user'?'#374151':persona.color}}>
                {m.role==='user'?(user?.nickname?.[0]?.toUpperCase()||'Y'):persona.emoji}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role==='user'?'text-white rounded-tr-none':'bg-white border border-gray-100 text-gray-700 rounded-tl-none'}`}
                style={m.role==='user'?{background:'#374151'}:{}}>{m.content}</div>
            </div>
          ))}
          {loading&&(
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{background:persona.color}}>{persona.emoji}</div>
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex gap-1">
                {[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-gray-300" style={{animation:`bounce 1s infinite ${i*0.2}s`}}/>)}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>
        <div className="p-3 border-t border-gray-100 flex gap-2 bg-white">
          <button onClick={()=>{setMessages([]);store.del(K.chatPrefix+persona.id)}} className="text-gray-400 hover:text-pink-600 flex-shrink-0"><RefreshCw size={14}/></button>
          <input className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            placeholder={lang==='sw'?'Andika swali lako...':'Type your question...'}
            value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
          <button onClick={()=>send()} disabled={!input.trim()||loading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${input.trim()?'':'bg-gray-300'}`}
            style={input.trim()?{background:persona.color}:{}}>
            <Send size={14}/>
          </button>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
    </div>
  )
}

// ── CLINIC FINDER ─────────────────────────────────────────────────────────────
function ClinicFinder({ lang }) {
  const [status,setStatus]     = useState('idle')
  const [clinics,setClinics]   = useState([])
  const [coords,setCoords]     = useState(null)
  const [errorMsg,setErrorMsg] = useState('')

  const find = () => {
    if(!navigator.geolocation){setErrorMsg('Your browser does not support location.');setStatus('error');return}
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async(pos)=>{ const{latitude,longitude}=pos.coords; setCoords({latitude,longitude}); setStatus('searching'); await search(latitude,longitude) },
      ()=>{ setErrorMsg(lang==='sw'?'Hukuruhusu ufikiaji wa eneo. Tafadhali ruhusu.':'Location access denied. Please allow location access.'); setStatus('error') },
      {timeout:10000,maximumAge:60000}
    )
  }

  const search = async(lat,lng) => {
    if(!GEMINI_KEY){setErrorMsg('AI service unavailable. Call 0800 723 253.');setStatus('error');return}
    try {
      const prompt=`Find 3 nearest family planning clinics or health facilities to latitude ${lat.toFixed(4)}, longitude ${lng.toFixed(4)} in Kenya. Use Google Search. Return ONLY valid JSON array, no markdown:\n[{"name":"Name","type":"Hospital or Health Centre","distance":"approx X km","address":"Area, County","services":"Family planning, MCH","phone":"number or null"}]\nReturn exactly 3 results.`
      const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],tools:[{google_search:{}}],generation_config:{temperature:0.1,max_output_tokens:600}})}
      )
      if(res.status===429) throw new Error('429')
      const data=await res.json()
      const text=data.candidates?.[0]?.content?.parts?.find(p=>p.text)?.text||''
      const clean=text.replace(/```json|```/g,'').trim()
      const parsed=JSON.parse(clean)
      if(!Array.isArray(parsed)) throw new Error('bad-format')
      setClinics(parsed); setStatus('done')
    } catch(e) {
      if(e.message==='429') setErrorMsg(lang==='sw'?'⏳ Subiri sekunde 30 kisha jaribu tena.':'⏳ Rate limit. Wait 30 seconds and try again.')
      else setErrorMsg(lang==='sw'?'Imeshindwa kupata matokeo. Jaribu tena au piga simu 0800 723 253.':'Could not get results. Try again or call 0800 723 253.')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      <div><h2 className="font-bold text-gray-800 text-lg">{lang==='sw'?'Pata Kliniki Karibu Nawe':'Find a Clinic Near You'}</h2><p className="text-sm text-gray-500">{lang==='sw'?"Tunapata vituo 3 vya karibu nawe.":"We'll find the 3 nearest health facilities to you."}</p></div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <Info size={14} className="text-amber-500 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-amber-700">{lang==='sw'?'⚠️ Matokeo yanategemea data zilizopo na huenda yasiwe sahihi. Piga simu kwanza kuthibitisha huduma.':'⚠️ Results may not always be accurate. Always call ahead to confirm services.'}</p>
      </div>
      {status==='idle'&&<button onClick={find} className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}><MapPin size={18}/>{lang==='sw'?'Pata Kliniki za Karibu':'Find Nearest Clinics'}</button>}
      {(status==='locating'||status==='searching')&&<div className="bg-white rounded-2xl border border-gray-200 p-6 text-center"><RefreshCw size={24} className="animate-spin mx-auto mb-2 text-pink-500"/><p className="text-sm text-gray-600">{status==='locating'?(lang==='sw'?'📍 Inapata eneo lako...':'📍 Getting your location...'):(lang==='sw'?'🔍 Inatafuta vituo...':'🔍 Searching...')}</p>{coords&&<p className="text-xs text-gray-400 mt-1">{coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</p>}</div>}
      {status==='error'&&<div className="space-y-3"><div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><p className="text-sm text-red-700">{errorMsg}</p></div><button onClick={()=>setStatus('idle')} className="w-full text-white font-bold py-3 rounded-xl" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>{lang==='sw'?'Jaribu Tena':'Try Again'}</button></div>}
      {status==='done'&&clinics.length>0&&(
        <div className="space-y-3">
          {clinics.map((c,i)=>(
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0"><MapPin size={18} className="text-pink-600"/></div>
              <div className="flex-1"><p className="font-bold text-gray-800">{c.name}</p><p className="text-xs text-gray-500 mt-0.5">{c.type} · {c.distance}</p><p className="text-xs text-gray-400">{c.address}</p>{c.services&&<p className="text-xs text-teal-600 mt-1">✅ {c.services}</p>}{c.phone&&<a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-pink-600 mt-1 hover:underline"><Phone size={10}/>{c.phone}</a>}</div>
              <span className="text-lg font-black text-pink-300">#{i+1}</span>
            </div>
          ))}
          <button onClick={()=>{setStatus('idle');setClinics([])}} className="w-full text-pink-600 border border-pink-300 font-bold py-2.5 rounded-xl text-sm hover:bg-pink-50">{lang==='sw'?'🔄 Tafuta Tena':'🔄 Search Again'}</button>
        </div>
      )}
      <a href="tel:0800723253" className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0"><Phone size={18} className="text-teal-600"/></div>
        <div><p className="font-bold text-gray-800 text-sm">{lang==='sw'?'Simu ya Afya — Bila Malipo':'Kenya Health Line — Free'}</p><p className="text-xl font-black text-teal-600">0800 723 253</p></div>
      </a>
    </div>
  )
}

// ── DATE CALCULATOR ───────────────────────────────────────────────────────────
function DateCalc({ lang }) {
  const [lastDate,setLastDate]=useState(''); const [result,setResult]=useState(null)
  const calc=()=>{ if(!lastDate) return; const d=new Date(lastDate); setResult({next:new Date(d.getTime()+91*24*60*60*1000),grace:new Date(d.getTime()+119*24*60*60*1000)}) }
  const fmt=(d)=>d.toLocaleDateString('en-KE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <label className="block text-sm text-gray-600 mb-2 font-medium">{lang==='sw'?'Tarehe ya sindano ya mwisho:':'Date of last injection:'}</label>
        <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400" value={lastDate} onChange={e=>{setLastDate(e.target.value);setResult(null)}}/>
        <button onClick={calc} disabled={!lastDate} className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300" style={{background:lastDate?'linear-gradient(135deg,#ec4899,#f59e0b)':undefined}}>{lang==='sw'?'Hesabu':'Calculate'}</button>
      </div>
      {result&&<div className="space-y-3"><div className="bg-teal-50 border border-teal-300 rounded-2xl p-5"><p className="text-xs text-teal-600 font-bold uppercase tracking-wide mb-1">{lang==='sw'?'Sindano ijayo:':'Next injection due:'}</p><p className="text-xl font-bold text-teal-700">{fmt(result.next)}</p></div><div className="bg-amber-50 border border-amber-300 rounded-2xl p-4"><p className="text-xs text-amber-600 font-bold uppercase tracking-wide mb-1">{lang==='sw'?'Muda wa neema unaisha:':'Grace period ends:'}</p><p className="text-base font-bold text-amber-700">{fmt(result.grace)}</p><p className="text-xs text-amber-600 mt-2">⚠️ {lang==='sw'?'Baada ya tarehe hii, ona mtoa huduma kabla ya kusindania.':'After this date, see a provider before injecting.'}</p></div></div>}
    </div>
  )
}

// ── METHOD MODAL ──────────────────────────────────────────────────────────────
function MethodModal({ method, lang, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="text-3xl">{method.emoji}</span><div><p className="font-bold text-gray-800">{method.name[lang]}</p><p className="text-xs text-gray-400">{method.efficacy} · {method.duration[lang]}</p></div></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{method.desc[lang]}</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4"><p className="font-bold text-green-700 text-sm mb-2">✅ {lang==='sw'?'Faida':'Benefits'}</p>{method.pros[lang].map((p,i)=><p key={i} className="text-sm text-green-700 mb-1">• {p}</p>)}</div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><p className="font-bold text-amber-700 text-sm mb-2">⚠️ {lang==='sw'?'Kumbuka':'Things to Know'}</p>{method.cons[lang].map((c,i)=><p key={i} className="text-sm text-amber-700 mb-1">• {c}</p>)}</div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3"><p className="text-sm text-teal-700">🏥 {lang==='sw'?'Ongea na mtoa huduma kupata njia inayofaa kwako.':'Talk to a health provider to find the right method for you.'}</p></div>
        </div>
      </div>
    </div>
  )
}

// ── DELETE ALL CONFIRM ─────────────────────────────────────────────────────────
function DeleteConfirmModal({ lang, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="font-bold text-gray-800 text-lg mb-2">{lang==='sw'?'Futa Data Yote?':'Delete All Data?'}</h3>
        <p className="text-sm text-gray-600 mb-6">{lang==='sw'?'Rekodi zako zote za hedhi, mazungumzo, na wasifu wa Nova zitafutwa. Hii haiwezi kutenduliwa.':'All your period records, conversations, and Nova profile will be permanently deleted. This cannot be undone.'}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-300 text-gray-600 font-bold py-3 rounded-xl">{lang==='sw'?'Rudi':'Cancel'}</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600">{lang==='sw'?'Futa Yote':'Delete All'}</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function ChaguaAfya() {
  const navigate = useNavigate()
  const [lang, setLang]                     = useState('en')
  const [activeTab, setActiveTab]           = useState('home')
  const [selectedMethod, setSelectedMethod] = useState(null)

  // Auth
  const [user, setUser]       = useState(()=>store.get(K.user))
  const [isGuest, setIsGuest] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  // Partner sharing
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareModalMode, setShareModalMode] = useState('menu')
  const [viewingPartner, setViewingPartner] = useState(()=>store.get('nova_viewing_partner'))

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Handle deep link: ?action=view-partner&code=XXXXXX
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    const code   = params.get('code')
    if(action==='view-partner'){
      setShareModalMode('view')
      setShowShareModal(true)
      // If code was in URL, we need to pass it — store temporarily
      if(code) store.set('nova_pending_view_code', code.toUpperCase())
      // Clean URL without reload
      window.history.replaceState({},'',window.location.pathname)
    }
  },[])

  const t = T[lang]
  const PROTECTED = ['cycle']

  const goTab = (tab) => {
    if(PROTECTED.includes(tab)&&!user){setShowLogin(true);return}
    setActiveTab(tab); setShowLogin(false)
  }

  const onLogin = (u, isNew=false) => {
    setUser(u); setShowLogin(false); setIsGuest(false); setActiveTab('cycle')
  }

  const onGuest = () => { setIsGuest(true); setShowLogin(false); setActiveTab('home') }

  const onLogout = () => { setUser(null); setIsGuest(false); setActiveTab('home') }

  const confirmDelete = () => {
    store.clearAll(); store.del('nova_viewing_partner')
    setUser(null); setIsGuest(false); setViewingPartner(null)
    setShowDeleteConfirm(false); setActiveTab('home')
  }

  const stopViewingPartner = () => { store.del('nova_viewing_partner'); setViewingPartner(null) }

  if(showLogin&&!user) return <NovaLogin lang={lang} onLogin={onLogin} onGuest={onGuest}/>

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Modals */}
      {showShareModal&&user&&<PartnerShareModal lang={lang} cycles={store.get(K.cycles,[])} user={user} initialMode={shareModalMode} onClose={()=>{setShowShareModal(false);setShareModalMode('menu');setViewingPartner(store.get('nova_viewing_partner'))}}/>}
      {showDeleteConfirm&&<DeleteConfirmModal lang={lang} onConfirm={confirmDelete} onCancel={()=>setShowDeleteConfirm(false)}/>}

      {/* HEADER */}
      <div className="sticky top-0 z-40 text-white shadow-lg" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={()=>navigate('/login')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20"><ArrowLeft size={18}/></button>
            <div><p className="font-bold text-base leading-tight">🌸 Nova</p><p className="text-xs opacity-80 leading-tight">{t.tagline}</p></div>
          </div>
          <div className="flex items-center gap-2">
            {user&&<div className="flex items-center gap-1 bg-white/20 rounded-xl px-2 py-1"><User size={11}/><span className="text-xs font-bold">{user.nickname}</span></div>}
            {isGuest&&!user&&<div className="flex items-center gap-1 bg-white/15 rounded-xl px-2 py-1"><Eye size={11}/><span className="text-xs font-semibold opacity-80">Guest</span></div>}
            {viewingPartner&&<div className="flex items-center gap-1 bg-purple-500/70 rounded-xl px-2 py-1"><Users size={11}/><span className="text-xs font-bold">{viewingPartner.owner}</span></div>}
            <div className="flex bg-white/20 rounded-xl overflow-hidden">
              {['en','sw'].map(l=>(
                <button key={l} onClick={()=>setLang(l)} className={`px-3 py-1.5 text-xs font-bold transition-colors ${lang===l?'bg-white text-pink-600':'text-white'}`} aria-pressed={lang===l}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="overflow-x-auto bg-white border-b border-gray-200 shadow-sm">
        <div className="flex max-w-lg mx-auto px-2 py-2 gap-1 min-w-max">
          {['home','cycle','methods','inject','date','ai','clinic'].map((key,i)=>(
            <button key={key} onClick={()=>goTab(key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${activeTab===key?'text-white':'text-gray-500 hover:bg-gray-100'}`}
              style={activeTab===key?{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}:{}} aria-selected={activeTab===key}>
              {t.tabs[i]}{PROTECTED.includes(key)&&!user?' 🔒':''}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-10">

        {/* HOME */}
        {activeTab==='home'&&(
          <div className="space-y-4">
            {/* Hero */}
            <div className="rounded-2xl p-5 text-white shadow-lg" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
              <h1 className="text-xl font-bold">{t.homeTitle}</h1>
              <p className="text-sm mt-1 opacity-90">{t.homeSubtitle}</p>
              {user&&<p className="text-sm mt-2 font-semibold">👋 {lang==='sw'?`Karibu tena, ${user.nickname}!`:`Welcome back, ${user.nickname}!`}</p>}
              {isGuest&&!user&&<p className="text-sm mt-2 font-semibold opacity-80">👁️ {lang==='sw'?'Unatazama kama mgeni':'Browsing as guest'}</p>}
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-3">
              {t.homeCards.map((card,i)=>(
                <button key={i} onClick={()=>goTab(card.tab)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-left hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="text-3xl mb-2">{card.emoji}</div>
                  <p className="font-bold text-gray-800 text-sm">{card.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
                  {PROTECTED.includes(card.tab)&&!user&&<p className="text-xs text-pink-400 mt-1">🔒 {lang==='sw'?'Ingia kwanza':'Sign in first'}</p>}
                </button>
              ))}
            </div>

            {/* Privacy */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <Shield size={14} className="text-blue-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-blue-700">{t.privacy}</p>
            </div>

            {/* ── PARTNER SECTION (always visible when logged in) ── */}
            {user&&(
              <div className="space-y-2">

                {/* Currently VIEWING partner — banner */}
                {viewingPartner&&(
                  <div className="bg-purple-50 border-2 border-purple-400 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center text-white text-lg">👥</div>
                        <div>
                          <p className="font-bold text-purple-700 text-sm">{t.viewingPartner}</p>
                          <p className="text-xs text-purple-500 font-semibold">{viewingPartner.owner}</p>
                        </div>
                      </div>
                      <button onClick={stopViewingPartner}
                        className="text-xs border-2 border-purple-400 text-purple-600 font-bold px-3 py-1.5 rounded-xl hover:bg-purple-100">
                        {t.stopViewing}
                      </button>
                    </div>
                    <button onClick={()=>goTab('cycle')}
                      className="w-full text-white font-bold py-2 rounded-xl text-xs"
                      style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}}>
                      📅 {lang==='sw'?'Tazama Kalenda ya Mpenzi':'View Partner Calendar'}
                    </button>
                  </div>
                )}

                {/* MY OWN SHARE — owner management card */}
                {(()=>{ const myShare = store.get(K.partnerShare); return myShare ? (
                  <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-white text-lg">🔗</div>
                        <div>
                          <p className="font-bold text-green-700 text-sm">{lang==='sw'?'Kalenda Yangu Inashirikiwa':'My Calendar is Shared'}</p>
                          <p className="text-xs text-green-600">
                            {lang==='sw'?'Nambari: ':'Code: '}
                            <span className="font-black tracking-widest">{myShare.code}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">
                        {lang==='sw'?'Hai':'Active'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={()=>setShowShareModal(true)}
                        className="flex-1 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
                        style={{background:'linear-gradient(135deg,#14a044,#0d7377)'}}>
                        <Share2 size={12}/>{lang==='sw'?'Simamia':'Manage'}
                      </button>
                      <button onClick={()=>setShowShareModal(true)}
                        className="flex-1 border border-green-300 text-green-700 font-bold py-2 rounded-xl text-xs">
                        {lang==='sw'?'Tuma Tena':'Resend Code'}
                      </button>
                    </div>
                  </div>
                ) : null })()}

                {/* PARTNER SHARING ENTRY — shown when no active share */}
                {!store.get(K.partnerShare)&&(
                  <button onClick={()=>setShowShareModal(true)}
                    className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Share2 size={18} className="text-purple-600"/>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-gray-800 text-sm">{t.partnerShareLabel}</p>
                      <p className="text-xs text-gray-500">{t.partnerShareDesc}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400"/>
                  </button>
                )}

                {/* VIEW PARTNER CALENDAR — enter code */}
                {!viewingPartner&&(
                  <button onClick={()=>{ setShareModalMode('view'); setShowShareModal(true) }}
                    className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-blue-600"/>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-gray-800 text-sm">
                        {lang==='sw'?'Ona Kalenda ya Mpenzi':'View Partner Calendar'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lang==='sw'?'Ingiza nambari ya kushiriki uliyopewa':'Enter a share code from your partner'}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400"/>
                  </button>
                )}

                {/* Sign out + delete */}
                <div className="flex gap-2 pt-1">
                  <button onClick={onLogout} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 text-gray-500 text-xs py-2.5 rounded-xl hover:bg-gray-50">
                    <LogOut size={12}/> {t.logout}
                  </button>
                  <button onClick={()=>setShowDeleteConfirm(true)} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-400 text-xs py-2.5 rounded-xl hover:bg-red-50">
                    <Trash2 size={12}/> {t.deleteAll}
                  </button>
                </div>
              </div>
            )}

            {/* Guest CTA */}
            {isGuest&&!user&&(
              <button onClick={()=>setShowLogin(true)} className="w-full text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
                <UserPlus size={16}/> {lang==='sw'?'Unda Wasifu wa Nova (Bure)':'Create Nova Profile (Free)'}
              </button>
            )}

            {/* Not logged in + not guest */}
            {!user&&!isGuest&&(
              <div className="flex gap-2">
                <button onClick={()=>setShowLogin(true)} className="flex-1 text-white font-bold py-3 rounded-2xl text-sm" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
                  <User size={14} className="inline mr-1"/>{lang==='sw'?'Ingia / Jiandikishe':'Sign In / Register'}
                </button>
                <button onClick={onGuest} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-sm hover:bg-gray-50">
                  <Eye size={14} className="inline mr-1"/>{t.guestBrowse}
                </button>
              </div>
            )}
          </div>
        )}

        {/* CYCLE — login required */}
        {activeTab==='cycle'&&(
          user
            ?(viewingPartner?<PartnerCalendarView lang={lang} onStop={stopViewingPartner}/>:<NovaCycleTracker lang={lang} user={user}/>)
            :(
              <div className="bg-pink-50 border border-pink-200 rounded-2xl p-6 text-center space-y-4">
                <div className="text-4xl">🌸</div>
                <h3 className="font-bold text-gray-800">{lang==='sw'?'Ingia Kufikia Mfumo wa Hedhi':'Sign In to Access Cycle Tracker'}</h3>
                <p className="text-sm text-gray-600">{lang==='sw'?'Mfumo wa hedhi unahitaji wasifu ili kuhifadhi data yako.':'The cycle tracker needs a profile to keep your personal data private.'}</p>
                <button onClick={()=>setShowLogin(true)} className="w-full text-white font-bold py-3 rounded-xl" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>{lang==='sw'?'Ingia au Jiandikishe':'Sign In or Create Profile'}</button>
              </div>
            )
        )}

        {/* METHODS — public */}
        {activeTab==='methods'&&(
          <div className="space-y-3">
            <h2 className="font-bold text-gray-800 text-lg">{lang==='sw'?'Njia za Uzazi wa Mpango':'Contraceptive Methods'}</h2>
            {METHODS.map(m=>(
              <button key={m.id} onClick={()=>setSelectedMethod(m)} className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-left hover:shadow-md transition-all flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:m.color+'20'}}>{m.emoji}</div>
                <div className="flex-1"><p className="font-bold text-gray-800 text-sm">{m.name[lang]}</p><p className="text-xs text-gray-500 mt-0.5">{m.efficacy} · {m.duration[lang]}</p></div>
                <ChevronRight size={16} className="text-gray-400"/>
              </button>
            ))}
          </div>
        )}

        {/* SELF INJECT — public */}
        {activeTab==='inject'&&(
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">{lang==='sw'?'Kujisindania Sayana Press':'Sayana Press Self-Injection'}</h2>
            {MAPS_STEPS[lang].map((step,i)=>(
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>{step.letter}</div>
                  <div className="flex-1"><p className="font-bold text-gray-800">{step.word}</p><p className="text-xs text-gray-400">{lang==='sw'?`Hatua ${i+1} ya 4`:`Step ${i+1} of 4`}</p></div>
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{step.instruction}</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"><p className="text-xs text-amber-700">💡 {step.tip}</p></div>
              </div>
            ))}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="font-bold text-red-700 text-sm mb-2">🚨 {lang==='sw'?'Nenda kliniki MARA MOJA ukiona:':'Go to clinic IMMEDIATELY if:'}</p>
              {(lang==='sw'?['Maumivu makali ya kichwa na mabadiliko ya maono','Uvimbe, usaha mahali pa sindano','Maumivu makali ya tumbo']:['Severe headache with vision changes','Swelling or pus at injection site','Severe abdominal pain']).map((s,i)=><p key={i} className="text-sm text-red-600 mb-1">• {s}</p>)}
            </div>
          </div>
        )}

        {/* DATE — public */}
        {activeTab==='date'&&<DateCalc lang={lang}/>}

        {/* AI — public for guest (limited), full for logged-in */}
        {activeTab==='ai'&&(
          user
            ?<AskNova lang={lang} user={user}/>
            :(
              <div className="space-y-4">
                {(isGuest||!user)&&(
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-4">
                    <p className="font-bold text-gray-700 text-sm mb-1">🌸 {lang==='sw'?'Unauliza kama Mgeni':'Asking as Guest'}</p>
                    <p className="text-xs text-gray-500">{lang==='sw'?'Unda wasifu kupata mazungumzo yaliyohifadhiwa na uzoefu kamili.':'Create a profile for saved conversations and full experience.'}</p>
                  </div>
                )}
                <AskNova lang={lang} user={null}/>
                <button onClick={()=>setShowLogin(true)} className="w-full text-white font-bold py-3 rounded-xl text-sm" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
                  <UserPlus size={14} className="inline mr-1"/>{lang==='sw'?'Unda Wasifu kwa Uzoefu Kamili':'Create Profile for Full Experience'}
                </button>
              </div>
            )
        )}

        {/* CLINIC — public */}
        {activeTab==='clinic'&&<ClinicFinder lang={lang}/>}
      </div>

      {selectedMethod&&<MethodModal method={selectedMethod} lang={lang} onClose={()=>setSelectedMethod(null)}/>}
    </div>
  )
}
