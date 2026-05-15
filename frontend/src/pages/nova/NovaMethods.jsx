import { useState } from 'react'
import { ChevronRight, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

// ── FULL METHOD DATABASE ───────────────────────────────────────────────────────
const METHODS_DB = [
  // ── DMPA-SC ────────────────────────────────────────────────────────────────
  {
    id: 'dmpa_sc',
    emoji: '💉',
    category: { en: 'Injectables', sw: 'Sindano' },
    name: { en: 'DMPA-SC — Sayana Press (Self-Injection)', sw: 'DMPA-SC — Sayana Press (Kujisindania)' },
    tagline: { en: 'Give yourself the injection at home', sw: 'Jipe sindano nyumbani' },
    color: '#14a044',
    efficacy: { perfect: '99%+', typical: '96%' },
    duration: { en: '13 weeks per dose', sw: 'Wiki 13 kwa kila dozi' },
    hormone: { en: 'Progestogen only (DMPA 104mg/0.65ml)', sw: 'Projestojeni tu (DMPA 104mg/0.65ml)' },
    protectsSTI: false,
    sections: {
      how_it_works: {
        en: 'DMPA-SC contains depot medroxyprogesterone acetate (DMPA), a progestogen hormone. It works by preventing ovulation (stopping the egg from being released), thickening cervical mucus so sperm cannot reach an egg, and thinning the uterine lining.',
        sw: 'DMPA-SC ina depot medroxyprogesterone acetate (DMPA), homoni ya projestojeni. Inafanya kazi kwa kuzuia ovulation (kusimamisha kutolewa kwa yai), kunenepesha kamasi ya seviksi ili manii isifike kwenye yai, na kupunguza unene wa ukuta wa mfuko wa uzazi.'
      },
      who_can_use: {
        en: ['Most women of reproductive age', 'Breastfeeding mothers (from 6 weeks postpartum)', 'Women with anaemia or heavy periods (benefits: reduces bleeding)', 'HIV-positive women (MEC Cat 1 — no restrictions except ritonavir-boosted ARVs)', 'Women who cannot use estrogen (migraines with aura, smokers over 35, hypertension)'],
        sw: ['Wanawake wengi wa umri wa kuzaa', 'Mama wanaonyonyesha (kutoka wiki 6 baada ya kujifungua)', 'Wanawake wenye upungufu wa damu au hedhi nzito (faida: hupunguza kutokwa damu)', 'Wanawake wenye VVU (MEC Kundi 1 — hakuna vizuizi isipokuwa ARV za ritonavir)', 'Wanawake ambao hawawezi kutumia estrojeni']
      },
      who_cannot_use: {
        en: ['Current breast cancer (MEC Cat 4 — ABSOLUTE contraindication)', 'Severe liver disease', 'On rifampicin/rifabutin (reduces efficacy — use DMPA-IM instead, MEC Cat 2)', 'Unexplained vaginal bleeding (evaluate first)', 'Women wanting pregnancy within 1-2 years (fertility may take 6-18 months to return)'],
        sw: ['Saratani ya matiti ya sasa hivi (MEC Kundi 4 — KIZUIZI KABISA)', 'Ugonjwa mkali wa ini', 'Kutumia rifampicin/rifabutin (hupunguza ufanisi)', 'Kutokwa damu bila sababu ya kujulikana (chunguza kwanza)', 'Wanawake wanaotaka kupata mimba ndani ya miaka 1-2']
      },
      side_effects: [
        { effect: { en: 'Irregular bleeding or spotting', sw: 'Kutokwa damu au madoa yasiyokuwa ya kawaida' }, normal: true, management: { en: 'Very common in first 3-6 months. Use a panty liner. Does not mean the method is not working. Counselling at start reduces discontinuation.', sw: 'Kawaida sana katika miezi 3-6 ya kwanza. Tumia padi ndogo. Haimaanishi njia haifanyi kazi.' } },
        { effect: { en: 'No periods (amenorrhoea)', sw: 'Kutokuwa na hedhi (amenorrhoea)' }, normal: true, management: { en: 'Up to 50-70% of women stop having periods after 1 year. Blood is NOT accumulating — the uterine lining simply does not build up. This is safe and a benefit for many women.', sw: 'Hadi 50-70% ya wanawake huacha kupata hedhi baada ya mwaka 1. Damu HAIKUSANYIKI — ukuta wa mfuko wa uzazi haujengi tu. Hii ni salama na faida kwa wanawake wengi.' } },
        { effect: { en: 'Weight changes', sw: 'Mabadiliko ya uzito' }, normal: true, management: { en: 'Some women notice small weight gain (1-2kg on average). Eat balanced diet and stay active. Varies significantly between individuals.', sw: 'Wanawake wengine wanaona ongezeko dogo la uzito (wastani wa kilo 1-2). Kula lishe bora na kuwa hai.' } },
        { effect: { en: 'Headaches', sw: 'Maumivu ya kichwa' }, normal: true, management: { en: 'Usually mild. Drink water, rest. If severe or with vision changes — this is a DANGER SIGN. Go to clinic immediately.', sw: 'Kawaida ni madogo. Kunywa maji, pumzika. Ikiwa ni makali au yana mabadiliko ya maono — hii ni ISHARA YA HATARI. Nenda kliniki mara moja.' } },
        { effect: { en: 'Delayed return of fertility', sw: 'Kuchelewa kurudi kwa uzazi' }, normal: true, management: { en: 'After stopping DMPA-SC, it may take 6-18 months for periods and fertility to return. This is normal — not permanent infertility. Fertility eventually returns to baseline for all women.', sw: 'Baada ya kusimamisha DMPA-SC, inaweza kuchukua miezi 6-18 kwa hedhi na uzazi kurudi. Hii ni kawaida — si utasa wa kudumu.' } },
      ],
      danger_signs: {
        title: { en: 'Go to clinic IMMEDIATELY if you have:', sw: 'Nenda kliniki MARA MOJA ukiwa na:' },
        signs: [
          { en: 'Severe headache with vision changes or blurred vision', sw: 'Maumivu makali ya kichwa na mabadiliko ya maono au kuona vibaya' },
          { en: 'Severe abdominal pain', sw: 'Maumivu makali ya tumbo' },
          { en: 'Swelling, redness, pus or severe pain at injection site', sw: 'Uvimbe, uwekundu, usaha au maumivu makali mahali pa sindano' },
          { en: 'Signs of severe allergic reaction (difficulty breathing, rash, swelling of face)', sw: 'Dalili za mzio mkali (ugumu wa kupumua, vipele, uvimbe wa uso)' },
        ]
      },
      maps_steps: {
        title: { en: 'MAPS — 4 Steps for Safe Self-Injection', sw: 'MAPS — Hatua 4 za Kujisindania Salama' },
        steps: [
          { letter: 'M', word: { en: 'Mix', sw: 'Changanya' }, icon: '🔄', detail: { en: 'Shake the Sayana Press device vigorously for 30 seconds in a back-and-forth motion (not circular). The liquid should look cloudy/milky before injecting. If still clear, shake more.', sw: 'Tikisa kifaa cha Sayana Press kwa nguvu kwa sekunde 30 kwa mwendo wa mbele na nyuma (si mzunguko). Dawa inapaswa kuonekana na ukungu/maziwa kabla ya sindano. Ikiwa bado wazi, tikisa zaidi.' }, tip: { en: 'Set a 30-second timer to ensure adequate shaking', sw: 'Weka kipindi cha sekunde 30 kuhakikisha kutikisa vizuri' } },
          { letter: 'A', word: { en: 'Activate', sw: 'Washa' }, icon: '🔘', detail: { en: 'Hold the device with cap facing up. Push the needle cap and the reservoir port firmly together until you hear or feel a definitive CLICK. The needle is now ready.', sw: 'Shika kifaa na kofia ikiwa juu. Bonyeza kofia ya sindano na bandari ya hifadhi pamoja kwa nguvu hadi usikie au uhisi KUBONYEZA kwa uhakika. Sindano sasa iko tayari.' }, tip: { en: 'No click = not activated = do not inject. Try again firmly.', sw: 'Hakuna click = haijawashwa = usisindanie. Jaribu tena kwa nguvu.' } },
          { letter: 'P', word: { en: 'Pinch', sw: 'Piga Pinch' }, icon: '🤏', detail: { en: 'Choose your injection site: lower belly (2 finger-widths from navel) OR upper thigh OR back of upper arm. Pinch a fold of skin firmly between thumb and forefinger. Keep pinching throughout the injection.', sw: 'Chagua eneo la sindano: tumbo la chini (upana wa vidole 2 kutoka kitovuni) AU mapaja ya juu AU nyuma ya mkono wa juu. Piga ngozi kwa nguvu kati ya kidole gumba na cha shahada. Endelea kushikilia wakati wote wa sindano.' }, tip: { en: 'Rotate injection sites to avoid skin changes at one site', sw: 'Badilisha maeneo ya sindano ili kuepuka mabadiliko ya ngozi mahali pamoja' } },
          { letter: 'S', word: { en: 'Self-inject', sw: 'Jisindanie' }, icon: '💉', detail: { en: 'Insert the needle at a 45° angle into the pinched skin fold. Do not push the needle all the way to the hub — insert about 2/3 of the needle. Slowly squeeze the reservoir until completely empty (about 5 seconds). Remove needle while still pinching. Apply gentle pressure with a dry swab for 30 seconds — do NOT rub (rubbing can increase absorption too fast).', sw: 'Ingiza sindano kwa pembe ya 45° kwenye ngozi iliyoshikiliwa. Usisukume sindano hadi mwisho — ingiza takriban 2/3 ya sindano. Bonyeza hifadhi polepole hadi tupu (takriban sekunde 5). Toa sindano ukishikilia ngozi. Bonyeza kwa swab kavu kwa sekunde 30 — USISUGUE (kusugua kunaweza kuongeza ufyonzaji kwa kasi).' }, tip: { en: 'Dispose needle safely in a sharps container or sealed bottle immediately after use', sw: 'Tupa sindano salama katika chombo cha vitu vikali au chupa iliyofungwa mara baada ya kutumia' } },
        ]
      },
      si_training_checklist: {
        title: { en: 'SI Training Checklist (Provider Use)', sw: 'Orodha ya Mafunzo ya SI (Kwa Mtoa Huduma)' },
        items: {
          en: ['Client can explain the MAPS steps in order', 'Client demonstrates correct shaking technique (30 seconds)', 'Client correctly identifies the click sound/feel', 'Client identifies correct injection sites', 'Client demonstrates 45° angle injection technique', 'Client demonstrates correct pinch technique', 'Client knows safe needle disposal method', 'Client can state when to return/seek care', 'Client knows danger signs', 'Take-home doses issued: 1 / 2 / 3 / 4'],
          sw: ['Mteja anaweza kueleza hatua za MAPS kwa mpangilio', 'Mteja anaonyesha mbinu sahihi ya kutikisa (sekunde 30)', 'Mteja anatambua sauti/hisi sahihi ya kubonyeza', 'Mteja anatambua maeneo sahihi ya sindano', 'Mteja anaonyesha mbinu sahihi ya sindano kwa pembe ya 45°', 'Mteja anaonyesha mbinu sahihi ya kupiga pinch', 'Mteja anajua njia salama ya kutupa sindano', 'Mteja anajua wakati wa kurudi/kutafuta huduma', 'Mteja anajua ishara za hatari', 'Dozi za nyumbani zilizotolewa: 1 / 2 / 3 / 4']
        }
      },
      counselling_points: {
        en: ['Reassure about amenorrhoea — blood is not accumulating', 'Explain that irregular bleeding is normal in first 3-6 months', 'Discuss delayed return of fertility for women planning pregnancy soon', 'Ensure client knows danger signs requiring immediate clinic visit', 'Confirm client understands MAPS steps before issuing take-home doses', 'Offer condoms for STI/HIV protection — DMPA-SC does not protect against STIs'],
        sw: ['Toa uhakika kuhusu kutokuwa na hedhi — damu haikusanyiki', 'Eleza kwamba kutokwa damu bila ya kawaida ni kawaida katika miezi 3-6 ya kwanza', 'Jadili ucheleweshaji wa kurudi kwa uzazi kwa wanawake wanaopanga kupata mimba hivi karibuni', 'Hakikisha mteja anajua ishara za hatari zinazohitaji ziara ya kliniki ya haraka', 'Thibitisha mteja anaelewa hatua za MAPS kabla ya kutoa dozi za nyumbani', 'Toa kondomu kwa ulinzi wa STI/VVU — DMPA-SC hailindi dhidi ya STI']
      },
      return_date: { en: 'Every 13 weeks (91 days). Grace period up to 17 weeks (119 days).', sw: 'Kila wiki 13 (siku 91). Muda wa neema hadi wiki 17 (siku 119).' },
      video_resources: [
        { title: 'Sayana Press Self-Injection Training', url: 'https://www.youtube.com/watch?v=PATH_SI_VIDEO', source: 'PATH', duration: '4 min' },
        { title: 'MAPS Steps — Kenya MOH', url: 'https://www.youtube.com/watch?v=MOH_MAPS_VIDEO', source: 'Kenya MOH', duration: '6 min' },
      ]
    }
  },

  // ── DMPA-IM ────────────────────────────────────────────────────────────────
  {
    id: 'dmpa_im',
    emoji: '💉',
    category: { en: 'Injectables', sw: 'Sindano' },
    name: { en: 'DMPA-IM — Depo Injection', sw: 'DMPA-IM — Sindano ya Depo' },
    tagline: { en: 'Given by a provider every 12 weeks', sw: 'Hutolewa na mtoa huduma kila wiki 12' },
    color: '#059669',
    efficacy: { perfect: '99%+', typical: '96%' },
    duration: { en: '12 weeks per dose', sw: 'Wiki 12 kwa kila dozi' },
    hormone: { en: 'Progestogen only (DMPA 150mg/1ml, IM)', sw: 'Projestojeni tu (DMPA 150mg/1ml, IM)' },
    protectsSTI: false,
    sections: {
      how_it_works: { en: 'Same mechanism as DMPA-SC — prevents ovulation, thickens cervical mucus, thins uterine lining. Given as intramuscular injection (into muscle) by a provider.', sw: 'Utaratibu sawa na DMPA-SC — kuzuia ovulation, kunenepesha kamasi ya seviksi, kupunguza unene wa ukuta wa mfuko wa uzazi. Hutolewa kama sindano ya ndani ya misuli na mtoa huduma.' },
      who_can_use: { en: ['Same eligibility as DMPA-SC', 'Women who prefer provider-given injections', 'Women on rifampicin — DMPA-IM is preferred over DMPA-SC (MEC Cat 2 vs Cat 2, but higher dose)'], sw: ['Ustahili sawa na DMPA-SC', 'Wanawake wanaopendelea sindano zinazotolewa na mtoa huduma', 'Wanawake wanaotumia rifampicin — DMPA-IM inapendelewa'] },
      who_cannot_use: { en: ['Current breast cancer', 'Severe liver disease', 'On rifampicin (higher risk than DMPA-SC)'], sw: ['Saratani ya matiti ya sasa', 'Ugonjwa mkali wa ini', 'Kutumia rifampicin'] },
      side_effects: [
        { effect: { en: 'Irregular bleeding/amenorrhoea', sw: 'Kutokwa damu isiyo ya kawaida/kutokuwa na hedhi' }, normal: true, management: { en: 'Same as DMPA-SC. Reassure client.', sw: 'Sawa na DMPA-SC. Toa uhakika kwa mteja.' } },
        { effect: { en: 'Delayed fertility return', sw: 'Kuchelewa kurudi kwa uzazi' }, normal: true, management: { en: 'May take 6-18 months after last injection. Not permanent.', sw: 'Inaweza kuchukua miezi 6-18 baada ya sindano ya mwisho. Si ya kudumu.' } },
      ],
      danger_signs: { title: { en: 'Seek care immediately for:', sw: 'Tafuta huduma mara moja kwa:' }, signs: [{ en: 'Severe headache, vision changes, severe abdominal pain', sw: 'Maumivu makali ya kichwa, mabadiliko ya maono, maumivu makali ya tumbo' }] },
      counselling_points: { en: ['Must be given by trained provider', 'Cannot self-inject unlike DMPA-SC', 'Same side effect profile as DMPA-SC', 'Offer condoms for STI protection'], sw: ['Lazima itolewa na mtoa huduma aliyefunzwa', 'Haiwezi kujisindaniwa tofauti na DMPA-SC', 'Dalili sawa na DMPA-SC', 'Toa kondomu kwa ulinzi wa STI'] },
      return_date: { en: 'Every 12 weeks (84 days). Grace period up to 16 weeks (112 days).', sw: 'Kila wiki 12 (siku 84). Muda wa neema hadi wiki 16 (siku 112).' }
    }
  },

  // ── NET-EN ─────────────────────────────────────────────────────────────────
  {
    id: 'net_en',
    emoji: '💉',
    category: { en: 'Injectables', sw: 'Sindano' },
    name: { en: 'NET-EN — Noristerat', sw: 'NET-EN — Noristerat' },
    tagline: { en: 'Short-acting injectable, every 8 weeks', sw: 'Sindano ya muda mfupi, kila wiki 8' },
    color: '#0891b2',
    efficacy: { perfect: '99%+', typical: '97%' },
    duration: { en: '8 weeks per dose', sw: 'Wiki 8 kwa kila dozi' },
    hormone: { en: 'Progestogen only (norethisterone enantate 200mg)', sw: 'Projestojeni tu (norethisterone enantate 200mg)' },
    protectsSTI: false,
    sections: {
      how_it_works: { en: 'Contains norethisterone, a progestogen. Prevents ovulation and thickens cervical mucus. Shorter-acting than DMPA, which means fertility returns faster.', sw: 'Ina norethisterone, projestojeni. Inazuia ovulation na kunenepesha kamasi ya seviksi. Ina muda mfupi zaidi kuliko DMPA, maana yake uzazi hurudi haraka zaidi.' },
      who_can_use: { en: ['Similar eligibility to DMPA', 'Women who want shorter-acting injectable', 'Women planning pregnancy sooner (faster fertility return than DMPA)'], sw: ['Ustahili sawa na DMPA', 'Wanawake wanaotaka sindano ya muda mfupi', 'Wanawake wanaopanga kupata mimba mapema (uzazi hurudi haraka zaidi kuliko DMPA)'] },
      who_cannot_use: { en: ['Current breast cancer', 'Severe liver disease'], sw: ['Saratani ya matiti ya sasa', 'Ugonjwa mkali wa ini'] },
      side_effects: [
        { effect: { en: 'Irregular bleeding (more common than DMPA)', sw: 'Kutokwa damu isiyo ya kawaida (kawaida zaidi kuliko DMPA)' }, normal: true, management: { en: 'More irregular bleeding than DMPA. Reassure client. Usually settles.', sw: 'Kutokwa damu zaidi kuliko DMPA. Toa uhakika. Kawaida inakaa.' } },
      ],
      danger_signs: { title: { en: 'Seek care for:', sw: 'Tafuta huduma kwa:' }, signs: [{ en: 'Severe headache, abdominal pain, injection site problems', sw: 'Maumivu makali ya kichwa, maumivu ya tumbo, matatizo mahali pa sindano' }] },
      counselling_points: { en: ['Stricter interval than DMPA — must return every 8 weeks', 'Faster fertility return than DMPA if planning pregnancy soon', 'Must be given by provider — no self-injection option'], sw: ['Kipindi cha kuja tena ni kali zaidi — lazima urudi kila wiki 8', 'Uzazi hurudi haraka zaidi kuliko DMPA', 'Lazima itolewa na mtoa huduma'] },
      return_date: { en: 'Every 8 weeks (56 days). Grace period up to 10 weeks (70 days).', sw: 'Kila wiki 8 (siku 56). Muda wa neema hadi wiki 10 (siku 70).' }
    }
  },

  // ── COC ────────────────────────────────────────────────────────────────────
  {
    id: 'coc',
    emoji: '💊',
    category: { en: 'Pills', sw: 'Vidonge' },
    name: { en: 'COC — Combined Oral Contraceptive', sw: 'COC — Kidonge cha Uzazi wa Pamoja' },
    tagline: { en: 'Daily pill with two hormones', sw: 'Kidonge cha kila siku chenye homoni mbili' },
    color: '#ec4899',
    efficacy: { perfect: '99%+', typical: '91%' },
    duration: { en: 'Daily (28-day pack)', sw: 'Kila siku (pakiti ya siku 28)' },
    hormone: { en: 'Estrogen + Progestogen', sw: 'Estrojeni + Projestojeni' },
    protectsSTI: false,
    sections: {
      how_it_works: { en: 'Contains both estrogen and progestogen hormones. Primarily prevents ovulation. Also thickens cervical mucus and thins the uterine lining as backup mechanisms.', sw: 'Ina homoni za estrojeni na projestojeni. Huzuia ovulation hasa. Pia hunenepesha kamasi ya seviksi na kupunguza unene wa ukuta wa mfuko wa uzazi kama njia za ziada.' },
      who_can_use: { en: ['Healthy non-smoking women under 35', 'Women with no history of blood clots, stroke, or heart disease', 'Women with dysmenorrhoea or heavy periods (COC reduces both)', 'Women with acne or endometriosis (non-contraceptive benefit)'], sw: ['Wanawake wenye afya nzuri wasiovuta sigara chini ya umri wa miaka 35', 'Wanawake wasio na historia ya kuganda kwa damu, kiharusi, au ugonjwa wa moyo', 'Wanawake wenye maumivu makali ya hedhi au hedhi nzito (COC hupunguza vyote viwili)', 'Wanawake wenye chunusi au endometriosis'] },
      who_cannot_use: { en: ['Breastfeeding < 6 months postpartum (MEC Cat 4)', 'Migraine WITH aura — any age (MEC Cat 4)', 'BP ≥ 160/100 mmHg (MEC Cat 4)', 'Current breast cancer (MEC Cat 4)', 'Smoking ≥ 35 years old + ≥ 15 cigarettes/day (MEC Cat 4)', 'DVT/PE current or history (MEC Cat 4)', 'Postpartum < 21 days non-breastfeeding (MEC Cat 4)', 'On rifampicin/enzyme-inducing AEDs (MEC Cat 3 — significantly reduces efficacy)'], sw: ['Kunyonyesha < miezi 6 baada ya kujifungua (MEC Kundi 4)', 'Migraine YA AURA — umri wowote (MEC Kundi 4)', 'BP ≥ 160/100 mmHg (MEC Kundi 4)', 'Saratani ya matiti ya sasa (MEC Kundi 4)', 'Kuvuta sigara ≥ miaka 35 + ≥ sigara 15/siku (MEC Kundi 4)', 'DVT/PE ya sasa au historia (MEC Kundi 4)'] },
      side_effects: [
        { effect: { en: 'Nausea (especially first weeks)', sw: 'Kichefuchefu (hasa wiki za kwanza)' }, normal: true, management: { en: 'Take pill with food or at bedtime. Usually resolves after 2-3 months.', sw: 'Chukua kidonge na chakula au wakati wa kulala. Kawaida hupotea baada ya miezi 2-3.' } },
        { effect: { en: 'Spotting between periods', sw: 'Madoa kati ya hedhi' }, normal: true, management: { en: 'Common in first 3 months. Ensure pill is taken at same time every day. Usually resolves.', sw: 'Kawaida katika miezi 3 ya kwanza. Hakikisha kidonge kinachukuliwa kwa wakati mmoja kila siku.' } },
        { effect: { en: 'Breast tenderness', sw: 'Uvimbe wa matiti' }, normal: true, management: { en: 'Usually mild and resolves. Wear a supportive bra. If severe, discuss alternative method.', sw: 'Kawaida ni kidogo na hupotea. Vaa sidiria inayoshikilia. Ikiwa ni kali, jadili njia mbadala.' } },
        { effect: { en: 'Mood changes', sw: 'Mabadiliko ya hisia' }, normal: true, management: { en: 'Some women report mood changes. If persistent and affecting quality of life, consider progestogen-only method.', sw: 'Wanawake wengine wanaripoti mabadiliko ya hisia. Ikiwa inabaki na kuathiri maisha, fikiria njia ya projestojeni peke yake.' } },
      ],
      danger_signs: {
        title: { en: 'ACHES — Go to clinic IMMEDIATELY:', sw: 'ACHES — Nenda kliniki MARA MOJA:' },
        signs: [
          { en: 'A — Abdominal pain (severe)', sw: 'A — Maumivu makali ya tumbo' },
          { en: 'C — Chest pain or shortness of breath', sw: 'C — Maumivu ya kifua au ugumu wa kupumua' },
          { en: 'H — Headache (severe, especially with vision changes)', sw: 'H — Maumivu makali ya kichwa (hasa na mabadiliko ya maono)' },
          { en: 'E — Eye problems — blurred vision, vision loss', sw: 'E — Matatizo ya macho — kuona vibaya, kupoteza maono' },
          { en: 'S — Severe leg pain or swelling (possible DVT)', sw: 'S — Maumivu makali au uvimbe wa mguu (DVT inayowezekana)' },
        ]
      },
      missed_dose: {
        title: { en: 'Missed Pill Guidance', sw: 'Mwongozo wa Kukosa Kidonge' },
        rules: {
          en: ['Miss 1 pill: Take it as soon as you remember, even if 2 pills on same day. No backup needed.', 'Miss 2+ pills (or start pack 2+ days late): Take most recent missed pill now. Use backup contraception (condom) for 7 days. If unprotected sex in past 5 days — consider emergency contraception.', 'Miss pill in week 3 of pack: Finish current pack and start new pack immediately (skip pill-free week).'],
          sw: ['Kukosa kidonge 1: Chukua mara unavyokumbuka, hata vikigonge 2 siku moja. Hakuna haja ya njia ya ziada.', 'Kukosa vidonge 2+ (au kuanza pakiti siku 2+ baadaye): Chukua kidonge kilichokosekana sasa. Tumia kondomu kwa siku 7. Ikiwa ulikuwa na ngono bila kinga siku 5 zilizopita — fikiria uzazi wa mpango wa dharura.', 'Kukosa kidonge wiki ya 3: Maliza pakiti ya sasa na uanze pakiti mpya mara moja (ruka wiki ya kuacha).']
        }
      },
      counselling_points: { en: ['Take at SAME TIME every day — set a phone alarm', 'No pill-free week for 28-day packs (last 7 pills are inactive/placebo)', 'Does NOT protect against STIs — use condoms too', 'Fertility returns quickly after stopping'], sw: ['Chukua kwa WAKATI MMOJA kila siku — weka kengele ya simu', 'Hakuna wiki ya kuacha kwa pakiti za siku 28 (vidonge 7 vya mwisho havina nguvu)', 'HAIZUII STI — tumia kondomu pia', 'Uzazi hurudi haraka baada ya kusimama'] },
      return_date: { en: 'Every 1-3 months for resupply. Take daily without breaks.', sw: 'Kila mwezi 1-3 kwa ajili ya kujaza dawa. Chukua kila siku bila mapumziko.' }
    }
  },

  // ── POP ────────────────────────────────────────────────────────────────────
  {
    id: 'pop',
    emoji: '💊',
    category: { en: 'Pills', sw: 'Vidonge' },
    name: { en: 'POP — Progestogen-Only Pill (Mini-pill)', sw: 'POP — Kidonge cha Projestojeni Peke Yake' },
    tagline: { en: 'Safe for breastfeeding, no estrogen', sw: 'Salama kwa kunyonyesha, bila estrojeni' },
    color: '#d946ef',
    efficacy: { perfect: '99%+', typical: '91%' },
    duration: { en: 'Daily (continuous)', sw: 'Kila siku (mfululizo)' },
    hormone: { en: 'Progestogen only', sw: 'Projestojeni tu' },
    protectsSTI: false,
    sections: {
      how_it_works: { en: 'Works mainly by thickening cervical mucus (preventing sperm from reaching egg). May also prevent ovulation in some women. Must be taken within the same 3-hour window every day.', sw: 'Inafanya kazi hasa kwa kunenepesha kamasi ya seviksi (kuzuia manii kufikia yai). Inaweza pia kuzuia ovulation kwa wanawake wengine. Lazima ichukuwe ndani ya dirisha la masaa 3 kila siku.' },
      who_can_use: { en: ['Breastfeeding mothers — ideal from 6 weeks postpartum (MEC Cat 1)', 'Women who cannot use estrogen', 'Women with migraines (even with aura — MEC Cat 2)', 'Smokers over 35', 'Women with hypertension'], sw: ['Mama wanaonyonyesha — bora kutoka wiki 6 baada ya kujifungua (MEC Kundi 1)', 'Wanawake ambao hawawezi kutumia estrojeni', 'Wanawake wenye migraine (hata ya aura — MEC Kundi 2)', 'Wavutaji sigara zaidi ya miaka 35', 'Wanawake wenye shinikizo la damu'] },
      who_cannot_use: { en: ['Current breast cancer (MEC Cat 4)', 'On rifampicin (MEC Cat 3 — reduces efficacy significantly)', 'Women who cannot take daily medication at exact same time'], sw: ['Saratani ya matiti ya sasa (MEC Kundi 4)', 'Kutumia rifampicin (MEC Kundi 3)', 'Wanawake ambao hawawezi kuchukua dawa kwa wakati mmoja kila siku'] },
      side_effects: [
        { effect: { en: 'Irregular bleeding', sw: 'Kutokwa damu isiyo ya kawaida' }, normal: true, management: { en: 'Common. Reassure. Usually settles after 3-6 months.', sw: 'Kawaida. Toa uhakika. Kawaida inakaa baada ya miezi 3-6.' } },
      ],
      missed_dose: {
        title: { en: 'Missed POP Guidance', sw: 'Mwongozo wa Kukosa POP' },
        rules: { en: ['More than 3 hours late: Use backup contraception (condom) for the next 48 hours', 'If unprotected sex occurred: Consider emergency contraception'], sw: ['Zaidi ya masaa 3 baadaye: Tumia kondomu kwa masaa 48 ijayo', 'Ikiwa kulikuwa na ngono bila kinga: Fikiria uzazi wa mpango wa dharura'] }
      },
      counselling_points: { en: ['Must be taken within same 3-hour window every day', 'No pill-free breaks — continuous daily use', 'Ideal for breastfeeding mothers', 'Fertility returns quickly after stopping'], sw: ['Lazima ichukuwe ndani ya dirisha la masaa 3 kila siku', 'Hakuna mapumziko — matumizi ya kila siku mfululizo', 'Bora kwa mama wanaonyonyesha', 'Uzazi hurudi haraka baada ya kusimama'] },
      return_date: { en: 'Monthly resupply. Take continuously every day.', sw: 'Jaza kila mwezi. Chukua kila siku mfululizo.' }
    }
  },

  // ── IMPLANT ────────────────────────────────────────────────────────────────
  {
    id: 'implant',
    emoji: '🔵',
    category: { en: 'Long-Acting (LARC)', sw: 'Muda Mrefu (LARC)' },
    name: { en: 'Implant — Implanon NXT (3 years)', sw: 'Kipandikizi — Implanon NXT (miaka 3)' },
    tagline: { en: 'Most effective reversible method', sw: 'Njia bora zaidi ya kubadilishwa' },
    color: '#7c3aed',
    efficacy: { perfect: '99.9%', typical: '99.9%' },
    duration: { en: '3 years', sw: 'Miaka 3' },
    hormone: { en: 'Progestogen only (etonogestrel 68mg)', sw: 'Projestojeni tu (etonogestrel 68mg)' },
    protectsSTI: false,
    sections: {
      how_it_works: { en: 'A small flexible rod (4cm) inserted under the skin of the upper arm. Releases etonogestrel slowly. Primarily prevents ovulation. Also thickens cervical mucus. No user action required after insertion.', sw: 'Fimbo ndogo inayobadilika (4cm) inayowekwa chini ya ngozi ya mkono wa juu. Hutoa etonogestrel polepole. Huzuia ovulation hasa. Pia hunenepesha kamasi ya seviksi. Hakuna hatua inayohitajika baada ya kuwekwa.' },
      who_can_use: { en: ['Most women of reproductive age (MEC Cat 1)', 'Breastfeeding mothers from immediately postpartum', 'Women who want long-acting protection without daily action', 'Adolescents and young women', 'Women with anaemia or heavy periods'], sw: ['Wanawake wengi wa umri wa kuzaa (MEC Kundi 1)', 'Mama wanaonyonyesha kutoka mara moja baada ya kujifungua', 'Wanawake wanaotaka ulinzi wa muda mrefu bila hatua ya kila siku', 'Vijana na wasichana wachanga', 'Wanawake wenye upungufu wa damu au hedhi nzito'] },
      who_cannot_use: { en: ['Current breast cancer (MEC Cat 4)', 'Active severe liver disease', 'On rifampicin/enzyme-inducing AEDs (MEC Cat 3 — reduces efficacy significantly)', 'Unexplained vaginal bleeding (evaluate first)'], sw: ['Saratani ya matiti ya sasa (MEC Kundi 4)', 'Ugonjwa mkali wa ini unaoendelea', 'Kutumia rifampicin/AED (MEC Kundi 3)', 'Kutokwa damu bila sababu (chunguza kwanza)'] },
      side_effects: [
        { effect: { en: 'Irregular bleeding (most common reason for removal)', sw: 'Kutokwa damu isiyo ya kawaida (sababu ya kawaida zaidi ya kuondoa)' }, normal: true, management: { en: 'Affects up to 20% of users. Reassure extensively. Discuss before insertion. Does not mean method is failing.', sw: 'Inaathiri hadi 20% ya watumiaji. Toa uhakika kwa kina. Jadili kabla ya kuwekwa. Haimaanishi njia inashindwa.' } },
        { effect: { en: 'Headaches', sw: 'Maumivu ya kichwa' }, normal: true, management: { en: 'Usually mild. Take paracetamol. If severe or persistent, evaluate.', sw: 'Kawaida ni madogo. Chukua paracetamol. Ikiwa ni makali au yanabaki, chunguza.' } },
        { effect: { en: 'Acne', sw: 'Chunusi' }, normal: true, management: { en: 'Some women develop acne. Can be managed with topical treatments. Usually improves after 6 months.', sw: 'Wanawake wengine hupata chunusi. Inaweza kudhibitiwa na matibabu ya uso. Kawaida huboresha baada ya miezi 6.' } },
      ],
      danger_signs: { title: { en: 'Seek care for:', sw: 'Tafuta huduma kwa:' }, signs: [{ en: 'Implant cannot be felt under skin (may have migrated)', sw: 'Kipandikizi hakiwezi kuhisiwa chini ya ngozi (kinaweza kuhamia)' }, { en: 'Signs of infection at insertion site (pus, severe pain, swelling)', sw: 'Dalili za maambukizi mahali pa kuweka (usaha, maumivu makali, uvimbe)' }] },
      counselling_points: { en: ['No action required for 3 years after insertion', 'Can be removed anytime if side effects intolerable or pregnancy desired', 'Fertility returns within days of removal', 'Check that rod is palpable monthly (place fingers on insertion site)', 'Does NOT protect against STIs — use condoms'], sw: ['Hakuna hatua inayohitajika kwa miaka 3 baada ya kuwekwa', 'Inaweza kuondolewa wakati wowote', 'Uzazi hurudi ndani ya siku baada ya kuondolewa', 'Angalia fimbo inaweza kuhisiwa kila mwezi', 'HAIZUII STI — tumia kondomu'] },
      return_date: { en: 'Replace after 3 years. Annual check recommended.', sw: 'Badilisha baada ya miaka 3. Ukaguzi wa kila mwaka unapendekezwa.' }
    }
  },

  // ── CU-IUD ─────────────────────────────────────────────────────────────────
  {
    id: 'cu_iud',
    emoji: '🔩',
    category: { en: 'Long-Acting (LARC)', sw: 'Muda Mrefu (LARC)' },
    name: { en: 'Copper IUD (Cu-T 380A)', sw: 'IUD ya Shaba (Cu-T 380A)' },
    tagline: { en: 'Hormone-free, 10-12 years, best EC option', sw: 'Bila homoni, miaka 10-12, bora kwa dharura' },
    color: '#f59e0b',
    efficacy: { perfect: '99.9%', typical: '99.9%' },
    duration: { en: '10-12 years', sw: 'Miaka 10-12' },
    hormone: { en: 'None (copper acts as spermicide)', sw: 'Hakuna (shaba hufanya kazi kama dawa ya kuua manii)' },
    protectsSTI: false,
    sections: {
      how_it_works: { en: 'A small T-shaped device with copper wire inserted into the uterus. Copper ions are toxic to sperm, preventing fertilisation. Also prevents implantation. No hormones — works physically and chemically.', sw: 'Kifaa kidogo chenye umbo la T na waya wa shaba kinachowekwa kwenye mfuko wa uzazi. Ayoni za shaba ni sumu kwa manii, kuzuia mbolea. Pia huzuia upandikizaji. Hakuna homoni — inafanya kazi kimwili na kikemia.' },
      who_can_use: { en: ['Most women (MEC Cat 1)', 'Women who cannot use hormones', 'Breastfeeding mothers (immediately postpartum or from 4 weeks)', 'HIV-positive women (MEC Cat 1)', 'As emergency contraception within 5 days of unprotected sex'], sw: ['Wanawake wengi (MEC Kundi 1)', 'Wanawake ambao hawawezi kutumia homoni', 'Mama wanaonyonyesha (mara moja baada ya kujifungua au kutoka wiki 4)', 'Wanawake wenye VVU (MEC Kundi 1)', 'Kama uzazi wa mpango wa dharura ndani ya siku 5 za ngono bila kinga'] },
      who_cannot_use: { en: ['Active PID or current STI (gonorrhoea/chlamydia) — MEC Cat 4', 'Pregnancy (MEC Cat 4)', 'Unexplained vaginal bleeding (evaluate first)', 'Uterine cavity distortion (fibroids)', 'Cervical cancer awaiting treatment', 'Postpartum 48 hours to 4 weeks (higher expulsion risk — MEC Cat 3)', 'Wilson\'s disease (copper metabolism disorder)'], sw: ['PID au STI ya sasa (kisonono/chlamydia) — MEC Kundi 4', 'Ujauzito (MEC Kundi 4)', 'Kutokwa damu bila sababu (chunguza kwanza)', 'Fibroids zinazobadilisha mfuko wa uzazi', 'Saratani ya seviksi inayosubiri matibabu', 'Saa 48 hadi wiki 4 baada ya kujifungua (hatari ya kutoka — MEC Kundi 3)'] },
      side_effects: [
        { effect: { en: 'Heavier periods and more cramping', sw: 'Hedhi nzito zaidi na maumivu zaidi' }, normal: true, management: { en: 'Most common reason for removal. Use ibuprofen/mefenamic acid for cramping. Heavy bleeding usually reduces after 3-6 months. Consider LNG-IUS if heavy periods are a concern.', sw: 'Sababu ya kawaida zaidi ya kuondoa. Tumia ibuprofen/mefenamic acid kwa maumivu. Kutokwa damu nyingi kawaida hupungua baada ya miezi 3-6.' } },
        { effect: { en: 'Spotting between periods', sw: 'Madoa kati ya hedhi' }, normal: true, management: { en: 'Common in first 3-6 months after insertion. Usually resolves.', sw: 'Kawaida katika miezi 3-6 ya kwanza baada ya kuwekwa. Kawaida hupotea.' } },
      ],
      danger_signs: {
        title: { en: 'PAINS — Go to clinic IMMEDIATELY:', sw: 'PAINS — Nenda kliniki MARA MOJA:' },
        signs: [
          { en: 'P — Period late or missed (possible pregnancy)', sw: 'P — Hedhi imechelewa au kukosekana (ujauzito unaowezekana)' },
          { en: 'A — Abdominal pain (severe)', sw: 'A — Maumivu makali ya tumbo' },
          { en: 'I — Infection signs (fever, unusual discharge, odour)', sw: 'I — Dalili za maambukizi (homa, kutokwa damu isiyo ya kawaida, harufu mbaya)' },
          { en: 'N — Not feeling IUD strings', sw: 'N — Kushindwa kuhisi nyuzi za IUD' },
          { en: 'S — Spotting after sex or pain during sex', sw: 'S — Madoa baada ya ngono au maumivu wakati wa ngono' },
        ]
      },
      counselling_points: { en: ['Check strings monthly after period — place clean finger inside vagina', 'IUD is the most effective emergency contraception (>99%) within 5 days', 'Fertility returns immediately after removal', 'Does NOT protect against STIs — offer condoms', 'Postpartum IUD: insert within 48 hours OR wait until 4+ weeks'], sw: ['Angalia nyuzi kila mwezi baada ya hedhi', 'IUD ni uzazi wa mpango bora zaidi wa dharura (>99%) ndani ya siku 5', 'Uzazi hurudi mara moja baada ya kuondolewa', 'HAIZUII STI — toa kondomu', 'IUD ya baada ya kujifungua: weka ndani ya saa 48 AU subiri hadi wiki 4+'] },
      return_date: { en: 'Replace after 10-12 years. Annual check recommended.', sw: 'Badilisha baada ya miaka 10-12. Ukaguzi wa kila mwaka unapendekezwa.' }
    }
  },

  // ── LNG-IUS ────────────────────────────────────────────────────────────────
  {
    id: 'lng_ius',
    emoji: '🔩',
    category: { en: 'Long-Acting (LARC)', sw: 'Muda Mrefu (LARC)' },
    name: { en: 'LNG-IUS — Mirena (Hormonal IUD)', sw: 'LNG-IUS — Mirena (IUD ya Homoni)' },
    tagline: { en: 'Reduces periods, 5-7 years', sw: 'Hupunguza hedhi, miaka 5-7' },
    color: '#ea580c',
    efficacy: { perfect: '99.9%', typical: '99.9%' },
    duration: { en: '5-7 years (age dependent)', sw: 'Miaka 5-7 (inategemea umri)' },
    hormone: { en: 'Progestogen locally (levonorgestrel 52mg)', sw: 'Projestojeni ya ndani (levonorgestrel 52mg)' },
    protectsSTI: false,
    sections: {
      how_it_works: { en: 'T-shaped device releasing low-dose levonorgestrel locally into the uterus. Thickens cervical mucus (main mechanism), thins uterine lining, may suppress ovulation in some women.', sw: 'Kifaa chenye umbo la T kinachotoa levonorgestrel kidogo ndani ya mfuko wa uzazi. Hunenepesha kamasi ya seviksi (utaratibu mkuu), hupunguza unene wa ukuta wa mfuko wa uzazi, inaweza kuzuia ovulation kwa wanawake wengine.' },
      who_can_use: { en: ['Women with heavy periods (reduces bleeding by 90%)', 'Women with dysmenorrhoea', 'Endometriosis (non-contraceptive benefit)', 'Women who want long-acting hormonal protection'], sw: ['Wanawake wenye hedhi nzito (hupunguza kutokwa damu kwa 90%)', 'Wanawake wenye maumivu makali ya hedhi', 'Endometriosis', 'Wanawake wanaotaka ulinzi wa homoni wa muda mrefu'] },
      who_cannot_use: { en: ['Same contraindications as Cu-IUD plus breast cancer'], sw: ['Vizuizi sawa na Cu-IUD pamoja na saratani ya matiti'] },
      side_effects: [
        { effect: { en: 'Irregular spotting (first 3-6 months)', sw: 'Madoa yasiyokuwa ya kawaida (miezi 3-6 ya kwanza)' }, normal: true, management: { en: 'Very common initially then periods reduce significantly. Reassure.', sw: 'Kawaida sana mwanzoni kisha hedhi hupungua sana. Toa uhakika.' } },
        { effect: { en: 'Amenorrhoea (up to 20% at 1 year)', sw: 'Kutokuwa na hedhi (hadi 20% kwa mwaka 1)' }, normal: true, management: { en: 'Safe and normal. Blood is not accumulating.', sw: 'Salama na kawaida. Damu haikusanyiki.' } },
      ],
      danger_signs: { title: { en: 'PAINS (same as Cu-IUD):', sw: 'PAINS (sawa na Cu-IUD):' }, signs: [{ en: 'Period late, Abdominal pain, Infection, Not feeling strings, Spotting after sex', sw: 'Hedhi kuchelewa, Maumivu ya tumbo, Maambukizi, Kushindwa kuhisi nyuzi, Madoa baada ya ngono' }] },
      counselling_points: { en: ['Best choice for women with heavy periods', 'Hormonal IUD — not suitable for women who want hormone-free option', 'Fertility returns quickly after removal', 'Does NOT protect against STIs'], sw: ['Chaguo bora kwa wanawake wenye hedhi nzito', 'IUD ya homoni — si nzuri kwa wanawake wanaotaka bila homoni', 'Uzazi hurudi haraka baada ya kuondolewa', 'HAIZUII STI'] },
      return_date: { en: 'Replace after 5-7 years (7 years if inserted after age 45).', sw: 'Badilisha baada ya miaka 5-7 (miaka 7 ikiwa imewekwa baada ya umri wa miaka 45).' }
    }
  },

  // ── CONDOM MALE ────────────────────────────────────────────────────────────
  {
    id: 'condom_m',
    emoji: '🛡️',
    category: { en: 'Barrier Methods', sw: 'Njia za Kizuizi' },
    name: { en: 'Male Condom', sw: 'Kondomu ya Kiume' },
    tagline: { en: 'ONLY method protecting against HIV and STIs', sw: 'Njia PEKEE inayolinda dhidi ya VVU na STI' },
    color: '#0d7377',
    efficacy: { perfect: '98%', typical: '87%' },
    duration: { en: 'Single use', sw: 'Matumizi moja' },
    hormone: { en: 'None', sw: 'Hakuna' },
    protectsSTI: true,
    sections: {
      how_it_works: { en: 'A thin sheath worn over the penis during sex. Physically prevents sperm from entering the vagina. Also prevents exchange of body fluids, protecting against HIV and STIs.', sw: 'Ufuko mwembamba unaovaliwa kwenye uume wakati wa ngono. Huzuia kimwili manii kuingia kwenye uke. Pia huzuia kubadilishana kwa maji ya mwili, kulinda dhidi ya VVU na STI.' },
      who_can_use: { en: ['All sexually active people', 'Those at risk of STIs/HIV', 'As dual protection with another method'], sw: ['Watu wote wanaofanya ngono', 'Wale walio hatarini kupata STI/VVU', 'Kama ulinzi wa pande mbili na njia nyingine'] },
      who_cannot_use: { en: ['Latex allergy — use polyurethane/female condom instead'], sw: ['Mzio wa latex — tumia kondomu ya polyurethane/ya kike badala yake'] },
      side_effects: [{ effect: { en: 'Latex allergy (rare)', sw: 'Mzio wa latex (nadra)' }, normal: false, management: { en: 'Switch to non-latex (polyurethane) condom or female condom.', sw: 'Badilisha kwenda kondomu isiyo ya latex (polyurethane) au kondomu ya kike.' } }],
      how_to_use: {
        title: { en: 'How to Use Correctly', sw: 'Jinsi ya Kutumia Vizuri' },
        steps: {
          en: ['Check expiry date and look for air bubble (intact packaging)', 'Open carefully — do not use teeth or scissors', 'Place on erect penis before any sexual contact', 'Pinch the tip to remove air and leave space for semen', 'Roll down to the base of the penis', 'After sex, hold base and withdraw before penis softens', 'Remove carefully, wrap in tissue and dispose — do NOT flush', 'Use a new condom for each act of sex'],
          sw: ['Angalia tarehe ya kumalizika na puto ya hewa (ufungaji uliohifadhiwa)', 'Fungua kwa uangalifu — usitumie meno au mkasi', 'Weka kwenye uume ulioimarisha kabla ya mawasiliano yoyote ya ngono', 'Pinch ncha ili kuondoa hewa na kuacha nafasi ya manii', 'Viringisha hadi msingi wa uume', 'Baada ya ngono, shika msingi na jitoe kabla ya uume kulegea', 'Ondoa kwa uangalifu, funika na tishu na tupa — USISUKE', 'Tumia kondomu mpya kwa kila tendo la ngono']
        }
      },
      counselling_points: { en: ['ONLY method protecting against both pregnancy AND HIV/STIs', 'Dual protection — use WITH another method for best pregnancy AND STI protection', 'Store in cool dry place away from wallet (heat degrades latex)', 'Do NOT use two condoms at once (increased friction = breakage)', 'Use water-based lubricant — NOT oil-based (oil degrades latex)'], sw: ['Njia PEKEE inayolinda dhidi ya ujauzito NA VVU/STI', 'Ulinzi wa pande mbili — tumia NA njia nyingine kwa ulinzi bora', 'Hifadhi mahali pa baridi na kavu mbali na mkoba (joto hudhuru latex)', 'USITUMIE kondomu mbili mara moja', 'Tumia lubricant ya maji — SI ya mafuta'] },
      return_date: { en: 'Resupply as needed. Available free at health facilities.', sw: 'Jaza unavyohitajika. Inapatikana bure katika vituo vya afya.' }
    }
  },

  // ── EC PILL ────────────────────────────────────────────────────────────────
  {
    id: 'ec_pill',
    emoji: '🆘',
    category: { en: 'Emergency Contraception', sw: 'Uzazi wa Mpango wa Dharura' },
    name: { en: 'Emergency Contraceptive Pill (ECP)', sw: 'Kidonge cha Dharura (ECP)' },
    tagline: { en: 'After unprotected sex — within 72-120 hours', sw: 'Baada ya ngono bila kinga — ndani ya masaa 72-120' },
    color: '#dc2626',
    efficacy: { perfect: '85-99%', typical: '85-99%' },
    duration: { en: 'Single use (not regular contraception)', sw: 'Matumizi moja (si uzazi wa mpango wa kawaida)' },
    hormone: { en: 'Levonorgestrel 1.5mg (Postinor-2)', sw: 'Levonorgestrel 1.5mg (Postinor-2)' },
    protectsSTI: false,
    sections: {
      how_it_works: { en: 'Prevents or delays ovulation. May prevent fertilisation. Does NOT cause abortion — it cannot interrupt an established pregnancy. Most effective the sooner it is taken after unprotected sex.', sw: 'Huzuia au kuchelewesha ovulation. Inaweza kuzuia mbolea. HAIFANYI kutoa mimba — haiwezi kukatiza ujauzito uliopo. Ni bora zaidi inavyochukuliwa mapema baada ya ngono bila kinga.' },
      who_can_use: { en: ['Any woman after unprotected sex or contraceptive failure', 'After sexual assault', 'When regular method failed (burst condom, missed pills)'], sw: ['Mwanamke yeyote baada ya ngono bila kinga au kushindwa kwa njia ya uzazi wa mpango', 'Baada ya ubakaji', 'Wakati njia ya kawaida ilishindwa (kondomu ilipasuka, kukosa vidonge)'] },
      timing: {
        title: { en: 'Timing — The Earlier the Better', sw: 'Wakati — Mapema Ni Bora' },
        rules: {
          en: ['< 24 hours: 95% effective', '24-48 hours: 85% effective', '48-72 hours: 58% effective', '72-120 hours: Still has some effectiveness — TAKE IT', 'Cu-IUD: Most effective option within 5 days (>99%)'],
          sw: ['< masaa 24: Ufanisi wa 95%', 'Masaa 24-48: Ufanisi wa 85%', 'Masaa 48-72: Ufanisi wa 58%', 'Masaa 72-120: Bado ina ufanisi kidogo — ICHUKUE', 'Cu-IUD: Chaguo bora ndani ya siku 5 (>99%)']
        }
      },
      side_effects: [{ effect: { en: 'Nausea, vomiting, headache, irregular bleeding', sw: 'Kichefuchefu, kutapika, maumivu ya kichwa, kutokwa damu bila mpangilio' }, normal: true, management: { en: 'If vomiting within 2 hours of taking pill, take another dose. Next period may be early, late, or heavier.', sw: 'Ikiwa utatapika ndani ya masaa 2 ya kuchukua kidonge, chukua dozi nyingine. Hedhi ijayo inaweza kuwa mapema, baadaye, au nzito zaidi.' } }],
      counselling_points: { en: ['ECP does NOT protect against STIs', 'NOT intended as regular contraception — discuss ongoing method', 'Pregnancy test if no period within 3-4 weeks', 'Cu-IUD is more effective and can provide ongoing contraception', 'Does NOT cause abortion — safe to take'], sw: ['ECP HAIZUII STI', 'HAIKUSUDIWA kama uzazi wa mpango wa kawaida — jadili njia inayoendelea', 'Fanya mtihani wa ujauzito ikiwa hakuna hedhi ndani ya wiki 3-4', 'Cu-IUD ni bora zaidi na inaweza kutoa uzazi wa mpango unaoendelea', 'HAIFANYI kutoa mimba — salama kuchukua'] },
      return_date: { en: 'Single use only. Start regular contraception immediately after.', sw: 'Matumizi moja tu. Anza uzazi wa mpango wa kawaida mara moja baada yake.' }
    }
  },

  // ── LAM ────────────────────────────────────────────────────────────────────
  {
    id: 'lam',
    emoji: '🤱',
    category: { en: 'Natural Family Planning', sw: 'Uzazi wa Mpango wa Asili' },
    name: { en: 'LAM — Lactational Amenorrhoea Method', sw: 'LAM — Njia ya Kunyonyesha' },
    tagline: { en: 'Breastfeeding as contraception — when criteria met', sw: 'Kunyonyesha kama uzazi wa mpango — ikiwa masharti yanakutana' },
    color: '#f59e0b',
    efficacy: { perfect: '99%', typical: '98%' },
    duration: { en: 'Up to 6 months postpartum (all 3 criteria must be met)', sw: 'Hadi miezi 6 baada ya kujifungua (masharti yote 3 lazima yakutane)' },
    hormone: { en: 'None (natural)', sw: 'Hakuna (asili)' },
    protectsSTI: false,
    sections: {
      how_it_works: { en: 'Frequent breastfeeding suppresses ovulation through elevated prolactin levels. Only effective when ALL 3 criteria are met simultaneously.', sw: 'Kunyonyesha mara kwa mara huzuia ovulation kupitia viwango vya juu vya prolactin. Ni bora tu wakati MASHARTI YOTE 3 yanakutana wakati mmoja.' },
      lam_criteria: {
        title: { en: '⚠️ ALL 3 Must Be True Simultaneously', sw: '⚠️ YOTE 3 Lazima Yawe Kweli Wakati Mmoja' },
        criteria: {
          en: ['1. Baby is LESS THAN 6 months old', '2. Mother is fully or nearly-fully breastfeeding (feeding day AND night, max 4-hour gap during day, max 6-hour gap at night)', '3. Monthly periods have NOT returned'],
          sw: ['1. Mtoto ana UMRI WA CHINI YA MIEZI 6', '2. Mama ananyonyesha kikamilifu au karibu kikamilifu (kunyonyesha mchana NA usiku, pengo la juu la masaa 4 mchana, masaa 6 usiku)', '3. Hedhi ya kila mwezi HAIJATOKEA BADO']
        }
      },
      who_can_use: { en: ['Postpartum women meeting all 3 LAM criteria', 'Women who want a natural, hormone-free method temporarily'], sw: ['Wanawake wa baada ya kujifungua wanaokutana na masharti yote 3 ya LAM', 'Wanawake wanaotaka njia ya asili ya muda mfupi bila homoni'] },
      side_effects: [{ effect: { en: 'No side effects', sw: 'Hakuna madhara' }, normal: true, management: { en: 'Natural method with no hormonal side effects.', sw: 'Njia ya asili bila madhara ya homoni.' } }],
      counselling_points: { en: ['START ANOTHER METHOD IMMEDIATELY if ANY criterion no longer met', 'Supplemental feeding or long sleep gaps reduce efficacy', 'Plan transition to another method before 6 months', 'Does NOT protect against STIs'], sw: ['ANZA NJIA NYINGINE MARA MOJA ikiwa SHARTI LOLOTE halikutanikani tena', 'Kulisha kwa ziada au pengo refu la kulala hupunguza ufanisi', 'Panga mpito kwenda njia nyingine kabla ya miezi 6', 'HAIZUII STI'] },
      return_date: { en: 'Transition to another method before baby reaches 6 months or if any LAM criterion fails.', sw: 'Badilika kwenda njia nyingine kabla mtoto hajafikia miezi 6 au ikiwa sharti lolote la LAM linashindwa.' }
    }
  },

  // ── BTL ────────────────────────────────────────────────────────────────────
  {
    id: 'btl',
    emoji: '♾️',
    category: { en: 'Permanent Methods', sw: 'Njia za Kudumu' },
    name: { en: 'Female Sterilisation (BTL)', sw: 'Kufunga Mirija (BTL)' },
    tagline: { en: 'Permanent — for women who are certain they are done', sw: 'Ya kudumu — kwa wanawake wanaohakika wamemaliza kuzaa' },
    color: '#374151',
    efficacy: { perfect: '99.5%', typical: '99.5%' },
    duration: { en: 'Permanent', sw: 'Ya kudumu' },
    hormone: { en: 'None', sw: 'Hakuna' },
    protectsSTI: false,
    sections: {
      how_it_works: { en: 'Surgical procedure that closes or blocks the fallopian tubes, preventing eggs from meeting sperm. Done under local or general anaesthesia. Mini-laparotomy (mini-lap) is most common method in Kenya.', sw: 'Utaratibu wa upasuaji unaofunga au kuzuia mirija ya fallopian, kuzuia mayai kukutana na manii. Inafanywa chini ya dawa ya ganzi ya ndani au ya jumla. Mini-laparotomy (mini-lap) ni njia ya kawaida zaidi Kenya.' },
      who_can_use: { en: ['Women who are certain they do not want more children', 'Women who have completed their desired family size', 'Women for whom pregnancy would be a serious health risk'], sw: ['Wanawake wanaohakika hawataki watoto zaidi', 'Wanawake waliokamilisha ukubwa wa familia wanayotaka', 'Wanawake ambao ujauzito ungekuwa hatari kubwa kiafya'] },
      who_cannot_use: { en: ['Women uncertain about future fertility desires', 'Acute pelvic infection', 'Conditions that increase surgical risk'], sw: ['Wanawake wasio na uhakika kuhusu matakwa ya uzazi ya siku zijazo', 'Maambukizi ya pelvis ya papo hapo', 'Hali zinazoongeza hatari ya upasuaji'] },
      side_effects: [{ effect: { en: 'Surgical risks (very low)', sw: 'Hatari za upasuaji (ndogo sana)' }, normal: false, management: { en: 'Infection, bleeding, anaesthesia risks are rare but possible. Performed by trained surgeon in facility with theatre capacity.', sw: 'Maambukizi, kutokwa damu, hatari za dawa ya ganzi ni nadra lakini zinawezekana.' } }],
      counselling_points: { en: ['PERMANENT — counsel extensively before procedure', 'Reversal is possible but expensive and not always successful', 'No hormones — periods continue normally', 'Does NOT protect against STIs', 'Requires informed consent — no coercion ever'], sw: ['YA KUDUMU — toa ushauri kwa kina kabla ya utaratibu', 'Kufungua tena kunawezekana lakini ni ghali na si mara zote bora', 'Hakuna homoni — hedhi inaendelea kawaida', 'HAIZUII STI', 'Inahitaji idhini ya kujua — bila shuruti kamwe'] },
      return_date: { en: 'No return visit needed for contraception. Post-operative follow-up at 1 week.', sw: 'Hakuna ziara ya kurudi kwa uzazi wa mpango. Ufuatiliaji wa baada ya upasuaji kwa wiki 1.' }
    }
  },
]

// ── CATEGORY LIST ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',       en: 'All Methods',              sw: 'Njia Zote' },
  { id: 'inj',       en: 'Injectables',               sw: 'Sindano' },
  { id: 'pills',     en: 'Pills',                     sw: 'Vidonge' },
  { id: 'larc',      en: 'Long-Acting (LARC)',        sw: 'Muda Mrefu (LARC)' },
  { id: 'barrier',   en: 'Barrier',                   sw: 'Kizuizi' },
  { id: 'emergency', en: 'Emergency',                 sw: 'Dharura' },
  { id: 'natural',   en: 'Natural / Permanent',       sw: 'Asili / Kudumu' },
]

