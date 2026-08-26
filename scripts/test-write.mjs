import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'test-output.txt');

console.log('Node version:', process.version);
console.log('cwd:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Writing to:', outPath);

await fs.writeFile(outPath, 'hello world ' + new Date().toISOString());

const stat = await fs.stat(outPath);
console.log('Write succeeded. File size:', stat.size, 'bytes');
console.log('Check for the file at:', outPath);
