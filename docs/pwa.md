# PWA app icons

Icons are located in `public/icons/`. The SVG source is `public/favicon.svg`.

| File | Size | Purpose |
|------|------|---------|
| `icon-72x72.png` | 72×72 | Android legacy |
| `icon-96x96.png` | 96×96 | Android legacy |
| `icon-120x120.png` | 120×120 | iOS legacy |
| `icon-128x128.png` | 128×128 | Chrome Web Store |
| `icon-144x144.png` | 144×144 | Android legacy |
| `icon-152x152.png` | 152×152 | iOS |
| `icon-192x192.png` | 192×192 | Android / iOS |
| `icon-384x384.png` | 384×384 | Android splash |
| `icon-512x512.png` | 512×512 | Android maskable |
| `apple-touch-icon-180x180.png` | 180×180 | iOS home screen |

## Regenerating icons

Replace `public/favicon.svg`, then:

```bash
cd public/icons
for size in 72 96 120 128 144 152 192 384 512; do
  magick -background none -density 300 ../favicon.svg -resize ${size}x${size} icon-${size}x${size}.png
done
magick -background none -density 300 ../favicon.svg -resize 180x180 apple-touch-icon-180x180.png
```

Requires ImageMagick (`brew install imagemagick`).

Alternatively use [RealFaviconGenerator](https://realfavicongenerator.net/) or `npx @vite-pwa/assets-generator --preset minimal public/favicon.svg`.

## Manifest

Icons are declared in `vite.config.ts` under `VitePWA.manifest.icons`. For maskable icons keep the main content within the center 80% of the canvas.

## Verification

1. `bun run build && bun run preview`
2. DevTools → Application → Manifest
3. "Add to Home Screen" on mobile
