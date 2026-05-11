import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Play, CheckCircle, RefreshCw,
         MessageCircle, Trophy, ChevronRight, Send,
         RotateCcw, Mic, MicOff, Volume2, VolumeX, History,
         Globe, Trash2, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'

const GEMINI_MODEL = 'gemini-2.5-flash'

// ── LANGUAGE CONFIG ────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', voiceLang: 'en-KE', greeting: 'Hello' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪', voiceLang: 'sw-KE', greeting: 'Habari' },
  { code: 'sheng', label: 'Sheng', flag: '🏙️', voiceLang: 'sw-KE', greeting: 'Sema' },
  { code: 'ki', label: 'Kikuyu', flag: '🌿', voiceLang: 'sw-KE', greeting: 'Wĩmwega' },
  { code: 'luo', label: 'Dholuo', flag: '🌊', voiceLang: 'sw-KE', greeting: 'Misawa' },
  { code: 'kam', label: 'Kamba', flag: '🦁', voiceLang: 'sw-KE', greeting: 'Ũvĩo' },
]

const LANG_INSTRUCTIONS = {
  en: 'Respond in clear, simple English appropriate for a Kenyan health worker.',
  sw: 'Jibu kwa Kiswahili safi na rahisi kinachofaa kwa mfanyakazi wa afya wa Kenya. Tumia maneno ya kawaida ya kliniki ya Kiswahili.',
  sheng: 'Jibu kwa Sheng — mchanganyiko wa Kiswahili na Kiingereza kama unavyosemwa Nairobi. Tumia lugha ya vijana lakini uwe serious kuhusu maudhui ya kliniki. Mfano: "Sawa si, hii method inafanya kazi aje..."',
  ki: 'Jibu kwa Kikuyu na Kiswahili ukichanganya. Tumia maneno ya Kikuyu kwa salamu na mazungumzo ya kawaida, lakini Kiswahili kwa maudhui ya kliniki.',
  luo: 'Jibu kwa Dholuo na Kiswahili ukichanganya. Tumia Dholuo kwa salamu na mazungumzo ya kawaida.',
  kam: 'Jibu kwa Kamba na Kiswahili ukichanganya. Tumia Kamba kwa salamu na mazungumzo ya kawaida.',
}

