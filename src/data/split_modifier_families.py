import csv
import os
import json
import re
from collections import defaultdict

os.makedirs('src/data/modifierFamilies', exist_ok=True)
families = defaultdict(lambda: {'tiers': {}})

with open('src/data/families_v2.csv', encoding='utf-8') as f:
    r = csv.DictReader(f)
    for row in r:
        families[row['Family']]['type'] = row['Type']
        families[row['Family']]['tiers'].setdefault(row['Tier'], {'name': row['Mod Name'], 'stat': row['Stat']})

for fam, data in families.items():
    fname = re.sub(r'[^a-zA-Z0-9_]', '_', fam)
    with open(f'src/data/modifierFamilies/{fname}.ts', 'w', encoding='utf-8') as out:
        out.write('export const familyData = ' + json.dumps(data, indent=2) + ';\n') 