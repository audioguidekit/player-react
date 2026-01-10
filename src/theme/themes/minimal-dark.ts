/**
 * Minimal theme configuration
 * A distraction-free, high-contrast theme inspired by Obsidian Minimal.
 * Focuses on content with a refined grayscale palette and system typography.
 */

import { ThemeConfig } from '../types';

export const minimalDarkTheme: ThemeConfig = {
  id: 'minimal-dark',
  name: 'Minimal Dark',
  description: 'Clean, distraction-free aesthetic with refined grayscale and sans-serif typography',

  header: {
    backgroundColor: '#1E1E1E', // Blends seamlessly with the main background
    iconColor: '#999999', // Subtle gray for icons so they don't distract
    textColor: '#D4D4D4', // Soft white for text
    timeFontSize: '14px',
    timeFontWeight: '500',
    progressBar: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // Very faint track
      highlightColor: '#FFFFFF', // Pure white for progress
    },
  },

  mainContent: {
    backgroundColor: '#1E1E1E', // Main screen background - Soft matte black/dark gray
  },

  cards: {
    backgroundColor: '#1E1E1E', // Same as background (flat look)
    textColor: '#D4D4D4', // Soft white
    borderColor: '#333333', // Subtle border defines the card instead of a shadow
    borderRadius: '6px', // Standard modern rounding
    shadow: 'none', // No drop shadow for a truly flat/minimal feel
    titleFontSize: '18px',
    titleFontWeight: '600',
    durationBadgeFontSize: '13px',
    numberFontSize: '14px',
    numberFontWeight: '500',
    image: {
      placeholderColor: '#252525',
      durationBadgeBackground: 'rgba(0, 0, 0, 0.6)',
      durationBadgeText: '#FFFFFF',
    },
  },

  stepIndicators: {
    active: {
      outlineColor: '#FFFFFF', // Active step is pure white
      numberColor: '#1E1E1E', // Number is dark for contrast
      backgroundColor: '#FFFFFF', // Active step is filled white
    },
    inactive: {
      borderColor: '#444444', // Inactive is just a subtle ring
      numberColor: '#666666', // Inactive text fades away
      backgroundColor: 'transparent', // See-through
    },
    completed: {
      backgroundColor: '#666666', // Completed is a neutral gray
      checkmarkColor: '#FFFFFF',
    },
  },

  buttons: {
    primary: {
      backgroundColor: '#FFFFFF', // High contrast white button
      textColor: '#000000', // Black text
      hoverBackground: '#E5E5E5', // Slightly gray on hover
      iconColor: '#000000',
      fontSize: '16px',
      fontWeight: '600',
      fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    },
    secondary: {
      backgroundColor: 'transparent',
      textColor: '#999999',
      borderColor: '#444444',
      hoverBackground: '#2A2A2A',
      fontSize: '15px',
      fontWeight: '500',
      fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    },
    transcription: {
      backgroundColor: 'transparent',
      iconColor: '#999999',
      hoverBackground: '#2A2A2A',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'], // Native system fonts
      heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      numbers: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    },
  },

  branding: {
    logoUrl: undefined,
    iconColor: '#FFFFFF', // Branding is pure white
  },

  miniPlayer: {
    backgroundColor: '#1E1E1E',
    textColor: '#D4D4D4',
    titleFontSize: '15px',
    titleFontWeight: '500',
    timeFontSize: '15px',
    timeFontWeight: '500',
    transcriptionFontSize: '14px',
    progressBar: {
      backgroundColor: '#333333',
      highlightColor: '#FFFFFF', // White progress line
    },
    controls: {
      playButtonBackground: 'transparent', // Minimal styling (no circle background)
      playButtonIcon: '#FFFFFF',
      otherButtonsBackground: 'transparent',
      otherButtonsIcon: '#999999',
    },
    minimized: {
      playButtonIcon: '#FFFFFF',
    },
  },

  sheets: {
    backgroundColor: '#252525', // Slightly lighter than background to show layering
    handleColor: '#555555',
    textColor: '#D4D4D4',
    borderColor: 'transparent', // No border needed due to background color shift
    titleFontSize: '18px',
    titleFontWeight: '600',
  },

  status: {
    success: '#8CB6C0', // Muted teal (calmer than bright green)
    error: '#C08C8C',   // Muted red
    warning: '#C0B38C', // Muted gold
    info: '#999999',    // Gray
  },

  loading: {
    spinnerColor: '#FFFFFF',
    backgroundColor: '#1E1E1E',
    messageFontSize: '15px',
    messageFontWeight: '500',
  },

  startCard: {
    titleFontSize: '28px',
    titleFontWeight: '600',
    metaFontSize: '14px',
    metaFontWeight: '400',
    metaColor: '#888888',
    descriptionFontSize: '16px',
    sectionLabelFontSize: '13px',
    sectionLabelFontWeight: '600',
    sectionDescriptionFontSize: '13px',
  },

  inputs: {
    backgroundColor: '#1E1E1E',
    textColor: '#D4D4D4',
    borderColor: '#444444',
    focusBorderColor: '#FFFFFF', // Highlight becomes white on focus
    placeholderColor: '#555555',
  },

  colors: {
    text: {
      primary: '#D4D4D4',   // Soft white
      secondary: '#999999', // Light gray
      tertiary: '#666666',  // Dark gray
      inverse: '#1E1E1E',   // Dark background color (for use on white buttons)
    },
    border: {
      light: '#333333',
      medium: '#444444',
      dark: '#666666',
    },
    background: {
      primary: '#1E1E1E',   // Main
      secondary: '#252525', // Slightly lighter (elevated surfaces)
      tertiary: '#2A2A2A',  // Hover states
    },
  },
};