// ── MODULES ────────────────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'mod_bcs_intro',
    title: 'BCS+ Algorithm — The 4 Stages',
    category: 'Counselling',
    emoji: '🗂️',
    duration: '8 min',
    level: 'Foundation',
    color: '#0d7377',
    points: 10,
    content: [
      { type: 'lesson', title: 'What is BCS+?',
        text: `The Balanced Counselling Strategy Plus (BCS+) is Kenya's evidence-based approach to FP counselling, developed by the Population Council.\n\nBCS+ ensures every client receives complete, high-quality FP counselling regardless of which provider they see. It is the official Kenya MOH standard for FP service delivery (2023).`,
        highlight: '✅ BCS+ is NOT optional — it is the Kenya MOH standard' },
      { type: 'lesson', title: 'Stage 1: Pre-Choice',
        text: `In the Pre-Choice stage:\n1. Establish a warm, respectful relationship\n2. Determine why they have come today\n3. Rule out pregnancy using the WHO 6-question checklist or PDT\n4. Display ALL method cards — never pre-select\n5. Ask screening questions and set aside inappropriate methods\n\nKey principle: You are identifying options, not making choices for the client.`,
        highlight: '🎯 You are a guide, not a decision-maker' },
      { type: 'lesson', title: 'Stage 2: Method Choice',
        text: `In Method Choice:\n6. Present remaining methods starting with most effective\n7. Ask the client to choose — the decision belongs to them\n8. Confirm no MEC contraindications\n\n⚡ SI-FIRST APPROACH: When DMPA-SC is eligible, ALWAYS present self-injection as the preferred option first. Say: "This method can be given here by me, OR you can learn to give it yourself at home — most clients prefer this option."`,
        highlight: '💉 Lead with self-injection — it is the default for eligible DMPA-SC clients' },
      { type: 'lesson', title: 'Stages 3 & 4: Post-Choice & STI/HIV',
        text: `Stage 3 — Post-Choice:\n9. Counsel on chosen method in detail\n10. Check comprehension (ask them to repeat back)\n11. Provide the method or referral\n\nStage 4 — STI/HIV:\n12. Discuss STI/HIV prevention\n13. Conduct HIV risk assessment\n14. Offer HTC\n15. Give follow-up and return date`,
        highlight: '💡 Always offer condoms for dual protection' },
      { type: 'quiz', question: 'According to BCS+, when should you display contraceptive method cards?',
        options: ['After asking preferred method', 'Before screening — show ALL methods first', 'Only after ruling out pregnancy', 'Only appropriate methods'],
        correct: 1, explanation: 'BCS+ Step 4: Display ALL method cards before screening. Never pre-select.' },
      { type: 'quiz', question: 'For a DMPA-SC eligible client, what should you offer first according to SI-first approach?',
        options: ['Provider-administered injection', 'Self-injection as the preferred option', 'Pills since they are easier', 'Implant for longer protection'],
        correct: 1, explanation: 'SI-first means always presenting self-injection as the default for eligible DMPA-SC clients. Empower the client.' },
    ]
  },
  {
    id: 'mod_empathy_counselling',
    title: 'Empathy-Based Counselling — The OARS Framework',
    category: 'Counselling',
    emoji: '💗',
    duration: '9 min',
    level: 'Foundation',
    color: '#ec4899',
    points: 15,
    content: [
      { type: 'lesson', title: 'Why Empathy Changes Everything',
        text: `Research shows that empathic counselling increases:\n✅ Client satisfaction by 40%\n✅ Method continuation by 35%\n✅ Honest disclosure of concerns\n✅ Return visit rates\n\nThe OARS framework from Motivational Interviewing is the gold standard for FP counselling empathy:\n\n🔵 O — Open questions\n🔵 A — Affirmations\n🔵 R — Reflective listening\n🔵 S — Summarising`,
        highlight: '💗 Clients who feel heard are more likely to use FP correctly and consistently' },
      { type: 'lesson', title: 'O — Open Questions',
        text: `Open questions invite the client to share more. They cannot be answered with Yes/No.\n\n❌ Closed: "Are you married?"\n✅ Open: "Tell me about your family situation."\n\n❌ Closed: "Do you have any side effects?"\n✅ Open: "How has the method been working for you?"\n\n❌ Closed: "Do you want to continue with DMPA?"\n✅ Open: "What are your thoughts about continuing with the injection?"`,
        highlight: '🎯 Start counselling sentences with: Tell me... What... How... Walk me through...' },
      { type: 'lesson', title: 'A & R — Affirm and Reflect',
        text: `AFFIRMATIONS — Recognise the client's strengths:\n"You've been coming back for your injections consistently — that takes commitment."\n"It's really smart that you came in to discuss this before making a decision."\n\nREFLECTIVE LISTENING — Mirror what you hear:\nClient: "I'm worried the injection will make me fat."\nProvider: "So you've heard that weight gain can happen, and that's a real concern for you."\n\nThis validates the concern WITHOUT dismissing it, and opens space for accurate information.`,
        highlight: '💬 Reflection = "I hear you" before "let me explain"' },
      { type: 'lesson', title: 'S — Summarise + The Empathy Sandwich',
        text: `SUMMARISING — Recap before moving to counselling:\n"So let me make sure I understand: You want to avoid pregnancy for 2 more years, you're worried about weight gain, and your husband doesn't know you're here. Is that right?"\n\nTHE EMPATHY SANDWICH for difficult conversations:\n🍞 Acknowledge the feeling: "I hear that you're worried..."\n🥗 Provide accurate information: "What the evidence actually shows is..."\n🍞 Validate their choice: "You know your body best, and your decision is respected."`,
        highlight: '🥪 Always lead with empathy, THEN information — never information first' },
      { type: 'quiz', question: 'A client says "I stopped my pills because they were making me feel sick." What is the BEST empathic response?',
        options: [
          'You should not have stopped without telling us first.',
          'The pills don\'t actually cause those symptoms.',
          'That sounds really difficult — feeling unwell every day would worry anyone. Tell me more about what you experienced.',
          'Let me give you a different type of pill.'
        ], correct: 2, explanation: 'The empathy sandwich starts with acknowledging the feeling before any information or redirection. Reflect first, then explore.' },
      { type: 'quiz', question: 'Which of these is an OPEN question in FP counselling?',
        options: ['Are you currently using contraception?', 'Do you want to start family planning today?', 'What brings you to the clinic today?', 'Is your husband supportive?'],
        correct: 2, explanation: '"What brings you..." invites narrative and cannot be answered yes/no. Open questions build rapport and reveal the full picture.' },
    ]
  },
  {
    id: 'mod_dmpa_sc_si',
    title: 'DMPA-SC Self-Injection: SI-First Approach',
    category: 'DMPA-SC',
    emoji: '💉',
    duration: '7 min',
    level: 'Practical',
    color: '#14a044',
    points: 10,
    content: [
      { type: 'lesson', title: 'SI-First: Why Lead With Self-Injection',
        text: `The SI-first approach means presenting self-injection as the DEFAULT for all eligible DMPA-SC clients — not as an optional add-on.\n\n✅ Evidence: SI clients have 50% higher continuation (RCT, Malawi)\n✅ Women strongly prefer SI for privacy and convenience\n✅ Reduces facility visit burden — critical in rural Kenya\n✅ Empowers women to control their own health\n\nHow to present it:\n"This injection can be given by me today, OR — and this is what most women choose — I can train you to give it yourself at home. Which would you prefer?"`,
        highlight: '💡 Frame SI as empowering, not scary — most clients say YES when asked this way' },
      { type: 'lesson', title: 'MAPS — The 4 Self-Injection Steps',
        text: `MAPS is the memory aid for client training:\n\n🔵 M — MIX: Shake vigorously 30 seconds until cloudy\n🔵 A — ACTIVATE: Push needle cap and reservoir port together — click!\n🔵 P — PINCH: Pinch lower abdomen (2 inches from navel) or upper thigh — form a tent\n🔵 S — SELF-INJECT: Insert at 45° angle. Squeeze slowly until empty (~5 seconds)\n\nAfter injecting:\n• Remove needle while still pinching\n• Gentle pressure — do NOT rub\n• Dispose in sharps container immediately\n• Record date, calculate next (13 weeks)`,
        highlight: '📌 M-A-P-S: Mix, Activate, Pinch, Self-inject' },
      { type: 'lesson', title: 'Training the Client — The Teach-Back Method',
        text: `Use the TEACH-BACK method for SI training:\n\n1. DEMONSTRATE: "Let me show you on this model first."\n2. EXPLAIN: Walk through each MAPS step with the reason\n3. CLIENT DEMONSTRATES: "Now you try on the model while I watch."\n4. FEEDBACK: Correct gently, affirm what they did right\n5. RETURN DEMONSTRATION: Client injects themselves under supervision\n6. GIVE TAKE-HOME: Only after supervised successful SI\n\nCommon mistakes to watch for:\n⚠️ Not shaking enough (M step)\n⚠️ Not hearing the click (A step)\n⚠️ Not pinching enough skin (P step)\n⚠️ Injecting at 90° instead of 45° (S step)`,
        highlight: '⚠️ Never give take-home doses without supervised SI in clinic first' },
      { type: 'quiz', question: 'What is the correct angle for DMPA-SC self-injection?',
        options: ['90° straight in like IM', '45° into pinched skin fold', '15° flat to surface', '30° slight angle into muscle'],
        correct: 1, explanation: '45° into a pinched subcutaneous fold. SC = fat layer, not muscle (unlike IM at 90°).' },
      { type: 'quiz', question: 'Using the SI-first approach, when do you offer self-injection?',
        options: ['Only if the client specifically asks', 'After giving the injection yourself first', 'As the DEFAULT option for all eligible clients before they decide', 'Only to educated or urban clients'],
        correct: 2, explanation: 'SI-first = present self-injection as the default for ALL eligible clients. Do not gatekeep by education, location, or assumption.' },
    ]
  },
  {
    id: 'mod_mec_essentials',
    title: 'WHO MEC — Categories in Clinical Practice',
    category: 'Clinical',
    emoji: '⚕️',
    duration: '10 min',
    level: 'Clinical',
    color: '#7c3aed',
    points: 15,
    content: [
      { type: 'lesson', title: 'The 4 MEC Categories',
        text: `WHO MEC categories tell you HOW SAFE a method is for a specific condition:\n\n🟢 Category 1 — No restriction. Use freely.\n🟡 Category 2 — Advantages generally outweigh risks. Generally use.\n🟠 Category 3 — Risks generally outweigh advantages. Use with caution.\n🔴 Category 4 — ABSOLUTE contraindication. Do NOT use.`,
        highlight: '⚠️ Categories 3 and 4 are your safety net' },
      { type: 'lesson', title: 'Critical Category 4 Conditions',
        text: `Memorise these Category 4 combinations:\n\n❌ COC + Migraine WITH aura\n❌ COC + BP ≥180/110\n❌ COC + Current breast cancer\n❌ COC + Postpartum <21 days (non-BF) or <6 weeks (BF)\n❌ ALL hormonal methods + Current breast cancer\n❌ IUD insertion + Active PID or current STI\n❌ IUD + Unexplained vaginal bleeding\n❌ COC + Smoking ≥35 years + ≥15 cigarettes/day`,
        highlight: '🚨 Absolute — no exceptions regardless of client preference' },
      { type: 'lesson', title: 'ARV Drug Interactions',
        text: `HIV clients on ARVs:\n\n⚠️ Rifampicin: SIGNIFICANTLY reduces COC, POP, implant → Use DMPA or Cu-IUD\n⚠️ Ritonavir-boosted PIs: COC Category 3 → Cu-IUD safest\n⚠️ Efavirenz: COC Category 2, Implant Category 2\n✅ NRTIs: No significant interactions\n✅ DMPA: Safe with ALL ARV regimens`,
        highlight: '💡 When in doubt with ARVs — DMPA or Cu-IUD are always safe' },
      { type: 'quiz', question: 'A 38-year-old smokes 20 cigarettes/day and wants COC. MEC category?',
        options: ['Category 1', 'Category 2', 'Category 3', 'Category 4 — do not use'],
        correct: 3, explanation: 'Age ≥35 + heavy smoking = COC Category 4. Offer POP, DMPA, implant, IUD.' },
      { type: 'quiz', question: 'HIV+ client on efavirenz-based ART wants implant. MEC category?',
        options: ['Category 1', 'Category 2 — generally acceptable', 'Category 3', 'Category 4'],
        correct: 1, explanation: 'Efavirenz + implant = Category 2. Acceptable but DMPA or Cu-IUD have no interaction.' },
    ]
  },
  {
    id: 'mod_side_effects',
    title: 'Counselling on Side Effects — Keeping Clients on Method',
    category: 'Counselling',
    emoji: '💬',
    duration: '8 min',
    level: 'Clinical',
    color: '#f59e0b',
    points: 10,
    content: [
      { type: 'lesson', title: 'Why Side Effect Counselling Matters',
        text: `Poor side effect counselling is the NUMBER ONE reason clients discontinue effective contraception.\n\n• 30-50% of DMPA/implant discontinuation is due to BLEEDING CHANGES\n• Most clients who discontinue were NOT adequately counselled beforehand\n• Clients told to expect changes in advance are MORE likely to continue`,
        highlight: '💡 Forewarned = forearmed. Pre-counsel every client.' },
      { type: 'lesson', title: 'The Empathic Side Effect Conversation',
        text: `Use the Empathy Sandwich:\n\n🍞 ACKNOWLEDGE: "I hear that the irregular bleeding is really bothering you — that's completely understandable."\n\n🥗 EXPLAIN: "What's happening is your body is adjusting to the hormone. In the first 3-6 months, irregular bleeding is normal and safe. After 1 year on DMPA, most women (80%) stop having periods — which is actually a benefit, not a problem."\n\n🍞 VALIDATE: "Your feelings about this are valid. Let's talk about what would help you feel more comfortable continuing."`,
        highlight: '🥪 Lead with empathy — THEN the clinical explanation' },
      { type: 'lesson', title: 'PAINS and ACHES — Danger Signs',
        text: `PAINS (IUD danger signs):\n📍 Period late/missed\n📍 Abdominal pain severe\n📍 Infection/discharge\n📍 Not feeling strings\n📍 Spotting/pain during sex\n\nACHES (COC danger signs):\n📍 Abdominal pain\n📍 Chest pain/shortness of breath\n📍 Headaches/vision changes\n📍 Eye problems\n📍 Severe leg pain/swelling`,
        highlight: '🚨 Teach PAINS and ACHES to every IUD and COC client' },
      { type: 'quiz', question: 'A DMPA client at 4 months has had no periods. She is worried. Using the Empathy Sandwich, what comes FIRST?',
        options: ['Explain that amenorrhoea is normal immediately', 'Acknowledge her worry before explaining', 'Give her a pregnancy test first', 'Switch her to COC'],
        correct: 1, explanation: 'Empathy Sandwich: Lead with acknowledging the feeling FIRST. "I hear that you\'re worried — that makes complete sense." THEN the clinical explanation.' },
    ]
  },
  {
    id: 'mod_ppfp',
    title: 'Postpartum & Post-Abortion FP',
    category: 'Clinical',
    emoji: '🤱',
    duration: '9 min',
    level: 'Clinical',
    color: '#ec4899',
    points: 15,
    content: [
      { type: 'lesson', title: 'The PPFP Window of Opportunity',
        text: `A woman can ovulate as early as 21 days after delivery even while breastfeeding.\n\n✅ Within 48 hours: Cu-IUD or LNG-IUS (immediately postpartum IUD)\n⚠️ 48hrs–4 weeks: Avoid IUD (expulsion risk)\n✅ From 6 weeks: All progestogen methods safe\n✅ From 6 months (BF): COC safe\n\nCounsel ALL pregnant women about FP before delivery.`,
        highlight: '⏰ Antenatal FP counselling = better PPFP uptake' },
      { type: 'lesson', title: 'LAM — The 3 Criteria',
        text: `LAM works ONLY when ALL 3 are met:\n\n✅ 1. Baby LESS than 6 months old\n✅ 2. FULLY breastfeeding (day AND night — max 4hr day, 6hr night gap)\n✅ 3. Periods have NOT returned\n\nIf ANY fails → SWITCH METHOD IMMEDIATELY\n\nPlan the transition method at 4-5 months.`,
        highlight: '⚠️ LAM = all 3 criteria, all the time' },
      { type: 'quiz', question: 'Woman delivered 3 weeks ago, exclusively breastfeeding, no periods. Can she start COC?',
        options: ['Yes — LAM is protecting her', 'No — COC is Category 4 for BF <6 weeks postpartum', 'Yes — low-dose only', 'Yes — breastfeeding protects baby from hormones'],
        correct: 1, explanation: 'COC is Category 4 <6 weeks postpartum BF — VTE risk and may suppress milk. Offer POP, DMPA, implant, IUD.' },
    ]
  },
]

