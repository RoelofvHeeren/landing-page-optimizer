import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1080 }
    });

    await page.goto('http://localhost:5173/on-site-workshops/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(3000); // Give Vite/components time to mount

    await page.screenshot({ path: 'local_workshops_full.png', fullPage: true });
    await browser.close();
    console.log('Local Workshops screenshot generated.');
})();