const categoryMatch = (method, catId) => {
  if (catId === 'all') return true
  const cat = method.category.en.toLowerCase()
  if (catId === 'inj')       return cat.includes('inject')
  if (catId === 'pills')     return cat.includes('pill')
  if (catId === 'larc')      return cat.includes('long')
  if (catId === 'barrier')   return cat.includes('barrier')
  if (catId === 'emergency') return cat.includes('emergency')
  if (catId === 'natural')   return cat.includes('natural') || cat.includes('permanent')
  return false
}

// ── METHOD DETAIL VIEW ─────────────────────────────────────────────────────────
function MethodDetail({ method, lang, onBack }) {
  const [openSection, setOpenSection] = useState('how_it_works')
  const s = method.sections

  const Section = ({ id, title, children }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpenSection(openSection === id ? null : id)}>
        <p className="font-bold text-gray-800 text-sm">{title}</p>
        {openSection === id
          ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0"/>
          : <ChevronDown size={16} className="text-gray-400 flex-shrink-0"/>}
      </button>
      {openSection === id && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14}/> {lang === 'sw' ? 'Rudi kwenye orodha' : 'Back to list'}
      </button>

      {/* Method header */}
      <div className="rounded-2xl p-5 text-white shadow-lg" style={{background: `linear-gradient(135deg,${method.color},${method.color}cc)`}}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{method.emoji}</span>
          <div>
            <p className="text-xs font-bold opacity-80 uppercase tracking-wide">{method.category[lang]}</p>
            <h2 className="font-bold text-lg leading-tight">{method.name[lang]}</h2>
            <p className="text-sm opacity-90 mt-0.5">{method.tagline[lang]}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-white/20 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black">{method.efficacy.perfect}</p>
            <p className="text-xs opacity-80">{lang === 'sw' ? 'Matumizi Bora' : 'Perfect Use'}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black">{method.efficacy.typical}</p>
            <p className="text-xs opacity-80">{lang === 'sw' ? 'Matumizi ya Kawaida' : 'Typical Use'}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-2.5 text-center">
            <p className="text-xs font-bold leading-tight">{method.duration[lang]}</p>
            <p className="text-xs opacity-80 mt-0.5">{lang === 'sw' ? 'Muda' : 'Duration'}</p>
          </div>
        </div>
        {method.protectsSTI && (
          <div className="mt-3 bg-green-400/30 border border-green-400/50 rounded-xl px-3 py-2">
            <p className="text-xs font-bold">✅ {lang === 'sw' ? 'Inalinda dhidi ya VVU na STI' : 'Protects against HIV and STIs'}</p>
          </div>
        )}
        {!method.protectsSTI && (
          <div className="mt-3 bg-red-400/20 border border-red-400/30 rounded-xl px-3 py-2">
            <p className="text-xs">⚠️ {lang === 'sw' ? 'HAIZUII VVU/STI — tumia kondomu pia' : 'Does NOT protect against HIV/STIs — use condoms too'}</p>
          </div>
        )}
      </div>

      {/* Hormone info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-500">{lang === 'sw' ? 'Homoni:' : 'Hormone:'} <span className="font-semibold text-gray-700">{method.hormone[lang]}</span></p>
      </div>

      {/* How it works */}
      <Section id="how_it_works" title={lang === 'sw' ? '🔬 Jinsi Inavyofanya Kazi' : '🔬 How It Works'}>
        <p className="text-sm text-gray-700 leading-relaxed mt-3">{s.how_it_works[lang]}</p>
      </Section>

      {/* MAPS steps for DMPA-SC */}
      {s.maps_steps && (
        <Section id="maps" title={lang === 'sw' ? '💉 Hatua za MAPS — Kujisindania' : '💉 MAPS Self-Injection Steps'}>
          <div className="space-y-4 mt-3">
            {s.maps_steps.steps.map((step, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-3 bg-gray-50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                    style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
                    {step.letter}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{step.word[lang]}</p>
                    <p className="text-xs text-gray-400">{lang === 'sw' ? `Hatua ${i+1} ya 4` : `Step ${i+1} of 4`} {step.icon}</p>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm text-gray-700">{step.detail[lang]}</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-700">💡 {step.tip[lang]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* SI Training Checklist */}
      {s.si_training_checklist && (
        <Section id="si_checklist" title={lang === 'sw' ? '✅ Orodha ya Mafunzo ya SI' : '✅ SI Training Checklist'}>
          <div className="space-y-2 mt-3">
            {s.si_training_checklist.items[lang].map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="w-5 h-5 rounded border-2 border-green-400 flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-green-800">{item}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Who can use */}
      <Section id="who_can" title={lang === 'sw' ? '✅ Nani Anaweza Kutumia' : '✅ Who Can Use'}>
        <div className="mt-3 space-y-2">
          {(Array.isArray(s.who_can_use) ? s.who_can_use : s.who_can_use[lang]).map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
              <p className="text-sm text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Who cannot use */}
      <Section id="who_cannot" title={lang === 'sw' ? '❌ Nani Hawezi Kutumia (WHO MEC)' : '❌ Who Cannot Use (WHO MEC)'}>
        <div className="mt-3 space-y-2">
          {(Array.isArray(s.who_cannot_use) ? s.who_cannot_use : s.who_cannot_use[lang]).map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5 flex-shrink-0">✗</span>
              <p className="text-sm text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Side effects */}
      <Section id="side_effects" title={lang === 'sw' ? '⚠️ Madhara na Usimamizi' : '⚠️ Side Effects & Management'}>
        <div className="mt-3 space-y-3">
          {s.side_effects.map((se, i) => (
            <div key={i} className={`rounded-xl p-3 border ${se.normal ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${se.normal ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'}`}>
                  {se.normal ? (lang === 'sw' ? 'Kawaida' : 'Normal') : (lang === 'sw' ? 'Hatari' : 'Danger')}
                </span>
                <p className="text-sm font-semibold text-gray-800">{se.effect[lang]}</p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{se.management[lang]}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Danger signs */}
      {s.danger_signs && (
        <Section id="danger" title={lang === 'sw' ? '🚨 Ishara za Hatari' : '🚨 Danger Signs'}>
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-bold text-red-700 mb-3">{s.danger_signs.title[lang]}</p>
            {s.danger_signs.signs.map((sign, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <span className="text-red-500 flex-shrink-0 font-bold">!</span>
                <p className="text-sm text-red-700">{sign[lang]}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Missed dose */}
      {s.missed_dose && (
        <Section id="missed" title={lang === 'sw' ? '🔔 Kukosa Dozi' : '🔔 Missed Dose Guidance'}>
          <div className="mt-3 space-y-2">
            {s.missed_dose.rules[lang].map((rule, i) => (
              <div key={i} className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                <p className="text-sm text-blue-800">{rule}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* EC timing */}
      {s.timing && (
        <Section id="timing" title={lang === 'sw' ? '⏰ Wakati wa Kuchukua' : '⏰ Timing Guide'}>
          <div className="mt-3 space-y-2">
            {s.timing.rules[lang].map((rule, i) => (
              <div key={i} className={`rounded-xl px-3 py-2 border ${i === 0 ? 'bg-green-50 border-green-200' : i <= 2 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-sm font-medium">{rule}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* LAM criteria */}
      {s.lam_criteria && (
        <Section id="lam" title={lang === 'sw' ? '⚠️ Masharti ya LAM (YOTE 3 Lazima)' : '⚠️ LAM Criteria (ALL 3 Required)'}>
          <div className="mt-3 space-y-2">
            {s.lam_criteria.criteria[lang].map((c, i) => (
              <div key={i} className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-amber-800">{c}</p>
              </div>
            ))}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
              <p className="text-xs text-red-700 font-medium">
                {lang === 'sw'
                  ? '⚠️ Ikiwa sharti LOLOTE halikutanikani tena — ANZA NJIA NYINGINE MARA MOJA'
                  : '⚠️ If ANY criterion no longer met — START ANOTHER METHOD IMMEDIATELY'}
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* How to use (condom) */}
      {s.how_to_use && (
        <Section id="how_use" title={lang === 'sw' ? '📋 Jinsi ya Kutumia' : '📋 How to Use'}>
          <ol className="mt-3 space-y-2">
            {s.how_to_use.steps[lang].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                <p className="text-sm text-gray-700">{step}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Counselling points */}
      <Section id="counselling" title={lang === 'sw' ? '💬 Pointi za Ushauri (BCS+)' : '💬 Counselling Points (BCS+)'}>
        <div className="mt-3 space-y-2">
          {(Array.isArray(s.counselling_points) ? s.counselling_points : s.counselling_points[lang]).map((pt, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-teal-500 flex-shrink-0 mt-0.5">→</span>
              <p className="text-sm text-gray-700">{pt}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Return date */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">
          {lang === 'sw' ? 'Tarehe ya Kurudi' : 'Return Date'}
        </p>
        <p className="text-sm text-teal-900">{s.return_date[lang]}</p>
      </div>
    </div>
  )
}

export { METHODS_DB, CATEGORIES, categoryMatch, MethodDetail }