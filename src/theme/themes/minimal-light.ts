/**
 * Minimal Light theme configuration
 * A clean, high-contrast light theme inspired by Obsidian Minimal (Light).
 * Focuses on clarity and white space with a soft grayscale palette.
 */

import { ThemeConfig } from '../types';

export const minimalLightTheme: ThemeConfig = {
  id: 'minimal-light',
  name: 'Minimal Light',
  description: 'Clean, distraction-free light aesthetic with high legibility and soft gray accents',

  header: {
    backgroundColor: '#FFFFFF', // Pure white header
    iconColor: '#666666', // Muted gray icons
    textColor: '#1A1A1A', // Sharp dark text
    timeFontSize: '14px',
    timeFontWeight: '500',
    progressBar: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)', // Subtle track
      highlightColor: '#000000', // Pure black for progress
    },
  },

  mainContent: {
    backgroundColor: '#FAFAFA', // Very light gray/off-white for the main surface
  },

  cards: {
    backgroundColor: '#FFFFFF', // Cards are pure white to pop slightly
    textColor: '#1A1A1A',
    borderColor: '#E5E5E5', // Soft border instead of shadow
    borderRadius: '6px',
    shadow: 'none', // Flat design
    titleFontSize: '18px',
    titleFontWeight: '600',
    durationBadgeFontSize: '13px',
    numberFontSize: '14px',
    numberFontWeight: '500',
    image: {
      placeholderColor: '#F0F0F0',
      durationBadgeBackground: 'rgba(255, 255, 255, 0.8)',
      durationBadgeText: '#1A1A1A',
    },
  },

  stepIndicators: {
    active: {
      outlineColor: '#000000', // Active step is pure black
      numberColor: '#FFFFFF', // Number is white for contrast
      backgroundColor: '#000000', // Active step is filled black
    },
    inactive: {
      borderColor: '#CCCCCC', // Light gray ring
      numberColor: '#999999', // Faded text
      backgroundColor: 'transparent',
    },
    completed: {
      backgroundColor: '#E5E5E5', // Neutral light gray for finished steps
      checkmarkColor: '#1A1A1A',
    },
  },

  buttons: {
    primary: {
      backgroundColor: '#000000', // High contrast black button
      textColor: '#FFFFFF', // White text
      hoverBackground: '#333333', // Darker gray on hover
      iconColor: '#FFFFFF',
      fontSize: '16px',
      fontWeight: '600',
      fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    },
    secondary: {
      backgroundColor: 'transparent',
      textColor: '#666666',
      borderColor: '#CCCCCC',
      hoverBackground: '#F0F0F0',
      fontSize: '15px',
      fontWeight: '500',
      fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    },
    transcription: {
      backgroundColor: 'transparent',
      iconColor: '#666666',
      hoverBackground: '#F0F0F0',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      numbers: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    },
  },

  branding: {
    logoUrl: undefined,
    iconColor: '#000000', // Black branding
  },

  miniPlayer: {
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A1A',
    titleFontSize: '15px',
    titleFontWeight: '500',
    timeFontSize: '15px',
    timeFontWeight: '500',
    transcriptionFontSize: '14px',
    progressBar: {
      backgroundColor: '#F0F0F0',
      highlightColor: '#000000', // Black progress line
    },
    controls: {
      playButtonBackground: 'transparent',
      playButtonIcon: '#000000',
      otherButtonsBackground: 'transparent',
      otherButtonsIcon: '#666666',
    },
    minimized: {
      playButtonIcon: '#000000',
    },
  },

  sheets: {
    backgroundColor: '#FFFFFF', // Pure white modal
    handleColor: '#DDDDDD',
    textColor: '#1A1A1A',
    borderColor: '#EEEEEE',
    titleFontSize: '18px',
    titleFontWeight: '600',
  },

  status: {
    success: '#3D7D3F', // Forest green (easier to read on light)
    error: '#D32F2F',   // Bold red
    warning: '#795548', // Brownish/Amber
    info: '#666666',    // Neutral gray
  },

  loading: {
    spinnerColor: '#000000',
    backgroundColor: '#FFFFFF',
    messageFontSize: '15px',
    messageFontWeight: '500',
  },

  startCard: {
    titleFontSize: '28px',
    titleFontWeight: '600',
    metaFontSize: '14px',
    metaFontWeight: '400',
    metaColor: '#666666',
    descriptionFontSize: '16px',
    sectionLabelFontSize: '13px',
    sectionLabelFontWeight: '600',
    sectionDescriptionFontSize: '13px',
  },

  inputs: {
    backgroundColor: '#F9F9F9',
    textColor: '#1A1A1A',
    borderColor: '#DDDDDD',
    focusBorderColor: '#000000', // Focuses to black
    placeholderColor: '#999999',
  },

  colors: {
    text: {
      primary: '#1A1A1A',   // Near black
      secondary: '#666666', // Medium gray
      tertiary: '#999999',  // Light gray
      inverse: '#FFFFFF',   // White (for use on black buttons)
    },
    border: {
      light: '#F0F0F0',
      medium: '#E5E5E5',
      dark: '#CCCCCC',
    },
    background: {
      primary: '#FFFFFF',   // Pure white
      secondary: '#FAFAFA', // Off-white
      tertiary: '#F0F0F0',  // Hover states
    },
  },
};