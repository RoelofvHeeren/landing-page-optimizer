import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: \${res.statusCode}`));
            }
        }).on('error', reject);
    });
};

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1080 }
    });

    console.log(`Scraping online coaching...`);
    try {
        await page.goto('https://www.barn-gym.com/how-to-join/online-coaching', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);

        const sectionData = await page.evaluate(() => {
            // Find the section that contains "Our Simple & Smart Process"
            const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
            const targetHeading = headings.find(h => h.textContent.includes('Our Simple & Smart Process'));

            if (targetHeading) {
                const section = targetHeading.closest('section') || targetHeading.parentElement.closest('section') || targetHeading.parentElement.parentElement.closest('div[data-framer-name]');
                if (section) {
                    return section.innerHTML;
                }
            }
            return null;
        });

        if (sectionData) {
            fs.writeFileSync('online_coaching_process_section.html', sectionData);
            console.log('Saved section HTML to online_coaching_process_section.html');
        } else {
            console.log('Could not find the target section.');
        }

        const downloadFolder = path.join(__dirname, 'public', 'images', 'online_coaching');
        if (!fs.existsSync(downloadFolder)) {
            fs.mkdirSync(downloadFolder, { recursive: true });
        }

        const imageUrls = await page.evaluate(() => {
            const urls = [];
            // Target the specific section to get images
            const headings = Array.from(document.querySelectorAll('h2, h3'));
            const targetHeading = headings.find(h => h.textContent.includes('Our Simple & Smart Process'));
            if (targetHeading) {
                const section = targetHeading.closest('section') || targetHeading.parentElement.parentElement.parentElement;
                if (section) {
                    section.querySelectorAll('img').forEach(img => {
                        if (img.src && img.src.includes('framerusercontent.com')) {
                            urls.push(img.src);
                        }
                    });
                }
            }
            return [...new Set(urls)];
        });

        console.log('Found images:', imageUrls);
        for (const url of imageUrls) {
            try {
                const urlObj = new URL(url);
                const filename = path.basename(urlObj.pathname).split('?')[0];
                const filepath = path.join(downloadFolder, filename);
                await downloadImage(url, filepath);
                console.log('Downloaded', filename);
            } catch (e) {
                console.error('Failed to download', url, e);
            }
        }
    } catch (e) {
        console.error(`Failed to scrape:`, e.message);
    }
    await page.close();
    await browser.close();
    console.log('Finished.');
})();
