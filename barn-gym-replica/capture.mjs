import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1080 }
    });

    await page.goto('https://www.barn-gym.com/', { waitUntil: 'networkidle' });

    // Quick hack to force lazy loaded images to load
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

    await page.screenshot({ path: 'live_home_full.png', fullPage: true });
    await browser.close();
})();
