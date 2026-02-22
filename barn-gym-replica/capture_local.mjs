import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1080 }
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    await page.screenshot({ path: 'local_home_full.png', fullPage: true });
    await browser.close();
})();
