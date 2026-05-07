import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, RotateCcw } from 'lucide-react'

// WHO MEC 6th Edition data — conditions × methods
const MEC_DATA = {
  // Format: condition: { COC, POP, DMPA, IMPLANT, CU_IUD, LNG_IUS, note }
  // 1=no restriction, 2=benefits>risks, 3=risks>benefits, 4=contraindicated
  // I=Initiation, C=Continuation (we show I by default)

  conditions: [
    // ── AGE ──
    { id: 'menarche_18', label: 'Age: Menarche to <18 years', category: 'Age',
      COC:1, POP:1, DMPA:2, NET_EN:2, IMPLANT:1, CU_IUD:2, LNG_IUS:2,
      note: 'DMPA/NET-EN: concern about bone density in adolescents' },
    { id: 'age_18_45', label: 'Age: 18–45 years', category: 'Age',
      COC:1, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:1,
      note: 'No restrictions for healthy women of reproductive age' },
    { id: 'age_over_45', label: 'Age: >45 years', category: 'Age',
      COC:2, POP:1, DMPA:2, NET_EN:2, IMPLANT:1, CU_IUD:1, LNG_IUS:1,
      note: 'COC: theoretical cardiovascular concern with older age' },

    // ── POSTPARTUM ──
    { id: 'pp_lt48hrs', label: 'Postpartum: <48 hours (breastfeeding)', category: 'Postpartum',
      COC:4, POP:2, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:1, LNG_IUS:1,
      note: 'COC contraindicated <6 weeks postpartum when breastfeeding' },
    { id: 'pp_48hrs_6wks_bf', label: 'Postpartum: 48hrs–<6 weeks (breastfeeding)', category: 'Postpartum',
      COC:4, POP:2, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:2, LNG_IUS:2,
      note: 'COC: Category 4 when breastfeeding <6 weeks' },
    { id: 'pp_6wks_6mo_bf', label: 'Postpartum: 6 weeks–6 months (breastfeeding)', category: 'Postpartum',
      COC:3, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:1,
      note: 'COC category 3 — may reduce milk supply' },
    { id: 'pp_6mo_plus_bf', label: 'Postpartum: >6 months (breastfeeding)', category: 'Postpartum',
      COC:2, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:1,
      note: 'COC generally safe after 6 months postpartum' },
    { id: 'pp_not_bf', label: 'Postpartum: <21 days (not breastfeeding)', category: 'Postpartum',
      COC:4, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:2, LNG_IUS:2,
      note: 'High VTE risk <21 days postpartum — avoid COC' },
    { id: 'pp_21_42_not_bf', label: 'Postpartum: 21–42 days (not breastfeeding)', category: 'Postpartum',
      COC:3, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:1,
      note: 'COC category 3 with VTE risk factors; category 2 without' },

    // ── HYPERTENSION ──
    { id: 'bp_controlled', label: 'Hypertension: Adequately controlled', category: 'Cardiovascular',
      COC:3, POP:1, DMPA:2, NET_EN:2, IMPLANT:1, CU_IUD:1, LNG_IUS:2,
      note: 'COC: category 3 even with controlled hypertension' },
    { id: 'bp_140_159', label: 'BP: Systolic 140–159 or Diastolic 90–99', category: 'Cardiovascular',
      COC:3, POP:1, DMPA:2, NET_EN:2, IMPLANT:1, CU_IUD:1, LNG_IUS:2,
      note: 'COC category 3 — risk of stroke/MI' },
    { id: 'bp_ge160', label: 'BP: Systolic ≥160 or Diastolic ≥100', category: 'Cardiovascular',
      COC:4, POP:1, DMPA:3, NET_EN:3, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: 'COC CONTRAINDICATED. DMPA category 3. Non-hormonal preferred.' },
    { id: 'htn_vascular', label: 'Hypertension with vascular disease', category: 'Cardiovascular',
      COC:4, POP:2, DMPA:3, NET_EN:3, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: 'COC CONTRAINDICATED with vascular complications' },

    // ── DIABETES ──
    { id: 'dm_no_complications', label: 'Diabetes: Non-vascular, insulin/non-insulin dependent', category: 'Diabetes',
      COC:2, POP:2, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: 'Generally usable. Monitor glucose.' },
    { id: 'dm_nephropathy', label: 'Diabetes with nephropathy/retinopathy/neuropathy', category: 'Diabetes',
      COC:3, POP:2, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: 'COC category 3/4 with end-organ damage' },
    { id: 'dm_vascular', label: 'Diabetes with other vascular disease', category: 'Diabetes',
      COC:4, POP:2, DMPA:3, NET_EN:3, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: 'COC CONTRAINDICATED with vascular disease and diabetes' },

    // ── MIGRAINE ──
    { id: 'migraine_no_aura', label: 'Migraine: Without aura (age <35)', category: 'Neurological',
      COC:2, POP:2, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: 'COC generally usable if migraine without aura and <35 years' },
    { id: 'migraine_no_aura_35', label: 'Migraine: Without aura (age ≥35)', category: 'Neurological',
      COC:3, POP:2, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: 'COC category 3 if migraine without aura and ≥35 years' },
    { id: 'migraine_with_aura', label: 'Migraine: WITH aura (any age)', category: 'Neurological',
      COC:4, POP:2, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: '🚨 COC ABSOLUTELY CONTRAINDICATED — stroke risk. Use non-COC methods.' },

    // ── HIV/ARVs ──
    { id: 'hiv_positive_no_arv', label: 'HIV positive (not on ARVs)', category: 'HIV/Infections',
      COC:1, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:2,
      note: 'All methods generally safe. Offer dual protection.' },
    { id: 'hiv_arv_nrti', label: 'HIV on NRTIs', category: 'HIV/Infections',
      COC:1, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:2,
      note: 'NRTIs: no significant drug interactions with hormonal methods' },
    { id: 'hiv_arv_nnrti_efavirenz', label: 'HIV on NNRTIs (efavirenz)', category: 'HIV/Infections',
      COC:2, POP:2, DMPA:1, NET_EN:2, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: 'Efavirenz REDUCES efficacy of COC, POP, implants. DMPA safest injectable.' },
    { id: 'hiv_arv_pi_ritonavir', label: 'HIV on ritonavir-boosted PIs', category: 'HIV/Infections',
      COC:3, POP:3, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: 'Ritonavir significantly reduces efficacy of hormonal methods. Cu-IUD preferred.' },
    { id: 'hiv_stage3_4', label: 'HIV: Stage 3 or 4 (severe disease)', category: 'HIV/Infections',
      COC:1, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:3, LNG_IUS:3,
      note: 'IUD insertion category 3/4 with severe HIV disease' },

    // ── BREAST CANCER ──
    { id: 'breast_cancer_current', label: 'Breast cancer: Current', category: 'Cancer',
      COC:4, POP:4, DMPA:4, NET_EN:4, IMPLANT:4, CU_IUD:1, LNG_IUS:4,
      note: '🚨 ALL hormonal methods CONTRAINDICATED. Only Cu-IUD is safe.' },
    { id: 'breast_cancer_past_5yr', label: 'Breast cancer: Past, no evidence for 5 years', category: 'Cancer',
      COC:3, POP:3, DMPA:3, NET_EN:3, IMPLANT:3, CU_IUD:1, LNG_IUS:3,
      note: 'Category 3 for all hormonal methods. Cu-IUD category 1.' },

    // ── SMOKING ──
    { id: 'smoking_lt35', label: 'Smoking: Age <35 years (any amount)', category: 'Smoking',
      COC:2, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:1,
      note: 'COC category 2 — acceptable but counsel to quit' },
    { id: 'smoking_ge35_lt15', label: 'Smoking: Age ≥35, <15 cigarettes/day', category: 'Smoking',
      COC:3, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:1,
      note: 'COC category 3 — significantly increased cardiovascular risk' },
    { id: 'smoking_ge35_ge15', label: 'Smoking: Age ≥35, ≥15 cigarettes/day', category: 'Smoking',
      COC:4, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:1,
      note: '🚨 COC CONTRAINDICATED — unacceptable cardiovascular risk' },

    // ── OBESITY ──
    { id: 'obesity_bmi_ge30', label: 'Obesity: BMI ≥30 kg/m²', category: 'BMI/Weight',
      COC:2, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:1,
      note: 'COC: theoretical VTE risk with obesity. Benefits usually outweigh risks.' },

    // ── LIVER ──
    { id: 'hepatitis_active', label: 'Viral hepatitis: Active (acute or flare)', category: 'Liver',
      COC:4, POP:3, DMPA:3, NET_EN:3, IMPLANT:3, CU_IUD:1, LNG_IUS:3,
      note: 'Severe liver dysfunction: avoid hormonal methods. Cu-IUD safe.' },
    { id: 'cirrhosis_mild', label: 'Liver cirrhosis: Mild (compensated)', category: 'Liver',
      COC:3, POP:3, DMPA:3, NET_EN:3, IMPLANT:3, CU_IUD:1, LNG_IUS:3,
      note: 'Moderate liver impairment: category 3 for hormonal methods' },
    { id: 'cirrhosis_severe', label: 'Liver cirrhosis: Severe (decompensated)', category: 'Liver',
      COC:4, POP:4, DMPA:4, NET_EN:4, IMPLANT:4, CU_IUD:1, LNG_IUS:4,
      note: '🚨 Severe liver disease: ALL hormonal methods contraindicated' },

    // ── STI/REPRODUCTIVE TRACT ──
    { id: 'current_pid', label: 'Current PID (Pelvic Inflammatory Disease)', category: 'Reproductive Tract',
      COC:1, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:4, LNG_IUS:4,
      note: '🚨 IUD/LNG-IUS: CONTRAINDICATED with active PID — treat first' },
    { id: 'current_sti', label: 'Current STI (purulent cervicitis, gonorrhoea, chlamydia)', category: 'Reproductive Tract',
      COC:1, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:4, LNG_IUS:4,
      note: '🚨 IUD: CONTRAINDICATED with active STI — treat infection first' },
    { id: 'unexplained_bleeding', label: 'Unexplained vaginal bleeding (before evaluation)', category: 'Reproductive Tract',
      COC:2, POP:2, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:4, LNG_IUS:4,
      note: 'Evaluate cause before inserting IUD/implant. Hormonal methods: category 2.' },

    // ── DRUGS ──
    { id: 'rifampicin', label: 'Rifampicin or rifabutin (TB treatment)', category: 'Drug Interactions',
      COC:3, POP:3, DMPA:1, NET_EN:1, IMPLANT:3, CU_IUD:1, LNG_IUS:2,
      note: 'Rifampicin significantly REDUCES efficacy of COC, POP, implants. Use DMPA or Cu-IUD.' },
    { id: 'enzyme_inducing_aed', label: 'Anticonvulsants: Phenytoin, carbamazepine, barbiturates, primidone', category: 'Drug Interactions',
      COC:3, POP:3, DMPA:1, NET_EN:1, IMPLANT:3, CU_IUD:1, LNG_IUS:2,
      note: 'Enzyme-inducing AEDs reduce hormonal contraceptive levels. DMPA or Cu-IUD preferred.' },
    { id: 'lamotrigine', label: 'Anticonvulsants: Lamotrigine', category: 'Drug Interactions',
      COC:3, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:1, LNG_IUS:1,
      note: 'COC reduces lamotrigine levels — may worsen seizure control. Avoid COC.' },

    // ── BREASTFEEDING ──
    { id: 'lam_criteria', label: 'LAM: ALL 3 criteria met (<6mo, fully BF, no periods)', category: 'Postpartum',
      COC:4, POP:2, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:1, LNG_IUS:1,
      note: 'LAM is effective when all 3 criteria met. COC avoided during breastfeeding <6 months.' },

    // ── SICKLE CELL ──
    { id: 'sickle_cell', label: 'Sickle cell disease', category: 'Blood Disorders',
      COC:2, POP:1, DMPA:1, NET_EN:1, IMPLANT:1, CU_IUD:2, LNG_IUS:2,
      note: 'DMPA/progestogen may reduce sickle cell crises. COC: theoretical thromboembolic risk.' },
    { id: 'dvt_pe_history', label: 'DVT/PE: History (not on anticoagulants)', category: 'Blood Disorders',
      COC:4, POP:2, DMPA:2, NET_EN:2, IMPLANT:2, CU_IUD:1, LNG_IUS:2,
      note: '🚨 COC CONTRAINDICATED — very high VTE recurrence risk' },
  ]
}

