// Comprehensive method information — WHO MEC 6th Ed (2025) + Kenya National FP Guidelines
// BCS+ Method Cards + Brochure content

export const METHOD_DETAILS = {

  COC: {
    id: 'COC',
    name: 'Combined Oral Contraceptive',
    abbr: 'COC',
    emoji: '💊',
    category: 'Hormonal — Daily Pill',
    efficacy_perfect: 99.7,
    efficacy_typical: 93,
    duration: 'Daily — no long-term protection',
    reversibility: 'Immediate on stopping',
    stis_protection: false,
    requires_provider: false,

    mechanism: [
      'Prevents ovulation by suppressing FSH and LH hormones',
      'Thickens cervical mucus — prevents sperm penetration',
      'Thins the uterine lining — reduces implantation likelihood',
    ],

    contraceptive_benefits: [
      'Highly effective when taken correctly and consistently',
      'Periods become regular, lighter and less painful',
      'Reduces symptoms of PMS',
      'Can be used to manage endometriosis',
      'Reduces risk of ovarian cysts',
    ],

    non_contraceptive_benefits: [
      'Reduces risk of ovarian cancer by up to 50%',
      'Reduces risk of endometrial cancer',
      'Treats acne and reduces excess hair (certain formulations)',
      'Protects against pelvic inflammatory disease (PID)',
      'Reduces risk of ectopic pregnancy',
      'Improves bone density in some women',
    ],

    side_effects: [
      'Nausea (especially first few months)',
      'Breast tenderness',
      'Headaches',
      'Spotting between periods',
      'Mood changes',
      'Decreased libido',
      'Weight changes (rare)',
    ],

    danger_signs: {
      acronym: 'ACHES',
      title: 'ACHES Warning Signs',
      signs: [
        { letter: 'A', word: 'Abdominal pain', detail: 'Severe abdominal pain — possible blood clot or liver problem' },
        { letter: 'C', word: 'Chest pain', detail: 'Chest pain or shortness of breath — possible blood clot in lung' },
        { letter: 'H', word: 'Headaches', detail: 'Severe headache, dizziness, weakness, numbness — possible stroke' },
        { letter: 'E', word: 'Eye problems', detail: 'Vision loss or blurring — possible clot in eye' },
        { letter: 'S', word: 'Severe leg pain', detail: 'Severe calf or thigh pain — possible DVT (deep vein thrombosis)' },
      ]
    },

    how_to_use: [
      'Take one pill every day at the same time',
      'Start on day 1 of your period for immediate protection',
      'Take pills in order — do not skip',
      '21-day pack: take 21 pills, then 7-day break',
      '28-day pack: take all 28 pills continuously',
      'If you miss a pill: take it as soon as you remember',
      'If you miss 2+ pills: use condoms for 7 days',
    ],

    counselling_points: [
      'Must be taken EVERY DAY at the SAME TIME',
      'Less effective if you have vomiting or diarrhoea',
      'Some medications reduce effectiveness (rifampicin, some anticonvulsants)',
      'Does NOT protect against STIs — use condoms if at risk',
      'Return to fertility is immediate after stopping',
      'Smoking increases risk of blood clots — advise strongly against smoking',
    ],

    return_date: '3 months (for resupply)',
    follow_up: 'Return in 3 months or sooner if side effects',

    who_can_use: 'Most healthy women. Not recommended for smokers ≥35 years, women with hypertension, migraine with aura, or history of clots.',
    who_cannot_use: 'Pregnant women, breastfeeding <6 weeks, smokers ≥35 years, hypertension ≥160/100, migraine with aura, history of DVT/PE, current breast cancer, severe liver disease.',
  },

  POP: {
    id: 'POP',
    name: 'Progestogen-Only Pill (Mini-Pill)',
    abbr: 'POP',
    emoji: '💊',
    category: 'Hormonal — Daily Pill',
    efficacy_perfect: 99.7,
    efficacy_typical: 93,
    duration: 'Daily — no long-term protection',
    reversibility: 'Immediate on stopping',
    stis_protection: false,
    requires_provider: false,

    mechanism: [
      'Primarily thickens cervical mucus — blocks sperm',
      'Suppresses ovulation in about 50% of cycles',
      'Thins the uterine lining',
    ],

    contraceptive_benefits: [
      'Safe for breastfeeding mothers (oestrogen-free)',
      'Can be used immediately postpartum',
      'Suitable for women who cannot take oestrogen',
      'Fewer cardiovascular risks than COC',
    ],

    non_contraceptive_benefits: [
      'May reduce menstrual pain and bleeding',
      'Safe for women with hypertension',
      'Safe for women with migraine (even with aura)',
      'Safe for women with sickle cell disease',
    ],

    side_effects: [
      'Irregular bleeding or spotting (very common)',
      'Amenorrhoea (no periods)',
      'Headaches',
      'Breast tenderness',
      'Mood changes',
    ],

    danger_signs: null,

    how_to_use: [
      'Take one pill every day — NO BREAK between packs',
      'MUST be taken within the same 3-hour window daily',
      'Start on day 1 of period for immediate protection',
      'If more than 3 hours late — use condoms for 48 hours',
    ],

    counselling_points: [
      'Timing is CRITICAL — must be taken within 3 hours daily',
      'Irregular bleeding is very common and normal',
      'If no periods — reassure client this is normal and safe',
      'Does not protect against STIs',
    ],

    return_date: '3 months (for resupply)',
    follow_up: 'Return in 3 months or if concerns',
    who_can_use: 'Most women including breastfeeding mothers, women with hypertension, migraine, cardiovascular risk factors.',
    who_cannot_use: 'Current breast cancer, severe liver disease, unexplained vaginal bleeding.',
  },

  DMPA_IM: {
    id: 'DMPA_IM',
    name: 'DMPA Injection — Depo-Provera',
    abbr: 'DMPA-IM',
    emoji: '💉',
    category: 'Hormonal — Injection',
    efficacy_perfect: 99.8,
    efficacy_typical: 97,
    duration: '12 weeks (3 months)',
    reversibility: 'Return to fertility may take 6–18 months',
    stis_protection: false,
    requires_provider: true,

    mechanism: [
      'Suppresses ovulation by preventing LH surge',
      'Thickens cervical mucus',
      'Thins the uterine lining',
    ],

    contraceptive_benefits: [
      'Very effective with typical use',
      'Private — no daily pills to remember',
      'Does not interfere with sex',
      'Can be used by breastfeeding mothers (after 6 weeks)',
      'Reduces sickle cell crises',
      'Reduces seizures in epileptic women',
    ],

    non_contraceptive_benefits: [
      'Dramatically reduces menstrual bleeding — leads to amenorrhoea',
      'Reduces risk of endometrial cancer by up to 80%',
      'Reduces painful periods (dysmenorrhoea)',
      'Reduces risk of PID',
      'Reduces sickle cell anaemia symptoms',
      'May reduce seizure frequency in epilepsy',
    ],

    side_effects: [
      'Irregular bleeding/spotting (first 3–6 months)',
      'Amenorrhoea (no periods) — common after 1 year',
      'Weight gain (possible)',
      'Headaches',
      'Dizziness',
      'Delayed return to fertility (6–18 months after stopping)',
      'Possible temporary reduction in bone density',
    ],

    danger_signs: null,

    how_to_use: [
      'Injected into muscle (gluteal or deltoid) by provider',
      'Given every 12 weeks (84 days)',
      'Late injection allowed up to 4 weeks (week 16)',
      'First injection: ideally within first 7 days of period',
    ],

    counselling_points: [
      'Irregular bleeding is VERY COMMON in first 3–6 months — reassure client',
      'Amenorrhoea after 1 year is NORMAL and SAFE',
      'Return to fertility may be delayed up to 18 months',
      'NOT suitable if planning pregnancy in next 1–2 years',
      'Does not protect against STIs',
      'Return EVERY 12 WEEKS for injection',
    ],

    return_date: '12 weeks (up to 16 weeks maximum)',
    follow_up: 'Every 12 weeks for injection',
    who_can_use: 'Most women. Excellent for breastfeeding mothers (after 6 weeks), epileptics, sickle cell disease.',
    who_cannot_use: 'Current breast cancer, unexplained vaginal bleeding (before evaluation), severe liver disease, women planning pregnancy within 2 years.',
  },

  DMPA_SC: {
    id: 'DMPA_SC',
    name: 'DMPA-SC — Sayana Press',
    abbr: 'DMPA-SC',
    emoji: '💉',
    category: 'Hormonal — Subcutaneous Injection',
    efficacy_perfect: 99.8,
    efficacy_typical: 97,
    duration: '13 weeks (3 months)',
    reversibility: 'Return to fertility may take 6–18 months',
    stis_protection: false,
    requires_provider: false, // Can be self-injected

    mechanism: [
      'Suppresses ovulation by preventing LH surge',
      'Thickens cervical mucus',
      'Thins uterine lining',
    ],

    contraceptive_benefits: [
      'Same efficacy as DMPA-IM',
      'Can be self-injected at home (SI clients)',
      'Smaller needle — subcutaneous (under skin), not muscle',
      'All-in-one device — prefilled, autodisable',
      'Reduces clinic visits for SI clients',
      'Increases women\'s autonomy and privacy',
    ],

    non_contraceptive_benefits: [
      'Same as DMPA-IM',
      'Particularly empowering for women in remote areas',
      'Reduces barriers to contraceptive access',
    ],

    side_effects: [
      'Same as DMPA-IM',
      'Injection site reactions (bruising, swelling) more common than IM',
    ],

    danger_signs: {
      acronym: null,
      title: '⚠️ Self-Injection Warning Signs',
      signs: [
        { letter: '1', word: 'Infection at injection site', detail: 'Redness, swelling, pus, or fever after injection — seek care' },
        { letter: '2', word: 'Allergic reaction', detail: 'Rash, difficulty breathing, severe swelling — seek emergency care' },
        { letter: '3', word: 'Missed injection', detail: 'If more than 16 weeks since last injection — use backup method and come to clinic' },
        { letter: '4', word: 'Pregnancy signs', detail: 'Missed period + nausea/vomiting — take pregnancy test' },
      ]
    },

    self_injection_steps: [
      'Wash hands thoroughly with soap and water',
      'Check expiry date on the Sayana Press device',
      'Remove the needle cap — do not touch the needle',
      'Pinch a fold of skin on the belly (2 inches from navel) or upper thigh',
      'Insert the needle at 45° angle into the pinched skin fold',
      'Press the plunger slowly until the device is empty',
      'Remove the needle and apply light pressure — do not rub',
      'Dispose of device in a sharps container or puncture-proof container',
      'Record the date and calculate your next injection date (13 weeks)',
    ],

    video_resources: [
      {
        title: 'How to Self-Inject DMPA-SC / Sayana Press (English)',
        url: 'https://www.youtube.com/watch?v=KI4eZniwmkA',
        source: 'PATH / Kenya MOH',
        duration: '5 min',
      },
      {
        title: 'DMPA-SC Health Worker Training Resources',
        url: 'https://fpoptions.org/resource/training-videos/',
        source: 'PATH / FPoptions.org',
        duration: '7 min',
      },
    ],

    how_to_use: [
      'Inject into fat layer under skin of abdomen or upper thigh',
      'Given every 13 weeks (91 days)',
      'Late injection allowed up to week 17',
      'PA mode: Provider injects at clinic',
      'SI mode: Client self-injects at home after training',
    ],

    counselling_points: [
      'Self-injection requires training — ensure competence before sending home',
      'Give take-home doses only after successful supervised injection',
      'Client must know how to dispose of sharps safely',
      'Return to clinic if any injection site problems',
      'Same side effect profile as DMPA-IM',
      'Irregular bleeding very common in first 3 months',
    ],

    return_date: '13 weeks (up to 17 weeks maximum)',
    follow_up: 'Every 13 weeks. For SI clients — check-in at 6 months.',
    who_can_use: 'Same as DMPA-IM. Ideal for clients who want self-injection option.',
    who_cannot_use: 'Same as DMPA-IM. Not suitable for clients unable or unwilling to self-inject safely.',
  },

  NET_EN: {
    id: 'NET_EN',
    name: 'NET-EN (Noristerat)',
    abbr: 'NET-EN',
    emoji: '💉',
    category: 'Hormonal — Injection',
    efficacy_perfect: 99.6,
    efficacy_typical: 97,
    duration: '8 weeks (2 months)',
    reversibility: 'Return to fertility: 3–6 months',
    stis_protection: false,
    requires_provider: true,

    mechanism: [
      'Suppresses ovulation',
      'Thickens cervical mucus',
      'Alters uterine lining',
    ],

    contraceptive_benefits: [
      'More frequent dosing than DMPA — faster return to fertility',
      'Good option for women who want injectable but plan pregnancy sooner',
    ],

    non_contraceptive_benefits: [
      'Reduces menstrual bleeding and pain',
      'Fewer bone density concerns than DMPA',
    ],

    side_effects: [
      'Irregular bleeding (common)',
      'Weight changes',
      'Headaches',
      'More frequent clinic visits required (every 8 weeks)',
    ],

    danger_signs: null,

    how_to_use: [
      'Injected into muscle by provider',
      'Given every 8 weeks (56 days)',
      'Late injection grace period: up to 2 weeks',
    ],

    counselling_points: [
      'Must return every 8 weeks — more visits than DMPA',
      'Faster return to fertility than DMPA if planning pregnancy',
      'Irregular bleeding common in first months',
    ],

    return_date: '8 weeks',
    follow_up: 'Every 8 weeks for injection',
    who_can_use: 'Most women. Good for women wanting injectable with faster fertility return.',
    who_cannot_use: 'Current breast cancer, unexplained vaginal bleeding, severe liver disease.',
  },

  IMPLANT: {
    id: 'IMPLANT',
    name: 'Contraceptive Implant',
    abbr: 'Implant',
    emoji: '🩹',
    category: 'Hormonal — Long-Acting (LARC)',
    efficacy_perfect: 99.95,
    efficacy_typical: 99.95,
    duration: '3 years (Implanon) / 5 years (Jadelle)',
    reversibility: 'Immediate on removal',
    stis_protection: false,
    requires_provider: true,

    mechanism: [
      'Suppresses ovulation primarily',
      'Thickens cervical mucus',
      'Thins uterine lining',
    ],

    contraceptive_benefits: [
      'Most effective reversible contraceptive available',
      'Nothing to remember — inserted once, works for years',
      'Immediate protection (if inserted within first 7 days of cycle)',
      'Rapid return to fertility after removal',
    ],

    non_contraceptive_benefits: [
      'Dramatically reduces menstrual pain and bleeding',
      'Treats endometriosis',
      'Reduces risk of ectopic pregnancy',
      'Reduces risk of PID',
    ],

    side_effects: [
      'Irregular bleeding — very common (most common reason for removal)',
      'Headaches',
      'Acne',
      'Breast tenderness',
      'Mood changes',
      'Weight gain (possible)',
      'Ovarian cysts (usually resolve without treatment)',
    ],

    danger_signs: {
      acronym: null,
      title: '⚠️ Implant Warning Signs — Seek Care If:',
      signs: [
        { letter: '1', word: 'Arm pain or infection', detail: 'Pain, redness, swelling, discharge at insertion site — possible infection' },
        { letter: '2', word: 'Implant felt moving', detail: 'If you can feel the rod has moved — do not try to remove yourself' },
        { letter: '3', word: 'Implant cannot be felt', detail: 'Cannot feel the rod — come to clinic for check' },
        { letter: '4', word: 'Pregnancy signs', detail: 'Any signs of pregnancy — seek care immediately, rule out ectopic' },
        { letter: '5', word: 'Severe arm pain', detail: 'Persistent severe arm pain after insertion — seek review' },
      ]
    },

    how_to_use: [
      'Inserted under the skin of the inner upper arm by a trained provider',
      'Local anaesthetic given before insertion',
      'Implanon: 1 rod — effective for 3 years',
      'Jadelle: 2 rods — effective for 5 years',
      'Can feel the rod(s) under the skin — this is normal',
      'Removal also requires trained provider',
    ],

    counselling_points: [
      'Irregular bleeding is the MOST COMMON side effect',
      'Reassure client that irregular bleeding is NOT harmful',
      'Do not try to remove the implant yourself',
      'Keep insertion site dry and clean for 3–5 days',
      'Can check rod is in place by feeling arm',
      'Does not protect against STIs',
      'Return to fertility is immediate after removal',
    ],

    return_date: '3 years (Implanon) or 5 years (Jadelle)',
    follow_up: 'Return if side effects or before expiry date',
    who_can_use: 'Most women. Excellent for women wanting long-term but reversible contraception.',
    who_cannot_use: 'Current breast cancer, unexplained vaginal bleeding (before evaluation), severe liver disease.',
  },

  CU_IUD: {
    id: 'CU_IUD',
    name: 'Copper IUD (Cu-T)',
    abbr: 'Cu-IUD',
    emoji: '🔩',
    category: 'Non-Hormonal — LARC',
    efficacy_perfect: 99.9,
    efficacy_typical: 99.2,
    duration: '10–12 years',
    reversibility: 'Immediate on removal',
    stis_protection: false,
    requires_provider: true,

    mechanism: [
      'Copper ions are toxic to sperm — impairs motility',
      'Creates hostile environment in uterus',
      'Prevents fertilisation primarily',
      'May prevent implantation',
    ],

    contraceptive_benefits: [
      'Highly effective immediately after insertion',
      'Hormone-free — no hormonal side effects',
      'Works for up to 10–12 years',
      'Can also be used as emergency contraception (within 5 days)',
      'Suitable for women who cannot use hormonal methods',
    ],

    non_contraceptive_benefits: [
      'Hormone-free — no hormonal mood or weight changes',
      'No effect on breastfeeding',
      'May reduce risk of endometrial cancer',
      'Immediate return to fertility',
    ],

    side_effects: [
      'Heavier, longer, more painful periods (especially first 3–6 months)',
      'Spotting between periods',
      'Cramping after insertion',
      'Risk of expulsion (especially in first year)',
    ],

    danger_signs: {
      acronym: 'PAINS',
      title: 'PAINS Warning Signs for IUD',
      signs: [
        { letter: 'P', word: 'Period late or missed', detail: 'Missed period — could indicate pregnancy (possibly ectopic) — seek immediate care' },
        { letter: 'A', word: 'Abdominal pain', detail: 'Severe lower abdominal pain — possible expulsion, PID, or ectopic pregnancy' },
        { letter: 'I', word: 'Infection / discharge', detail: 'Unusual vaginal discharge, odour, fever — possible PID or infection' },
        { letter: 'N', word: 'Not feeling strings', detail: 'Cannot feel IUD strings or they seem longer/shorter — possible expulsion or displacement' },
        { letter: 'S', word: 'Spotting or bleeding', detail: 'Heavy unexpected bleeding or pain during sex — seek evaluation' },
      ]
    },

    how_to_use: [
      'Inserted into the uterus by a trained provider',
      'Best inserted during period (easier insertion, confirms not pregnant)',
      'String check: feel for strings at cervix monthly',
      'Partner may feel strings during intercourse — provider can trim',
      'Works immediately after insertion',
      'Effective for 10–12 years',
    ],

    counselling_points: [
      'Heavier periods are EXPECTED — especially first 3–6 months',
      'Teach client to check strings monthly after period',
      'If strings cannot be felt — come to clinic',
      'Does NOT protect against STIs — use condoms if at risk',
      'Excellent emergency contraception if inserted within 5 days',
      'Return to fertility is immediate after removal',
      'Report PAINS signs immediately',
    ],

    return_date: 'Up to 10–12 years. Check at 6 weeks post-insertion.',
    follow_up: '6-week check, then annually or if problems',
    who_can_use: 'Most women. Ideal for those wanting long-term hormone-free contraception.',
    who_cannot_use: 'Pregnant women, current PID or STI, uterine anomalies, unexplained vaginal bleeding, cervical/endometrial cancer.',
  },

  LNG_IUS: {
    id: 'LNG_IUS',
    name: 'LNG-IUS (Mirena)',
    abbr: 'LNG-IUS',
    emoji: '🔩',
    category: 'Hormonal — LARC',
    efficacy_perfect: 99.9,
    efficacy_typical: 99.8,
    duration: '5–7 years',
    reversibility: 'Immediate on removal',
    stis_protection: false,
    requires_provider: true,

    mechanism: [
      'Releases low-dose levonorgestrel locally',
      'Thickens cervical mucus — primary mechanism',
      'Thins uterine lining dramatically',
      'May suppress ovulation in some cycles',
    ],

    contraceptive_benefits: [
      'One of the most effective methods available',
      'Nothing to remember for years',
      'Very low systemic hormone absorption',
      'Approved to treat heavy menstrual bleeding (HMB)',
    ],

    non_contraceptive_benefits: [
      'Dramatically reduces menstrual bleeding — up to 90% reduction',
      'Treats heavy menstrual bleeding (HMB) — licensed indication',
      'Treats endometriosis and adenomyosis',
      'Reduces risk of endometrial cancer',
      'Protects the uterine lining in HRT users',
      'May improve anaemia from heavy bleeding',
    ],

    side_effects: [
      'Irregular bleeding/spotting first 3–6 months',
      'Amenorrhoea after 12 months (very common)',
      'Hormonal side effects possible (acne, mood changes) — rare due to local action',
      'Ovarian cysts (usually resolve spontaneously)',
    ],

    danger_signs: {
      acronym: 'PAINS',
      title: 'PAINS Warning Signs (same as Cu-IUD)',
      signs: [
        { letter: 'P', word: 'Period late or missed', detail: 'Note: amenorrhoea is NORMAL with LNG-IUS. But if other pregnancy signs present — seek care' },
        { letter: 'A', word: 'Abdominal pain', detail: 'Severe lower abdominal pain — possible expulsion, PID, or ectopic' },
        { letter: 'I', word: 'Infection / discharge', detail: 'Unusual discharge, odour, fever — possible PID' },
        { letter: 'N', word: 'Not feeling strings', detail: 'Cannot feel strings — possible expulsion or displacement' },
        { letter: 'S', word: 'Spotting', detail: 'Heavy unexpected bleeding after amenorrhoea established — seek evaluation' },
      ]
    },

    how_to_use: [
      'Inserted into the uterus by a trained provider',
      'T-shaped device, slightly smaller than Cu-IUD',
      'Check strings monthly after period (or monthly if amenorrhoeic)',
      'Works for 5 years (Mirena) — some evidence for 7 years',
    ],

    counselling_points: [
      'Irregular bleeding in first 3–6 months is NORMAL',
      'Amenorrhoea (no periods) after 1 year is VERY COMMON and SAFE',
      'This is the PRIMARY treatment for heavy periods in Kenya',
      'Very low hormone dose — fewer systemic effects than pill',
      'Does NOT protect against STIs',
      'Return to fertility immediate after removal',
    ],

    return_date: '5 years (Mirena). Check at 6 weeks post-insertion.',
    follow_up: '6-week check, then annually',
    who_can_use: 'Most women. Excellent for women with heavy periods, endometriosis, anaemia.',
    who_cannot_use: 'Same as Cu-IUD. Also: current breast cancer.',
  },

  CONDOM_M: {
    id: 'CONDOM_M',
    name: 'Male Condom',
    abbr: 'Condom (M)',
    emoji: '🛡️',
    category: 'Barrier Method',
    efficacy_perfect: 98,
    efficacy_typical: 87,
    duration: 'Per use',
    reversibility: 'Immediate',
    stis_protection: true,
    requires_provider: false,

    mechanism: [
      'Physical barrier — prevents sperm reaching the egg',
      'Prevents STI transmission between partners',
    ],

    contraceptive_benefits: [
      'Only method that ALSO protects against STIs/HIV',
      'Available without prescription',
      'No hormonal side effects',
      'Can be used as backup for any other method',
    ],

    non_contraceptive_benefits: [
      '✅ ONLY contraceptive method that protects against HIV and STIs',
      'Reduces risk of cervical cancer (HPV prevention)',
      'No side effects',
      'Available at all health facilities in Kenya — often free',
    ],

    side_effects: [
      'Latex allergy (rare) — polyurethane condoms available',
      'Reduced sensation (for some)',
    ],

    danger_signs: null,

    how_to_use: [
      'Check expiry date and ensure package is intact',
      'Open carefully — do not use teeth or scissors',
      'Place on erect penis BEFORE any genital contact',
      'Pinch the tip to remove air, then unroll fully',
      'Use a new condom for every act of intercourse',
      'Use correct lubricant — water-based only (oil damages latex)',
      'After sex: hold base while withdrawing',
      'Dispose of used condom safely — tie and bin',
    ],

    counselling_points: [
      'MUST use EVERY TIME for protection against STIs and pregnancy',
      'Effectiveness depends heavily on CORRECT and CONSISTENT use',
      'Free male condoms available at all government health facilities',
      'Dual protection: use with another method for maximum protection',
      'Store away from heat and light — not in wallet for long periods',
      'Check expiry date before each use',
    ],

    return_date: 'Ongoing — resupply as needed',
    follow_up: 'Ongoing access',
    who_can_use: 'Anyone. Male partner must be willing to use.',
    who_cannot_use: 'Latex allergy (use polyurethane). Partner refusal.',
  },

  CONDOM_F: {
    id: 'CONDOM_F',
    name: 'Female Condom',
    abbr: 'Condom (F)',
    emoji: '🛡️',
    category: 'Barrier Method',
    efficacy_perfect: 95,
    efficacy_typical: 79,
    duration: 'Per use',
    reversibility: 'Immediate',
    stis_protection: true,
    requires_provider: false,

    mechanism: [
      'Lines the vagina — prevents sperm entry',
      'Covers cervix and external genitalia',
      'Prevents STI transmission',
    ],

    contraceptive_benefits: [
      'Female-controlled method — does not require partner cooperation',
      'Protects against STIs/HIV',
      'Can be inserted up to 8 hours before sex',
      'No hormonal effects',
    ],

    non_contraceptive_benefits: [
      'Female-initiated STI/HIV protection',
      'Empowers women to protect themselves',
      'Can be used with oil-based lubricants (polyurethane)',
    ],

    side_effects: [
      'Noise during use (can be reduced with lubricant)',
      'Less sensation for some',
    ],

    danger_signs: null,

    how_to_use: [
      'Check expiry date and package integrity',
      'Squeeze inner ring and insert into vagina like a tampon',
      'Push inner ring up behind pubic bone',
      'Leave outer ring outside the vagina',
      'Guide penis into the condom opening',
      'After sex: twist outer ring and pull out gently',
      'Use a new condom for each act of intercourse',
    ],

    counselling_points: [
      'Female-controlled — does not require male partner agreement',
      'Can be inserted before sex — more spontaneous',
      'Free female condoms at many government facilities',
      'Provide dual protection against pregnancy AND STIs',
    ],

    return_date: 'Ongoing resupply',
    follow_up: 'Ongoing access',
    who_can_use: 'Any woman. Excellent for women whose partners refuse male condoms.',
    who_cannot_use: 'Latex allergy to polyurethane (very rare). Anatomical abnormalities.',
  },

  LAM: {
    id: 'LAM',
    name: 'Lactational Amenorrhoea Method',
    abbr: 'LAM',
    emoji: '🤱',
    category: 'Natural Method',
    efficacy_perfect: 99,
    efficacy_typical: 98,
    duration: 'Maximum 6 months postpartum',
    reversibility: 'Immediate',
    stis_protection: false,
    requires_provider: false,

    mechanism: [
      'Prolactin from breastfeeding suppresses GnRH',
      'This prevents FSH/LH release — no ovulation',
      'Only effective when ALL three criteria are met simultaneously',
    ],

    contraceptive_benefits: [
      'Natural — no hormones or devices needed',
      'Free',
      'Encourages exclusive breastfeeding (benefits baby)',
      'Immediate — no supplies needed',
    ],

    non_contraceptive_benefits: [
      'Promotes exclusive breastfeeding',
      'Breast milk: optimal nutrition for baby',
      'Breastfeeding reduces risk of breast and ovarian cancer for mother',
      'Bonding between mother and baby',
      'Reduces postpartum haemorrhage',
    ],

    side_effects: [
      'No medical side effects',
      'Requires frequent breastfeeding — may be demanding',
    ],

    danger_signs: null,

    how_to_use: [
      'ALL THREE criteria must be met SIMULTANEOUSLY:',
      '1. Baby is LESS THAN 6 MONTHS OLD',
      '2. Mother is FULLY or NEARLY-FULLY breastfeeding (day AND night)',
      '3. Menstrual periods have NOT RETURNED',
      'If ANY criterion is no longer met — start another method IMMEDIATELY',
      'Plan a transition method before 6 months',
    ],

    counselling_points: [
      'ALL 3 criteria must be met — missing one means LAM does NOT work',
      'Must breastfeed frequently — at least every 4 hours during day, every 6 hours at night',
      'Supplemental feeding reduces effectiveness',
      'Plan next method BEFORE the 6 months are up',
      'Does NOT protect against STIs',
      'Transition to another method when any criterion is no longer met',
    ],

    return_date: '6 months (must transition to another method)',
    follow_up: 'Counsel on transition method at 4–5 months',
    who_can_use: 'Exclusively breastfeeding mothers, baby <6 months, no return of periods.',
    who_cannot_use: 'Women not fully breastfeeding, baby >6 months, periods returned, HIV+ mothers (in some contexts — follow national guidelines).',
  },

  FAM: {
    id: 'FAM',
    name: 'Fertility Awareness Methods / Cycle Beads',
    abbr: 'FAM',
    emoji: '📅',
    category: 'Natural Method',
    efficacy_perfect: 95,
    efficacy_typical: 76,
    duration: 'Ongoing — requires daily monitoring',
    reversibility: 'Immediate',
    stis_protection: false,
    requires_provider: false,

    mechanism: [
      'Identifies fertile and infertile days of menstrual cycle',
      'Abstinence or barrier use during fertile window',
      'Methods: Standard Days Method (Cycle Beads), Calendar, Cervical Mucus, Temperature',
    ],

    contraceptive_benefits: [
      'No hormones or devices',
      'Free or low cost',
      'Acceptable to many religious and cultural beliefs',
      'Increases body awareness',
    ],

    non_contraceptive_benefits: [
      'Helps identify gynaecological problems',
      'Useful when planning pregnancy too',
      'No medical side effects',
    ],

    side_effects: [
      'Requires daily record-keeping and discipline',
      'Periods of abstinence required',
      'Less effective with irregular cycles',
    ],

    danger_signs: null,

    how_to_use: [
      'STANDARD DAYS / CYCLE BEADS: Avoid sex on days 8–19 of cycle',
      'Move one bead per day — red bead = day 1 (start of period)',
      'White beads = fertile days — avoid unprotected sex',
      'Only suitable for women with cycles 26–32 days long',
      'Must keep accurate menstrual records',
      'Requires partner cooperation',
    ],

    counselling_points: [
      'Requires CONSISTENT and CORRECT use — high motivation needed',
      'Partner cooperation is ESSENTIAL',
      'NOT suitable for women with irregular cycles (<26 or >32 days)',
      'Cycle beads are available at health facilities',
      'Does NOT protect against STIs',
      'Less effective than hormonal methods',
    ],

    return_date: 'Ongoing — return if cycle irregularity or concerns',
    follow_up: 'Ongoing support and re-counselling',
    who_can_use: 'Women with regular cycles (26–32 days), motivated couples, women who cannot use hormonal methods for religious reasons.',
    who_cannot_use: 'Women with irregular cycles, women who cannot abstain during fertile period, women at high STI risk.',
  },

  BTL: {
    id: 'BTL',
    name: 'Female Sterilisation (BTL)',
    abbr: 'BTL',
    emoji: '✂️',
    category: 'Permanent Method',
    efficacy_perfect: 99.5,
    efficacy_typical: 99.5,
    duration: 'Permanent',
    reversibility: 'Considered PERMANENT — reversal is difficult and not always successful',
    stis_protection: false,
    requires_provider: true,

    mechanism: [
      'Fallopian tubes are cut, tied, or blocked (clips/rings)',
      'Prevents egg from reaching sperm',
      'No effect on hormones — periods continue normally',
    ],

    contraceptive_benefits: [
      'Highly effective permanent contraception',
      'One-time procedure — nothing to remember',
      'No hormonal side effects',
      'No effect on sexual function or menstruation',
    ],

    non_contraceptive_benefits: [
      'Reduces risk of ovarian cancer',
      'Peace of mind — no ongoing contraceptive burden',
    ],

    side_effects: [
      'Surgical risks: bleeding, infection, anaesthesia reaction',
      'Regret — especially in young women or those who lose a child',
      'Small risk of ectopic pregnancy if method fails',
    ],

    danger_signs: {
      acronym: null,
      title: '⚠️ Post-Procedure Warning Signs',
      signs: [
        { letter: '1', word: 'Fever', detail: 'Temperature >38°C after procedure — possible infection' },
        { letter: '2', word: 'Wound problems', detail: 'Redness, swelling, discharge at incision site' },
        { letter: '3', word: 'Severe abdominal pain', detail: 'Severe pain not relieved by paracetamol — seek care' },
        { letter: '4', word: 'Missed period', detail: 'Missed period after BTL — rule out ectopic pregnancy immediately' },
      ]
    },

    how_to_use: [
      'Surgical procedure — requires informed consent',
      'Usually performed under local anaesthesia + sedation',
      'Minilaparotomy (small abdominal incision) or laparoscopy',
      'Can be performed postpartum (within 7 days) or interval',
      'Effective IMMEDIATELY',
    ],

    counselling_points: [
      '⚠️ This is a PERMANENT method — client must be CERTAIN',
      'Counsel on regret — highest in young women and those without children',
      'Recommend delaying decision if uncertain',
      'Does NOT affect hormones, periods, or sexual function',
      'Husband/partner consent NOT legally required in Kenya but spousal communication is good practice',
      'Age and parity consideration: ideally ≥30 years or has completed family',
      'Does NOT protect against STIs',
    ],

    return_date: 'Post-op check at 1–2 weeks. Permanent.',
    follow_up: 'Post-operative review at 1–2 weeks',
    who_can_use: 'Women who are certain they want no more children. Ideally ≥30 years. Must give informed voluntary consent.',
    who_cannot_use: 'Women who are uncertain. Women under pressure. Active pelvic infection.',
  },

  VASECTOMY: {
    id: 'VASECTOMY',
    name: 'Vasectomy (Male Sterilisation)',
    abbr: 'Vasectomy',
    emoji: '✂️',
    category: 'Permanent Method',
    efficacy_perfect: 99.9,
    efficacy_typical: 99.9,
    duration: 'Permanent',
    reversibility: 'Considered PERMANENT — reversal has variable success',
    stis_protection: false,
    requires_provider: true,

    mechanism: [
      'Vas deferens (sperm tubes) are cut and sealed',
      'Sperm cannot reach ejaculate',
      'No effect on testosterone, sexual function, or ejaculation',
    ],

    contraceptive_benefits: [
      'Extremely effective',
      'Simpler, safer, cheaper than female sterilisation',
      'One-time procedure for male partner',
      'No hormonal effects',
    ],

    non_contraceptive_benefits: [
      'No ongoing contraceptive burden for female partner',
      'Promotes male engagement in family planning',
      'Simpler procedure than BTL',
    ],

    side_effects: [
      'Post-procedure scrotal swelling and discomfort (temporary)',
      'Small haematoma risk',
      'NOT immediately effective — use condoms for 3 months',
      'Regret if circumstances change',
    ],

    danger_signs: {
      acronym: null,
      title: '⚠️ Post-Vasectomy Warning Signs',
      signs: [
        { letter: '1', word: 'Significant swelling', detail: 'Large scrotal swelling or haematoma — seek care' },
        { letter: '2', word: 'Fever or infection', detail: 'Fever >38°C or wound discharge — possible infection' },
        { letter: '3', word: 'Severe pain', detail: 'Severe persistent pain — seek review' },
        { letter: '4', word: 'No confirmation', detail: 'Must have semen analysis at 3 months to confirm success' },
      ]
    },

    how_to_use: [
      'Minor surgical procedure under local anaesthesia',
      'Small incision(s) in scrotum',
      'Return home same day',
      'Rest for 2–3 days',
      'NOT immediately effective — use condoms for 12 weeks',
      'Semen analysis at 12 weeks confirms success',
    ],

    counselling_points: [
      '⚠️ PERMANENT — client must be absolutely certain',
      'NOT immediately effective — use condoms for 12 weeks after procedure',
      'Semen analysis REQUIRED to confirm success',
      'Does NOT affect sexual function, testosterone, or ejaculation',
      'Simpler and safer than female sterilisation',
      'Promote as a male FP option — underutilised in Kenya',
      'Does NOT protect against STIs',
    ],

    return_date: 'Permanent. Semen analysis at 12 weeks post-procedure.',
    follow_up: 'Post-op review at 1 week. Semen analysis at 12 weeks.',
    who_can_use: 'Men who are certain they want no more children. Must give informed voluntary consent.',
    who_cannot_use: 'Men who are uncertain. Active scrotal infection.',
  },

  EC_PILL: {
    id: 'EC_PILL',
    name: 'Emergency Contraceptive Pills (ECPs)',
    abbr: 'ECP',
    emoji: '🆘',
    category: 'Emergency Contraception',
    efficacy_perfect: 95,
    efficacy_typical: 85,
    duration: 'Single use — up to 120 hours after unprotected sex',
    reversibility: 'Not applicable',
    stis_protection: false,
    requires_provider: false,

    mechanism: [
      'Delays or prevents ovulation (primary mechanism)',
      'May affect cervical mucus',
      'Does NOT cause abortion — does not work if implantation has occurred',
    ],

    contraceptive_benefits: [
      'Prevents pregnancy when regular contraception fails or was not used',
      'Most effective when taken as soon as possible',
      'Available without prescription in Kenya',
    ],

    non_contraceptive_benefits: [
      'Provides option after sexual assault',
      'Prevents unintended pregnancy in emergency situations',
    ],

    side_effects: [
      'Nausea (common)',
      'Vomiting (if vomit within 2 hours — take another dose)',
      'Headache',
      'Dizziness',
      'Breast tenderness',
      'Next period may be early, late, or irregular',
    ],

    danger_signs: null,

    how_to_use: [
      'Take as soon as possible after unprotected sex',
      'Effective up to 72 hours (3 days) — most effective within 24 hours',
      'Can be used up to 120 hours (5 days) but less effective',
      'Levonorgestrel 1.5mg: take as single dose',
      'If vomiting within 2 hours: take another dose',
      'NOT for regular use — efficacy lower than regular methods',
    ],

    counselling_points: [
      'NOT an abortion pill — does not work if already pregnant',
      'Take AS SOON AS POSSIBLE — every hour counts',
      'Start a REGULAR method after using ECP',
      'ECP does NOT protect against STIs',
      'NOT recommended as regular contraception',
      'Widely available at pharmacies and health facilities in Kenya',
      'Can be used more than once but repeated use indicates need for regular method',
    ],

    return_date: 'Return in 3–4 weeks to start regular method if not already using one',
    follow_up: 'Counsel on regular method. If no period in 3 weeks — pregnancy test.',
    who_can_use: 'Any woman after unprotected sex or contraceptive failure.',
    who_cannot_use: 'Known pregnancy. Should not be used if ECP will be used repeatedly as primary method.',
  },

  EC_IUD: {
    id: 'EC_IUD',
    name: 'Emergency Copper IUD',
    abbr: 'EC-IUD',
    emoji: '🆘',
    category: 'Emergency Contraception',
    efficacy_perfect: 99.9,
    efficacy_typical: 99.9,
    duration: 'Single insertion — then continues as regular IUD for 10 years',
    reversibility: 'Removable at any time',
    stis_protection: false,
    requires_provider: true,

    mechanism: [
      'Copper toxic to sperm — prevents fertilisation',
      'Creates hostile uterine environment',
      'Prevents implantation if fertilisation has occurred',
    ],

    contraceptive_benefits: [
      'Most effective emergency contraception available (>99%)',
      'Can be used up to 5 days (120 hours) after unprotected sex',
      'Continues as long-term contraception after emergency use',
      'Can be removed after next period if client does not want ongoing IUD',
    ],

    non_contraceptive_benefits: [
      'Converts emergency situation into long-term contraceptive opportunity',
    ],

    side_effects: [
      'Heavier, more painful periods after insertion',
      'Cramping after insertion',
      'Same as regular Cu-IUD',
    ],

    danger_signs: {
      acronym: 'PAINS',
      title: 'PAINS Warning Signs (same as regular IUD)',
      signs: [
        { letter: 'P', word: 'Period problems', detail: 'No period after insertion — rule out pregnancy' },
        { letter: 'A', word: 'Abdominal pain', detail: 'Severe pain — possible ectopic or PID' },
        { letter: 'I', word: 'Infection', detail: 'Discharge, fever — possible infection' },
        { letter: 'N', word: 'Not feeling strings', detail: 'Cannot feel strings — possible expulsion' },
        { letter: 'S', word: 'Spotting', detail: 'Unexpected heavy bleeding' },
      ]
    },

    how_to_use: [
      'Must be inserted by a trained provider',
      'Insert within 5 days of unprotected sex',
      'Or within 5 days of expected ovulation',
      'Discuss with client: keep as ongoing IUD or remove after next period',
    ],

    counselling_points: [
      'Most effective form of emergency contraception',
      'Particularly good option if client wants long-term contraception',
      'Same eligibility criteria as regular Cu-IUD insertion',
      'Does NOT protect against STIs',
      'Can be removed after next period if client does not want ongoing IUD',
    ],

    return_date: '6-week check if keeping as long-term IUD',
    follow_up: '6-week check. Discuss ongoing contraception.',
    who_can_use: 'Women needing emergency contraception who are eligible for Cu-IUD.',
    who_cannot_use: 'Active STI/PID, pregnancy, uterine anomalies.',
  },
}

