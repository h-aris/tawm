import fs from 'fs';

// Read the current data files
const currentFamilies = JSON.parse(fs.readFileSync('public/modifierFamiliesDisplay_3.json', 'utf8'));
const currentItemtypes = JSON.parse(fs.readFileSync('public/itemtypes_2.json', 'utf8'));
const currentBasetypes = JSON.parse(fs.readFileSync('public/basetypes.json', 'utf8'));

// Define the new weapon structure
const newWeaponStructure = {
  'OneHandAttack': {
    sourceEquipment: 'Attack Weapons',
    sourceSubcategory: 'OneHanded'
  },
  'OneHandCast': {
    sourceEquipment: 'Caster Weapons', 
    sourceSubcategory: 'OneHanded'
  },
  'TwoHandAttack': {
    sourceEquipment: 'Attack Weapons',
    sourceSubcategory: 'TwoHanded'
  },
  'TwoHandCast': {
    sourceEquipment: 'Caster Weapons',
    sourceSubcategory: 'TwoHanded'
  }
};

// Create new itemtypes structure
const newItemtypes = { ...currentItemtypes };

// Remove old weapon equipment types
delete newItemtypes['Attack Weapons'];
delete newItemtypes['Caster Weapons'];

// Add new weapon equipment types
Object.entries(newWeaponStructure).forEach(([newEquipment, config]) => {
  newItemtypes[newEquipment] = {};
  
  // Create 6 subcategories for each new equipment type
  for (let i = 1; i <= 6; i++) {
    const subcategoryName = `Subcat ${i}`;
    // Copy families from the source equipment/subcategory
    newItemtypes[newEquipment][subcategoryName] = 
      currentItemtypes[config.sourceEquipment][config.sourceSubcategory];
  }
});

// Create new basetypes structure
const newBasetypes = { ...currentBasetypes };

// Remove old weapon equipment types
delete newBasetypes['Attack Weapons'];
delete newBasetypes['Caster Weapons'];

// Add new weapon equipment types with basetypes
Object.entries(newWeaponStructure).forEach(([newEquipment, config]) => {
  newBasetypes[newEquipment] = {};
  
  // Create 6 subcategories for each new equipment type
  for (let i = 1; i <= 6; i++) {
    const subcategoryName = `Subcat ${i}`;
    newBasetypes[newEquipment][subcategoryName] = [];
    
    // Create 10 basetypes for each subcategory
    for (let j = 1; j <= 10; j++) {
      newBasetypes[newEquipment][subcategoryName].push(`${newEquipment} ${subcategoryName} Base ${j}`);
    }
  }
});

// Write the new files
fs.writeFileSync('public/modifierFamiliesDisplay_4.json', JSON.stringify(currentFamilies, null, 2));
fs.writeFileSync('public/itemtypes_3.json', JSON.stringify(newItemtypes, null, 2));
fs.writeFileSync('public/basetypes_2.json', JSON.stringify(newBasetypes, null, 2));

console.log('Generated new weapon structure:');
console.log('- modifierFamiliesDisplay_4.json (same as v3)');
console.log('- itemtypes_3.json (expanded weapons)');
console.log('- basetypes_2.json (expanded weapons)');

console.log('\nNew equipment types:');
Object.keys(newWeaponStructure).forEach(equipment => {
  console.log(`- ${equipment}: 6 subcategories, 10 basetypes each`);
}); 