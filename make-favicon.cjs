const sharp = require('sharp');

// Load the image
sharp('public/fra.png')
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    // Replace white pixels with transparent
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // If pixel is close to white, make it transparent
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0; // alpha
      }
    }
    return sharp(data, { raw: info })
      .png()
      .toFile('public/favicon.png');
  })
  .then(() => console.log('Favicon created as public/favicon.png'))
  .catch(console.error); 