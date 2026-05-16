import { useState, useEffect } from 'react'
import { Heart, ChevronDown, ChevronUp, Trash2, X, Check, TrendingUp, Plus, AlertTriangle } from 'lucide-react'

// ── STORAGE ────────────────────────────────────────────────────────────────────
const K = { cycles:'nova_cycles', symptoms:'nova_symptoms_log', sexLog:'nova_sex_log', fpMethod:'nova_fp_method' }
const load = (key, fb) => { try { return JSON.parse(localStorage.getItem(key)||'null') ?? fb } catch { return fb } }
const persist = (key, val) => localStorage.setItem(key, JSON.stringify(val))

// ── TIMEZONE-SAFE DATE HELPERS (all dates as YYYY-MM-DD strings) ──────────────
const todayStr = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}` }
const addDays = (str, n) => { const d = new Date(str+'T12:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10) }
const diffDays = (a, b) => Math.round((new Date(b+'T12:00:00') - new Date(a+'T12:00:00')) / 86400000)
const fmtShort = (str) => { if (!str) return '—'; const [y,m,d]=str.slice(0,10).split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}) }
const fmtLong  = (str) => { if (!str) return '—'; const [y,m,d]=str.slice(0,10).split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-KE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) }
const daysUntil = (str) => { if (!str) return null; return diffDays(todayStr(), str) }
// Build YYYY-MM-DD for any y/m(0-idx)/d
const ymd = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

// ── CYCLE ENGINE ───────────────────────────────────────────────────────────────
const getPhase = (day, len=28) => {
  const ov = len - 14
  if (day >= 1 && day <= 5)              return { id:'menstrual',  emoji:'🔴', color:'#b91c1c', en:'Menstrual',      sw:'Hedhi',            desc:{ en:'Your period. Uterine lining sheds. Rest well and stay hydrated.', sw:'Hedhi yako. Pumzika vizuri na kunywa maji.' } }
  if (day > 5 && day < ov-4)            return { id:'follicular', emoji:'🌱', color:'#15803d', en:'Follicular',     sw:'Follicular',       desc:{ en:'Energy rising. Low fertility. Good time for new plans.', sw:'Nguvu zinaongezeka. Uzazi wa chini. Wakati mzuri wa mipango mipya.' } }
  if (day >= ov-4 && day < ov)          return { id:'fertile',    emoji:'🟠', color:'#c2410c', en:'Fertile Window', sw:'Dirisha la Uzazi', desc:{ en:'HIGH fertility — approaching ovulation. Use your FP method every time.', sw:'UZAZI WA JUU — karibu na ovulation. Tumia njia yako ya FP kila wakati.' } }
  if (day === ov)                        return { id:'ovulation',  emoji:'⭐', color:'#b45309', en:'Ovulation Day',  sw:'Siku ya Ovulation', desc:{ en:'PEAK fertility. Egg released today. Highest pregnancy chance this cycle.', sw:'UZAZI WA KILELE. Yai limetolewa leo. Uwezekano mkubwa wa ujauzito.' } }
  if (day > ov && day <= ov+2)          return { id:'post_ov',   emoji:'🟡', color:'#a16207', en:'Post-Ovulation',  sw:'Baada ya Ovulation',desc:{ en:'Fertility dropping rapidly. Egg has 12-24 hours only.', sw:'Uzazi unashuka haraka. Yai lina masaa 12-24 tu.' } }
  if (day > ov+2 && day < len-3)        return { id:'luteal',     emoji:'🌙', color:'#6d28d9', en:'Luteal',         sw:'Luteal',           desc:{ en:'Post-ovulation phase. Fertility low. PMS may appear near end.', sw:'Awamu ya baada ya ovulation. Uzazi wa chini. PMS inaweza kutokea mwishoni.' } }
  return                                        { id:'pre_period', emoji:'🩷', color:'#be185d', en:'Pre-Period',     sw:'Kabla ya Hedhi',   desc:{ en:'Period expected soon. PMS common. Fertility very low.', sw:'Hedhi inatarajiwa hivi karibuni. PMS ni ya kawaida. Uzazi wa chini sana.' } }
}

const getPregnancyChance = (day, len=28) => {
  const ov = len - 14
  const dist = Math.abs(day - ov)
  if (day < 1 || day > len) return { pct: 0, level: 'NONE', color: '#9ca3af' }
  if (dist === 0)   return { pct: 95, level: 'PEAK',    color: '#dc2626', label_en: 'Peak — ovulation day',       label_sw: 'Kilele — siku ya ovulation' }
  if (dist === 1)   return { pct: 80, level: 'HIGH',    color: '#ea580c', label_en: 'High',                       label_sw: 'Juu' }
  if (dist <= 3)    return { pct: 40, level: 'MEDIUM',  color: '#d97706', label_en: 'Medium — fertile window',    label_sw: 'Ya kati — dirisha la uzazi' }
  if (dist <= 5)    return { pct: 12, level: 'LOW',     color: '#65a30d', label_en: 'Low',                        label_sw: 'Chini' }
  if (day <= 5)     return { pct: 3,  level: 'VERY LOW',color: '#16a34a', label_en: 'Very low (period)',          label_sw: 'Chini sana (hedhi)' }
  return                   { pct: 2,  level: 'VERY LOW',color: '#16a34a', label_en: 'Very low',                   label_sw: 'Chini sana' }
}

// ── FP METHODS ────────────────────────────────────────────────────────────────
const FP_METHODS = [
  { id:'dmpa_sc', label:'DMPA-SC (Sayana Press)', days:91,    grace:28 },
  { id:'dmpa_im', label:'DMPA-IM (Depo)',          days:84,    grace:28 },
  { id:'net_en',  label:'NET-EN (Noristerat)',      days:56,    grace:14 },
  { id:'implant', label:'Implant (Implanon/3yr)',   days:1095,  grace:30 },
  { id:'jadelle', label:'Jadelle (5yr)',             days:1825,  grace:30 },
  { id:'cu_iud',  label:'Copper IUD (10yr)',         days:3650,  grace:30 },
  { id:'lng_ius', label:'LNG-IUS (Mirena)',           days:1825,  grace:30 },
  { id:'coc',     label:'Combined Pill (COC)',        days:28,    grace:0  },
  { id:'pop',     label:'Mini Pill (POP)',            days:28,    grace:0  },
  { id:'condom',  label:'Condom only',                days:null,  grace:0  },
  { id:'none',    label:'No method currently',        days:null,  grace:0  },
]

// ── SYMPTOMS ──────────────────────────────────────────────────────────────────
const SYMS_EN = {
  flow:  ['Spotting','Light','Medium','Heavy','Very Heavy'],
  pain:  ['None','Mild cramps','Moderate cramps','Severe cramps','Back pain','Headache'],
  mood:  ['Happy','Calm','Irritable','Anxious','Sad','Energetic','Very tired'],
  body:  ['Bloating','Breast tenderness','Acne','Nausea','Fatigue','Appetite changes'],
  other: ['Good sleep','Poor sleep','Exercise done','Sick','Stressed'],
}
const SYMS_SW = {
  flow:  ['Madoa','Kidogo','Wastani','Nyingi','Nyingi Sana'],
  pain:  ['Hakuna','Maumivu madogo','Ya wastani','Makali','Mgongo','Kichwa'],
  mood:  ['Furaha','Utulivu','Hasira','Wasiwasi','Huzuni','Na nguvu','Uchovu mkubwa'],
  body:  ['Kuvimba','Maumivu ya matiti','Chunusi','Kichefuchefu','Uchovu','Hamu ya kula'],
  other: ['Usingizi mzuri','Usingizi mbaya','Mazoezi','Mgonjwa','Msongo'],
}

// ── FAQ DATA ──────────────────────────────────────────────────────────────────
const FAQS_EN = [
  { cat: 'Basics', q: 'What is Day 1 of my cycle?', a: 'Day 1 is the FIRST day of actual bleeding — not spotting. Count from Day 1 every cycle regardless of when your last cycle was. The calendar marks this as D1 in red.' },
  { cat: 'Basics', q: 'What is a normal cycle length?', a: 'Normal cycles range from 21 to 35 days. The "28-day cycle" is just an average — most women vary. Track 3+ cycles to find your pattern. Under 21 or over 35 days regularly? Discuss with a provider.' },
  { cat: 'Basics', q: 'What is the difference between spotting and a period?', a: 'Spotting is light, irregular bleeding — usually just a few spots — that occurs OUTSIDE your regular period. It does NOT count as Day 1. A true period is heavier and lasts 2-7 days. Spotting can be caused by ovulation, contraception, or hormonal changes.' },
  { cat: 'Basics', q: 'How long does a normal period last?', a: 'Normal periods last 2 to 7 days. Flow is usually heaviest in the first 2 days then lightens. More than 7 days, or soaking a pad every hour for 2+ consecutive hours, means you should see a provider.' },
  { cat: 'Fertility', q: 'When am I most likely to get pregnant?', a: 'Ovulation happens ~14 days BEFORE your next period. Your fertile window is 5 days before ovulation plus ovulation day itself (6 days total). Sperm survives 5 days; eggs survive 12-24 hours. The calendar shows this as orange/yellow days.' },
  { cat: 'Fertility', q: 'What are "safe days"?', a: 'Safe days are days with very low pregnancy chance — typically the days right after your period ends and the 1-2 weeks before your next period is due. BUT: no day is 100% safe without contraception, especially with irregular cycles. The calendar shows safe days in green.' },
  { cat: 'Fertility', q: 'Can I get pregnant during my period?', a: 'Unlikely but possible — especially with short cycles (21-24 days) or long periods (7+ days). Sperm can survive 5 days. The calendar shows probability percentages when you tap any day.' },
  { cat: 'Fertility', q: 'What does ovulation feel like?', a: 'Many women notice: mild one-sided cramping (Mittelschmerz), clear stretchy mucus like raw egg white, slight bloating, increased libido, and a tiny rise in body temperature. Not everyone feels ovulation. Tracking your mucus and temperature gives you the clearest signs — log them in the Symptoms tab.' },
  { cat: 'Irregular', q: 'My period came earlier than expected — what does this mean?', a: 'Early periods (before Day 21) can be caused by stress, illness, weight changes, intense exercise, or hormonal changes. If it happens repeatedly, discuss with a provider. Log it immediately — the tracker will update your average cycle length and recalculate predictions.' },
  { cat: 'Irregular', q: 'My period is late — should I worry?', a: 'Periods up to 7 days late are usually normal variation. Stress, illness, travel, or contraception changes are common causes. If you had unprotected sex and your period is late — take a pregnancy test. If consistently irregular (varying by more than 7 days), see a provider.' },
  { cat: 'Irregular', q: 'How do I know if my periods are regular or irregular?', a: 'Track at least 3 cycles. The Insights tab shows your cycle lengths as a chart — if they vary by more than 7 days between cycles, that is considered irregular. The tracker calculates your average and shows the range (shortest to longest).' },
  { cat: 'Irregular', q: 'What causes irregular periods?', a: 'Common causes: stress, significant weight change, intense exercise, PCOS (polycystic ovary syndrome), thyroid problems, hormonal contraception, breastfeeding, or perimenopause. Track your cycles and share with a provider if irregular for 3+ months.' },
  { cat: 'Irregular', q: 'Can stress delay my period?', a: 'Yes — stress is one of the most common causes of a late period. High stress increases cortisol which can delay ovulation and push your period back. If you are going through a stressful time, expect variability. Log it and the tracker will adapt its predictions over time.' },
  { cat: 'Methods', q: 'Calendar Method (Rhythm Method)', a: 'Count your last 6-12 cycles. Subtract 18 from your shortest cycle (start of fertile window) and subtract 11 from your longest cycle (end of fertile window). Only reliable if cycles are very regular (within 2-3 days each month). The Nova calendar automates this calculation for you based on your logged history.' },
  { cat: 'Methods', q: 'Cervical Mucus Method (CMM / Billings Method)', a: 'Track your vaginal discharge daily: Dry or sticky = low fertility. Creamy/white = fertility increasing. Clear, wet, stretchy like raw egg white = PEAK fertility (ovulation approaching). Log your mucus observations in the Symptoms → Body section. Most fertile when mucus is like egg white.' },
  { cat: 'Methods', q: 'Basal Body Temperature (BBT) Method', a: 'Take your temperature every morning before getting out of bed at the same time using a special BBT thermometer. After ovulation, temperature rises slightly (0.2-0.5°C) and stays raised. This CONFIRMS ovulation has happened — you are already past peak fertility by then. Combine with CMM for the Symptothermal Method.' },
  { cat: 'Methods', q: 'Symptothermal Method', a: 'The MOST effective natural method — combines BBT + cervical mucus + calendar. Start of fertile window: determined by calendar calculation or first sign of fertile-type mucus (whichever comes first). End of fertile window: 3 full days of high temperature AND 4 days past peak mucus. Requires training — ask your provider or see a certified FAM instructor.' },
  { cat: 'Methods', q: 'How accurate are natural methods compared to hormonal methods?', a: 'With perfect use: Symptothermal = 98-99%. Calendar alone = 75-87%. Cervical mucus alone = 76-97%. Compare with: DMPA-SC = 99%+, Implant = 99.9%, COC = 91-99%. Natural methods require daily tracking, consistent practice, and regular cycles. They do NOT protect against STIs/HIV.' },
  { cat: 'FP', q: 'Is it normal to have no period on DMPA-SC?', a: 'Yes — very common and completely safe. Up to 70% of women stop having periods after 1 year on DMPA. Your blood is NOT building up inside. The uterine lining simply does not build up. This is a health benefit for many women. Does NOT mean the method is failing.' },
  { cat: 'FP', q: 'Can I track my cycle on the implant or IUD?', a: 'Yes! Log your implant/IUD insertion date as Day 1. The FP tab will track your return date. With implant and IUD, your periods may become irregular or stop — this is normal. Log whatever you experience. The tracker will note your FP method and adjust accordingly.' },
  { cat: 'FP', q: 'When can I start tracking again after stopping DMPA?', a: 'After stopping DMPA, it can take 6-18 months for regular periods to return. Start logging again from your very first period after stopping. Your early cycles may be irregular — this is normal. The tracker will start building predictions once you have 2+ logged cycles.' },
]

const FAQS_SW = [
  { cat: 'Misingi', q: 'Siku ya 1 ya mzunguko wangu ni nini?', a: 'Siku 1 ni SIKU YA KWANZA ya kutokwa damu halisi — si madoa. Hesabu kutoka Siku 1 kila mzunguko. Kalenda inaonyesha hii kama D1 kwa rangi nyekundu.' },
  { cat: 'Misingi', q: 'Urefu wa kawaida wa mzunguko ni nini?', a: 'Mzunguko wa kawaida ni siku 21 hadi 35. Mzunguko wa siku 28 ni wastani tu. Fuatilia mzunguko 3+ kupata mfumo WAKO. Chini ya siku 21 au zaidi ya siku 35 mara kwa mara? Zungumza na mtoa huduma.' },
  { cat: 'Uzazi', q: 'Ni lini uwezekano wa kupata ujauzito ni mkubwa zaidi?', a: 'Ovulation hutokea takriban siku 14 KABLA ya hedhi yako ijayo. Dirisha lako la uzazi ni siku 5 kabla ya ovulation pamoja na siku ya ovulation yenyewe. Kalenda inaonyesha siku hizi kwa rangi ya machungwa/njano.' },
  { cat: 'Uzazi', q: '"Siku salama" ni zipi?', a: 'Siku salama ni siku zenye uwezekano mdogo wa ujauzito — kawaida siku baada ya hedhi yako kuisha na wiki 1-2 kabla ya hedhi yako ijayo. LAKINI: hakuna siku salama kabisa bila uzazi wa mpango, hasa na mzunguko usio wa kawaida.' },
  { cat: 'Usio wa Kawaida', q: 'Hedhi yangu ilikuja mapema — inamaanisha nini?', a: 'Hedhi za mapema (kabla ya Siku 21) zinaweza kusababishwa na msongo wa mawazo, ugonjwa, mabadiliko ya uzito, mazoezi makali, au mabadiliko ya homoni. Ikiwa inatokea mara kwa mara, zungumza na mtoa huduma. Irekodi mara moja — mfumo utasasisha wastani wako na kuhesabu upya utabiri.' },
  { cat: 'Usio wa Kawaida', q: 'Hedhi yangu imechelewa — niwe na wasiwasi?', a: 'Hedhi zilizochelewa hadi siku 7 ni kawaida. Msongo, ugonjwa, safari, au mabadiliko ya uzazi wa mpango ni sababu za kawaida. Ikiwa ulikuwa na ngono bila kinga na hedhi imechelewa — fanya mtihani wa ujauzito.' },
  { cat: 'Njia', q: 'Njia ya Kalenda (Rhythm Method)', a: 'Hesabu mzunguko wako wa mwisho 6-12. Toa 18 kutoka mzunguko wako mfupi zaidi (mwanzo wa dirisha la uzazi) na toa 11 kutoka mzunguko wako mrefu zaidi (mwisho wa dirisha la uzazi). Inafanya kazi tu ikiwa mzunguko wako ni wa kawaida sana. Nova kalenda inafanya hesabu hii moja kwa moja.' },
  { cat: 'Njia', q: 'Njia ya Kamasi ya Seviksi (CMM / Billings)', a: 'Fuatilia utokaji wako wa ukeni kila siku: Kavu au nzito = uzazi wa chini. Nyeupe/cream = uzazi unaongezeka. Wazi, yenye unyevu, inayonyoosheka kama nyeupe mbichi ya yai = KILELE cha uzazi. Rekodi uchunguzi wako wa kamasi katika sehemu ya Dalili.' },
  { cat: 'Njia', q: 'Njia ya Joto la Mwili la Msingi (BBT)', a: 'Pima joto lako kila asubuhi kabla ya kutoka kitandani kwa wakati mmoja. Baada ya ovulation, joto huinuka kidogo (0.2-0.5°C) na kukaa juu. Hii INATHIBITISHA ovulation imetokea. Unganisha na CMM kwa Njia ya Symptothermal.' },
  { cat: 'Njia', q: 'Njia ya Symptothermal', a: 'Njia bora zaidi ya asili — inachanganya BBT + kamasi ya seviksi + kalenda. Mwanzo wa dirisha la uzazi: Hesabu ya kalenda au ishara ya kwanza ya kamasi ya kuzaa (yoyote inayokuja kwanza). Mwisho wa dirisha la uzazi: Siku 3 kamili za joto juu NA siku 4 baada ya kamasi ya kilele. Inahitaji mafunzo.' },
  { cat: 'FP', q: 'Je, ni kawaida kutokuwa na hedhi kwenye DMPA-SC?', a: 'Ndiyo — kawaida sana na salama kabisa. Hadi 70% ya wanawake huacha kupata hedhi baada ya mwaka 1 wa DMPA. Damu HAIKUSANYIKI ndani. Hii ni faida ya kiafya kwa wanawake wengi.' },
]


// ── FAQ MODAL ─────────────────────────────────────────────────────────────────
function FAQModal({ lang, cycleLen, cycleDay, onClose }) {
  const faqs = lang==='sw' ? FAQS_SW : FAQS_EN
  const cats  = [...new Set(faqs.map(f=>f.cat))]
  const [openCat, setOpenCat] = useState(cats[0])
  const [openQ,   setOpenQ]   = useState(null)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[88vh] overflow-hidden flex flex-col"
        onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <p className="font-bold text-gray-800">❓ {lang==='sw'?'Maswali ya Kawaida':'Frequently Asked Questions'}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500"/>
          </button>
        </div>
        {/* Category tabs */}
        <div className="overflow-x-auto flex-shrink-0 px-4 py-2 border-b border-gray-100">
          <div className="flex gap-2 min-w-max">
            {cats.map(cat => (
              <button key={cat} onClick={() => { setOpenCat(cat); setOpenQ(null) }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap
                  ${openCat===cat ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                style={openCat===cat ? {background:'linear-gradient(135deg,#ec4899,#f59e0b)'} : {}}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        {/* FAQ list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {/* Calendar tip for fertility methods */}
          {(openCat==='Methods' || openCat==='Njia') && (
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 mb-3">
              <p className="text-xs text-pink-700 font-medium">
                💡 {lang==='sw'
                  ? `Kalenda yako inaonyesha dirisha lako la uzazi kwa rangi ya machungwa na siku ya ovulation kwa njano. Utabiri unategemea urefu wako wa wastani wa mzunguko wa siku ${cycleLen}.`
                  : `Your calendar shows your fertile window in orange and ovulation day in yellow based on your ${cycleLen}-day average cycle. Log your cervical mucus in Symptoms → Body to practice CMM alongside the calendar.`}
              </p>
            </div>
          )}
          {(openCat==='Irregular' || openCat==='Usio wa Kawaida') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
              <p className="text-xs text-amber-700 font-medium">
                📊 {lang==='sw'
                  ? 'Angalia kichupo cha Mwanga ili kuona mwongozo wa mzunguko wako — inaonyesha ikiwa hedhi yako ni ya kawaida au la kulingana na historia yako.'
                  : 'Check the Insights tab to see your cycle regularity chart — it shows whether your periods are regular or irregular based on your logged history.'}
              </p>
            </div>
          )}
          {faqs.filter(f=>f.cat===openCat).map((faq,i) => (
            <div key={i} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
              <button className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpenQ(openQ===i?null:i)}>
                <p className="text-sm font-medium text-gray-700 pr-3 leading-snug">{faq.q}</p>
                {openQ===i ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0"/> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0"/>}
              </button>
              {openQ===i && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── HISTORY IMPORT MODAL ──────────────────────────────────────────────────────
function ImportModal({ lang, onImport, onClose }) {
  const [rows, setRows] = useState([{ start:'', end:'' },{ start:'', end:'' },{ start:'', end:'' }])
  const addRow = () => setRows(p => [...p, { start:'', end:'' }])
  const removeRow = (i) => setRows(p => p.filter((_,j)=>j!==i))
  const setRow = (i, field, val) => setRows(p => p.map((r,j) => j===i ? {...r,[field]:val} : r))

  const handleImport = () => {
    const valid = rows.filter(r => r.start && r.start.length===10)
    if (valid.length < 1) return
    onImport(valid.sort((a,b) => b.start.localeCompare(a.start)))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-800">📅 {lang==='sw'?'Ingiza Historia ya Hedhi':'Import Period History'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{lang==='sw'?'Ingiza tarehe 3+ za hedhi zilizopita kwa utabiri bora':'Enter 3+ past period dates for better predictions'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500"/>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-700">
              💡 {lang==='sw'
                ? 'Una programu nyingine? Ingiza tarehe ya mwanzo wa hedhi kwa kila mwezi. Kadri unavyoingiza tarehe nyingi zaidi, ndivyo utabiri unavyokuwa sahihi zaidi.'
                : 'Using another app? Just enter the start date of each period. The more months you add, the more accurate your predictions will be.'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
              <span>{lang==='sw'?'Ilianza (Siku 1)':'Started (Day 1)'}</span>
              <span>{lang==='sw'?'Iliisha (si lazima)':'Ended (optional)'}</span>
            </div>
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input type="date"
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    value={row.start} onChange={e => setRow(i,'start',e.target.value)}/>
                  <input type="date"
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    value={row.end} onChange={e => setRow(i,'end',e.target.value)}/>
                </div>
                {rows.length > 1 && (
                  <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                    <X size={14}/>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addRow}
            className="w-full border-2 border-dashed border-pink-300 text-pink-500 text-sm font-semibold py-2.5 rounded-xl hover:bg-pink-50 flex items-center justify-center gap-2">
            <Plus size={14}/> {lang==='sw'?'Ongeza Mwezi Mwingine':'Add Another Month'}
          </button>

          <button onClick={handleImport}
            disabled={!rows.some(r=>r.start)}
            className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300"
            style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
            <Check size={16} className="inline mr-1"/>
            {lang==='sw'?'Ingiza Historia':'Import History'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ── CALENDAR COMPONENT ────────────────────────────────────────────────────────
// KEY FIX: All date comparisons use YYYY-MM-DD strings to avoid timezone bugs
function CycleCalendar({ cycles, cycleLen, sexLog, lang, onDayTap }) {
  const [viewYM, setViewYM] = useState(() => {
    const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }
  })
  const { y, m } = viewYM
  const daysInMonth = new Date(y, m+1, 0).getDate()
  const firstDay    = new Date(y, m, 1).getDay()
  const todayS      = todayStr()
  const monthName   = new Date(y, m, 1).toLocaleDateString('en-KE',{month:'long',year:'numeric'})

  // ── Build sets of YYYY-MM-DD strings for each day type ──
  // Period days (actual logged)
  const periodSet = new Set()
  cycles.forEach(c => {
    const end = c.end || addDays(c.start, 4)
    let cur = c.start
    while (cur <= end) {
      periodSet.add(cur)
      cur = addDays(cur, 1)
    }
  })

  // Predict future cycles based on average
  const avgLen = (() => {
    if (cycles.length < 2) return cycleLen
    const lens = []
    for (let i=0; i<cycles.length-1; i++) {
      const l = diffDays(cycles[i+1].start, cycles[i].start)
      if (l>15 && l<60) lens.push(l)
    }
    return lens.length ? Math.round(lens.reduce((a,b)=>a+b,0)/lens.length) : cycleLen
  })()

  // Generate predicted days for next 3 cycles
  const predictedPeriodSet = new Set()
  const fertileSet   = new Set()
  const ovulationSet = new Set()
  const postOvSet    = new Set()
  const safeSet      = new Set()
  const prePeriodSet = new Set()

  const last = cycles[0]
  if (last) {
    // Build phase sets for current + next 2 cycles
    for (let cycleOffset = 0; cycleOffset < 3; cycleOffset++) {
      const cycleStart = addDays(last.start, avgLen * cycleOffset)
      for (let d=1; d<=avgLen; d++) {
        const dateS = addDays(cycleStart, d-1)
        // Only colour days not already in periodSet
        if (!periodSet.has(dateS)) {
          const phase = getPhase(d, avgLen)
          if (phase.id === 'menstrual' && cycleOffset > 0) predictedPeriodSet.add(dateS)
          else if (phase.id === 'fertile')    fertileSet.add(dateS)
          else if (phase.id === 'ovulation')  ovulationSet.add(dateS)
          else if (phase.id === 'post_ov')    postOvSet.add(dateS)
          else if (phase.id === 'pre_period') prePeriodSet.add(dateS)
          else if (phase.id === 'luteal' || phase.id === 'follicular') safeSet.add(dateS)
        }
      }
    }
  }

  // Sex log for this month
  const sexSet = new Set(
    (sexLog||[])
      .filter(s => s.date && s.date.slice(0,7) === ymd(y,m,1).slice(0,7))
      .map(s => s.date.slice(0,10))
  )

  // Day 1 markers
  const day1Set = new Set(cycles.map(c => c.start.slice(0,10)))

  // ── Color scheme — filled circles, clearly visible ──
  const getDayStyle = (dateS) => {
    if (periodSet.has(dateS))          return { bg:'#dc2626', text:'#ffffff', ring:false } // Solid red
    if (ovulationSet.has(dateS))       return { bg:'#f59e0b', text:'#ffffff', ring:false } // Solid amber
    if (fertileSet.has(dateS))         return { bg:'#fb923c', text:'#ffffff', ring:false } // Solid orange
    if (postOvSet.has(dateS))          return { bg:'#fbbf24', text:'#ffffff', ring:false } // Solid yellow
    if (safeSet.has(dateS))            return { bg:'#4ade80', text:'#166534', ring:false } // Solid green
    if (prePeriodSet.has(dateS))       return { bg:'#f9a8d4', text:'#831843', ring:false } // Soft pink
    if (predictedPeriodSet.has(dateS)) return { bg:'#fecdd3', text:'#be123c', ring:true  } // Light red dashed
    return                                    { bg:'transparent', text:'#374151', ring:false }
  }

  const prevMonth = () => setViewYM(p => p.m===0 ? {y:p.y-1,m:11} : {y:p.y,m:p.m-1})
  const nextMonth = () => setViewYM(p => p.m===11 ? {y:p.y+1,m:0} : {y:p.y,m:p.m+1})
  const dayLetters = ['S','M','T','W','T','F','S']

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg hover:bg-gray-100">‹</button>
        <p className="font-bold text-gray-800 text-sm">{monthName}</p>
        <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg hover:bg-gray-100">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {dayLetters.map((d,i) => <div key={i} className="text-center text-xs text-gray-400 font-bold pb-1">{d}</div>)}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 px-2 pb-2">
        {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`} style={{minHeight:'38px'}}/>)}
        {Array.from({length:daysInMonth}).map((_,i) => {
          const day   = i+1
          const dateS = ymd(y, m, day)
          const style = getDayStyle(dateS)
          const isToday  = dateS === todayS
          const isDay1   = day1Set.has(dateS)
          const hasSex   = sexSet.has(dateS)
          const isProtectedSex = (sexLog||[]).find(s => s.date?.slice(0,10)===dateS)?.protected

          return (
            <button key={day}
              onClick={() => onDayTap && onDayTap(dateS)}
              className="flex flex-col items-center justify-start py-0.5"
              style={{minHeight:'38px'}}>
              {/* D1 badge */}
              {isDay1 && <span className="text-[9px] font-black text-red-600 leading-none mb-0.5">D1</span>}
              {/* Day circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${isToday ? 'ring-2 ring-teal-500 ring-offset-1' : ''}
                ${style.ring ? 'border-2 border-dashed border-rose-400' : ''}`}
                style={{ background: style.bg, color: style.text }}>
                {day}
              </div>
              {/* Sex dot */}
              {hasSex && (
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isProtectedSex ? 'bg-purple-400' : 'bg-red-400'}`}/>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="px-3 pb-4 pt-1 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{lang==='sw'?'Ufunguo:':'Legend:'}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            { bg:'#dc2626', text:'#fff', label: lang==='sw'?'Hedhi (iliyorekodiwa)':'Period (logged)' },
            { bg:'#f59e0b', text:'#fff', label: lang==='sw'?'Siku ya Ovulation':'Ovulation Day ⭐' },
            { bg:'#fb923c', text:'#fff', label: lang==='sw'?'Dirisha la Uzazi (uzazi wa juu)':'Fertile Window 🟠' },
            { bg:'#4ade80', text:'#166534', label: lang==='sw'?'Siku Salama':'Safe Days 🟢' },
            { bg:'#fecdd3', text:'#be123c', label: lang==='sw'?'Hedhi Inayotarajiwa':'Predicted Period' },
            { bg:'#f9a8d4', text:'#831843', label: lang==='sw'?'Karibu na Hedhi':'Pre-Period 🩷' },
          ].map((item,i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex-shrink-0" style={{background:item.bg}}/>
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex-shrink-0 bg-purple-400"/>
            <span className="text-xs text-gray-600">{lang==='sw'?'Ngono (na kinga)':'Sex (protected)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex-shrink-0 bg-red-400"/>
            <span className="text-xs text-gray-600">{lang==='sw'?'Ngono (bila kinga)':'Sex (unprotected)'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}


// ── REGULARITY CHART ──────────────────────────────────────────────────────────
function RegularityChart({ cycles, lang }) {
  if (cycles.length < 2) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
      <p className="text-sm text-amber-700">{lang==='sw'?'Ingiza hedhi angalau 2 kuona mwongozo.':'Log at least 2 periods to see regularity chart.'}</p>
    </div>
  )

  const lens = []
  for (let i=0; i<cycles.length-1; i++) {
    const l = diffDays(cycles[i+1].start, cycles[i].start)
    if (l>14 && l<70) lens.push({ len:l, start:cycles[i+1].start })
  }
  if (lens.length < 1) return null

  const avg = Math.round(lens.reduce((a,b)=>a+b.len,0)/lens.length)
  const minL = Math.min(...lens.map(l=>l.len))
  const maxL = Math.max(...lens.map(l=>l.len))
  const isRegular = maxL - minL <= 7
  const chartMax = Math.max(maxL + 3, 35)
  const chartMin = Math.max(minL - 3, 14)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-sm">
          📊 {lang==='sw'?'Ukawaida wa Mzunguko':'Cycle Regularity'}
        </h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isRegular ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {isRegular ? (lang==='sw'?'✅ Wa kawaida':'✅ Regular') : (lang==='sw'?'⚠️ Usio wa kawaida':'⚠️ Irregular')}
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-24 mb-3">
        {/* Y axis labels */}
        <div className="flex flex-col justify-between h-full text-right mr-1">
          <span className="text-xs text-gray-400">{chartMax}d</span>
          <span className="text-xs text-gray-400">{Math.round((chartMax+chartMin)/2)}d</span>
          <span className="text-xs text-gray-400">{chartMin}d</span>
        </div>
        {/* Bars */}
        {lens.slice(-10).map((item,i) => {
          const pct = ((item.len - chartMin) / (chartMax - chartMin)) * 100
          const isOff = Math.abs(item.len - avg) > 3
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
              <span className="text-xs text-gray-500 mb-1 font-medium">{item.len}</span>
              <div className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${Math.max(8, pct)}%`,
                  background: isOff ? '#f97316' : '#ec4899',
                  minHeight: '8px'
                }}/>
            </div>
          )
        })}
      </div>

      {/* Avg line label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-0.5 bg-teal-500"/>
        <span className="text-xs text-gray-500">{lang==='sw'?`Wastani: siku ${avg}`:`Average: ${avg} days`}</span>
        <span className="text-xs text-gray-400">({lang==='sw'?'Mwendo':'Range'}: {minL}–{maxL})</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: lang==='sw'?'Wastani':'Average', value: `${avg}d`, color: '#ec4899' },
          { label: lang==='sw'?'Mfupi':'Shortest', value: `${minL}d`, color: '#16a34a' },
          { label: lang==='sw'?'Mrefu':'Longest',  value: `${maxL}d`, color: '#dc2626' },
        ].map((s,i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black" style={{color:s.color}}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {!isRegular && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700">
            ⚠️ {lang==='sw'
              ? `Mzunguko wako unatofautiana kwa siku ${maxL-minL}. Hii inafanya utabiri usio wa uhakika na natural FP methods kuwa vigumu. Fikiria kuona mtoa huduma.`
              : `Your cycles vary by ${maxL-minL} days. This makes predictions less reliable and natural FP methods harder to use. Consider discussing with a provider.`}
          </p>
        </div>
      )}
    </div>
  )
}

// ── FP STATUS CARD ────────────────────────────────────────────────────────────
function FPCard({ fp, lang, onEdit }) {
  if (!fp?.onFP || !fp?.methodId || fp.methodId==='none') return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-amber-700">💊 {lang==='sw'?'Njia ya FP':'FP Method'}</p>
        <p className="text-sm text-amber-600">{lang==='sw'?'Bado haijasanidiwa':'Not set up yet'}</p>
      </div>
      <button onClick={onEdit} className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-bold">{lang==='sw'?'Weka':'Set up'}</button>
    </div>
  )
  const method = FP_METHODS.find(m=>m.id===fp.methodId)
  const days   = fp.returnDate ? daysUntil(fp.returnDate) : null
  const overdue = days!==null && days<0
  const urgent  = days!==null && days<=14 && days>=0
  return (
    <div className={`rounded-xl border p-4 ${overdue?'bg-red-50 border-red-300':urgent?'bg-amber-50 border-amber-300':'bg-green-50 border-green-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{color:overdue?'#dc2626':urgent?'#d97706':'#059669'}}>
            💊 {method?.label||fp.methodId}
          </p>
          {fp.returnDate && method?.days && (
            <>
              <p className="text-xs text-gray-600">{lang==='sw'?'Tarehe ya kurudi:':'Return date:'} {fmtShort(fp.returnDate)}</p>
              <p className={`text-sm font-bold mt-1 ${overdue?'text-red-600':urgent?'text-amber-600':'text-green-700'}`}>
                {overdue ? `⚠️ ${Math.abs(days)} ${lang==='sw'?'siku zilizopita':'days overdue'}`
                  : days===0 ? (lang==='sw'?'🔔 Leo ni siku ya kurudi!':'🔔 Return date is today!')
                  : `${days} ${lang==='sw'?'siku zilizobaki':'days remaining'}`}
              </p>
              <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{width:`${Math.min(100,Math.max(0,((method.days-(days||0))/method.days)*100))}%`, background:overdue?'#dc2626':urgent?'#f59e0b':'#14a044'}}/>
              </div>
            </>
          )}
        </div>
        <button onClick={onEdit} className="text-xs text-gray-400 hover:text-gray-600 ml-2">{lang==='sw'?'Hariri':'Edit'}</button>
      </div>
      {(overdue||urgent) && (
        <div className={`mt-2 rounded-lg px-3 py-2 ${overdue?'bg-red-100':'bg-amber-100'}`}>
          <p className={`text-xs font-bold ${overdue?'text-red-700':'text-amber-700'}`}>
            🔔 {overdue?(lang==='sw'?'Umechelewa — tembela kliniki mara moja':'Overdue — please visit your clinic soon'):(lang==='sw'?'Karibu na tarehe ya kurudi — panga ziara':'Return date approaching — plan your visit')}
          </p>
        </div>
      )}
    </div>
  )
}

// ── FP SETUP ──────────────────────────────────────────────────────────────────
function FPSetup({ lang, onSave, current }) {
  const [onFP,     setOnFP]      = useState(current?.onFP ?? null)
  const [methodId, setMethodId]  = useState(current?.methodId||'')
  const [startDate,setStartDate] = useState(current?.startDate||'')
  const method = FP_METHODS.find(m=>m.id===methodId)
  const returnDate = method?.days && startDate ? addDays(startDate, method.days) : null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
      <h3 className="font-bold text-gray-800">💊 {lang==='sw'?'Njia Yangu ya FP':'My FP Method'}</h3>
      <div className="grid grid-cols-2 gap-2">
        {[{val:true,label:lang==='sw'?'✅ Ndiyo':'✅ Yes'},{val:false,label:lang==='sw'?'❌ Hapana':'❌ No'}].map(opt=>(
          <button key={String(opt.val)} onClick={()=>setOnFP(opt.val)}
            className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${onFP===opt.val?'text-white':'border-gray-200 text-gray-600'}`}
            style={onFP===opt.val?{background:'#0d7377'}:{}}>
            {opt.label}
          </button>
        ))}
      </div>
      {onFP===true && (
        <>
          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {FP_METHODS.filter(m=>m.id!=='none').map(m=>(
              <button key={m.id} onClick={()=>setMethodId(m.id)}
                className={`w-full text-left px-3 py-2 rounded-xl border-2 text-sm transition-colors ${methodId===m.id?'text-white':'border-gray-100 text-gray-700 hover:border-gray-300'}`}
                style={methodId===m.id?{background:'#14a044'}:{}}>
                {m.label}
              </button>
            ))}
          </div>
          {methodId && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                {lang==='sw'?'Tarehe ya huduma ya mwisho:':'Date of last service/dose:'}
              </label>
              <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={startDate} onChange={e=>setStartDate(e.target.value)}/>
            </div>
          )}
          {returnDate && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <p className="text-xs font-bold text-teal-700">{lang==='sw'?'Tarehe ya Kurudi:':'Return Date:'}</p>
              <p className="text-sm font-bold text-teal-800 mt-0.5">{fmtLong(returnDate)}</p>
              {daysUntil(returnDate)!==null && <p className="text-xs text-teal-600 mt-1">{daysUntil(returnDate)} {lang==='sw'?'siku zilizobaki':'days remaining'}</p>}
            </div>
          )}
        </>
      )}
      {onFP!==null && (
        <button onClick={()=>onSave({onFP, methodId:onFP?methodId:'none', startDate:onFP?startDate:'', returnDate})}
          disabled={onFP&&(!methodId||!startDate)}
          className="w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300"
          style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
          <Check size={16} className="inline mr-1"/> {lang==='sw'?'Hifadhi':'Save FP Info'}
        </button>
      )}
    </div>
  )
}

// ── DAY DETAIL MODAL ──────────────────────────────────────────────────────────
// Shows phase info + pregnancy chance + log sex + log period start
function DayDetailModal({ dateS, cycleDay, cycleLen, lang, cycles, onSaveSex, onLogPeriodStart, onClose }) {
  const [prot, setProt] = useState(null)
  const [view, setView] = useState('info') // 'info' | 'sex'

  const phase  = cycleDay && cycleDay > 0 ? getPhase(cycleDay, cycleLen) : null
  const chance = cycleDay && cycleDay > 0 ? getPregnancyChance(cycleDay, cycleLen) : null
  const isToday = dateS === todayStr()
  const isPeriodDay = cycles.some(c => {
    const end = c.end || addDays(c.start, 4)
    return dateS >= c.start && dateS <= end
  })

  // Chance bar color
  const chanceBarColor = chance ? (chance.level==='PEAK'||chance.level==='HIGH' ? '#dc2626' : chance.level==='MEDIUM' ? '#f59e0b' : '#16a34a') : '#9ca3af'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-800">{fmtLong(dateS)}</p>
            {cycleDay && cycleDay > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {lang==='sw' ? `Siku ${cycleDay} ya mzunguko` : `Day ${cycleDay} of your cycle`}
                {isToday && <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">{lang==='sw'?'Leo':'Today'}</span>}
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500"/>
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Phase card */}
          {phase ? (
            <div className="rounded-2xl p-4 text-white" style={{background:`linear-gradient(135deg,${phase.color},${phase.color}bb)`}}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{phase.emoji}</span>
                <div>
                  <p className="font-black text-lg">{phase[lang==='sw'?'sw':'en']}</p>
                  <p className="text-xs opacity-80">{lang==='sw'?`Siku ${cycleDay} ya mzunguko`:`Cycle day ${cycleDay}`}</p>
                </div>
              </div>
              <p className="text-sm opacity-90">{phase.desc[lang==='sw'?'sw':'en']}</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-sm text-gray-500">
                {lang==='sw' ? 'Rekodi hedhi yako kwanza kupata mwanga wa awamu.' : 'Log your period first to see phase information.'}
              </p>
              <button onClick={()=>{ onLogPeriodStart(dateS); onClose() }}
                className="mt-2 text-xs text-pink-600 font-bold border border-pink-300 px-3 py-1.5 rounded-lg">
                🔴 {lang==='sw'?'Rekodi kama Siku 1':'Log as Day 1'}
              </button>
            </div>
          )}

          {/* Pregnancy chance */}
          {chance && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                🤰 {lang==='sw'?'Uwezekano wa Ujauzito':'Pregnancy Chance'}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:`${chance.pct}%`, background:chanceBarColor}}/>
                  </div>
                </div>
                <span className="text-xl font-black flex-shrink-0" style={{color:chanceBarColor}}>{chance.pct}%</span>
              </div>
              <p className="text-xs font-bold mt-1.5" style={{color:chanceBarColor}}>
                {chance.level} — {chance[lang==='sw'?'label_sw':'label_en']}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ⚕️ {lang==='sw'?'Hii si mbadala wa dawa ya daktari. Njia ya kalenda peke yake si ya kuaminika.':'This is not medical advice. Calendar method alone is not reliable contraception.'}
              </p>
            </div>
          )}

          {/* Ovulation highlight */}
          {phase?.id === 'ovulation' && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2">
              <span className="text-xl">⭐</span>
              <div>
                <p className="text-sm font-bold text-amber-800">{lang==='sw'?'Siku ya Ovulation!':'Ovulation Day!'}</p>
                <p className="text-xs text-amber-700">{lang==='sw'?'Hii ndiyo siku ya uzazi wa kilele wa mzunguko wako. Yai limetolewa leo. Tumia njia yako ya FP kila wakati.':'This is your peak fertility day this cycle. An egg has been released. Always use your FP method.'}</p>
              </div>
            </div>
          )}

          {phase?.id === 'fertile' && (
            <div className="bg-orange-50 border border-orange-300 rounded-xl p-3 flex items-start gap-2">
              <span className="text-xl">🟠</span>
              <div>
                <p className="text-sm font-bold text-orange-800">{lang==='sw'?'Dirisha la Uzazi wa Juu':'High Fertility Window'}</p>
                <p className="text-xs text-orange-700">{lang==='sw'?'Uko kwenye dirisha la uzazi. Manii inaweza kuishi hadi siku 5. Tumia njia yako ya FP kila wakati.':'You are in the fertile window. Sperm can survive up to 5 days. Use your FP method every time.'}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{lang==='sw'?'Rekodi kwa Siku Hii:':'Log for This Day:'}</p>

            {/* Log period start */}
            {!isPeriodDay && (
              <button onClick={()=>{ onLogPeriodStart(dateS); onClose() }}
                className="w-full flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 hover:bg-red-100 transition-colors">
                <span className="text-xl">🔴</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-red-700">{lang==='sw'?'Rekodi kama Siku 1 ya Hedhi':'Log as Period Day 1'}</p>
                  <p className="text-xs text-red-500">{lang==='sw'?'Hedhi ilianza siku hii':'Period started on this day'}</p>
                </div>
              </button>
            )}

            {/* Log sex */}
            {view === 'info' && (
              <button onClick={()=>setView('sex')}
                className="w-full flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 hover:bg-purple-100 transition-colors">
                <span className="text-xl">💜</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-purple-700">{lang==='sw'?'Rekodi Ngono':'Log Sex Activity'}</p>
                  <p className="text-xs text-purple-500">{lang==='sw'?'Rekodi ngono na kiwango cha ulinzi':'Log sexual activity and protection used'}</p>
                </div>
              </button>
            )}

            {/* Sex form */}
            {view === 'sex' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-purple-700">💜 {lang==='sw'?'Je, ulitumia ulinzi?':'Was protection used?'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {val:true,  label:lang==='sw'?'✅ Ndiyo (kondomu/FP)':'✅ Yes (condom/FP)'},
                    {val:false, label:lang==='sw'?'⚠️ Hapana':'⚠️ No protection'},
                  ].map(opt=>(
                    <button key={String(opt.val)} onClick={()=>setProt(opt.val)}
                      className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-colors ${prot===opt.val?'text-white':'border-gray-200 text-gray-600'}`}
                      style={prot===opt.val?{background:opt.val?'#14a044':'#dc2626'}:{}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {prot===false && chance && (chance.level==='PEAK'||chance.level==='HIGH'||chance.level==='MEDIUM') && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs text-red-700 font-medium">
                      ⚠️ {lang==='sw'
                        ?'Ngono bila kinga kwenye dirisha la uzazi wa juu. Fikiria uzazi wa mpango wa dharura (P2/EC) haraka iwezekanavyo.'
                        :'Unprotected sex during high fertility. Consider emergency contraception (ECP/P2) as soon as possible.'}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={()=>setView('info')} className="flex-1 border border-gray-300 text-gray-600 text-xs font-semibold py-2 rounded-xl">{lang==='sw'?'Rudi':'Back'}</button>
                  <button onClick={()=>{if(prot!==null){onSaveSex({protected:prot});onClose()}}} disabled={prot===null}
                    className="flex-1 text-white text-xs font-bold py-2 rounded-xl disabled:bg-gray-300"
                    style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
                    {lang==='sw'?'Hifadhi':'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function NovaCycleTracker({ lang='en', user }) {
  const [cycles,      setCycles]      = useState(()=>load(K.cycles,[]))
  const [symptomLog,  setSymptomLog]  = useState(()=>load(K.symptoms,[]))
  const [sexLog,      setSexLog]      = useState(()=>load(K.sexLog,[]))
  const [fp,          setFp]          = useState(()=>load(K.fpMethod,null))
  const [section,     setSection]     = useState('overview')
  const [showFAQ,     setShowFAQ]     = useState(false)
  const [showImport,  setShowImport]  = useState(false)
  const [sexModal,    setSexModal]    = useState(null)
  const [logSaved,    setLogSaved]    = useState(false)

  // Log form
  const [startDate,    setStartDate]    = useState('')
  const [endDate,      setEndDate]      = useState('')
  const [selectedSyms, setSelectedSyms] = useState({})
  const [todayNote,    setTodayNote]    = useState('')
  const [cycleLength,  setCycleLength]  = useState(28)

  // Auto-detect cycle length
  useEffect(()=>{
    if (cycles.length>=2) {
      const lens=[]
      for(let i=0;i<Math.min(cycles.length-1,6);i++){
        const l=diffDays(cycles[i+1].start, cycles[i].start)
        if(l>15&&l<60) lens.push(l)
      }
      if(lens.length) setCycleLength(Math.round(lens.reduce((a,b)=>a+b,0)/lens.length))
    }
  },[cycles])

  const last     = cycles[0]
  const today    = todayStr()
  const cycleDay = last ? diffDays(last.start, today)+1 : null
  const phase    = cycleDay ? getPhase(cycleDay, cycleLength) : null
  const chance   = cycleDay ? getPregnancyChance(cycleDay, cycleLength) : null

  // Predicted next
  const predictedNext = (()=>{
    if(!last||cycles.length<2) return null
    const l = diffDays(cycles[1].start, cycles[0].start)
    if(l<15||l>60) return null
    return addDays(last.start, l)
  })()
  const daysToNext = predictedNext ? daysUntil(predictedNext) : null

  const savePeriod = () => {
    if(!startDate) return
    const entry = { id:Date.now(), start:startDate.slice(0,10), end:endDate?endDate.slice(0,10):null, symptoms:Object.values(selectedSyms).flat() }
    const updated = [entry,...cycles].sort((a,b)=>b.start.localeCompare(a.start)).slice(0,48)
    setCycles(updated); persist(K.cycles, updated)
    setStartDate(''); setEndDate(''); setSelectedSyms({})
    setLogSaved(true); setTimeout(()=>setLogSaved(false),2000)
  }

  const importHistory = (rows) => {
    const imported = rows.map(r=>({ id:Date.now()+Math.random(), start:r.start.slice(0,10), end:r.end?r.end.slice(0,10):null, symptoms:[], imported:true }))
    const merged = [...cycles,...imported].sort((a,b)=>b.start.localeCompare(a.start))
    const deduped = merged.filter((c,i,arr)=>arr.findIndex(x=>x.start===c.start)===i).slice(0,48)
    setCycles(deduped); persist(K.cycles, deduped)
  }

  const saveSymptoms = () => {
    const syms = Object.values(selectedSyms).flat()
    if(!syms.length&&!todayNote) return
    const entry = { id:Date.now(), date:today, day:cycleDay, phase:phase?.id, symptoms:syms, note:todayNote }
    const updated = [entry,...symptomLog].slice(0,90)
    setSymptomLog(updated); persist(K.symptoms,updated)
    setSelectedSyms({}); setTodayNote('')
    setLogSaved(true); setTimeout(()=>setLogSaved(false),2000)
  }

  const saveSex = (dateS, data) => {
    const existing = sexLog.filter(s=>s.date!==dateS)
    const updated = [{date:dateS,...data},...existing].slice(0,90)
    setSexLog(updated); persist(K.sexLog,updated)
  }

  const saveFP = (data) => { setFp(data); persist(K.fpMethod,data) }
  const deleteCycle = (id) => { const u=cycles.filter(c=>c.id!==id); setCycles(u); persist(K.cycles,u) }
  const toggleSym = (cat,sym) => setSelectedSyms(p=>{ const c=p[cat]||[]; return{...p,[cat]:c.includes(sym)?c.filter(s=>s!==sym):[...c,sym]} })

  const handleDayTap = (dateS) => {
    const cd = last ? diffDays(last.start, dateS)+1 : null
    setSexModal({ dateS, cycleDay:cd })
  }

  // Log period start from day tap
  const handleLogPeriodStart = (dateS) => {
    const entry = { id:Date.now(), start:dateS, end:null, symptoms:[] }
    const updated = [entry,...cycles].sort((a,b)=>b.start.localeCompare(a.start)).slice(0,48)
    setCycles(updated); persist(K.cycles, updated)
  }

  const symCats = lang==='sw' ? SYMS_SW : SYMS_EN
  const catLabels_en = { flow:'Flow',   pain:'Pain',    mood:'Mood',  body:'Body',  other:'Other' }
  const catLabels_sw = { flow:'Mtiririko',pain:'Maumivu',mood:'Hisia',body:'Mwili',other:'Nyingine' }
  const catColors    = { flow:'#ec4899', pain:'#ef4444', mood:'#8b5cf6', body:'#f59e0b', other:'#14a044' }

  // Compact 2-row tab grid — all visible, no scroll
  const TABS = [
    { key:'overview',  icon:'🏠', en:'Home',     sw:'Nyumbani' },
    { key:'calendar',  icon:'📅', en:'Calendar', sw:'Kalenda'  },
    { key:'log',       icon:'📝', en:'Log',      sw:'Rekodi'   },
    { key:'symptoms',  icon:'💊', en:'Symptoms', sw:'Dalili'   },
    { key:'fp',        icon:'💉', en:'My FP',    sw:'Njia FP'  },
    { key:'insights',  icon:'💡', en:'Insights', sw:'Mwanga'   },
    { key:'history',   icon:'📊', en:'History',  sw:'Historia' },
  ]

  return (
    <div className="space-y-4 pb-20">
      {/* Row 1: 4 tabs */}
      <div className="grid grid-cols-4 gap-1.5">
        {TABS.slice(0,4).map(t=>(
          <button key={t.key} onClick={()=>setSection(t.key)}
            className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${section===t.key?'text-white border-transparent shadow-sm':'bg-white text-gray-500 border-gray-200'}`}
            style={section===t.key?{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}:{}}>
            <span className="text-base leading-tight">{t.icon}</span>
            <span className="text-xs font-bold mt-0.5 leading-tight">{lang==='sw'?t.sw:t.en}</span>
          </button>
        ))}
      </div>
      {/* Row 2: 3 tabs */}
      <div className="grid grid-cols-3 gap-1.5">
        {TABS.slice(4).map(t=>(
          <button key={t.key} onClick={()=>setSection(t.key)}
            className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${section===t.key?'text-white border-transparent shadow-sm':'bg-white text-gray-500 border-gray-200'}`}
            style={section===t.key?{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}:{}}>
            <span className="text-base leading-tight">{t.icon}</span>
            <span className="text-xs font-bold mt-0.5 leading-tight">{lang==='sw'?t.sw:t.en}</span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {section==='overview' && (
        <div className="space-y-4">
          {phase && cycleDay ? (
            <div className="rounded-2xl p-5 text-white shadow-lg" style={{background:`linear-gradient(135deg,${phase.color},${phase.color}bb)`}}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-bold opacity-80 uppercase tracking-wide">{lang==='sw'?'Awamu ya Sasa':'Current Phase'}</p>
                  <p className="text-3xl font-black mt-1">{phase.emoji} {phase[lang==='sw'?'sw':'en']}</p>
                  <p className="text-sm opacity-90 mt-1">{lang==='sw'?`Siku ${cycleDay} (urefu: siku ${cycleLength})`:`Day ${cycleDay} of cycle (length: ${cycleLength}d)`}</p>
                </div>
                {chance && (
                  <div className="text-center bg-white/25 rounded-2xl px-3 py-2 ml-3 flex-shrink-0">
                    <p className="text-2xl font-black">{chance.pct}%</p>
                    <p className="text-xs opacity-80">{lang==='sw'?'Uzazi':'Fertility'}</p>
                    <p className="text-xs font-bold bg-white/20 rounded-full px-2 py-0.5 mt-0.5">{chance.level}</p>
                  </div>
                )}
              </div>
              <p className="text-sm opacity-90 mt-3">{phase.desc[lang==='sw'?'sw':'en']}</p>
            </div>
          ) : (
            <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5 text-center">
              <p className="text-4xl mb-2">🌸</p>
              <p className="font-bold text-pink-700">{lang==='sw'?`Karibu, ${user?.nickname}!`:`Welcome, ${user?.nickname}!`}</p>
              <p className="text-sm text-pink-600 mt-1">{lang==='sw'?'Rekodi tarehe ya mwanzo wa hedhi yako ili kuanza.':'Log your last period start date to begin.'}</p>
              <div className="flex gap-2 mt-3 justify-center">
                <button onClick={()=>setSection('log')} className="text-white text-sm font-bold px-4 py-2.5 rounded-xl" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>+ {lang==='sw'?'Rekodi Hedhi':'Log Period'}</button>
                <button onClick={()=>setShowImport(true)} className="bg-white border border-pink-300 text-pink-600 text-sm font-bold px-4 py-2.5 rounded-xl">📅 {lang==='sw'?'Ingiza Historia':'Import History'}</button>
              </div>
            </div>
          )}
          <FPCard fp={fp} lang={lang} onEdit={()=>setSection('fp')}/>
          {predictedNext && (
            <div className={`rounded-xl border p-4 ${daysToNext!==null&&daysToNext<=3?'bg-red-50 border-red-200':daysToNext!==null&&daysToNext<=7?'bg-amber-50 border-amber-200':'bg-blue-50 border-blue-200'}`}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{color:daysToNext!==null&&daysToNext<=3?'#dc2626':daysToNext!==null&&daysToNext<=7?'#d97706':'#2563eb'}}>
                🔮 {lang==='sw'?'Hedhi Inayotarajiwa':'Predicted Next Period'}
              </p>
              <p className="text-base font-bold text-gray-800">{fmtLong(predictedNext)}</p>
              {daysToNext!==null && (
                <p className="text-sm font-semibold mt-1" style={{color:daysToNext<=3?'#dc2626':daysToNext<=7?'#d97706':'#6b7280'}}>
                  {daysToNext<0?`${Math.abs(daysToNext)} ${lang==='sw'?'siku zilizopita':'days ago'}`:daysToNext===0?(lang==='sw'?'Leo!':'Today!'): `${daysToNext} ${lang==='sw'?'siku zilizobaki':'days away'}`}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">* {lang==='sw'?'Inatarajiwa — inaweza kutofautiana siku 2-3':'Predicted — may vary by 2-3 days'}</p>
            </div>
          )}
          {cycles.length>0 && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label:lang==='sw'?'Mzunguko':'Cycles', value:cycles.length },
                { label:lang==='sw'?'Urefu wa Wastani':'Avg Length', value:`${cycleLength}${lang==='sw'?' siku':'d'}` },
                { label:lang==='sw'?'Hadi Ijayo':'Days to Next', value:daysToNext!==null?(daysToNext<0?(lang==='sw'?'Imepita':'Past'):daysToNext):'—' },
              ].map((s,i)=>(
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
                  <p className="text-xl font-black text-pink-500">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR ── */}
      {section==='calendar' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{lang==='sw'?'Bonyeza siku yoyote kurekodi ngono':'Tap any day to log sex activity'}</p>
            {cycles.length===0 && (
              <button onClick={()=>setShowImport(true)} className="text-xs text-pink-600 font-bold border border-pink-300 px-3 py-1.5 rounded-lg">📅 {lang==='sw'?'Ingiza':'Import'}</button>
            )}
          </div>
          <CycleCalendar cycles={cycles} cycleLen={cycleLength} sexLog={sexLog} lang={lang} onDayTap={handleDayTap}/>
        </div>
      )}

      {/* ── LOG PERIOD ── */}
      {section==='log' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">🔴 {lang==='sw'?'Rekodi Hedhi Mpya':'Log New Period'}</h3>
              <button onClick={()=>setShowImport(true)} className="text-xs text-pink-600 font-bold border border-pink-300 px-3 py-1.5 rounded-lg">
                📅 {lang==='sw'?'Ingiza Historia':'Import History'}
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-700 font-medium">ℹ️ {lang==='sw'?'Siku 1 = SIKU YA KWANZA ya kutokwa damu halisi — si madoa':'Day 1 = FIRST day of actual bleeding — not spotting'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">{lang==='sw'?'🔴 Ilianza (Siku 1):':'🔴 Started (Day 1):'}</label>
                <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" value={startDate} onChange={e=>setStartDate(e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">{lang==='sw'?'⚪ Iliisha (si lazima):':'⚪ Ended (optional):'}</label>
                <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" value={endDate} onChange={e=>setEndDate(e.target.value)}/>
              </div>
            </div>
            {['flow','pain'].map(cat=>(
              <div key={cat}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{lang==='sw'?catLabels_sw[cat]:catLabels_en[cat]}:</p>
                <div className="flex flex-wrap gap-2">
                  {symCats[cat].map(s=>(
                    <button key={s} onClick={()=>toggleSym(cat,s)}
                      className={`text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${(selectedSyms[cat]||[]).includes(s)?'text-white':'border-gray-200 text-gray-600'}`}
                      style={(selectedSyms[cat]||[]).includes(s)?{background:catColors[cat]}:{}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={savePeriod} disabled={!startDate}
              className={`w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition-all ${logSaved?'bg-green-500':''}`}
              style={!logSaved&&startDate?{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}:{}}>
              {logSaved?`✅ ${lang==='sw'?'Imehifadhiwa!':'Saved!'}`:(lang==='sw'?'💾 Hifadhi Rekodi ya Hedhi':'💾 Save Period Record')}
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-3">⚙️ {lang==='sw'?'Urefu wa Mzunguko':'Cycle Length'}</h3>
            <div className="flex items-center gap-4">
              <input type="range" min={21} max={35} value={cycleLength} onChange={e=>setCycleLength(Number(e.target.value))} className="flex-1 accent-pink-500"/>
              <span className="text-2xl font-black text-pink-500 w-10 text-center">{cycleLength}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{lang==='sw'?'* Hupatikana moja kwa moja kutoka historia yako':'* Auto-detected from your history'}</p>
          </div>
        </div>
      )}

      {/* ── SYMPTOMS ── */}
      {section==='symptoms' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">💊 {lang==='sw'?"Dalili za Leo":"Today's Symptoms"}</h3>
              {phase && <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{background:phase.color}}>{phase.emoji} {lang==='sw'?`Siku ${cycleDay}`:`Day ${cycleDay}`}</span>}
            </div>
            {Object.entries(symCats).map(([catKey,options])=>(
              <div key={catKey}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{lang==='sw'?catLabels_sw[catKey]:catLabels_en[catKey]}:</p>
                <div className="flex flex-wrap gap-2">
                  {options.map(s=>{
                    const active=(selectedSyms[catKey]||[]).includes(s)
                    return (
                      <button key={s} onClick={()=>toggleSym(catKey,s)}
                        className={`text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${active?'text-white':'border-gray-200 text-gray-600'}`}
                        style={active?{background:catColors[catKey],borderColor:catColors[catKey]}:{}}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{lang==='sw'?'Maelezo:':'Notes:'}</p>
              <textarea rows={2} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                placeholder={lang==='sw'?'Maelezo yoyote ya leo...':'Any notes for today...'} value={todayNote} onChange={e=>setTodayNote(e.target.value)}/>
            </div>
            <button onClick={saveSymptoms} disabled={!Object.values(selectedSyms).flat().length&&!todayNote}
              className={`w-full text-white font-bold py-3 rounded-xl disabled:bg-gray-300 transition-all ${logSaved?'bg-green-500':''}`}
              style={!logSaved&&(Object.values(selectedSyms).flat().length||todayNote)?{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}:{}}>
              {logSaved?`✅ ${lang==='sw'?'Imehifadhiwa!':'Saved!'}`:(lang==='sw'?"💾 Hifadhi Dalili za Leo":"💾 Save Today's Symptoms")}
            </button>
          </div>
          {symptomLog.length>0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{lang==='sw'?'Dalili za Hivi Karibuni':'Recent Symptoms'}</p>
              {symptomLog.slice(0,5).map((e,i)=>(
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-gray-700">{e.date}</p>
                    {e.phase && <span className="text-xs text-gray-400">{lang==='sw'?'Siku':'Day'} {e.day}</span>}
                  </div>
                  {e.symptoms?.length>0 && <div className="flex flex-wrap gap-1">{e.symptoms.map(s=><span key={s} className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{s}</span>)}</div>}
                  {e.note && <p className="text-xs text-gray-500 mt-1 italic">"{e.note}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FP ── */}
      {section==='fp' && <FPSetup lang={lang} onSave={saveFP} current={fp}/>}

      {/* ── INSIGHTS ── */}
      {section==='insights' && (
        <div className="space-y-4">
          <RegularityChart cycles={cycles} lang={lang}/>
          {cycles.length>=2 && phase && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-3">📋 {lang==='sw'?'Mwongozo wa Awamu za Mzunguko':'Cycle Phase Guide'}</h3>
              <div className="space-y-2">
                {[
                  {id:'menstrual',day:1},{id:'follicular',day:8},{id:'fertile',day:12},{id:'ovulation',day:14},{id:'luteal',day:18},{id:'pre_period',day:26}
                ].map(({id,day})=>{
                  const p=getPhase(day,28)
                  const isActive=p.id===phase.id
                  return (
                    <div key={id} className={`rounded-xl p-3 border-2 ${isActive?'border-pink-300':'border-gray-100'}`} style={isActive?{background:p.color+'18'}:{}}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{p.emoji}</span>
                        <p className="font-bold text-gray-800 text-sm">{p[lang==='sw'?'sw':'en']}</p>
                        {isActive && <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold">{lang==='sw'?'Sasa':'Now'}</span>}
                      </div>
                      <p className="text-xs text-gray-600">{p.desc[lang==='sw'?'sw':'en']}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {section==='history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700">{lang==='sw'?'Historia ya Hedhi':'Period History'} ({cycles.length})</p>
            <button onClick={()=>setShowImport(true)} className="text-xs text-pink-600 font-bold border border-pink-300 px-3 py-1.5 rounded-lg">
              📅 {lang==='sw'?'Ingiza Historia':'Import History'}
            </button>
          </div>
          {cycles.length===0 ? (
            <div className="text-center py-12 text-gray-400">
              <Heart size={36} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">{lang==='sw'?'Bado hakuna rekodi.':'No records yet.'}</p>
            </div>
          ) : cycles.map((c,i)=>{
            const dur = c.end ? diffDays(c.start,c.end) : null
            const cycLen = i<cycles.length-1 ? diffDays(cycles[i+1].start,cycles[i].start) : null
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded">D1</span>
                      <p className="font-bold text-gray-800 text-sm">{fmtShort(c.start)}</p>
                      {c.imported && <span className="text-xs text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">imported</span>}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      {dur && <span>🩸 {lang==='sw'?`Siku ${dur}`:`${dur} days`}</span>}
                      {cycLen&&cycLen>15&&cycLen<60 && <span>🔄 {lang==='sw'?`Mzunguko: siku ${cycLen}`:`Cycle: ${cycLen}d`}</span>}
                    </div>
                    {c.symptoms?.length>0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.symptoms.slice(0,4).map(s=><span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}
                      </div>
                    )}
                  </div>
                  <button onClick={()=>deleteCycle(c.id)} className="text-gray-300 hover:text-red-400 ml-2"><Trash2 size={14}/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── FLOATING FAQ ── */}
      <button onClick={()=>setShowFAQ(true)}
        className="fixed bottom-24 right-4 w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white text-lg z-30 hover:scale-105 transition-transform"
        style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
        ❓
      </button>

      {/* ── MODALS ── */}
      {showFAQ    && <FAQModal lang={lang} cycleLen={cycleLength} cycleDay={cycleDay} onClose={()=>setShowFAQ(false)}/>}
      {showImport && <ImportModal lang={lang} onImport={importHistory} onClose={()=>setShowImport(false)}/>}
      {sexModal   && <DayDetailModal dateS={sexModal.dateS} cycleDay={sexModal.cycleDay} cycleLen={cycleLength} lang={lang} cycles={cycles} onSaveSex={(d)=>saveSex(sexModal.dateS,d)} onLogPeriodStart={handleLogPeriodStart} onClose={()=>setSexModal(null)}/>}
    </div>
  )
}
