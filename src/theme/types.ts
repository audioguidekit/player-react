/**
 * Theme types for customizable branding
 * Allows complete customization of colors, fonts, icons, and other design decisions
 */

export interface ThemeConfig {
  // Theme metadata
  id: string;
  name: string;
  description?: string;

  // Header Section
  header: {
    backgroundColor: string;
    iconColor: string;
    textColor: string;
    progressBar: {
      backgroundColor: string;
      highlightColor: string;
    };
  };

  // Main Content Background
  mainContent: {
    backgroundColor: string;
  };

  // Cards Configuration
  cards: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    shadowColor: string;
    cornerRadius: string; // e.g., "16px" or "1rem"
    image: {
      placeholderColor: string;
      durationBadgeBackground: string;
      durationBadgeText: string;
    };
  };

  // Step Indicators (for active/current stop)
  stepIndicators: {
    active: {
      outlineColor: string;
      numberColor: string;
      backgroundColor: string;
    };
    inactive: {
      borderColor: string;
      numberColor: string;
      backgroundColor: string;
    };
    completed: {
      backgroundColor: string;
      checkmarkColor: string;
    };
  };

  // Primary Buttons (main action buttons)
  buttons: {
    primary: {
      backgroundColor: string;
      textColor: string;
      hoverBackground?: string;
      iconColor?: string;
    };
    secondary: {
      backgroundColor: string;
      textColor: string;
      borderColor?: string;
      hoverBackground?: string;
    };
    transcription: {
      backgroundColor: string;
      iconColor: string;
      hoverBackground?: string;
    };
  };

  // Typography
  typography: {
    fontFamily: {
      sans: string[]; // e.g., ['Inter', 'sans-serif']
      heading?: string[];
      numbers?: string[]; // For numerical displays (time, duration, progress, etc.)
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };

  // Icons & Logo
  branding: {
    // Custom logo URL (replaces default headphones icon)
    logoUrl?: string;
    // Icon color for general UI icons
    iconColor: string;
  };

  // Mini Player
  miniPlayer: {
    backgroundColor: string;
    textColor: string;
    progressBar: {
      backgroundColor: string;
      highlightColor: string;
    };
    controls: {
      playButtonBackground: string;
      playButtonIcon: string;
      otherButtonsBackground: string;
      otherButtonsIcon: string;
    };
    minimized: {
      playButtonIcon: string;
    };
  };

  // Sheets (Bottom sheets/modals)
  sheets: {
    backgroundColor: string;
    handleColor: string;
    textColor: string;
    borderColor?: string;
  };

  // Status & Feedback Colors
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };

  // Loading States
  loading: {
    spinnerColor: string;
    backgroundColor: string;
  };

  // Form Inputs
  inputs: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    focusBorderColor: string;
    placeholderColor: string;
  };

  // Semantic Colors (for text, borders, etc.)
  colors: {
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    border: {
      light: string;
      medium: string;
      dark: string;
    };
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
  };

  // Border Radius Tokens
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };

  // Shadows
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };

  // Spacing (if you want theme-specific spacing)
  spacing: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    6: string;
    8: string;
    12: string;
    16: string;
  };
}

export type ThemeId = string;