export const BCS_ALGORITHM = {
  title: 'BCS+ Algorithm — Kenya MOH (2023)',
  source: 'Kenya Ministry of Health, Division of Reproductive & Maternal Health',
  stages: [
    {
      id: 'pre_choice',
      number: 1,
      title: 'Pre-Choice Stage',
      color: 'blue',
      icon: '👋',
      steps: [
        {
          step: 1,
          title: 'Establish warm, cordial relationship',
          detail: 'Greet the client respectfully. Ensure privacy and confidentiality. Introduce yourself. Ask the client\'s name and how they prefer to be addressed.',
          tips: ['Use client\'s preferred name', 'Ensure no one else can hear the conversation', 'Sit at the same level as the client'],
        },
        {
          step: 2,
          title: 'Determine reason for visit',
          detail: 'Ask the client what brought them today. Is this a new visit, revisit, or do they have specific concerns? Listen actively.',
          tips: ['Let client speak first', 'Do not interrupt', 'Acknowledge client\'s concerns'],
        },
        {
          step: 3,
          title: 'Rule out pregnancy',
          detail: 'Use the 6-question WHO checklist to determine if pregnancy can be excluded. If PDT available, use it. Do not proceed until pregnancy is ruled out.',
          tips: ['Use the pregnancy checklist in this app', 'PDT is gold standard', 'Document checklist answers'],
        },
        {
          step: 4,
          title: 'Display all method cards',
          detail: 'Show the client all available contraceptive method cards. Tell the client you will ask some questions to help identify which methods are most appropriate for her/him.',
          tips: ['Show cards visually', 'Do not pre-select — let client see all options', 'If client wants specific method, go to step 7'],
        },
        {
          step: 5,
          title: 'Ask screening questions — set aside inappropriate methods',
          detail: 'Ask questions from the BCS+ algorithm (medical, obstetric, personal characteristics). Set aside method cards that are not appropriate based on answers.',
          tips: ['Use the MEC screener in this app', 'Set aside Cat 3 and 4 methods', 'Be non-judgmental'],
        },
      ]
    },
    {
      id: 'method_choice',
      number: 2,
      title: 'Method Choice Stage',
      color: 'green',
      icon: '🎯',
      steps: [
        {
          step: 6,
          title: 'Present remaining methods in order of efficacy',
          detail: 'For methods not set aside, present information starting with most effective. Describe efficacy, how it works, benefits, and side effects briefly.',
          tips: ['Start with most effective (implant, IUD)', 'Use method cards as visual aids', 'Keep explanations simple'],
        },
        {
          step: 7,
          title: 'Ask client to choose',
          detail: 'After presenting all suitable methods, ask the client which method they prefer. Respect their choice. The decision belongs to the client.',
          tips: ['Do not push a particular method', 'Respect client\'s autonomy', 'Address any questions or fears'],
        },
        {
          step: 8,
          title: 'Confirm method is suitable',
          detail: 'Using the MEC criteria, confirm the chosen method has no contraindications (Category 1 or 2). If Category 3 — discuss with clinical judgment. If Category 4 — advise against and offer alternatives.',
          tips: ['Check MEC category in this app', 'Document reasons', 'Involve clinical judgment for Cat 3'],
        },
      ]
    },
    {
      id: 'post_choice',
      number: 3,
      title: 'Post-Choice Stage',
      color: 'purple',
      icon: '📋',
      steps: [
        {
          step: 9,
          title: 'Counsel on chosen method',
          detail: 'Use the method brochure/card to counsel the client on: how it works, how to use it, what to expect, side effects, and return date.',
          tips: ['Use method brochure as counselling tool', 'Check comprehension', 'Give brochure to client to take home'],
        },
        {
          step: 10,
          title: 'Check comprehension',
          detail: 'Ask the client to repeat back key information. Confirm understanding of: how to use, when to return, side effects, and danger signs.',
          tips: ['Ask open-ended questions', 'Do not ask yes/no only', '"Can you tell me when you will come back?"'],
        },
        {
          step: 11,
          title: 'Provide method and confirm decision',
          detail: 'Provide the chosen method. Give referral if method not available at facility. Provide a backup method if appropriate. Confirm client has no remaining questions.',
          tips: ['Provide sufficient supply', 'Give backup method if appropriate', 'Confirm client feels satisfied with decision'],
        },
      ]
    },
    {
      id: 'sti_screening',
      number: 4,
      title: 'STI/HIV Screening Stage',
      color: 'orange',
      icon: '🔬',
      steps: [
        {
          step: 12,
          title: 'Discuss RTI/STI/HIV transmission and prevention',
          detail: 'Assess client\'s STI/HIV risk. Discuss transmission routes and prevention. Emphasise dual protection — condom use alongside chosen method.',
          tips: ['Be non-judgmental', 'Ask about partners', 'Provide condoms regardless of method chosen'],
        },
        {
          step: 13,
          title: 'Conduct HIV/AIDS risk assessment',
          detail: 'Screen for STI symptoms. If symptoms present — treat syndromically and counsel on dual protection. Offer HIV testing and counselling (HTC).',
          tips: ['Use syndromic management guidelines', 'Always offer HIV testing', 'Document results'],
        },
        {
          step: 14,
          title: 'Offer counselling and testing',
          detail: 'Offer HIV/AIDS counselling and testing. Discuss cervical cancer screening. Provide referrals where needed.',
          tips: ['Refer to HTC if not tested recently', 'Check cervical screening status', 'Document all screening done'],
        },
        {
          step: 15,
          title: 'Give follow-up instructions',
          detail: 'Provide condom pamphlet and method brochure. Schedule follow-up appointment. Discuss return date and warning signs to watch for.',
          tips: ['Record return date in app', 'Give written instructions where possible', 'Ensure client has your facility contact'],
        },
      ]
    },
  ]
}