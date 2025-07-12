import fs from 'fs';

// Read the analysis results
const analysis = JSON.parse(fs.readFileSync('family_analysis.json', 'utf8'));

// Priority order based on user requirements
const PRIORITY_ORDER = [
  'Movement Speed',
  'Chance to Suppress Spell Damage',
  'Chaos Resistance',
  'Life Regeneration Rate (percent)',
  'Increased Life (solo)',
  'Increased Armour/Evasion/ES (not with life/mana)',
  'Physical Damage % (attack weapons)',
  'Physical Damage flat (attack weapons)',
  'Physical Damage hybrid (attack weapons)',
  '+# to Level of all Gems (not socketed)',
  'Chance to Avoid Elemental Ailments',
  'Attack Speed',
  'Adds # Damage (attack weapons)',
  'Spell Damage',
  'Cast Speed',
  'Chance to Block',
  'Mana (by itself)',
  'Elemental Damage with Attacks',
  'Critical Strike Multiplier',
  'Critical Strike Chance',
  'Damage over Time Multiplier',
  'Attributes (Int/Dex/Str)',
  // Elemental resistances (grouped)
  'Fire Resistance',
  'Cold Resistance',
  'Lightning Resistance',
  'Maximum Fire Resistance',
  'Maximum Cold Resistance',
  'Maximum Lightning Resistance',
  'Maximum Chaos Resistance',
  // Elemental damage (grouped)
  'Adds Fire Damage',
  'Adds Cold Damage',
  'Adds Lightning Damage',
  // Minion families
  'Minion Related',
  // Other categories (order doesn't matter)
  'Additional Arrows',
  'Flask Effects',
  'Chance to Ailment',
  'Chaos Damage',
  'Elemental Damage %',
  'Damage Recoup',
  'Socketed Gem Levels',
  'Accuracy Rating',
  'Item Rarity',
  'Life Gain on Hit/Kill',
  'Leech',
  'Attribute Requirements',
  'Mana Gain on Hit/Kill',
  'Projectile Speed',
  'Reduced Damage Taken',
  'Stun Duration',
  'Reflects Physical Damage',
  // Bottom of barrel
  'Light Radius',
  'Stun and Block Recovery (solo)',
  'Stun Threshold',
  'Attribute Requirements',
  'Reflects Physical Damage',
  'Energy Shield Recharge Speed',
  'Leech',
  'Life Gain on Hit/Kill',
  'Mana Gain on Hit/Kill',
  // Default for anything not categorized
  'Default Priority'
];

// Create priority mapping
const priorityMap = {};

// Assign priorities based on order (lower number = higher priority)
PRIORITY_ORDER.forEach((category, index) => {
  if (analysis.categories[category]) {
    analysis.categories[category].forEach(family => {
      priorityMap[family.name] = index;
    });
  }
});

// Handle families that might not be in the analysis
Object.keys(analysis.analysis).forEach(familyName => {
  if (!priorityMap[familyName]) {
    priorityMap[familyName] = PRIORITY_ORDER.length - 1; // Default priority
  }
});

// Create the priority function for the app
const priorityFunction = `
// New priority system based on user requirements
export function getFamilyPriority(familyName) {
  const priorities = ${JSON.stringify(priorityMap, null, 2)};
  return priorities[familyName] || ${PRIORITY_ORDER.length - 1};
}

// Priority order for reference
export const PRIORITY_ORDER = ${JSON.stringify(PRIORITY_ORDER, null, 2)};
`;

// Save the priority function
fs.writeFileSync('new_priority_system.js', priorityFunction);

console.log('Priority system created!');
console.log(`Total families: ${Object.keys(priorityMap).length}`);
console.log(`Priority categories: ${PRIORITY_ORDER.length}`);

// Show some examples
console.log('\nExample priorities:');
const examples = [
  'MovementVelocity',
  'ChanceToSuppressSpells', 
  'ChaosResistance',
  'LifeRegenerationRate',
  'IncreasedLife',
  'ArmourPercent',
  'LocalPhysicalDamagePercent',
  'PhysicalDamage',
  'AllGemChaos',
  'AvoidElementalStatusAilments',
  'IncreasedAttackSpeed',
  'FireDamage',
  'SpellDamage',
  'IncreasedCastSpeed',
  'IncreasedShieldBlockPercentage',
  'IncreasedMana',
  'IncreasedWeaponElementalDamagePercent',
  'CriticalStrikeMultiplier',
  'CriticalStrikeChanceIncrease',
  'GlobalDamageOverTimeMultiplier',
  'AllAttributes'
];

examples.forEach(family => {
  const priority = priorityMap[family] || 'Default';
  console.log(`${family}: ${priority}`);
}); 