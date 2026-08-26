// scripts/fetch-fonts.mjs
import { FONTS } from '../utils/fonts.config.js';
import fs from 'fs/promises';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Matches the "basic latin" unicode-range Google uses for the latin subset
const LATIN_RANGE = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

function parseFontFaceBlocks(css) {
  // Split on each @font-face{...} block
  const blocks = [...css.matchAll(/@font-face\s*{([^}]+)}/g)].map(m => m[1]);
  return blocks.map(block => {
    const urlMatch = block.match(/url\((https:\/\/[^)]+\.woff2)\)/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);
    return {
      url: urlMatch?.[1],
      unicodeRange: rangeMatch?.[1]?.trim(),
    };
  }).filter(b => b.url);
}

const manifest = {};
let cssOutput = '';

for (const { family, weights, styles } of FONTS) {
  manifest[family] = {};
  for (const style of styles) {
    manifest[family][style] = {};
    for (const weight of weights) {
      const ital = style === 'italic' ? '1' : '0';
      const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@${ital},${weight}&display=swap`;
      const css = await fetch(url, { headers: { 'User-Agent': UA } }).then(r => r.text());

      const blocks = parseFontFaceBlocks(css);
      // Prefer the block matching the latin range; fall back to the first block if not found
      const latinBlock = blocks.find(b => b.unicodeRange === LATIN_RANGE) ?? blocks[0];

      if (!latinBlock) {
        console.warn(`No font-face block found for ${family} ${weight} ${style}`);
        continue;
      }

      const fontRes = await fetch(latinBlock.url);
      const buffer = Buffer.from(await fontRes.arrayBuffer());
      const fileName = `${family}-${weight}-${style}.woff2`;
      await fs.mkdir(`../public/fonts/${family}`, { recursive: true });
      await fs.writeFile(`../public/fonts/${family}/${fileName}`, buffer);
      manifest[family][style][weight] = fileName;

      cssOutput += `
@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/${family}/${fileName}') format('woff2');
}
`;
    }
  }
}

await fs.writeFile('../public/fonts/manifest.json', JSON.stringify(manifest, null, 2));
await fs.writeFile('../fonts.css', cssOutput.trim() + '\n');
console.log('Fonts fetched, manifest + fonts.css written');
