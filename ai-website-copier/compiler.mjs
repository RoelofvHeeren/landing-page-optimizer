import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function compileTemplate(projectName, schemaFilename) {
    const projectDir = path.join(__dirname, 'output', projectName);
    const skeletonPath = path.join(projectDir, 'skeleton.html');
    const schemaPath = path.join(projectDir, schemaFilename);

    if (!fs.existsSync(skeletonPath) || !fs.existsSync(schemaPath)) {
        console.error(`Missing skeleton or schema (${schemaFilename}) for project: ${projectName}`);
        return;
    }

    console.log(`Loading skeleton and schema (${schemaFilename}) for ${projectName}...`);
    let htmlTemplate = await fs.readFile(skeletonPath, 'utf8');
    const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));

    // In a real scenario, this 'payload' would come from an AI or a User Form.
    // Here we are creating a mock payload modifying some text to prove it works.
    // const mockPayload = {
    //     ...schema
    // };

    // 1. Replace Text Tokens
    if (schema.textNodes) {
        Object.keys(schema.textNodes).forEach(tokenId => {
            const node = schema.textNodes[tokenId];
            const replacementValue = typeof node === 'object' ? node.original : node;
            const regex = new RegExp(`{{\\s*${tokenId}\\s*}}`, 'g');
            htmlTemplate = htmlTemplate.replace(regex, replacementValue || '');
        });
    }

    // 2. Replace Image Tokens
    const images = schema.images || schema.imageNodes || {};
    Object.keys(images).forEach(tokenId => {
        const node = images[tokenId];
        const replacementValue = typeof node === 'object' ? (node.original || node.src) : node;
        const regex = new RegExp(`{{\\s*${tokenId}\\s*}}`, 'g');
        htmlTemplate = htmlTemplate.replace(regex, replacementValue || '');
    });

    // 3. Save Final Generated Site
    const suffix = schemaFilename === 'schema.json' ? '-compiled' : '-ai-compiled';
    const generatedDir = path.join(__dirname, 'generated', `${projectName}${suffix}`);
    await fs.ensureDir(generatedDir);

    // Copy assets from original output to the generated folder so the CSS/images still link
    await fs.copy(path.join(projectDir, 'assets'), path.join(generatedDir, 'assets'));

    const outputPath = path.join(generatedDir, 'index.html');
    await fs.writeFile(outputPath, htmlTemplate, 'utf8');

    console.log(`✅ Compilation complete! New site generated at: ${generatedDir}`);
}

const targetProject = process.argv[2] || 'barn-gym-site-final-2';
const schemaFile = process.argv[3] || 'schema.json';
compileTemplate(targetProject, schemaFile).catch(console.error);
