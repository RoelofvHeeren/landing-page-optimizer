# Project Context: Full Website Replica

This project is the master repository for the complete Barn Gym website. It includes the routing structure and global visual components.

## 🎯 Goal
A pixel-perfect local replica of the entire `barn-gym.com` architecture, serving as the benchmark for all service sub-pages.

## 🏗️ Technical Stack
- **Framework**: Vite
- **Language**: Vanilla HTML / CSS / JavaScript (ESM)
- **Deployment**: `npm run dev` (Port 5173)

## 🧩 Architectural Features
- **Shared Components**: Located in `/public/js/components.js`. These are custom HTML elements (`<barn-navbar>`, `<barn-footer>`) that auto-inject into every page via a `DOMContentLoaded` listener.
- **Global Styles**: Defined in `style.css` in the root.
- **Images**: Organized in `/public/images/<page-name>/`.
- **Legal Utilities**: Located in `/public/legal/`.

## 🛠️ Modifying this project
When adding new pages:
1. Create a directory in `/public/`.
2. Link the shared `style.css` and `components.js`.
3. Reference the central branding guide for UI tokens.
