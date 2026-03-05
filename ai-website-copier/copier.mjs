import { chromium } from 'playwright';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { PurgeCSS } from 'purgecss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to safely download files
async function downloadAsset(url, outputPath) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000,
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download ${url}: ${error.message}`);
    }
}

// Function to auto-scroll to the bottom of the page
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                // Stop scrolling if we reached the bottom or scrolled a lot
                if (totalHeight >= scrollHeight || totalHeight > 15000) {
                    clearInterval(timer);
                    resolve();
                }
            }, 50);
        });
    });
}

async function copyWebsite(targetUrl, projectName) {
    console.log(`Starting to copy: ${targetUrl}`);

    // 1. Setup directories
    const outputDir = path.join(__dirname, 'output', projectName);
    const assetsDir = path.join(outputDir, 'assets');
    const imagesDir = path.join(assetsDir, 'images');
    const cssDir = path.join(assetsDir, 'css');
    const fontsDir = path.join(assetsDir, 'fonts');

    await fs.ensureDir(imagesDir);
    await fs.ensureDir(cssDir);
    await fs.ensureDir(fontsDir);

    // 2. Launch headless browser
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('Navigating to page...');
    try {
        await page.goto(targetUrl, { waitUntil: 'load', timeout: 60000 });
    } catch (e) {
        console.warn(`Navigation warning: ${e.message}. Continuing extraction...`);
    }

    console.log('Scrolling page to trigger lazy loaded elements...');
    await autoScroll(page);

    // Give a little extra time for last images/fonts to render
    await page.waitForTimeout(2000);

    // 3. Extract rendered HTML
    const content = await page.content();
    const urlObj = new URL(targetUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    // 4. Parse with Cheerio for manipulation
    const $ = cheerio.load(content);

    // 5. Remove unwanted tracking scripts, hydration payloads, and popups
    console.log('Cleaning up tracking and hydration scripts...');
    $('script').each((_, el) => {
        const src = $(el).attr('src') || '';
        const id = $(el).attr('id') || '';
        const type = $(el).attr('type') || '';
        const attrs = Object.keys(el.attribs || {}).join(' ');
        const html = $(el).html() || '';
        const combined = src + html + id + attrs;

        // Always strip analytics
        if (combined.match(/clarity|analytics|gtm|tagmanager|pixel|hotjar|intercom|drift/i)) {
            $(el).remove();
            return;
        }

        // Targeted surgical removal of hydration *data* to crash React gracefully 
        // while preserving the core Webpack chunks that render CSS layout modules.
        if (
            id === '__NEXT_DATA__' ||
            id === '__framer-events' ||
            html.includes('__framer_hydrate') ||
            (type === 'application/json' && html.length > 2000) || // Catch massive unseen JSON state blobs
            combined.match(/hydration/i)
        ) {
            $(el).remove();
        }
    });
    $('noscript').remove(); // Often contains tracking pixels

    // 6. Extract ALL CSS (including injected styles and external links)
    console.log('Extracting comprehensive CSS...');

    // 6a. Download external stylesheets via Axios (bypassing browser CORS)
    const externalStyles = [];
    const linkTags = $('link[rel="stylesheet"]');
    for (let i = 0; i < linkTags.length; i++) {
        const href = $(linkTags[i]).attr('href');
        if (href) {
            try {
                const fullUrl = new URL(href, targetUrl).href;
                console.log(`Downloading external CSS: ${fullUrl}`);
                const response = await axios.get(fullUrl, { timeout: 10000 });
                externalStyles.push(response.data);
            } catch (e) {
                console.warn(`Failed to download CSS from ${href}: ${e.message}`);
            }
        }
    }

    // 6b. Extract runtime styles (injected via JS)
    const cssData = await page.evaluate(async () => {
        const styles = [];
        const backgroundImages = [];

        // Helper to extract URLs from CSS
        const extractUrls = (cssText) => {
            if (!cssText) return [];
            const regex = /url\((['"]?)(.*?)\1\)/g;
            let match;
            const urls = [];
            while ((match = regex.exec(cssText)) !== null) {
                if (!match[2].startsWith('data:')) {
                    urls.push(match[2]);
                }
            }
            return urls;
        };

        // 1. Get all basic style tags contents
        Array.from(document.querySelectorAll('style')).forEach(style => {
            if (style.textContent) {
                styles.push(style.textContent);
                backgroundImages.push(...extractUrls(style.textContent));
            }
        });

        // 2. Try to get CSS Rules for all stylesheets (even injected ones)
        try {
            Array.from(document.styleSheets).forEach(sheet => {
                try {
                    const rules = sheet.cssRules || sheet.rules;
                    if (rules) {
                        let sheetCss = '';
                        Array.from(rules).forEach(rule => {
                            sheetCss += rule.cssText + '\\n';
                            backgroundImages.push(...extractUrls(rule.cssText));
                        });
                        styles.push(sheetCss);
                    }
                } catch (e) {
                    // CORS issues might block some external stylesheets
                }
            });
        } catch (e) { }

        return {
            cssText: styles.join('\n\n'),
            backgroundImages: [...new Set(backgroundImages)]
        };
    });

    // Combine external and runtime CSS
    const finalCssText = externalStyles.join('\n\n') + '\n\n' + cssData.cssText;

    // Save combined CSS
    const mainCssPath = path.join(cssDir, 'main.css');
    await fs.writeFile(mainCssPath, finalCssText, 'utf8');

    // Update HTML to point to our new combined CSS
    $('link[rel="stylesheet"]').remove(); // Remove old links
    $('head').append('<link rel="stylesheet" href="./assets/css/main.css">');

    // 6.5 Download CSS Background Images
    console.log(`Downloading ${cssData.backgroundImages.length} CSS background assets...`);
    for (let i = 0; i < cssData.backgroundImages.length; i++) {
        let assetUrl = cssData.backgroundImages[i];
        try {
            const absoluteUrl = new URL(assetUrl, targetUrl).href;
            const ext = path.extname(new URL(absoluteUrl).pathname) || '.jpg';
            const cleanExt = ext.split('?')[0].split('#')[0];

            // Determine if font or image
            const isFont = ['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(cleanExt.toLowerCase());

            // Basic sanitization
            let cleanName = assetUrl.split('/').pop().replace(/[^a-zA-Z0-9.-]/g, '_');
            const prefix = isFont ? 'font' : 'bg';
            const filename = `${prefix}_${i}_${cleanName}`;

            const targetDir = isFont ? fontsDir : imagesDir;
            const targetPathMap = isFont ? '../fonts/' : '../images/';

            const localPath = path.join(targetDir, filename);

            await downloadAsset(absoluteUrl, localPath);

            // IMPORTANT: We need to replace the URL in our generated CSS
            const finalCssText = await fs.readFile(mainCssPath, 'utf8');
            const updatedCss = finalCssText.replace(new RegExp(assetUrl.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&'), 'g'), `${targetPathMap}${filename}`);
            await fs.writeFile(mainCssPath, updatedCss, 'utf8');

        } catch (e) {
            console.log(`Skipped asset: ${assetUrl}`);
        }
    }

    // 7. Download and process Images (Scanning all elements for data-src/srcset)
    console.log('Downloading images and processing assets...');
    const elementsWithImages = $('img, [data-src], [data-bg-src], [srcset]');
    for (let i = 0; i < elementsWithImages.length; i++) {
        const el = elementsWithImages[i];
        let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-bg-src') || $(el).attr('srcset')?.split(' ')[0];

        if (!src || src.startsWith('data:')) {
            $(el).removeAttr('srcset');
            $(el).removeAttr('loading');
            $(el).removeAttr('data-src');
            $(el).removeAttr('data-bg-src');
            continue;
        }

        try {
            const absoluteUrl = new URL(src, targetUrl).href;
            let ext = path.extname(new URL(absoluteUrl).pathname);
            if (!ext) {
                // Determine by format or default
                ext = absoluteUrl.includes('format=webp') ? '.webp' : '.jpg';
            }
            // Clean extension
            const cleanExt = ext.split('?')[0].split('#')[0];
            const filename = `image_${i}${cleanExt}`;
            const localPath = path.join(imagesDir, filename);

            await downloadAsset(absoluteUrl, localPath);

            // Clean up lazy load attributes and set permanent src
            $(el).removeAttr('srcset');
            $(el).removeAttr('loading');
            $(el).removeAttr('data-src');
            $(el).attr('src', `./assets/images/${filename}`);
        } catch (e) {
            console.log(`Skipped image: ${src}`);
        }
    }

    // 8. Save local index.html (Preliminary)
    const finalHtml = $.html();
    const indexPath = path.join(outputDir, 'index.html');
    await fs.writeFile(indexPath, finalHtml, 'utf8');

    // 9. Purge Unused CSS
    console.log('Purging unused CSS...');
    try {
        const rawCss = await fs.readFile(mainCssPath, 'utf8');
        const purgeCSSResult = await new PurgeCSS().purge({
            content: [indexPath],
            css: [{ raw: String(rawCss) }],
            safelist: [/swiper/, /active/, /show/, /fade/, /animate/, /w-slider/, /w-slide/, /slick/, /fs-/, /html/, /body/],
            fontFace: true,
            keyframes: true
        });

        if (purgeCSSResult && purgeCSSResult.length > 0) {
            const cleanCssText = purgeCSSResult[0].css;
            const optimizedCssPath = path.join(cssDir, 'style.css');
            await fs.writeFile(optimizedCssPath, cleanCssText, 'utf8');
            console.log(`CSS Purged! Saved to style.css`);

            // Re-point index.html to purged CSS and delete bloated main.css
            $('link[rel="stylesheet"]').attr('href', './assets/css/style.css');
            await fs.writeFile(indexPath, $.html(), 'utf8');
            await fs.remove(mainCssPath);
        }
    } catch (err) {
        console.error('Failed to purge CSS:', err);
    }

    await browser.close();
    console.log(`✅ Copy complete! Website saved to: ${outputDir}`);
}

// Example usage
const urlToCopy = process.argv[2] || 'https://example.com';
const projectName = process.argv[3] || 'my-copied-site';

copyWebsite(urlToCopy, projectName).catch(console.error);
