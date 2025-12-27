# Theming System Documentation

This application now supports a comprehensive theming system that allows you to customize the visual appearance of your audio tours. Each tour can have its own unique theme, making it easy to provide customized branding for different customers.

## Overview

The theming system allows you to customize:
- **Colors**: Headers, buttons, cards, backgrounds, text, etc.
- **Typography**: Font families, sizes, and weights
- **Border Radius**: Corner roundness for cards and buttons
- **Shadows**: Shadow styles for various elements
- **Spacing**: Consistent spacing throughout the app
- **Icons & Branding**: Custom logos and icon colors

## How It Works

### 1. Theme Structure

Each theme is defined in a TypeScript file and follows the `ThemeConfig` interface. You can find theme files in:

```
src/theme/themes/
├── default.ts   (Original application design)
├── modern.ts    (Example alternative theme)
└── index.ts     (Theme registry)
```

### 2. Applying Themes to Tours

To assign a theme to a specific tour, add the `themeId` field to your tour data JSON:

```json
{
  "id": "barcelona",
  "language": "en",
  "title": "Barcelona Walking Tour",
  "description": "...",
  "themeId": "modern",
  ...
}
```

If no `themeId` is specified, the tour will use the `default` theme.

## Creating a Custom Theme

### Step 1: Create a New Theme File

Create a new file in `src/theme/themes/` (e.g., `purple.ts`):

```typescript
import { ThemeConfig } from '../types';

export const purpleTheme: ThemeConfig = {
  id: 'purple',
  name: 'Purple Brand',
  description: 'Custom purple theme for Brand X',

  // Header Section
  header: {
    backgroundColor: '#7C3AED', // Purple header
    iconColor: '#FCD34D',       // Yellow icons
    textColor: '#FFFFFF',       // White text
    progressBar: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      highlightColor: '#FCD34D',
    },
  },

  // Main Content Background
  mainContent: {
    backgroundColor: '#F5F3FF', // Light purple background
  },

  // Cards Configuration
  cards: {
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderColor: '#E9D5FF',
    shadowColor: 'rgba(124, 58, 237, 0.1)',
    cornerRadius: '20px', // More rounded corners
    image: {
      placeholderColor: '#E9D5FF',
      durationBadgeBackground: 'rgba(124, 58, 237, 0.8)',
      durationBadgeText: '#FFFFFF',
    },
  },

  // Step Indicators (numbered circles on audio cards)
  stepIndicators: {
    active: {
      outlineColor: '#7C3AED',
      numberColor: '#7C3AED',
      backgroundColor: '#FFFFFF',
    },
    inactive: {
      borderColor: '#D1D5DB',
      numberColor: '#6B7280',
      backgroundColor: '#FFFFFF',
    },
    completed: {
      backgroundColor: '#10B981',
      checkmarkColor: '#FFFFFF',
    },
  },

  // Buttons
  buttons: {
    primary: {
      backgroundColor: '#7C3AED',
      textColor: '#FFFFFF',
      hoverBackground: '#6D28D9',
      iconColor: '#FFFFFF',
    },
    ghost: {
      backgroundColor: '#A78BFA',
      textColor: '#FFFFFF',
      hoverBackground: '#8B5CF6',
    },
    secondary: {
      backgroundColor: '#F3F4F6',
      textColor: '#7C3AED',
      borderColor: '#E5E7EB',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      heading: ['Inter', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Branding (icons and logos)
  branding: {
    logoUrl: undefined, // Optional: URL to custom logo image
    iconColor: '#7C3AED',
  },

  // Mini Player
  miniPlayer: {
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    progressBar: {
      backgroundColor: '#E5E7EB',
      highlightColor: '#7C3AED',
    },
    controls: {
      playButtonBackground: '#7C3AED',
      playButtonIcon: '#FFFFFF',
      otherButtonsBackground: '#A78BFA',
      otherButtonsIcon: '#FFFFFF',
    },
  },

  // Bottom Sheets/Modals
  sheets: {
    backgroundColor: '#FFFFFF',
    handleColor: '#D1D5DB',
    textColor: '#1F2937',
    borderColor: '#E9D5FF',
  },

  // Status Colors
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#7C3AED',
  },

  // Loading States
  loading: {
    spinnerColor: '#7C3AED',
    backgroundColor: '#FFFFFF',
  },

  // Semantic Colors
  colors: {
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    border: {
      light: '#F3F4F6',
      medium: '#E5E7EB',
      dark: '#D1D5DB',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#FAF5FF',
      tertiary: '#F5F3FF',
    },
  },

  // Border Radius Tokens
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(124 58 237 / 0.05)',
    base: '0 1px 3px 0 rgb(124 58 237 / 0.1)',
    md: '0 4px 6px -1px rgb(124 58 237 / 0.1)',
    lg: '0 10px 15px -3px rgb(124 58 237 / 0.1)',
    xl: '0 20px 25px -5px rgb(124 58 237 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(124 58 237 / 0.25)',
  },

  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
  },
};
```

