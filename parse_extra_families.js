import fs from 'fs';

// Function to generate display name from stat
function generateDisplayName(stat) {
    // Replace numbers with # symbols
    let displayName = stat.replace(/\d+/g, '#');
    
    // Handle specific patterns
    displayName = displayName.replace(/\(#â€"#\)/g, '(#-#)');
    displayName = displayName.replace(/\(#â€"##\)/g, '(#-##)');
    displayName = displayName.replace(/\(#â€"###\)/g, '(#-###)');
    
    // Handle percentage ranges
    displayName = displayName.replace(/\(#â€"#\)%/g, '(#-#)%');
    displayName = displayName.replace(/\(#â€"##\)%/g, '(#-##)%');
    displayName = displayName.replace(/\(#â€"###\)%/g, '(#-###)%');
    
    // Handle specific patterns from the extra families
    displayName = displayName.replace(/Minions deal \(#â€"#\)% increased Damage/g, 'Minions deal (#-#)% increased Damage');
    displayName = displayName.replace(/Minions have \(#â€"#\)% increased Attack and Cast Speed/g, 'Minions have (#-#)% increased Attack and Cast Speed');
    displayName = displayName.replace(/Minions have \(#â€"##\)% increased maximum Life/g, 'Minions have (#-##)% increased maximum Life');
    displayName = displayName.replace(/Minions have \(#â€"##\)% increased Movement Speed/g, 'Minions have (#-##)% increased Movement Speed');
    displayName = displayName.replace(/Minions have \+\#â€"#\)% to all Elemental Resistances/g, 'Minions have +(#-#)% to all Elemental Resistances');
    displayName = displayName.replace(/Minions have \(#â€"#\)% additional Physical Damage Reduction/g, 'Minions have (#-#)% additional Physical Damage Reduction');
    displayName = displayName.replace(/Minions have \(#â€"##\)% increased Critical Strike Chance/g, 'Minions have (#-##)% increased Critical Strike Chance');
    
    return displayName;
}

// Function to parse extra families file
function parseExtraFamilies(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const families = {};
    let currentSubcat = null;
    let currentFamily = null;
    let currentMods = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) continue;
        
        // Check for subcategory
        if (line.startsWith('Subcat:')) {
            currentSubcat = line.split(':')[1].trim();
            continue;
        }
        
        // Check for family
        if (line.startsWith('Family:')) {
            // Save previous family if exists
            if (currentFamily && currentMods.length > 0) {
                families[currentFamily] = {
                    mods: currentMods,
                    type: currentMods[0].name.startsWith('of') ? 'Suffix' : 'Prefix',
                    displayName: generateDisplayName(currentMods[0].stat)
                };
            }
            
            currentFamily = line.split(':')[1].trim();
            currentMods = [];
            continue;
        }
        
        // Parse mod lines (name and stat separated by tab)
        if (currentFamily && line && !line.startsWith('***')) {
            const parts = line.split('\t');
            if (parts.length >= 2) {
                const name = parts[0].trim();
                const stat = parts.slice(1).join('\t').trim();
                
                // Determine tier based on position (bottom is T1)
                const tierIndex = currentMods.length;
                const tier = `T${tierIndex + 1}`;
                
                currentMods.push({
                    tier: tier,
                    name: name,
                    stat: stat
                });
            }
        }
    }
    
    // Save last family
    if (currentFamily && currentMods.length > 0) {
        families[currentFamily] = {
            mods: currentMods,
            type: currentMods[0].name.startsWith('of') ? 'Suffix' : 'Prefix',
            displayName: generateDisplayName(currentMods[0].stat)
        };
    }
    
    return families;
}

// Load existing modifierFamiliesDisplay
const existingFamilies = JSON.parse(fs.readFileSync('public/modifierFamiliesDisplay_5.json', 'utf8'));

// Parse extra families
console.log('Parsing extra families...');
const extraFamilies = parseExtraFamilies('public/extrafamilies.txt');

// Check for conflicts
console.log('\nChecking for conflicts...');
const conflicts = [];
for (const familyName of Object.keys(extraFamilies)) {
    if (existingFamilies[familyName]) {
        conflicts.push(familyName);
    }
}

if (conflicts.length > 0) {
    console.log('Found conflicts with existing families:');
    for (const conflict of conflicts) {
        console.log(`- ${conflict}`);
    }
    console.log('Renaming conflicting families...');
    
    // Rename conflicting families
    for (const conflict of conflicts) {
        const newName = `${conflict}_Extra`;
        extraFamilies[newName] = extraFamilies[conflict];
        delete extraFamilies[conflict];
        console.log(`Renamed ${conflict} to ${newName}`);
    }
}

// Merge families
const mergedFamilies = { ...existingFamilies, ...extraFamilies };

// Write the new file
fs.writeFileSync('public/modifierFamiliesDisplay_6.json', JSON.stringify(mergedFamilies, null, 2));
console.log('\nCreated public/modifierFamiliesDisplay_6.json');

// Log statistics
console.log('\nFamily statistics:');
console.log(`Original families: ${Object.keys(existingFamilies).length}`);
console.log(`Extra families: ${Object.keys(extraFamilies).length}`);
console.log(`Total families: ${Object.keys(mergedFamilies).length}`);

console.log('\nExtra families added:');
for (const [familyName, family] of Object.entries(extraFamilies)) {
    console.log(`- ${familyName} (${family.type}): ${family.mods.length} tiers`);
} 