// ── SIMULATION SCENARIOS ───────────────────────────────────────────────────────
const SIMULATION_SCENARIOS = [
  {
    id: 'sim_new_si_client',
    title: 'New DMPA-SC Client — SI-First Approach',
    difficulty: 'Beginner',
    emoji: '💉',
    description: 'Practice presenting self-injection as the default option to a new DMPA-SC client.',
    context: 'new client eligible for DMPA-SC, SI-first counselling, MAPS training',
    scoring_criteria: ['Offered SI as default first', 'Used MAPS steps correctly', 'Used empathic language', 'Checked comprehension', 'Gave return date'],
    si_focus: true,
    client_persona: `You are Wanjiru, 26, married, visiting for FP for the first time. You've heard of "the injection." You are nervous about needles but open to learning. You live far from the facility. When the provider mentions self-injection, you initially say "Mimi?! Naweza kujichomea mwenyewe?" but warm up quickly if they explain it empathically. You have no contraindications.`
  },
  {
    id: 'sim_empathy_side_effects',
    title: 'Anxious DMPA Client — Empathic Side Effect Counselling',
    difficulty: 'Intermediate',
    emoji: '💗',
    description: 'Practice the Empathy Sandwich with a worried DMPA client considering stopping.',
    context: 'DMPA revisit, amenorrhoea concern, empathy-first counselling needed',
    scoring_criteria: ['Acknowledged feeling first (empathy)', 'Did NOT jump to explanation first', 'Used Empathy Sandwich', 'Used open questions (OARS)', 'Client feels heard and decides to continue'],
    empathy_focus: true,
    client_persona: `You are Akinyi, 28, on DMPA 3 months. VERY worried — no periods. Mother-in-law says "blood accumulating inside." Considering stopping. You need genuine empathy first — if provider jumps straight to clinical explanation without acknowledging your fear, you will push back: "Unasema tu maneno — si unasikia kile ninachosema?" Open up and relax only when truly heard.`
  },
  {
    id: 'sim_bp_empathy',
    title: 'High BP Client — Empathic Method Change',
    difficulty: 'Intermediate',
    emoji: '💊',
    description: 'BP 165/100, client insists on COC. Practice empathic redirection using OARS.',
    context: 'COC not eligible, empathic counselling, offer alternatives without dismissing',
    scoring_criteria: ['Took BP correctly', 'Affirmed her choice process', 'Reflected her frustration', 'Explained without lecturing', 'Offered alternatives empathically', 'Client leaves with a method'],
    empathy_focus: true,
    client_persona: `You are Mercy, 35. You SPECIFICALLY want COC like your friend. When told BP is high, push back: "Lakini nahisi sawa kabisa!" You need to feel heard and not dismissed before you'll accept alternatives. If provider lectures at you, you dig in. If they acknowledge your frustration first, you gradually open up.`
  },
  {
    id: 'sim_si_training',
    title: 'SI Training Session — Teach-Back Method',
    difficulty: 'Intermediate',
    emoji: '🎓',
    description: 'Train a client on DMPA-SC self-injection using MAPS and teach-back.',
    context: 'SI training, MAPS steps, teach-back method, empathic encouragement',
    scoring_criteria: ['Used MAPS correctly (all 4 steps)', 'Used teach-back', 'Corrected mistakes gently', 'Affirmed client confidence', 'Gave take-home doses correctly', 'Set return date'],
    si_focus: true,
    client_persona: `You are Fatuma, 30, agreed to try SI. Nervous, asking "Nitaumia?" Make mistakes — forget to shake, uncertain about angle. Need encouragement when you get things right. Say "Nashindwa!" if not reassured. When gently corrected and praised, you gain confidence. End satisfied: "Eeeh! Naona inawezekana!"`
  },
  {
    id: 'sim_hiv_client',
    title: 'HIV+ Client on ARVs — Empathic Confidential Counselling',
    difficulty: 'Advanced',
    emoji: '🎗️',
    description: 'HIV+ client on efavirenz wants implant. Navigate ARV interactions with empathy and confidentiality.',
    context: 'HIV positive, efavirenz ART, implant request, confidentiality concerns',
    scoring_criteria: ['Ensured confidentiality first', 'Identified ARV regimen', 'Correctly stated Category 2', 'Offered DMPA/Cu-IUD as alternatives', 'Offered dual protection', 'Non-judgmental and empathic throughout'],
    client_persona: `You are Jane, 30, HIV+ on efavirenz 2 years. You want implant after reading online. You are health-literate. First priority: confidentiality. Ask specifically about drug interactions. Open up gradually if provider demonstrates confidentiality and respect. Test empathy by sharing: "Watu wengine hospitalini wanajua hali yangu na inaniuma sana."`
  },
  {
    id: 'sim_adolescent',
    title: 'Adolescent — Youth-Friendly Empathic Counselling',
    difficulty: 'Intermediate',
    emoji: '🌱',
    description: '17-year-old requests ECP. Practice youth-friendly ARSH counselling with deep empathy.',
    context: 'Adolescent, ECP, fear, empathy-first, ARSH guidelines',
    scoring_criteria: ['Ensured privacy first', 'Non-judgmental language', 'Assessed for coercion empathically', 'Provided ECP', 'Offered ongoing FP', 'Dual protection', 'Linked HTC/STI'],
    empathy_focus: true,
    client_persona: `You are Zawadi, 17, scared and embarrassed. Consensual sex last night, worried about pregnancy. Short answers at first. Need the provider to be GENUINELY KIND — not just technically correct. If provider is warm and empathic, open up and ask about ongoing FP. If provider feels clinical or judgmental, become monosyllabic. Notice and respond to emotional tone.`
  },
]

