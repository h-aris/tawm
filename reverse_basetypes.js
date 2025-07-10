import fs from 'fs';

// Read the current basetypes JSON
const basetypesData = JSON.parse(fs.readFileSync('./public/basetypes_5.json', 'utf8'));

// Function to reverse all basetype arrays recursively
function reverseBasetypeArrays(obj) {
  if (Array.isArray(obj)) {
    // If it's an array, reverse it
    return obj.reverse();
  } else if (typeof obj === 'object' && obj !== null) {
    // If it's an object, process each property
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = reverseBasetypeArrays(value);
    }
    return result;
  } else {
    // If it's a primitive value, return as is
    return obj;
  }
}

// Reverse all basetype arrays
const reversedBasetypes = reverseBasetypeArrays(basetypesData);

// Write the reversed data back to the file
fs.writeFileSync('./public/basetypes_5.json', JSON.stringify(reversedBasetypes, null, 2));

console.log('All basetype arrays have been reversed successfully!'); 