### Step 2: Register the Theme

Add your new theme to the registry in `src/theme/themes/index.ts`:

```typescript
import { purpleTheme } from './purple';

export const themes: Record<ThemeId, ThemeConfig> = {
  default: defaultTheme,
  modern: modernTheme,
  purple: purpleTheme, // Add your theme here
};
```

### Step 3: Use the Theme

Add the `themeId` to your tour JSON file:

```json
{
  "id": "my-tour",
  "themeId": "purple",
  ...
}
```

## Customizable Properties

### Header
- `backgroundColor`: Main header background color
- `iconColor`: Color for header icons
- `textColor`: Header text color
- `progressBar.backgroundColor`: Progress bar background
- `progressBar.highlightColor`: Progress bar fill color

### Main Content
- `backgroundColor`: Main content area background

### Cards
- `backgroundColor`: Card background color
- `textColor`: Card text color
- `borderColor`: Card border color
- `shadowColor`: Card shadow color
- `cornerRadius`: Card corner roundness (e.g., "16px", "1rem")
- `image.placeholderColor`: Image placeholder color
- `image.durationBadgeBackground`: Duration badge background
- `image.durationBadgeText`: Duration badge text color

### Step Indicators
Active, inactive, and completed states for the numbered circles on audio cards:
- `outlineColor`: Spinner/outline color when playing
- `numberColor`: Number text color
- `backgroundColor`: Circle background color
- `borderColor`: Border color (inactive state)
- `checkmarkColor`: Checkmark color (completed state)

### Buttons
Three button variants (primary, ghost, secondary):
- `backgroundColor`: Button background
- `textColor`: Button text color
- `hoverBackground`: Background on hover/press
- `borderColor`: Border color (optional)
- `iconColor`: Icon color inside buttons

### Typography
- `fontFamily.sans`: Main font family
- `fontFamily.heading`: Heading font family (optional)
- `fontSize`: Various text sizes (xs, sm, base, lg, xl, 2xl, 3xl)
- `fontWeight`: Font weights (regular, medium, semibold, bold)

### Branding
- `logoUrl`: Optional URL to custom logo (replaces headphone icon)
- `iconColor`: Color for general UI icons

### Mini Player
- `backgroundColor`: Player background
- `textColor`: Player text color
- `progressBar`: Progress bar colors
- `controls`: Button colors (play button and other controls)

### Other Properties
- **Sheets**: Bottom sheet/modal styling
- **Status**: Success, error, warning, and info colors
- **Loading**: Spinner and loading screen colors
- **Colors**: Semantic color tokens (text, borders, backgrounds)
- **Border Radius**: Consistent border radius tokens
- **Shadows**: Shadow styles
- **Spacing**: Spacing scale

## Best Practices

1. **Color Contrast**: Ensure sufficient contrast between text and background colors for readability
2. **Consistency**: Use the same color palette throughout your theme
3. **Testing**: Test your theme with different content to ensure it works in all scenarios
4. **Documentation**: Add a clear name and description to your theme

## Examples

### Corporate Theme
```typescript
{
  id: 'corporate',
  header: {
    backgroundColor: '#1E40AF', // Corporate blue
    iconColor: '#FFFFFF',
    textColor: '#FFFFFF',
  },
  buttons: {
    primary: {
      backgroundColor: '#1E40AF',
      textColor: '#FFFFFF',
    },
  },
  ...
}
```

### Minimalist Theme
```typescript
{
  id: 'minimalist',
  cards: {
    cornerRadius: '4px', // Sharp corners
    shadowColor: 'rgba(0, 0, 0, 0.02)', // Subtle shadows
  },
  colors: {
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
  },
  ...
}
```

## FAQ

**Q: Can I use custom fonts?**
A: Yes! Specify your font family in the `typography.fontFamily` property. Make sure the fonts are loaded in your application.

**Q: What happens if I don't specify a themeId in my tour data?**
A: The tour will use the `default` theme automatically.

**Q: Can I have different themes for different languages of the same tour?**
A: Yes! Each tour file can specify its own `themeId`. If you have separate tour files for different languages, you can assign different themes to each.

**Q: Do I need to rebuild the application after creating a new theme?**
A: Yes, themes are compiled into the application. After adding a new theme, run `npm run build` to include it.

**Q: Can themes affect layout or sizing?**
A: No, themes only control visual properties like colors, fonts, and border radius. Layout and sizing remain consistent across all themes for a unified user experience.

## Support

For questions or issues with the theming system, please refer to the theme type definitions in `src/theme/types.ts` for a complete list of customizable properties.
