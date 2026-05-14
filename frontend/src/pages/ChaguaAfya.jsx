import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Calendar, ArrowLeft, Send,
         Globe, Phone, Heart, Shield, Info, RefreshCw } from 'lucide-react'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash'

// ── LANGUAGE ──────────────────────────────────────────────────────────────────
const T = {
  en: {
    appName: 'Chagua Afya',
    tagline: 'Your Family Planning Guide',
    back: 'Back',
    tabs: ['🏠 Home', '💊 Methods', '💉 Self-Inject', '📅 My Date', '💬 Ask AI', '📞 Help'],
    homeTitle: 'Welcome to Chagua Afya',
    homeSubtitle: 'Private, trusted family planning information — no login needed',
    homeCards: [
      { emoji: '💊', title: 'Learn about methods', desc: 'Compare all contraceptive options', tab: 'methods' },
      { emoji: '💉', title: 'Self-injection guide', desc: 'Step-by-step MAPS guide for Sayana Press', tab: 'inject' },
      { emoji: '📅', title: 'Next injection date', desc: 'Calculate when your next injection is due', tab: 'date' },
      { emoji: '💬', title: 'Ask our AI', desc: 'Private answers to your FP questions', tab: 'ai' },
    ],
    privacyNote: '🔒 This page is private and does not store any personal information.',
    methodsTitle: 'Contraceptive Methods',
    methodsSubtitle: 'Learn about each method — tap to read more',
    injectTitle: 'Sayana Press Self-Injection',
    injectSubtitle: 'MAPS — 4 steps to safe self-injection',
    dateTitle: 'Next Injection Calculator',
    dateLastLabel: 'Date of last injection:',
    dateBtn: 'Calculate',
    dateResult: 'Your next injection is due:',
    dateGrace: 'Grace period ends:',
    dateWarning: 'After this date, see a provider before injecting.',
    aiTitle: 'Ask a Question',
    aiSubtitle: 'Private AI answers about family planning',
    aiPlaceholder: 'Type your question here...',
    aiStarters: [
      'How do I inject myself with Sayana Press?',
      'I have not had my period since starting the injection — is this normal?',
      'What is the best method for a breastfeeding mother?',
      'How do I know if I am pregnant while using contraception?',
    ],
    helpTitle: 'Get Help',
    helpClinic: 'Call a clinic near you',
    helpTollFree: 'Toll-free health line',
    whatsappSoon: 'WhatsApp chatbot — coming soon',
    ussdSoon: 'USSD *384# — coming soon (no internet needed)',
    sideTitle: 'Side Effects Guide',
    normal: '✅ Normal',
    goClinic: '🚨 Go to clinic if:',
  },
  sw: {
    appName: 'Chagua Afya',
    tagline: 'Mwongozo wako wa Uzazi wa Mpango',
    back: 'Rudi',
    tabs: ['🏠 Nyumbani', '💊 Njia', '💉 Jisindanie', '📅 Tarehe Yangu', '💬 Uliza AI', '📞 Msaada'],
    homeTitle: 'Karibu Chagua Afya',
    homeSubtitle: 'Habari za uzazi wa mpango — za faragha, bila kuingia',
    homeCards: [
      { emoji: '💊', title: 'Jifunze kuhusu njia', desc: 'Linganisha njia zote za uzazi wa mpango', tab: 'methods' },
      { emoji: '💉', title: 'Mwongozo wa kusindania', desc: 'Hatua za MAPS kwa Sayana Press', tab: 'inject' },
      { emoji: '📅', title: 'Tarehe ya sindano ijayo', desc: 'Hesabu wakati wa sindano yako ijayo', tab: 'date' },
      { emoji: '💬', title: 'Uliza AI yetu', desc: 'Majibu ya faragha kwa maswali yako', tab: 'ai' },
    ],
    privacyNote: '🔒 Ukurasa huu ni wa faragha na hauhifadhi taarifa yoyote ya kibinafsi.',
    methodsTitle: 'Njia za Uzazi wa Mpango',
    methodsSubtitle: 'Jifunze kuhusu kila njia — bonyeza kusoma zaidi',
    injectTitle: 'Kujisindania Sayana Press',
    injectSubtitle: 'MAPS — Hatua 4 za kujisindania salama',
    dateTitle: 'Hesabu Tarehe ya Sindano Ijayo',
    dateLastLabel: 'Tarehe ya sindano ya mwisho:',
    dateBtn: 'Hesabu',
    dateResult: 'Sindano yako ijayo ni:',
    dateGrace: 'Muda wa neema unaisha:',
    dateWarning: 'Baada ya tarehe hii, ona mtoa huduma kabla ya kusindania.',
    aiTitle: 'Uliza Swali',
    aiSubtitle: 'Majibu ya AI ya faragha kuhusu uzazi wa mpango',
    aiPlaceholder: 'Andika swali lako hapa...',
    aiStarters: [
      'Ninajisindaniaje na Sayana Press?',
      'Sijapata hedhi tangu nianze sindano — ni kawaida?',
      'Njia bora kwa mama anayenyonyesha ni ipi?',
      'Ninajuaje kama mimi ni mjamzito nikiwa natumia uzazi wa mpango?',
    ],
    helpTitle: 'Pata Msaada',
    helpClinic: 'Piga simu kliniki karibu nawe',
    helpTollFree: 'Mstari wa afya bila malipo',
    whatsappSoon: 'Chatbot ya WhatsApp — inakuja hivi karibuni',
    ussdSoon: 'USSD *384# — inakuja (hata bila intaneti)',
    sideTitle: 'Mwongozo wa Madhara',
    normal: '✅ Kawaida',
    goClinic: '🚨 Nenda kliniki ukiona:',
  }
}

