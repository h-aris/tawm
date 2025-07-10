import json

with open('public/modifierFamilies.json') as f:
    data = json.load(f)

offenders = {}
for fam, v in data.items():
    tiers = [m['tier'] for m in v['mods']]
    if not any(t == 'T1' for t in tiers):
        offenders[fam] = tiers

print('OFFENDING FAMILIES:')
for fam, tiers in offenders.items():
    print(f'{fam}: {tiers}') 