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
    timeFontSize: string; // Remaining time display
    timeFontWeight: string;
    hoverBackground?: string; // Button hover background
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
    borderRadius: string; // e.g., "12px"
    shadow: string; // e.g., "0 2px 15px rgba(0, 0, 0, 0.1)"
    titleFontSize: string; // Card title text
    titleFontWeight: string;
    stopTitleFontSize?: string; // Audio stop title (defaults to titleFontSize)
    stopTitleFontWeight?: string;
    durationBadgeFontSize: string; // Duration badge on card images
    numberFontSize: string; // Step number in audio stops
    numberFontWeight: string;
    image: {
      placeholderColor: string;
      durationBadgeBackground: string;
      durationBadgeText: string;
    };
    thumbnail: {
      borderRadius: string; // e.g., "8px"
      size: string;         // e.g., "56px" — width & height of the square thumbnail
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

  // Map Markers — independent from list stepIndicators since map is a visually different context.
  // If omitted, falls back to stepIndicators values.
  mapMarkers?: {
    active: {
      outlineColor: string;
      numberColor: string;
      backgroundColor: string;
      shadow?: string;
    };
    inactive: {
      borderColor: string;
      numberColor: string;
      backgroundColor: string;
      numberFontSize?: string;
      numberFontWeight?: string;
    };
    completed: {
      backgroundColor: string;
      checkmarkColor: string;
    };
    cluster: {
      backgroundColor: string;
      numberColor: string;
      borderColor?: string;
      shadow?: string;
      fontSize?: string;
      fontWeight?: string;
      size?: number;           // Visual diameter in px (default: 64)
      maxClusterRadius?: number; // Pixel radius at which markers cluster (default: 48)
    };
    userLocation?: {
      dotColor: string;
      borderColor?: string;  // Inner dot border (default: '#FFFFFF')
    };
    route?: {
      completedColor?: string;   // color for visited segments
      upcomingColor?: string;    // color for unvisited segments
      weight?: number;           // line width in px
      opacity?: number;          // 0–1
      dashArray?: string;        // SVG dash pattern for upcoming segments
    };
  };

  // Primary Buttons (main action buttons)
  buttons: {
    primary: {
      backgroundColor: string;
      textColor: string;
      hoverBackground?: string;
      iconColor?: string;
      fontSize: string;
      fontWeight: string;
      fontFamily?: string[]; // Optional: defaults to sans if not specified
    };
    secondary: {
      backgroundColor: string;
      textColor: string;
      borderColor?: string;
      hoverBackground?: string;
      fontSize: string;
      fontWeight: string;
      fontFamily?: string[]; // Optional: defaults to sans if not specified
    };
    // Download for offline button (same size as primary, different style)
    download: {
      backgroundColor: string;
      textColor: string;
      borderColor?: string;
      hoverBackground?: string;
      iconColor?: string;
      fontSize: string;
      fontWeight: string;
      fontFamily?: string[]; // Optional: defaults to sans if not specified
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
  };

  // Icons & Logo
  branding: {
    // Custom logo URL (replaces default headphones icon)
    logoUrl?: string;
    // Show border/background around logo (default: true)
    showLogoBorder?: boolean;
    // Logo size: 'fit' constrains to 48x48px, 'original' uses natural size (default: 'fit')
    logoSize?: 'fit' | 'original';
  };

  // Mini Player
  miniPlayer: {
    backgroundColor: string;
    textColor: string;
    titleFontSize: string; // Track title
    titleFontWeight: string;
    transcriptionFontSize: string; // Transcription text
    shadow?: string; // Container shadow
    progressBar: {
      backgroundColor: string;
      highlightColor: string;
    };
    controls: {
      playButtonBackground: string;
      playButtonIcon: string;
      otherButtonsBackground: string;
      otherButtonsIcon: string;
      otherButtonsHoverBackground?: string;
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
    titleFontSize: string; // Sheet title
    titleFontWeight: string;
    backdropColor?: string; // Backdrop overlay color (e.g. 'rgba(0,0,0,0.2)')
    shadow?: string; // Sheet container shadow
  };

  // Status & Feedback Colors
  status: {
    success: string;
    error: string;
    warning: string;
  };

  // Loading States
  loading: {
    spinnerColor: string;
    backgroundColor: string;
    messageFontSize: string; // Loading message text
    messageFontWeight: string;
  };

  // Start Card (Tour start screen)
  startCard: {
    titleFontSize: string; // Main tour title
    titleFontWeight: string;
    titleLineHeight: string; // Line height for multi-line titles
    metaFontSize: string; // Duration, stops count
    metaFontWeight: string;
    metaColor: string; // Meta items color (duration, stops)
    descriptionFontSize: string; // Tour description
    // Offline message box (shown for offline-only tours)
    offlineMessage: {
      backgroundColor: string;
      borderColor: string;
      textColor: string;
    };
    // Overlay controls on the start screen background image/video
    overlay?: {
      buttonBackground?: string;    // Action/language button background
      buttonColor?: string;         // Action/language button icon/text color
      gradientTop?: string;         // Top gradient (e.g. 'rgba(0,0,0,0.3)')
      gradientBottom?: string;      // Bottom gradient (e.g. 'rgba(0,0,0,0.6)')
    };
  };

  // Form Inputs
  inputs: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    focusBorderColor: string;
    placeholderColor: string;
  };

  // Rich Text
  richText: {
    blockquoteBorderColor: string;
    blockquoteBackgroundColor: string;
    linkColor: string;
  };

  // Image Caption / Credit
  imageCaption: {
    textColor: string;
    creditColor: string;
  };

  // Hotspot Pins
  hotspot: {
    pinColor: string;
    pinPulseColor: string;
    pinBorderColor?: string;
    pinShadow?: string;
    popoverBackground?: string;   // Defaults to tooltip.backgroundColor
    popoverBorderColor?: string;  // Defaults to tooltip.borderColor
    popoverShadow?: string;
    popoverTitleColor?: string;   // Defaults to tooltip.textColor
    popoverTextColor?: string;    // Defaults to colors.text.secondary
  };

  // Tooltips
  tooltip: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };

  // Fullscreen Player
  fullscreenPlayer?: {
    artworkBorderRadius?: string;
    artworkShadow?: string;
    adjacentArtworkOpacity?: number;
    infoButton?: {
      backgroundColor?: string;
      iconColor?: string;
      backdropBlur?: string;
    };
    captionOverlay?: {
      backgroundColor?: string;
      borderRadius?: string;
      backdropBlur?: string;
    };
    transcriptionTextOpacity?: number;
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
}

export type ThemeId = string;