// ── METHODS DATA ───────────────────────────────────────────────────────────────
const METHODS = [
  {
    id: 'dmpa_sc', emoji: '💉', name: { en: 'Sayana Press (Self-injection)', sw: 'Sayana Press (Kujisindania)' },
    efficacy: '99%', duration: { en: '13 weeks', sw: 'Wiki 13' },
    color: '#14a044',
    desc: {
      en: 'A small injection you can give yourself at home. Works for 13 weeks. Most women stop having periods after a few months — this is normal and safe.',
      sw: 'Sindano ndogo unayoweza kujipa nyumbani. Inafanya kazi kwa wiki 13. Wanawake wengi huacha kupata hedhi baada ya miezi michache — hii ni kawaida na salama.'
    },
    pros: {
      en: ['Private — no one needs to know', 'Can do at home', 'No daily pill to remember', 'Reversible'],
      sw: ['Faragha — hakuna anayehitaji kujua', 'Unaweza kufanya nyumbani', 'Hakuna kidonge cha kila siku', 'Inaweza kubadilishwa']
    },
    cons: {
      en: ['Requires training first', 'Irregular bleeding at start', 'May delay return of fertility'],
      sw: ['Inahitaji mafunzo kwanza', 'Kutokwa damu isiyo ya kawaida mwanzoni', 'Inaweza kuchelewesha kurudi kwa uzazi']
    }
  },
  {
    id: 'implant', emoji: '🔵', name: { en: 'Implant (Implanon/Jadelle)', sw: 'Kipandikizi' },
    efficacy: '99%+', duration: { en: '3–5 years', sw: 'Miaka 3–5' },
    color: '#7c3aed',
    desc: {
      en: 'A small rod placed under the skin of your upper arm by a trained provider. You cannot feel it. Works for 3-5 years and can be removed anytime.',
      sw: 'Fimbo ndogo inayowekwa chini ya ngozi ya mkono wa juu na mtoa huduma aliyefunzwa. Huwezi kuihisi. Inafanya kazi kwa miaka 3-5 na inaweza kuondolewa wakati wowote.'
    },
    pros: {
      en: ['Most effective reversible method', 'Nothing to remember', 'Very private', 'Can be removed anytime'],
      sw: ['Njia bora zaidi ya kubadilishwa', 'Hakuna cha kukumbuka', 'Ni ya faragha sana', 'Inaweza kuondolewa wakati wowote']
    },
    cons: {
      en: ['Needs provider to insert and remove', 'May cause irregular bleeding'],
      sw: ['Inahitaji mtoa huduma kuweka na kuondoa', 'Inaweza kusababisha kutokwa damu isiyo ya kawaida']
    }
  },
  {
    id: 'coc', emoji: '💊', name: { en: 'Combined Pill (COC)', sw: 'Kidonge cha Pamoja (COC)' },
    efficacy: '91–99%', duration: { en: 'Daily', sw: 'Kila siku' },
    color: '#ec4899',
    desc: {
      en: 'A pill taken every day at the same time. Contains two hormones. Must not be used by breastfeeding mothers in the first 6 months.',
      sw: 'Kidonge kinachochukuliwa kila siku kwa wakati mmoja. Ina homoni mbili. Haifai kwa mama anayenyonyesha katika miezi 6 ya kwanza.'
    },
    pros: {
      en: ['Easy to use', 'Lighter periods', 'Can stop anytime', 'Reduces period pain'],
      sw: ['Rahisi kutumia', 'Hedhi nyepesi', 'Unaweza kusimama wakati wowote', 'Hupunguza maumivu ya hedhi']
    },
    cons: {
      en: ['Must take every day', 'Not for smokers over 35', 'Not for breastfeeding <6 months'],
      sw: ['Lazima uchukuliwe kila siku', 'Si kwa wavutaji sigara zaidi ya 35', 'Si kwa kunyonyesha <miezi 6']
    }
  },
  {
    id: 'condom', emoji: '🛡️', name: { en: 'Condom (Male or Female)', sw: 'Kondomu' },
    efficacy: '85–98%', duration: { en: 'Single use', sw: 'Matumizi moja' },
    color: '#0d7377',
    desc: {
      en: 'The ONLY method that protects against both pregnancy AND STIs/HIV. Use every time you have sex.',
      sw: 'Njia PEKEE inayolinda dhidi ya ujauzito NA magonjwa ya zinaa/VVU. Tumia kila wakati wa kujamiiana.'
    },
    pros: {
      en: ['Protects against HIV and STIs', 'No hormones', 'Available everywhere', 'Immediate protection'],
      sw: ['Inalinda dhidi ya VVU na STI', 'Hakuna homoni', 'Inapatikana kila mahali', 'Ulinzi wa haraka']
    },
    cons: {
      en: ['Must use every time', 'Can break if not used correctly', 'Less effective than hormonal methods'],
      sw: ['Lazima itumike kila wakati', 'Inaweza kupasuka ikiwa haitumiwi vizuri', 'Ina ufanisi mdogo kuliko njia za homoni']
    }
  },
  {
    id: 'iud', emoji: '🔩', name: { en: 'Copper IUD (Cu-T)', sw: 'IUD ya Shaba' },
    efficacy: '99%+', duration: { en: '10–12 years', sw: 'Miaka 10–12' },
    color: '#f59e0b',
    desc: {
      en: 'A small T-shaped device placed in the womb by a trained provider. No hormones. Works for 10-12 years and can also be used as emergency contraception within 5 days.',
      sw: 'Kifaa kidogo chenye umbo la T kilichowekwa kwenye mfuko wa uzazi na mtoa huduma aliyefunzwa. Hakuna homoni. Inafanya kazi kwa miaka 10-12 na inaweza pia kutumika kama uzazi wa mpango wa dharura ndani ya siku 5.'
    },
    pros: {
      en: ['Most effective emergency contraception', 'No hormones', 'Long-lasting', 'Can be removed anytime'],
      sw: ['Uzazi wa mpango bora wa dharura', 'Hakuna homoni', 'Inadumu muda mrefu', 'Inaweza kuondolewa wakati wowote']
    },
    cons: {
      en: ['Needs trained provider', 'Can cause heavier periods', 'Does not protect against STIs'],
      sw: ['Inahitaji mtoa huduma aliyefunzwa', 'Inaweza kusababisha hedhi nzito zaidi', 'Haizuii magonjwa ya zinaa']
    }
  },
]

