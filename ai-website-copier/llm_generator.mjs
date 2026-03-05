import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace with a secure way to load your key, e.g. process.env.GEMINI_API_KEY
// Using the provided key for the demonstration
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyD-WXgd0Z-JD31JAfWJtLjDVy0ER2nR314';
const genAI = new GoogleGenerativeAI(API_KEY);

async function generateAIContent(projectName, userPrompt) {
    const projectDir = path.join(__dirname, 'output', projectName);
    const schemaPath = path.join(projectDir, 'schema.json');

    if (!fs.existsSync(schemaPath)) {
        console.error(`Schema not found at ${schemaPath}`);
        return;
    }

    console.log(`Loading schema for ${projectName}...`);
    const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));

    // To prevent sending the entire file which might confuse the LLM with images,
    // we extract just the textNodes.
    const textNodesOnly = schema.textNodes;

    console.log(`Generating AI content for prompt: "${userPrompt}"...`);

    const systemInstruction = `You are a world-class Conversion Rate Optimization expert and layout-preserving copywriter.
You will be provided with a JSON object containing text strings from a website.
Your job is to rewrite the "original" values to fit the user's prompt exactly.
CRITICAL RULES:
1. Do NOT change the length of the string drastically. The design will break if you replace a 2-word headline with a 15-word headline. Keep character counts similar.
2. Return ONLY a valid JSON object mirroring the exact structure provided.
3. Keep the keys identical (e.g. text_0, text_1).
4. Do not wrap the JSON in Markdown backticks. Your entire response must be raw parseable JSON.`;

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        // Enforce JSON format output
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

    const prompt = `${systemInstruction}\\n\\nUSER PROMPT: ${userPrompt}\\n\\nJSON TO REWRITE:\\n${JSON.stringify(textNodesOnly)}`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse the generated JSON
        const rewrittenTextNodes = JSON.parse(responseText);

        // Merge back into original schema to preserve images and metadata structure
        const aiSchema = {
            ...schema,
            textNodes: rewrittenTextNodes
        };

        // If the AI somehow didn't nest it under textNodes but returned the flat dictionary directly:
        if (!aiSchema.textNodes['text_0'] && rewrittenTextNodes['text_0']) {
            aiSchema.textNodes = rewrittenTextNodes;
        }

        const aiSchemaPath = path.join(projectDir, 'schema_ai.json');
        await fs.writeFile(aiSchemaPath, JSON.stringify(aiSchema, null, 2), 'utf8');

        console.log(`✅ AI Content Generation complete!`);
        console.log(`- Saved new schema to schema_ai.json`);
    } catch (error) {
        console.error("AI Generation Failed:", error);
    }
}

const targetProject = process.argv[2] || 'barn-gym-site-final-2';
const prompt = process.argv[3] || 'A premium bakery only selling croissants in Amsterdam. Make it sound exclusive, warm, and highly converting.';

generateAIContent(targetProject, prompt).catch(console.error);
