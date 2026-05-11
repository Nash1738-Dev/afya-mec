import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Play, CheckCircle, RefreshCw,
         MessageCircle, Trophy, ChevronRight, Send,
         RotateCcw, Mic, MicOff, Volume2, VolumeX, History,
         Globe, Trash2, ChevronDown, ChevronUp, Zap, Users, Plus, ClipboardCheck, Award } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'

const GEMINI_MODEL = 'gemini-2.5-flash'

// ── LANGUAGE CONFIG ────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', voiceLang: 'en-KE' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪', voiceLang: 'sw-KE' },
  { code: 'sheng', label: 'Sheng', flag: '🏙️', voiceLang: 'sw-KE' },
  { code: 'ki', label: 'Kikuyu', flag: '🌿', voiceLang: 'sw-KE' },
  { code: 'luo', label: 'Dholuo', flag: '🌊', voiceLang: 'sw-KE' },
  { code: 'kam', label: 'Kamba', flag: '🦁', voiceLang: 'sw-KE' },
  { code: 'custom', label: 'Type Custom Dialect...', flag: '✏️', voiceLang: 'sw-KE' },
]

const getLangInstruction = (langCode, customText = '') => {
  if (langCode === 'custom') return `Respond ENTIRELY in this specific dialect/language: ${customText}. Maintain absolute clinical accuracy while fully adapting to the cultural nuances, slang, and syntax of this dialect.`
  const instructions = {
    en: 'Respond in clear, simple English appropriate for an East African health worker.',
    sw: 'Jibu kwa Kiswahili safi na rahisi kinachofaa kwa mfanyakazi wa afya. Tumia maneno ya kawaida ya kliniki.',
    sheng: 'Jibu kwa Sheng — mchanganyiko wa Kiswahili na Kiingereza kama unavyosemwa mitaani Nairobi. Tumia lugha ya vijana (k.m., "Sawa si", "Niaje", "Fiti") lakini uwe serious na sahihi kuhusu maudhui ya kliniki.',
    ki: 'Jibu kwa Kikuyu na Kiswahili ukichanganya. Tumia maneno ya Kikuyu kwa salamu na kujenga uhusiano.',
    luo: 'Jibu kwa Dholuo na Kiswahili ukichanganya. Tumia Dholuo kwa salamu na kujenga uhusiano.',
    kam: 'Jibu kwa Kamba na Kiswahili ukichanganya. Tumia Kamba kwa salamu.',
  }
  return instructions[langCode] || instructions.en
}

// ── MODULES & SCENARIOS ────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'mod_bcs_intro', title: 'BCS+ Algorithm — The 4 Stages', category: 'Counselling', emoji: '🗂️', duration: '8 min', level: 'Foundation', color: '#0d7377', points: 10,
    content: [
      { type: 'lesson', title: 'What is BCS+?', text: `The Balanced Counselling Strategy Plus (BCS+) is Kenya's evidence-based approach to FP counselling, developed by the Population Council.\n\nBCS+ ensures every client receives complete, high-quality FP counselling regardless of which provider they see. It is the official Kenya MOH standard for FP service delivery (2023).`, highlight: '✅ BCS+ is NOT optional — it is the Kenya MOH standard' },
      { type: 'lesson', title: 'Stage 1: Pre-Choice', text: `In the Pre-Choice stage:\n1. Establish a warm, respectful relationship\n2. Determine why they have come today\n3. Rule out pregnancy using the WHO 6-question checklist or PDT\n4. Display ALL method cards — never pre-select\n5. Ask screening questions and set aside inappropriate methods\n\nKey principle: You are identifying options, not making choices for the client.`, highlight: '🎯 You are a guide, not a decision-maker' },
      { type: 'lesson', title: 'Stage 2: Method Choice', text: `In Method Choice:\n6. Present remaining methods starting with most effective\n7. Ask the client to choose — the decision belongs to them\n8. Confirm no MEC contraindications\n\n⚡ SI-FIRST APPROACH: When DMPA-SC is eligible, ALWAYS present self-injection as the preferred option first. Say: "This method can be given here by me, OR you can learn to give it yourself at home — most clients prefer this option."`, highlight: '💉 Lead with self-injection — it is the default for eligible DMPA-SC clients' },
      { type: 'quiz', question: 'According to BCS+, when should you display contraceptive method cards?', options: ['After asking preferred method', 'Before screening — show ALL methods first', 'Only after ruling out pregnancy', 'Only appropriate methods'], correct: 1, explanation: 'BCS+ Step 4: Display ALL method cards before screening. Never pre-select.' },
    ]
  },
  {
    id: 'mod_empathy_counselling', title: 'Empathy-Based Counselling — REDI & OARS', category: 'Counselling', emoji: '💗', duration: '9 min', level: 'Foundation', color: '#ec4899', points: 15,
    content: [
      { type: 'lesson', title: 'The REDI Framework', text: `The REDI framework builds trust:\n\nR — Rapport: Greet warmly, ensure privacy.\nE — Explore: Ask open questions to understand their life and fears.\nD — Decide: Help them choose based on facts, without pressure.\nI — Implement: Provide method and plan follow-up.`, highlight: '💗 Empathy is the foundation of quality FP care.' },
      { type: 'lesson', title: 'OARS Framework', text: `Use OARS to explore:\n\n🔵 O — Open questions ("Tell me about...")\n🔵 A — Affirmations ("It's great you came in today.")\n🔵 R — Reflective listening ("So you are worried about weight gain.")\n🔵 S — Summarising ("To make sure I understand...")`, highlight: '🎯 Avoid Yes/No questions. Invite narrative.' },
      { type: 'lesson', title: 'The Empathy Sandwich', text: `For difficult conversations or myths:\n\n🍞 Acknowledge the feeling: "I hear that you're worried..."\n🥗 Provide accurate information: "What the evidence actually shows is..."\n🍞 Validate their choice: "You know your body best."`, highlight: '🥪 Always lead with empathy, THEN information.' },
      { type: 'quiz', question: 'A client says "I stopped my pills because they were making me feel sick." What is the BEST empathic response?', options: ['You should not have stopped without telling us first.', 'The pills don\'t actually cause those symptoms.', 'That sounds really difficult — feeling unwell every day would worry anyone. Tell me more.', 'Let me give you a different type of pill.'], correct: 2, explanation: 'Acknowledge the feeling before giving information or redirecting.' },
    ]
  },
]