// ── MAPS STEPS ─────────────────────────────────────────────────────────────────
const MAPS = {
  en: [
    { letter: 'M', word: 'Mix', icon: '🔄', instruction: 'Shake the Sayana Press device vigorously for 30 seconds until the liquid looks cloudy and milky.', tip: 'If you do not shake well, the medicine may not work properly.' },
    { letter: 'A', word: 'Activate', icon: '🔘', instruction: 'Firmly push the needle cap and the reservoir port together until you hear or feel a click.', tip: 'You MUST hear or feel the click. No click = not ready.' },
    { letter: 'P', word: 'Pinch', icon: '🤏', instruction: 'Pinch a fold of skin on your lower belly (2 fingers from navel) or upper thigh. Keep pinching until done.', tip: 'Hold the pinch firmly throughout the whole injection.' },
    { letter: 'S', word: 'Self-inject', icon: '💉', instruction: 'Insert the needle at a 45° angle into the pinched skin. Slowly squeeze the reservoir until it is completely empty (about 5 seconds).', tip: 'Remove needle while still pinching. Press gently — do NOT rub the site.' },
  ],
  sw: [
    { letter: 'M', word: 'Changanya', icon: '🔄', instruction: 'Tikisa kifaa cha Sayana Press kwa nguvu kwa sekunde 30 hadi dawa ionekane na ukungu kama maziwa.', tip: 'Usitikise vizuri, dawa inaweza kutofanya kazi.' },
    { letter: 'A', word: 'Washa', icon: '🔘', instruction: 'Bonyeza kofia ya sindano na bandari ya hifadhi pamoja kwa nguvu hadi usikie au uhisi kubonyeza.', tip: 'LAZIMA usikie au uhisi kubonyeza. Hakuna click = haiko tayari.' },
    { letter: 'P', word: 'Piga Pinch', icon: '🤏', instruction: 'Piga ngozi kwenye tumbo la chini (vidole 2 kutoka kitovuni) au mapaja ya juu. Endelea kushikilia hadi mwisho.', tip: 'Shika pinch kwa nguvu wakati wote wa sindano.' },
    { letter: 'S', word: 'Jisindanie', icon: '💉', instruction: 'Ingiza sindano kwa pembe ya 45° kwenye ngozi iliyoshikiliwa. Bonyeza hifadhi polepole hadi tupu (sekunde 5).', tip: 'Toa sindano ukishikilia ngozi. Bonyeza kidogo — USISUGUE.' },
  ]
}

