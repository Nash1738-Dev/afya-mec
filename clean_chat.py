import re
import os
from collections import Counter

INPUT_FILE  = r'C:\Users\Felix\Downloads\WhatsApp Chat - 💪The Z Effect💫\_chat.txt'
OUTPUT_FILE = r'C:\digital-mec\nova_context_raw.txt'
STATS_FILE  = r'C:\digital-mec\nova_context_stats.txt'

# ── CLEAN AND EXTRACT ──────────────────────────────────────────────────────────
def clean_chat(input_path, output_path, stats_path):

    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    cleaned    = []
    skipped    = 0
    total      = 0
    word_freq  = Counter()

    # WhatsApp export format:
    # DD/MM/YYYY, HH:MM - Name: message
    # or
    # [DD/MM/YYYY, HH:MM] Name: message  (iOS format)
    patterns = [
        re.compile(r'^\d{1,2}/\d{1,2}/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\s*-\s*[^:]+:\s*(.+)$'),
        re.compile(r'^\[\d{1,2}/\d{1,2}/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s*[^:]+:\s*(.+)$'),
    ]

    skip_phrases = [
        'omitted', 'deleted this message', 'missed voice call',
        'missed video call', 'added you', 'left', 'joined using',
        'changed the group', 'changed this group', 'created group',
        'you were added', 'security code changed', 'Messages and calls',
        'end-to-end encrypted', 'pinned a message', 'added +',
        'removed +', 'changed the subject', 'https://', 'http://',
    ]

    for line in lines:
        line = line.strip()
        if not line:
            continue

        total += 1
        msg = None

        for pattern in patterns:
            match = pattern.match(line)
            if match:
                msg = match.group(1).strip()
                break

        if not msg:
            skipped += 1
            continue

        # Skip system/media/link messages
        skip = False
        for phrase in skip_phrases:
            if phrase.lower() in msg.lower():
                skip = True
                break

        if skip:
            skipped += 1
            continue

        # Skip very short messages (reactions, single words)
        if len(msg) < 10:
            skipped += 1
            continue

        # Skip messages that are just emojis or punctuation
        text_only = re.sub(r'[^\w\s]', '', msg, flags=re.UNICODE)
        if len(text_only.strip()) < 5:
            skipped += 1
            continue

        cleaned.append(msg)
        # Track word frequency for analysis
        words = msg.lower().split()
        word_freq.update(words)

    # Write cleaned messages
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(cleaned))

    # Write stats
    fp_keywords = [
        'injection', 'sindano', 'dmpa', 'sayana', 'implant', 'kipandikizi',
        'iud', 'pill', 'kidonge', 'condom', 'kondomu', 'period', 'hedhi',
        'pregnancy', 'mimba', 'ujauzito', 'bleeding', 'damu', 'family planning',
        'uzazi', 'contraceptive', 'clinic', 'kliniki', 'daktari', 'doctor',
        'nurse', 'hospital', 'side effect', 'madhara', 'fertility', 'uzazi',
        'sex', 'ngono', 'relationship', 'boyfriend', 'partner'
    ]

    fp_messages = []
    for msg in cleaned:
        msg_lower = msg.lower()
        if any(kw in msg_lower for kw in fp_keywords):
            fp_messages.append(msg)

    top_words = word_freq.most_common(50)

    stats = [
        f"NOVA TRAINING DATA STATS",
        f"{'='*50}",
        f"Total lines processed : {total}",
        f"Messages extracted    : {len(cleaned)}",
        f"Messages skipped      : {skipped}",
        f"FP-related messages   : {len(fp_messages)}",
        f"",
        f"TOP 50 WORDS:",
        f"{'='*50}",
    ]
    for word, count in top_words:
        stats.append(f"  {word:<20} {count}")

    stats += [
        f"",
        f"{'='*50}",
        f"FP-RELATED MESSAGES SAMPLE (first 50):",
        f"{'='*50}",
    ]
    for msg in fp_messages[:50]:
        stats.append(f"  • {msg}")

    with open(stats_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(stats))

    print(f"\n✅ Done!")
    print(f"   Total lines     : {total}")
    print(f"   Extracted       : {len(cleaned)} messages")
    print(f"   FP-related      : {len(fp_messages)} messages")
    print(f"   Output file     : {output_path}")
    print(f"   Stats file      : {stats_path}")
    print(f"\n📄 Next step: open nova_context_stats.txt to review")

if __name__ == '__main__':
    if not os.path.exists(INPUT_FILE):
        print(f"❌ File not found: {INPUT_FILE}")
        print("   Check the file path and try again.")
    else:
        print(f"📱 Processing WhatsApp export...")
        print(f"   Input : {INPUT_FILE}")
        clean_chat(INPUT_FILE, OUTPUT_FILE, STATS_FILE)