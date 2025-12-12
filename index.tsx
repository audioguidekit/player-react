import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './src/routes';
import { swManager } from './src/utils/swManager';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ViewportManager } from './components/ViewportManager';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { GlobalStyles } from './src/theme/GlobalStyles';
import { RatingProvider } from './context/RatingContext';
import './src/index.css';

// Service worker is now registered in index.html for better reliability
// swManager is still used for update handling within the app

// Fix for iOS Safari viewport height issue
// iOS Safari's dynamic browser UI causes 100vh to include the area behind the browser chrome
// Initial synchronous setup to prevent layout flash (ViewportManager handles ongoing updates)
const setViewportHeightSync = () => {
  const height = window.innerHeight || window.visualViewport?.height || document.documentElement.clientHeight || window.screen.height;
  if (height > 0) {
    const vh = height * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
};

// Set immediately (synchronously)
setViewportHeightSync();

// Set on DOM ready if not already set
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setViewportHeightSync, { once: true });
} else {
  setTimeout(setViewportHeightSync, 0);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <>
        <GlobalStyles />
        <ErrorBoundary>
          <ViewportManager />
          <RatingProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </RatingProvider>
        </ErrorBoundary>
      </>
    </ThemeProvider>
  </React.StrictMode>
);