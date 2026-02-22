import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const directoryPath = path.join(__dirname, 'public', 'images', 'contact');

if (!fs.existsSync(directoryPath)) {
    console.log('Directory does not exist yet. Run scraper first.');
    process.exit(1);
}

fs.readdir(directoryPath, (err, files) => {
    if (err) return console.log('Unable to scan directory: ' + err);
    files.forEach(file => {
        if (file.includes('?')) {
            const newName = file.split('?')[0];
            fs.renameSync(path.join(directoryPath, file), path.join(directoryPath, newName));
            console.log(`Renamed: ${file} -> ${newName}`);
        }
    });
});
