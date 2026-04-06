import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imagesDir = './src/assets/images';
const sizes = [400, 800, 1200, 1600, 2000];

const newImages = [
  'bldg-front-night',
];

async function resizeImage(baseName) {
  const inputPath = path.join(imagesDir, `${baseName}.jpg`);
  
  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping ${baseName}.jpg (not found)`);
    return;
  }

  const metadata = await sharp(inputPath).metadata();
  const originalHeight = metadata.height;
  const originalWidth = metadata.width;
  const aspectRatio = originalHeight / originalWidth;

  console.log(`Processing ${baseName}.jpg (${originalWidth}x${originalHeight})...`);
  
  for (const size of sizes) {
    const outputPath = path.join(imagesDir, `${baseName}-${size}w.webp`);
    const calculatedHeight = Math.round(size * aspectRatio);
    
    await sharp(inputPath)
      .resize(size, calculatedHeight, {
        fit: 'fill',
        kernel: sharp.kernel.lanczos3,
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
    
    console.log(`  Created ${baseName}-${size}w.webp (${size}x${calculatedHeight})`);
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