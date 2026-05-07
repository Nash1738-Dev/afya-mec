import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Play, CheckCircle, Star, RefreshCw,
         MessageCircle, Trophy, ChevronRight, ChevronDown, Send,
         RotateCcw, TrendingUp } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'

const GEMINI_MODEL = 'gemini-2.5-flash'

// ── MICROLEARNING MODULES ─────────────────────────────────────────────────────
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
      {
        type: 'lesson',
        title: 'What is BCS+?',
        text: `The Balanced Counselling Strategy Plus (BCS+) is Kenya's evidence-based approach to FP counselling. It was developed and tested in Kenya and South Africa by the Population Council.\n\nBCS+ ensures every client receives complete, high-quality FP counselling regardless of which provider they see. It is the official Kenya MOH standard for FP service delivery (2023).`,
        highlight: '✅ BCS+ is NOT optional — it is the Kenya MOH standard'
      },
      {
        type: 'lesson',
        title: 'Stage 1: Pre-Choice',
        text: `In the Pre-Choice stage, you:\n1. Establish a warm, respectful relationship with the client\n2. Determine why they have come today\n3. Rule out pregnancy using the WHO 6-question checklist or PDT\n4. Display ALL method cards — never pre-select\n5. Ask screening questions and set aside inappropriate methods\n\nKey principle: You are identifying options, not making choices for the client.`,
        highlight: '🎯 You are a guide, not a decision-maker'
      },
      {
        type: 'lesson',
        title: 'Stage 2: Method Choice',
        text: `In Method Choice:\n6. Present remaining methods starting with most effective\n7. Ask the client to choose — the decision belongs to them\n8. Confirm the chosen method has no MEC contraindications\n\nFor each method, briefly explain: how it works, how to use it, benefits, and side effects.`,
        highlight: '⚠️ Never push a method — informed choice is a human right'
      },
      {
        type: 'lesson',
        title: 'Stages 3 & 4',
        text: `Stage 3 — Post-Choice:\n9. Counsel on the chosen method in detail\n10. Check client comprehension (ask them to repeat back)\n11. Provide the method or referral\n\nStage 4 — STI/HIV:\n12. Discuss STI/HIV transmission and prevention\n13. Conduct HIV risk assessment\n14. Offer HTC (HIV Testing and Counselling)\n15. Give follow-up instructions and return date`,
        highlight: '💡 Always offer condoms for dual protection regardless of method chosen'
      },
      {
        type: 'quiz',
        question: 'According to BCS+, when should you display the contraceptive method cards?',
        options: [
          'After asking about the client\'s preferred method',
          'Before asking any screening questions — show ALL methods first',
          'Only after ruling out pregnancy',
          'Only the methods you think are appropriate'
        ],
        correct: 1,
        explanation: 'BCS+ Step 4: Display ALL method cards before screening. Never pre-select — every client deserves to see all options.'
      },
      {
        type: 'quiz',
        question: 'A client chooses COC. You check and she has BP of 165/105. What do you do?',
        options: [
          'Give COC since she has chosen it — respect her choice',
          'Give COC but reduce the dose',
          'Explain COC is Category 3/4 for her BP, offer alternatives (Cu-IUD, POP, DMPA)',
          'Refer her elsewhere without counselling'
        ],
        correct: 2,
        explanation: 'BP ≥160/100: COC is Category 3-4 (MEC). Respect her autonomy by explaining why and offering safe alternatives. Never give Category 4 methods.'
      }
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
      {
        type: 'lesson',
        title: 'The 4 MEC Categories',
        text: `WHO MEC categories tell you HOW SAFE a method is for a specific condition:\n\n🟢 Category 1 — No restriction. Use freely.\n🟡 Category 2 — Advantages generally outweigh risks. Generally use.\n🟠 Category 3 — Risks generally outweigh advantages. Use with caution, expert clinical judgment needed.\n🔴 Category 4 — ABSOLUTE contraindication. Do NOT use.`,
        highlight: '⚠️ Categories 3 and 4 are your safety net'
      },
      {
        type: 'lesson',
        title: 'Critical Category 4 Conditions',
        text: `Memorise these Category 4 combinations — they prevent serious harm:\n\n❌ COC + Migraine WITH aura (any age)\n❌ COC + BP ≥180/110 (hypertensive crisis)\n❌ COC + Current breast cancer\n❌ COC + Postpartum <21 days (non-BF) or <6 weeks (BF)\n❌ ALL hormonal methods + Current breast cancer\n❌ IUD insertion + Active PID or current STI\n❌ IUD insertion + Unexplained vaginal bleeding (before evaluation)\n❌ COC + Smoking ≥35 years + ≥15 cigarettes/day`,
        highlight: '🚨 These are absolute — no exceptions regardless of client preference'
      },
      {
        type: 'lesson',
        title: 'ARV Drug Interactions',
        text: `HIV clients on ARVs need special attention:\n\n⚠️ Rifampicin (TB treatment): SIGNIFICANTLY reduces COC, POP, and implant efficacy → Use DMPA or Cu-IUD\n⚠️ Ritonavir-boosted PIs: COC Category 3 → Cu-IUD is safest\n⚠️ Efavirenz (NNRTIs): COC Category 2, Implant Category 2\n✅ NRTIs: No significant interactions with any hormonal method\n✅ DMPA: Safe with ALL ARV regimens`,
        highlight: '💡 When in doubt with ARVs — DMPA or Cu-IUD are always safe choices'
      },
      {
        type: 'quiz',
        question: 'A 38-year-old woman smokes 20 cigarettes/day and wants COC. What is her MEC category?',
        options: [
          'Category 1 — no restriction',
          'Category 2 — generally use',
          'Category 3 — caution needed',
          'Category 4 — do not use'
        ],
        correct: 3,
        explanation: 'Age ≥35 + heavy smoking (≥15 cigs/day) = COC Category 4. Offer POP, DMPA, implant, or IUD instead.'
      },
      {
        type: 'quiz',
        question: 'An HIV+ client on efavirenz-based ART wants an implant. What is the MEC category?',
        options: [
          'Category 1 — safe to use',
          'Category 2 — generally acceptable',
          'Category 3 — use with caution, reduced efficacy',
          'Category 4 — contraindicated'
        ],
        correct: 2,
        explanation: 'Efavirenz + implant = Category 2. Efavirenz may reduce implant efficacy slightly. Acceptable choice, but DMPA or Cu-IUD have no interaction.'
      }
    ]
  },
  {
    id: 'mod_dmpa_sc_si',
    title: 'DMPA-SC Self-Injection: Training Clients',
    category: 'DMPA-SC',
    emoji: '💉',
    duration: '7 min',
    level: 'Practical',
    color: '#14a044',
    points: 10,
    content: [
      {
        type: 'lesson',
        title: 'Why Self-Injection Matters',
        text: `DMPA-SC self-injection (SI) removes the barrier of clinic visits every 13 weeks. Evidence from Kenya, Uganda, and Malawi shows:\n\n✅ Women can self-inject safely and effectively after training\n✅ SI significantly improves contraceptive continuation rates\n✅ Women strongly prefer SI for privacy and convenience\n✅ RCT in Malawi: SI clients had 50% higher continuation than provider-administered\n\nYour role: Train clients well, build their confidence, give take-home doses.`,
        highlight: '🌿 Self-injection = women\'s autonomy in action'
      },
      {
        type: 'lesson',
        title: 'MAPS — The 4 Self-Injection Steps',
        text: `MAPS is the memory aid for client self-injection training:\n\n🔵 M — MIX: Shake the Sayana Press device vigorously for 30 seconds until solution is cloudy\n\n🔵 A — ACTIVATE: Push the needle cap and reservoir port together firmly until you hear/feel a click\n\n🔵 P — PINCH: Pinch a fold of skin on the lower abdomen (2 inches from navel) or upper thigh to form a 'tent'\n\n🔵 S — SELF-INJECT: Insert needle at 45° angle. Squeeze reservoir slowly and steadily until completely empty (~5 seconds)`,
        highlight: '📌 M-A-P-S: Mix, Activate, Pinch, Self-inject'
      },
      {
        type: 'lesson',
        title: 'After Injection + Take-Home Doses',
        text: `After injecting:\n• Remove needle while still pinching skin\n• Apply gentle pressure — do NOT rub\n• Dispose immediately in sharps container — never recap\n• Record injection date and calculate next date (13 weeks)\n\nTake-home doses:\n• Give after client successfully self-injects in clinic\n• Maximum 3 take-home doses (covers ~1 year)\n• Each dose = 13 more weeks before clinic visit\n• Provide sharps disposal container\n• Show client how to record dates`,
        highlight: '⚠️ Never give take-home doses without supervised SI in clinic first'
      },
      {
        type: 'quiz',
        question: 'What is the correct needle angle for DMPA-SC self-injection?',
        options: [
          '90° — straight in like IM injection',
          '45° — into a pinched skin fold',
          '15° — almost flat to skin surface',
          '30° — slight angle into muscle'
        ],
        correct: 1,
        explanation: '45° into a pinched subcutaneous skin fold. This is different from IM injections (90°). The SC route = fat layer, not muscle.'
      },
      {
        type: 'quiz',
        question: 'After how many take-home doses should a client return to clinic for a check-in?',
        options: [
          'Never — they can continue indefinitely',
          'After 1 dose (every 13 weeks always)',
          'After 2-3 doses (every 6-9 months)',
          'Only if they have side effects'
        ],
        correct: 2,
        explanation: 'Kenya guidelines: Check-in after 2-3 take-home doses (~6-9 months). Assess technique, side effects, and continuation. Do not lose contact with SI clients.'
      }
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
      {
        type: 'lesson',
        title: 'Why Side Effect Counselling Matters',
        text: `Poor side effect counselling is the NUMBER ONE reason clients discontinue effective contraception. Studies show:\n\n• 30-50% of DMPA/implant discontinuation is due to BLEEDING CHANGES\n• Most clients who discontinue were NOT adequately counselled beforehand\n• Clients who are told to expect bleeding changes in advance are MORE likely to continue\n\nYour message: "These changes are NORMAL and SAFE — your body is adjusting"`,
        highlight: '💡 Forewarned = forearmed. Pre-counsel every client.'
      },
      {
        type: 'lesson',
        title: 'The DMPA Bleeding Pattern Conversation',
        text: `What to tell DMPA/implant clients BEFORE starting:\n\n"In the first 3-6 months, you may notice:\n• Irregular bleeding or spotting between periods — this is NORMAL\n• Lighter periods or no periods at all — this is NORMAL and SAFE\n• Your cycle may be unpredictable at first\n\nAfter 1 year on DMPA, most women (up to 80%) stop having periods altogether. This is HEALTHY — your blood is not accumulating, it is simply not being produced."\n\nKey message: Amenorrhoea on DMPA is a BENEFIT, not a problem.`,
        highlight: '🎯 No periods on DMPA = your blood is NOT "stuck inside" — reassure confidently'
      },
      {
        type: 'lesson',
        title: 'PAINS and ACHES — When Side Effects Are Danger Signs',
        text: `Distinguish normal side effects from danger signs:\n\nPAINS (IUD danger signs):\n📍 Period late/missed — possible pregnancy\n📍 Abdominal pain severe\n📍 Infection/discharge\n📍 Not feeling strings\n📍 Spotting/pain during sex\n\nACHES (COC danger signs):\n📍 Abdominal pain severe\n📍 Chest pain/shortness of breath\n📍 Headaches severe/vision changes\n📍 Eye problems\n📍 Severe leg pain/swelling`,
        highlight: '🚨 Teach PAINS and ACHES to every IUD and COC client at every visit'
      },
      {
        type: 'quiz',
        question: 'A DMPA client returns at 4 months saying she has had no periods since starting. She is worried. What do you tell her?',
        options: [
          'Stop DMPA immediately and investigate',
          'This is a dangerous side effect — give a pregnancy test immediately',
          'This is very common and completely safe — amenorrhoea is expected with DMPA',
          'Switch her to COC to restore her periods'
        ],
        correct: 2,
        explanation: 'Amenorrhoea is a well-known, safe, and actually beneficial effect of DMPA. Reassure confidently. No periods = lighter periods = less anaemia. Client satisfaction improves when providers explain this proactively.'
      }
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
      {
        type: 'lesson',
        title: 'The PPFP Window of Opportunity',
        text: `Postpartum FP (PPFP) is critical — a woman can ovulate as early as 21 days after delivery even while breastfeeding. This is the key window:\n\n✅ Within 48 hours: Excellent time for Cu-IUD or LNG-IUS (immediately postpartum IUD)\n⚠️ 48hrs – 4 weeks: Avoid IUD (increased expulsion risk)\n✅ From 6 weeks: All progestogen methods safe\n✅ From 6 months (BF): COC safe\n\nCounsel ALL pregnant women about FP before delivery. The postnatal visit is often too late.`,
        highlight: '⏰ Antenatal FP counselling = better PPFP uptake'
      },
      {
        type: 'lesson',
        title: 'LAM — The 3 Essential Criteria',
        text: `LAM works ONLY when ALL 3 criteria are met simultaneously:\n\n✅ 1. Baby is LESS than 6 months old\n✅ 2. Mother is FULLY or NEARLY FULLY breastfeeding (day AND night — max 4hr day gap, 6hr night gap)\n✅ 3. Menstrual periods have NOT returned\n\nIf ANY criterion is no longer met → SWITCH TO ANOTHER METHOD IMMEDIATELY\n\nCounselling essential: Plan the transition method at 4-5 months. Do not wait until LAM fails.`,
        highlight: '⚠️ LAM = all 3 criteria, all the time. Missing one = not protected'
      },
      {
        type: 'quiz',
        question: 'A woman delivered 3 weeks ago and is exclusively breastfeeding. She has not had her period yet. Can she start COC?',
        options: [
          'Yes — she chose it and LAM is already protecting her',
          'No — COC is Category 4 for breastfeeding women less than 6 weeks postpartum',
          'Yes — but only low-dose COC',
          'Yes — breastfeeding protects the baby from hormones'
        ],
        correct: 1,
        explanation: 'COC is Category 4 for breastfeeding women <6 weeks postpartum — high VTE risk and may suppress milk. Offer POP, DMPA, implant, or IUD instead.'
      }
    ]
  },
  {
    id: 'mod_adolescents',
    title: 'Youth-Friendly FP — ARSH Kenya Guidelines',
    category: 'Special Groups',
    emoji: '👤',
    duration: '7 min',
    level: 'Foundation',
    color: '#2563eb',
    points: 10,
    content: [
      {
        type: 'lesson',
        title: 'Kenya ARSH Principles',
        text: `Kenya's Adolescent Reproductive Sexual Health (ARSH) guidelines require youth-friendly FP services:\n\n✅ Privacy and confidentiality — ALWAYS guaranteed regardless of age\n✅ Non-judgmental language and attitude\n✅ No requirement for parental consent (Kenya law: age 18 = adult)\n✅ Assess for sexual coercion or violence before proceeding\n✅ Dual protection always — offer condoms WITH any method chosen\n✅ Link to SRH, HPV vaccine, and HIV testing services`,
        highlight: '⚖️ Kenya law: Adolescents have the right to confidential FP services'
      },
      {
        type: 'lesson',
        title: 'Best Methods for Adolescents',
        text: `WHO MEC and Kenya guidelines for adolescent-specific considerations:\n\n✅ Implant — Category 1. Excellent for adolescents. Long-acting, reversible, private.\n✅ Cu-IUD/LNG-IUS — Category 2. Nulliparity is NOT a contraindication.\n⚠️ DMPA-IM/SC — Category 2. Concern about bone density in adolescents still growing. Not first choice for girls under 16.\n✅ COC/POP — Category 1 (with no contraindications).\n✅ Condoms — Always. Only method protecting against STIs.`,
        highlight: '💡 Implant is the preferred LARC for adolescents in Kenya'
      },
      {
        type: 'quiz',
        question: 'A 16-year-old girl requests DMPA. She has no other medical conditions. What is the MEC category?',
        options: [
          'Category 1 — no concerns',
          'Category 2 — generally usable, note bone density concern',
          'Category 3 — risks outweigh benefits for adolescents',
          'Category 4 — contraindicated under 18'
        ],
        correct: 1,
        explanation: 'DMPA is Category 2 for adolescents. The concern is bone density in growing teenagers. It\'s acceptable, but implant or IUD are preferred for long-term use in under-18s. Always use clinical judgment.'
      }
    ]
  }
]

