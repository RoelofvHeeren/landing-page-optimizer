import { chromium } from 'playwright';

const pages = [
    { name: '404', path: '/404/index.html' },
    { name: 'privacy', path: '/legal/privacy-policy/index.html' },
    { name: 'cookie', path: '/legal/cookie-policy/index.html' },
    { name: 'terms', path: '/legal/terms-and-conditions/index.html' }
];

(async () => {
    const browser = await chromium.launch();
    for (const p of pages) {
        const page = await browser.newPage({
            viewport: { width: 1440, height: 1080 }
        });

        await page.goto(`http://localhost:5173${p.path}`, { waitUntil: 'load' });
        await page.waitForTimeout(2000);

        await page.screenshot({ path: `local_${p.name}_full.png`, fullPage: true });
        await page.close();
        console.log(`Local ${p.name} screenshot generated.`);
    }
    await browser.close();
})();
