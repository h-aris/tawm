import fs from 'fs';

// Function to replace numbers, ranges, decimals, and negatives with # (or -#)
function replaceNumbersWithHash(statText) {
  // Replace negative number ranges (e.g., (-12--8)) with -#
  let result = statText.replace(/\(-\d+(?:\.\d+)?-\-\d+(?:\.\d+)?\)/g, '-#');

  // Replace number ranges (e.g., (31-35)) with #
  result = result.replace(/\(\-?\d+(?:\.\d+)?-\-?\d+(?:\.\d+)?\)/g, '#');

  // Replace negative decimals and negative numbers (not in parentheses)
  result = result.replace(/-\d+(?:\.\d+)?/g, '-#');

  // Replace standalone decimals and numbers (not in parentheses)
  result = result.replace(/\b\d+(?:\.\d+)?\b/g, '#');

  return result;
}

// Function to add spaces before plus signs and pound signs when needed
function addSpacesBeforeSymbols(text) {
  // Add space before + when preceded by character other than space or +
  let result = text.replace(/([^+\s])\+/g, '$1 +');
  
  // Add space before # when preceded by character other than space or + or #
  result = result.replace(/([^#+\s])#/g, '$1 #');
  
  return result;
}

// Read the current JSON file
const inputFile = 'public/modifierFamiliesDisplay_7.json';

try {
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  // Process each family
  Object.keys(data).forEach(familyKey => {
    const family = data[familyKey];
    
    if (family.mods && family.mods.length > 0) {
      // Get the T1 mod stat text
      const t1Mod = family.mods.find(mod => mod.tier === 'T1');
      
      if (t1Mod && t1Mod.stat) {
        // Update the display name based on the T1 stat text
        let displayName = replaceNumbersWithHash(t1Mod.stat);
        
        // Add spaces before symbols when needed
        displayName = addSpacesBeforeSymbols(displayName);
        
        family.displayName = displayName;
        
        console.log(`${familyKey}:`);
        console.log(`  Original: ${t1Mod.stat}`);
        console.log(`  New Display: ${family.displayName}`);
        console.log('');
      }
    }
  });
  
  // Write back to the same file
  fs.writeFileSync(inputFile, JSON.stringify(data, null, 2));
  
  console.log(`✅ Updated display names written back to ${inputFile}`);
  
} catch (error) {
  console.error('Error processing file:', error);
} 