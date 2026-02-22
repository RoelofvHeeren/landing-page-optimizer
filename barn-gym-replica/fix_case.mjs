import fs from 'fs';

const htmlFile = 'index.html';
const images = fs.readdirSync('public/images/home');
let html = fs.readFileSync(htmlFile, 'utf8');

const regex = /\/images\/home\/([a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|avif))/gi;

html = html.replace(regex, (match, filename) => {
    // Find matching file case insensitively
    const actualFile = images.find(f => f.toLowerCase() === filename.toLowerCase());
    if (actualFile) {
        return `/images/home/${actualFile}`;
    }
    console.log("Missing image entirely: " + filename);
    return match;
});

fs.writeFileSync(htmlFile, html);
console.log('Fixed image cases in index.html');
