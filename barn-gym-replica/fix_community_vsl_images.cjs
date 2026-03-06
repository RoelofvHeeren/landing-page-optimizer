const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'community-vsl', 'index.html');
const imgDir = path.join(__dirname, 'public', 'images', 'community_vsl');
const trainerizeDir = path.join(imgDir, 'Trainerize images');

// move trainerize images to imgDir
if (fs.existsSync(trainerizeDir)) {
    const trainerizeFiles = fs.readdirSync(trainerizeDir);
    for (const file of trainerizeFiles) {
        fs.renameSync(path.join(trainerizeDir, file), path.join(imgDir, file));
    }
    fs.rmdirSync(trainerizeDir);
}

// read HTML and files
let html = fs.readFileSync(htmlPath, 'utf8');
const files = fs.readdirSync(imgDir).filter(f => !fs.statSync(path.join(imgDir, f)).isDirectory());

// simple fuzzy matcher (levenshtein distance)
function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var matrix = [];
    var i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    var j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

const regex = /\/images\/community_vsl\/([^"'\s\)]+)/g;
let match;
const matches = [];

while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
}
// unique
const uniqueMatches = [...new Set(matches)];

for (const expected of uniqueMatches) {
    let bestMatch = null;
    let bestDist = Infinity;
    for (const actual of files) {
        const dist = levenshtein(expected, actual);
        if (dist < bestDist) {
            bestDist = dist;
            bestMatch = actual;
        }
    }

    if (bestMatch && bestDist < 10) { // arbitrary threshold
        console.log(`Matching ${expected} to ${bestMatch} (dist ${bestDist})`);
        html = html.replace(new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), bestMatch);
    } else {
        console.log(`No good match for ${expected}`);
    }
}

fs.writeFileSync(htmlPath, html);
console.log('Fixed HTML paths');
