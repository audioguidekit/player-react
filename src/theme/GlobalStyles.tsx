import { createGlobalStyle } from 'styled-components';
import { ExtendedTheme } from './ThemeProvider';

export const GlobalStyles = createGlobalStyle<{ theme?: ExtendedTheme }>`
  :root {
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
  }

  html {
    width: 100%;
    height: 100%;
  }

  /* iOS Safari fix */
  @supports (-webkit-touch-callout: none) {
    html {
      height: -webkit-fill-available;
    }

    body {
      min-height: -webkit-fill-available;
    }

    #root {
      min-height: -webkit-fill-available;
    }
  }

  body {
    margin: 0;
    padding: 0;
    /* iOS PWA safe area - pad content below status bar */
    padding-top: var(--safe-top);
    padding-bottom: var(--safe-bottom);
    width: 100%;
    font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ') || 'Inter, sans-serif'} !important;
    background-color: ${({ theme }) => theme?.colors?.background?.primary || '#FFFFFF'};
    color: ${({ theme }) => theme?.colors?.text?.primary || '#111827'};
    overscroll-behavior: none;
    /* Use dvh for dynamic viewport height on iOS */
    height: 100dvh;
    height: ${({ theme }) => theme?.platform?.viewport?.height || '100dvh'};
  }

  /* Apply heading font from theme to all heading elements */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) =>
      theme?.typography?.fontFamily?.heading
        ? theme.typography.fontFamily.heading.join(', ')
        : theme?.typography?.fontFamily?.sans?.join(', ') || 'Inter, sans-serif'
    } !important;
  }

  #root {
    width: 100%;
    height: 100dvh;
    height: ${({ theme }) => theme?.platform?.viewport?.height || '100dvh'};
  }

  /* Custom focus outline - uses theme border color instead of browser default blue */
  *:focus {
    outline: none;
  }

  *:focus-visible {
    outline: 2px solid ${({ theme }) => theme?.colors?.border?.dark || '#CCCCCC'};
    outline-offset: 2px;
  }

  /* Audio playing loader animation - uses duration badge text color */
  .audio-playing-loader {
    width: 3px;
    height: 16px;
    border-radius: 3px;
    display: inline-block;
    position: relative;
    background: currentColor;
    color: ${({ theme }) => theme?.cards?.image?.durationBadgeText || '#FFFFFF'};
    box-sizing: border-box;
    animation: animloader 0.3s 0.3s linear infinite alternate;
  }

  .audio-playing-loader::after,
  .audio-playing-loader::before {
    content: '';
    width: 3px;
    height: 16px;
    border-radius: 3px;
    background: currentColor;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 7px;
    box-sizing: border-box;
    animation: animloader 0.3s 0.45s linear infinite alternate;
  }

  .audio-playing-loader::before {
    left: -7px;
    animation-delay: 0s;
  }

  @keyframes animloader {
    0% {
      height: 16px;
    }

    100% {
      height: 8px;
    }
  }

  /* Smooth spin animation for audio spinner - Safari optimized */
  @keyframes spin-smooth {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .audio-spinner-ring {
    animation: spin-smooth 1.5s linear infinite;
    transform-origin: center;
  }
`;