const METHODS = [
  { id: 'COC', label: 'COC', fullLabel: 'Combined Oral Pill', color: '#0d7377', emoji: '💊' },
  { id: 'POP', label: 'POP', fullLabel: 'Progestogen-Only Pill', color: '#14a044', emoji: '💊' },
  { id: 'DMPA', label: 'DMPA', fullLabel: 'DMPA Injection (IM/SC)', color: '#2563eb', emoji: '💉' },
  { id: 'NET_EN', label: 'NET-EN', fullLabel: 'NET-EN Injection', color: '#7c3aed', emoji: '💉' },
  { id: 'IMPLANT', label: 'Implant', fullLabel: 'Contraceptive Implant', color: '#ec4899', emoji: '🩹' },
  { id: 'CU_IUD', label: 'Cu-IUD', fullLabel: 'Copper IUD', color: '#f59e0b', emoji: '🔩' },
  { id: 'LNG_IUS', label: 'LNG-IUS', fullLabel: 'LNG-IUS (Mirena)', color: '#06b6d4', emoji: '🔩' },
]

const CATEGORIES = [...new Set(MEC_DATA.conditions.map(c => c.category))]

const CAT_COLORS = {
  1: { bg: '#dcfce7', text: '#15803d', border: '#86efac', label: '1 — No restriction' },
  2: { bg: '#fef9c3', text: '#a16207', border: '#fde047', label: '2 — Benefits > Risks' },
  3: { bg: '#fed7aa', text: '#c2410c', border: '#fdba74', label: '3 — Risks > Benefits' },
  4: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: '4 — CONTRAINDICATED' },
}

