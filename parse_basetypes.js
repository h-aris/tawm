import fs from 'fs';
import path from 'path';

// Mapping from text file subcategories to JSON structure
const subcategoryMapping = {
  // Weapon mappings
  'Claw A': 'OneHandAttack.Claw',
  'Minion Wand C': 'OneHandCast.Minion Wand',
  'Dagger A': 'OneHandAttack.Dagger',
  'One Hand Axe A': 'OneHandAttack.One Hand Axe',
  'One Hand Mace A': 'OneHandAttack.One Hand Mace',
  'One Hand Sword A': 'OneHandAttack.One Hand Sword',
  'Rune Dagger C': 'OneHandCast.Rune Dagger',
  'Sceptre C': 'OneHandCast.Sceptre',
  'Thrusting One Hand Sword A': 'OneHandAttack.Thrusting One Hand Sword',
  'Wand C': 'OneHandCast.Wand',
  'Bow A': 'TwoHandAttack.Bow',
  'Staff C': 'TwoHandCast.Staff',
  'Two Hand Axe A': 'TwoHandAttack.Two Hand Axe',
  'Two Hand Mace A': 'TwoHandAttack.Two Hand Mace',
  'Two Hand Sword A': 'TwoHandAttack.Two Hand Sword',
  'Warstaff A': 'TwoHandAttack.Warstaff',
  
  // Armor mappings
  'Body Armour (DEX)': 'Body Armour.Dex',
  'Body Armour (DEX/INT)': 'Body Armour.DexInt',
  'Body Armour (INT)': 'Body Armour.Int',
  'Body Armour (STR)': 'Body Armour.Str',
  'Body Armour (STR/DEX)': 'Body Armour.StrDex',
  'Body Armour (STR/INT)': 'Body Armour.StrInt',
  'Boots (DEX)': 'Boots.Dex',
  'Boots (DEX/INT)': 'Boots.DexInt',
  'Boots (INT)': 'Boots.Int',
  'Boots (STR)': 'Boots.Str',
  'Boots (STR/DEX)': 'Boots.StrDex',
  'Boots (STR/INT)': 'Boots.StrInt',
  'Gloves (DEX)': 'Gloves.Dex',
  'Gloves (DEX/INT)': 'Gloves.DexInt',
  'Gloves (INT)': 'Gloves.Int',
  'Gloves (STR)': 'Gloves.Str',
  'Gloves (STR/DEX)': 'Gloves.StrDex',
  'Gloves (STR/INT)': 'Gloves.StrInt',
  'Helmet (DEX)': 'Helmets.Dex',
  'Helmet (DEX/INT)': 'Helmets.DexInt',
  'Helmet (INT)': 'Helmets.Int',
  'Helmet (STR)': 'Helmets.Str',
  'Helmet (STR/DEX)': 'Helmets.StrDex',
  'Helmet (STR/INT)': 'Helmets.StrInt',
  
  // Jewellery mappings
  'Amulet': 'Jewellery.Amulet',
  'Belt': 'Jewellery.Belt',
  'Ring': 'Jewellery.Ring',
  
  // Offhand mappings
  'Quiver': 'Quiver.Quiver',
  'Shield (DEX)': 'Shield.Dex',
  'Shield (DEX/INT)': 'Shield.DexInt',
  'Shield (INT)': 'Shield.Int',
  'Shield (STR)': 'Shield.Str',
  'Shield (STR/DEX)': 'Shield.StrDex',
  'Shield (STR/INT)': 'Shield.StrInt'
};

function parseWeaponBasetypes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const result = {};
  
  // First pass: collect subcategory names
  const subcategories = [];
  let inSubcategoryList = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'OneHanded:' || trimmed === 'TwoHanded:') {
      inSubcategoryList = true;
      continue;
    }
    if (trimmed === '-----------') {
      inSubcategoryList = false;
      break;
    }
    if (inSubcategoryList && trimmed && !trimmed.startsWith('The following')) {
      subcategories.push(trimmed);
    }
  }
  
  // Second pass: parse basetypes
  let currentSubcategory = null;
  let currentBasetypes = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('SUBCAT:')) {
      // Save previous subcategory if exists
      if (currentSubcategory && currentBasetypes.length > 0) {
        const mappedKey = subcategoryMapping[currentSubcategory];
        if (mappedKey) {
          const [equipment, subcategory] = mappedKey.split('.');
          if (!result[equipment]) {
            result[equipment] = {};
          }
          result[equipment][subcategory] = currentBasetypes.filter(b => b !== 'None' && b !== 'Choose an item');
        }
      }
      
      // Start new subcategory
      const subcatName = line.split(':')[1].trim();
      // Find the corresponding subcategory with A/C suffix - use exact match first, then partial
      let matchingSubcat = subcategories.find(s => s === subcatName + ' A' || s === subcatName + ' C');
      if (!matchingSubcat) {
        matchingSubcat = subcategories.find(s => s.includes(subcatName));
      }
      currentSubcategory = matchingSubcat || subcatName;
      currentBasetypes = [];
    }
    // Check if this is a basetype line (not empty, not a separator)
    else if (line && !line.startsWith('***') && !line.startsWith('The following') && 
             !line.startsWith('OneHanded:') && !line.startsWith('TwoHanded:') && 
             !line.startsWith('-----------') && currentSubcategory) {
      currentBasetypes.push(line);
    }
  }
  
  // Save the last subcategory
  if (currentSubcategory && currentBasetypes.length > 0) {
    const mappedKey = subcategoryMapping[currentSubcategory];
    if (mappedKey) {
      const [equipment, subcategory] = mappedKey.split('.');
      if (!result[equipment]) {
        result[equipment] = {};
      }
      result[equipment][subcategory] = currentBasetypes.filter(b => b !== 'None' && b !== 'Choose an item');
    }
  }
  
  return result;
}

