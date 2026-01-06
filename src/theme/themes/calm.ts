/**
 * Calm theme configuration
 * An editorial, calm theme with warm neutrals and muted teal accents.
 * Designed for long-form listening with clear hierarchy and atmospheric quality.
 */

import { ThemeConfig } from '../types';

export const calmTheme: ThemeConfig = {
  id: 'calm',
  name: 'Calm',
  description: 'Editorial calm with warm neutrals and thoughtful typography',

  header: {
    backgroundColor: '#E8DDD0', // Top header bar background
    iconColor: '#5C9F8F', // Header icons (home button, settings, etc.)
    textColor: '#2B2B2B', // Header title text (remaining time, etc.)
    progressBar: {
      backgroundColor: 'rgba(115, 107, 97, 0.15)', // Header progress bar track
      highlightColor: '#5C9F8F', // Header progress bar fill/completion
    },
  },

  mainContent: {
    backgroundColor: '#F5F1EB', // Main screen background (behind all cards and content)
  },

  cards: {
    backgroundColor: '#FFFFFF', // Card container background (all content cards)
    textColor: '#2B2B2B', // Card text content (titles, descriptions)
    borderColor: '#E8DDD0', // Card border outline
    shadowColor: 'rgba(115, 107, 97, 0.08)', // Card drop shadow for elevation
    cornerRadius: '12px', // Card corner rounding
    image: {
      placeholderColor: '#E8DDD0', // Card image placeholder/loading state background
      durationBadgeBackground: 'rgba(43, 43, 43, 0.45)', // Duration/time badge overlay background on card images
      durationBadgeText: '#F5F1EB', // Duration/time badge text on card images
    },
  },

  stepIndicators: {
    active: {
      outlineColor: '#5C9F8F', // Active step circle border/outline
      numberColor: '#5C9F8F', // Active step number text
      backgroundColor: '#F8F0E7', // Active step circle background
    },
    inactive: {
      borderColor: '#E6DBCF', // Inactive/future step circle border
      numberColor: '#736B61', // Inactive/future step number text
      backgroundColor: '#F8F0E7', // Inactive/future step circle background
    },
    completed: {
      backgroundColor: '#5C9F8F', // Completed step circle background (filled)
      checkmarkColor: '#F5F1EB', // Completed step checkmark icon
    },
  },

  buttons: {
    primary: {
      backgroundColor: '#5C9F8F', // Primary action button background (Start, Continue, Submit)
      textColor: '#FFFFFF', // Primary button text
      hoverBackground: '#4D8A7B', // Primary button background on hover/press
      iconColor: '#FFFFFF', // Primary button icon color
    },
    secondary: {
      backgroundColor: '#F5F1EB', // Secondary action button background (Cancel, Skip)
      textColor: '#2B2B2B', // Secondary button text
      borderColor: '#E8DDD0', // Secondary button border
      hoverBackground: '#E8DDD0', // Secondary button background on hover/press
    },
    transcription: {
      backgroundColor: '#FFFFFF', // Transcription toggle button background
      iconColor: '#5C9F8F', // Transcription button icon
      hoverBackground: '#E7F0EE', // Transcription button background on hover/press
    },
  },

  typography: {
    fontFamily: {
      sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'], // Humanist sans for clarity
      heading: ['Space Grotesk', 'IBM Plex Sans', 'sans-serif'], // Contemporary grotesk for character
      numbers: ['Space Grotesk'], // Contemporary grotesk for numerical displays
    },
    fontSize: {
      xs: '0.75rem',    // 12px - metadata
      sm: '0.875rem',   // 14px - secondary text
      base: '1rem',     // 16px - body text
      lg: '1.125rem',   // 18px - emphasized content
      xl: '1.375rem',   // 22px - subheadings
      '2xl': '1.75rem', // 28px - section titles
      '3xl': '2.25rem', // 36px - page titles
    },
    fontWeight: {
      regular: '400',   // Body text
      medium: '500',    // Subtle emphasis
      semibold: '600',  // Strong hierarchy
      bold: '700',      // Display headings
    },
  },

  branding: {
    logoUrl: undefined,
    iconColor: '#2B2B2B', // App logo/branding icon color
  },

  miniPlayer: {
    backgroundColor: '#FFFFFF', // Mini player bar background
    textColor: '#2B2B2B', // Mini player title and time text
    progressBar: {
      backgroundColor: '#E7F0EE', // Mini player progress bar track
      highlightColor: '#478B7B', // Mini player progress bar fill/completion
    },
    controls: {
      playButtonBackground: '#5C9F8F', // Mini player play/pause button background (expanded state)
      playButtonIcon: '#FFFFFF', // Mini player play/pause icon (expanded state)
      otherButtonsBackground: '#E8DDD0', // Mini player skip/rewind buttons background
      otherButtonsIcon: '#7F6C57', // Mini player skip/rewind icons
    },
    minimized: {
      playButtonIcon: '#5C9F8F', // Mini player play/pause icon (minimized state)
    },
  },

  sheets: {
    backgroundColor: '#FFFFFF', // Bottom sheet modal background
    handleColor: '#D4C9BC', // Bottom sheet drag handle
    textColor: '#FF00FF', // Bottom sheet text content
    borderColor: '#E8DDD0', // Bottom sheet top border
  },

  status: {
    success: '#5C9F8F', // Success message text and icons
    error: '#C75146',   // Error message text and icons
    warning: '#D4913D', // Warning message text and icons
    info: '#5C9F8F',    // Info message text and icons
  },

  loading: {
    spinnerColor: '#5C9F8F', // Loading spinner/indicator color
    backgroundColor: '#F5F1EB', // Loading screen background
  },

  inputs: {
    backgroundColor: '#FFFFFF', // Text input field background
    textColor: '#2B2B2B', // Text input field text
    borderColor: '#E8DDD0', // Text input field border (default state)
    focusBorderColor: '#5C9F8F', // Text input field border (focused/active state)
    placeholderColor: '#9B9186', // Text input placeholder text
  },

  colors: {
    text: {
      primary: '#2B2B2B',   // Primary text (headings, main content, body text)
      secondary: '#736B61', // Secondary text (subtitles, supporting text, labels)
      tertiary: '#9B9186',  // Tertiary text (metadata, timestamps, helper text)
      inverse: '#FFFFFF',   // Inverse text (on dark backgrounds)
    },
    border: {
      light: '#F0EBE4',   // Light borders (subtle dividers, decorative lines)
      medium: '#E8DDD0',  // Medium borders (card borders, section separators)
      dark: '#D4C9BC',    // Dark borders (emphasized dividers, focused borders)
    },
    background: {
      primary: '#FFFFFF',   // Primary background (cards, modals, overlays)
      secondary: '#F5F1EB', // Secondary background (page background, sections)
      tertiary: '#E8DDD0',  // Tertiary background (hover states, disabled elements)
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.5rem',      // 8px
    lg: '0.75rem',     // 12px - architectural rounding
    xl: '1rem',        // 16px
    '2xl': '1.25rem',  // 20px
    '3xl': '1.75rem',  // 28px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 3px 0 rgba(115, 107, 97, 0.06)',
    base: '0 2px 4px 0 rgba(115, 107, 97, 0.08), 0 1px 2px -1px rgba(115, 107, 97, 0.06)',
    md: '0 4px 8px -2px rgba(115, 107, 97, 0.10), 0 2px 4px -2px rgba(115, 107, 97, 0.06)',
    lg: '0 12px 20px -4px rgba(115, 107, 97, 0.12), 0 4px 6px -4px rgba(115, 107, 97, 0.08)',
    xl: '0 20px 32px -6px rgba(115, 107, 97, 0.14), 0 8px 12px -6px rgba(115, 107, 97, 0.10)',
    '2xl': '0 32px 48px -12px rgba(115, 107, 97, 0.18)',
  },

  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    6: '1.75rem',  // 28px - more generous spacing
    8: '2.5rem',   // 40px - breathable rhythm
    12: '3.5rem',  // 56px - intentional whitespace
    16: '5rem',    // 80px - editorial breathing room
  },
};
