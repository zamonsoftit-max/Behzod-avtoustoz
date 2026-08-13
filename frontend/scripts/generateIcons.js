const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template with "BA" text
const svgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb" rx="${size * 0.1}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dy=".35em">BA</text>
</svg>
`;

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 }
];

async function generateIcons() {
  for (const { name, size } of sizes) {
    const svg = Buffer.from(svgTemplate(size));
    await sharp(svg)
      .png()
      .toFile(path.join(iconsDir, name));
    console.log(`Generated ${name}`);
  }
  
  // Also create favicon.ico (using 32x32 size)
  const svg32 = Buffer.from(svgTemplate(32));
  await sharp(svg32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon.ico'));
  console.log('Generated favicon.ico');
}

generateIcons().catch(console.error);