import fs from 'fs';

const htmlFile = 'index.html';
let html = fs.readFileSync(htmlFile, 'utf8');

const mapping = {
    'UMH1t1visPV7Yd7F5S3JFOVh3A.png': 'UMH1t1visPV7Yd7F553JFOUh3A.png',
    'wRfMK91L5veWGcLxwziAsU1U.png': 'wRffMK91L5veWGcLxwziAsu1U.png',
    'mIo0YRmW8gLiBeWEJaPIUlLQhx8.png': 'mIo0YRmW8gLlBeWEJaPIUlLQhx8.png',
    '0Q4wjjdqYYOxO0KRE8ZPp9mBDds.png': '0Q4wjdqyYOx0OkRE8ZPp9mBDds.png',
    'CgljColH3Vv4AsCuVfh4uOHnlk.png': 'CgIjCoIH3Vv4AsCuVfh4uOHnIk.png',
    'KlnSH1pj2dWHmSPYNQqYgmY22E.png': 'KInSH1pj2dWHmSPYNOqYgmY22E.png',
    'MQXUREqWoWFLTIXfctHe2R93Hy4.png': 'MQXUREqWoWFLTlXfctHe2R93Hy4.png',
    'OfQlzJgEzzxsK0doz9ZE3UxO1d4.png': 'OfQlzJgEzxzsK0doz9ZE3UxO1d4.png',
    'whzTrH8wblG9VTJ1dur8CyiqVc.png': 'whzTrlH8wblG9VTJ1dur8CyiqVc.png',
    'plBZtQwIPXyrABG0Y6SCNrt78vo.png': 'plBZtQwlPXyrABG0Y6SCNrt78vo.png'
};

for (const [bad, good] of Object.entries(mapping)) {
    html = html.replace(new RegExp(bad, 'g'), good);
}

fs.writeFileSync(htmlFile, html);
console.log('Fixed spelling errors in index.html');
