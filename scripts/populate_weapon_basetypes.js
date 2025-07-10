import fs from 'fs';

// Read the current data files
const currentFamilies = JSON.parse(fs.readFileSync('public/modifierFamiliesDisplay_4.json', 'utf8'));
const currentItemtypes = JSON.parse(fs.readFileSync('public/itemtypes_3.json', 'utf8'));
const currentBasetypes = JSON.parse(fs.readFileSync('public/basetypes_2.json', 'utf8'));

// Define the weapon subcategories and their basetypes
const weaponData = {
  'OneHandAttack': {
    'Claw': [
      'Nailed Fist', 'Sharktooth Claw', 'Awl', 'Cat\'s Paw', 'Blinder', 'Timeworn Claw', 
      'Sparkling Claw', 'Fright Claw', 'Double Claw', 'Thresher Claw', 'Gouger', 
      'Tiger\'s Paw', 'Gut Ripper', 'Prehistoric Claw', 'Noble Claw'
    ],
    'Dagger': [
      'Glass Shank', 'Skinning Knife', 'Stiletto', 'Flaying Knife', 'Prong Dagger', 
      'Poignard', 'Trisula', 'Gutting Knife', 'Ambusher', 'Sai'
    ],
    'One Hand Axe': [
      'Rusted Hatchet', 'Jade Hatchet', 'Boarding Axe', 'Cleaver', 'Broad Axe', 
      'Arming Axe', 'Decorative Axe', 'Spectral Axe', 'Etched Hatchet', 'Jasper Axe', 
      'Tomahawk', 'Wrist Chopper', 'War Axe', 'Chest Splitter', 'Ceremonial Axe'
    ],
    'One Hand Mace': [
      'Driftwood Club', 'Tribal Club', 'Spiked Club', 'Stone Hammer', 'War Hammer', 
      'Bladed Mace', 'Ceremonial Mace', 'Dream Mace', 'Wyrm Mace', 'Petrified Club', 
      'Barbed Club', 'Rock Breaker', 'Battle Hammer', 'Flanged Mace', 'Ornate Mace'
    ],
    'One Hand Sword': [
      'Golden Blade', 'Rusted Sword', 'Charan\'s Sword', 'Copper Sword', 'Sabre', 
      'Broad Sword', 'War Sword', 'Ancient Sword', 'Elegant Sword', 'Dusk Blade', 
      'Hook Sword', 'Variscite Blade', 'Cutlass', 'Baselard', 'Battle Sword'
    ],
    'Thrusting One Hand Sword': [
      'Rusted Spike', 'Whalebone Rapier', 'Battered Foil', 'Basket Rapier', 'Jagged Foil', 
      'Antique Rapier', 'Elegant Foil', 'Thorn Rapier', 'Smallsword', 'Wyrmbone Rapier', 
      'Burnished Foil', 'Estoc', 'Serrated Foil', 'Primeval Rapier', 'Fancy Foil'
    ]
  },
  'OneHandCast': {
    'Minion Wand': [
      'Calling Wand', 'Convening Wand', 'Convoking Wand'
    ],
    'Rune Dagger': [
      'Carving Knife', 'Boot Knife', 'Copper Kris', 'Skean', 'Imp Dagger', 
      'Butcher Knife', 'Boot Blade', 'Golden Kris', 'Royal Skean', 'Fiend Dagger', 
      'Slaughter Knife', 'Ezomyte Dagger', 'Platinum Kris', 'Imperial Skean', 'Demon Dagger'
    ],
    'Sceptre': [
      'Driftwood Sceptre', 'Darkwood Sceptre', 'Bronze Sceptre', 'Quartz Sceptre', 
      'Iron Sceptre', 'Ochre Sceptre', 'Ritual Sceptre', 'Shadow Sceptre', 'Grinning Fetish', 
      'Horned Sceptre', 'Sekhem', 'Crystal Sceptre', 'Lead Sceptre', 'Blood Sceptre', 'Royal Sceptre'
    ],
    'Wand': [
      'Driftwood Wand', 'Goat\'s Horn', 'Carved Wand', 'Quartz Wand', 'Spiraled Wand', 
      'Sage Wand', 'Pagan Wand', 'Faun\'s Horn', 'Engraved Wand', 'Crystal Wand', 
      'Coiled Wand', 'Omen Wand', 'Heathen Wand', 'Demon\'s Horn', 'Imbued Wand'
    ]
  },
  'TwoHandAttack': {
    'Bow': [
      'Crude Bow', 'Short Bow', 'Long Bow', 'Composite Bow', 'Recurve Bow', 
      'Bone Bow', 'Royal Bow', 'Death Bow', 'Grove Bow', 'Reflex Bow', 
      'Decurve Bow', 'Compound Bow', 'Sniper Bow', 'Ivory Bow', 'Highborn Bow'
    ],
    'Two Hand Axe': [
      'Stone Axe', 'Jade Chopper', 'Woodsplitter', 'Poleaxe', 'Double Axe', 
      'Gilded Axe', 'Shadow Axe', 'Dagger Axe', 'Jasper Chopper', 'Timber Axe', 
      'Headsman Axe', 'Labrys', 'Noble Axe', 'Abyssal Axe', 'Karui Chopper'
    ],
    'Two Hand Mace': [
      'Driftwood Maul', 'Solar Maul', 'Karui Maul', 'Totemic Maul', 'Meatgrinder', 
      'Imperial Maul', 'Terror Maul', 'Coronal Maul', 'Sovereign Maul', 'Ursine Mace', 
      'Auric Mace', 'Harbinger Mace', 'Adze', 'Shadow Sceptre', 'Grinning Fetish'
    ],
    'Two Hand Sword': [
      'Corroded Blade', 'Longsword', 'Bastard Sword', 'Two-Handed Sword', 'Etched Greatsword', 
      'Ornate Sword', 'Spectral Sword', 'Curved Blade', 'Butcher Sword', 'Footman Sword', 
      'Highland Blade', 'Engraved Greatsword', 'Tiger Sword', 'Wraith Sword', 'Lithe Blade'
    ],
    'Warstaff': [
      'Iron Staff', 'Coiled Staff', 'Vile Staff', 'Military Staff', 'Serpentine Staff', 
      'Foul Staff', 'Ezomyte Staff', 'Maelström Staff', 'Judgement Staff'
    ]
  },
  'TwoHandCast': {
    'Staff': [
      'Gnarled Branch', 'Primitive Staff', 'Long Staff', 'Royal Staff', 'Crescent Staff', 
      'Woodful Staff', 'Quarterstaff', 'Highborn Staff', 'Moon Staff', 'Primordial Staff', 
      'Lathi', 'Imperial Staff', 'Eclipse Staff'
    ]
  }
};