// ── PEER DISCUSSIONS ───────────────────────────────────────────────────────────
const PEER_DISCUSSIONS = [
  { id: 'pd_si_first', title: '💉 SI-First Success Stories', prompt: 'Share a case where you offered self-injection first and the client was surprised — what happened? What did you say?', responses: 4, tags: ['DMPA-SC', 'SI-First', 'Empowerment'] },
  { id: 'pd_empathy', title: '💗 Empathy that Changed a Client\'s Mind', prompt: 'Share a case where really listening (not explaining first) changed the outcome. What did empathy unlock?', responses: 6, tags: ['Empathy', 'OARS', 'Counselling'] },
  { id: 'pd_side_effects', title: '🩺 Side Effect Counselling Wins', prompt: 'Share a case where pre-counselling on side effects kept a client on method. What exact words did you use?', responses: 3, tags: ['DMPA', 'Implant', 'Side Effects'] },
  { id: 'pd_mec_challenge', title: '⚕️ Difficult MEC Case', prompt: 'A challenging case with multiple conditions. How did you navigate eligibility and keep it client-centred?', responses: 5, tags: ['MEC', 'Clinical', 'HIV'] },
]

// ── MEMORY STORE ───────────────────────────────────────────────────────────────
const MEMORY_KEY = 'afyamentor_sim_history'
const PROGRESS_KEY = 'afyamentor_progress'