export default function MECWheel() {
  const navigate = useNavigate()
  const [selectedConditions, setSelectedConditions] = useState([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const wheelRef = useRef(null)

  const toggleCondition = (condId) => {
    setSelectedConditions(prev =>
      prev.includes(condId)
        ? prev.filter(id => id !== condId)
        : [...prev, condId]
    )
  }

  const spinWheel = () => {
    setSpinning(true)
    const spins = 5 + Math.random() * 5
    const newRotation = rotation + spins * 360
    setRotation(newRotation)
    setTimeout(() => setSpinning(false), 2000)
  }

  const reset = () => {
    setSelectedConditions([])
    setSearch('')
    setRotation(0)
  }

  // Get MEC results for selected conditions
  const getMethodResult = (methodId) => {
    if (selectedConditions.length === 0) return null
    let maxCat = 1
    let notes = []
    for (const condId of selectedConditions) {
      const cond = MEC_DATA.conditions.find(c => c.id === condId)
      if (cond && cond[methodId]) {
        if (cond[methodId] > maxCat) maxCat = cond[methodId]
        if (cond.note) notes.push(cond.note)
      }
    }
    return { category: maxCat, notes }
  }

  const filteredConditions = MEC_DATA.conditions.filter(c => {
    const matchSearch = !search ||
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || c.category === activeCategory
    return matchSearch && matchCat
  })

  // Wheel segments for display
  const wheelSegments = METHODS.length
  const anglePerSegment = 360 / wheelSegments

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Dashboard
      </button>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          🎡 MEC Wheel
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          WHO Medical Eligibility Criteria — 6th Edition (2025) Interactive Tool
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-5">
        <p className="text-sm text-teal-700 font-medium mb-1">
          🎯 How to use the MEC Wheel:
        </p>
        <ol className="text-xs text-teal-600 space-y-0.5">
          <li>1. Search and select one or more client conditions below</li>
          <li>2. The wheel shows MEC categories for each method</li>
          <li>3. Green=Cat1 (safe), Yellow=Cat2, Orange=Cat3, Red=Cat4 (avoid)</li>
          <li>4. Click "Spin the Wheel" for an old-school experience!</li>
        </ol>
      </div>

      {/* THE WHEEL */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
        <div className="flex justify-center mb-4">
          <div className="relative">
            {/* Wheel SVG */}
            <svg
              width="280" height="280"
              viewBox="-140 -140 280 280"
              ref={wheelRef}
              style={{
                transition: spinning ? 'transform 2s cubic-bezier(0.25,0.1,0.25,1)' : 'none',
                transform: `rotate(${rotation}deg)`,
                display: 'block'
              }}>
              {METHODS.map((method, i) => {
                const startAngle = (i * anglePerSegment - 90) * Math.PI / 180
                const endAngle = ((i + 1) * anglePerSegment - 90) * Math.PI / 180
                const x1 = 120 * Math.cos(startAngle)
                const y1 = 120 * Math.sin(startAngle)
                const x2 = 120 * Math.cos(endAngle)
                const y2 = 120 * Math.sin(endAngle)
                const textAngle = ((i + 0.5) * anglePerSegment - 90) * Math.PI / 180
                const textX = 75 * Math.cos(textAngle)
                const textY = 75 * Math.sin(textAngle)
                const midAngle = ((i + 0.5) * anglePerSegment - 90) * Math.PI / 180
                const emojiX = 100 * Math.cos(midAngle)
                const emojiY = 100 * Math.sin(midAngle)

                const result = getMethodResult(method.id)
                const catColor = result ? CAT_COLORS[result.category] : null
                const fillColor = catColor ? catColor.bg : method.color + '22'
                const strokeColor = catColor ? catColor.border : method.color

                return (
                  <g key={method.id}>
                    <path
                      d={`M 0 0 L ${x1} ${y1} A 120 120 0 0 1 ${x2} ${y2} Z`}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth="2"
                    />
                    <text
                      x={textX} y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill={catColor ? catColor.text : method.color}
                      transform={`rotate(${(i + 0.5) * anglePerSegment}, ${textX}, ${textY})`}>
                      {method.label}
                    </text>
                    {result && (
                      <text
                        x={emojiX * 0.65}
                        y={emojiY * 0.65}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="14">
                        {result.category === 1 ? '✅' : result.category === 2 ? '⚠️' : result.category === 3 ? '🔶' : '❌'}
                      </text>
                    )}
                  </g>
                )
              })}
              {/* Center circle */}
              <circle cx="0" cy="0" r="30" fill="#0d7377" stroke="white" strokeWidth="3"/>
              <text x="0" y="-4" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">MEC</text>
              <text x="0" y="7" textAnchor="middle" fill="white" fontSize="7">Wheel</text>
            </svg>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1"
              style={{width:0, height:0, borderLeft:'8px solid transparent',
                borderRight:'8px solid transparent', borderTop:'16px solid #dc2626'}}>
            </div>
          </div>
        </div>

        {/* Spin button */}
        <div className="flex gap-2 justify-center mb-4">
          <button
            onClick={spinWheel}
            disabled={spinning}
            className={`flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl text-sm transition-all
              ${spinning ? 'bg-gray-200 text-gray-400' : 'text-white hover:shadow-md'}`}
            style={!spinning ? {background:'linear-gradient(135deg,#0d7377,#14a044)'} : {}}>
            🎡 {spinning ? 'Spinning...' : 'Spin the Wheel!'}
          </button>
          <button onClick={reset}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">
            <RotateCcw size={14}/> Reset
          </button>
        </div>

        {/* Category Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(CAT_COLORS).map(([cat, colors]) => (
            <div key={cat} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded flex-shrink-0 border"
                style={{background:colors.bg, borderColor:colors.border}}/>
              <span style={{color:colors.text}} className="font-medium">{colors.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Method Results — when conditions selected */}
      {selectedConditions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3">
            📊 MEC Results for Selected Conditions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {METHODS.map(method => {
              const result = getMethodResult(method.id)
              if (!result) return null
              const colors = CAT_COLORS[result.category]
              return (
                <div key={method.id} className="rounded-xl border p-3 text-center"
                  style={{background:colors.bg, borderColor:colors.border}}>
                  <div className="text-lg mb-1">{method.emoji}</div>
                  <p className="font-bold text-xs" style={{color:colors.text}}>
                    {method.label}
                  </p>
                  <div className="text-xl font-bold my-1" style={{color:colors.text}}>
                    {result.category}
                  </div>
                  <p className="text-xs" style={{color:colors.text}}>
                    {result.category === 1 ? 'Use freely' :
                     result.category === 2 ? 'Generally use' :
                     result.category === 3 ? 'Use with caution' :
                     'DO NOT USE'}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Notes */}
          <div className="mt-3 space-y-2">
            {selectedConditions.map(condId => {
              const cond = MEC_DATA.conditions.find(c => c.id === condId)
              return cond ? (
                <div key={condId} className="bg-gray-50 rounded-lg p-2 text-xs">
                  <p className="font-bold text-gray-700">📌 {cond.label}</p>
                  <p className="text-gray-500 mt-0.5">{cond.note}</p>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Condition Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-3">
          🔍 Select Client Conditions ({selectedConditions.length} selected)
        </h3>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-3 text-gray-400"/>
          <input
            className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Search conditions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors
                ${activeCategory === cat
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={activeCategory === cat ? {background:'#0d7377'} : {}}>
              {cat}
            </button>
          ))}
        </div>

        {/* Conditions list */}
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filteredConditions.map(cond => (
            <button
              key={cond.id}
              onClick={() => toggleCondition(cond.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm
                ${selectedConditions.includes(cond.id)
                  ? 'border-teal-400 bg-teal-50 text-teal-700 font-semibold'
                  : 'border-gray-100 hover:border-teal-200 hover:bg-teal-50 text-gray-700'}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {selectedConditions.includes(cond.id) && (
                    <span className="text-teal-500 flex-shrink-0">✓</span>
                  )}
                  {cond.label}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {cond.category}
                </span>
              </div>
            </button>
          ))}
        </div>

        {selectedConditions.length > 0 && (
          <button onClick={() => setSelectedConditions([])}
            className="mt-3 w-full text-xs text-red-500 hover:text-red-700 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            ✕ Clear all selections
          </button>
        )}
      </div>

      {/* Citation */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-500 text-center">
        Based on WHO Medical Eligibility Criteria for Contraceptive Use, 6th Edition (2025)<br/>
        Kenya National Family Planning Guidelines, 6th Edition (2022)<br/>
        <span className="text-red-500 font-medium">
          This tool is for clinical reference only — always apply individual clinical judgment
        </span>
      </div>
    </div>
  )
}