// ── COUNSELLING SIMULATION SCENARIOS ─────────────────────────────────────────
const SIMULATION_SCENARIOS = [
  {
    id: 'sim_new_client_choice',
    title: 'New Client — Method Choice',
    difficulty: 'Beginner',
    emoji: '👩',
    description: 'A 24-year-old woman visiting for the first time. Practice BCS+ stages 1-3.',
    context: 'new client, wants to start FP, married, no children yet',
    scoring_criteria: [
      'Established rapport warmly',
      'Ruled out pregnancy',
      'Showed all method options',
      'Checked MEC eligibility',
      'Counselled on chosen method',
      'Checked comprehension',
      'Gave return date'
    ],
    client_persona: `You are Wanjiru, a 24-year-old married woman visiting a health facility for the first time to start family planning. You have been married for 1 year and don't want children yet. You have heard about "the injection" from friends. You are a bit nervous and not sure what questions to ask. You have no known medical conditions. Your last period was 2 weeks ago. Respond naturally as a real client would — sometimes ask questions, sometimes seem uncertain, sometimes share concerns.`
  },
  {
    id: 'sim_side_effects',
    title: 'Anxious Client — Side Effects',
    difficulty: 'Intermediate',
    emoji: '😟',
    description: 'A DMPA client returns worried about no periods for 3 months. Practice side effect counselling.',
    context: 'DMPA revisit, amenorrhoea concern, considering stopping',
    scoring_criteria: [
      'Listened without interrupting',
      'Validated her concern',
      'Explained amenorrhoea is normal and safe',
      'Used clear non-medical language',
      'Checked if she has any danger signs',
      'Client feels reassured',
      'Client decides to continue'
    ],
    client_persona: `You are Akinyi, 28 years old, on DMPA for 3 months. You are VERY worried because you haven't had your period at all since starting. Your mother-in-law told you that "blood is accumulating inside" and you could get cancer. You are seriously considering stopping DMPA. You need to be genuinely reassured with good explanations — not dismissed. Ask specific questions like "But where does the blood go?" and "Is this normal?"`
  },
  {
    id: 'sim_bp_issue',
    title: 'High BP Client — COC Request',
    difficulty: 'Intermediate',
    emoji: '💊',
    description: 'Client wants COC but has BP 165/100. Practice MEC-guided counselling and offering alternatives.',
    context: 'Client has chosen COC but is not eligible due to hypertension',
    scoring_criteria: [
      'Took BP and recognised high reading',
      'Explained why COC is not recommended',
      'Did NOT give COC',
      'Offered suitable alternatives',
      'Was empathetic and non-dismissive',
      'Referred for BP management',
      'Client leaves with a method'
    ],
    client_persona: `You are Mercy, 35 years old. You specifically want the COC pill because your friend uses it and loves it. You are quite insistent. When told your BP is high you may initially push back — "But I feel fine!" You want to understand WHY you can't have the pill. You are open to alternatives but need them explained clearly. Be slightly difficult at first but come around when given good explanations.`
  },
  {
    id: 'sim_hiv_client',
    title: 'HIV+ Client on ARVs',
    difficulty: 'Advanced',
    emoji: '🎗️',
    description: 'HIV+ client on efavirenz-based ART requesting an implant. Navigate ARV interactions.',
    context: 'HIV positive, on efavirenz, wants implant',
    scoring_criteria: [
      'Maintained confidentiality',
      'Identified efavirenz ARV regimen',
      'Correctly stated implant is Category 2 with efavirenz',
      'Offered DMPA or Cu-IUD as alternatives with better efficacy',
      'Offered dual protection with condoms',
      'Non-judgmental throughout',
      'Addressed STI prevention'
    ],
    client_persona: `You are Jane, 30 years old, HIV positive and stable on efavirenz-based ART for 2 years. You want a long-acting method and have chosen the implant after reading about it online. You are health-literate and may ask specific questions about drug interactions. You are worried about people at the facility knowing your HIV status. Be confident but also somewhat anxious about confidentiality.`
  },
  {
    id: 'sim_adolescent',
    title: 'Adolescent Client — ARSH Counselling',
    difficulty: 'Intermediate',
    emoji: '🌱',
    description: 'A 17-year-old requests emergency contraception. Practice youth-friendly ARSH counselling.',
    context: 'Adolescent, unprotected sex, requesting ECP, follow-up FP needed',
    scoring_criteria: [
      'Ensured privacy immediately',
      'Used non-judgmental language',
      'Assessed for coercion',
      'Provided ECP correctly',
      'Offered ongoing FP method',
      'Offered dual protection/condoms',
      'Linked to HTC and STI screening'
    ],
    client_persona: `You are Zawadi, 17 years old, scared and embarrassed. You had unprotected sex last night with your boyfriend (consensual). You are worried about pregnancy. You came to the facility hoping no one would know you. You are very nervous and may give short answers at first. You need the provider to be KIND and not make you feel judged. If the provider is warm, you open up more. You have never used FP before.`
  }
]

