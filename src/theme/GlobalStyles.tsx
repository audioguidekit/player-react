import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
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
    width: 100%;
    font-family: ${({ theme }) => theme.typography.fontFamily.sans.join(', ')};
    background-color: ${({ theme }) => theme.colors.white};
    overscroll-behavior: none;
    height: ${({ theme }) => theme.platform.viewport.height};
  }

  #root {
    width: 100%;
    height: ${({ theme }) => theme.platform.viewport.height};
  }

  /* Audio playing loader animation */
  .audio-playing-loader {
    width: 3px;
    height: 16px;
    border-radius: 3px;
    display: inline-block;
    position: relative;
    background: currentColor;
    color: #FFF;
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
