import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const iconSvg = fs.readFileSync(path.resolve('public/icon.svg'));
  const maskableSvg = fs.readFileSync(path.resolve('public/icon-maskable.svg'));

  // 192x192
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public/pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 512x512
  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // maskable 512x512
  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // Apple touch icon 180x180
  await sharp(iconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Favicon 32x32
  await sharp(iconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.resolve('public/favicon.ico'));
  console.log('Generated favicon.ico');
}

generateIcons().catch(console.error);
