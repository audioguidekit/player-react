/**
 * Default theme configuration
 * This is the base theme that matches the original application design
 */

import { ThemeConfig } from '../types';

export const defaultTheme: ThemeConfig = {
  id: 'default',
  name: 'Default',
  description: 'Original application design',

  header: {
    backgroundColor: '#FD8686', // Coral/salmon color
    iconColor: '#E1F000', // Yellow-green
    textColor: '#374151', // Dark gray
    progressBar: {
      backgroundColor: '#E5E7EB', // Light gray
      highlightColor: '#22C55E', // Green
    },
  },

  mainContent: {
    backgroundColor: '#AFC1E4', // Light blue
  },

  cards: {
    backgroundColor: '#FFFFFF',
    textColor: '#171717', // Near black
    borderColor: '#F3F4F6',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    cornerRadius: '16px',
    image: {
      placeholderColor: '#E5E7EB',
      durationBadgeBackground: 'rgba(0, 0, 0, 0.4)',
      durationBadgeText: '#FFFFFF',
    },
  },

  stepIndicators: {
    active: {
      outlineColor: '#57BC7C', // Green outline
      numberColor: '#4F8764', // Dark green
      backgroundColor: '#FFFFFF',
    },
    inactive: {
      borderColor: '#CBCBCB', // Light gray border
      numberColor: '#111827', // Dark gray
      backgroundColor: '#FFFFFF',
    },
    completed: {
      backgroundColor: '#22C55E', // Green
      checkmarkColor: '#FFFFFF',
    },
  },

  buttons: {
    primary: {
      backgroundColor: '#FF0000', // Red
      textColor: '#FFFFFF',
      hoverBackground: '#E60000',
      iconColor: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#F3F4F6',
      textColor: '#111827',
      borderColor: '#E5E7EB',
      hoverBackground: '#E5E7EB',
    },
    transcription: {
      backgroundColor: '#FFFFFF',
      iconColor: '#5B96C2',
      hoverBackground: '#4A85B1',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      heading: ['Inter', 'sans-serif'],
      numbers: ['Inter', 'sans-serif'], // Use same font for numbers in default theme
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  branding: {
    logoUrl: undefined, // No custom logo by default
    iconColor: '#000000',
  },

  miniPlayer: {
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    progressBar: {
      backgroundColor: '#E5E7EB',
      highlightColor: '#22C55E',
    },
    controls: {
      playButtonBackground: '#FF0000', // Red
      playButtonIcon: '#FFFFFF',
      otherButtonsBackground: '#5B96C2', // Blue
      otherButtonsIcon: '#FFFFFF',
    },
    minimized: {
      playButtonIcon: '#111827',
    },
  },

  sheets: {
    backgroundColor: '#FFFFFF',
    handleColor: '#D1D5DB',
    textColor: '#111827',
    borderColor: '#E5E7EB',
  },

  status: {
    success: '#22C55E', // green-500
    error: '#DC2626',   // red-600
    warning: '#F59E0B', // amber-500
    info: '#3B82F6',    // blue-500
  },

  loading: {
    spinnerColor: '#18181B', // zinc-900
    backgroundColor: '#FFFFFF',
  },

  inputs: {
    backgroundColor: '#F9FAFB', // gray-50
    textColor: '#111827',       // gray-900
    borderColor: '#E5E7EB',     // gray-200
    focusBorderColor: '#3B82F6', // blue-500
    placeholderColor: '#9CA3AF', // gray-400
  },

  colors: {
    text: {
      primary: '#111827',   // gray-900
      secondary: '#6B7280', // gray-500
      tertiary: '#9CA3AF',  // gray-400
      inverse: '#FFFFFF',
    },
    border: {
      light: '#F3F4F6',   // gray-100
      medium: '#E5E7EB',  // gray-200
      dark: '#D1D5DB',    // gray-300
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB', // gray-50
      tertiary: '#F3F4F6',  // gray-100
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
  },
};
