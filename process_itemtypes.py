import csv
import json
from collections import defaultdict
import re

# Load valid families from fixed JSON
with open('public/modifierFamilies_fixed.json') as f:
    valid_families = set(json.load(f).keys())

# Read the CSV
with open('src/data/compitemtypes_v2.csv', newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Build all subcategories per equipment
all_subcats = defaultdict(set)
for row in rows:
    eq = row['Equipment']
    subcat = row['Subcategory']
    if '-' in subcat:
        for s in subcat.split('-'):
            all_subcats[eq].add(s)
    else:
        all_subcats[eq].add(subcat)

# Build mapping and report missing/renamed families
mapping = defaultdict(lambda: defaultdict(list))
missing_families = defaultdict(list)

for row in rows:
    eq = row['Equipment']
    fam = row['Family']
    subcat = row['Subcategory']
    # Expand subcategories
    subcats = []
    if eq == 'Quivers' and subcat == 'ALL':
        subcats = ['ALL']
    elif subcat == 'ALL':
        subcats = list(all_subcats[eq] - {'ALL'})
    elif '-' in subcat:
        subcats = subcat.split('-')
    else:
        subcats = [subcat]
    # Check family
    if fam not in valid_families:
        # Try to find a likely match (by prefix, fuzzy, or merge context)
        likely = [vf for vf in valid_families if vf.lower() in fam.lower() or fam.lower() in vf.lower()]
        missing_families[fam].append({'equipment': eq, 'subcategories': subcats, 'likely_matches': likely})
        continue
    # Add to mapping
    for s in subcats:
        if fam not in mapping[eq][s]:
            mapping[eq][s].append(fam)

# Write output JSON
with open('public/itemtypes.json', 'w', encoding='utf-8') as f:
    json.dump(mapping, f, indent=2)

# Write missing/renamed report
with open('public/itemtypes_missing_families_report.txt', 'w', encoding='utf-8') as f:
    for fam, cases in missing_families.items():
        f.write(f'Family: {fam}\n')
        for case in cases:
            f.write(f"  Equipment: {case['equipment']}\n")
            f.write(f"  Subcategories: {case['subcategories']}\n")
            f.write(f"  Likely matches: {case['likely_matches']}\n")
        f.write('\n')

print('Done. Output written to public/itemtypes.json and public/itemtypes_missing_families_report.txt') 