function parseNonWeaponBasetypes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const result = {};
  
  let currentSubcategory = null;
  let currentBasetypes = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('The following') || line.startsWith('---')) {
      continue;
    }
    
    // Check if this is a subcategory line (contains parentheses OR is a standalone category)
    if ((line.includes('(') && (line.includes('Body Armour') || line.includes('Boots') || 
                               line.includes('Gloves') || line.includes('Helmet'))) ||
        line === 'Amulet' || line === 'Belt' || line === 'Ring') {
      // Save previous subcategory if exists
      if (currentSubcategory && currentBasetypes.length > 0) {
        const mappedKey = subcategoryMapping[currentSubcategory];
        if (mappedKey) {
          const [equipment, subcategory] = mappedKey.split('.');
          if (!result[equipment]) {
            result[equipment] = {};
          }
          result[equipment][subcategory] = currentBasetypes.filter(b => b !== 'None' && b !== 'Choose an item');
        }
      }
      
      // Start new subcategory
      currentSubcategory = line;
      currentBasetypes = [];
    }
    // Check if this is a basetype line (not empty, not a separator)
    else if (line && !line.startsWith('***')) {
      currentBasetypes.push(line);
    }
  }
  
  // Save the last subcategory
  if (currentSubcategory && currentBasetypes.length > 0) {
    const mappedKey = subcategoryMapping[currentSubcategory];
    if (mappedKey) {
      const [equipment, subcategory] = mappedKey.split('.');
      if (!result[equipment]) {
        result[equipment] = {};
      }
      result[equipment][subcategory] = currentBasetypes.filter(b => b !== 'None' && b !== 'Choose an item');
    }
  }
  
  return result;
}

function parseOffhandBasetypes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const result = {};
  
  let currentSubcategory = null;
  let currentBasetypes = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('Parse as before') || line.startsWith('---')) {
      continue;
    }
    
    // Check if this is a subcategory line (contains parentheses or is "Quiver")
    if (line.includes('(') || line === 'Quiver') {
      // Save previous subcategory if exists
      if (currentSubcategory && currentBasetypes.length > 0) {
        const mappedKey = subcategoryMapping[currentSubcategory];
        if (mappedKey) {
          const [equipment, subcategory] = mappedKey.split('.');
          if (!result[equipment]) {
            result[equipment] = {};
          }
          result[equipment][subcategory] = currentBasetypes.filter(b => b !== 'None' && b !== 'Choose an item');
        }
      }
      
      // Start new subcategory
      currentSubcategory = line;
      currentBasetypes = [];
    }
    // Check if this is a basetype line (not empty, not a separator)
    else if (line && !line.startsWith('***')) {
      currentBasetypes.push(line);
    }
  }
  
  // Save the last subcategory
  if (currentSubcategory && currentBasetypes.length > 0) {
    const mappedKey = subcategoryMapping[currentSubcategory];
    if (mappedKey) {
      const [equipment, subcategory] = mappedKey.split('.');
      if (!result[equipment]) {
        result[equipment] = {};
      }
      result[equipment][subcategory] = currentBasetypes.filter(b => b !== 'None' && b !== 'Choose an item');
    }
  }
  
  return result;
}

// Parse all three files
const weaponBasetypes = parseWeaponBasetypes('./public/weaponbasetypes.txt');
const nonweaponBasetypes = parseNonWeaponBasetypes('./public/nonweaponbasetypes.txt');
const offhandBasetypes = parseOffhandBasetypes('./public/offhandbasetypes.txt');

// Merge all results
const allBasetypes = { ...weaponBasetypes, ...nonweaponBasetypes, ...offhandBasetypes };

// Write the result
fs.writeFileSync('./public/basetypes_5.json', JSON.stringify(allBasetypes, null, 2));

console.log('Basetypes parsed successfully!');
console.log('Equipment types found:', Object.keys(allBasetypes));
console.log('Total subcategories:', Object.values(allBasetypes).reduce((sum, equipment) => sum + Object.keys(equipment).length, 0));

// Log some details for debugging
for (const [equipment, subcats] of Object.entries(allBasetypes)) {
  console.log(`${equipment}:`);
  for (const [subcat, basetypes] of Object.entries(subcats)) {
    console.log(`  ${subcat}: ${basetypes.length} basetypes`);
  }
} 