import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("Missing GEMINI_API_KEY. Add it to .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function extractSourceContext(sourceHtmlPath) {
    const html = await fs.readFile(sourceHtmlPath, 'utf8');
    const $ = cheerio.load(html);

    // Removing noisy elements before extracting text strings
    $('script, style, nav, footer').remove();

    let textNodes = [];
    $('h1, h2, h3, h4, p, a, button, span').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 5 && !textNodes.includes(text)) {
            textNodes.push(text);
        }
    });

    // Also grab images that might be useful
    let imageNodes = [];
    $('img').each((i, el) => {
        const src = $(el).attr('src');
        const alt = $(el).attr('alt') || 'Gym Image';
        if (src && !src.startsWith('data:')) {
            imageNodes.push({ src, alt });
        }
    });

    return { texts: textNodes, images: imageNodes };
}

async function mapContent(sourcePath, schemaPath, outputPath) {
    console.log('Extracting context from source:', sourcePath);
    const sourceContext = await extractSourceContext(sourcePath);

    console.log('Loading target schema:', schemaPath);
    const schemaRaw = JSON.parse(await fs.readFile(schemaPath, 'utf8'));

    console.log('Orchestrating Gemini to map content...');
    // Ask Gemini to dynamically build the response schema based on the input schema keys
    // We will use gemini-pro for text reasoning
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

    const prompt = `
You are an elite marketing copywriter and layout engineer. 
I am going to give you two things:
1. TARGET SCHEMA: A JSON map of a website layout. The keys are the DOM element IDs/classes, and the values currently explain what type of text belongs there (e.g., "Hero Headline").
2. SOURCE CONTEXT: The raw text extracted from a completely different website (The Barn Gym Community Page).

Your job is to read the SOURCE CONTEXT, understand the branding, tone, and messaging, and perfectly graft it into the TARGET SCHEMA.
The output should be the exact same JSON keys as the TARGET SCHEMA, but the values should be the actual copy derived from the SOURCE CONTEXT.

If the SOURCE CONTEXT doesn't have an exact 1:1 match for a slot, write new copy that perfectly matches the Barn Gym Community tone and fits the layout intent.

SOURCE CONTEXT TEXTS:
${JSON.stringify(sourceContext.texts.slice(0, 100), null, 2)}

TARGET SCHEMA:
${JSON.stringify(schemaRaw, null, 2)}

Return ONLY JSON, where the keys perfectly match the TARGET SCHEMA keys, and the values are the new Barn Gym Community copy.
`;

    try {
        const result = await model.generateContent(prompt);
        const mappedJsonStr = result.response.text();
        const mappedJson = JSON.parse(mappedJsonStr);

        await fs.writeFile(outputPath, JSON.stringify(mappedJson, null, 2), 'utf8');
        console.log(`✅ Successfully mapped content and saved to: ${outputPath}`);
    } catch (e) {
        console.error("Gemini Mapping Failed:", e);
    }
}

const args = process.argv.slice(2);
if (args.length < 3) {
    console.log("Usage: node generate_mapped_content.mjs <source_html> <target_schema_json> <output_mapped_json>");
    process.exit(1);
}

mapContent(args[0], args[1], args[2]);