// ── SIDE EFFECTS ───────────────────────────────────────────────────────────────
const SIDE_EFFECTS = {
  en: [
    { effect: 'No periods (amenorrhoea)', normal: true, info: 'Very common with DMPA-SC/Implant. Your blood is NOT accumulating inside — your body simply is not producing it. This is a benefit for many women.' },
    { effect: 'Irregular spotting or bleeding', normal: true, info: 'Common in the first 3-6 months. Usually settles over time. Do not stop your method because of this — talk to a provider first.' },
    { effect: 'Mild headaches', normal: true, info: 'Drink water, rest. If headaches are severe or come with vision changes — go to a clinic immediately.' },
    { effect: 'Small weight changes', normal: true, info: 'Some women notice minor changes. Stay active and eat well. This varies between individuals.' },
  ],
  sw: [
    { effect: 'Kutokuwa na hedhi', normal: true, info: 'Kawaida sana na DMPA-SC/Kipandikizi. Damu HAIKUSANYIKI ndani — mwili wako hauitengenezi tu. Hii ni faida kwa wanawake wengi.' },
    { effect: 'Kutokwa damu kidogo', normal: true, info: 'Kawaida katika miezi 3-6 ya kwanza. Kawaida inakaa baada ya muda. Usisimamishe njia yako kwa sababu ya hii — ongea na mtoa huduma kwanza.' },
    { effect: 'Maumivu ya kichwa madogo', normal: true, info: 'Kunywa maji, pumzika. Ikiwa maumivu ni makali au yana mabadiliko ya maono — nenda kliniki mara moja.' },
    { effect: 'Mabadiliko madogo ya uzito', normal: true, info: 'Wanawake wengine wanaona mabadiliko madogo. Kuwa hai na kula vizuri. Hii inatofautiana kati ya watu.' },
  ]
}

const DANGER_SIGNS = {
  en: ['Severe headache with vision changes', 'Severe pain in the belly', 'Swelling, redness or pus at injection site', 'Feeling pregnant (missed period + other signs)'],
  sw: ['Maumivu makali ya kichwa na mabadiliko ya maono', 'Maumivu makali tumboni', 'Uvimbe, uwekundu au usaha mahali pa sindano', 'Kuhisi mjamzito (kukosa hedhi + dalili nyingine)']
}