// ── PEER LEARNING DISCUSSIONS ─────────────────────────────────────────────────
const PEER_DISCUSSIONS = [
  {
    id: 'pd_side_effects',
    title: '🩺 Managing Bleeding Side Effects',
    prompt: 'Share a case where a client wanted to stop a method due to bleeding changes. What did you say? What worked?',
    responses: 3,
    tags: ['DMPA', 'Implant', 'Side Effects']
  },
  {
    id: 'pd_mec_challenge',
    title: '⚕️ Difficult MEC Eligibility Case',
    prompt: 'Describe a challenging case where a client had multiple conditions affecting eligibility. How did you navigate it?',
    responses: 5,
    tags: ['MEC', 'Clinical', 'HIV']
  },
  {
    id: 'pd_adolescent_fp',
    title: '👤 Youth-Friendly Service Delivery',
    prompt: 'What strategies do you use to make adolescent clients feel comfortable? What barriers have you faced?',
    responses: 2,
    tags: ['ARSH', 'Adolescents', 'Counselling']
  },
  {
    id: 'pd_si_training',
    title: '💉 Teaching Clients to Self-Inject',
    prompt: 'How do you train clients on DMPA-SC self-injection? What are the most common mistakes you see?',
    responses: 4,
    tags: ['DMPA-SC', 'Self-injection', 'MAPS']
  }
]

