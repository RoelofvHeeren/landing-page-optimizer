import fs from 'fs';
import path from 'path';

const dir = 'public/images/corp';
const files = fs.readdirSync(dir);

for (const file of files) {
    if (file.includes('?')) {
        const cleanName = file.split('?')[0];
        fs.renameSync(path.join(dir, file), path.join(dir, cleanName));
    }
}
console.log('Renamed all corp images successfully.');
