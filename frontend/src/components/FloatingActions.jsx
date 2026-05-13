import { useState, useRef, useEffect } from 'react'
import { X, Send, Mail, MessageCircle, ChevronRight, RefreshCw, Globe, BookOpen } from 'lucide-react'
import { getCurrentUser } from '../utils/auth.js'
import { getFacilitySettings } from '../utils/facilitySettings.js'

// ── CONFIG ──────────────────────────────────────────────────
const SUPPORT_EMAIL = 'felix_ontita@insupplyhealth.com'
const WHATSAPP_NUMBER = '254725622786'
const GEMINI_MODEL = 'gemini-2.5-flash'

// ── FP KNOWLEDGE BASE (RAG Fence) ───────────────────────────
const buildSystemPrompt = (lang) => {
  const isSwahili = lang === 'sw'

  const base = `You are Fahamu, an AI clinical assistant embedded in AfyaMEC — Kenya's digital family planning counselling platform.

${isSwahili
  ? 'JIBU KWA KISWAHILI WAKATI MTUMIAJI ANAANDIKA KWA KISWAHILI.'
  : 'RESPOND IN ENGLISH. If the user writes in Swahili, respond in Swahili.'}

=== IDENTITY ===
Name: Fahamu (Swahili: "Understanding")
Role: FP clinical decision support assistant for Kenya healthcare providers
Platform: AfyaMEC — Kenya MOH digital family planning tool

=== HARD SCOPE FENCE — CRITICAL ===
You are EXCLUSIVELY a Family Planning assistant.
PERMITTED topics: contraception, FP methods, MEC eligibility, BCS+ counselling, DMPA-SC self-injection, postpartum FP, adolescent SRH, HIV/FP interactions, MOH reporting tools (512/711/747A), reproductive health.
FORBIDDEN topics: Everything else including general medicine unrelated to FP, politics, cooking, current events, entertainment, geography, etc.
If asked ANYTHING outside permitted topics, respond EXACTLY:
"I'm Fahamu, specialised in family planning only. For questions about [topic], please use a general resource like Google or consult your supervisor. Can I help you with an FP question?"
DO NOT answer the non-FP question under any circumstances — not even briefly.

=== WEB SEARCH RULES ===
You have access to Google Search. Use it ONLY for:
- Recent updates to Kenya MOH FP guidelines (post-2023)
- New WHO MEC recommendations
- FP research and evidence updates
- Clarifications on specific FP clinical protocols
NEVER use web search for non-FP topics. If search returns non-FP results, ignore them entirely.

=== KNOWLEDGE PRIORITY ORDER ===
1. Kenya National FP Guidelines 6th Edition (2022) — PRIMARY
2. WHO Medical Eligibility Criteria 6th Edition (2025) — PRIMARY
3. WHO Selected Practice Recommendations 4th Edition — PRIMARY
4. BCS+ Algorithm Kenya MOH (2023) — PRIMARY
5. DMPA-SC Self-Injection Guidelines PATH/Kenya MOH — PRIMARY
6. Kenya ARSH Guidelines — PRIMARY
7. Web search results (FP topics only) — SECONDARY

=== FORMATTING RULES — CRITICAL ===
NEVER use asterisks (*word*) for any formatting — the UI does not render markdown.
Instead use these HTML tags which the UI DOES render:
- Bold: <strong>word</strong>
- Italic: <em>word</em>
- Code: <code>word</code>
Structure every response using emoji headers:
✅ Answer: — for the main answer
📋 Steps: — for procedures
⚠️ Caution: — for warnings or contraindications
🔍 Source: — for citations
Use bullet points with • not dashes.
Keep responses under 300 words unless a step-by-step procedure requires more.

=== CITATION RULES ===
End EVERY factual clinical statement with a source tag in this format:
<em>[Kenya FP Guidelines 2022]</em> or <em>[WHO MEC 6th Ed 2025]</em> or <em>[BCS+ 2023]</em> or <em>[Web: source name]</em>
When using web search results, label clearly: <em>[Web: website name]</em>
NEVER fabricate guidelines or MEC category numbers. If unsure, say: "I need to verify this — please check your Kenya FP Guidelines directly."

=== CLINICAL FACTS — NEVER CONTRADICT THESE ===

<strong>CATEGORY 4 ABSOLUTE CONTRAINDICATIONS:</strong>
- COC + migraine WITH aura (any age) <em>[WHO MEC 6th Ed]</em>
- COC + BP ≥160/100 <em>[WHO MEC 6th Ed]</em>
- COC + current breast cancer <em>[WHO MEC 6th Ed]</em>
- COC + postpartum <21 days non-breastfeeding <em>[WHO MEC 6th Ed]</em>
- COC + breastfeeding <6 weeks <em>[WHO MEC 6th Ed]</em>
- COC + smoking ≥35 years + ≥15 cigarettes/day <em>[WHO MEC 6th Ed]</em>
- IUD insertion + active PID or current STI <em>[WHO MEC 6th Ed]</em>
- ALL hormonal methods + current breast cancer <em>[WHO MEC 6th Ed]</em>

<strong>RETURN DATES:</strong>
- DMPA-IM: 12 weeks (grace: 16 weeks)
- DMPA-SC: 13 weeks (grace: 17 weeks)
- NET-EN: 8 weeks (grace: 10 weeks)
- COC/POP: 3-month supply
- Implant Implanon: 3 years | Jadelle: 5 years
- Cu-IUD: 10-12 years | LNG-IUS: 5-7 years

<strong>DMPA-SC MAPS SELF-INJECTION:</strong>
M — Mix: Shake vigorously 30 seconds
A — Activate: Push needle cap until click
P — Pinch: Fold of skin, 45° angle
S — Self-inject: Squeeze slowly until empty

<strong>LAM — ALL 3 required:</strong>
1. Baby <6 months
2. Fully breastfeeding day and night
3. No periods returned
If ANY fails → start another method immediately <em>[Kenya FP Guidelines 2022]</em>

<strong>BCS+ 4 STAGES:</strong>
Stage 1: Pre-Choice (steps 1-5) — rapport, rule out pregnancy, display ALL method cards
Stage 2: Method Choice (steps 6-8) — present by efficacy, client chooses, confirm MEC
Stage 3: Post-Choice (steps 9-11) — counsel, check comprehension, provide method
Stage 4: STI/HIV (steps 12-15) — risk assessment, offer HTC, follow-up date
<em>[BCS+ Kenya MOH 2023]</em>

=== LANGUAGE ===
${isSwahili
  ? 'Jibu kwa Kiswahili. Tumia HTML tags kwa uumbizaji: <strong>neno</strong> badala ya **neno**.'
  : 'Respond in English. Use HTML tags for formatting: <strong>word</strong> not **word**.'}
`
  return base
}

