import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imagesDir = './src/assets/images';
const sizes = [400, 800, 1200, 1600];

const newImages = [
  'bldg-front',
  'disco-room-front',
  'disco-room-rear',
  'gibson-room-bar',
  'gibson-room-rear',
  'gibson-room-stage',
  'gibson-room-streetview',
  'hero-austin',
  'piano-room',
  'piano-room-wide',
  'pub-front',
  'pub-rear',
];

async function resizeImage(baseName) {
  const inputPath = path.join(imagesDir, `${baseName}-2000w.webp`);
  
  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping ${baseName}-2000w.webp (not found)`);
    return;
  }

  console.log(`Processing ${baseName}...`);
  
  for (const size of sizes) {
    const outputPath = path.join(imagesDir, `${baseName}-${size}w.webp`);
    
    await sharp(inputPath)
      .resize(size, null, {
        fit: 'fill',
        kernel: sharp.kernel.lanczos3,
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
    
    console.log(`  Created ${baseName}-${size}w.webp`);
  }
}

async function main() {
  console.log('Generating responsive sizes for new images...\n');
  
  for (const image of newImages) {
    await resizeImage(image);
  }
  
  console.log('\nDone!');
}

main().catch(console.error);