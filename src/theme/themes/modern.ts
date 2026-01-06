/**
 * Modern Purple theme configuration
 * An alternative theme demonstrating customization capabilities
 */

import { ThemeConfig } from '../types';

export const modernTheme: ThemeConfig = {
  id: 'modern',
  name: 'Modern Purple',
  description: 'A modern theme with purple accents',

  header: {
    backgroundColor: '#7C3AED', // Purple
    iconColor: '#FCD34D', // Yellow
    textColor: '#FFFFFF',
    progressBar: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      highlightColor: '#FCD34D', // Yellow
    },
  },

  mainContent: {
    backgroundColor: '#F5F3FF', // Light purple
  },

  cards: {
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderColor: '#E9D5FF',
    shadowColor: 'rgba(124, 58, 237, 0.1)',
    cornerRadius: '8px', // More rounded
    image: {
      placeholderColor: '#E9D5FF',
      durationBadgeBackground: 'rgba(39, 32, 48, 0.4)',
      durationBadgeText: '#FFFFFF',
    },
  },

  stepIndicators: {
    active: {
      outlineColor: '#7C3AED', // Purple
      numberColor: '#7C3AED',
      backgroundColor: '#FFFFFF',
    },
    inactive: {
      borderColor: '#D1D5DB',
      numberColor: '#6B7280',
      backgroundColor: '#FFFFFF',
    },
    completed: {
      backgroundColor: '#10B981', // Emerald
      checkmarkColor: '#FFFFFF',
    },
  },

  buttons: {
    primary: {
      backgroundColor: '#7C3AED', // Purple
      textColor: '#FFFFFF',
      hoverBackground: '#6D28D9',
      iconColor: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#F3F4F6',
      textColor: '#7C3AED',
      borderColor: '#E5E7EB',
      hoverBackground: '#E5E7EB',
    },
    transcription: {
      backgroundColor: '#FFFFFF',
      iconColor: '#A78BFA',
      hoverBackground: '#8B5CF6',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      heading: ['Inter', 'sans-serif'],
      numbers: ['Inter', 'sans-serif'], // Use same font for numbers in modern theme
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

  branding: {
    logoUrl: undefined,
    iconColor: '#000000',
  },

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
    minimized: {
      playButtonIcon: '#1F2937',
    },
  },

  sheets: {
    backgroundColor: '#FFFFFF',
    handleColor: '#D1D5DB',
    textColor: '#1F2937',
    borderColor: '#E9D5FF',
  },

  status: {
    success: '#10B981', // emerald-500
    error: '#EF4444',   // red-500
    warning: '#F59E0B', // amber-500
    info: '#7C3AED',    // purple-600
  },

  loading: {
    spinnerColor: '#7C3AED',
    backgroundColor: '#FFFFFF',
  },

  inputs: {
    backgroundColor: '#FAF5FF', // purple-50
    textColor: '#1F2937',       // gray-800
    borderColor: '#E9D5FF',     // purple-200
    focusBorderColor: '#7C3AED', // purple-600 (matches primary button)
    placeholderColor: '#9CA3AF', // gray-400
  },

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
      secondary: '#FAF5FF', // purple-50
      tertiary: '#F5F3FF',  // purple-100
    },
  },

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

  shadows: {
    sm: '0 1px 2px 0 rgb(124 58 237 / 0.05)',
    base: '0 1px 3px 0 rgb(124 58 237 / 0.1), 0 1px 2px -1px rgb(124 58 237 / 0.1)',
    md: '0 4px 6px -1px rgb(124 58 237 / 0.1), 0 2px 4px -2px rgb(124 58 237 / 0.1)',
    lg: '0 10px 15px -3px rgb(124 58 237 / 0.1), 0 4px 6px -4px rgb(124 58 237 / 0.1)',
    xl: '0 20px 25px -5px rgb(124 58 237 / 0.1), 0 8px 10px -6px rgb(124 58 237 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(124 58 237 / 0.25)',
  },

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