const QUICK_TOPICS = [
  {
    emoji: '💊', label: 'Pills', labelSw: 'Vidonge',
    questions: [
      'COC side effects and how to counsel clients',
      'Who cannot use COC — contraindications list',
      'What to do if a client misses a pill',
      'POP vs COC — which for breastfeeding mothers?'
    ],
    questionsSw: [
      'Madhara ya COC na jinsi ya kushauri wateja',
      'Nani hawezi kutumia COC — orodha ya vikwazo',
      'Nini kufanya ikiwa mteja amesahau kidonge',
      'POP au COC — ipi kwa mama anayenyonyesha?'
    ]
  },
  {
    emoji: '💉', label: 'Injectables', labelSw: 'Sindano',
    questions: [
      'DMPA-SC self-injection steps for clients',
      'How many take-home doses can I give with DMPA-SC?',
      'Client is late for DMPA injection — what do I do?',
      'DMPA-IM vs DMPA-SC — key differences'
    ],
    questionsSw: [
      'Hatua za kujisindania DMPA-SC kwa wateja',
      'Ninaweza kumpa mgonjwa sindano ngapi za nyumbani za DMPA-SC?',
      'Mteja amechelewa kwa sindano ya DMPA — nifanye nini?',
      'DMPA-IM dhidi ya DMPA-SC — tofauti kuu'
    ]
  },
  {
    emoji: '🩹', label: 'Implants & IUDs', labelSw: 'Vipandikizi na IUD',
    questions: [
      'PAINS warning signs for IUD — what to tell clients',
      'When should I defer IUD insertion?',
      'LNG-IUS vs Copper IUD — which for heavy periods?',
      'Implant — how to check if still in place'
    ],
    questionsSw: [
      'Dalili za PAINS kwa IUD — nini kumwambia mteja',
      'Ni lini ninapaswa kuahirisha kuweka IUD?',
      'LNG-IUS au Shaba IUD — ipi kwa hedhi nzito?',
      'Kipandikizi — jinsi ya kuangalia kama bado kipo'
    ]
  },
  {
    emoji: '⚕️', label: 'MEC Eligibility', labelSw: 'Usawa wa MEC',
    questions: [
      'Client with BP 160/100 — which methods are safe?',
      'HIV positive client — which FP methods can she use?',
      'Client has migraine with aura — can she use COC?',
      'What does WHO MEC Category 3 mean in practice?'
    ],
    questionsSw: [
      'Mteja ana BP 160/100 — njia zipi ni salama?',
      'Mteja ana VVU — njia zipi za uzazi wa mpango anaweza tumia?',
      'Mteja ana migraine na aura — anaweza kutumia COC?',
      'WHO MEC Kundi la 3 inamaanisha nini kivitendo?'
    ]
  },
  {
    emoji: '👤', label: 'Special Groups', labelSw: 'Makundi Maalum',
    questions: [
      'Adolescent FP counselling — Kenya ARSH guidelines',
      'Postpartum FP — when to start each method after delivery',
      'Post-abortion FP — which methods can start immediately?',
      'Emergency contraception — all options and timing'
    ],
    questionsSw: [
      'Ushauri wa FP kwa vijana — mwongozo wa ARSH Kenya',
      'FP baada ya kujifungua — ni lini kuanza kila njia?',
      'FP baada ya kutoa mimba — njia zipi zinaanza mara moja?',
      'Uzazi wa mpango wa dharura — chaguo zote na wakati'
    ]
  },
  {
    emoji: '📋', label: 'BCS+ Counselling', labelSw: 'Ushauri wa BCS+',
    questions: [
      'BCS+ algorithm — all 15 steps summary',
      'How to counsel a client who wants DMPA but has high BP',
      'WHO 6-question pregnancy exclusion checklist',
      'How to address side effect concerns from a client'
    ],
    questionsSw: [
      'Algorithm ya BCS+ — muhtasari wa hatua zote 15',
      'Jinsi ya kushauri mteja anayetaka DMPA lakini ana BP ya juu',
      'Orodha ya maswali 6 ya WHO ya kuondoa ujauzito',
      'Jinsi ya kushughulikia wasiwasi wa madhara kwa mteja'
    ]
  },
  {
    emoji: '📊', label: 'MOH Reporting', labelSw: 'Ripoti za MOH',
    questions: [
      'MOH 711 Section D — FP indicators explained',
      'How to complete MOH 747A commodity stock register',
      'Which data goes in MOH 512 vs MOH 711?',
      'DISC project SI/PA indicators — what to record'
    ],
    questionsSw: [
      'MOH 711 Sehemu D — viashiria vya FP vimeelezwa',
      'Jinsi ya kukamilisha rejista ya hisa ya MOH 747A',
      'Data gani inaenda MOH 512 dhidi ya MOH 711?',
      'Viashiria vya DISC SI/PA — nini kurekodi'
    ]
  },
  {
    emoji: '🌐', label: 'Ask any FP question', labelSw: 'Uliza swali lolote la FP',
    questions: [
      'What is the most effective reversible contraceptive available in Kenya?',
      'Latest WHO recommendations on self-care in family planning',
      'Fertility awareness methods — evidence and effectiveness',
      'Type your own question below ↓'
    ],
    questionsSw: [
      'Ni njia gani ya uzazi wa mpango inayoweza kubadilishwa yenye ufanisi zaidi Kenya?',
      'Mapendekezo ya hivi karibuni ya WHO kuhusu kujihudumia katika uzazi wa mpango',
      'Njia za kujua uzazi — ushahidi na ufanisi',
      'Andika swali lako mwenyewe hapa chini ↓'
    ]
  },
]

