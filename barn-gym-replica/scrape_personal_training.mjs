import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const url = 'https://www.barn-gym.com/personal-training';
const slug = 'personal_training';
const imagesDir = `public/images/${slug}`

if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });

    try {
        const response = await page.goto(url, { waitUntil: 'load', timeout: 60000 });

        // Check if page returns 404 or redirects to a 404 page
        if (response && response.status() === 404) {
            console.error(`Page ${url} returned 404 Not Found.`);
            await browser.close();
            return;
        }

        await page.waitForTimeout(5000); // Give Vite/components time to mount

        // Scroll to lazy load
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 500;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 200);
            });
        });

        // Capture screenshot
        await page.screenshot({ path: `live_${slug}_full.png`, fullPage: true });

        // Extract all framer images
        const imageUrls = await page.evaluate(() => {
            const urls = new Set();
            document.querySelectorAll('*').forEach(el => {
                // inline backgrounds
                const bg = window.getComputedStyle(el).backgroundImage;
                if (bg && bg.includes('framerusercontent.com/images/')) {
                    const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
                    if (match) urls.add(match[1]);
                }

                // img tags
                if (el.tagName === 'IMG' && el.src && el.src.includes('framerusercontent.com/images/')) {
                    urls.add(el.src);
                }
            });
            return Array.from(urls);
        });

        console.log(`Found ${imageUrls.length} unique images for ${slug}. Downloading...`);

        // Download them
        for (const imgUrl of imageUrls) {
            try {
                const urlObj = new URL(imgUrl);
                const filename = path.basename(urlObj.pathname);
                const dest = path.join(imagesDir, filename);
                if (fs.existsSync(dest)) continue;

                const res = await fetch(imgUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                fs.writeFileSync(dest, buffer);
            } catch (e) {
                console.error(`Failed ${imgUrl}: ${e.message}`);
            }
        }

        console.log('Capture and asset extraction complete.');
    } catch (error) {
        console.error('Error scraping:', error);
    } finally {
        await browser.close();
    }
})();
