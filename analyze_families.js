import fs from 'fs';

// Read the JSON file
const data = JSON.parse(fs.readFileSync('public/modifierFamiliesDisplay_7.json', 'utf8'));

// Priority categories based on user rules
const PRIORITY_CATEGORIES = {
  // Very high priority (in order mentioned)
  MOVEMENT_SPEED: 'Movement Speed',
  SUPPRESS_SPELLS: 'Chance to Suppress Spell Damage',
  CHAOS_RESIST: 'Chaos Resistance',
  LIFE_REGEN_RATE: 'Life Regeneration Rate (percent)',
  INCREASED_LIFE_SOLO: 'Increased Life (solo)',
  INCREASED_ARMOUR_EVASION_ES: 'Increased Armour/Evasion/ES (not with life/mana)',
  PHYSICAL_DAMAGE_PERCENT: 'Physical Damage % (attack weapons)',
  PHYSICAL_DAMAGE_FLAT: 'Physical Damage flat (attack weapons)',
  PHYSICAL_DAMAGE_HYBRID: 'Physical Damage hybrid (attack weapons)',
  ALL_GEM_LEVEL: '+# to Level of all Gems (not socketed)',
  AVOID_ELEMENTAL_AILMENTS: 'Chance to Avoid Elemental Ailments',
  ATTACK_SPEED: 'Attack Speed',
  ADDS_DAMAGE: 'Adds # Damage (attack weapons)',
  SPELL_DAMAGE: 'Spell Damage',
  CAST_SPEED: 'Cast Speed',
  CHANCE_TO_BLOCK: 'Chance to Block',
  MANA_SOLO: 'Mana (by itself)',
  ELEMENTAL_DAMAGE_ATTACKS: 'Elemental Damage with Attacks',
  CRIT_MULTIPLIER: 'Critical Strike Multiplier',
  CRIT_CHANCE: 'Critical Strike Chance',
  DOT_MULTIPLIER: 'Damage over Time Multiplier',
  ATTRIBUTES: 'Attributes (Int/Dex/Str)',
  
  // Elemental resistances (grouped)
  FIRE_RESIST: 'Fire Resistance',
  COLD_RESIST: 'Cold Resistance', 
  LIGHTNING_RESIST: 'Lightning Resistance',
  MAX_FIRE_RESIST: 'Maximum Fire Resistance',
  MAX_COLD_RESIST: 'Maximum Cold Resistance',
  MAX_LIGHTNING_RESIST: 'Maximum Lightning Resistance',
  MAX_CHAOS_RESIST: 'Maximum Chaos Resistance',
  
  // Elemental damage (grouped)
  ADDS_FIRE_DAMAGE: 'Adds Fire Damage',
  ADDS_COLD_DAMAGE: 'Adds Cold Damage',
  ADDS_LIGHTNING_DAMAGE: 'Adds Lightning Damage',
  
  // Minion families
  MINION_RELATED: 'Minion Related',
  
  // Bottom of barrel
  LIGHT_RADIUS: 'Light Radius',
  STUN_BLOCK_RECOVERY_SOLO: 'Stun and Block Recovery (solo)',
  STUN_THRESHOLD: 'Stun Threshold',
  ATTRIBUTE_REQUIREMENTS: 'Attribute Requirements',
  REFLECTS_DAMAGE: 'Reflects Physical Damage',
  ES_RECHARGE_SPEED: 'Energy Shield Recharge Speed',
  LEECH: 'Leech',
  LIFE_GAIN: 'Life Gain on Hit/Kill',
  MANA_GAIN: 'Mana Gain on Hit/Kill',
  
  // Default
  DEFAULT: 'Default Priority'
};