// ── FAHAMU CHATBOT ────────────────────────────────────────────
function FahamuChat({ onClose, apiKey }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('en')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [showTopics, setShowTopics] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const isSwahili = lang === 'sw'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const userMsg = (text || input).trim()
    if (!userMsg || loading) return
    setInput('')
    setShowTopics(false)
    setSelectedTopic(null)
    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const history = newMessages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
      const payload = {
        system_instruction: { parts: [{ text: buildSystemPrompt(lang) }] },
        contents: history,
        tools: [{ google_search: {} }],
        generation_config: { temperature: 0.3, max_output_tokens: 1024 }
      }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      )
      if (res.status === 429) {
        throw new Error('429')
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawReply) throw new Error('empty')
      const reply = rawReply
      const sources = data.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        sources: sources.map(s => s.web).filter(Boolean)
      }])
    } catch (e) {
      const is429 = e.message?.includes('429')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isSwahili
          ? (is429
              ? '⏳ Maombi mengi sana — subiri sekunde 30 kisha jaribu tena.'
              : '⚠️ Hitilafu ya muunganisho. Angalia mtandao wako na ujaribu tena.')
          : (is429
              ? '⏳ Too many requests — Gemini rate limit reached. Wait 30 seconds and try again.'
              : '⚠️ Connection error. Check your internet and try again. For urgent clinical questions, refer to your Kenya FP Guidelines.')
      }])
    } finally {
      setLoading(false)
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const formatText = (text) => {
    if (!text) return ''
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:11px">$1</code>')
      .replace(/\n- /g, '<br/>• ')
      .replace(/\n(\d+)\. /g, '<br/>$1. ')
      .replace(/\n/g, '<br/>')
  }

  const welcomeMsg = isSwahili
    ? `Habari! Mimi ni **Fahamu** 🌿 — msaidizi wako wa AI wa uzazi wa mpango.\n\nNimeundwa kwa Mwongozo wa MOH Kenya, WHO MEC Toleo la 6 (2025), na Itifaki ya BCS+.\n\nChagua mada hapa chini au andika swali lako:`
    : `Hello! I'm **Fahamu** 🌿 — your AI family planning assistant.\n\nI'm trained on Kenya MOH FP Guidelines, WHO MEC 6th Edition (2025), BCS+ Protocol, and DMPA-SC self-injection guidelines.\n\nI'll always cite my source and use web search when guidelines don't cover a topic.\n\nChoose a topic below or type your question:`

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
        style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm">
            🌿
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Ask Fahamu</p>
            <p className="text-xs text-teal-100 leading-tight">AI • FP Clinical Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex bg-white bg-opacity-20 rounded-lg overflow-hidden">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 text-xs font-bold transition-colors ${lang==='en' ? 'bg-white text-teal-700' : 'text-white hover:bg-white hover:bg-opacity-10'}`}>
              EN
            </button>
            <button
              onClick={() => setLang('sw')}
              className={`px-2 py-1 text-xs font-bold transition-colors ${lang==='sw' ? 'bg-white text-teal-700' : 'text-white hover:bg-white hover:bg-opacity-10'}`}>
              SW
            </button>
          </div>
          <button onClick={onClose} className="text-white hover:text-teal-200 ml-1">
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0"
        style={{background:'#f8fafb'}}>

        {/* Welcome */}
        <div className="flex gap-2">
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs"
            style={{background:'linear-gradient(135deg,#0d7377,#14a044)',color:'white'}}>
            F
          </div>
          <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm max-w-xs border border-gray-100">
            <p className="text-xs text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{__html: formatText(welcomeMsg)}}/>
          </div>
        </div>

        {/* Topic Cards */}
        {showTopics && (
          <div className="ml-9">
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_TOPICS.map((topic, i) => (
                <button key={i}
                  onClick={() => { setSelectedTopic(i); setShowTopics(false) }}
                  className="text-left bg-white border border-gray-200 rounded-xl px-2.5 py-2 hover:border-teal-400 hover:bg-teal-50 transition-all">
                  <p className="text-xs font-bold text-gray-700">
                    {topic.emoji} {isSwahili ? topic.labelSw : topic.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-questions after topic selected */}
        {selectedTopic !== null && messages.length === 0 && (
          <div className="ml-9">
            <button onClick={() => { setSelectedTopic(null); setShowTopics(true) }}
              className="text-xs text-teal-600 hover:underline mb-2 flex items-center gap-1">
              ← {isSwahili ? 'Rudi kwa mada' : 'Back to topics'}
            </button>
            <div className="space-y-1.5">
              {(isSwahili
                ? QUICK_TOPICS[selectedTopic].questionsSw
                : QUICK_TOPICS[selectedTopic].questions
              ).map((q, i) => (
                <button key={i}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left bg-white border border-gray-200 rounded-xl px-3 py-2 hover:border-teal-400 hover:bg-teal-50 transition-all flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-700">{q}</span>
                  <ChevronRight size={12} className="text-gray-400 flex-shrink-0"/>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white"
                style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
                F
              </div>
            )}
            <div className={`max-w-xs rounded-2xl px-3 py-2.5 shadow-sm
              ${msg.role === 'user'
                ? 'text-white rounded-tr-sm'
                : 'bg-white border border-gray-100 rounded-tl-sm'}`}
              style={msg.role === 'user' ? {background:'#0d7377'} : {}}>
              <p className={`text-xs leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}
                dangerouslySetInnerHTML={{__html: formatText(msg.content)}}/>
              {/* Web sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Globe size={10}/> {isSwahili ? 'Vyanzo vya wavuti:' : 'Web sources:'}
                  </p>
                  {msg.sources.slice(0,3).map((s,si) => (
                    <a key={si} href={s.uri} target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-teal-600 hover:underline truncate">
                      {s.title || s.uri}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white"
              style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
              F
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm border border-gray-100">
              <div className="flex gap-1 items-center py-0.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-teal-400"
                    style={{animation:`bounce 1s infinite ${i*0.2}s`}}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-200 bg-white flex-shrink-0">
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setShowTopics(true); setSelectedTopic(null) }}
            className="text-xs text-gray-400 hover:text-teal-600 mb-2 flex items-center gap-1">
            ↩ {isSwahili ? 'Anza upya' : 'Start over'}
          </button>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-400"
            placeholder={isSwahili ? 'Uliza swali lolote la FP...' : 'Ask any FP question...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0
              ${input.trim() && !loading ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
            style={input.trim() && !loading ? {background:'#0d7377'} : {}}>
            <Send size={15}/>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          {isSwahili
            ? '🔒 Imezio: Miongozo ya FP ya Kenya + WHO MEC 2025'
            : '🔒 Fenced: Kenya FP Guidelines + WHO MEC 2025 + Web fallback'}
        </p>
      </div>
    </div>
  )
}

// ── FEEDBACK FORM ─────────────────────────────────────────────
function FeedbackForm({ onClose }) {
  const user = getCurrentUser()
  const facility = getFacilitySettings()
  const [form, setForm] = useState({
    type: 'feedback',
    subject: '',
    message: '',
    priority: 'normal',
    name: user?.name || '',
    facility: facility?.facility_name || '',
    email: '',
  })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!form.subject.trim() || !form.message.trim()) return
    setSending(true)

    const emailBody = [
      `Type: ${form.type.toUpperCase()}`,
      `Priority: ${form.priority.toUpperCase()}`,
      `From: ${form.name}`,
      `Facility: ${form.facility}`,
      `County: ${facility?.county || 'Not specified'}`,
      ``,
      `Subject: ${form.subject}`,
      ``,
      `Message:`,
      form.message,
      ``,
      `---`,
      `Sent from AfyaMEC platform`,
      `Date: ${new Date().toLocaleString('en-KE')}`,
    ].join('\n')

    // Use backend endpoint if available, fallback to mailto
    try {
      const res = await fetch('/api/auth/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('afyamec_auth_token')}`
        },
        body: JSON.stringify({
          to: SUPPORT_EMAIL,
          subject: `[AfyaMEC ${form.type.toUpperCase()}] ${form.subject}`,
          body: emailBody,
          from_name: form.name,
          from_facility: form.facility,
          priority: form.priority,
          type: form.type,
          reply_to_email: form.email
        })
      })
      if (res.ok) {
        setSent(true)
        setSending(false)
        return
      }
    } catch {}

    // Fallback to mailto
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[AfyaMEC ${form.type.toUpperCase()}] ${form.subject}`)}&body=${encodeURIComponent(emailBody)}`
    window.open(mailtoUrl, '_blank')
    setSent(true)
    setSending(false)
  }

  if (sent) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mb-4">✅</div>
      <h3 className="font-bold text-gray-800 mb-2">Message Sent!</h3>
      <p className="text-gray-500 text-sm mb-4">
        Your {form.type} has been sent to the AfyaMEC support team at <strong>{SUPPORT_EMAIL}</strong>
      </p>
      <p className="text-xs text-gray-400 mb-6">We aim to respond within 24 hours.</p>
      <button onClick={onClose}
        className="text-white font-bold px-6 py-2.5 rounded-xl"
        style={{background:'#0d7377'}}>
        Close
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
        style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
        <div className="flex items-center gap-2">
          <Mail size={18}/>
          <div>
            <p className="font-bold text-sm">Support & Feedback</p>
            <p className="text-xs text-teal-100">{SUPPORT_EMAIL}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:text-teal-200">
          <X size={18}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Type */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Message Type</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              {val:'feedback', label:'💬 Feedback'},
              {val:'bug', label:'🐛 Bug Report'},
              {val:'feature', label:'✨ Feature Request'},
            ].map(opt => (
              <button key={opt.val}
                onClick={() => setForm(p => ({...p, type: opt.val}))}
                className={`py-2 rounded-lg border-2 text-xs font-semibold transition-colors
                  ${form.type === opt.val
                    ? 'text-white border-transparent'
                    : 'border-gray-200 text-gray-600 hover:border-teal-300'}`}
                style={form.type === opt.val ? {background:'#0d7377'} : {}}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Priority</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              {val:'low', label:'🟢 Low'},
              {val:'normal', label:'🟡 Normal'},
              {val:'urgent', label:'🔴 Urgent'},
            ].map(opt => (
              <button key={opt.val}
                onClick={() => setForm(p => ({...p, priority: opt.val}))}
                className={`py-2 rounded-lg border-2 text-xs font-semibold transition-colors
                  ${form.priority === opt.val
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:border-teal-200'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Your Name</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            placeholder="Provider name"
            value={form.name}
            onChange={e => setForm(p => ({...p, name: e.target.value}))}/>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Your Email <span className="text-gray-400">(for reply confirmation)</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            placeholder="your@email.com"
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({...p, email: e.target.value}))}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Subject</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            placeholder="Brief subject line"
            value={form.subject}
            onChange={e => setForm(p => ({...p, subject: e.target.value}))}/>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Message</label>
          <textarea rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none"
            placeholder="Describe your feedback, issue, or feature request in detail..."
            value={form.message}
            onChange={e => setForm(p => ({...p, message: e.target.value}))}/>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500">
            📧 Message will be sent to <strong>{SUPPORT_EMAIL}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Facility: {form.facility || 'Not configured'} | User: {form.name || 'Unknown'}
          </p>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
        <button
          onClick={handleSend}
          disabled={!form.subject.trim() || !form.message.trim() || sending}
          className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors
            ${form.subject && form.message && !sending ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
          style={form.subject && form.message && !sending ? {background:'linear-gradient(135deg,#0d7377,#14a044)'} : {}}>
          {sending ? <RefreshCw size={16} className="animate-spin"/> : <Send size={16}/>}
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  )
}

// ── MAIN FLOATING ACTIONS ────────────────────────────────────
export default function FloatingActions({ geminiApiKey }) {
  const [open, setOpen] = useState(null) // null | 'fahamu' | 'feedback'
  const [showMenu, setShowMenu] = useState(false)

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello AfyaMEC Support, I need assistance with the family planning platform.')}`

  const hasApiKey = !!geminiApiKey

  return (
    <>
      {/* Overlay */}
      {(open || showMenu) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => { setOpen(null); setShowMenu(false) }}/>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-4 w-80 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{height:'520px', maxHeight:'80vh'}}>
          {open === 'fahamu' && (
            <FahamuChat
              onClose={() => setOpen(null)}
              apiKey={geminiApiKey}
            />
          )}
          {open === 'feedback' && (
            <FeedbackForm onClose={() => setOpen(null)}/>
          )}
        </div>
      )}

      {/* Action Menu */}
      {showMenu && !open && (
        <div className="fixed bottom-24 right-4 z-50 space-y-2">
          {/* Ask Fahamu */}
          <div className="flex items-center gap-2 justify-end">
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
              Ask Fahamu — AI FP Assistant
            </span>
            <button
              onClick={() => { setShowMenu(false); setOpen('fahamu') }}
              disabled={!hasApiKey}
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white text-lg transition-all hover:scale-105 disabled:opacity-50"
              style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
              🌿
            </button>
          </div>

          {/* WhatsApp */}
          <div className="flex items-center gap-2 justify-end">
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
              Chat on WhatsApp
            </span>
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => setShowMenu(false)}
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-all hover:scale-105"
              style={{background:'#25d366'}}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>

          {/* Feedback */}
          <div className="flex items-center gap-2 justify-end">
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
              Send Feedback / Report Issue
            </span>
            <button
              onClick={() => { setShowMenu(false); setOpen('feedback') }}
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-105"
              style={{background:'#2563eb'}}>
              <Mail size={20}/>
            </button>
          </div>
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => { setShowMenu(m => !m); setOpen(null) }}
        className="fixed bottom-6 right-4 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white z-50 transition-all hover:scale-105 active:scale-95"
        style={{background: showMenu
          ? '#374151'
          : 'linear-gradient(135deg,#0d7377,#14a044)'}}>
        {showMenu ? <X size={22}/> : <MessageCircle size={22}/>}
      </button>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%,80%,100%{transform:translateY(0)}
          40%{transform:translateY(-4px)}
        }
      `}</style>
    </>
  )
}