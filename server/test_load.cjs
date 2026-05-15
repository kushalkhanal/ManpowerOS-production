require('module').register({ type: 'esm' });
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'controllers/alertController.js');
console.log('Loading file from:', filePath);

const code = fs.readFileSync(filePath, 'utf-8');
console.log('File loaded, length:', code.length);

// Try to parse as module manually
import('./controllers/alertController.js').then(() => {
  console.log('Module loaded successfully!');
}).catch(err => {
  console.error('Error loading module:', err.message);
  console.error('Stack:', err.stack);
});