import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [400, 800, 1200, 1600, 2000];
const imagesDir = path.join(__dirname, '..', 'public', 'images');

const images = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

async function convertImage(inputFile) {
  const baseName = path.basename(inputFile, path.extname(inputFile));
  const meta = await sharp(inputFile).metadata();
  const width = meta.width;
  
  console.log(`Converting ${inputFile} (${width}w)...`);
  
  // Generate WebP at each size
  for (const size of sizes) {
    if (size > width) continue; // Skip if source is smaller
    
    const outputFile = path.join(imagesDir, `${baseName}-${size}w.webp`);
    await sharp(inputFile)
      .resize(size)
      .webp({ quality: 80 })
      .toFile(outputFile);
    console.log(`  Created ${baseName}-${size}w.webp`);
  }
  
  // Create base WebP (original size)
  const baseOutput = path.join(imagesDir, `${baseName}.webp`);
  await sharp(inputFile)
    .webp({ quality: 80 })
    .toFile(baseOutput);
  console.log(`  Created ${baseName}.webp`);
}

async function main() {
  for (const image of images) {
    await convertImage(path.join(imagesDir, image));
  }
  console.log('Done!');
}

main().catch(console.error);
