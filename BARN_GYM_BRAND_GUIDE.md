# Barn Gym - Branding & Style Guide

This document defines the visual and structural standards for the Barn Gym digital ecosystem. Use these tokens and patterns to maintain a 100% "pixel-perfect" match across all sub-projects.

## 🎨 Color Palette

| Token | Value | Context |
| :--- | :--- | :--- |
| **Primary Green** | `#007559` | Headlines, highlights, primary buttons. |
| **Deep Green** | `#17482d` | Footer background, dark bento boxes. |
| **Neutral BG** | `#fafafa` / `#f7f7f7` | Section backgrounds, survey modals. |
| **Text Dark** | `#131415` / `#111111` | Body copy, dark titles. |
| **Text Light** | `#ffffff` | Overlays, white text on dark buttons. |

## Typography

- **Headings (Premium)**: `'Playfair Display', serif`
  - Font weight: `500` or `700`.
  - Usage: H1, H2, H3, and "Premium" labels.
- **Body / Technical**: `'Inter', sans-serif` or `'Raleway', sans-serif`
  - Font weight: `400` (Regular), `700` (Bold).
  - Usage: Paragraphs, buttons, form inputs.

## 📐 Layout & UI Components

### 1. Containers & Spacing
- **Outer Radius**: Every major section, card, or modal MUST use `border-radius: 20px` to `24px`.
- **Max Width**: Standard content container is `1200px`.
- **Hero Spacing**: Hero sections should have `80vh` minimum height with `padding: 40px`.

### 2. Premium Overlays (Glassmorphism)
- Use `backdrop-filter: blur(15px)` and `rgba(0, 0, 0, 0.4)` for modals and nav backgrounds to create the high-end Apple-style look.

### 3. Buttons
- **Pill Shape**: `border-radius: 50px`.
- **States**:
  - `.btn-dark`: Black background, white text.
  - `.btn-outline-white`: Border 1px white, text white, blur background.
  - `.btn-primary`: Brand green (#007559).

### 4. Interactive Patterns
- **Marquee**: Use an infinite CSS animation (`translateX(-50%)`) for results grids.
- **Bento Grids**: Use `display: grid` with `grid-template-columns: repeat(4, 1fr)` and varied `span` values.

## 📁 Shared Assets
- **Logos**: Always use `/logos/color.png` (Brand) or `/logos/white.png` (Overlays).
- **Fonts**: Load via Google Fonts (Playfair Display, Inter, Raleway).
