/**
 * Default Light theme configuration
 * A clean, high-contrast light theme with clarity and white space.
 * Focuses on legibility with a soft grayscale palette.
 */

import { ThemeConfig } from '../types';

export const defaultLightTheme: ThemeConfig = {
  id: 'default-light',
  name: 'Default Light',
  description: 'Clean, distraction-free light aesthetic with high legibility and soft gray accents',

  header: {
    backgroundColor: '#FFFFFF', // Pure white header
    iconColor: '#666666', // Muted gray icons
    textColor: '#1A1A1A', // Sharp dark text
    timeFontSize: '14px',
    timeFontWeight: '400',
    hoverBackground: 'rgba(0, 0, 0, 0.05)',
    progressBar: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)', // Subtle track
      highlightColor: '#459825', // Green for progress
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
    shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Subtle card shadow
    titleFontSize: '18px',
    titleFontWeight: '400',
    durationBadgeFontSize: '13px',
    numberFontSize: '14px',
    numberFontWeight: '500',
    image: {
      placeholderColor: '#F0F0F0',
      durationBadgeBackground: 'rgba(255, 255, 255, 0.8)',
      durationBadgeText: '#1A1A1A',
    },
    thumbnail: {
      borderRadius: '8px',
      size: '56px',
    },
  },

  stepIndicators: {
    active: {
      outlineColor: '#459825', // Outline for active step
      numberColor: '#000000', // Active step number
      backgroundColor: '#FEFEFE', // Active step background
    },
    inactive: {
      borderColor: '#CCCCCC', // Light gray ring
      numberColor: '#999999', // Faded text
      backgroundColor: 'transparent',
    },
    completed: {
      backgroundColor: '#E8F5E1', // Light green background (matches feedback confirmation)
      checkmarkColor: '#459825', // Green checkmark (matches success color)
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
    download: {
      backgroundColor: 'transparent',
      textColor: '#000000',
      borderColor: '#999999',
      hoverBackground: '#F0F0F0',
      iconColor: '#000000',
      fontSize: '16px',
      fontWeight: '600',
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
    showLogoBorder: false,
    logoSize: 'original',
  },

  miniPlayer: {
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A1A',
    titleFontSize: '15px',
    titleFontWeight: '400',
    transcriptionFontSize: '15px',
    shadow: '0 -10px 40px rgba(0, 0, 0, 0.15)',
    progressBar: {
      backgroundColor: '#F0F0F0',
      highlightColor: '#459825',
    },
    controls: {
      playButtonBackground: 'transparent',
      playButtonIcon: '#000000',
      otherButtonsBackground: 'transparent',
      otherButtonsIcon: '#666666',
      otherButtonsHoverBackground: '#F0F0F0',
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
    backdropColor: 'rgba(0, 0, 0, 0.2)',
    shadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
  },

  status: {
    success: '#459825', // Green
    error: '#D32F2F',   // Bold red
    warning: '#EAAD56', // Orange/Yellow
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
    titleLineHeight: '1.2',
    metaFontSize: '14px',
    metaFontWeight: '400',
    metaColor: '#666666',
    descriptionFontSize: '16px',
    offlineMessage: {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      textColor: '#525252',
    },
    overlay: {
      buttonBackground: 'rgba(0, 0, 0, 0.4)',
      buttonColor: '#FFFFFF',
      gradientTop: 'rgba(0, 0, 0, 0.3)',
      gradientBottom: 'rgba(0, 0, 0, 0.6)',
    },
  },

  inputs: {
    backgroundColor: '#F9F9F9',
    textColor: '#1A1A1A',
    borderColor: '#DDDDDD',
    focusBorderColor: '#000000', // Focuses to black
    placeholderColor: '#999999',
  },

  richText: {
    blockquoteBorderColor: '#CCCCCC',
    blockquoteBackgroundColor: 'rgba(0, 0, 0, 0.02)',
    linkColor: '#1A73E8',
  },

  imageCaption: {
    textColor: '#666666',
    creditColor: '#999999',
  },

  hotspot: {
    pinColor: '#9E86FF',
    pinPulseColor: 'rgba(158, 134, 255, 0.3)',
    pinBorderColor: 'rgba(0, 0, 0, 0.3)',
    pinShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
    popoverShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },

  tooltip: {
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A1A',
    borderColor: '#E5E5E5',
  },

  fullscreenPlayer: {
    artworkBorderRadius: '16px',
    artworkShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    adjacentArtworkOpacity: 0.6,
    infoButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      iconColor: 'rgba(255, 255, 255, 0.55)',
      backdropBlur: '4px',
    },
    captionOverlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: '12px',
      backdropBlur: '12px',
    },
    transcriptionTextOpacity: 0.8,
  },

  colors: {
    text: {
      primary: '#1A1A1A',   // Near black
      secondary: '#666666', // Medium gray
      tertiary: '#777777',  // Medium-light gray (skip buttons, hints)
      inverse: '#FFFFFF',   // White (for use on black buttons)
    },
    border: {
      light: '#F0F0F0',
      medium: '#E5E5E5',
      dark: '#CCCCCC',
    },
    background: {
      primary: '#FFFFFF',   // Pure white
      secondary: '#F0F0F0', // Light gray (icon circles, elevated surfaces)
      tertiary: '#E8E8E8',  // Hover states
    },
  },
};
