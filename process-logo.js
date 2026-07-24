const Jimp = require('jimp');
const fs = require('fs');

async function processLogo() {
  try {
    const inputPath = 'apps/admin/public/logo.png';
    const outAdminPath = 'apps/admin/public/logo.png';
    const outWebPath = 'apps/web/public/logo.png';
    const faviconAdminPath = 'apps/admin/public/favicon.ico';
    const faviconWebPath = 'apps/web/public/favicon.ico';

    const image = await Jimp.read(inputPath);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      if (red > 240 && green > 240 && blue > 240) {
        this.bitmap.data[idx + 3] = 0; 
      }
    });

    await image.writeAsync(outAdminPath);
    await image.writeAsync(outWebPath);

    const w = image.bitmap.width;
    const h = image.bitmap.height;
    const size = Math.min(w, h);
    
    const favImage = await Jimp.read(outAdminPath); 
    favImage.crop(0, 0, w, Math.floor(h * 0.7)); 
    favImage.resize(32, 32);
    await favImage.writeAsync(faviconAdminPath);
    await favImage.writeAsync(faviconWebPath);

    console.log('Processed successfully.');
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processLogo();
