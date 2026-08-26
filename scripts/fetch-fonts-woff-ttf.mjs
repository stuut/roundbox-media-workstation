// scripts/fetch-fonts.mjs
import { FONTS } from '../utils/fonts.config.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_FONTS_DIR = path.resolve(__dirname, '../public/fonts');
const APP_DIR = path.resolve(__dirname, '../app');

console.log('Script location (__dirname):', __dirname);
console.log('Resolved fonts output dir:', PUBLIC_FONTS_DIR);
console.log('FONTS config:', JSON.stringify(FONTS, null, 2));

const API_BASE = 'https://gwfh.mranftl.com/api/fonts';

// Maps your { weight: 900, style: 'normal' } shape to gwfh's variant id shape
// e.g. weight 400 + normal -> "regular", weight 700 + italic -> "700italic"
function toVariantId(weight, style) {
  const base = String(weight) === '400' ? 'regular' : String(weight);
  return style === 'italic' ? `${base}italic` : base;
}

async function fetchFontMeta(familySlug) {
  const url = `${API_BASE}/${familySlug}?subsets=latin`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`gwfh API returned ${res.status} for ${familySlug}`);
  }
  return res.json();
}

async function downloadFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const manifest = {};
let cssOutput = '';

for (const { family, weights, styles } of FONTS) {
  // gwfh expects a lowercase, hyphenated slug, e.g. "Poppins" -> "poppins"
  const familySlug = family.toLowerCase().replace(/\s+/g, '-');

  console.log(`Fetching metadata for ${family} (${familySlug})...`);
  let meta;
  try {
    meta = await fetchFontMeta(familySlug);
  } catch (err) {
    console.warn(`Skipping ${family}: ${err.message}`);
    continue;
  }

  manifest[family] = {};
  const familyDir = path.join(PUBLIC_FONTS_DIR, family);
  await fs.mkdir(familyDir, { recursive: true });

  for (const style of styles) {
    manifest[family][style] = {};

    for (const weight of weights) {
      const variantId = toVariantId(weight, style);
      const variant = meta.variants.find(v => v.id === variantId);

      if (!variant) {
        console.warn(`No variant "${variantId}" found for ${family} (available: ${meta.variants.map(v => v.id).join(', ')})`);
        continue;
      }

      if (!variant.woff2 || !variant.ttf) {
        console.warn(`Missing woff2/ttf URL for ${family} ${variantId}`);
        continue;
      }

      const [woff2Buffer, ttfBuffer] = await Promise.all([
        downloadFile(variant.woff2),
        downloadFile(variant.ttf),
      ]);

      const baseName = `${family}-${weight}-${style}`;
      const woff2FileName = `${baseName}.woff2`;
      const ttfFileName = `${baseName}.ttf`;

      await fs.writeFile(path.join(familyDir, woff2FileName), woff2Buffer);
      await fs.writeFile(path.join(familyDir, ttfFileName), ttfBuffer);

      // verify the files actually landed on disk
      const woff2Stat = await fs.stat(path.join(familyDir, woff2FileName));
      const ttfStat = await fs.stat(path.join(familyDir, ttfFileName));
      console.log(`    wrote ${woff2FileName} (${woff2Stat.size} bytes) to ${familyDir}`);
      console.log(`    wrote ${ttfFileName} (${ttfStat.size} bytes) to ${familyDir}`);

      manifest[family][style][weight] = {
        web: woff2FileName,   // for browser canvas rendering
        print: ttfFileName,   // for pdf-lib embedFont
      };

      cssOutput += `
@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/${family}/${woff2FileName}') format('woff2');
}
`;

      console.log(`  ✓ ${family} ${weight} ${style}`);
    }
  }
}

await fs.writeFile(path.join(PUBLIC_FONTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
await fs.writeFile(path.join(APP_DIR, 'fonts.css'), cssOutput.trim() + '\n');
console.log(`Fonts fetched. Manifest written to ${PUBLIC_FONTS_DIR}/manifest.json`);