// ── DATE CALCULATOR ────────────────────────────────────────────────────────────
function DateCalculator({ lang }) {
  const t = T[lang]
  const [lastDate, setLastDate] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    if (!lastDate) return
    const d = new Date(lastDate)
    const next = new Date(d.getTime() + 91 * 24 * 60 * 60 * 1000) // 13 weeks
    const grace = new Date(d.getTime() + 119 * 24 * 60 * 60 * 1000) // 17 weeks
    setResult({ next, grace })
  }

  const fmt = (d) => d.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <label className="block text-sm text-gray-600 mb-2 font-medium">{t.dateLastLabel}</label>
        <input type="date"
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-400"
          value={lastDate}
          onChange={e => { setLastDate(e.target.value); setResult(null) }}
          aria-label={t.dateLastLabel}
        />
        <button onClick={calculate} disabled={!lastDate}
          className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition-colors"
          style={{background: lastDate ? 'linear-gradient(135deg,#0d7377,#14a044)' : undefined}}>
          {t.dateBtn}
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="bg-teal-50 border border-teal-300 rounded-2xl p-5">
            <p className="text-xs text-teal-600 font-bold uppercase tracking-wide mb-1">{t.dateResult}</p>
            <p className="text-xl font-bold text-teal-700">{fmt(result.next)}</p>
          </div>
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wide mb-1">{t.dateGrace}</p>
            <p className="text-base font-bold text-amber-700">{fmt(result.grace)}</p>
            <p className="text-xs text-amber-600 mt-2">⚠️ {t.dateWarning}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── AI CHAT ────────────────────────────────────────────────────────────────────