// ── COUNSELLING SIMULATOR COMPONENT ───────────────────────────────────────────
function CounsellingSimulator({ scenario, onComplete, apiKey }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('intro') // intro | active | feedback
  const [feedback, setFeedback] = useState(null)
  const [turnCount, setTurnCount] = useState(0)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getSystemPrompt = () => `You are playing a role-play simulation for training Kenya family planning providers.

YOUR ROLE: You are the CLIENT in a family planning counselling session at a Kenyan health facility.

CLIENT PROFILE:
${scenario.client_persona}

SIMULATION RULES:
1. Stay strictly in character as the client. Do NOT break character.
2. Respond naturally as a real Kenyan client would — use casual language, show emotions, express concerns.
3. After 8-10 exchanges, IF the provider has done well (followed BCS+ steps, addressed your concerns), you can signal readiness to end: say something like "Thank you, I understand now" or "I'll take that method."
4. If the provider makes a clinical error (e.g., tries to give you a Category 4 method), react appropriately — ask questions, hesitate.
5. Do NOT give the provider answers or hints. Make them work for it.
6. Keep responses SHORT — 2-4 sentences like a real client.
7. Occasionally ask a follow-up question to test the provider's knowledge.
8. After 12 exchanges OR when the session naturally concludes, end with: [SESSION_COMPLETE]

Context: ${scenario.context}`

  const getFeedbackPrompt = (history) => `You are an expert family planning training supervisor evaluating a counselling practice session.

SCENARIO: ${scenario.title}
SCORING CRITERIA: ${scenario.scoring_criteria.join(', ')}

CONVERSATION TRANSCRIPT:
${history.map(m => `${m.role === 'user' ? 'PROVIDER' : 'CLIENT'}: ${m.content}`).join('\n')}

Provide structured feedback in this EXACT format:

SCORE: [X/10]

STRENGTHS:
- [what they did well]
- [what they did well]

AREAS TO IMPROVE:
- [specific thing to improve]
- [specific thing to improve]

CRITERIA MET:
${scenario.scoring_criteria.map(c => `- ${c}: [YES/NO]`).join('\n')}

OVERALL VERDICT: [EXCELLENT / GOOD / NEEDS PRACTICE]

CLINICAL ACCURACY NOTE: [any clinical errors made, or "No clinical errors detected"]

Keep feedback specific, actionable, and encouraging. Reference the Kenya MOH BCS+ guidelines where relevant.`

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
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: getSystemPrompt() }] },
            contents: history,
            generation_config: { temperature: 0.8, max_output_tokens: 300 }
          })
        }
      )
      const data = await res.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      const sessionComplete = reply.includes('[SESSION_COMPLETE]') || turnCount >= 12
      const cleanReply = reply.replace('[SESSION_COMPLETE]', '').trim()

      setMessages(prev => [...prev, { role: 'assistant', content: cleanReply }])

      if (sessionComplete) {
        setTimeout(() => generateFeedback([...newMessages, { role: 'assistant', content: cleanReply }]), 1000)
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Samahani... (Network error — check your internet connection)'
      }])
    }
    setLoading(false)
  }

  const generateFeedback = async (history) => {
    setPhase('feedback')
    setLoading(true)
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: getFeedbackPrompt(history) }] }],
            generation_config: { temperature: 0.3, max_output_tokens: 800 }
          })
        }
      )
      const data = await res.json()
      const feedbackText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      setFeedback(feedbackText)
    } catch (e) {
      setFeedback('Could not generate feedback — check internet connection.')
    }
    setLoading(false)
  }

  const startSession = () => {
    setPhase('active')
    setMessages([{
      role: 'assistant',
      content: scenario.id === 'sim_side_effects'
        ? '*walks in nervously* Daktari... nimekuja kwa tatizo. Sijapata hedhi kwa miezi mitatu tangu nianze sindano... Ninafikiria kusimama.*'
        : '*enters clinic* Good morning. I was told I should come here for family planning...',
      isOpener: true
    }])
  }

  if (phase === 'intro') {
    return (
      <div className="text-center p-6">
        <div className="text-5xl mb-4">{scenario.emoji}</div>
        <h3 className="font-bold text-gray-800 text-lg mb-2">{scenario.title}</h3>
        <p className="text-gray-500 text-sm mb-4">{scenario.description}</p>
        <div className="bg-teal-50 rounded-xl p-4 mb-4 text-left">
          <p className="text-xs font-bold text-teal-700 mb-2">📋 You will be scored on:</p>
          {scenario.scoring_criteria.map((c, i) => (
            <p key={i} className="text-xs text-teal-600">• {c}</p>
          ))}
        </div>
        <div className="bg-amber-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-amber-700 font-medium">
            💡 You are the PROVIDER. The AI plays the client. Conduct a real BCS+ counselling session.
          </p>
        </div>
        <button onClick={startSession}
          className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
          <Play size={18}/> Start Simulation
        </button>
      </div>
    )
  }

  if (phase === 'feedback' && feedback) {
    const scoreMatch = feedback.match(/SCORE:\s*(\d+)\/10/)
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 7
    const verdict = feedback.includes('EXCELLENT') ? 'EXCELLENT' :
                    feedback.includes('GOOD') ? 'GOOD' : 'NEEDS PRACTICE'
    const verdictColor = verdict === 'EXCELLENT' ? '#14a044' :
                        verdict === 'GOOD' ? '#f59e0b' : '#dc2626'

    return (
      <div className="p-4">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">
            {verdict === 'EXCELLENT' ? '🏆' : verdict === 'GOOD' ? '⭐' : '📚'}
          </div>
          <div className="text-3xl font-bold mb-1" style={{color: verdictColor}}>
            {score}/10
          </div>
          <div className="font-bold text-sm px-3 py-1 rounded-full inline-block text-white"
            style={{background: verdictColor}}>
            {verdict}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-64 overflow-y-auto">
          <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
            {feedback.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => {
            setPhase('intro')
            setMessages([])
            setTurnCount(0)
            setFeedback(null)
          }}
            className="flex items-center justify-center gap-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
            <RotateCcw size={14}/> Try Again
          </button>
          <button onClick={() => onComplete(score)}
            className="text-white font-bold py-2.5 rounded-xl text-sm"
            style={{background:'#0d7377'}}>
            ✅ Complete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <p className="text-xs font-bold text-gray-600">{scenario.emoji} {scenario.title}</p>
        <p className="text-xs text-gray-400">Turn {turnCount}/12 — You are the provider</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white font-bold
              ${msg.role === 'user' ? 'bg-teal-600' : 'bg-gray-400'}`}>
              {msg.role === 'user' ? 'P' : 'C'}
            </div>
            <div className={`max-w-xs rounded-xl px-3 py-2 text-xs leading-relaxed
              ${msg.role === 'user'
                ? 'text-white rounded-tr-none'
                : 'bg-gray-100 text-gray-700 rounded-tl-none'}`}
              style={msg.role === 'user' ? {background:'#0d7377'} : {}}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white">C</div>
            <div className="bg-gray-100 rounded-xl px-3 py-2 flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
                  style={{animation:`bounce 1s infinite ${i*0.2}s`}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            placeholder="Type what you would say to the client..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0
              ${input.trim() && !loading ? '' : 'bg-gray-200'}`}
            style={input.trim() && !loading ? {background:'#0d7377'} : {}}>
            <Send size={14}/>
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1">
          P = You (Provider) | C = Client (AI)
        </p>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
    </div>
  )
}

