import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const extensions = ['.jsx', '.css', '.js'];

walkDir(targetDir, (filePath) => {
    if (extensions.includes(path.extname(filePath))) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace indigo and blue with primary
        const newContent = content
            .replace(/indigo-/g, 'primary-')
            .replace(/blue-/g, 'primary-');

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${path.relative(targetDir, filePath)}`);
        }
    }
});

console.log('Global color purge complete.');