// Create new itemtypes structure
const newItemtypes = { ...currentItemtypes };

// Update weapon equipment types with real subcategories
Object.entries(weaponData).forEach(([equipment, subcategories]) => {
  newItemtypes[equipment] = {};
  
  Object.entries(subcategories).forEach(([subcategory, families]) => {
    // Copy families from the current weapon structure (which has placeholder subcategories)
    // We'll use the first subcategory's families as the source
    const sourceSubcategory = Object.keys(currentItemtypes[equipment])[0];
    newItemtypes[equipment][subcategory] = currentItemtypes[equipment][sourceSubcategory];
  });
});

// Create new basetypes structure
const newBasetypes = { ...currentBasetypes };

// Update weapon equipment types with real basetypes
Object.entries(weaponData).forEach(([equipment, subcategories]) => {
  newBasetypes[equipment] = {};
  
  Object.entries(subcategories).forEach(([subcategory, basetypes]) => {
    newBasetypes[equipment][subcategory] = basetypes;
  });
});

// Write the new files
fs.writeFileSync('public/modifierFamiliesDisplay_5.json', JSON.stringify(currentFamilies, null, 2));
fs.writeFileSync('public/itemtypes_4.json', JSON.stringify(newItemtypes, null, 2));
fs.writeFileSync('public/basetypes_3.json', JSON.stringify(newBasetypes, null, 2));

console.log('Generated new weapon structure with real subcategories and basetypes:');
console.log('- modifierFamiliesDisplay_5.json (same as v4)');
console.log('- itemtypes_4.json (real weapon subcategories)');
console.log('- basetypes_3.json (real weapon basetypes)');

console.log('\nWeapon equipment types and their subcategories:');
Object.entries(weaponData).forEach(([equipment, subcategories]) => {
  console.log(`- ${equipment}: ${Object.keys(subcategories).length} subcategories`);
  Object.keys(subcategories).forEach(subcategory => {
    console.log(`  - ${subcategory}: ${subcategories[subcategory].length} basetypes`);
  });
}); 