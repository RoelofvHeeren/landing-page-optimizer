import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Helper to find all html files
function getHtmlEntries() {
    const entries = {}

    // Read all directories in root
    const items = fs.readdirSync(__dirname, { withFileTypes: true })

    // Add root index.html
    if (fs.existsSync(resolve(__dirname, 'index.html'))) {
        entries['main'] = resolve(__dirname, 'index.html')
    }

    // Iterate over folders
    for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'dist' && item.name !== 'public') {
            const htmlPath = resolve(__dirname, item.name, 'index.html')
            if (fs.existsSync(htmlPath)) {
                entries[item.name] = htmlPath
            }

            // also check one level deeper for things like legal/privacy
            const subItems = fs.readdirSync(resolve(__dirname, item.name), { withFileTypes: true })
            for (const subItem of subItems) {
                if (subItem.isDirectory()) {
                    const subHtmlPath = resolve(__dirname, item.name, subItem.name, 'index.html')
                    if (fs.existsSync(subHtmlPath)) {
                        entries[`${item.name}_${subItem.name}`] = subHtmlPath
                    }
                }
            }
        }
    }

    return entries
}

export default defineConfig({
    build: {
        rollupOptions: {
            input: getHtmlEntries(),
        },
    },
})