const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]') }
  catch { return [] }
}
const saveHistory = (history) => {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(history.slice(0, 20))) }
  catch {}
}

// ── COUNSELLING SIMULATOR ──────────────────────────────────────────────────────
function CounsellingSimulator({ scenario, onComplete, apiKey, language }) {
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

  const langConfig = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Speech Recognition setup
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

  const langInstruction = LANG_INSTRUCTIONS[language] || LANG_INSTRUCTIONS.en

  const getSystemPrompt = () => {
    const siNote = scenario.si_focus ? '\n\nSI-FIRST CONTEXT: This scenario focuses on self-injection counselling. React positively when the provider uses MAPS steps correctly and presents SI as the default.' : ''
    const empathyNote = scenario.empathy_focus ? '\n\nEMPATHY CONTEXT: You need genuine empathy before information. If provider jumps straight to clinical explanation without acknowledging your feelings first, push back or become withdrawn. Only open up when truly heard.' : ''

    return `You are playing a role-play simulation for training Kenya family planning providers.

LANGUAGE INSTRUCTION: ${langInstruction}

YOUR ROLE: You are the CLIENT in a FP counselling session at a Kenyan health facility.

CLIENT PROFILE:
${scenario.client_persona}
${siNote}${empathyNote}

SIMULATION RULES:
1. Stay strictly in character. Do NOT break character.
2. Respond naturally as a real Kenyan client — use emotions, concerns, ${language === 'sw' || language === 'sheng' ? 'Kiswahili/Sheng phrases' : 'local expressions'}.
3. After 8-10 exchanges, if the provider has done well, signal readiness to end.
4. If provider makes clinical error, react appropriately — question, hesitate.
5. Keep responses SHORT — 2-4 sentences like a real client.
6. After 12 exchanges OR natural conclusion, end with: [SESSION_COMPLETE]

Context: ${scenario.context}`
  }

  const getFeedbackPrompt = (history) => `You are an expert Kenya FP training supervisor.

LANGUAGE: Provide feedback in ${langConfig.label}.
SCENARIO: ${scenario.title}
SCORING CRITERIA: ${scenario.scoring_criteria.join(', ')}
${scenario.si_focus ? 'SI-FIRST FOCUS: Specifically evaluate whether provider positioned self-injection as the default.' : ''}
${scenario.empathy_focus ? 'EMPATHY FOCUS: Specifically evaluate use of Empathy Sandwich, OARS framework, and empathy-before-information approach.' : ''}

TRANSCRIPT:
${history.map(m => `${m.role === 'user' ? 'PROVIDER' : 'CLIENT'}: ${m.content}`).join('\n')}

Provide feedback in this EXACT format:

SCORE: [X/10]

STRENGTHS:
- [specific strength]
- [specific strength]

AREAS TO IMPROVE:
- [specific improvement]
- [specific improvement]

CRITERIA MET:
${scenario.scoring_criteria.map(c => `- ${c}: [YES/NO]`).join('\n')}

${scenario.empathy_focus ? 'EMPATHY ASSESSMENT:\n- Did provider use Empathy Sandwich (acknowledge before explain): [YES/NO]\n- Did provider use open questions (OARS): [YES/NO]\n- Did client feel heard before receiving information: [YES/NO]' : ''}
${scenario.si_focus ? 'SI-FIRST ASSESSMENT:\n- Did provider present SI as DEFAULT first: [YES/NO]\n- Were MAPS steps covered: [YES/NO]\n- Was teach-back used: [YES/NO]' : ''}

OVERALL VERDICT: [EXCELLENT / GOOD / NEEDS PRACTICE]

CLINICAL ACCURACY: [errors found, or "No clinical errors detected"]

Keep feedback specific, encouraging, grounded in Kenya MOH BCS+ and SI-first guidelines.`

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
      setMessages(prev => [...prev, { role: 'assistant', content: language === 'sw' ? 'Samahani, hitilafu ya mtandao.' : 'Network error — please check your connection.' }])
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
            generation_config: { temperature: 0.3, max_output_tokens: 1000 }
          }) }
      )
      const data = await res.json()
      const feedbackText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      setFeedback(feedbackText)
      // Save to memory
      const existing = loadHistory()
      const entry = {
        id: Date.now(),
        scenario_id: scenario.id,
        scenario_title: scenario.title,
        language: langConfig.label,
        date: new Date().toLocaleDateString('en-KE'),
        turns: history.length,
        feedback: feedbackText,
        messages: history.slice(-6), // save last 6 for context
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
      ? (language === 'sw' || language === 'sheng'
          ? '*anaingia taratibu* Daktari... sijapata hedhi kwa miezi mitatu tangu nianze sindano. Ninafikiria kusimama...'
          : '*enters nervously* Doctor... I haven\'t had my period for 3 months since starting the injection. I\'m thinking of stopping...')
      : scenario.id === 'sim_si_training'
        ? (language === 'sw' || language === 'sheng'
            ? '*anaangalia sindano kwa wasiwasi* Hizi sindano... nitajichomea mimi mwenyewe? Sielewi jinsi...'
            : '*looking at the device nervously* I have to inject myself? I don\'t know how to do this...')
        : (language === 'sw' || language === 'sheng'
            ? '*anaingia kliniki* Habari. Nimekuja kwa family planning...'
            : '*enters clinic* Good morning. I was told to come here for family planning...')
    setMessages([{ role: 'assistant', content: opener }])
    if (audioEnabled) setTimeout(() => speakText(opener), 500)
  }

  if (phase === 'intro') return (
    <div className="text-center p-6">
      <div className="text-5xl mb-4">{scenario.emoji}</div>
      <h3 className="font-bold text-gray-800 text-lg mb-2">{scenario.title}</h3>
      <p className="text-gray-500 text-sm mb-3">{scenario.description}</p>
      {scenario.si_focus && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-left">
          <p className="text-xs font-bold text-green-700 mb-1">💉 SI-First Focus</p>
          <p className="text-xs text-green-600">Practice presenting self-injection as the DEFAULT option. Lead with empowerment.</p>
        </div>
      )}
      {scenario.empathy_focus && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 mb-3 text-left">
          <p className="text-xs font-bold text-pink-700 mb-1">💗 Empathy Focus</p>
          <p className="text-xs text-pink-600">Practice the Empathy Sandwich: Acknowledge → Explain → Validate. The AI client will respond differently based on your empathy.</p>
        </div>
      )}
      <div className="bg-teal-50 rounded-xl p-3 mb-3 text-left">
        <p className="text-xs font-bold text-teal-700 mb-2">📋 Scored on:</p>
        {scenario.scoring_criteria.map((c, i) => <p key={i} className="text-xs text-teal-600">• {c}</p>)}
      </div>
      {/* Audio toggle */}
      <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
        <button onClick={() => setAudioEnabled(!audioEnabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${audioEnabled ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
          {audioEnabled ? <Volume2 size={14}/> : <VolumeX size={14}/>}
          {audioEnabled ? 'Audio ON' : 'Audio OFF'}
        </button>
        <p className="text-xs text-gray-400">Enable to hear client responses</p>
      </div>
      <button onClick={startSession}
        className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
        <Play size={18}/> Start Simulation ({langConfig.flag} {langConfig.label})
      </button>
    </div>
  )

  if (phase === 'feedback' && feedback) {
    const scoreMatch = feedback.match(/SCORE:\s*(\d+)\/10/)
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 7
    const verdict = feedback.includes('EXCELLENT') ? 'EXCELLENT' : feedback.includes('GOOD') ? 'GOOD' : 'NEEDS PRACTICE'
    const verdictColor = verdict === 'EXCELLENT' ? '#14a044' : verdict === 'GOOD' ? '#f59e0b' : '#dc2626'
    return (
      <div className="p-4">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">{verdict === 'EXCELLENT' ? '🏆' : verdict === 'GOOD' ? '⭐' : '📚'}</div>
          <div className="text-3xl font-bold mb-1" style={{color: verdictColor}}>{score}/10</div>
          <div className="font-bold text-sm px-3 py-1 rounded-full inline-block text-white" style={{background: verdictColor}}>{verdict}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-64 overflow-y-auto">
          <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
            {feedback.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '')}
          </p>
        </div>
        {audioEnabled && (
          <button onClick={() => speakText(feedback.substring(0, 500))}
            className="w-full mb-3 flex items-center justify-center gap-2 border border-teal-300 text-teal-700 py-2 rounded-xl text-sm">
            <Volume2 size={14}/> {isSpeaking ? 'Speaking...' : 'Read Feedback Aloud'}
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setPhase('intro'); setMessages([]); setTurnCount(0); setFeedback(null) }}
            className="flex items-center justify-center gap-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm">
            <RotateCcw size={14}/> Try Again
          </button>
          <button onClick={() => onComplete(score)}
            className="text-white font-bold py-2.5 rounded-xl text-sm"
            style={{background:'#0d7377'}}>✅ Complete</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-600">{scenario.emoji} {scenario.title}</p>
          <p className="text-xs text-gray-400">Turn {turnCount}/12 | {langConfig.flag} {langConfig.label}</p>
        </div>
        <div className="flex gap-1">
          {scenario.si_focus && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">SI-First</span>}
          {scenario.empathy_focus && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">Empathy</span>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
              ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-gray-400 text-white'}`}>
              {msg.role === 'user' ? 'P' : 'C'}
            </div>
            <div className={`max-w-xs rounded-xl px-3 py-2 text-xs leading-relaxed
              ${msg.role === 'user' ? 'text-white rounded-tr-none' : 'bg-gray-100 text-gray-700 rounded-tl-none'}`}
              style={msg.role === 'user' ? {background:'#0d7377'} : {}}>
              {msg.content}
              {msg.role === 'assistant' && audioEnabled && (
                <button onClick={() => speakText(msg.content)} className="ml-2 opacity-50 hover:opacity-100">
                  <Volume2 size={10}/>
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white">C</div>
            <div className="bg-gray-100 rounded-xl px-3 py-2 flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400" style={{animation:`bounce 1s infinite ${i*0.2}s`}}/>)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>
      <div className="px-3 py-3 border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2">
          {recognitionRef.current && (
            <button onClick={toggleRecording}
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {isRecording ? <MicOff size={14}/> : <Mic size={14}/>}
            </button>
          )}
          <input
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            placeholder={isRecording ? '🎤 Listening...' : `Type or speak (${langConfig.flag} ${langConfig.label})...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${input.trim() && !loading ? '' : 'bg-gray-200'}`}
            style={input.trim() && !loading ? {background:'#0d7377'} : {}}>
            <Send size={14}/>
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1">P = Provider (You) | C = Client (AI)</p>
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
      const finalScore = quizItems.length > 0 ? Math.round((answeredCorrectly / quizItems.length) * 10) : 8
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
        <p className="text-sm text-teal-500">Module points earned</p>
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
      <p className="text-xs mt-1">Complete a simulation to see your history here.</p>
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
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-3">
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
                  <p className="text-xs text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {entry.feedback?.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '') || 'No feedback saved.'}
                  </p>
                  <button onClick={() => onContinue(entry)}
                    className="mt-2 w-full text-white font-bold py-2 rounded-lg text-xs"
                    style={{background:'#0d7377'}}>
                    Practice This Scenario Again
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button onClick={onClose} className="mt-4 w-full border border-gray-300 text-gray-600 py-2 rounded-xl text-sm">
        Back to Simulations
      </button>
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function AfyaMentor() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || facility.gemini_api_key || ''

  const [activeTab, setActiveTab] = useState('learn')
  const [selectedModule, setSelectedModule] = useState(null)
  const [selectedSim, setSelectedSim] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [language, setLanguage] = useState(() => localStorage.getItem('afyamentor_lang') || 'en')
  const [showLangPicker, setShowLangPicker] = useState(false)
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
    setShowLangPicker(false)
  }

  const totalPoints = Object.values(progress).reduce((sum, p) => sum + (p.points || 0), 0)
  const completedModules = MODULES.filter(m => progress[m.id]?.completed).length
  const completedSims = SIMULATION_SCENARIOS.filter(s => progress[s.id]?.completed).length
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft size={15}/> Back
        </button>
        {/* Language Picker */}
        <div className="relative">
          <button onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-teal-400 transition-colors">
            <Globe size={14}/>
            {langConfig.flag} {langConfig.label}
            <ChevronDown size={12}/>
          </button>
          {showLangPicker && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-40">
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-teal-50 first:rounded-t-xl last:rounded-b-xl transition-colors
                    ${language === l.code ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700'}`}>
                  <span>{l.flag}</span> {l.label}
                  {language === l.code && <span className="ml-auto text-teal-500">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="rounded-2xl p-5 mb-5" style={{background:'linear-gradient(135deg,#0d7377 0%,#14a044 100%)'}}>
        <div className="flex items-center justify-between">
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
            <p className="text-xs mt-0.5" style={{color:'rgba(204,251,241,0.9)'}}>{level.title}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { value: totalPoints, label: 'Points' },
            { value: `${completedModules}/${MODULES.length}`, label: 'Modules' },
            { value: `${completedSims}/${SIMULATION_SCENARIOS.length}`, label: 'Sims' },
            { value: historyCount, label: 'Sessions' },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg p-2 text-center" style={{background:'rgba(255,255,255,0.15)'}}>
              <p className="text-lg font-bold" style={{color:'white'}}>{stat.value}</p>
              <p className="text-xs" style={{color:'rgba(204,251,241,0.9)'}}>{stat.label}</p>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{color:'rgba(204,251,241,0.7)'}}>
            <span>Progress to Expert</span><span>{totalPoints}/100</span>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full h-2">
            <div className="h-2 rounded-full bg-white transition-all" style={{width:`${Math.min(totalPoints, 100)}%`}}/>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { key: 'learn', label: '📖 Learn', desc: 'Modules' },
          { key: 'simulate', label: '🎭 Simulate', desc: 'Practice' },
          { key: 'peers', label: '👥 Peers', desc: 'Discuss' },
          { key: 'history', label: '📂 History', desc: `${historyCount} sessions` },
        ].map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="p-2.5 rounded-xl border-2 transition-colors"
              style={isActive ? {background:'#0d7377', borderColor:'#0d7377'} : {background:'white', borderColor:'#e5e7eb'}}>
              <p style={{color: isActive ? 'white' : '#374151'}} className="font-bold text-xs">{tab.label}</p>
              <p style={{color: isActive ? '#99f6e4' : '#9ca3af'}} className="text-xs">{tab.desc}</p>
            </button>
          )
        })}
      </div>

      {/* ── LEARN TAB ── */}
      {activeTab === 'learn' && !selectedModule && (
        <div className="space-y-3">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
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
                      {module.id === 'mod_empathy_counselling' && <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">New</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{module.duration}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{background: module.color + '20', color: module.color}}>{module.category}</span>
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
          {!geminiApiKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-700 font-bold mb-1">⚠️ Gemini API Key Required</p>
              <p className="text-xs text-amber-600">Add your Gemini API key in Settings → Facility Settings.</p>
              <button onClick={() => navigate('/settings')} className="mt-2 text-xs text-amber-700 underline">Go to Settings →</button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-green-700">💉 SI-First Focus</p>
              <p className="text-xs text-green-600 mt-0.5">2 scenarios</p>
            </div>
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-pink-700">💗 Empathy Focus</p>
              <p className="text-xs text-pink-600 mt-0.5">3 scenarios</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-700">Choose a Scenario</p>
            <button onClick={() => setActiveTab('history')}
              className="flex items-center gap-1 text-xs text-teal-600 hover:underline">
              <History size={12}/> View Past Sessions ({historyCount})
            </button>
          </div>
          {SIMULATION_SCENARIOS.map(sim => {
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
                      <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                        style={{background: diffColors[sim.difficulty]}}>{sim.difficulty}</span>
                      {sim.si_focus && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">💉 SI-First</span>}
                      {sim.empathy_focus && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">💗 Empathy</span>}
                    </div>
                  </div>
                  {done && <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-600">{progress[sim.id]?.score}/10</p>
                    <p className="text-xs text-gray-400">Best</p>
                  </div>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {activeTab === 'simulate' && selectedSim && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          style={{height: '580px', display: 'flex', flexDirection: 'column'}}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setSelectedSim(null)} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={16}/>
            </button>
            <span className="text-sm font-bold text-gray-600">Counselling Simulation</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CounsellingSimulator
              scenario={selectedSim}
              apiKey={geminiApiKey}
              language={language}
              onComplete={(score) => {
                saveProgress(selectedSim.id, { completed: true, score, points: score })
                setSelectedSim(null)
              }}
            />
          </div>
        </div>
      )}

      {/* ── PEERS TAB ── */}
      {activeTab === 'peers' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-sm text-blue-700 font-medium">👥 Peer learning: Share real cases. Inspired by PATH Uganda's community learning model.</p>
          </div>
          {PEER_DISCUSSIONS.map(disc => (
            <div key={disc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-700 text-sm mb-2">{disc.title}</h3>
              <p className="text-sm text-gray-600 mb-3 italic">"{disc.prompt}"</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {disc.tags.map(tag => (
                  <span key={tag} className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-100">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">💬 {disc.responses} responses</span>
                <button onClick={() => {
                  const msg = encodeURIComponent(`🌿 *AfyaMEC Peer Learning*\n\n*${disc.title}*\n\n${disc.prompt}\n\nShare your experience 👇`)
                  window.open(`https://wa.me/?text=${msg}`, '_blank')
                }} className="flex items-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Share on WhatsApp
                </button>
              </div>
            </div>
          ))}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500"/> Learning Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-teal-50 rounded-lg p-3"><p className="text-lg font-bold text-teal-600">{totalPoints}</p><p className="text-xs text-gray-500">Points earned</p></div>
              <div className="bg-purple-50 rounded-lg p-3"><p className="text-lg font-bold text-purple-600">{completedModules + completedSims}</p><p className="text-xs text-gray-500">Activities done</p></div>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <HistoryViewer
          onClose={() => setActiveTab('simulate')}
          onContinue={(entry) => {
            const sim = SIMULATION_SCENARIOS.find(s => s.id === entry.scenario_id)
            if (sim) { setSelectedSim(sim); setActiveTab('simulate') }
          }}
        />
      )}
    </div>
  )
}