const STATIC_SCENARIOS = [
  { id: 'sim_new_si_client', title: 'New Client — SI-First Approach', difficulty: 'Beginner', emoji: '💉', description: 'Practice presenting self-injection as the default option.', context: 'new client eligible for DMPA-SC, SI-first counselling, MAPS training', scoring_criteria: ['Offered SI as default first', 'Used MAPS steps correctly', 'Used empathic language', 'Checked comprehension', 'Gave return date'], si_focus: true, client_persona: `You are Wanjiru, 26, married, visiting for FP for the first time. You've heard of "the injection." You are nervous about needles but open to learning. You live far from the facility. When the provider mentions self-injection, you initially say "Mimi?! Naweza kujichomea mwenyewe?" but warm up quickly if they explain it empathically. You have no contraindications.` },
  { id: 'sim_empathy_side_effects', title: 'Anxious Client — Empathic Side Effect Counselling', difficulty: 'Intermediate', emoji: '💗', description: 'Practice the Empathy Sandwich with a worried DMPA client considering stopping.', context: 'DMPA revisit, amenorrhoea concern, empathy-first counselling needed', scoring_criteria: ['Acknowledged feeling first (empathy)', 'Did NOT jump to explanation first', 'Used Empathy Sandwich', 'Used open questions (OARS)', 'Client feels heard and decides to continue'], empathy_focus: true, client_persona: `You are Akinyi, 28, on DMPA 3 months. VERY worried — no periods. Mother-in-law says "blood accumulating inside." Considering stopping. You need genuine empathy first — if provider jumps straight to clinical explanation without acknowledging your fear, you will push back: "Unasema tu maneno — si unasikia kile ninachosema?" Open up and relax only when truly heard.` },
  { id: 'sim_adolescent', title: 'Adolescent — Youth-Friendly Empathic Counselling', difficulty: 'Intermediate', emoji: '🌱', description: '17-year-old requests ECP. Practice youth-friendly ARSH counselling with deep empathy.', context: 'Adolescent, ECP, fear, empathy-first, ARSH guidelines', scoring_criteria: ['Ensured privacy first', 'Non-judgmental language', 'Assessed for coercion empathically', 'Provided ECP', 'Offered ongoing FP', 'Dual protection', 'Linked HTC/STI'], empathy_focus: true, client_persona: `You are Zawadi, 17, scared and embarrassed. Consensual sex last night, worried about pregnancy. Short answers at first. Need the provider to be GENUINELY KIND — not just technically correct. If provider is warm and empathic, open up and ask about ongoing FP. If provider feels clinical or judgmental, become monosyllabic. Notice and respond to emotional tone.` },
]

const YOUTH_DISCUSSIONS = [
  { id: 'yd_1', title: '📱 Social Media Myths', prompt: 'I saw on TikTok that implants make you gain 20kgs in a month. Is this true? Has anyone else heard this?', tags: ['Myths', 'Side Effects'] },
  { id: 'yd_2', title: '🤫 Privacy Concerns', prompt: 'I want to get family planning but I\'m afraid the nurse will tell my parents or judge me. How do I find a youth-friendly clinic?', tags: ['Privacy', 'ARSH'] },
]

const PROVIDER_DISCUSSIONS = [
  { id: 'pd_si_first', title: '💉 SI-First Success Stories', prompt: 'Share a case where you offered self-injection first and the client was surprised — what happened? What did you say?', tags: ['DMPA-SC', 'SI-First'] },
  { id: 'pd_mec_challenge', title: '⚕️ Difficult MEC Case', prompt: 'A challenging case with multiple conditions. How did you navigate eligibility and keep it client-centred?', tags: ['MEC', 'Clinical'] },
]

const SUPERVISION_CHECKLIST = [
  { id: 'c1', category: 'Facility Readiness', text: 'Privacy is ensured in the FP counselling area (visual and auditory).' },
  { id: 'c2', category: 'Facility Readiness', text: 'WHO MEC Wheel and BCS+ algorithm cards are available and visible.' },
  { id: 'c3', category: 'Facility Readiness', text: 'DMPA-SC training devices and sharps containers are in stock.' },
  { id: 'c4', category: 'Counselling (REDI)', text: 'Provider greets client warmly and establishes rapport before discussing methods.' },
  { id: 'c5', category: 'Counselling (REDI)', text: 'Provider asks open-ended questions (OARS) to explore client needs.' },
  { id: 'c6', category: 'Clinical Practice', text: 'Provider accurately takes and interprets Blood Pressure and BMI.' },
  { id: 'c7', category: 'Clinical Practice', text: 'Provider uses the WHO 6-question checklist to rule out pregnancy.' },
  { id: 'c8', category: 'Method Provision', text: 'Provider introduces DMPA-SC Self-Injection as a default option (SI-First).' },
  { id: 'c9', category: 'Method Provision', text: 'Provider utilizes the MAPS technique for SI training and uses Teach-Back.' },
  { id: 'c10', category: 'Method Provision', text: 'Provider proactively discusses side effects (Empathy Sandwich) and provides a return date.' },
]

const ECPD_COURSES = [
  { id: 'ecpd1', title: 'Advanced LARC Insertion & Removal', credits: 2, status: 'available', icon: '🩹' },
  { id: 'ecpd2', title: 'Adolescent Sexual & Reproductive Health (ARSH)', credits: 3, status: 'available', icon: '🌱' },
  { id: 'ecpd3', title: 'Managing Hypertensive Clients in FP', credits: 2, status: 'locked', icon: '❤️' },
]

const MEMORY_KEY = 'afyamentor_sim_history'
const PROGRESS_KEY = 'afyamentor_progress'

const loadHistory = () => { try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]') } catch { return [] } }
const saveHistory = (history) => { try { localStorage.setItem(MEMORY_KEY, JSON.stringify(history.slice(0, 20))) } catch {} }

