import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../hooks/useSession.jsx'
import { deriveConditionsFromVitals } from '../../data/mecEngine.js'
import { ChevronRight, ChevronLeft, AlertTriangle, Info } from 'lucide-react'

const MODULES = [
  {
    id: 'reproductive',
    title: '🤰 Reproductive History',
    description: 'Postpartum status, breastfeeding, and gynaecological history',
    questions: [
      {
        id: 'postpartum_status',
        label: 'What is the client\'s postpartum status?',
        type: 'select',
        options: [
          { value: '', label: 'Not postpartum / N/A' },
          { value: 'pp_no_bf_lt48hrs', label: '< 48 hours postpartum (not breastfeeding)' },
          { value: 'pp_bf_lt6wks', label: '< 6 weeks postpartum (breastfeeding)' },
          { value: 'pp_no_bf_48hrs_4wks', label: '48 hrs – 4 weeks postpartum (not breastfeeding)' },
          { value: 'pp_no_bf_gt4wks', label: '> 4 weeks postpartum (not breastfeeding)' },
          { value: 'pp_bf_6wks_6mo', label: '6 weeks – 6 months postpartum (breastfeeding)' },
          { value: 'pp_bf_gt6mo', label: '> 6 months postpartum (breastfeeding)' },
        ],
        conditionMap: 'direct',
      },
      { id: 'past_ectopic', label: 'History of ectopic pregnancy?', type: 'yesno', condition: 'past_ectopic' },
      { id: 'unexplained_bleeding', label: 'Unexplained vaginal bleeding (before evaluation)?', type: 'yesno', condition: 'unexplained_vaginal_bleeding' },
      { id: 'uterine_fibroids', label: 'Known uterine fibroids?', type: 'yesno', condition: 'uterine_fibroids' },
      { id: 'current_pid', label: 'Current or recent PID (Pelvic Inflammatory Disease)?', type: 'yesno', condition: 'current_pid' },
      { id: 'current_sti', label: 'Current STI (other than HIV)?', type: 'yesno', condition: 'current_sti' },
      { id: 'sepsis', label: 'Puerperal sepsis or post-abortion sepsis?', type: 'yesno', condition: 'sepsis_puerperal' },
    ]
  },
  {
    id: 'cancer',
    title: '🎗️ Cancer & Reproductive Organ Conditions',
    description: 'Breast, cervical, and other cancers',
    questions: [
      {
        id: 'breast_cancer',
        label: 'Breast cancer status?',
        type: 'select',
        options: [
          { value: '', label: 'No breast cancer / unknown' },
          { value: 'breast_cancer_current', label: 'Current breast cancer' },
          { value: 'breast_cancer_past_5yrs', label: 'Past breast cancer (within 5 years)' },
          { value: 'breast_cancer_family_history', label: 'Family history only (no personal history)' },
        ],
        conditionMap: 'direct',
      },
      {
        id: 'cervical',
        label: 'Cervical condition?',
        type: 'select',
        options: [
          { value: '', label: 'No cervical condition' },
          { value: 'cervical_intraepithelial_neoplasia', label: 'CIN (Cervical Intraepithelial Neoplasia)' },
          { value: 'cervical_cancer_awaiting_treatment', label: 'Cervical cancer (awaiting treatment)' },
        ],
        conditionMap: 'direct',
      },
    ]
  },
  {
    id: 'cardiovascular',
    title: '❤️ Cardiovascular & Metabolic',
    description: 'Heart disease, blood pressure, clotting, and diabetes',
    questions: [
      { id: 'history_dvt', label: 'History of DVT (Deep Vein Thrombosis) or PE (Pulmonary Embolism)?', type: 'yesno', condition: 'history_dvt_pe' },
      { id: 'ihd', label: 'Ischaemic Heart Disease or history of heart attack?', type: 'yesno', condition: 'ischaemic_heart_disease' },
      { id: 'stroke', label: 'History of stroke or TIA?', type: 'yesno', condition: 'stroke' },
      { id: 'valvular', label: 'Complicated valvular heart disease (pulmonary hypertension, AF, bacterial endocarditis)?', type: 'yesno', condition: 'valvular_complicated' },
      {
        id: 'diabetes',
        label: 'Diabetes status?',
        type: 'select',
        options: [
          { value: '', label: 'No diabetes' },
          { value: 'diabetes_no_complications', label: 'Diabetes — no complications' },
          { value: 'diabetes_with_complications', label: 'Diabetes — with vascular complications' },
          { value: 'diabetes_nephropathy_retinopathy', label: 'Diabetes — nephropathy / retinopathy / neuropathy' },
        ],
        conditionMap: 'direct',
      },
      { id: 'smoker', label: 'Does the client smoke cigarettes?', type: 'yesno', condition: 'smoker_flag' },
    ]
  },
  {
    id: 'neurological',
    title: '🧠 Neurological Conditions',
    description: 'Migraines, epilepsy, and depression',
    questions: [
      {
        id: 'migraine',
        label: 'Migraine history?',
        type: 'select',
        options: [
          { value: '', label: 'No migraines' },
          { value: 'migraine_no_aura', label: 'Migraines without aura' },
          { value: 'migraine_with_aura', label: 'Migraines WITH aura (visual disturbances, numbness)' },
        ],
        conditionMap: 'age_dependent',
        note: 'Migraine with aura + COC = Category 4 (absolute contraindication)'
      },
      { id: 'epilepsy', label: 'Epilepsy (on anticonvulsant medication)?', type: 'yesno', condition: 'epilepsy' },
      { id: 'depression', label: 'Diagnosed depression?', type: 'yesno', condition: 'depression' },
    ]
  },
  {
    id: 'liver',
    title: '🫁 Liver & Gallbladder',
    description: 'Hepatitis, cirrhosis, liver tumours',
    questions: [
      {
        id: 'liver',
        label: 'Liver condition?',
        type: 'select',
        options: [
          { value: '', label: 'No liver condition' },
          { value: 'viral_hepatitis_active', label: 'Active viral hepatitis (B or C)' },
          { value: 'cirrhosis_severe', label: 'Severe (decompensated) cirrhosis' },
          { value: 'liver_tumour_benign', label: 'Benign liver tumour (hepatocellular adenoma)' },
          { value: 'liver_tumour_malignant', label: 'Malignant liver tumour (hepatocellular carcinoma)' },
        ],
        conditionMap: 'direct',
      },
    ]
  },
  {
    id: 'hiv_medications',
    title: '💊 HIV & Medications',
    description: 'HIV status, ARV regimen, and drug interactions',
    questions: [
      {
        id: 'hiv',
        label: 'HIV status?',
        type: 'select',
        options: [
          { value: '', label: 'HIV negative / unknown' },
          { value: 'hiv_high_risk', label: 'High risk for HIV (use condoms)' },
          { value: 'hiv_positive_stage1_2', label: 'HIV positive — WHO Stage 1 or 2 (asymptomatic/mild)' },
          { value: 'hiv_positive_stage3_4', label: 'HIV positive — WHO Stage 3 or 4 (severe/advanced)' },
        ],
        conditionMap: 'direct',
      },
      {
        id: 'arvs',
        label: 'On Antiretroviral Therapy (ARVs)?',
        type: 'select',
        options: [
          { value: '', label: 'Not on ARVs' },
          { value: 'arv_nnrti_efavirenz', label: 'NNRTI — Efavirenz-based regimen' },
          { value: 'arv_ritonavir_boosted_pi', label: 'PI — Ritonavir-boosted protease inhibitor' },
          { value: 'arv_rifampicin', label: 'On Rifampicin or Rifabutin (TB treatment)' },
        ],
        conditionMap: 'direct',
        note: 'Rifampicin significantly reduces efficacy of hormonal methods'
      },
      { id: 'anticonvulsants', label: 'On enzyme-inducing anticonvulsants? (Carbamazepine, Phenytoin, Phenobarbitone, Primidone, Topiramate)', type: 'yesno', condition: 'anticonvulsants_cyp3a4' },
    ]
  },
]

