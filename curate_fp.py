import re

INPUT_FILE  = r'C:\digital-mec\nova_context_raw.txt'
OUTPUT_FILE = r'C:\digital-mec\nova_fp_curated.txt'

FP_KEYWORDS = [
    # English
    'injection', 'dmpa', 'sayana', 'implant', 'iud', 'pill', 'condom',
    'period', 'pregnancy', 'pregnant', 'mimba', 'bleeding', 'family planning',
    'contraceptive', 'clinic', 'doctor', 'nurse', 'hospital', 'side effect',
    'fertility', 'sex', 'relationship', 'protect', 'STI', 'HIV', 'testing',
    'unprotected', 'depo', 'P2', 'morning after', 'stigma', 'judgment',
    # Kiswahili / Sheng
    'sindano', 'kipandikizi', 'kidonge', 'kondomu', 'hedhi', 'ujauzito',
    'damu', 'uzazi', 'kliniki', 'daktari', 'madhara', 'ngono', 'ugonjwa',
    'kisonono', 'ukimwi', 'mimba', 'kupima', 'salama', 'hatari',
]

CATEGORIES = {
    'partner_pressure': [
        'boyfriend', 'partner', 'him', 'he ', 'manipulat', 'pressure',
        'convince', 'accept', 'allow', 'trust', 'respect'
    ],
    'condom_negotiation': [
        'condom', 'kondomu', 'protect', 'unprotected', 'safe sex',
        'female condom', 'put it on'
    ],
    'fp_access_stigma': [
        'stigma', 'judgment', 'judged', 'fear', 'embarrass', 'taboo',
        'shame', 'bad', 'society', 'family', 'friends', 'privacy'
    ],
    'method_questions': [
        'injection', 'sindano', 'dmpa', 'depo', 'sayana', 'implant',
        'iud', 'pill', 'kidonge', 'P2', 'morning after', 'family planning',
        'uzazi wa mpango', 'contraceptive', 'periods', 'hedhi', 'bleeding'
    ],
    'sti_hiv': [
        'STI', 'HIV', 'ugonjwa', 'ukimwi', 'kisonono', 'testing', 'kupima',
        'infected', 'disease', 'clean', 'status', 'window period'
    ],
    'relationship_dynamics': [
        'relationship', 'toxic', 'trust', 'respect', 'decision', 'choice',
        'single', 'heartbreak', 'partner', 'man', 'woman', 'girl', 'boy'
    ]
}

def categorise(msg):
    msg_lower = msg.lower()
    cats = []
    for cat, keywords in CATEGORIES.items():
        if any(kw.lower() in msg_lower for kw in keywords):
            cats.append(cat)
    return cats if cats else ['general']

with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    messages = [l.strip() for l in f.readlines() if l.strip()]

fp_messages = []
for msg in messages:
    msg_lower = msg.lower()
    if any(kw.lower() in msg_lower for kw in FP_KEYWORDS):
        cats = categorise(msg)
        fp_messages.append({'msg': msg, 'categories': cats})

# Group by category
grouped = {}
for item in fp_messages:
    for cat in item['categories']:
        grouped.setdefault(cat, []).append(item['msg'])

# Write curated output
lines = ['NOVA FP TRAINING CONTEXT — CURATED', '='*60, '']

for cat, msgs in grouped.items():
    lines.append(f'\n[{cat.upper().replace("_"," ")}] ({len(msgs)} messages)')
    lines.append('-'*40)
    for msg in msgs:
        lines.append(f'  "{msg}"')

lines += [
    '',
    '='*60,
    f'TOTAL FP MESSAGES: {len(fp_messages)}',
    f'CATEGORIES: {list(grouped.keys())}',
]

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'✅ Curated {len(fp_messages)} FP messages into {len(grouped)} categories')
print(f'   Output: {OUTPUT_FILE}')
for cat, msgs in grouped.items():
    print(f'   {cat:<25} {len(msgs)} messages')