function AskAI({ lang }) {
  const t = T[lang]
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  const systemPrompt = `You are a friendly, warm family planning health assistant for women and girls in Kenya.
Language: ${lang === 'sw' ? 'Respond in simple, friendly Kiswahili. Avoid medical jargon.' : 'Respond in simple, friendly English.'}
Scope: ONLY answer questions about family planning, contraception, self-injection, side effects, when to see a doctor.
For anything else say: "${lang === 'sw' ? 'Ninajibu maswali kuhusu uzazi wa mpango tu.' : 'I only answer family planning questions.'}"
Tone: Warm, non-judgmental, like a trusted older sister or community health worker.
Format: Short paragraphs. No asterisks. No markdown. Simple numbered lists for steps.
Always end with: If you have any concerns, please visit your nearest health facility.
Danger signs — always refer to clinic: severe headache + vision changes, severe abdominal pain, signs of infection at injection site.`

  const send = async (text) => {
    const msg = text || input
    if (!msg.trim() || loading) return
    setInput('')
    const newMsgs = [...messages, { role: 'user', content: msg }]
    setMessages(newMsgs)
    setLoading(true)
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

    try {
      if (!GEMINI_KEY) throw new Error('no-key')
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: newMsgs.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
            generation_config: { temperature: 0.3, max_output_tokens: 400 }
          }) }
      )
      if (res.status === 429) throw new Error('429')
      const data = await res.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!reply) throw new Error('empty')
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      const msg429 = lang === 'sw' ? '⏳ Subiri sekunde 30 kisha jaribu tena.' : '⏳ Too many requests. Please wait 30 seconds and try again.'
      const msgErr = lang === 'sw' ? '⚠️ Hitilafu. Jaribu tena au wasiliana na kliniki.' : '⚠️ Could not get a response. Please try again or contact your clinic.'
      const msgKey = lang === 'sw' ? 'ℹ️ Huduma ya AI haipo. Wasiliana na kliniki yako kwa maswali ya kimatibabu.' : 'ℹ️ AI service is not available. Please contact your nearest clinic for medical questions.'
      setMessages(prev => [...prev, { role: 'assistant', content: e.message === '429' ? msg429 : e.message === 'no-key' ? msgKey : msgErr }])
    } finally {
      setLoading(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  return (
    <div className="space-y-3">
      {/* Starter questions */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium text-center mb-3">
            {lang === 'sw' ? 'Uliza swali lolote:' : 'Ask anything:'}
          </p>
          {t.aiStarters.map((q, i) => (
            <button key={i} onClick={() => send(q)}
              className="w-full text-left bg-white border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-700 hover:bg-teal-50 transition-colors flex items-center justify-between gap-2">
              <span>{q}</span><ChevronRight size={14} className="flex-shrink-0 text-teal-400"/>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                  ${m.role === 'user' ? 'text-white' : 'bg-pink-500 text-white'}`}
                  style={m.role === 'user' ? {background:'#0d7377'} : {}}>
                  {m.role === 'user' ? 'You' : '🌸'}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                  ${m.role === 'user' ? 'text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'}`}
                  style={m.role === 'user' ? {background:'#0d7377'} : {}}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-xs text-white">🌸</div>
                <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-pink-300" style={{animation:`bounce 1s infinite ${i*0.2}s`}}/>)}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2 bg-white">
            <button onClick={() => setMessages([])}
              className="text-xs text-gray-400 hover:text-teal-600 flex items-center gap-1 flex-shrink-0">
              <RefreshCw size={12}/> {lang === 'sw' ? 'Upya' : 'New'}
            </button>
            <input
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder={t.aiPlaceholder}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${input.trim() ? '' : 'bg-gray-300'}`}
              style={input.trim() ? {background:'#ec4899'} : {}}>
              <Send size={14}/>
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
    </div>
  )
}

// ── METHOD DETAIL MODAL ────────────────────────────────────────────────────────
function MethodModal({ method, lang, onClose }) {
  const t = T[lang]
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{method.emoji}</span>
            <div>
              <p className="font-bold text-gray-800">{method.name[lang]}</p>
              <p className="text-xs text-gray-400">{method.efficacy} effective · {method.duration[lang]}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">×</button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{method.desc[lang]}</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-bold text-green-700 text-sm mb-2">✅ {lang === 'sw' ? 'Faida' : 'Benefits'}</p>
            {method.pros[lang].map((p, i) => <p key={i} className="text-sm text-green-700 mb-1">• {p}</p>)}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-bold text-amber-700 text-sm mb-2">⚠️ {lang === 'sw' ? 'Mambo ya Kuzingatia' : 'Things to Know'}</p>
            {method.cons[lang].map((c, i) => <p key={i} className="text-sm text-amber-700 mb-1">• {c}</p>)}
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p className="text-sm text-teal-700 font-medium">
              {lang === 'sw'
                ? '🏥 Ongea na mtoa huduma wako wa afya ili kupata njia inayofaa kwako.'
                : '🏥 Talk to your health provider to find the right method for you.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function ChaguaAfya() {
  const navigate = useNavigate()
  const [lang, setLang] = useState('en')
  const [activeTab, setActiveTab] = useState('home')
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [expandedEffect, setExpandedEffect] = useState(null)
  const t = T[lang]
  const maps = MAPS[lang]
  const effects = SIDE_EFFECTS[lang]
  const dangers = DANGER_SIGNS[lang]
  const methods = METHODS

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 text-white shadow-lg"
        style={{background:'linear-gradient(135deg,#ec4899 0%,#f59e0b 100%)'}}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label={t.back}>
              <ArrowLeft size={18}/>
            </button>
            <div>
              <p className="font-bold text-base leading-tight">🌸 {t.appName}</p>
              <p className="text-xs opacity-80 leading-tight">{t.tagline}</p>
            </div>
          </div>
          {/* Language toggle */}
          <div className="flex bg-white/20 rounded-xl overflow-hidden">
            {['en','sw'].map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${lang === l ? 'bg-white text-pink-600' : 'text-white'}`}
                aria-label={l === 'en' ? 'English' : 'Kiswahili'}
                aria-pressed={lang === l}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto bg-white border-b border-gray-200 shadow-sm">
        <div className="flex max-w-lg mx-auto px-2 py-2 gap-1 min-w-max">
          {['home','methods','inject','date','ai','help'].map((key, i) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors
                ${activeTab === key ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              style={activeTab === key ? {background:'linear-gradient(135deg,#ec4899,#f59e0b)'} : {}}
              aria-selected={activeTab === key} role="tab">
              {t.tabs[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-10">

        {/* HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5 text-white shadow-lg"
              style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
              <h1 className="text-xl font-bold">{t.homeTitle}</h1>
              <p className="text-sm mt-1 opacity-90">{t.homeSubtitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {t.homeCards.map((card, i) => (
                <button key={i} onClick={() => setActiveTab(card.tab)}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-left hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="text-3xl mb-2">{card.emoji}</div>
                  <p className="font-bold text-gray-800 text-sm">{card.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
                </button>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <Shield size={16} className="text-blue-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-blue-700">{t.privacyNote}</p>
            </div>
          </div>
        )}

        {/* METHODS */}
        {activeTab === 'methods' && (
          <div className="space-y-3">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{t.methodsTitle}</h2>
              <p className="text-sm text-gray-500">{t.methodsSubtitle}</p>
            </div>
            {methods.map(m => (
              <button key={m.id} onClick={() => setSelectedMethod(m)}
                className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-left hover:shadow-md transition-all flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{background: m.color + '20'}}>
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{m.name[lang]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.efficacy} effective · {m.duration[lang]}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400"/>
              </button>
            ))}
            {/* Side effects accordion */}
            <div className="mt-4">
              <h3 className="font-bold text-gray-700 mb-2">{t.sideTitle}</h3>
              {effects.map((e, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 mb-2 overflow-hidden">
                  <button className="w-full flex items-center justify-between px-4 py-3 text-left"
                    onClick={() => setExpandedEffect(expandedEffect === i ? null : i)}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{t.normal}</span>
                      <span className="text-sm font-medium text-gray-700">{e.effect}</span>
                    </div>
                    <ChevronRight size={14} className={`text-gray-400 transition-transform ${expandedEffect === i ? 'rotate-90' : ''}`}/>
                  </button>
                  {expandedEffect === i && (
                    <div className="px-4 pb-3">
                      <p className="text-sm text-gray-600 leading-relaxed">{e.info}</p>
                    </div>
                  )}
                </div>
              ))}
              {/* Danger signs */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
                <p className="font-bold text-red-700 text-sm mb-2">{t.goClinic}</p>
                {dangers.map((d, i) => <p key={i} className="text-sm text-red-600 mb-1">• {d}</p>)}
              </div>
            </div>
          </div>
        )}

        {/* SELF INJECT */}
        {activeTab === 'inject' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{t.injectTitle}</h2>
              <p className="text-sm text-gray-500">{t.injectSubtitle}</p>
            </div>
            {maps.map((step, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
                    style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
                    {step.letter}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{step.word}</p>
                    <p className="text-xs text-gray-400">{lang === 'sw' ? `Hatua ${i+1} ya 4` : `Step ${i+1} of 4`}</p>
                  </div>
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{step.instruction}</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-700">💡 {step.tip}</p>
                </div>
              </div>
            ))}
            {/* Danger signs */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="font-bold text-red-700 text-sm mb-2">{t.goClinic}</p>
              {dangers.map((d, i) => <p key={i} className="text-sm text-red-600 mb-1">• {d}</p>)}
            </div>
          </div>
        )}

        {/* DATE CALCULATOR */}
        {activeTab === 'date' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{t.dateTitle}</h2>
            </div>
            <DateCalculator lang={lang}/>
          </div>
        )}

        {/* AI */}
        {activeTab === 'ai' && (
          <div className="space-y-3">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{t.aiTitle}</h2>
              <p className="text-sm text-gray-500">{t.aiSubtitle}</p>
            </div>
            <AskAI lang={lang}/>
          </div>
        )}

        {/* HELP */}
        {activeTab === 'help' && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-800 text-lg">{t.helpTitle}</h2>

            {/* Toll-free */}
            <a href="tel:0800723253"
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <Phone size={22} className="text-teal-600"/>
              </div>
              <div>
                <p className="font-bold text-gray-800">{t.helpTollFree}</p>
                <p className="text-xl font-black text-teal-600">0800 723 253</p>
                <p className="text-xs text-gray-400">{lang === 'sw' ? 'Bila malipo · Kenya MOH' : 'Free call · Kenya MOH'}</p>
              </div>
            </a>

            {/* WhatsApp placeholder */}
            <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 opacity-60">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div>
                <p className="font-bold text-gray-700">{t.whatsappSoon}</p>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Coming Soon</span>
              </div>
            </div>

            {/* USSD placeholder */}
            <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 opacity-60">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Phone size={22} className="text-blue-600"/>
              </div>
              <div>
                <p className="font-bold text-gray-700">{t.ussdSoon}</p>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Coming Soon</span>
              </div>
            </div>

            {/* Privacy note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-2">
              <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-blue-700">{t.privacyNote}</p>
            </div>
          </div>
        )}
      </div>

      {/* Method Modal */}
      {selectedMethod && (
        <MethodModal method={selectedMethod} lang={lang} onClose={() => setSelectedMethod(null)}/>
      )}
    </div>
  )
}
