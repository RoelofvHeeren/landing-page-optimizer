import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs-extra';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("Missing GEMINI_API_KEY. Add it to .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function generatePureAiSchema(schemaPath, outputPath, imageMapPath) {
    console.log('Loading Target Schema:', schemaPath);
    const schemaRaw = JSON.parse(await fs.readFile(schemaPath, 'utf8'));

    // Load local AI image mappings if provided to map image nodes
    let customImageMap = null;
    if (imageMapPath) {
        customImageMap = JSON.parse(await fs.readFile(imageMapPath, 'utf8'));
    }

    console.log('Orchestrating Gemini for Pure AI Text Synthesis...');
    // We will use gemini-2.5-flash for text reasoning
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

    const prompt = `
You are an elite, world-class fitness marketing copywriter and layout engineer.
I am handing you a JSON 'TARGET SCHEMA' which is a map of an empty website template.

Your objective is to completely HALLUCINATE a brand new, stunning, high-converting website for a fitness brand called "The Barn Gym Community".
The copy should be raw, gritty, positive, and heavily focused on structured training, functional fitness, tracking progress, and real community accountability.

TARGET SCHEMA:
${JSON.stringify(schemaRaw.textNodes, null, 2)}

INSTRUCTIONS:
1. Examine the JSON keys in the TARGET SCHEMA.
2. For every key, write 100% original, novel marketing copy that fits the element type (e.g. bold statements for H1/H2, persuasive copy for p, strong calls to action for buttons/links).
3. Completely ignore any existing references to other brands. This site is entirely about "The Barn Gym Community".
4. OUTPUT FORMAT: Return ONLY a raw JSON object where the keys exactly match the TARGET SCHEMA keys, and the values are your newly hallucinated text.
`;

    try {
        const result = await model.generateContent(prompt);
        const generatedJsonStr = result.response.text();
        const generatedTextNodes = JSON.parse(generatedJsonStr);

        // Construct the final hybrid schema
        const finalSchema = {
            meta: {
                title: "The Barn Gym Community | Train Smarter, Together",
                description: "Join The Barn Gym Community. Elite functional fitness, structured training, and real accountability."
            },
            textNodes: generatedTextNodes,
            images: schemaRaw.images || {}
        };

        // If we have AI generated images, replace the image nodes with them randomly/intelligently
        if (customImageMap && Object.keys(customImageMap).length > 0) {
            console.log("Mapping AI Images...");
            const imageKeys = Object.keys(customImageMap);
            let imageIndex = 0;

            for (let nodeKey in finalSchema.images) {
                // Loop through our generated AI images to replace the placeholders
                const aiImageUrl = customImageMap[imageKeys[imageIndex % imageKeys.length]];
                finalSchema.images[nodeKey] = {
                    original: "assets/images/" + aiImageUrl,
                    alt: "The Barn Gym Community Training"
                };
                imageIndex++;
            }
        }

        await fs.writeFile(outputPath, JSON.stringify(finalSchema, null, 2), 'utf8');
        console.log(`✅ Pure AI Synthesis complete! Data saved to: ${outputPath}`);
    } catch (e) {
        console.error("Gemini Generation Failed:", e);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node generate_pure_ai_schema.mjs <target_schema_json> <output_schema_json> [image_map_json]");
    process.exit(1);
}

generatePureAiSchema(args[0], args[1], args[2]);