// Function to categorize a family
function categorizeFamily(familyName, family) {
  const displayName = family.displayName?.toLowerCase() || '';
  const stat = family.mods[0]?.stat?.toLowerCase() || '';
  const name = familyName.toLowerCase();
  
  // Check for very high priority categories first
  
  // 1. Movement Speed (not minion movement speed)
  if ((displayName.includes('movement speed') || stat.includes('movement speed')) &&
      !displayName.includes('minion') && !stat.includes('minion')) {
    return PRIORITY_CATEGORIES.MOVEMENT_SPEED;
  }
  
  // 2. Chance to Suppress Spell Damage
  if (displayName.includes('suppress spell damage') || stat.includes('suppress spell damage') || 
      name.includes('chancetosuppressspells')) {
    return PRIORITY_CATEGORIES.SUPPRESS_SPELLS;
  }
  
  // 2. Chaos Resistance
  if (displayName.includes('chaos resistance') || stat.includes('chaos resistance')) {
    if (displayName.includes('maximum')) return PRIORITY_CATEGORIES.MAX_CHAOS_RESIST;
    return PRIORITY_CATEGORIES.CHAOS_RESIST;
  }
  
  // 3. Life Regeneration Rate (percent, not flat)
  if ((displayName.includes('life regeneration rate') || stat.includes('life regeneration rate')) &&
      !displayName.includes('regenerate') && !displayName.includes('per second')) {
    return PRIORITY_CATEGORIES.LIFE_REGEN_RATE;
  }
  
  // 4. Increased Life (solo - not paired with another stat)
  if ((displayName.includes('maximum life') || stat.includes('maximum life')) && 
      !displayName.includes('armour') && !displayName.includes('evasion') && 
      !displayName.includes('energy shield') && !displayName.includes('mana')) {
    return PRIORITY_CATEGORIES.INCREASED_LIFE_SOLO;
  }
  
  // 5. Increased Armour/Evasion/ES (not with life/mana, but stun block recovery is fine)
  if ((displayName.includes('armour') || displayName.includes('evasion') || displayName.includes('energy shield')) &&
      !displayName.includes('life') && !displayName.includes('mana')) {
    return PRIORITY_CATEGORIES.INCREASED_ARMOUR_EVASION_ES;
  }
  

  
  // 6-8. Physical Damage (attack weapons) - need to check equipment context
  if (displayName.includes('physical damage') || stat.includes('physical damage')) {
    if (displayName.includes('increased') && !displayName.includes('adds')) {
      return PRIORITY_CATEGORIES.PHYSICAL_DAMAGE_PERCENT;
    } else if (displayName.includes('adds') && !displayName.includes('increased')) {
      return PRIORITY_CATEGORIES.PHYSICAL_DAMAGE_FLAT;
    } else if (displayName.includes('adds') && displayName.includes('increased')) {
      return PRIORITY_CATEGORIES.PHYSICAL_DAMAGE_HYBRID;
    }
  }
  
  // 9. + to Level of all Gems (not socketed)
  if ((displayName.includes('level of all') || stat.includes('level of all')) &&
      !displayName.includes('socketed') && !stat.includes('socketed')) {
    return PRIORITY_CATEGORIES.ALL_GEM_LEVEL;
  }
  
  // 10. Chance to Avoid Elemental Ailments
  if (displayName.includes('avoid elemental') || stat.includes('avoid elemental') ||
      displayName.includes('elemental ailments') || stat.includes('elemental ailments')) {
    return PRIORITY_CATEGORIES.AVOID_ELEMENTAL_AILMENTS;
  }
  
  // 11. Attack Speed
  if (displayName.includes('attack speed') || stat.includes('attack speed')) {
    return PRIORITY_CATEGORIES.ATTACK_SPEED;
  }
  
  // 12. Adds # Damage (attack weapons) - including elemental damage
  if (displayName.includes('adds') && displayName.includes('damage') && 
      !displayName.includes('physical') && !displayName.includes('chaos')) {
    // Check if it's elemental damage first
    if (displayName.includes('fire damage') || stat.includes('adds fire damage')) {
      return PRIORITY_CATEGORIES.ADDS_FIRE_DAMAGE;
    }
    if (displayName.includes('cold damage') || stat.includes('adds cold damage')) {
      return PRIORITY_CATEGORIES.ADDS_COLD_DAMAGE;
    }
    if (displayName.includes('lightning damage') || stat.includes('adds lightning damage')) {
      return PRIORITY_CATEGORIES.ADDS_LIGHTNING_DAMAGE;
    }
    // Generic adds damage
    return PRIORITY_CATEGORIES.ADDS_DAMAGE;
  }
  
  // 13. Spell Damage
  if (displayName.includes('spell damage') || stat.includes('spell damage')) {
    return PRIORITY_CATEGORIES.SPELL_DAMAGE;
  }
  
  // 14. Cast Speed
  if (displayName.includes('cast speed') || stat.includes('cast speed')) {
    return PRIORITY_CATEGORIES.CAST_SPEED;
  }
  
  // 15. Chance to Block
  if (displayName.includes('chance to block') || stat.includes('chance to block')) {
    return PRIORITY_CATEGORIES.CHANCE_TO_BLOCK;
  }
  
  // 16. Mana (by itself, not hybrid)
  if ((displayName.includes('maximum mana') || stat.includes('maximum mana')) &&
      !displayName.includes('life') && !displayName.includes('energy shield') &&
      !displayName.includes('armour') && !displayName.includes('evasion')) {
    return PRIORITY_CATEGORIES.MANA_SOLO;
  }
  
  // 17. Elemental Damage with Attacks
  if (displayName.includes('elemental damage with attacks') || stat.includes('elemental damage with attacks') ||
      displayName.includes('elemental damage with attack') || stat.includes('elemental damage with attack')) {
    return PRIORITY_CATEGORIES.ELEMENTAL_DAMAGE_ATTACKS;
  }
  
  // 18. Critical Strike Multiplier
  if (displayName.includes('critical strike multiplier') || stat.includes('critical strike multiplier')) {
    return PRIORITY_CATEGORIES.CRIT_MULTIPLIER;
  }
  
  // 19. Critical Strike Chance
  if (displayName.includes('critical strike chance') || stat.includes('critical strike chance')) {
    return PRIORITY_CATEGORIES.CRIT_CHANCE;
  }
  
  // 20. Damage over Time Multiplier
  if (displayName.includes('damage over time multiplier') || stat.includes('damage over time multiplier')) {
    return PRIORITY_CATEGORIES.DOT_MULTIPLIER;
  }
  
  // Elemental resistances (grouped) - including "all Elemental Resistances"
  if (displayName.includes('all elemental resistances') || stat.includes('all elemental resistances')) {
    return PRIORITY_CATEGORIES.FIRE_RESIST; // Group with fire resistance
  }
  if (displayName.includes('fire resistance') || stat.includes('fire resistance')) {
    if (displayName.includes('maximum')) return PRIORITY_CATEGORIES.MAX_FIRE_RESIST;
    return PRIORITY_CATEGORIES.FIRE_RESIST;
  }
  if (displayName.includes('cold resistance') || stat.includes('cold resistance')) {
    if (displayName.includes('maximum')) return PRIORITY_CATEGORIES.MAX_COLD_RESIST;
    return PRIORITY_CATEGORIES.COLD_RESIST;
  }
  if (displayName.includes('lightning resistance') || stat.includes('lightning resistance')) {
    if (displayName.includes('maximum')) return PRIORITY_CATEGORIES.MAX_LIGHTNING_RESIST;
    return PRIORITY_CATEGORIES.LIGHTNING_RESIST;
  }
  
  // Elemental damage (grouped)
  if (displayName.includes('adds fire damage') || stat.includes('adds fire damage')) {
    return PRIORITY_CATEGORIES.ADDS_FIRE_DAMAGE;
  }
  if (displayName.includes('adds cold damage') || stat.includes('adds cold damage')) {
    return PRIORITY_CATEGORIES.ADDS_COLD_DAMAGE;
  }
  if (displayName.includes('adds lightning damage') || stat.includes('adds lightning damage')) {
    return PRIORITY_CATEGORIES.ADDS_LIGHTNING_DAMAGE;
  }
  
  // Additional categories for remaining families
  
  // Socketed gem levels (not high priority)
  if ((displayName.includes('socketed') || stat.includes('socketed')) &&
      (displayName.includes('level') || stat.includes('level'))) {
    return 'Socketed Gem Levels';
  }
  
  // Flask effects
  if (displayName.includes('flask') || stat.includes('flask')) {
    return 'Flask Effects';
  }
  
  // Item rarity
  if (displayName.includes('rarity') || stat.includes('rarity')) {
    return 'Item Rarity';
  }
  
  // Accuracy rating
  if (displayName.includes('accuracy') || stat.includes('accuracy')) {
    return 'Accuracy Rating';
  }
  
  // Projectile speed
  if (displayName.includes('projectile') || stat.includes('projectile')) {
    return 'Projectile Speed';
  }
  
  // Stun duration
  if (displayName.includes('stun duration') || stat.includes('stun duration')) {
    return 'Stun Duration';
  }
  
  // Damage recoup
  if (displayName.includes('recoup') || stat.includes('recoup')) {
    return 'Damage Recoup';
  }
  
  // Reduced damage taken
  if (displayName.includes('reduced') && (displayName.includes('damage') || stat.includes('damage'))) {
    return 'Reduced Damage Taken';
  }
  
  // Additional arrows
  if (displayName.includes('additional arrow') || stat.includes('additional arrow')) {
    return 'Additional Arrows';
  }
  
  // Chance to freeze/ignite/shock
  if (displayName.includes('chance to freeze') || stat.includes('chance to freeze') ||
      displayName.includes('chance to ignite') || stat.includes('chance to ignite') ||
      displayName.includes('chance to shock') || stat.includes('chance to shock')) {
    return 'Chance to Ailment';
  }
  
  // Elemental damage percentage (not adds)
  if ((displayName.includes('fire damage') || displayName.includes('cold damage') || displayName.includes('lightning damage')) &&
      displayName.includes('increased') && !displayName.includes('adds')) {
    return 'Elemental Damage %';
  }
  
  // Chaos damage
  if (displayName.includes('chaos damage') || stat.includes('chaos damage')) {
    return 'Chaos Damage';
  }
  
  // Minion families
  if (displayName.includes('minion') || stat.includes('minion') || name.includes('minion')) {
    return PRIORITY_CATEGORIES.MINION_RELATED;
  }
  
  // Bottom of barrel
  if (displayName.includes('light radius') || stat.includes('light radius')) {
    return PRIORITY_CATEGORIES.LIGHT_RADIUS;
  }
  if ((displayName.includes('stun and block recovery') || stat.includes('stun and block recovery')) &&
      !displayName.includes('armour') && !displayName.includes('evasion') && !displayName.includes('energy shield')) {
    return PRIORITY_CATEGORIES.STUN_BLOCK_RECOVERY_SOLO;
  }
  if (displayName.includes('stun threshold') || stat.includes('stun threshold')) {
    return PRIORITY_CATEGORIES.STUN_THRESHOLD;
  }
  if (displayName.includes('attribute requirements') || stat.includes('attribute requirements')) {
    return PRIORITY_CATEGORIES.ATTRIBUTE_REQUIREMENTS;
  }
  if (displayName.includes('reflects') || stat.includes('reflects')) {
    return PRIORITY_CATEGORIES.REFLECTS_DAMAGE;
  }
  if (displayName.includes('recharge speed') || stat.includes('recharge speed')) {
    return PRIORITY_CATEGORIES.ES_RECHARGE_SPEED;
  }
  if (displayName.includes('leech') || stat.includes('leech')) {
    return PRIORITY_CATEGORIES.LEECH;
  }
  if (displayName.includes('life per') || stat.includes('life per')) {
    return PRIORITY_CATEGORIES.LIFE_GAIN;
  }
  if (displayName.includes('mana per') || stat.includes('mana per')) {
    return PRIORITY_CATEGORIES.MANA_GAIN;
  }
  
  // 21. Attributes (Int/Dex/Str) - including "all Attributes" (moved to end)
  if (displayName.includes('intelligence') || displayName.includes('dexterity') || displayName.includes('strength') ||
      stat.includes('intelligence') || stat.includes('dexterity') || stat.includes('strength') ||
      displayName.includes('all attributes') || stat.includes('all attributes')) {
    return PRIORITY_CATEGORIES.ATTRIBUTES;
  }
  
  return PRIORITY_CATEGORIES.DEFAULT;
}

// Analyze all families
const analysis = {};
const categories = {};

Object.keys(data).forEach(familyName => {
  const family = data[familyName];
  const category = categorizeFamily(familyName, family);
  
  if (!categories[category]) {
    categories[category] = [];
  }
  categories[category].push({
    name: familyName,
    type: family.type,
    displayName: family.displayName,
    stat: family.mods[0]?.stat
  });
  
  analysis[familyName] = {
    category,
    type: family.type,
    displayName: family.displayName,
    stat: family.mods[0]?.stat
  };
});

// Print analysis
console.log('=== FAMILY CATEGORIZATION ANALYSIS ===\n');

Object.keys(categories).forEach(category => {
  console.log(`\n${category}:`);
  categories[category].forEach(family => {
    console.log(`  ${family.name} (${family.type}): ${family.displayName}`);
  });
});

console.log('\n=== SUMMARY ===');
Object.keys(categories).forEach(category => {
  console.log(`${category}: ${categories[category].length} families`);
});

// Save analysis to file
fs.writeFileSync('family_analysis.json', JSON.stringify({ analysis, categories }, null, 2));
console.log('\nAnalysis saved to family_analysis.json'); 