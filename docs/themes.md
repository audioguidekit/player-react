# Custom themes

Themes are TypeScript config objects in `src/theme/themes/`. Each follows the `ThemeConfig` interface in `src/theme/types.ts`.

Two built-in themes: `default-light` and `default-dark`.

## Tour-level layout options

These settings live in `metadata.json`, not in the theme file:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showStopImage` | `boolean \| "thumbnail"` | `true` | Stop card layout: `true` = full image card, `"thumbnail"` = compact row, `false` = text list |
| `showStopDuration` | `boolean` | `true` | Duration badge on stop cards |
| `showStopNumber` | `boolean` | `true` | Numbered circle indicator |
| `showProgressBar` | `boolean` | `true` | Playback progress bar in header |
| `showLanguageLabel` | `boolean` | `true` | Language name next to flag |
| `fullscreenPlayer` | `boolean` | `false` | Fullscreen overlay player |
| `backgroundColor` | `string` | — | TourStart status bar / background color (see [Status bar background](#status-bar-background)) |

See [adding-tours.md](./adding-tours.md#stop-card-display-options) for layout combinations.

---

## Theme properties

### `header`

Top navigation bar with remaining time and progress (TourDetail only).

```typescript
header: {
  backgroundColor: '#FFFFFF',
  iconColor: '#6366F1',
  textColor: '#111827',
  timeFontSize: '14px',
  timeFontWeight: '600',
  hoverBackground: '#F3F4F6',       // Optional: button hover background
  progressBar: {
    backgroundColor: '#E5E7EB',
    highlightColor: '#6366F1',
  },
}
```

#### Status bar background

The narrow safe-area at the top of the screen is filled automatically:

| Screen | Color source |
|--------|-------------|
| TourStart | `backgroundColor` in `metadata.json` |
| TourDetail | `header.backgroundColor` from the theme |

Both values also update `<meta name="theme-color">`.

---

### `mainContent`

```typescript
mainContent: {
  backgroundColor: '#F9FAFB',
}
```

---

### `cards`

All content cards (audio stops, email, rating, etc.).

```typescript
cards: {
  backgroundColor: '#FFFFFF',
  textColor: '#111827',
  borderColor: '#E5E7EB',
  borderRadius: '12px',
  shadow: '0 2px 15px rgba(0,0,0,0.1)',
  titleFontSize: '18px',
  titleFontWeight: '600',
  stopTitleFontSize: '18px',        // Optional: audio stop title (defaults to titleFontSize)
  stopTitleFontWeight: '600',       // Optional
  durationBadgeFontSize: '14px',
  numberFontSize: '14px',
  numberFontWeight: '600',
  image: {
    placeholderColor: '#E5E7EB',
    durationBadgeBackground: 'rgba(0,0,0,0.6)',
    durationBadgeText: '#FFFFFF',
  },
  thumbnail: {
    borderRadius: '8px',
    size: '56px',                   // Width and height of the square thumbnail
  },
}
```

---

### `stepIndicators`

```typescript
stepIndicators: {
  active: {
    outlineColor: '#6366F1',
    numberColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  inactive: {
    borderColor: '#E5E7EB',
    numberColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
  },
  completed: {
    backgroundColor: '#6366F1',
    checkmarkColor: '#FFFFFF',
  },
}
```

---

### `buttons`

```typescript
buttons: {
  primary: {
    backgroundColor: '#6366F1',
    textColor: '#FFFFFF',
    hoverBackground: '#4F46E5',     // Optional
    iconColor: '#FFFFFF',           // Optional
    fontSize: '18px',
    fontWeight: '600',
    fontFamily: ['Inter', 'sans-serif'],  // Optional
  },
  secondary: {
    backgroundColor: '#F9FAFB',
    textColor: '#111827',
    borderColor: '#E5E7EB',         // Optional
    hoverBackground: '#F3F4F6',     // Optional
    fontSize: '16px',
    fontWeight: '500',
    fontFamily: ['Inter', 'sans-serif'],  // Optional
  },
  download: {                       // "Download for offline" button
    backgroundColor: 'transparent',
    textColor: '#6366F1',
    borderColor: '#6366F1',         // Optional
    hoverBackground: 'rgba(99,102,241,0.1)',  // Optional
    iconColor: '#6366F1',           // Optional
    fontSize: '18px',
    fontWeight: '600',
    fontFamily: ['Inter', 'sans-serif'],  // Optional
  },
  transcription: {
    backgroundColor: '#FFFFFF',
    iconColor: '#6366F1',
    hoverBackground: '#F3F4F6',     // Optional
  },
}
```

---

### `typography`

```typescript
typography: {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],   // Required: body text
    heading: ['Space Grotesk', 'Inter', 'sans-serif'],  // Optional: headlines, language selector
    numbers: ['Space Grotesk'],                    // Optional: time, duration, progress
  },
}
```

Font sizes and weights are defined per component (see each section above), not here.

Load fonts in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

### `branding`

```typescript
branding: {
  logoUrl: undefined,          // Optional: custom logo URL; shown above tour title on StartCard
  showLogoBorder: true,        // Show rounded rectangle container around logo
  logoSize: 'fit',             // 'fit' = constrained to 48×48px, 'original' = natural size
}
```

---

### `miniPlayer`

```typescript
miniPlayer: {
  backgroundColor: '#FFFFFF',
  textColor: '#111827',
  titleFontSize: '16px',
  titleFontWeight: '500',
  transcriptionFontSize: '15px',
  shadow: '0 -2px 10px rgba(0,0,0,0.08)',   // Optional
  progressBar: {
    backgroundColor: '#E5E7EB',
    highlightColor: '#6366F1',
  },
  controls: {
    playButtonBackground: '#6366F1',
    playButtonIcon: '#FFFFFF',
    otherButtonsBackground: '#F3F4F6',
    otherButtonsIcon: '#6B7280',
    otherButtonsHoverBackground: '#E5E7EB',  // Optional
  },
  minimized: {
    playButtonIcon: '#6366F1',
  },
}
```

---

### `sheets`

Bottom sheets (language picker, rating, email collection).

```typescript
sheets: {
  backgroundColor: '#FFFFFF',
  handleColor: '#D1D5DB',
  textColor: '#111827',
  borderColor: '#E5E7EB',           // Optional
  titleFontSize: '18px',
  titleFontWeight: '700',
  backdropColor: 'rgba(0,0,0,0.2)', // Optional: backdrop overlay
  shadow: '0 -4px 20px rgba(0,0,0,0.1)',  // Optional
}
```

---

### `startCard`

Tour start / welcome screen.

```typescript
startCard: {
  titleFontSize: '30px',
  titleFontWeight: '700',
  titleLineHeight: '1.2',
  metaFontSize: '14px',
  metaFontWeight: '400',
  metaColor: '#6B7280',
  descriptionFontSize: '16px',
  offlineMessage: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.25)',
    textColor: '#3b82f6',
  },
  overlay: {                          // Optional: controls for start screen overlay (image/video bg)
    buttonBackground: 'rgba(0,0,0,0.4)',
    buttonColor: '#FFFFFF',
    gradientTop: 'rgba(0,0,0,0.3)',
    gradientBottom: 'rgba(0,0,0,0.6)',
  },
}
```

---

### `loading`

```typescript
loading: {
  spinnerColor: '#6366F1',
  backgroundColor: '#F9FAFB',
  messageFontSize: '16px',
  messageFontWeight: '500',
}
```

---

### `status`

```typescript
status: {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
}
```

---

### `inputs`

```typescript
inputs: {
  backgroundColor: '#FFFFFF',
  textColor: '#111827',
  borderColor: '#E5E7EB',
  focusBorderColor: '#6366F1',
  placeholderColor: '#9CA3AF',
}
```

---

### `richText`

Rich text content in text/image-text stops.

```typescript
richText: {
  blockquoteBorderColor: '#6366F1',
  blockquoteBackgroundColor: 'rgba(99,102,241,0.05)',
  linkColor: '#6366F1',
}
```

---

### `imageCaption`

```typescript
imageCaption: {
  textColor: '#6B7280',
  creditColor: '#9CA3AF',
}
```

---

### `hotspot`

Pins and popovers on hotspot-image stops.

```typescript
hotspot: {
  pinColor: '#6366F1',
  pinPulseColor: 'rgba(99,102,241,0.3)',
  pinBorderColor: '#FFFFFF',           // Optional
  pinShadow: '0 2px 8px rgba(0,0,0,0.2)',  // Optional
  popoverBackground: '#FFFFFF',        // Optional: defaults to tooltip.backgroundColor
  popoverBorderColor: '#E5E7EB',       // Optional: defaults to tooltip.borderColor
  popoverShadow: '0 4px 16px rgba(0,0,0,0.15)',  // Optional
  popoverTitleColor: '#111827',        // Optional: defaults to tooltip.textColor
  popoverTextColor: '#6B7280',         // Optional: defaults to colors.text.secondary
}
```

---

### `tooltip`

```typescript
tooltip: {
  backgroundColor: '#1F2937',
  textColor: '#F9FAFB',
  borderColor: '#374151',
}
```

---

### `fullscreenPlayer` (optional)

Fullscreen overlay player (enabled via `fullscreenPlayer: true` in metadata).

```typescript
fullscreenPlayer: {
  artworkBorderRadius: '12px',          // Optional
  artworkShadow: '0 8px 32px rgba(0,0,0,0.3)',  // Optional
  adjacentArtworkOpacity: 0.5,          // Optional: opacity of prev/next artwork
  infoButton: {                          // Optional
    backgroundColor: 'rgba(0,0,0,0.3)',
    iconColor: '#FFFFFF',
    backdropBlur: '8px',
  },
  captionOverlay: {                      // Optional
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: '8px',
    backdropBlur: '4px',
  },
  transcriptionTextOpacity: 0.8,        // Optional
}
```

---

### `colors`

Semantic color tokens used across components.

```typescript
colors: {
  text: {
    primary: '#111827',    // Main headings, important text
    secondary: '#6B7280',  // Subtitles, supporting text
    tertiary: '#9CA3AF',   // Metadata, timestamps
    inverse: '#CCCCCC',    // Text on dark backgrounds
  },
  border: {
    light: '#F3F4F6',      // Subtle dividers
    medium: '#E5E7EB',     // Card borders
    dark: '#D1D5DB',       // Emphasized borders
  },
  background: {
    primary: '#FFFFFF',    // Cards, modals
    secondary: '#F9FAFB',  // Page background
    tertiary: '#F3F4F6',   // Hover/disabled states
  },
}
```

---

## Creating a theme

### 1. Create theme file

**`src/theme/themes/my-theme.ts`**

```typescript
import { ThemeConfig } from '../types';

export const myTheme: ThemeConfig = {
  id: 'my-theme',
  name: 'My Theme',

  header: {
    backgroundColor: '#003B73',
    iconColor: '#FFD700',
    textColor: '#FFFFFF',
    timeFontSize: '14px',
    timeFontWeight: '600',
    progressBar: {
      backgroundColor: 'rgba(255,215,0,0.2)',
      highlightColor: '#FFD700',
    },
  },

  // ... all other required sections
};
```

### 2. Register theme

**`src/theme/themes/index.ts`**

```typescript
import { myTheme } from './my-theme';

export const themes = {
  'default-light': defaultLightTheme,
  'default-dark': defaultDarkTheme,
  'my-theme': myTheme,
};
```

### 3. Use theme

In `metadata.json`:

```json
{ "themeId": "my-theme" }
```

## Best practices

- Use `px` values, not `rem` or Tailwind class names
- Define an accent color constant and use it throughout for consistency
- Ensure WCAG AA contrast (≥ 4.5:1) for all text/background pairs
- Shadows should be subtle — avoid high opacity or large blur radii on light themes
