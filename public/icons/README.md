# PWA App Icons

This directory should contain the following icon files for the Progressive Web App:

## Required Icons

- `icon-72x72.png` (72x72 pixels)
- `icon-96x96.png` (96x96 pixels)
- `icon-128x128.png` (128x128 pixels)
- `icon-144x144.png` (144x144 pixels)
- `icon-152x152.png` (152x152 pixels)
- `icon-192x192.png` (192x192 pixels) - Used for Android
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels) - Maskable icon for Android

## How to Generate Icons

### Option 1: Use RealFaviconGenerator (Recommended)
1. Visit https://realfavicongenerator.net/
2. Upload your app logo/icon (ideally 512x512 or larger)
3. Configure settings for different platforms
4. Download the generated package
5. Extract icon files to this directory

### Option 2: Use PWA Asset Generator
```bash
npx @vite-pwa/assets-generator --preset minimal public/icon-source.png
```

### Option 3: Manual Creation
Create a square image (512x512 recommended) and resize it to each required size using your preferred image editor.

## Icon Guidelines

- Use a simple, recognizable design
- Ensure the icon works well at small sizes
- Use a transparent or solid background
- For maskable icons (icon-512x512.png), keep important content in the "safe zone" (center 80%)
- Test on both light and dark backgrounds

## Current Status

⚠️ **Icons are missing!** The PWA will not install properly until these icons are created and placed in this directory.
