import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1080 }
    });

    await page.goto('http://localhost:3000/online', { waitUntil: 'load' });
    await page.waitForTimeout(5000); // Give GHL widget time to load

    await page.screenshot({ path: 'local_online_coaching_hero_full.png', fullPage: true });
    await browser.close();
    console.log('Local online coaching screenshot generated.');
})();
