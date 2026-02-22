import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, 'public', 'images', 'transformation');
const htmlFile = path.join(__dirname, 'gallery_transformation.html');

const files = fs.readdirSync(imagesDir).filter(f => f.match(/\.(png|jpe?g|svg|webp|avif)$/i));

let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Transformation Assets</title>
    <style>
        body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; background: #f0f0f0; }
        .card { background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; width: 300px; }
        img { max-width: 100%; height: auto; border-radius: 4px; background: #eee; }
        p { font-size: 12px; word-break: break-all; margin: 10px 0 0; color: #666; }
    </style>
</head>
<body>
`;

files.forEach(f => {
    html += `
    <div class="card">
        <img src="/images/transformation/${f}">
        <p>${f}</p>
    </div>`;
});

html += `</body></html>`;

fs.writeFileSync(htmlFile, html);
console.log('Gallery generated: gallery_transformation.html');
