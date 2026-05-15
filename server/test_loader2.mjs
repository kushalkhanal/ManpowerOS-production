import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const filePath = path.join(process.cwd(), 'controllers/alertController.js');
const fileUrl = pathToFileURL(filePath).href;
console.log('File URL:', fileUrl);

try {
  const mod = await import(fileUrl);
  console.log('Module loaded successfully!');
} catch (e) {
  console.log('Error:', e.message);
  console.log('Error code:', e.code);
  console.log('Cause:', e.cause);
  
  // Try reading with different encodings
  const buf = fs.readFileSync(filePath);
  console.log('\nFile buffer length:', buf.length);
  console.log('First 10 bytes:', buf.slice(0,10).toString('hex'));
  console.log('Bytes around line 77:', buf.slice(3200, 3250).toString('hex'));
}