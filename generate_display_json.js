import fs from 'fs';

// Read the original JSON file
const originalData = JSON.parse(fs.readFileSync('public/modifierFamilies_fixed.json', 'utf8'));

// Function to comprehensively replace all numbers with #
function replaceAllNumbers(stat) {
  // Replace ranges like (25-28) with #
  stat = stat.replace(/\(\d+-\d+\)/g, '#');
  
  // Replace single numbers like 25 with #
  stat = stat.replace(/\b\d+\b/g, '#');
  
  // Replace percentages like 25% with #%
  stat = stat.replace(/\d+%/g, '#%');
  
  // Replace any remaining number patterns
  stat = stat.replace(/\d+/g, '#');
  
  return stat;
}

// Function to generate display name from stats
function generateDisplayName(familyName, mods) {
  if (!mods || mods.length === 0) return familyName;
  
  // Get the first mod's stat to analyze the pattern
  const firstStat = mods[0].stat;
  
  // Common patterns and their display names
  const patterns = [
    // Attribute patterns
    { regex: /\+\(\d+-\d+\) to all Attributes/, display: "+# to all Attributes" },
    { regex: /\+\(\d+-\d+\) to (Strength|Dexterity|Intelligence)/, display: "+# to $1" },
    
    // Gem level patterns
    { regex: /\+(\d+) to Level of all (\w+) Spell Skill Gems/, display: "+# to Level of all $2 Spell Gems" },
    { regex: /\+(\d+) to Level of all (\w+) Skill Gems/, display: "+# to Level of all $2 Gems" },
    { regex: /\+(\d+) to Level of Socketed (\w+) Gems/, display: "+# to Level of Socketed $2 Gems" },
    
    // Damage patterns
    { regex: /Adds \((\d+-\d+)\) to \((\d+-\d+)\) (\w+) Damage to Spells/, display: "Adds # to # $3 Damage to Spells" },
    { regex: /Adds \((\d+-\d+)\) to \((\d+-\d+)\) (\w+) Damage to Attacks/, display: "Adds # to # $3 Damage to Attacks" },
    
    // Bow patterns
    { regex: /Bow Attacks fire (\d+) additional Arrow/, display: "Bow Attacks fire # additional Arrow" },
    { regex: /Bow Attacks fire (\d+) additional Arrows/, display: "Bow Attacks fire # additional Arrows" },
    
    // Suppression patterns
    { regex: /\+\(\d+-\d+\)% chance to Suppress Spell Damage/, display: "+#% chance to Suppress Spell Damage" },
    
    // Resistance patterns
    { regex: /\+\(\d+-\d+\)% to (\w+) Resistance/, display: "+#% to $1 Resistance" },
    
    // Life patterns
    { regex: /\+\(\d+-\d+\) to maximum Life/, display: "+# to maximum Life" },
    
    // Generic patterns
    { regex: /\+(\d+)% to (\w+)/, display: "+#% to $2" },
    { regex: /\+(\d+) to (\w+)/, display: "+# to $2" },
    { regex: /(\d+)% increased (\w+)/, display: "#% increased $2" },
    { regex: /(\d+)% more (\w+)/, display: "#% more $2" },
  ];
  
  // Try to match patterns
  for (const pattern of patterns) {
    const match = firstStat.match(pattern.regex);
    if (match) {
      // Replace capture group references with actual values
      let display = pattern.display;
      for (let i = 1; i < match.length; i++) {
        display = display.replace(`$${i}`, match[i]);
      }
      return display;
    }
  }
  
  // Handle "increased" patterns with multiple stats
  if (firstStat.includes('increased') && (firstStat.includes(',') || firstStat.includes(' and '))) {
    // Extract the percentage part
    const percentMatch = firstStat.match(/\((\d+-\d+)\)% increased/);
    if (percentMatch) {
      const percentPart = "#% increased";
      
      // Split the stats after "increased"
      const afterIncreased = firstStat.split('increased ')[1];
      const statParts = afterIncreased.split(/,\s*|\s+and\s+/);
      
      const displayParts = statParts.map(part => {
        part = part.trim();
        // Convert common stat names to their proper display format
        if (part.includes('Armour')) return 'Armour';
        if (part.includes('Evasion Rating')) return 'Evasion Rating';
        if (part.includes('Energy Shield')) return 'Energy Shield';
        if (part.includes('Rarity of Items found')) return 'Rarity of Items found';
        return part;
      });
      
      return `${percentPart} ${displayParts.join(', ')}`;
    }
  }
  
  // Handle multiple stats (split by comma or "and")
  if (firstStat.includes(',') || firstStat.includes(' and ')) {
    const parts = firstStat.split(/,\s*|\s+and\s+/);
    const displayParts = parts.map(part => {
      // Try to create a display name for each part
      if (part.includes('to Armour')) return '+# to Armour';
      if (part.includes('to Evasion Rating')) return '+# to Evasion Rating';
      if (part.includes('to Energy Shield')) return '+# to Energy Shield';
      if (part.includes('% to')) return part.replace(/\+\(\d+-\d+\)%/, '+#%');
      if (part.includes('to ')) return part.replace(/\+\(\d+-\d+\)/, '+#');
      return replaceAllNumbers(part);
    });
    return displayParts.join(', ');
  }
  
  // If no pattern matches, use comprehensive number replacement
  return replaceAllNumbers(firstStat);
}

// Process each family
const newData = {};
for (const [familyName, familyData] of Object.entries(originalData)) {
  const displayName = generateDisplayName(familyName, familyData.mods);
  
  newData[familyName] = {
    ...familyData,
    displayName: displayName
  };
}

// Write the new JSON file
fs.writeFileSync('public/modifierFamiliesDisplay_3.json', JSON.stringify(newData, null, 2));

console.log('Generated modifierFamiliesDisplay_3.json with display names');
console.log('Total families processed:', Object.keys(newData).length); 