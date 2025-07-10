import json
import re
from collections import Counter

# Load data
with open('public/modifierFamilies.json') as f:
    families = json.load(f)

with open('public/tiers.txt') as f:
    lines = [line.strip() for line in f if line.strip()]

# Helper to extract family and tiers from lines like 'FamilyName: [T2, T4]'
def parse_family_tiers(line):
    m = re.match(r"([\w\d]+): \[(.*?)\]", line)
    if m:
        fam = m.group(1)
        tiers = [t.strip("' ") for t in m.group(2).split(',')]
        return fam, tiers
    return None, None

# Parse instructions
instructions = {}
current_fams = []
for line in lines:
    if '->' in line:
        instr = line.split('->')[1].strip()
        instructions[tuple(current_fams)] = instr
        current_fams = []
    else:
        fam, tiers = parse_family_tiers(line)
        if fam:
            current_fams.append(fam)

# Apply fixes
def renumber_tiers(mods):
    # Sort by original tier number
    mods_sorted = sorted(mods, key=lambda m: int(re.sub(r'\D', '', m['tier'])))
    for i, m in enumerate(mods_sorted):
        m['tier'] = f'T{i+1}'
    return mods_sorted

summary = []
new_families = families.copy()

for fams, instr in instructions.items():
    fams = list(fams)
    if instr.startswith('Convert to'):
        fam = fams[0]
        mods = families[fam]['mods']
        new_families[fam]['mods'] = renumber_tiers(mods)
        summary.append(f"Renumbered {fam} tiers: {[m['tier'] for m in new_families[fam]['mods']]}")
    elif instr.startswith('Merge with'):
        merge_target_match = re.search(r'Merge with ([\w\d]+)', instr)
        if not merge_target_match:
            summary.append(f"Could not parse merge target for {fams}: {instr}")
            continue
        merge_target = merge_target_match.group(1)
        keep_name = merge_target
        merge_fams = fams + [merge_target]
        all_mods = []
        all_names = []
        for mf in merge_fams:
            if mf in families:
                all_mods.extend(families[mf]['mods'])
                all_names.append(mf)
        merged_mods = renumber_tiers(all_mods)
        name_counts = Counter(all_names)
        keep_name = name_counts.most_common(1)[0][0]
        type_counts = Counter([families[mf]['type'] for mf in merge_fams if mf in families])
        keep_type = type_counts.most_common(1)[0][0]
        new_families[keep_name] = {'type': keep_type, 'mods': merged_mods}
        for mf in merge_fams:
            if mf != keep_name and mf in new_families:
                del new_families[mf]
        summary.append(f"Merged {merge_fams} into {keep_name} with tiers: {[m['tier'] for m in merged_mods]}")
    elif instr.startswith('convert to T1') or instr.startswith('convert to T1, merge'):
        fam = fams[0]
        mods = families[fam]['mods']
        for m in mods:
            m['tier'] = 'T1'
        new_families[fam]['mods'] = mods
        summary.append(f"Converted {fam} to T1")
    elif instr.startswith('Merge with') and 'keep tiering' in instr:
        pass
    elif instr.startswith('Merge with') and 'keep name' in instr:
        pass
    elif instr.startswith('Merge with') and 'keep tiering' in instr:
        pass
    elif instr.startswith('Merge with') and 'keep name' in instr:
        pass
    elif instr.startswith('Merge with'):
        pass
    elif instr.startswith('convert to T1'):
        fam = fams[0]
        mods = families[fam]['mods']
        for m in mods:
            m['tier'] = 'T1'
        new_families[fam]['mods'] = mods
        summary.append(f"Converted {fam} to T1")
    elif instr.startswith('Convert to'):
        fam = fams[0]
        mods = families[fam]['mods']
        for i, m in enumerate(mods):
            m['tier'] = f'T{i+1}'
        new_families[fam]['mods'] = mods
        summary.append(f"Renumbered {fam} to {[m['tier'] for m in mods]}")
    else:
        summary.append(f"No action for {fams}: {instr}")

with open('public/modifierFamilies_fixed.json', 'w') as f:
    json.dump(new_families, f, indent=2)

print('SUMMARY OF CHANGES:')
for line in summary:
    print(line) 