// ── OPEN CONVERSATION (ASK MENTOR) COMPONENT ──────────────────────────────────
function OpenMentorChat({ apiKey, language, customLangText, langConfig }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => JSON.parse(localStorage.getItem('afyamentor_open_chats') || '[]'));
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages]);

  const saveToHistory = (newMessages) => {
    if (newMessages.length < 2) return;
    const title = newMessages[0].content.substring(0, 30) + '...';
    const newEntry = { id: Date.now(), title, date: new Date().toISOString(), messages: newMessages };
    const updatedHistory = [newEntry, ...chatHistory.filter(c => c.id !== newEntry.id)].slice(0, 10);
    setChatHistory(updatedHistory);
    localStorage.setItem('afyamentor_open_chats', JSON.stringify(updatedHistory));
  };

  const loadChat = (chat) => {
    setMessages(chat.messages);
    setShowHistory(false);
  };

  const getSystemPrompt = () => `You are "Afya Mentor", an expert clinical trainer and supervisor for Family Planning. 
  You assist healthcare providers. Be highly encouraging, practical, and EXTREMELY concise. Use bullet points.
  
  CRITICAL INSTRUCTION FOR LANGUAGE/DIALECT: ${getLangInstruction(language, customLangText)}
  
  RAG FENCING & CITATION STRICTNESS: 
  - For ANY Family Planning or Reproductive Health question, you MUST base your answers strictly on the WHO Medical Eligibility Criteria (MEC) 6th Edition, Kenya MOH FP Guidelines, or the REDI/BCS+ frameworks. 
  - Always quote your source briefly at the end of the point (e.g., "[Source: WHO MEC 6th Ed]").
  - If the user asks a general medical or non-FP question that is outside the scope of WHO MEC (e.g., "What are symptoms of Malaria?", "How to treat a burn?"), you may use your pre-trained internet medical knowledge, but you MUST state exactly this at the beginning of your response: "Based on general internet medical knowledge (outside FP guidelines)..." and then answer concisely.
  - Do NOT hallucinate FP guidelines.

  COUNSELLING FRAMEWORKS: Always reference the REDI counseling framework (Rapport, Explore, Decide, Implement) and the MAPS technique (Mix, Activate, Pinch, Self-inject) when relevant.`;

  const sendMessage = async (presetInput = null) => {
    const textToSend = presetInput || input;
    if (!textToSend.trim() || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: getSystemPrompt() }] },
            contents: history,
            generation_config: { temperature: 0.4 } // Lower temp for more factual adherence
          })
        }
      );
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Error generating response.';
      const finalMessages = [...newMessages, { role: 'assistant', content: reply }];
      setMessages(finalMessages);
      saveToHistory(finalMessages);
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: 'Network error. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-teal-600"/>
          <span className="font-bold text-gray-700 text-sm">Ask Mentor ({language === 'custom' ? customLangText || 'Custom' : langConfig.label})</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-600">
            <History size={14}/> {showHistory ? 'Close History' : 'View History'}
          </button>
          <button onClick={() => setMessages([])} className="text-gray-500 hover:text-teal-600" title="New Chat">
            <RefreshCw size={14}/>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative">
        {showHistory ? (
          <div className="absolute inset-0 bg-white z-10 p-4 overflow-y-auto">
            <h3 className="font-bold text-gray-700 mb-3">Previous Chats</h3>
            {chatHistory.length === 0 ? <p className="text-sm text-gray-400">No history yet.</p> : 
              chatHistory.map(chat => (
                <div key={chat.id} onClick={() => loadChat(chat)} className="p-3 border-b border-gray-100 hover:bg-teal-50 cursor-pointer">
                  <p className="text-sm font-semibold text-gray-700">{chat.title}</p>
                  <p className="text-xs text-gray-400">{new Date(chat.date).toLocaleString()}</p>
                </div>
              ))
            }
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center pt-8 pb-4">
            <p className="text-xs text-gray-500 font-bold mb-6 tracking-widest uppercase">Examples — Try asking:</p>
            
            {/* Redesigned Organic Chat Prompt Bubbles */}
            <div className="flex flex-col gap-4 w-full max-w-md items-center">
              
              <button onClick={() => sendMessage("What should I say to a client who fears side effects? Use the REDI framework.")} 
                className="self-start relative group w-4/5 text-left">
                <div className="absolute inset-0 bg-purple-200 rounded-3xl rounded-tl-none transform group-hover:scale-105 transition-transform origin-top-left opacity-50"></div>
                <div className="relative bg-purple-50 border border-purple-200 p-3 rounded-3xl rounded-tl-none shadow-sm">
                  <p className="text-xs font-semibold text-purple-900 leading-relaxed">🗣️ "What should I say to a client who fears side effects? Use the REDI framework."</p>
                </div>
              </button>

              <button onClick={() => sendMessage("Teach me step-by-step how to give a DMPA-SC injection.")} 
                className="self-end relative group w-4/5 text-left">
                <div className="absolute inset-0 bg-teal-200 rounded-3xl rounded-tr-none transform group-hover:scale-105 transition-transform origin-top-right opacity-50"></div>
                <div className="relative bg-teal-50 border border-teal-200 p-3 rounded-3xl rounded-tr-none shadow-sm">
                  <p className="text-xs font-semibold text-teal-900 leading-relaxed">📚 "Teach me step-by-step how to give a DMPA-SC injection."</p>
                </div>
              </button>

              <button onClick={() => sendMessage("Give me a provider competency checklist for self-injection training.")} 
                className="self-start relative group w-4/5 text-left">
                <div className="absolute inset-0 bg-orange-200 rounded-full transform group-hover:scale-105 transition-transform opacity-50"></div>
                <div className="relative bg-orange-50 border border-orange-200 p-3 rounded-full shadow-sm text-center">
                  <p className="text-xs font-semibold text-orange-900 leading-relaxed">📋 "Give me a provider checklist..."</p>
                </div>
              </button>
              
              <button onClick={() => sendMessage("Is it safe to give COC to a 38 year old who smokes? What does the MEC say?")} 
                className="self-end relative group w-4/5 text-left">
                <div className="absolute inset-0 bg-blue-200 rounded-3xl rounded-br-none transform group-hover:scale-105 transition-transform origin-bottom-right opacity-50"></div>
                <div className="relative bg-blue-50 border border-blue-200 p-3 rounded-3xl rounded-br-none shadow-sm">
                  <p className="text-xs font-semibold text-blue-900 leading-relaxed">⚕️ "Is it safe to give COC to a 38 year old who smokes?"</p>
                </div>
              </button>

            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${msg.role === 'user' ? 'bg-teal-600' : 'bg-gray-800'}`}>
                {msg.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                <div className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && <p className="text-xs text-gray-400 italic">Consulting guidelines...</p>}
        <div ref={messagesEndRef}/>
      </div>

      <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-teal-500"
            placeholder={`Ask anything in ${language === 'custom' ? 'your dialect' : langConfig.label}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className={`p-2 rounded-full text-white transition-colors ${input.trim() && !loading ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300'}`}>
            <Send size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── COUNSELLING SIMULATOR ──────────────────────────────────────────────────────
function CounsellingSimulator({ scenario, onComplete, apiKey, language, customLangText, langConfig }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('intro')
  const [feedback, setFeedback] = useState(null)
  const [turnCount, setTurnCount] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = langConfig.voiceLang
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        setInput(prev => prev + ' ' + transcript)
        setIsRecording(false)
      }
      recognition.onerror = () => setIsRecording(false)
      recognition.onend = () => setIsRecording(false)
      recognitionRef.current = recognition
    }
    return () => { synthRef.current?.cancel() }
  }, [langConfig.voiceLang])

  const toggleRecording = () => {
    if (!recognitionRef.current) return
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const speakText = (text) => {
    if (!audioEnabled || !synthRef.current) return
    synthRef.current.cancel()
    const clean = text.replace(/\*[^*]+\*/g, '').replace(/\[.*?\]/g, '').trim()
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = langConfig.voiceLang
    utterance.rate = 0.9
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    synthRef.current.speak(utterance)
  }

  const langInstruction = getLangInstruction(language, customLangText)

  const getSystemPrompt = () => {
    const siNote = scenario.si_focus ? '\n\nSI-FIRST CONTEXT: This scenario focuses on self-injection counselling. React positively when the provider uses MAPS steps correctly and presents SI as the default.' : ''
    const empathyNote = scenario.empathy_focus ? '\n\nEMPATHY CONTEXT: You need genuine empathy before information. If provider jumps straight to clinical explanation without acknowledging your feelings first, push back or become withdrawn. Only open up when truly heard.' : ''

    return `You are playing a role-play simulation for training FP providers.

LANGUAGE INSTRUCTION: ${langInstruction}

YOUR ROLE: You are the CLIENT in a FP counselling session.

CLIENT PROFILE:
${scenario.client_persona}
${siNote}${empathyNote}

SIMULATION RULES:
1. Stay strictly in character. Do NOT break character.
2. Respond naturally as a real client — use emotions, concerns, and local expressions based on the language instruction.
3. After 8-10 exchanges, if the provider has done well, signal readiness to end.
4. If provider makes clinical error, react appropriately — question, hesitate.
5. Keep responses SHORT — 1-3 sentences maximum like a real client.
6. After 12 exchanges OR natural conclusion, end with: [SESSION_COMPLETE]

Context: ${scenario.context}`
  }

  const getFeedbackPrompt = (history) => `You are an expert FP training supervisor.

LANGUAGE: Provide feedback in English.
SCENARIO: ${scenario.title}
SCORING CRITERIA: ${scenario.scoring_criteria.join(', ')}

TRANSCRIPT:
${history.map(m => `${m.role === 'user' ? 'PROVIDER' : 'CLIENT'}: ${m.content}`).join('\n')}

Provide feedback in this EXACT format:

SCORE: [X/10]

BADGES EARNED: [Provide a comma separated list of 1 to 3 very short badges the provider earned based on their performance (e.g., Empathy Master, MAPS Expert, Active Listener, MEC Specialist). If performance was poor, write "None"]

STRENGTHS:
- [specific strength]
- [specific strength]

AREAS TO IMPROVE:
- [specific improvement]
- [specific improvement]

MODEL ANSWER / CORRECT APPROACH:
- [Provide a concise, step-by-step explanation of exactly how the provider *should* have optimally handled this specific clinical and emotional scenario based on WHO MEC, REDI, or SI-First guidelines].

CRITERIA MET:
${scenario.scoring_criteria.map(c => `- ${c}: [YES/NO]`).join('\n')}

OVERALL VERDICT: [EXCELLENT / GOOD / NEEDS PRACTICE]

CLINICAL ACCURACY: [errors found, or "No clinical errors detected"]`

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setTurnCount(t => t + 1)
    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const history = newMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: getSystemPrompt() }] },
            contents: history,
            generation_config: { temperature: 0.8, max_output_tokens: 300 }
          }) }
      )
      const data = await res.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const sessionComplete = reply.includes('[SESSION_COMPLETE]') || turnCount >= 12
      const cleanReply = reply.replace('[SESSION_COMPLETE]', '').trim()
      setMessages(prev => [...prev, { role: 'assistant', content: cleanReply }])
      if (audioEnabled) speakText(cleanReply)
      if (sessionComplete) {
        setTimeout(() => generateFeedback([...newMessages, { role: 'assistant', content: cleanReply }]), 1000)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error — please check your connection.' }])
    }
    setLoading(false)
  }

  const generateFeedback = async (history) => {
    setPhase('feedback')
    setLoading(true)
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: getFeedbackPrompt(history) }] }],
            generation_config: { temperature: 0.3 }
          }) }
      )
      const data = await res.json()
      const feedbackText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      setFeedback(feedbackText)
      
      const existing = loadHistory()
      const entry = {
        id: Date.now(),
        scenario_id: scenario.id,
        scenario_title: scenario.title,
        language: language === 'custom' ? customLangText : langConfig.label,
        date: new Date().toLocaleDateString('en-KE'),
        turns: history.length,
        feedback: feedbackText,
        messages: history.slice(-6),
      }
      saveHistory([entry, ...existing])
    } catch {
      setFeedback('Could not generate feedback — check internet connection.')
    }
    setLoading(false)
  }

  const startSession = () => {
    setPhase('active')
    const opener = scenario.id === 'sim_empathy_side_effects'
      ? '*enters nervously* ' + langConfig.greeting + '... I haven\'t had my period for 3 months since starting the injection. I\'m thinking of stopping...'
      : scenario.id === 'sim_si_training'
        ? '*looking at the device nervously* ' + langConfig.greeting + '. I have to inject myself? I don\'t know how to do this...'
        : '*enters clinic* ' + langConfig.greeting + '. I was told to come here for family planning...'
    setMessages([{ role: 'assistant', content: opener, isOpener: true }])
    if (audioEnabled) setTimeout(() => speakText(opener), 500)
  }

  // FIX: Scroll Bug addressed by separating the text into an overflow container and locking the button to the bottom
  if (phase === 'intro') return (
    <div className="relative flex flex-col h-full bg-white">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 text-center">
        <div className="text-5xl mb-4">{scenario.emoji}</div>
        <h3 className="font-bold text-gray-800 text-lg mb-2">{scenario.title}</h3>
        <p className="text-gray-500 text-sm mb-3">{scenario.description}</p>
        
        {scenario.id.startsWith('sim_dynamic_') && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3 text-left">
            <p className="text-xs font-bold text-purple-700 mb-1">⚡ AI-Generated {scenario.difficulty} Case</p>
            <p className="text-xs text-purple-600">This is a unique, complex scenario created by the AI. Apply all your knowledge!</p>
          </div>
        )}

        {scenario.si_focus && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-left">
            <p className="text-xs font-bold text-green-700 mb-1">💉 SI-First Focus</p>
            <p className="text-xs text-green-600">Practice presenting self-injection as the DEFAULT option. Lead with empowerment.</p>
          </div>
        )}
        {scenario.empathy_focus && (
          <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 mb-3 text-left">
            <p className="text-xs font-bold text-pink-700 mb-1">💗 Empathy Focus</p>
            <p className="text-xs text-pink-600">Practice the Empathy Sandwich: Acknowledge → Explain → Validate.</p>
          </div>
        )}
        <div className="bg-teal-50 rounded-xl p-3 mb-3 text-left">
          <p className="text-xs font-bold text-teal-700 mb-2">📋 Scored on:</p>
          {scenario.scoring_criteria.map((c, i) => <p key={i} className="text-xs text-teal-600">• {c}</p>)}
        </div>
        
        <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <button onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${audioEnabled ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
            {audioEnabled ? <Volume2 size={14}/> : <VolumeX size={14}/>}
            {audioEnabled ? 'Audio ON' : 'Audio OFF'}
          </button>
          <p className="text-xs text-gray-400">Enable to hear client responses</p>
        </div>
      </div>
      
      {/* Sticky Bottom Button */}
      <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
        <button onClick={startSession}
          className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5"
          style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
          <Play size={18}/> Start Simulation ({language === 'custom' ? 'Custom Dialect' : langConfig.label})
        </button>
      </div>
    </div>
  )

  if (phase === 'feedback' && feedback) {
    const scoreMatch = feedback.match(/SCORE:\s*(\d+)\/10/)
    const badgesMatch = feedback.match(/BADGES EARNED:\s*(.*?)(?=\n|$)/)
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 7
    const badges = badgesMatch ? badgesMatch[1].split(',').map(b => b.trim()).filter(b => b !== 'None') : []
    const verdict = feedback.includes('EXCELLENT') ? 'EXCELLENT' : feedback.includes('GOOD') ? 'GOOD' : 'NEEDS PRACTICE'
    const verdictColor = verdict === 'EXCELLENT' ? '#14a044' : verdict === 'GOOD' ? '#f59e0b' : '#dc2626'
    
    // Extract Model Answer for highlighting
    let displayFeedback = feedback
    let modelAnswer = null
    const modelAnswerSplit = feedback.split(/MODEL ANSWER \/ CORRECT APPROACH:/i)
    if (modelAnswerSplit.length > 1) {
       displayFeedback = modelAnswerSplit[0]
       const remainder = modelAnswerSplit[1].split(/CRITERIA MET:/i)
       modelAnswer = remainder[0].trim()
       if (remainder.length > 1) {
           displayFeedback += "\nCRITERIA MET:\n" + remainder[1]
       }
    }

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">{verdict === 'EXCELLENT' ? '🏆' : verdict === 'GOOD' ? '⭐' : '📚'}</div>
            <div className="text-3xl font-bold mb-1" style={{color: verdictColor}}>{score}/10</div>
            <div className="font-bold text-sm px-3 py-1 rounded-full inline-block text-white mb-2" style={{background: verdictColor}}>{verdict}</div>
            
            {badges.length > 0 && (
              <div className="flex justify-center gap-2 mt-2 flex-wrap">
                {badges.map(b => (
                  <span key={b} className="bg-purple-100 border border-purple-200 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Award size={12}/> {b}
                  </span>
                ))}
              </div>
            )}
          </div>

          {modelAnswer && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                <CheckCircle size={16}/> Correct Approach / Model Answer
              </h3>
              <p className="text-sm text-blue-900 whitespace-pre-line leading-relaxed">
                {modelAnswer.replace(/\*\*/g, '').replace(/^- /gm, '• ')}
              </p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 text-sm mb-2">Detailed Assessment</h3>
            <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
              {displayFeedback.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '').replace(/BADGES EARNED:.*?\n/, '')}
            </p>
          </div>
          
          {audioEnabled && (
            <button onClick={() => speakText(feedback.substring(0, 400))}
              className="w-full mb-3 flex items-center justify-center gap-2 border border-teal-300 text-teal-700 py-2 rounded-xl text-sm hover:bg-teal-50">
              <Volume2 size={14}/> {isSpeaking ? 'Speaking...' : 'Read Feedback Aloud'}
            </button>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2 flex-shrink-0 bg-white">
          <button onClick={() => { setPhase('intro'); setMessages([]); setTurnCount(0); setFeedback(null) }}
            className="flex-1 flex items-center justify-center gap-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            <RotateCcw size={14}/> Try Again
          </button>
          <button onClick={() => onComplete(score)}
            className="flex-1 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow"
            style={{background:'#0d7377'}}>✅ Complete</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-600">{scenario.emoji} {scenario.title}</p>
          <p className="text-xs text-gray-400">Turn {turnCount}/12 | {language === 'custom' ? 'Custom' : langConfig.label}</p>
        </div>
        <div className="flex gap-1">
          {scenario.si_focus && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">SI-First</span>}
          {scenario.empathy_focus && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">Empathy</span>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-gray-50/30">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm
              ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-white'}`}>
              {msg.role === 'user' ? 'You' : 'AI'}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
              ${msg.role === 'user' ? 'text-white rounded-tr-none bg-teal-600' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
              {msg.content}
              {msg.role === 'assistant' && audioEnabled && (
                <button onClick={() => speakText(msg.content)} className="ml-2 opacity-40 hover:opacity-100 transition-opacity">
                  <Volume2 size={12}/>
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">AI</div>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex gap-1 shadow-sm">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400" style={{animation:`bounce 1s infinite ${i*0.2}s`}}/>)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>
      <div className="px-3 py-3 border-t border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center gap-2">
          {recognitionRef.current && (
            <button onClick={toggleRecording}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-inner' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {isRecording ? <MicOff size={16}/> : <Mic size={16}/>}
            </button>
          )}
          <input
            className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            placeholder={isRecording ? '🎤 Listening...' : `Type or speak (${language === 'custom' ? 'Custom' : langConfig.label})...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-colors shadow-sm
              ${input.trim() && !loading ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300'}`}>
            <Send size={16}/>
          </button>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
    </div>
  )
}

// ── MODULE VIEWER ──────────────────────────────────────────────────────────────
function ModuleViewer({ module, onComplete }) {
  // Keeping ModuleViewer essentially the same, just ensuring styling matches
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showExplanation, setShowExplanation] = useState({})
  const [completed, setCompleted] = useState(false)
  const content = module.content
  const item = content[currentStep]
  const isLast = currentStep === content.length - 1
  const quizItems = content.filter(c => c.type === 'quiz')
  const answeredCorrectly = quizItems.filter(q => {
    const qIndex = content.findIndex(c => c === q)
    return answers[qIndex] === q.correct
  }).length

  const handleAnswer = (questionIndex, optionIndex) => {
    if (answers[questionIndex] !== undefined) return
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }))
    setShowExplanation(prev => ({ ...prev, [questionIndex]: true }))
  }

  const handleNext = () => {
    if (isLast) {
      const finalScore = quizItems.length > 0 ? Math.round((answeredCorrectly / quizItems.length) * 10) : 10
      setCompleted(true)
      onComplete(finalScore, module.points)
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  if (completed) return (
    <div className="text-center p-6">
      <div className="text-5xl mb-3">{answeredCorrectly === quizItems.length ? '🏆' : '⭐'}</div>
      <h3 className="font-bold text-gray-800 text-lg mb-1">{answeredCorrectly === quizItems.length ? 'Excellent!' : 'Well done!'}</h3>
      <p className="text-gray-500 text-sm mb-4">Quiz: {answeredCorrectly}/{quizItems.length} correct</p>
      <div className="bg-teal-50 rounded-xl p-4 mb-4">
        <p className="text-2xl font-bold text-teal-600">+{module.points} pts</p>
      </div>
    </div>
  )

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        {content.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i < currentStep ? 'bg-green-400' : i === currentStep ? 'bg-teal-500' : 'bg-gray-200'}`}/>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-4">Step {currentStep + 1} of {content.length}</p>
      {item.type === 'lesson' && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3">{item.title}</h3>
          <div className="bg-gray-50 rounded-xl p-4 mb-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">{item.text}</div>
          {item.highlight && <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-sm text-teal-700 font-medium">{item.highlight}</div>}
          <button onClick={handleNext} className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2" style={{background:'#0d7377'}}>
            {isLast ? '✅ Complete' : <>Next <ChevronRight size={16}/></>}
          </button>
        </div>
      )}
      {item.type === 'quiz' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">QUIZ</span>
          </div>
          <p className="font-semibold text-gray-800 text-sm mb-4">{item.question}</p>
          <div className="space-y-2 mb-4">
            {item.options.map((opt, i) => {
              const answered = answers[currentStep] !== undefined
              const isSelected = answers[currentStep] === i
              const isCorrect = i === item.correct
              let cls = 'border-gray-200 hover:border-teal-300 bg-white'
              if (answered) {
                if (isCorrect) cls = 'border-green-400 bg-green-50'
                else if (isSelected) cls = 'border-red-400 bg-red-50'
                else cls = 'border-gray-200 bg-gray-50 opacity-60'
              }
              return (
                <button key={i} onClick={() => handleAnswer(currentStep, i)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${cls}`}
                  disabled={answered}>
                  <span className="text-gray-600 font-medium mr-2">{['A','B','C','D'][i]}.</span>
                  <span className={answered && isCorrect ? 'text-green-700 font-semibold' : answered && isSelected ? 'text-red-700' : 'text-gray-700'}>{opt}</span>
                  {answered && isCorrect && <span className="float-right text-green-500">✅</span>}
                  {answered && isSelected && !isCorrect && <span className="float-right text-red-500">❌</span>}
                </button>
              )
            })}
          </div>
          {showExplanation[currentStep] && (
            <div className={`rounded-xl p-3 mb-4 text-sm ${answers[currentStep] === item.correct ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <p className="font-bold mb-1">{answers[currentStep] === item.correct ? '✅ Correct!' : '❌ Not quite...'}</p>
              <p>{item.explanation}</p>
            </div>
          )}
          {answers[currentStep] !== undefined && (
            <button onClick={handleNext} className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2" style={{background:'#0d7377'}}>
              {isLast ? '✅ Complete' : <>Next <ChevronRight size={16}/></>}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── HISTORY VIEWER ─────────────────────────────────────────────────────────────
function HistoryViewer({ onClose, onContinue }) {
  const history = loadHistory()
  const [expanded, setExpanded] = useState(null)

  if (history.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <History size={40} className="mx-auto mb-3 opacity-30"/>
      <p>No previous simulations yet.</p>
      <button onClick={onClose} className="mt-4 text-teal-600 underline text-sm">Back</button>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <History size={16} className="text-teal-600"/> Previous Sessions ({history.length})
        </h3>
        <button onClick={() => { if (window.confirm('Clear all history?')) { localStorage.removeItem(MEMORY_KEY); onClose() } }}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
          <Trash2 size={12}/> Clear All
        </button>
      </div>
      <div className="space-y-3">
        {history.map((entry, i) => {
          const scoreMatch = entry.feedback?.match(/SCORE:\s*(\d+)\/10/)
          const score = scoreMatch ? parseInt(scoreMatch[1]) : null
          const verdict = entry.feedback?.includes('EXCELLENT') ? 'EXCELLENT' : entry.feedback?.includes('GOOD') ? 'GOOD' : 'NEEDS PRACTICE'
          const verdictColor = verdict === 'EXCELLENT' ? '#14a044' : verdict === 'GOOD' ? '#f59e0b' : '#dc2626'
          return (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === i ? null : i)}>
                <div>
                  <p className="font-semibold text-gray-700 text-sm">{entry.scenario_title}</p>
                  <p className="text-xs text-gray-400">{entry.date} · {entry.language} · {entry.turns} turns</p>
                </div>
                <div className="flex items-center gap-2">
                  {score && <span className="font-bold text-sm" style={{color: verdictColor}}>{score}/10</span>}
                  {expanded === i ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </div>
              </div>
              {expanded === i && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {entry.feedback?.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '') || 'No feedback saved.'}
                  </div>
                  {!entry.scenario_id?.startsWith('sim_dynamic_') && (
                    <button onClick={() => onContinue(entry)}
                      className="mt-3 w-full text-white font-bold py-2.5 rounded-lg text-xs transition-colors hover:shadow-md"
                      style={{background:'#0d7377'}}>
                      Practice This Scenario Again
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button onClick={onClose} className="mt-4 w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
        Back to Simulations
      </button>
    </div>
  )
}

// ── SUPERVISION CHECKLIST (SELF-ASSESSMENT) ──────────────────────────────────
function SupervisionChecklist() {
  const [checked, setChecked] = useState(() => JSON.parse(localStorage.getItem('afyamentor_supervision') || '[]'));
  
  const handleToggle = (id) => {
    const updated = checked.includes(id) ? checked.filter(c => c !== id) : [...checked, id];
    setChecked(updated);
    localStorage.setItem('afyamentor_supervision', JSON.stringify(updated));
  };

  const score = Math.round((checked.length / SUPERVISION_CHECKLIST.length) * 100);
  const color = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800">Supervision Self-Assessment</h3>
          <p className="text-xs text-gray-500">Ensure your facility & practice meet MOH standards</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${color}`}>{score}%</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Readiness</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {['Facility Readiness', 'Counselling (REDI)', 'Clinical Practice', 'Method Provision'].map(cat => (
          <div key={cat}>
            <h4 className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-t-lg border border-b-0 border-blue-100">{cat}</h4>
            <div className="border border-blue-100 rounded-b-lg overflow-hidden divide-y divide-gray-100">
              {SUPERVISION_CHECKLIST.filter(c => c.category === cat).map(item => (
                <label key={item.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={checked.includes(item.id)} onChange={() => handleToggle(item.id)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/>
                  <span className={`text-sm ${checked.includes(item.id) ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{item.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => { if(confirm('Reset checklist?')) { setChecked([]); localStorage.removeItem('afyamentor_supervision') } }}
        className="mt-4 text-xs text-red-500 hover:text-red-700 underline">Reset Checklist</button>
    </div>
  );
}

// ── eCPD POC DASHBOARD ────────────────────────────────────────────────────────
function ECPDDashboard() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white shadow-md">
        <h3 className="font-bold text-lg flex items-center gap-2"><Award size={20}/> AI-Assisted eCPD (Beta)</h3>
        <p className="text-sm mt-1 opacity-90">Earn Continuous Professional Development credits by completing AI-assessed modules and Oral Viva Voce exams.</p>
        <div className="mt-4 bg-white/20 rounded-lg p-3 inline-block">
          <p className="text-xs uppercase tracking-widest opacity-80">Your Credits</p>
          <p className="text-2xl font-bold">0 <span className="text-sm font-normal opacity-80">CPD Points</span></p>
        </div>
      </div>

      <div className="grid gap-3">
        {ECPD_COURSES.map(course => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="text-3xl bg-gray-50 p-3 rounded-full">{course.icon}</div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-sm">{course.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">Earn {course.credits} CPD Credits</p>
            </div>
            {course.status === 'available' ? (
              <button className="text-xs bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">
                Start Course
              </button>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-400 font-bold px-3 py-1.5 rounded-lg border border-gray-200">
                🔒 Locked
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-gray-400 italic">This is a Proof of Concept integrating AI-based verbal examinations for official CPD accreditation.</p>
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function AfyaMentor() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || facility.gemini_api_key || ''

  const [activeTab, setActiveTab] = useState('ask')
  const [selectedModule, setSelectedModule] = useState(null)
  const [selectedSim, setSelectedSim] = useState(null)
  const [language, setLanguage] = useState(() => localStorage.getItem('afyamentor_lang') || 'en')
  const [customLangText, setCustomLangText] = useState(() => localStorage.getItem('afyamentor_custom_lang') || '')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [generatingSim, setGeneratingSim] = useState(false)
  const [simLevel, setSimLevel] = useState('Intermediate')
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') }
    catch { return {} }
  })

  const saveProgress = (key, data) => {
    const updated = { ...progress, [key]: data }
    setProgress(updated)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated))
  }

  const setLang = (code) => {
    setLanguage(code)
    localStorage.setItem('afyamentor_lang', code)
    if (code !== 'custom') {
      setShowLangPicker(false)
    }
  }

  const handleCustomLangSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      localStorage.setItem('afyamentor_custom_lang', customLangText)
      setShowLangPicker(false)
    }
  }

  const generateDynamicScenario = async () => {
    if (!geminiApiKey) return;
    setGeneratingSim(true);
    try {
      const prompt = `Generate a highly complex, edge-case family planning clinical scenario at a ${simLevel} difficulty level for a roleplay simulation. It must involve overlapping issues (e.g., medical contraindications + social pressure, or side effects + ARV interactions).
      Return ONLY valid JSON matching this exact structure, with no markdown formatting:
      {
        "id": "sim_dynamic_${Date.now()}",
        "title": "Short descriptive title",
        "difficulty": "${simLevel}",
        "emoji": "⚠️",
        "description": "1-2 sentences describing the complex situation.",
        "context": "Brief clinical and social context",
        "scoring_criteria": ["Array", "of", "5", "clinical", "and empathy", "goals"],
        "client_persona": "Detailed instructions for the AI playing the client. Include their fears, hidden motives, and how they should react.",
        "empathy_focus": true,
        "si_focus": false
      }`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generation_config: { temperature: 0.9 }
        })
      });
      const data = await res.json();
      let text = data.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const newScenario = JSON.parse(text);
      if (!newScenario.id) newScenario.id = `sim_dynamic_${Date.now()}`;
      setSelectedSim(newScenario);
    } catch (e) {
      alert("Failed to generate dynamic scenario. Check connection or API key.");
    }
    setGeneratingSim(false);
  };

  const totalPoints = Object.values(progress).reduce((sum, p) => sum + (p.points || 0), 0)
  const completedModules = MODULES.filter(m => progress[m.id]?.completed).length
  const completedSims = STATIC_SCENARIOS.filter(s => progress[s.id]?.completed).length
  const historyCount = loadHistory().length

  const getLevelTitle = (pts) => {
    if (pts >= 100) return { title: 'Expert Provider', emoji: '🏆', color: '#f59e0b' }
    if (pts >= 60) return { title: 'Skilled Provider', emoji: '⭐', color: '#14a044' }
    if (pts >= 30) return { title: 'Developing Provider', emoji: '📈', color: '#0d7377' }
    return { title: 'Learner', emoji: '📚', color: '#6b7280' }
  }
  const level = getLevelTitle(totalPoints)
  const langConfig = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  return (
    <div className="max-w-2xl mx-auto pb-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft size={15}/> Back
        </button>
        {/* Language Picker */}
        <div className="relative z-50">
          <button onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-teal-400 transition-colors shadow-sm">
            <Globe size={14}/>
            {langConfig.flag} {language === 'custom' ? (customLangText || 'Custom') : langConfig.label}
            <ChevronDown size={12}/>
          </button>
          {showLangPicker && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-2xl min-w-56 overflow-hidden">
              {LANGUAGES.map(l => (
                <div key={l.code}>
                  <button onClick={() => setLang(l.code)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-teal-50 transition-colors
                      ${language === l.code ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700'}`}>
                    <span>{l.flag}</span> {l.label}
                    {language === l.code && <span className="ml-auto text-teal-500">✓</span>}
                  </button>
                  {l.code === 'custom' && language === 'custom' && (
                    <div className="p-2 bg-gray-50 border-t border-gray-100 flex gap-2">
                      <input 
                        type="text" 
                        value={customLangText}
                        onChange={(e) => setCustomLangText(e.target.value)}
                        onKeyDown={handleCustomLangSubmit}
                        placeholder="e.g. Sheng mixed with Luo"
                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-400"
                        autoFocus
                      />
                      <button onClick={handleCustomLangSubmit} className="bg-teal-600 hover:bg-teal-700 text-white p-1.5 rounded transition-colors">
                        <CheckCircle size={14}/>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="rounded-2xl p-5 mb-5 shadow-lg relative overflow-hidden" style={{background:'linear-gradient(135deg,#0d7377 0%,#14a044 100%)'}}>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{color:'white'}}>
              🌿 Afya Mentor
            </h2>
            <p className="text-sm mt-0.5" style={{color:'rgba(204,251,241,0.9)'}}>
              AI-Powered FP Provider Training | {langConfig.flag} {langConfig.label}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl">{level.emoji}</div>
            <p className="text-xs mt-0.5 font-semibold tracking-wide uppercase" style={{color:'rgba(204,251,241,0.9)'}}>{level.title}</p>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-4 gap-2 mt-4">
          {[
            { value: totalPoints, label: 'Points' },
            { value: `${completedModules}/${MODULES.length}`, label: 'Modules' },
            { value: `${completedSims}/${STATIC_SCENARIOS.length}`, label: 'Sims' },
            { value: historyCount, label: 'Sessions' },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg p-2 text-center border border-white/10 backdrop-blur-sm" style={{background:'rgba(255,255,255,0.1)'}}>
              <p className="text-lg font-bold" style={{color:'white'}}>{stat.value}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{color:'rgba(204,251,241,0.9)'}}>{stat.label}</p>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div className="relative z-10 mt-4">
          <div className="flex justify-between text-xs mb-1 font-medium" style={{color:'rgba(204,251,241,0.8)'}}>
            <span>Progress to Expert</span><span>{totalPoints}/100</span>
          </div>
          <div className="bg-black/20 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-white transition-all shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{width:`${Math.min(totalPoints, 100)}%`}}/>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {[
          { key: 'ask', label: 'Ask', icon: <MessageCircle size={14}/> },
          { key: 'learn', label: 'Learn', icon: <BookOpen size={14}/> },
          { key: 'simulate', label: 'Simulate', icon: <Play size={14}/> },
          { key: 'peers', label: 'Peers', icon: <Users size={14}/> },
          { key: 'assess', label: 'Assess', icon: <ClipboardCheck size={14}/> },
          { key: 'ecpd', label: 'eCPD', icon: <Award size={14}/> },
        ].map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedModule(null); setSelectedSim(null); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shadow-sm border
                ${isActive ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {tab.icon} {tab.label}
            </button>
          )
        })}
      </div>

      {!geminiApiKey && activeTab !== 'peers' && activeTab !== 'learn' && activeTab !== 'assess' && activeTab !== 'ecpd' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 shadow-sm">
          <p className="text-sm text-amber-700 font-bold mb-1">⚠️ System AI Offline</p>
          <p className="text-xs text-amber-600">The universal Gemini AI key has not been configured in the environment variables.</p>
        </div>
      )}

      {/* ── ASK MENTOR (OPEN CHAT) TAB ── */}
      {activeTab === 'ask' && (
        <OpenMentorChat apiKey={geminiApiKey} language={language} customLangText={customLangText} langConfig={langConfig} />
      )}

      {/* ── LEARN TAB ── */}
      {activeTab === 'learn' && !selectedModule && (
        <div className="space-y-3">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 shadow-sm">
            <p className="text-sm text-teal-700 font-medium">
              📖 Complete modules to earn points. New: <strong>Empathy-Based Counselling</strong> and updated <strong>SI-First</strong> approach.
            </p>
          </div>
          {MODULES.map(module => {
            const done = progress[module.id]?.completed
            return (
              <button key={module.id} onClick={() => setSelectedModule(module)}
                className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-left hover:border-teal-400 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{background: module.color + '20'}}>
                    {module.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-gray-800 text-sm">{module.title}</p>
                      {done && <CheckCircle size={14} className="text-green-500"/>}
                      {module.id === 'mod_empathy_counselling' && <span className="text-[10px] font-bold bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">New</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{module.duration}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{background: module.color + '20', color: module.color}}>{module.category}</span>
                      <span className="text-xs text-gray-400">{module.level}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${done ? 'text-green-600' : 'text-gray-400'}`}>+{module.points}pts</p>
                    {done && <p className="text-xs text-gray-400">Score: {progress[module.id]?.score}/10</p>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {activeTab === 'learn' && selectedModule && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3"
            style={{background: selectedModule.color + '10'}}>
            <button onClick={() => setSelectedModule(null)} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={16}/>
            </button>
            <div className="text-xl">{selectedModule.emoji}</div>
            <div>
              <p className="font-bold text-gray-700 text-sm">{selectedModule.title}</p>
              <p className="text-xs text-gray-400">{selectedModule.duration} · {selectedModule.points} points</p>
            </div>
          </div>
          <ModuleViewer module={selectedModule}
            onComplete={(score, points) => {
              saveProgress(selectedModule.id, { completed: true, score, points })
              setSelectedModule(null)
            }}
          />
        </div>
      )}

      {/* ── SIMULATE TAB ── */}
      {activeTab === 'simulate' && !selectedSim && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-2 shadow-sm">
            <p className="text-sm text-blue-700 font-medium">
              🎭 Practice counselling with an AI client. You are the provider.
            </p>
          </div>

          <div className="flex items-center justify-between mb-2 mt-4">
            <p className="text-sm font-bold text-gray-700">Standard Scenarios</p>
            <button onClick={() => setActiveTab('history')}
              className="flex items-center gap-1 text-xs text-teal-600 hover:underline">
              <History size={12}/> View Past Sessions
            </button>
          </div>

          {STATIC_SCENARIOS.map(sim => {
            const done = progress[sim.id]?.completed
            const diffColors = { 'Beginner': '#14a044', 'Intermediate': '#f59e0b', 'Advanced': '#dc2626' }
            return (
              <button key={sim.id} onClick={() => setSelectedSim(sim)}
                disabled={!geminiApiKey}
                className={`w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-left transition-all
                  ${geminiApiKey ? 'hover:border-teal-400 hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">{sim.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-bold text-gray-800 text-sm">{sim.title}</p>
                      {done && <CheckCircle size={14} className="text-green-500"/>}
                    </div>
                    <p className="text-xs text-gray-500 mb-1.5">{sim.description}</p>
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                        style={{background: diffColors[sim.difficulty]}}>{sim.difficulty}</span>
                      {sim.si_focus && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">💉 SI-First</span>}
                      {sim.empathy_focus && <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">💗 Empathy</span>}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}

          <div className="mt-6 mb-2 bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={18} className="text-purple-600"/>
              <p className="text-sm font-bold text-purple-800">Dynamic Edge-Case Generator</p>
            </div>
            <p className="text-xs text-purple-600 mb-4">AI creates a unique, unpredictable clinical challenge for you on the fly.</p>
            <div className="flex gap-2">
              <select 
                value={simLevel} 
                onChange={(e) => setSimLevel(e.target.value)}
                className="w-1/3 border border-purple-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-800 bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Complex">Complex</option>
              </select>
              <button onClick={generateDynamicScenario} disabled={generatingSim || !geminiApiKey}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-colors text-sm">
                {generatingSim ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16}/>}
                {generatingSim ? 'Generating...' : `Generate ${simLevel} Case`}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'simulate' && selectedSim && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          style={{height: '650px', display: 'flex', flexDirection: 'column'}}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0 bg-gray-50">
            <button onClick={() => setSelectedSim(null)} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={16}/>
            </button>
            <span className="text-sm font-bold text-gray-600">Roleplay Simulation</span>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <CounsellingSimulator
              scenario={selectedSim}
              apiKey={geminiApiKey}
              language={language}
              customLangText={customLangText}
              langConfig={langConfig}
              onComplete={(score) => {
                if (!selectedSim.id.startsWith('sim_dynamic_')) {
                  saveProgress(selectedSim.id, { completed: true, score, points: score })
                }
                setSelectedSim(null)
              }}
            />
          </div>
        </div>
      )}

      {/* ── PEERS TAB ── */}
      {activeTab === 'peers' && (
        <div className="space-y-4">
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-2">
              <Users size={18} /> Official Provider & Youth Community
            </h3>
            <p className="text-xs text-green-700 mb-3 leading-relaxed">
              Join the official AfyaMEC WhatsApp group. Connect with other providers and youth to discuss adolescent-friendly service delivery, share field experiences, and consult on complex MEC cases in real-time.
            </p>
            <button onClick={() => window.open('https://chat.whatsapp.com/Im9mluV66rKFJGwhgeybdH?mode=gi_t', '_blank')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-sm">
              <MessageCircle size={16}/> Join Official WhatsApp Group
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><span className="text-orange-500">💬</span> Youth-Focused Discussions</h3>
            {YOUTH_DISCUSSIONS.map(disc => (
              <div key={disc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-3">
                <h3 className="font-bold text-gray-700 text-sm mb-2">{disc.title}</h3>
                <p className="text-sm text-gray-600 mb-3 italic">"{disc.prompt}"</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {disc.tags.map(tag => (
                    <span key={tag} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">{tag}</span>
                  ))}
                </div>
                <button onClick={() => {
                  const msg = encodeURIComponent(`🌿 *AfyaMEC Youth Discussion*\n\n*${disc.title}*\n\n${disc.prompt}\n\nWhat do you think? 👇`)
                  window.open(`https://wa.me/?text=${msg}`, '_blank')
                }} className="flex items-center justify-center gap-1.5 w-full text-sm bg-gray-50 border border-gray-200 text-gray-600 font-bold py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Send size={14}/> Share via WhatsApp
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-2">
            <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><span className="text-teal-500">👩‍⚕️</span> Provider-Focused Discussions</h3>
            {PROVIDER_DISCUSSIONS.map(disc => (
              <div key={disc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-3">
                <h3 className="font-bold text-gray-700 text-sm mb-2">{disc.title}</h3>
                <p className="text-sm text-gray-600 mb-3 italic">"{disc.prompt}"</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {disc.tags.map(tag => (
                    <span key={tag} className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-100">{tag}</span>
                  ))}
                </div>
                <button onClick={() => {
                  const msg = encodeURIComponent(`🌿 *AfyaMEC Provider Case Study*\n\n*${disc.title}*\n\n${disc.prompt}\n\nShare your experience 👇`)
                  window.open(`https://wa.me/?text=${msg}`, '_blank')
                }} className="flex items-center justify-center gap-1.5 w-full text-sm bg-gray-50 border border-gray-200 text-gray-600 font-bold py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Send size={14}/> Share via WhatsApp
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ── ASSESS TAB ── */}
      {activeTab === 'assess' && (
        <SupervisionChecklist />
      )}

      {/* ── eCPD TAB ── */}
      {activeTab === 'ecpd' && (
        <ECPDDashboard />
      )}

    </div>
  )
}