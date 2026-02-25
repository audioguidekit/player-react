# Custom Themes

AudioGuideKit features a comprehensive theming system that allows complete customization of the visual appearance. This guide explains how to create custom themes and what each theme property controls.

## Overview

The theming system allows you to:
- Customize all colors, fonts, and visual styling
- Create brand-specific experiences
- Define multiple themes and switch between them
- Control typography, spacing, and visual hierarchy
- Maintain consistency across all screens and components

### Available Themes

The app includes two built-in themes:
- **Default Light** - Clean, distraction-free light aesthetic with high legibility and soft gray accents
- **Default Dark** - Clean, distraction-free dark aesthetic with refined grayscale and sans-serif typography

## Tour-Level Layout Options (metadata.json)

Themes control colors, fonts, and visual styling — but several **layout and UI visibility options** are configured per-tour in `metadata.json`, not in the theme file. These settings let you adjust the app's structure without touching the theme.

| Property | Type | Description |
|----------|------|-------------|
| `showStopImage` | `boolean \| "thumbnail"` | Controls stop card layout: `true` = full image card, `"thumbnail"` = compact row with small thumbnail, `false` = text-only list |
| `showStopDuration` | `boolean` | Show/hide the duration badge on stop cards |
| `showStopNumber` | `boolean` | Show/hide the numbered circle indicator on stop cards |
| `showProgressBar` | `boolean` | Show/hide the playback progress bar |
| `showLanguageLabel` | `boolean` | Show/hide the language name next to the flag in the language selector |
| `fullscreenPlayer` | `boolean` | Enable the fullscreen overlay player (slides up over the stop list) |
| `backgroundColor` | `string` | Background color of the TourStart screen and its status bar area (see [Status Bar Background](#status-bar-background)) |

These settings work alongside your theme — for example, you can set the card colors in the theme while controlling whether cards show images or render as a list via `showStopImage` in metadata.

> See **[adding-tours.md](./adding-tours.md#stop-card-display-options)** for full documentation and layout examples.

---

## Theme Structure

Themes are TypeScript configuration objects located in `src/theme/themes/`. Each theme follows the `ThemeConfig` interface defined in `src/theme/types.ts`.

### Basic Theme Anatomy

```typescript
export const myTheme: ThemeConfig = {
  // Theme metadata
  id: 'my-theme',
  name: 'My Custom Theme',
  description: 'A brief description of your theme',

  // Visual sections (explained below)
  header: { ... },
  mainContent: { ... },
  cards: { ... },
  buttons: { ... },
  miniPlayer: { ... },
  // ... and more
};
```

## Theme Sections by Screen

### 1. Header Section

Controls the top navigation bar with remaining time and progress. Only shown on the **TourDetail** screen.

**What You See:**
- Top bar background color
- Back button icon
- Remaining time display (e.g., "18:32")
- Progress bar showing completion

**Properties:**

```typescript
header: {
  backgroundColor: '#FFFFFF',     // Top bar background — also fills the iOS status bar area above it
  iconColor: '#6366F1',           // Back button icon color
  textColor: '#111827',           // Remaining time text
  timeFontSize: '14px',           // Remaining time font size
  timeFontWeight: '600',          // Remaining time font weight
  progressBar: {
    backgroundColor: '#E5E7EB',   // Progress track (unfilled portion)
    highlightColor: '#6366F1',    // Progress fill (completed portion)
  },
}
```

**Visual Examples:**
- `backgroundColor` - The entire top bar color; also fills the iOS safe-area gap above the bar so they merge seamlessly
- `iconColor` - Colors the back (←) icon
- `textColor` + `timeFontSize` + `timeFontWeight` - The "18:32" countdown
- `progressBar.backgroundColor` - Gray track behind progress
- `progressBar.highlightColor` - Colored fill showing completion (0-100%)

---

### Status Bar Background

The narrow safe-area region at the very top of the screen (behind the iOS clock, battery and signal icons) is automatically filled by the app. The color applied depends on **which screen is currently showing**:

| Screen | Color source |
|--------|-------------|
| **TourStart** | `backgroundColor` property in `metadata.json` |
| **TourDetail** | `header.backgroundColor` from the active theme |

**Controlling the TourStart status bar**

Add `backgroundColor` to your tour's `metadata.json`:

```json
{
  "backgroundColor": "#1a2634"
}
```

Pick a color that matches the top edge of your cover image — this makes the status bar feel like a natural extension of the photo. It is also used as the TourStart background when no `image` is defined. If omitted, the theme's `header.backgroundColor` is used on both screens.

**TourDetail blends automatically**

On TourDetail, the `TourHeader` sits directly below the safe-area gap. The gap is filled with the same `header.backgroundColor` from the theme, so the header bar and the status bar area appear as one continuous surface. No extra configuration needed — just set the right `header.backgroundColor` in your theme.

> **Also sets `theme-color`:** Both values also update the `<meta name="theme-color">` tag, which tints the iOS browser chrome and influences status-bar icon contrast (dark/light).

---

### 2. Main Content

Controls the background behind all content cards and screens.

```typescript
mainContent: {
  backgroundColor: '#F9FAFB',     // Background color behind all content
}
```

**What You See:**
- The background color visible between cards
- The canvas on which all content sits

---

### 3. Cards Section

Controls all content cards (audio stop cards, email cards, rating cards, etc.).

**What You See:**
- Card backgrounds
- Card borders and shadows
- Text inside cards
- Duration badges on images
- Step numbers

**Properties:**

```typescript
cards: {
  // Card container
  backgroundColor: '#FFFFFF',              // Card background
  textColor: '#111827',                    // Main text in cards
  borderColor: '#E5E7EB',                  // Card border outline
  borderRadius: '12px',                    // Corner rounding (e.g., '12px', '16px')
  shadow: '0 2px 15px rgba(0,0,0,0.1)',  // Drop shadow

  // Typography
  titleFontSize: '18px',                   // Card title size
  titleFontWeight: '600',                  // Card title weight
  durationBadgeFontSize: '14px',          // Duration badge on images ("2:30")
  numberFontSize: '14px',                  // Step number in audio stops
  numberFontWeight: '600',                 // Step number weight

  // Card images
  image: {
    placeholderColor: '#E5E7EB',          // Loading state background
    durationBadgeBackground: 'rgba(0,0,0,0.6)', // Badge overlay on images
    durationBadgeText: '#FFFFFF',         // Duration text color
  },
}
```

**Visual Examples:**
- `backgroundColor` - White or colored card background
- `borderColor` + `borderRadius` - Card border and corner style
- `shadow` - Drop shadow for depth
- `titleFontSize` + `titleFontWeight` - Card headline sizing
- `image.durationBadgeBackground` - Semi-transparent overlay showing duration
- `image.durationBadgeText` - "2:30" text on image badges
- `numberFontSize` + `numberFontWeight` - The "1", "2", "3" step numbers

**Affects:**
- `AudioStopCard` - Audio playback cards
- `EmailCard` - Email collection cards
- `RatingCard` - Feedback rating cards
- `StartCard` - Tour start/welcome card

---

### 4. Step Indicators

Controls the circular step indicators showing tour progress.

**What You See:**
- Circle outlines for each stop
- Number inside circles
- Checkmarks for completed stops
- Different states: active, inactive, completed

**Properties:**

```typescript
stepIndicators: {
  // Current/active step
  active: {
    outlineColor: '#6366F1',         // Circle border (current step)
    numberColor: '#6366F1',          // Number text (current step)
    backgroundColor: '#EEF2FF',      // Circle fill (current step)
  },

  // Future/unstarted steps
  inactive: {
    borderColor: '#E5E7EB',          // Circle border (future steps)
    numberColor: '#9CA3AF',          // Number text (future steps)
    backgroundColor: '#F9FAFB',      // Circle fill (future steps)
  },

  // Completed steps
  completed: {
    backgroundColor: '#6366F1',      // Circle fill (solid color)
    checkmarkColor: '#FFFFFF',       // Checkmark icon color
  },
}
```

**Visual Examples:**
- **Active step** - Bold colored outline with number
- **Inactive step** - Gray outline with gray number
- **Completed step** - Solid colored circle with white checkmark

---

### 5. Buttons

Controls all button styles throughout the app.

**What You See:**
- Primary action buttons (Start, Continue, Submit)
- Secondary buttons (Cancel, Skip)
- Transcription toggle button

**Properties:**

```typescript
buttons: {
  // Primary actions (Start tour, Continue, Submit)
  primary: {
    backgroundColor: '#6366F1',       // Button background
    textColor: '#FFFFFF',             // Button text
    hoverBackground: '#4F46E5',       // Background on press/hover
    iconColor: '#FFFFFF',             // Icon color (optional)
    fontSize: '18px',                 // Button text size
    fontWeight: '600',                // Button text weight
    fontFamily: ['Inter', 'sans-serif'], // Font family (optional, defaults to sans)
  },

  // Secondary actions (Cancel, Skip)
  secondary: {
    backgroundColor: '#F9FAFB',       // Button background
    textColor: '#111827',             // Button text
    borderColor: '#E5E7EB',           // Button border (optional)
    hoverBackground: '#F3F4F6',       // Background on press/hover
    fontSize: '16px',                 // Button text size
    fontWeight: '500',                // Button text weight
    fontFamily: ['Inter', 'sans-serif'], // Font family (optional, defaults to sans)
  },

  // Download for offline button (same size as primary, outline style)
  download: {
    backgroundColor: 'transparent',   // Button background (usually transparent for outline)
    textColor: '#6366F1',             // Button text (matches accent color)
    borderColor: '#6366F1',           // Button border
    hoverBackground: 'rgba(99, 102, 241, 0.1)', // Background on press/hover
    iconColor: '#6366F1',             // Icon color
    fontSize: '18px',                 // Button text size (same as primary)
    fontWeight: '600',                // Button text weight
    fontFamily: ['Inter', 'sans-serif'], // Font family (optional, defaults to sans)
  },

  // Transcription toggle
  transcription: {
    backgroundColor: '#FFFFFF',       // Button background
    iconColor: '#6366F1',             // Icon color
    hoverBackground: '#F3F4F6',       // Background on press/hover
  },
}
```

**Visual Examples:**
- `primary` - Large "Start Tour" button on StartCard
- `primary.hoverBackground` - Darker shade when button pressed
- `primary.fontFamily` - Custom font for buttons (e.g., use monospace for terminal themes)
- `secondary` - "Cancel" or "Skip" buttons
- `secondary.fontFamily` - Custom font for secondary buttons
- `download` - Full-width "Download for Offline" button (same size as primary, outline style)
- `transcription` - Circular button with text icon in MiniPlayer

**Font Customization:**
The `fontFamily` property is optional for both primary and secondary buttons. If not specified, buttons will use the theme's `typography.fontFamily.sans`. This allows you to:
- Use the same font as headings for visual consistency
- Use monospace fonts for technical/terminal themes
- Match button typography to your brand requirements

**Affects:**
- `StartCard` - Start/Continue/Replay buttons
- `RatingSheet` - Submit button
- `EmailCard` - Submit button
- `MiniPlayer` - Transcription toggle button

---

### 6. Typography

Controls font families used throughout the app.

**Important:** Only font families are defined here. Font sizes and weights are defined per-component (see sections above).

**Properties:**

```typescript
typography: {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],           // Body text
    heading: ['Space Grotesk', 'Inter', 'sans-serif'],    // Optional: Headlines
    numbers: ['Space Grotesk'],                            // Optional: Numbers/time
  },
}
```

**Visual Examples:**
- `sans` - Main font for all text (cards, buttons by default, descriptions)
- `heading` - Optional different font for headlines and language selector (if defined)
- `numbers` - Optional font for numerical displays like time, duration, progress

**Important Notes:**
- Buttons can override the default `sans` font using `buttons.primary.fontFamily` and `buttons.secondary.fontFamily`
- The language selector button uses `heading` font if defined, otherwise falls back to `sans`
- This allows for consistent typography when you want buttons and headings to share the same distinctive font

**Font Loading:**
Fonts must be loaded via `index.html` or CSS:

```html
<!-- In index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Limitations:**
- ❌ Cannot define generic font size scales (removed in favor of component-specific sizes)
- ❌ Cannot define generic font weight scales (removed in favor of component-specific weights)
- ✅ Font sizes and weights are defined per-component for clarity

---

### 7. Branding

Controls custom logo display on the StartCard.

```typescript
branding: {
  logoUrl: undefined,              // Optional: Custom logo image URL
  showLogoBorder: true,            // Show border/background around logo (default: true)
  logoSize: 'fit',                 // 'fit' (48x48px) or 'original' (natural size)
}
```

**Properties:**
- `logoUrl` - If provided, displays a logo above the tour title on StartCard. When `undefined`, no logo is shown.
- `showLogoBorder` - When `true` (default), logo appears in a rounded rectangle with background and shadow. When `false`, logo displays without any container styling.
- `logoSize` - Controls logo sizing: `'fit'` constrains to 48x48px, `'original'` uses the image's natural dimensions.

---

### 8. Mini Player

Controls the floating audio player that appears during playback.

**What You See:**
- Floating bar at bottom
- Track title and time
- Play/pause, skip, rewind buttons
- Progress bar
- Transcription text (when enabled)
- Minimized state (collapsed)

**Properties:**

```typescript
miniPlayer: {
  // Container
  backgroundColor: '#FFFFFF',            // Player background
  textColor: '#111827',                  // Title and time text

  // Typography
  titleFontSize: '16px',                 // Track title size
  titleFontWeight: '500',                // Track title weight
  transcriptionFontSize: '15px',         // Transcription text size

  // Progress bar
  progressBar: {
    backgroundColor: '#E5E7EB',          // Track (unfilled)
    highlightColor: '#6366F1',           // Fill (progress)
  },

  // Control buttons (expanded state)
  controls: {
    playButtonBackground: '#6366F1',     // Play/pause button background
    playButtonIcon: '#FFFFFF',           // Play/pause icon color
    otherButtonsBackground: '#F3F4F6',   // Skip/rewind button background
    otherButtonsIcon: '#6B7280',         // Skip/rewind icon color
  },

  // Minimized state
  minimized: {
    playButtonIcon: '#6366F1',           // Play/pause icon when collapsed
  },
}
```

**Visual Examples:**
- **Expanded state** - Full player with all controls visible
- **Minimized state** - Collapsed to small bar, tapping expands it
- `progressBar` - Thin bar showing playback progress
- `controls.playButtonBackground` - Large circular play/pause button
- `controls.otherButtonsBackground` - Smaller skip forward/back buttons
- `transcriptionFontSize` - Scrolling text during playback

**Affects:**
- `MiniPlayer` component

---

### 9. Bottom Sheets

Controls modal sheets that slide up from bottom.

**What You See:**
- Language picker sheet
- Rating sheet
- Email collection sheet
- Drag handle at top
- Sheet content

**Properties:**

```typescript
sheets: {
  backgroundColor: '#FFFFFF',       // Sheet background
  handleColor: '#D1D5DB',           // Drag handle color
  textColor: '#111827',             // Text content color
  borderColor: '#E5E7EB',           // Top border (optional)
  titleFontSize: '18px',            // Sheet title size
  titleFontWeight: '700',           // Sheet title weight
}
```

**Visual Examples:**
- `backgroundColor` - White or colored sheet background
- `handleColor` - Small rounded handle at top for dragging
- `titleFontSize` + `titleFontWeight` - Bold sheet title

**Affects:**
- `LanguageSheet` - Language selection
- `RatingSheet` - Star rating feedback
- `EmailSheet` - Email collection

---

### 10. Start Card

Controls the tour welcome/start screen.

**What You See:**
- Tour title
- Duration and stop count
- Tour description
- Start/Continue/Replay button

**Properties:**

```typescript
startCard: {
  titleFontSize: '30px',                // Main tour title
  titleFontWeight: '700',               // Main tour title weight
  titleLineHeight: '1.2',               // Main tour title line height
  metaFontSize: '14px',                 // Duration, stops count
  metaFontWeight: '400',                // Duration, stops count weight
  metaColor: '#6B7280',                 // Duration, stops count color
  descriptionFontSize: '16px',          // Tour description
  offlineMessage: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)', // Offline available message background
    borderColor: 'rgba(59, 130, 246, 0.25)',     // Offline message border
    textColor: '#3b82f6',                        // Offline message text color
  },
}
```

**Visual Examples:**
- `titleFontSize` + `titleFontWeight` + `titleLineHeight` - Large bold "Unlimited Barcelona"
- `metaFontSize` + `metaFontWeight` + `metaColor` - Small "20 MINUT" duration
- `descriptionFontSize` - Tour description paragraph
- `offlineMessage.*` - "Available offline" indicator styling

**Affects:**
- `StartCard` component

---

### 11. Loading States

Controls loading screens and spinners.

```typescript
loading: {
  spinnerColor: '#6366F1',          // Loading spinner color
  backgroundColor: '#F9FAFB',       // Loading screen background
  messageFontSize: '16px',          // "Loading..." text size
  messageFontWeight: '500',         // "Loading..." text weight
}
```

**Visual Examples:**
- `spinnerColor` - Rotating circle animation
- `messageFontSize` + `messageFontWeight` - "Preparing tour..." text

**Affects:**
- `AssetsLoadingScreen` component

---

### 12. Status Colors

Controls feedback and status messages.

```typescript
status: {
  success: '#10B981',               // Success messages and icons
  error: '#EF4444',                 // Error messages and icons
  warning: '#F59E0B',               // Warning messages and icons
}
```

**Visual Examples:**
- `success` - Green checkmarks, success messages
- `error` - Red error text, error icons
- `warning` - Orange/yellow warning badges

**Affects:**
- `ErrorScreen` - Error messages
- Error states in cards
- Success/failure feedback

---

### 13. Form Inputs

Controls text input fields.

```typescript
inputs: {
  backgroundColor: '#FFFFFF',       // Input field background
  textColor: '#111827',             // Input text color
  borderColor: '#E5E7EB',           // Default border
  focusBorderColor: '#6366F1',      // Border when focused/active
  placeholderColor: '#9CA3AF',      // Placeholder text color
}
```

**Visual Examples:**
- `backgroundColor` - White input field
- `borderColor` - Gray border (default state)
- `focusBorderColor` - Blue/accent border when typing
- `placeholderColor` - Gray "Enter your email..." text

**Affects:**
- `EmailCard` - Email input field
- Any form inputs

---

### 14. Semantic Color System

Global color tokens for consistency. These provide reusable colors across components.

```typescript
colors: {
  // Text colors
  text: {
    primary: '#111827',      // Main headings, important text
    secondary: '#6B7280',    // Subtitles, supporting text
    tertiary: '#9CA3AF',     // Metadata, timestamps, helper text
    inverse: '#CCCCCC',      // Text on dark backgrounds
  },

  // Border colors
  border: {
    light: '#F3F4F6',        // Subtle dividers, decorative lines
    medium: '#E5E7EB',       // Card borders, section separators
    dark: '#D1D5DB',         // Emphasized dividers, focused borders
  },

  // Background colors
  background: {
    primary: '#FFFFFF',      // Cards, modals, overlays
    secondary: '#F9FAFB',    // Page background, sections
    tertiary: '#F3F4F6',     // Hover states, disabled elements
  },
}
```

**Usage:**
These colors are referenced by specific components. They provide a semantic naming system for consistency.

**Examples:**
- `text.primary` - Used for card titles, main content
- `text.secondary` - Used for descriptions, secondary information
- `background.secondary` - Used for main content background
- `border.medium` - Used for card borders

---

## Creating a Custom Theme

### Step 1: Create Theme File

Create a new file in `src/theme/themes/`:

**File: `src/theme/themes/ocean.ts`**

```typescript
import { ThemeConfig } from '../types';

export const oceanTheme: ThemeConfig = {
  // Theme metadata
  id: 'ocean',
  name: 'Ocean',
  description: 'Cool blues with clean typography',

  // Header
  header: {
    backgroundColor: '#E0F2FE',
    iconColor: '#0284C7',
    textColor: '#0C4A6E',
    timeFontSize: '14px',
    timeFontWeight: '600',
    progressBar: {
      backgroundColor: 'rgba(7, 89, 133, 0.15)',
      highlightColor: '#0284C7',
    },
  },

  // Main content
  mainContent: {
    backgroundColor: '#F0F9FF',
  },

  // Cards
  cards: {
    backgroundColor: '#FFFFFF',
    textColor: '#0C4A6E',
    borderColor: '#BAE6FD',
    borderRadius: '16px',
    shadow: '0 4px 20px rgba(2, 132, 199, 0.1)',
    titleFontSize: '18px',
    titleFontWeight: '600',
    durationBadgeFontSize: '14px',
    numberFontSize: '14px',
    numberFontWeight: '600',
    image: {
      placeholderColor: '#E0F2FE',
      durationBadgeBackground: 'rgba(12, 74, 110, 0.7)',
      durationBadgeText: '#F0F9FF',
    },
  },

  // Step indicators
  stepIndicators: {
    active: {
      outlineColor: '#0284C7',
      numberColor: '#0284C7',
      backgroundColor: '#F0F9FF',
    },
    inactive: {
      borderColor: '#BAE6FD',
      numberColor: '#64748B',
      backgroundColor: '#F0F9FF',
    },
    completed: {
      backgroundColor: '#0284C7',
      checkmarkColor: '#F0F9FF',
    },
  },

  // Buttons
  buttons: {
    primary: {
      backgroundColor: '#0284C7',
      textColor: '#FFFFFF',
      hoverBackground: '#0369A1',
      iconColor: '#FFFFFF',
      fontSize: '18px',
      fontWeight: '600',
    },
    secondary: {
      backgroundColor: '#F0F9FF',
      textColor: '#0C4A6E',
      borderColor: '#BAE6FD',
      hoverBackground: '#E0F2FE',
      fontSize: '16px',
      fontWeight: '500',
    },
    download: {
      backgroundColor: 'transparent',
      textColor: '#0284C7',
      borderColor: '#0284C7',
      hoverBackground: 'rgba(2, 132, 199, 0.1)',
      iconColor: '#0284C7',
      fontSize: '18px',
      fontWeight: '600',
    },
    transcription: {
      backgroundColor: '#FFFFFF',
      iconColor: '#0284C7',
      hoverBackground: '#F0F9FF',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      heading: ['Inter', 'sans-serif'],
      numbers: ['Inter'],
    },
  },

  // Branding
  branding: {
    logoUrl: undefined,
    showLogoBorder: true,
    logoSize: 'fit',
  },

  // Mini Player
  miniPlayer: {
    backgroundColor: '#FFFFFF',
    textColor: '#0C4A6E',
    titleFontSize: '16px',
    titleFontWeight: '500',
    transcriptionFontSize: '15px',
    progressBar: {
      backgroundColor: '#E0F2FE',
      highlightColor: '#0369A1',
    },
    controls: {
      playButtonBackground: '#0284C7',
      playButtonIcon: '#FFFFFF',
      otherButtonsBackground: '#E0F2FE',
      otherButtonsIcon: '#075985',
    },
    minimized: {
      playButtonIcon: '#0284C7',
    },
  },

  // Sheets
  sheets: {
    backgroundColor: '#FFFFFF',
    handleColor: '#BAE6FD',
    textColor: '#0C4A6E',
    borderColor: '#E0F2FE',
    titleFontSize: '18px',
    titleFontWeight: '700',
  },

  // Status
  status: {
    success: '#0284C7',
    error: '#DC2626',
    warning: '#F59E0B',
  },

  // Loading
  loading: {
    spinnerColor: '#0284C7',
    backgroundColor: '#F0F9FF',
    messageFontSize: '16px',
    messageFontWeight: '500',
  },

  // Start Card
  startCard: {
    titleFontSize: '30px',
    titleFontWeight: '700',
    titleLineHeight: '1.2',
    metaFontSize: '14px',
    metaFontWeight: '400',
    metaColor: '#64748B',
    descriptionFontSize: '16px',
    offlineMessage: {
      backgroundColor: 'rgba(2, 132, 199, 0.08)',
      borderColor: 'rgba(2, 132, 199, 0.25)',
      textColor: '#0284C7',
    },
  },

  // Inputs
  inputs: {
    backgroundColor: '#FFFFFF',
    textColor: '#0C4A6E',
    borderColor: '#BAE6FD',
    focusBorderColor: '#0284C7',
    placeholderColor: '#94A3B8',
  },

  // Semantic colors
  colors: {
    text: {
      primary: '#0C4A6E',
      secondary: '#475569',
      tertiary: '#64748B',
      inverse: '#FFFFFF',
    },
    border: {
      light: '#F0F9FF',
      medium: '#E0F2FE',
      dark: '#BAE6FD',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F0F9FF',
      tertiary: '#E0F2FE',
    },
  },
};
```

### Step 2: Register Theme

Add your theme to the themes index:

**File: `src/theme/themes/index.ts`**

```typescript
import { defaultLightTheme } from './default-light';
import { defaultDarkTheme } from './default-dark';
import { oceanTheme } from './ocean'; // Add import

export const themes = {
  'default-light': defaultLightTheme,
  'default-dark': defaultDarkTheme,
  ocean: oceanTheme, // Add to export
};

export type ThemeName = keyof typeof themes;
```

### Step 3: Load Custom Fonts (if needed)

If using custom fonts, add them to `index.html`:

```html
<!-- In index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Step 4: Test Your Theme

```bash
bun run dev
```

Switch to your new theme in the app settings.

---

## Best Practices

### 1. Color Contrast

Ensure sufficient contrast for accessibility:

✅ **Good:**
```typescript
cards: {
  backgroundColor: '#FFFFFF',
  textColor: '#111827',  // 16:1 contrast ratio
}
```

❌ **Bad:**
```typescript
cards: {
  backgroundColor: '#F3F4F6',
  textColor: '#D1D5DB',  // Poor contrast, hard to read
}
```

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Aim for WCAG AA: minimum 4.5:1 for text
- Aim for WCAG AAA: minimum 7:1 for text

### 2. Consistent Accent Color

Use a consistent accent color throughout your theme:

```typescript
const ACCENT = '#6366F1'; // Define once

header: {
  iconColor: ACCENT,
  progressBar: { highlightColor: ACCENT },
},
buttons: {
  primary: { backgroundColor: ACCENT },
},
miniPlayer: {
  controls: { playButtonBackground: ACCENT },
}
```

### 3. Font Sizes and Hierarchy

Maintain clear visual hierarchy with font sizes:

```typescript
// Large → Medium → Small
startCard: {
  titleFontSize: '30px',        // Largest
  descriptionFontSize: '16px',  // Medium
  metaFontSize: '14px',         // Smallest
}
```

### 4. Use Direct Pixel Values

Always use direct pixel values, not rems or Tailwind references:

✅ **Good:**
```typescript
cards: {
  titleFontSize: '18px',
  borderRadius: '12px',
}
```

❌ **Bad:**
```typescript
cards: {
  titleFontSize: '1.125rem',  // Don't use rems
  borderRadius: 'rounded-xl', // Don't use Tailwind classes
}
```

### 5. Shadows and Depth

Use subtle shadows to create depth without overwhelming:

```typescript
// Subtle elevation
shadow: '0 2px 15px rgba(0, 0, 0, 0.1)'

// Too strong (avoid)
shadow: '0 10px 50px rgba(0, 0, 0, 0.5)'
```

### 6. Semantic Color Usage

Use the semantic color system for consistency:

```typescript
colors: {
  text: {
    primary: '#111827',    // For headlines
    secondary: '#6B7280',  // For descriptions
    tertiary: '#9CA3AF',   // For metadata
  }
}

// Then reference throughout:
cards: {
  textColor: theme.colors.text.primary,
}
```

---

## Typography System

### Font Families

Only font families are defined in `typography.fontFamily`. Font sizes and weights are component-specific.

**Available Font Family Types:**

1. **sans** - Main body font (required)
   - Used for most UI text
   - Example: `['Inter', 'system-ui', 'sans-serif']`

2. **heading** - Optional headline font
   - Used for special headlines if defined
   - Falls back to `sans` if not defined
   - Example: `['Space Grotesk', 'Inter', 'sans-serif']`

3. **numbers** - Optional numerical font
   - Used for time, duration, progress displays
   - Falls back to `sans` if not defined
   - Example: `['Space Grotesk']`

**Example:**

```typescript
typography: {
  fontFamily: {
    sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
    heading: ['Space Grotesk', 'IBM Plex Sans', 'sans-serif'],
    numbers: ['Space Grotesk'],
  },
}
```

### Font Sizes and Weights

Font sizes and weights are **component-specific** for clarity and control:

| Component | Size Properties | Weight Properties | Font Family Properties |
|-----------|----------------|------------------|----------------------|
| **Header** | `timeFontSize` | `timeFontWeight` | Uses `typography.fontFamily.numbers` |
| **Cards** | `titleFontSize`, `durationBadgeFontSize`, `numberFontSize` | `titleFontWeight`, `numberFontWeight` | Uses `typography.fontFamily.sans` |
| **Buttons** | `primary.fontSize`, `secondary.fontSize`, `download.fontSize` | `primary.fontWeight`, `secondary.fontWeight`, `download.fontWeight` | `primary.fontFamily`, `secondary.fontFamily`, `download.fontFamily` (optional) |
| **Mini Player** | `titleFontSize`, `transcriptionFontSize` | `titleFontWeight` | Uses `typography.fontFamily.sans` |
| **Sheets** | `titleFontSize` | `titleFontWeight` | Uses `typography.fontFamily.sans` |
| **Start Card** | `titleFontSize`, `metaFontSize`, `descriptionFontSize` | `titleFontWeight`, `metaFontWeight` | Uses `typography.fontFamily.sans` |
| **Loading** | `messageFontSize` | `messageFontWeight` | Uses `typography.fontFamily.sans` |

**Why Component-Specific?**
- ✅ Clear what each property affects
- ✅ No unused generic scales
- ✅ Easy to customize specific components
- ✅ Semantic naming (e.g., `titleFontSize` vs abstract `fontSize.lg`)

---

## Color System

### Color Formats

Use hex colors for consistency:

✅ **Good:**
```typescript
backgroundColor: '#6366F1'
backgroundColor: '#FFFFFF'
```

✅ **Also Good (with transparency):**
```typescript
backgroundColor: 'rgba(99, 102, 241, 0.1)'
shadow: '0 2px 15px rgba(0, 0, 0, 0.1)'
```

❌ **Avoid:**
```typescript
backgroundColor: 'rgb(99, 102, 241)'  // Use hex instead
backgroundColor: 'blue'                // Use hex codes
```

### Semantic Colors

The `colors` section provides reusable tokens:

```typescript
colors: {
  text: {
    primary: '#111827',    // Main content
    secondary: '#6B7280',  // Supporting text
    tertiary: '#9CA3AF',   // Metadata
    inverse: '#FFFFFF',    // On dark backgrounds
  },
  border: {
    light: '#F3F4F6',      // Subtle dividers
    medium: '#E5E7EB',     // Normal borders
    dark: '#D1D5DB',       // Emphasized borders
  },
  background: {
    primary: '#FFFFFF',    // Cards, modals
    secondary: '#F9FAFB',  // Page background
    tertiary: '#F3F4F6',   // Hover/disabled states
  },
}
```

These are referenced by components:
- `ErrorScreen` uses `colors.background.primary`
- `ThreeDObjectCard` uses `colors.background.tertiary` for gradients
- Many components use `colors.text.primary`, `colors.text.secondary`, etc.

---

## What You Can Customize

### ✅ Fully Customizable

- **All colors** - Every color in every component
- **Font families** - Choose any web font
- **Font sizes** - Per-component sizing
- **Font weights** - Per-component weights
- **Border radius** - Card corner rounding
- **Shadows** - Drop shadow styling
- **Progress bars** - Track and fill colors
- **Button styles** - Background, text, hover states
- **Icons** - All icon colors
- **Custom logo** - Replace default branding

### ⚠️ Partially Customizable

- **Layout spacing** - Some spacing is hardcoded in components (padding, margins)
- **Animation timing** - Transition durations are defined in components
- **Component structure** - Component layouts are fixed

### ❌ Not Customizable via Themes

- **Component behavior** - Interactive behavior is code-based
- **Layout structure** - Screen layouts are fixed
- **Animations** - Animation types are fixed (can't change from fade to slide via theme)
- **Icons themselves** - Only colors, not icon shapes (requires code change)

---

## Limitations and Constraints

### Font System Limitations

**Removed Features:**
- ❌ Generic `fontSize` scales (xs, sm, md, lg, xl, 2xl, 3xl) - REMOVED
- ❌ Generic `fontWeight` scales (regular, medium, semibold, bold) - REMOVED

**Why?**
These were unused in the codebase and added unnecessary complexity. Component-specific sizing is clearer and more maintainable.

### Color Constraints

**No Color Variables:**
Themes use direct color values, not CSS variables. This means:
- ❌ Can't dynamically change colors after theme loads without reloading
- ✅ Better TypeScript safety and autocomplete
- ✅ Simpler theme structure

### Layout Constraints

**Fixed Layouts:**
Themes don't control:
- Component positioning
- Grid layouts
- Flexbox direction
- Spacing between elements (some spacing is theme-controlled, some is hardcoded)

### Platform Limitations

**Safe Areas:**
iOS/Android safe-area insets are handled automatically by `GlobalStyles.tsx` (`env(safe-area-inset-top/bottom)`). The status bar background color is **not** part of the theme file — it is controlled by the `header.backgroundColor` theme property (TourDetail) and the `backgroundColor` metadata property (TourStart). See the [Status Bar Background](#status-bar-background) section above.

---

## Examples

### Corporate Brand Theme

```typescript
export const corporateTheme: ThemeConfig = {
  id: 'corporate',
  name: 'Corporate',
  description: 'Professional brand colors',

  // Use brand color throughout
  header: {
    backgroundColor: '#003B73', // Navy blue
    iconColor: '#FFD700',       // Gold
    textColor: '#FFFFFF',
    // ... rest of config
  },

  buttons: {
    primary: {
      backgroundColor: '#FFD700', // Gold
      textColor: '#003B73',       // Navy text
      // ...
    },
  },

  // Keep everything else professional
  colors: {
    text: {
      primary: '#003B73',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    // ...
  },
};
```

### Dark Mode Theme

```typescript
export const darkTheme: ThemeConfig = {
  id: 'dark',
  name: 'Dark Mode',
  description: 'Dark theme for low-light environments',

  header: {
    backgroundColor: '#1F2937',
    iconColor: '#818CF8',
    textColor: '#F9FAFB',
    // ...
  },

  mainContent: {
    backgroundColor: '#111827',
  },

  cards: {
    backgroundColor: '#1F2937',
    textColor: '#F9FAFB',
    borderColor: '#374151',
    // ...
  },

  colors: {
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
      inverse: '#111827',
    },
    background: {
      primary: '#1F2937',
      secondary: '#111827',
      tertiary: '#374151',
    },
    // ...
  },
};
```

### Terminal/Hacker Theme

```typescript
export const terminalTheme: ThemeConfig = {
  id: 'terminal',
  name: 'Terminal',
  description: 'Dark hacker aesthetic with cyan accents and monospace typography',

  header: {
    backgroundColor: '#0A0E14',  // Very dark
    iconColor: '#00D9FF',         // Cyan
    textColor: '#E6EDF3',         // Light
    // ...
  },

  mainContent: {
    backgroundColor: '#0D1117',   // Dark background
  },

  cards: {
    backgroundColor: '#161B22',   // Dark gray cards
    textColor: '#E6EDF3',         // Light text
    borderColor: '#30363D',       // Medium dark border
    borderRadius: '8px',          // Sharper corners for terminal look
    shadow: '0 4px 20px rgba(0, 217, 255, 0.08)', // Subtle cyan glow
    // ...
  },

  buttons: {
    primary: {
      backgroundColor: '#00D9FF',   // Bright cyan
      textColor: '#0A0E14',         // Dark text for contrast
      hoverBackground: '#00C4E8',   // Darker cyan
      fontSize: '18px',
      fontWeight: '700',
      fontFamily: ['JetBrains Mono', 'monospace'], // Monospace for terminal aesthetic!
    },
    secondary: {
      backgroundColor: '#21262D',
      textColor: '#E6EDF3',
      borderColor: '#30363D',
      fontSize: '16px',
      fontWeight: '600',
      fontFamily: ['JetBrains Mono', 'monospace'], // Consistent monospace
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],     // Body text
      heading: ['JetBrains Mono', 'monospace'],        // Monospace headings
      numbers: ['JetBrains Mono', 'monospace'],        // Monospace numbers
    },
  },

  sheets: {
    backgroundColor: '#161B22',  // Dark sheets (not white!)
    handleColor: '#484F58',
    textColor: '#E6EDF3',
    borderColor: '#30363D',
    // ...
  },

  status: {
    success: '#3FB950',  // Terminal green
    error: '#F85149',    // Bright red
    warning: '#D29922',  // Amber
  },

  colors: {
    text: {
      primary: '#E6EDF3',     // Light text
      secondary: '#8B949E',   // Medium gray
      tertiary: '#6E7681',    // Darker gray
      inverse: '#0A0E14',     // Dark (for bright backgrounds)
    },
    background: {
      primary: '#161B22',     // Card dark
      secondary: '#0D1117',   // Darker background
      tertiary: '#21262D',    // Hover states
    },
    // ...
  },
};
```

**Key Features:**
- Complete dark mode including bottom sheets
- Monospace fonts (JetBrains Mono) for headings, numbers, AND buttons
- Cyan accent color throughout
- Sharper border radius for technical aesthetic
- Subtle cyan glows in shadows

### Minimalist Theme

```typescript
export const minimalistTheme: ThemeConfig = {
  id: 'minimalist',
  name: 'Minimalist',
  description: 'Clean and simple',

  // Everything white/black/gray
  header: {
    backgroundColor: '#FFFFFF',
    iconColor: '#000000',
    textColor: '#000000',
    // ...
  },

  mainContent: {
    backgroundColor: '#FAFAFA',
  },

  cards: {
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    borderColor: '#E0E0E0',
    borderRadius: '0px', // Sharp corners
    shadow: 'none',      // No shadow
    // ...
  },

  buttons: {
    primary: {
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      // ...
    },
    secondary: {
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      borderColor: '#000000',
      // ...
    },
  },

  // Monochrome palette
  colors: {
    text: {
      primary: '#000000',
      secondary: '#666666',
      tertiary: '#999999',
      inverse: '#FFFFFF',
    },
    // ...
  },
};
```

---

## Testing Your Theme

### Visual Testing Checklist

Test your theme across all screens:

1. **Tour Start Screen**
   - [ ] Title, meta, description readable
   - [ ] Start button clearly visible
   - [ ] Icons colored correctly

2. **Audio Stop Cards**
   - [ ] Card background and borders look good
   - [ ] Step numbers stand out
   - [ ] Duration badges readable on images

3. **Mini Player**
   - [ ] Progress bar visible
   - [ ] Control buttons clear
   - [ ] Transcription text readable
   - [ ] Minimized state works

4. **Bottom Sheets**
   - [ ] Language picker readable
   - [ ] Rating stars visible
   - [ ] Handle color appropriate

5. **Loading States**
   - [ ] Spinner color matches theme
   - [ ] Loading message readable

6. **Error States**
   - [ ] Error messages clear
   - [ ] Retry button visible

### Contrast Testing

Use browser DevTools to check color contrast:

```javascript
// In browser console
const bg = '#FFFFFF';
const fg = '#111827';
// Use online contrast checker to verify ratio
```

### Build Testing

```bash
bun run build
```

Ensure no TypeScript errors from theme configuration.

---

## Troubleshooting

### Theme Not Appearing

**Problem:** Custom theme doesn't show in theme picker

**Solutions:**
1. Check theme is exported in `src/theme/themes/index.ts`
2. Verify theme follows `ThemeConfig` interface
3. Restart dev server: `bun run dev`
4. Clear browser cache

### TypeScript Errors

**Problem:** TypeScript errors in theme file

**Solutions:**
1. Ensure all required properties are defined
2. Check property types match `ThemeConfig`
3. Use direct pixel values (e.g., `'18px'` not `18`)
4. Verify color formats are strings

### Fonts Not Loading

**Problem:** Custom fonts not displaying

**Solutions:**
1. Add font link to `index.html`
2. Check font family name matches Google Fonts exactly
3. Include fallback fonts: `['Inter', 'system-ui', 'sans-serif']`
4. Clear browser cache
5. Check browser Network tab for font loading errors

### Colors Look Wrong

**Problem:** Colors don't match what you defined

**Solutions:**
1. Check component is using theme property (not hardcoded)
2. Verify hex color format: `#RRGGBB`
3. Check rgba transparency: `rgba(R, G, B, A)`
4. Inspect element in DevTools to see computed styles

---

## API Reference

### ThemeConfig Interface

Located in `src/theme/types.ts`:

```typescript
export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  header: { /* ... */ };
  mainContent: { /* ... */ };
  cards: { /* ... */ };
  stepIndicators: { /* ... */ };
  buttons: { /* ... */ };
  typography: { /* ... */ };
  branding: { /* ... */ };
  miniPlayer: { /* ... */ };
  sheets: { /* ... */ };
  status: { /* ... */ };
  loading: { /* ... */ };
  startCard: { /* ... */ };
  inputs: { /* ... */ };
  colors: { /* ... */ };
}
```

See the complete interface definition in `src/theme/types.ts`.

### Applying Themes

Themes are applied via styled-components ThemeProvider:

```typescript
import { ThemeProvider } from 'styled-components';
import { themes } from './src/theme/themes';

<ThemeProvider theme={themes.ocean}>
  <App />
</ThemeProvider>
```

### Accessing Theme in Components

```typescript
import styled from 'styled-components';

const Title = styled.h1`
  font-size: ${({ theme }) => theme.startCard.titleFontSize};
  font-weight: ${({ theme }) => theme.startCard.titleFontWeight};
  color: ${({ theme }) => theme.colors.text.primary};
`;
```

---

## Resources

- **Theme Types:** `src/theme/types.ts`
- **Built-in Themes:** `src/theme/themes/`
- **Global Styles:** `src/theme/GlobalStyles.tsx`
- **Styled Components:** https://styled-components.com/
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Google Fonts:** https://fonts.google.com/

---

**Related Documentation:**
- [Languages](./languages.md) - Multi-language support
- [Adding Tours](./adding-tours.md) - Creating tour content
- [Main Documentation](../README.md) - General information
