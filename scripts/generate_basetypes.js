import fs from 'fs';

// Read the current itemtypes to get all equipment + subcategory combinations
const itemtypes = JSON.parse(fs.readFileSync('public/itemtypes_2.json', 'utf8'));

// Generate basetypes for each item type
const basetypes = {};

Object.entries(itemtypes).forEach(([equipment, subcategories]) => {
  basetypes[equipment] = {};
  
  Object.keys(subcategories).forEach(subcategory => {
    const basetypeList = [];
    for (let i = 1; i <= 10; i++) {
      basetypeList.push(`${equipment} ${subcategory} Base ${i}`);
    }
    basetypes[equipment][subcategory] = basetypeList;
  });
});

// Write the basetypes file
fs.writeFileSync('public/basetypes.json', JSON.stringify(basetypes, null, 2));

console.log('Generated basetypes.json with 10 basetypes for each item type');
console.log('Total item types:', Object.keys(basetypes).length);
Object.entries(basetypes).forEach(([equipment, subcategories]) => {
  console.log(`${equipment}: ${Object.keys(subcategories).length} subcategories`);
}); 