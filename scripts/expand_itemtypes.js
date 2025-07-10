import fs from 'fs';
import path from 'path';

// Read the current itemtypes.json
const currentItemtypes = JSON.parse(fs.readFileSync('public/itemtypes.json', 'utf8'));

// Read the CSV file
const csvData = fs.readFileSync('src/data/CompItemtypes_v2.csv', 'utf8');
const lines = csvData.split('\n').slice(1); // Skip header

// Parse CSV and extract quiver data
const quiverFamilies = [];
lines.forEach(line => {
  const [equipment, family, subcategory] = line.split(',');
  if (equipment === 'Quiver') {
    quiverFamilies.push(family);
  }
});

// Create the expanded itemtypes object
const expandedItemtypes = { ...currentItemtypes };

// Add quivers with ALL subcategory
if (quiverFamilies.length > 0) {
  expandedItemtypes['Quiver'] = {
    'ALL': quiverFamilies
  };
}

// Write the expanded file
fs.writeFileSync('public/itemtypes_2.json', JSON.stringify(expandedItemtypes, null, 2));

console.log('Generated itemtypes_2.json with quivers included');
console.log(`Added ${quiverFamilies.length} quiver families to ALL subcategory`);
console.log('Quiver families:', quiverFamilies); 