export default function MECScreener() {
  const navigate = useNavigate()
  const { session, updateSession, setSession } = useSession()
  const [currentModule, setCurrentModule] = useState(0)
  const [answers, setAnswers] = useState(session.conditionDetails || {})

  // Derive auto-conditions from vitals
  const autoConditions = deriveConditionsFromVitals(
    {
      bmi: session.vitals.bmi,
      bp_systolic: parseFloat(session.vitals.bp_systolic),
      bp_diastolic: parseFloat(session.vitals.bp_diastolic),
    },
    {
      age: parseInt(session.client.age),
      smoker: answers['smoker'] === true,
    }
  )

  const buildConditions = () => {
    const conditions = [...autoConditions]
    Object.entries(answers).forEach(([key, value]) => {
      if (value === true) {
        // Find matching condition
        MODULES.forEach(mod => {
          mod.questions.forEach(q => {
            if (q.id === key && q.condition) conditions.push(q.condition)
          })
        })
      } else if (typeof value === 'string' && value !== '') {
        // Handle migraine age-dependent
        if (key === 'migraine') {
          if (value === 'migraine_with_aura') {
            conditions.push('migraine_with_aura')
          } else if (value === 'migraine_no_aura') {
            const age = parseInt(session.client.age)
            conditions.push(age >= 35 ? 'migraine_no_aura_gte35' : 'migraine_no_aura_lt35')
          }
        } else if (value && !['', 'smoker_flag'].includes(value)) {
          conditions.push(value)
        }
      }
    })
    // Smoker age logic
    if (answers['smoker'] === true) {
      const age = parseInt(session.client.age)
      conditions.push(age >= 35 ? 'smoker_gte35' : 'smoker_lt35')
    }
    return [...new Set(conditions)]
  }

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentModule < MODULES.length - 1) {
      setCurrentModule(prev => prev + 1)
      window.scrollTo(0, 0)
    } else {
      const conditions = buildConditions()
      // Use setSession directly to ensure atomic update
      setSession(prev => ({
        ...prev,
        conditions: conditions,
        conditionDetails: answers,
      }))
      navigate('/session/methods')
    }
  }

  const module = MODULES[currentModule]
  const isLast = currentModule === MODULES.length - 1

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">🩺 Medical Screening</h2>
        <p className="text-gray-500 text-sm mt-1">
          Stage 3 of 6 — BCS+ Screener | <strong>{session.client.first_name} {session.client.last_name}</strong>
        </p>
      </div>

      {/* Module Progress */}
      <div className="flex gap-1 mb-5">
        {MODULES.map((m, i) => (
          <div key={m.id} className={`flex-1 h-2 rounded-full transition-colors
            ${i < currentModule ? 'bg-green-400' : i === currentModule ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Auto-detected banner */}
      {autoConditions.length > 0 && currentModule === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0"/>
          <div>
            <p className="text-blue-700 text-sm font-medium">Auto-detected from vitals:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {autoConditions.map(c => (
                <span key={c} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{c.replace(/_/g,' ')}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Module Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-800">{module.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{module.description}</p>
          <p className="text-xs text-gray-400 mt-1">Module {currentModule + 1} of {MODULES.length}</p>
        </div>

        <div className="space-y-5">
          {module.questions.map(q => (
            <div key={q.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{q.label}</label>

              {q.note && (
                <div className="flex items-center gap-1 mb-2 text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5">
                  <AlertTriangle size={13}/>
                  <span className="text-xs">{q.note}</span>
                </div>
              )}

              {q.type === 'yesno' && (
                <div className="flex gap-3">
                  {[{val: false, label: 'No'}, {val: true, label: 'Yes'}].map(opt => (
                    <button key={String(opt.val)}
                      onClick={() => handleAnswer(q.id, opt.val)}
                      className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition-colors
                        ${answers[q.id] === opt.val
                          ? opt.val ? 'bg-orange-500 border-orange-500 text-white' : 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'select' && (
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  value={answers[q.id] || ''}
                  onChange={e => handleAnswer(q.id, e.target.value)}
                >
                  {q.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}

              {/* Highlight if flagged */}
              {(answers[q.id] === true || (typeof answers[q.id] === 'string' && answers[q.id] !== '')) && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={11}/> Condition flagged — will affect method eligibility
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => currentModule === 0 ? navigate('/session/pre-choice') : setCurrentModule(prev => prev - 1)}
          className="flex items-center gap-1 px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium">
          <ChevronLeft size={16}/> Back
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow transition-colors">
          {isLast ? 'Calculate Eligibility' : 'Next Module'} <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  )
}