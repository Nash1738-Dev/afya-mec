import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Play, CheckCircle, RefreshCw,
         MessageCircle, Trophy, ChevronRight, Send,
         RotateCcw, Mic, MicOff, Volume2, VolumeX, History,
         Globe, Trash2, ChevronDown, ChevronUp, Zap, Users, Plus, ClipboardCheck, Award } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'

const GEMINI_MODEL = 'gemini-2.0-flash'

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

const ECPD_MODULES = {
  ecpd1: {
    id: 'ecpd1', title: 'Advanced LARC Insertion & Removal', credits: 2, icon: '🩹',
    content: [
      { type: 'lesson', title: 'IUD Insertion — Pre-procedure Checklist', text: `Before IUD insertion, always confirm:\n\n✅ Pregnancy ruled out (WHO 6-question checklist)\n✅ No active PID or STI (MEC Category 4)\n✅ Unexplained vaginal bleeding excluded\n✅ Informed consent obtained\n✅ BP and bimanual examination done\n\nEquipment needed:\n• Speculum, tenaculum, sound, IUD inserter\n• Sterile gloves, antiseptic solution\n• Emergency tray (atropine for vasovagal)`, highlight: '🚨 Never insert IUD with active PID — wait until treatment is complete [WHO MEC 6th Ed]' },
      { type: 'lesson', title: 'No-Touch IUD Insertion Technique', text: `The NO-TOUCH technique prevents uterine infection:\n\n1. CLEAN: Apply antiseptic to cervix — do NOT touch the insertion tube after this\n2. SOUND: Measure uterine depth — normal is 6-9cm\n3. LOAD: Load IUD without touching the insertion portion\n4. INSERT: Advance to fundus using withdrawal technique\n5. CUT: Leave 3cm of strings visible at os\n6. VERIFY: Bimanual to confirm fundal placement`, highlight: '⚠️ Sound depth <6cm or >9cm — proceed with caution, risk of perforation [Kenya MOH FP Guidelines 2023]' },
      { type: 'lesson', title: 'Implant Insertion — Subdermal Technique', text: `Implanon NXT (1-rod) insertion:\n\n1. Position: Non-dominant arm, inner upper arm, 8-10cm from medial epicondyle\n2. Mark: Mark insertion site with pen\n3. Anaesthetise: 1-2ml lidocaine subdermal — do NOT inject deep\n4. Insert: Bevel up at 20° angle, advance full length\n5. Retract: Hold obturator still, retract cannula\n6. Verify: Palpate to confirm placement\n7. Dress: Apply bandage 3-5 days\n\nJadelle (2-rod) — insert second rod at slight angle to first.`, highlight: '💡 If you cannot palpate the rod after insertion, do NOT assume it is placed — ultrasound required [WHO MEC 6th Ed]' },
      { type: 'lesson', title: 'LARC Removal — When and How', text: `Indications for removal:\n• Client request (any time)\n• Expiry (Cu-IUD 10yr, LNG-IUS 5yr, Implanon 3yr, Jadelle 5yr)\n• Medical complication (PID with IUD in situ — treat first, then consider removal)\n• Pregnancy (remove IUD if strings visible)\n\nImplant removal:\n• Use pop-out or U-technique for palpable rods\n• Non-palpable rods require ultrasound guidance before referral\n\nIUD removal:\n• Grasp strings with forceps and apply steady traction\n• If strings not visible: probe, then refer if not locatable`, highlight: '⚠️ Never forcefully remove a deeply embedded implant — refer to trained provider [Kenya MOH FP Guidelines 2023]' },
      { type: 'quiz', question: 'What is the minimum uterine depth required before safe IUD insertion?', options: ['4cm', '6cm', '8cm', '10cm'], correct: 1, explanation: 'Uterine depth <6cm increases perforation risk significantly. 6-9cm is the safe range. [WHO MEC 6th Ed]' },
      { type: 'quiz', question: 'After Implanon NXT insertion you cannot palpate the rod. What should you do?', options: ['Assume it is placed and close', 'Re-insert a new rod immediately', 'Order ultrasound before assuming placement', 'Ask the client to return in 2 weeks'], correct: 2, explanation: 'Non-palpable rods require ultrasound confirmation. Never assume placement. [Kenya MOH FP Guidelines 2023]' },
    ]
  },
  ecpd2: {
    id: 'ecpd2', title: 'Adolescent Sexual & Reproductive Health (ARSH)', credits: 3, icon: '🌱',
    content: [
      { type: 'lesson', title: 'Kenya ARSH Legal Framework', text: `Kenya law and policy on adolescent SRH:\n\n✅ Age of consent for medical care: 18 years (but FP services available to under-18s with confidentiality)\n✅ Kenya Sexual Offences Act: Provider MUST report suspected child sexual abuse\n✅ Parental consent: NOT required for adolescent FP services (Kenya MOH ARSH guidelines)\n✅ HIV testing: Adolescents 15+ can consent independently\n\nKey principle: Confidentiality is ABSOLUTE unless there is risk of harm to the adolescent or others.`, highlight: '⚖️ Confidentiality and non-judgement are legal AND ethical obligations for adolescent clients [Kenya MOH ARSH Guidelines]' },
      { type: 'lesson', title: 'Youth-Friendly Service Standards (YFHS)', text: `Kenya YFHS standards require:\n\n🌟 ACCESSIBLE — known hours, affordable, no parental requirement\n🌟 ACCEPTABLE — non-judgmental, confidential, respectful\n🌟 EQUITABLE — serves all adolescents regardless of gender, status\n🌟 APPROPRIATE — age-specific information, dual protection emphasis\n🌟 EFFECTIVE — evidence-based, linked to other services\n\nYouth-friendly language examples:\n❌ "Are you married?" → ✅ "Tell me about your relationship"\n❌ "Why are you sexually active?" → ✅ "What brings you in today?"`, highlight: '💡 A youth-friendly provider asks, listens, and never judges [Kenya MOH ARSH Guidelines]' },
      { type: 'lesson', title: 'Best FP Methods for Adolescents', text: `WHO MEC + Kenya ARSH recommendations:\n\n✅ Implant — Category 1. TOP CHOICE. Long-acting, private, reversible.\n✅ Cu-IUD/LNG-IUS — Category 2. Nulliparity NOT a contraindication.\n⚠️ DMPA — Category 2 under 16 (bone density concern). Not first choice.\n✅ COC/POP — Category 1 with no contraindications.\n✅ Condoms — ALWAYS. Dual protection is the standard.\n\nKey message to adolescents:\n"The best method for you is one you will USE correctly and consistently."`, highlight: '💊 Implant is the preferred LARC for adolescents in Kenya. DMPA under 16 needs careful counselling about bone health [Kenya MOH ARSH Guidelines]' },
      { type: 'lesson', title: 'Assessing for Coercion — The SAFE Protocol', text: `Before providing FP to adolescents, assess for coercion:\n\nS — Safety: "Do you feel safe at home and in your relationship?"\nA — Afraid: "Is anyone pressuring you about sex or pregnancy?"\nF — Friends/Family: "Do you have adults you trust to talk to?"\nE — Emergency: "Do you know how to get help in an emergency?"\n\nIf coercion is identified:\n• Do NOT refuse services — this increases risk\n• Provide services AND link to safeguarding resources\n• Document carefully\n• Mandatory reporting if sexual abuse of a minor is disclosed`, highlight: '🚨 If a minor discloses sexual abuse, you MUST report to authorities under the Sexual Offences Act — this is NOT optional [Kenya Sexual Offences Act 2006]' },
      { type: 'quiz', question: 'A 16-year-old comes alone for FP. Her parent is not with her. Can you provide services?', options: ['No — she needs parental consent', 'Yes — Kenya MOH ARSH guidelines allow confidential FP for adolescents without parental consent', 'Only if she is married', 'Only emergency contraception, not ongoing methods'], correct: 1, explanation: 'Kenya MOH ARSH guidelines explicitly allow confidential FP services for adolescents without parental consent. Confidentiality is an ethical and policy obligation. [Kenya MOH ARSH Guidelines]' },
      { type: 'quiz', question: 'A 15-year-old requests DMPA. You are aware of bone density concerns. What do you do?', options: ['Refuse — DMPA is Category 4 under 18', 'Provide DMPA after counselling about bone density, and offer implant as the preferred alternative', 'Only give condoms until she is 18', 'Require parent to be present before providing DMPA'], correct: 1, explanation: 'DMPA is Category 2 for adolescents under 16 — not contraindicated, but requires counselling about bone density. Implant is preferred but DMPA is acceptable. [WHO MEC 6th Ed, Kenya MOH ARSH Guidelines]' },
    ]
  }
}

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

  const [audioEnabled, setAudioEnabled] = useState(false)
  const synthRef = useRef(window.speechSynthesis)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages]);

  const speakText = (text) => {
    if (!audioEnabled || !synthRef.current) return
    synthRef.current.cancel()
    const clean = text.replace(/[*#]/g, '').trim()
    const utterance = new SpeechSynthesisUtterance(clean.substring(0, 500))
    utterance.lang = langConfig.voiceLang
    utterance.rate = 0.9
    synthRef.current.speak(utterance)
  }

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

  const getSystemPrompt = () => `You are "Afya Mentor", an expert Kenya MOH Family Planning clinical trainer.

LANGUAGE: ${getLangInstruction(language, customLangText)}

SCOPE FENCE — CRITICAL:
You ONLY answer questions about Family Planning, Reproductive Health, Sexual Health, and directly related topics (nutrition in FP context, HIV/ARV interactions with FP methods, adolescent SRH, etc.).
If asked ANYTHING outside this scope (politics, cooking, general medicine unrelated to FP, entertainment, etc.), respond EXACTLY: "I'm specialised in Family Planning only. For other questions, please use a general AI assistant like ChatGPT or Google."

FP KNOWLEDGE BASE (use in strict priority order):
1. Kenya MOH FP Guidelines (2023) — PRIMARY SOURCE
2. WHO Medical Eligibility Criteria 6th Edition — PRIMARY SOURCE  
3. BCS+ (Balanced Counselling Strategy Plus) — Kenya standard counselling framework
4. MAPS technique for DMPA-SC self-injection
5. General peer-reviewed reproductive health literature — SECONDARY SOURCE ONLY

CITATION RULES:
- End every factual point with a source tag: [Kenya MOH FP Guidelines 2023], [WHO MEC 6th Ed], [BCS+], or [General RH Literature]
- When using secondary sources, start with: "Based on general reproductive health literature (not in Kenya MOH guidelines)..."
- NEVER fabricate guidelines. If unsure, say so.
- Include a real URL only when you are certain it is correct (e.g., https://www.who.int/publications/i/item/9789240084551 for WHO MEC)

FORMATTING RULES — CRITICAL:
- Use plain HTML-style bold with double asterisks is NOT acceptable.
- Structure responses with clear sections using emojis as headers (e.g. "✅ Answer:", "📋 Steps:", "⚠️ Caution:")
- Use bullet points (•) not dashes
- Maximum 4 bullet points per section — be concise
- Never use *asterisks* for bold — the UI renders them as plain text

COUNSELLING FRAMEWORK: Always reference BCS+ (not REDI) for counselling guidance. BCS+ is the Kenya MOH standard with 4 stages: Pre-Choice, Method Choice, Post-Choice, STI/HIV.`

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
      
      if (res.status === 429) {
        throw new Error('429 - Rate limit exceeded')
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(`API ${res.status}: ${data.error?.message || JSON.stringify(data)}`)
      }
      
      const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawReply) throw new Error('Empty response')
      const reply = rawReply
      
      const finalMessages = [...newMessages, { role: 'assistant', content: reply }];
      setMessages(finalMessages);
      saveToHistory(finalMessages);
    } catch (e) {
      console.error('Gemini error:', e)
      const is429 = e.message?.includes('429') || String(e).includes('429')
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: is429 
          ? '⏳ Too many requests — Gemini free tier limit reached. Wait 30 seconds and try again.' 
          : 'Network error — check your connection.'
      }])
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-teal-600"/>
          <span className="font-bold text-gray-700 text-sm">Ask Mentor ({language === 'custom' ? customLangText || 'Custom' : langConfig.label})</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors
              ${audioEnabled ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:text-teal-600'}`}>
            {audioEnabled ? <Volume2 size={14}/> : <VolumeX size={14}/>}
            {audioEnabled ? 'Audio' : 'Audio'}
          </button>
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
                  {msg.role === 'assistant' && audioEnabled && msg.content && (
                    <button onClick={() => speakText(msg.content)} 
                      className="mt-1 self-start text-xs text-gray-400 hover:text-teal-600 flex items-center gap-1">
                      <Volume2 size={10}/> Listen
                    </button>
                  )}
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
    if (!apiKey) {
      alert('AI key not configured. Check Settings.')
      return
    }
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
      
      if (res.status === 429) {
        throw new Error('429 - Rate limit exceeded')
      }
      const data = await res.json()
      const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawReply) throw new Error('Empty response')
      const reply = rawReply
      
      const sessionComplete = reply.includes('[SESSION_COMPLETE]') || turnCount >= 12
      const cleanReply = reply.replace('[SESSION_COMPLETE]', '').trim()
      setMessages(prev => [...prev, { role: 'assistant', content: cleanReply }])
      
      if (audioEnabled) speakText(cleanReply)
      
      if (sessionComplete) {
        setTimeout(() => generateFeedback([...newMessages, { role: 'assistant', content: cleanReply }]), 1000)
      }
    } catch (e) {
      const is429 = e.message?.includes('429') || String(e).includes('429')
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: is429 
          ? '⏳ Too many requests — Gemini free tier limit reached. Wait 30 seconds and try again.' 
          : 'Network error — check your connection.'
      }])
    } finally {
      setLoading(false)
    }
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
    } catch (e) {
      setFeedback('Could not generate feedback — check internet connection.')
    } finally {
      setLoading(false)
    }
  }

  const startSession = () => {
    setPhase('active')
    const opener = scenario.id === 'sim_empathy_side_effects'
      ? '*enters nervously* Good morning... I haven\'t had my period for 3 months since starting the injection. I\'m thinking of stopping...'
      : scenario.id === 'sim_si_training'
        ? '*looking at the device nervously* Good morning. I have to inject myself? I don\'t know how to do this...'
        : '*enters clinic* Good morning. I was told to come here for family planning...'
    setMessages([{ role: 'assistant', content: opener, isOpener: true }])
    if (audioEnabled) setTimeout(() => speakText(opener), 500)
  }

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
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm min-h-[40px]
              ${msg.role === 'user' ? 'text-white rounded-tr-none bg-teal-600' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
              {msg.content || <span className="text-gray-300 italic">Thinking...</span>}
              {msg.role === 'assistant' && audioEnabled && msg.content && (
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
      onComplete(finalScore, module.points || module.credits)
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
        <p className="text-2xl font-bold text-teal-600">+{module.points || module.credits} pts</p>
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
function SupervisionChecklist({ apiKey }) {
  const facility = getFacilitySettings()
  const [responses, setResponses] = useState(() => JSON.parse(localStorage.getItem('afyamentor_disc_responses') || '{}'))
  const [aiSummary, setAiSummary] = useState('')
  const [generating, setGenerating] = useState(false)
  const [activeSection, setActiveSection] = useState('training')

  const saveResponse = (id, value) => {
    const updated = { ...responses, [id]: value }
    setResponses(updated)
    localStorage.setItem('afyamentor_disc_responses', JSON.stringify(updated))
  }

  const SECTIONS = {
    training: {
      label: '📚 Training', color: '#0d7377',
      questions: [
        { id: 'q1', text: 'Are FP providers trained/mentored on DMPA-SC SI?', type: 'select', options: ['All providers (10%)', 'Some providers (5%)', 'None (0%)'], scores: [10, 5, 0] },
        { id: 'q2', text: 'Has the site received support supervision within 6 weeks post-training?', type: 'yesno', scores: [5, 0] },
        { id: 'q3', text: 'How many providers trained in Empathy-Based Counselling?', type: 'number' },
      ]
    },
    supply: {
      label: '📦 Supply Chain', color: '#7c3aed',
      questions: [
        { id: 'q4', text: 'Any FP method stockouts in the past 3 months?', type: 'yesno', scores: [0, 5], invert: true },
        { id: 'q5', text: 'Are stock cards being used correctly and up to date?', type: 'yesno', scores: [5, 0] },
        { id: 'q6', text: 'Did facility receive FP commodities for last orders placed?', type: 'yesno', scores: [5, 0] },
        { id: 'q7', text: 'If limited SI stock, are clients still counselled and trained on SI?', type: 'yesno', scores: [5, 0] },
      ]
    },
    service: {
      label: '💉 SI Service Delivery', color: '#14a044',
      questions: [
        { id: 'q8', text: 'Does the facility have a private lockable room for FP counselling?', type: 'yesno', scores: [5, 0] },
        { id: 'q9', text: 'SI counselling offered all days of the week?', type: 'yesno', scores: [5, 0] },
        { id: 'q10', text: 'All SI supplies available? (instruction sheet, sharps box, training device, DMPA-SC, MEC wheel)', type: 'select', options: ['All 5+ supplies (10%)', '3-4 supplies (6%)', '0-2 supplies (0%)'], scores: [10, 6, 0] },
        { id: 'q11', text: 'Clients given take-home SI doses from second visit?', type: 'yesno', scores: [5, 0] },
      ]
    },
    data: {
      label: '📊 Data & Reporting', color: '#f59e0b',
      questions: [
        { id: 'q12', text: 'MOH 512, 711, and 747A reporting tools updated and available?', type: 'select', options: ['All tools (6%)', 'Some tools (4%)', 'No tools (0%)'], scores: [6, 4, 0] },
        { id: 'q13', text: 'DMPA-SC SI data disaggregated with doses dispensed?', type: 'select', options: ['All 3 months (6%)', 'Inconsistently (4%)', 'No disaggregation (0%)'], scores: [6, 4, 0] },
        { id: 'q14', text: 'Facility reporting consistently via ODK last 3 months?', type: 'select', options: ['All 3 months (6%)', 'Inconsistently (4%)', 'No reporting (0%)'], scores: [6, 4, 0] },
        { id: 'q15', text: 'DMPA-SC SI clients seen in past 3 months (enter number)', type: 'number' },
      ]
    }
  }

  const calcScore = () => {
    let total = 0, max = 0
    Object.values(SECTIONS).forEach(section => {
      section.questions.forEach(q => {
        if (q.scores) {
          max += q.scores[0]
          const resp = responses[q.id]
          if (resp !== undefined && resp !== '') {
            total += q.scores[parseInt(resp)] || 0
          }
        }
      })
    })
    return { total, max, pct: max > 0 ? Math.round((total / max) * 100) : 0 }
  }

  const generateAISummary = async () => {
    if (!apiKey) return
    setGenerating(true)
    const scoreData = calcScore()
    const responseText = Object.entries(responses).map(([k, v]) => `${k}: ${v}`).join(', ')
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `You are a Kenya MOH DISC project supervisor. Based on this facility assessment:
Facility: ${facility.facility_name || 'Unknown'} | County: ${facility.county || 'Unknown'} | Score: ${scoreData.total}/${scoreData.max} (${scoreData.pct}%)
Responses: ${responseText}

Generate a concise supervision feedback report with:
1. Overall score interpretation (what it means)
2. Top 2 strengths observed
3. Top 3 priority actions needed (specific, actionable)
4. One motivational closing statement for the provider

Keep it under 200 words. Use bullet points. Reference Kenya MOH/DISC guidelines.` }] }],
            generation_config: { temperature: 0.4 }
          }) }
      )
      const data = await res.json()
      setAiSummary(data.candidates[0].content.parts[0].text || '')
    } catch { setAiSummary('Could not generate summary. Check connection.') }
    setGenerating(false)
  }

  const score = calcScore()
  const scoreColor = score.pct >= 80 ? '#14a044' : score.pct >= 50 ? '#f59e0b' : '#dc2626'

  return (
    <div className="space-y-4">
      {/* Facility info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-800 mb-1">📍 Facility Being Assessed</p>
        <p className="text-sm font-semibold text-blue-900">{facility.facility_name || 'Set in Settings'}</p>
        <p className="text-xs text-blue-600">{facility.sub_county || '—'} Sub-County, {facility.county || '—'} County | Code: {facility.facility_code || '—'}</p>
      </div>

      {/* Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Assessment Score</p>
          <p className="text-3xl font-bold" style={{color: scoreColor}}>{score.pct}%</p>
          <p className="text-xs text-gray-400">{score.total}/{score.max} points</p>
        </div>
        <div className="w-20 h-20 relative">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
              strokeDasharray={`${score.pct} ${100 - score.pct}`} strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Section tabs */}
      <div className="grid grid-cols-4 gap-1">
        {Object.entries(SECTIONS).map(([key, section]) => (
          <button key={key} onClick={() => setActiveSection(key)}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-colors text-center
              ${activeSection === key ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
            style={activeSection === key ? {background: section.color} : {}}>
            {section.label.split(' ')[0]}<br/>{section.label.split(' ').slice(1).join(' ')}
          </button>
        ))}
      </div>

      {/* Active section questions */}
      {Object.entries(SECTIONS).map(([key, section]) => activeSection === key && (
        <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 font-bold text-white text-sm" style={{background: section.color}}>
            {section.label}
          </div>
          <div className="divide-y divide-gray-100">
            {section.questions.map(q => (
              <div key={q.id} className="p-4">
                <p className="text-sm text-gray-700 font-medium mb-2">{q.text}</p>
                {q.type === 'yesno' && (
                  <div className="flex gap-2">
                    {['Yes', 'No'].map((opt, i) => (
                      <button key={opt} onClick={() => saveResponse(q.id, i)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors
                          ${responses[q.id] === i ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        style={responses[q.id] === i ? {background: i === 0 ? '#14a044' : '#dc2626'} : {}}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === 'select' && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => (
                      <button key={opt} onClick={() => saveResponse(q.id, i)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs border-2 transition-colors
                          ${responses[q.id] === i ? 'border-teal-400 bg-teal-50 text-teal-700 font-bold' : 'border-gray-200 text-gray-600 hover:border-teal-200'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === 'number' && (
                  <input type="number" min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                    placeholder="Enter number..."
                    value={responses[q.id] || ''}
                    onChange={e => saveResponse(q.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* AI Summary */}
      <button onClick={generateAISummary} disabled={generating || !apiKey}
        className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:bg-gray-300"
        style={{background: 'linear-gradient(135deg,#0d7377,#14a044)'}}>
        {generating ? <RefreshCw size={16} className="animate-spin"/> : <Zap size={16}/>}
        {generating ? 'Generating AI Summary...' : 'Generate AI Supervision Report'}
      </button>

      {aiSummary && (
        <div className="bg-white border border-teal-200 rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-teal-700 text-sm mb-3 flex items-center gap-2">
            <CheckCircle size={16}/> AI Supervision Report — {facility.facility_name}
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {aiSummary.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '')}
          </p>
          <p className="text-xs text-gray-400 mt-3">Generated {new Date().toLocaleString('en-KE')} | Score: {score.pct}%</p>
        </div>
      )}

      <button onClick={() => { if(confirm('Reset all responses?')) { setResponses({}); setAiSummary(''); localStorage.removeItem('afyamentor_disc_responses') } }}
        className="text-xs text-red-500 hover:text-red-700 underline">Reset Assessment</button>
    </div>
  )
}

// ── eCPD POC DASHBOARD ────────────────────────────────────────────────────────
function ECPDDashboard({ apiKey }) {
  const [activeCourse, setActiveCourse] = useState(null)
  const [credits, setCredits] = useState(() => JSON.parse(localStorage.getItem('afyamentor_ecpd_credits') || '{}'))

  const earnCredit = (courseId, score) => {
    if (score >= 6) {
      const updated = { ...credits, [courseId]: { earned: true, score, date: new Date().toLocaleDateString('en-KE') } }
      setCredits(updated)
      localStorage.setItem('afyamentor_ecpd_credits', JSON.stringify(updated))
    }
    setActiveCourse(null)
  }

  // Recalculate properly
  const earnedCredits = Object.entries(credits).filter(([,v]) => v.earned).reduce((sum, [id]) => {
    return sum + (ECPD_MODULES[id]?.credits || 0)
  }, 0)

  if (activeCourse) return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-indigo-50">
        <button onClick={() => setActiveCourse(null)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={16}/>
        </button>
        <div className="text-xl">{activeCourse.icon}</div>
        <div>
          <p className="font-bold text-gray-700 text-sm">{activeCourse.title}</p>
          <p className="text-xs text-indigo-600">{activeCourse.credits} CPD Credits on completion</p>
        </div>
      </div>
      <ModuleViewer
        module={activeCourse}
        onComplete={(score) => earnCredit(activeCourse.id, score)}
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5 text-white shadow-md" style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)'}}>
        <h3 className="font-bold text-lg flex items-center gap-2"><Award size={20}/> AI-Assisted eCPD</h3>
        <p className="text-sm mt-1 opacity-90">Earn CPD credits by completing Kenya MOH-aligned FP courses with AI-assessed quizzes.</p>
        <div className="mt-4 bg-white/20 rounded-lg p-3 inline-block">
          <p className="text-xs uppercase tracking-widest opacity-80">Credits Earned</p>
          <p className="text-2xl font-bold">{earnedCredits} <span className="text-sm font-normal opacity-80">CPD Points</span></p>
        </div>
      </div>

      <div className="grid gap-3">
        {Object.values(ECPD_MODULES).map(course => {
          const earned = credits[course.id]?.earned
          return (
            <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl bg-gray-50 p-3 rounded-full">{course.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm">{course.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {course.credits} CPD Credits · {course.content.filter(c => c.type === 'lesson').length} lessons · {course.content.filter(c => c.type === 'quiz').length} quiz questions
                  </p>
                  {earned && (
                    <p className="text-xs text-green-600 font-bold mt-1">
                      ✅ Completed — {credits[course.id]?.date} · Score: {credits[course.id]?.score}/10
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setActiveCourse(course)}
                className={`w-full font-bold py-2.5 rounded-xl text-sm transition-colors ${earned ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'text-white'}`}
                style={!earned ? {background:'linear-gradient(135deg,#4f46e5,#7c3aed)'} : {}}>
                {earned ? '🔄 Retake Course' : `Start Course — Earn ${course.credits} CPD Credits`}
              </button>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-center text-gray-400 italic">eCPD is currently a Proof of Concept. Official CPD accreditation integration with Kenya MOH is in development.</p>
    </div>
  )
}

function DynamicPeerDiscussion({ apiKey, langConfig, language, customLangText }) {
  const [customTopic, setCustomTopic] = useState('')
  const [generatedTopic, setGeneratedTopic] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [shareMode, setShareMode] = useState('type') // 'type' | 'generate'

  const generateTopic = async () => {
    if (!apiKey) return
    setGenerating(true)
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `Generate a realistic, provocative peer discussion question for Kenya family planning health providers. It should be a real clinical or social dilemma (not textbook). Return JSON only: {"title": "short title with emoji", "prompt": "the discussion question", "tags": ["tag1","tag2"]}` }] }],
            generation_config: { temperature: 0.9 }
          }) }
      )
      const data = await res.json()
      let text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim()
      setGeneratedTopic(JSON.parse(text))
    } catch { setGeneratedTopic({ title: '💬 Open Discussion', prompt: 'Share a challenging FP case from your practice this month.', tags: ['Clinical'] }) }
    setGenerating(false)
  }

  const shareOnWhatsApp = (title, prompt) => {
    const msg = encodeURIComponent(`🌿 *AfyaMEC Peer Discussion*\n\n*${title}*\n\n${prompt}\n\nShare your experience 👇`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-4 mb-4">
      <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
        <Zap size={16} className="text-purple-600"/> Dynamic Discussion Topics
      </h3>
      <div className="flex gap-2 mb-3">
        {['type', 'generate'].map(mode => (
          <button key={mode} onClick={() => setShareMode(mode)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors
              ${shareMode === mode ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {mode === 'type' ? '✍️ Type Your Case' : '⚡ AI Generate Topic'}
          </button>
        ))}
      </div>

      {shareMode === 'type' && (
        <div>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 resize-none"
            rows={3}
            placeholder="Describe a clinical case, dilemma, or question you want to discuss with peers..."
            value={customTopic}
            onChange={e => setCustomTopic(e.target.value)}
          />
          <button onClick={() => shareOnWhatsApp('Provider Case Discussion', customTopic)}
            disabled={!customTopic.trim()}
            className="mt-2 w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Share on WhatsApp
          </button>
        </div>
      )}

      {shareMode === 'generate' && (
        <div>
          <button onClick={generateTopic} disabled={generating || !apiKey}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors mb-3">
            {generating ? <RefreshCw size={14} className="animate-spin"/> : <Zap size={14}/>}
            {generating ? 'Generating...' : 'Generate New Topic'}
          </button>
          {generatedTopic && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="font-bold text-purple-800 text-sm mb-1">{generatedTopic.title}</p>
              <p className="text-sm text-gray-700 italic mb-3">"{generatedTopic.prompt}"</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {generatedTopic.tags?.map(t => (
                  <span key={t} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <button onClick={() => shareOnWhatsApp(generatedTopic.title, generatedTopic.prompt)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Share on WhatsApp
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function AfyaMentor() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  
  // THE CORRECT VITE WAY: Just declare it directly. Vite safely replaces this at build time.
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || facility.gemini_api_key || ''
  console.log('API KEY STATUS:', geminiApiKey ? `Set (${geminiApiKey.substring(0,10)}...)` : 'NOT SET')

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
          
          {/* Dynamic Peer Topic Generator */}
          <>
            <DynamicPeerDiscussion apiKey={geminiApiKey} langConfig={langConfig} language={language} customLangText={customLangText} />
          </>

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
        <SupervisionChecklist apiKey={geminiApiKey} />
      )}

      {/* ── eCPD TAB ── */}
      {activeTab === 'ecpd' && (
        <ECPDDashboard apiKey={geminiApiKey} />
      )}

    </div>
  )
}