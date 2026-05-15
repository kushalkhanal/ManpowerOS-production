import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const filePath = path.join(process.cwd(), 'controllers/alertController.js');
console.log('Loading file from:', filePath);

const code = fs.readFileSync(filePath, 'utf-8');
console.log('File loaded, length:', code.length);

// Let's also try to parse the code first to see what's in it
const lines = code.split('\n');
console.log('Line 77:', lines[76]);
console.log('Line count:', lines.length);

// Try loading
try {
  const mod = await import('./controllers/alertController.js');
  console.log('Module loaded!');
} catch(e) {
  console.log('Error:', e.message);
  console.log('Cause:', e.cause);
}