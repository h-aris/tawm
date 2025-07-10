import fs from 'fs';

// Read the extra families file
const extraFamiliesContent = fs.readFileSync('./public/extrafamilies.txt', 'utf8');
const lines = extraFamiliesContent.split('\n');

// Read the existing modifier families
const existingFamilies = JSON.parse(fs.readFileSync('./public/modifierFamiliesDisplay_5.json', 'utf8'));

// Parse extra families
const extraFamilies = {};
let currentSubcategory = null;
let currentFamily = null;
let currentType = null;

for (const line of lines) {
  const trimmed = line.trim();
  
  if (!trimmed || trimmed.startsWith('extra mod families') || trimmed.startsWith('***')) {
    continue;
  }
  
  if (trimmed.startsWith('Subcat:')) {
    currentSubcategory = trimmed.split(':')[1].trim();
    continue;
  }
  
  if (trimmed.startsWith('Family:')) {
    currentFamily = trimmed.split(':')[1].trim();
    currentType = null;
    continue;
  }
  
  // Parse mod entries (name and stat separated by tabs)
  if (currentFamily && trimmed) {
    const parts = trimmed.split('\t').filter(part => part.trim());
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const stat = parts[1].trim();
      
      // Determine type based on name
      if (name.startsWith('of ')) {
        currentType = 'Suffix';
      } else {
        currentType = 'Prefix';
      }
      
      // Generate tier based on position (T1, T2, T3, etc.)
      const tier = `T${Object.keys(extraFamilies[currentFamily]?.mods || {}).length + 1}`;
      
      // Initialize family if not exists
      if (!extraFamilies[currentFamily]) {
        extraFamilies[currentFamily] = {
          type: currentType,
          mods: [],
          displayName: generateDisplayName(currentFamily)
        };
      }
      
      // Add mod to family
      extraFamilies[currentFamily].mods.push({
        tier,
        name,
        stat
      });
    }
  }
}

// Function to generate display name from family name
function generateDisplayName(familyName) {
  // Convert camelCase to Title Case
  return familyName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Merge extra families into existing families
const mergedFamilies = { ...existingFamilies, ...extraFamilies };

// Write the merged families back to the file
fs.writeFileSync('./public/modifierFamiliesDisplay_6.json', JSON.stringify(mergedFamilies, null, 2));

console.log('Extra families merged successfully!');
console.log('New families added:', Object.keys(extraFamilies));
console.log('Total families:', Object.keys(mergedFamilies).length);

// Log some details about the new families
for (const [familyName, family] of Object.entries(extraFamilies)) {
  console.log(`${familyName} (${family.type}): ${family.mods.length} tiers`);
} 