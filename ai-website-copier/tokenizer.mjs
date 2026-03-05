import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function tokenizeTemplate(projectName) {
    const projectDir = path.join(__dirname, 'output', projectName);
    const indexPath = path.join(projectDir, 'index.html');

    if (!fs.existsSync(indexPath)) {
        console.error(`Project ${projectName} not found at ${indexPath}`);
        return;
    }

    console.log(`Loading ${projectName} for tokenization...`);
    const html = await fs.readFile(indexPath, 'utf8');
    const $ = cheerio.load(html);

    const schema = {
        meta: {
            title: $('title').text() || '',
            description: $('meta[name="description"]').attr('content') || ''
        },
        textNodes: {},
        images: {}
    };

    // 1. Identify and tokenize meaningful text nodes
    let textCounter = 0;

    // We target headers, paragraphs, spans, buttons, links that have direct text content
    $('h1, h2, h3, h4, h5, h6, p, a, button, li, span, div').each((_, el) => {
        // Only target elements that contain mostly direct text (no complex nested HTML inside)
        const childNodes = $(el).contents();
        const hasElementChildren = childNodes.toArray().some(node => node.type === 'tag');

        let rawText = $(el).text().trim();

        // Skip empty nodes, very short strings, or heavily nested containers
        if (!rawText || rawText.length < 3 || hasElementChildren) return;

        // Ensure we aren't tokenizing script or style content by accident
        if ($(el).is('script, style, noscript')) return;

        const tokenId = `text_${textCounter++}`;
        schema.textNodes[tokenId] = {
            original: rawText,
            element: el.tagName
        };

        // Replace text in DOM with the Handlebars-style token
        $(el).text(`{{ ${tokenId} }}`);
    });

    // 2. Identify and tokenize Images
    let imgCounter = 0;
    $('img').each((_, el) => {
        const src = $(el).attr('src');
        if (!src) return;

        const tokenId = `img_${imgCounter++}`;
        schema.images[tokenId] = {
            original: src,
            alt: $(el).attr('alt') || ''
        };

        // Replace src in DOM
        $(el).attr('src', `{{ ${tokenId} }}`);
    });

    // 3. Save Skeleton HTML
    console.log(`Extracted ${textCounter} text nodes and ${imgCounter} image nodes.`);
    const skeletonPath = path.join(projectDir, 'skeleton.html');
    await fs.writeFile(skeletonPath, $.html(), 'utf8');

    // 4. Save JSON Schema
    const schemaPath = path.join(projectDir, 'schema.json');
    await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), 'utf8');

    console.log(`✅ Tokenization complete for ${projectName}`);
    console.log(`- Saved template skeleton to skeleton.html`);
    console.log(`- Saved variable definitions to schema.json`);
}

const targetProject = process.argv[2] || 'barn-gym-site-final-2';
tokenizeTemplate(targetProject).catch(console.error);