// ── MICROLEARNING MODULE COMPONENT ────────────────────────────────────────────
function ModuleViewer({ module, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showExplanation, setShowExplanation] = useState({})
  const [completed, setCompleted] = useState(false)
  const [score, setScore] = useState(0)

  const content = module.content
  const item = content[currentStep]
  const isLast = currentStep === content.length - 1
  const quizItems = content.filter(c => c.type === 'quiz')
  const answeredCorrectly = quizItems.filter((q, i) => {
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
      const finalScore = quizItems.length > 0
        ? Math.round((answeredCorrectly / quizItems.length) * 10)
        : 8
      setScore(finalScore)
      setCompleted(true)
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  if (completed) {
    return (
      <div className="text-center p-6">
        <div className="text-5xl mb-3">
          {score >= 8 ? '🏆' : score >= 6 ? '⭐' : '📚'}
        </div>
        <h3 className="font-bold text-gray-800 text-lg mb-1">
          {score >= 8 ? 'Excellent!' : score >= 6 ? 'Well done!' : 'Keep learning!'}
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Quiz score: {answeredCorrectly}/{quizItems.length} correct
        </p>
        <div className="bg-teal-50 rounded-xl p-4 mb-4">
          <p className="text-2xl font-bold text-teal-600 mb-1">+{module.points} pts</p>
          <p className="text-sm text-teal-500">Module points earned</p>
        </div>
        <button onClick={() => onComplete(score, module.points)}
          className="w-full text-white font-bold py-3 rounded-xl"
          style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
          ✅ Complete Module
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-4">
        {content.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors
            ${i < currentStep ? 'bg-green-400' :
              i === currentStep ? 'bg-teal-500' : 'bg-gray-200'}`}/>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-4">Step {currentStep + 1} of {content.length}</p>

      {item.type === 'lesson' && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3">{item.title}</h3>
          <div className="bg-gray-50 rounded-xl p-4 mb-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {item.text}
          </div>
          {item.highlight && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-sm text-teal-700 font-medium">
              {item.highlight}
            </div>
          )}
          <button onClick={handleNext}
            className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            style={{background:'#0d7377'}}>
            {isLast ? '✅ Complete Module' : <>Next <ChevronRight size={16}/></>}
          </button>
        </div>
      )}

      {item.type === 'quiz' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">QUIZ</span>
            <p className="text-xs text-gray-400">Test your knowledge</p>
          </div>
          <p className="font-semibold text-gray-800 text-sm mb-4">{item.question}</p>
          <div className="space-y-2 mb-4">
            {item.options.map((opt, i) => {
              const answered = answers[currentStep] !== undefined
              const isSelected = answers[currentStep] === i
              const isCorrect = i === item.correct
              let bgClass = 'border-gray-200 hover:border-teal-300 bg-white'
              if (answered) {
                if (isCorrect) bgClass = 'border-green-400 bg-green-50'
                else if (isSelected) bgClass = 'border-red-400 bg-red-50'
                else bgClass = 'border-gray-200 bg-gray-50 opacity-60'
              }
              return (
                <button key={i}
                  onClick={() => handleAnswer(currentStep, i)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${bgClass}`}
                  disabled={answered}>
                  <span className="text-gray-600 font-medium mr-2">
                    {['A','B','C','D'][i]}.
                  </span>
                  <span className={answered && isCorrect ? 'text-green-700 font-semibold' :
                    answered && isSelected ? 'text-red-700' : 'text-gray-700'}>
                    {opt}
                  </span>
                  {answered && isCorrect && <span className="float-right text-green-500">✅</span>}
                  {answered && isSelected && !isCorrect && <span className="float-right text-red-500">❌</span>}
                </button>
              )
            })}
          </div>
          {showExplanation[currentStep] && (
            <div className={`rounded-xl p-3 mb-4 text-sm
              ${answers[currentStep] === item.correct
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <p className="font-bold mb-1">
                {answers[currentStep] === item.correct ? '✅ Correct!' : '❌ Not quite...'}
              </p>
              <p>{item.explanation}</p>
            </div>
          )}
          {answers[currentStep] !== undefined && (
            <button onClick={handleNext}
              className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              style={{background:'#0d7377'}}>
              {isLast ? '✅ Complete Module' : <>Next <ChevronRight size={16}/></>}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── MAIN AFYA MENTOR PAGE ─────────────────────────────────────────────────────
export default function AfyaMentor() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const geminiApiKey = facility.gemini_api_key || ''
  const user = JSON.parse(localStorage.getItem('afyamec_current_user') || '{}')

  const [activeTab, setActiveTab] = useState('learn')
  const [selectedModule, setSelectedModule] = useState(null)
  const [selectedSim, setSelectedSim] = useState(null)
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('afyamentor_progress') || '{}') }
    catch { return {} }
  })

  const saveProgress = (key, data) => {
    const updated = { ...progress, [key]: data }
    setProgress(updated)
    localStorage.setItem('afyamentor_progress', JSON.stringify(updated))
  }

  const totalPoints = Object.values(progress)
    .reduce((sum, p) => sum + (p.points || 0), 0)
  const completedModules = MODULES.filter(m => progress[m.id]?.completed).length
  const completedSims = SIMULATION_SCENARIOS.filter(s => progress[s.id]?.completed).length

  const getLevelTitle = (pts) => {
    if (pts >= 100) return { title: 'Expert Provider', emoji: '🏆', color: '#f59e0b' }
    if (pts >= 60) return { title: 'Skilled Provider', emoji: '⭐', color: '#14a044' }
    if (pts >= 30) return { title: 'Developing Provider', emoji: '📈', color: '#0d7377' }
    return { title: 'Learner', emoji: '📚', color: '#6b7280' }
  }

  const level = getLevelTitle(totalPoints)

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Dashboard
      </button>

      {/* Header */}
      <div className="rounded-2xl p-5 mb-5 text-white"
        style={{background:'linear-gradient(135deg,#0d7377 0%,#14a044 100%)'}}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              🌿 Afya Mentor
            </h2>
            <p className="text-teal-100 text-sm mt-0.5">
              AI-Powered FP Provider Training
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl">{level.emoji}</div>
            <p className="text-xs text-teal-100 mt-0.5">{level.title}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
            <p className="text-xl font-bold">{totalPoints}</p>
            <p className="text-xs text-teal-100">Points</p>
          </div>
          <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
            <p className="text-xl font-bold">{completedModules}/{MODULES.length}</p>
            <p className="text-xs text-teal-100">Modules</p>
          </div>
          <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
            <p className="text-xl font-bold">{completedSims}/{SIMULATION_SCENARIOS.length}</p>
            <p className="text-xs text-teal-100">Simulations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { key: 'learn', label: '📚 Learn', desc: 'Modules' },
          { key: 'simulate', label: '🎭 Simulate', desc: 'Practice' },
          { key: 'peers', label: '👥 Peers', desc: 'Discuss' },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`p-3 rounded-xl border-2 transition-colors
              ${activeTab === tab.key
                ? 'text-white border-transparent'
                : 'border-gray-200 bg-white hover:border-teal-300'}`}
            style={activeTab === tab.key ? {background:'#0d7377'} : {}}>
            <p className={`font-bold text-sm ${activeTab === tab.key ? 'text-white' : 'text-gray-700'}`}>
              {tab.label}
            </p>
            <p className={`text-xs ${activeTab === tab.key ? 'text-teal-100' : 'text-gray-400'}`}>
              {tab.desc}
            </p>
          </button>
        ))}
      </div>

      {/* ── LEARN TAB ── */}
      {activeTab === 'learn' && !selectedModule && (
        <div className="space-y-3">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-2">
            <p className="text-sm text-teal-700 font-medium">
              📖 Complete modules to earn points and build your clinical skills.
              Each module takes 7-10 minutes and includes a quiz.
            </p>
          </div>
          {MODULES.map(module => {
            const done = progress[module.id]?.completed
            const moduleScore = progress[module.id]?.score
            return (
              <button key={module.id}
                onClick={() => setSelectedModule(module)}
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
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{module.duration}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{background: module.color + '20', color: module.color}}>
                        {module.category}
                      </span>
                      <span className="text-xs text-gray-400">{module.level}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {done ? (
                      <div>
                        <p className="text-sm font-bold text-green-600">+{module.points}pts</p>
                        <p className="text-xs text-gray-400">Score: {moduleScore}/10</p>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-gray-400">+{module.points}pts</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Module Viewer */}
      {activeTab === 'learn' && selectedModule && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3"
            style={{background: selectedModule.color + '10'}}>
            <button onClick={() => setSelectedModule(null)}
              className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={16}/>
            </button>
            <div className="text-xl">{selectedModule.emoji}</div>
            <div>
              <p className="font-bold text-gray-700 text-sm">{selectedModule.title}</p>
              <p className="text-xs text-gray-400">{selectedModule.duration} · {selectedModule.points} points</p>
            </div>
          </div>
          <ModuleViewer
            module={selectedModule}
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
              <p className="text-xs text-amber-600">
                Add your Gemini API key in Settings → Facility Settings to enable AI simulations.
              </p>
              <button onClick={() => navigate('/settings')}
                className="mt-2 text-xs text-amber-700 underline">
                Go to Settings →
              </button>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-2">
            <p className="text-sm text-blue-700 font-medium">
              🎭 Practice counselling with an AI client. You are the provider — conduct a real session.
              Receive scored feedback on your BCS+ skills.
            </p>
          </div>
          {SIMULATION_SCENARIOS.map(sim => {
            const done = progress[sim.id]?.completed
            const simScore = progress[sim.id]?.score
            const diffColors = {
              'Beginner': '#14a044', 'Intermediate': '#f59e0b', 'Advanced': '#dc2626'
            }
            return (
              <button key={sim.id}
                onClick={() => setSelectedSim(sim)}
                disabled={!geminiApiKey}
                className={`w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-left transition-all
                  ${geminiApiKey ? 'hover:border-teal-400 hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {sim.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-gray-800 text-sm">{sim.title}</p>
                      {done && <CheckCircle size={14} className="text-green-500"/>}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{sim.description}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      style={{background: diffColors[sim.difficulty]}}>
                      {sim.difficulty}
                    </span>
                  </div>
                  {done && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-600">{simScore}/10</p>
                      <p className="text-xs text-gray-400">Score</p>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Simulation */}
      {activeTab === 'simulate' && selectedSim && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          style={{height: '560px', display: 'flex', flexDirection: 'column'}}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setSelectedSim(null)}
              className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={16}/>
            </button>
            <span className="text-sm font-bold text-gray-600">Counselling Simulation</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CounsellingSimulator
              scenario={selectedSim}
              apiKey={geminiApiKey}
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
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-2">
            <p className="text-sm text-blue-700 font-medium">
              👥 Peer learning: Discuss real cases with your team. Learn from each other's experience.
            </p>
          </div>
          {PEER_DISCUSSIONS.map(disc => (
            <div key={disc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-700 text-sm mb-2">{disc.title}</h3>
              <p className="text-sm text-gray-600 mb-3 italic">"{disc.prompt}"</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {disc.tags.map(tag => (
                  <span key={tag}
                    className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-100">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  💬 {disc.responses} team response{disc.responses !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    const whatsappMsg = encodeURIComponent(
                      `🌿 *AfyaMEC Peer Learning*\n\n` +
                      `*Topic: ${disc.title.replace(/[🎭📋⚕️👤💉]/g, '')}*\n\n` +
                      `${disc.prompt}\n\n` +
                      `Share your experience with your team 👇`
                    )
                    window.open(`https://wa.me/?text=${whatsappMsg}`, '_blank')
                  }}
                  className="flex items-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Share on WhatsApp
                </button>
              </div>
            </div>
          ))}

          {/* CPD Points summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-4">
            <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500"/> Your Learning Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-teal-50 rounded-lg p-3">
                <p className="text-lg font-bold text-teal-600">{totalPoints}</p>
                <p className="text-xs text-gray-500">Total points earned</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-lg font-bold text-purple-600">{completedModules + completedSims}</p>
                <p className="text-xs text-gray-500">Activities completed</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress to Expert Provider</span>
                <span>{totalPoints}/100 pts</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full transition-all"
                  style={{width:`${Math.min(totalPoints, 100)}%`,
                    background:'linear-gradient(90deg,#0d7377,#14a044)'}}/>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}