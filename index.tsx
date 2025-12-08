import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './src/routes';
import { swManager } from './src/utils/swManager';
import { ErrorBoundary } from './components/ErrorBoundary';
import './src/index.css';

// Service worker is now registered in index.html for better reliability
// swManager is still used for update handling within the app

// Fix for iOS Safari viewport height issue
// iOS Safari's dynamic browser UI causes 100vh to include the area behind the browser chrome
const setViewportHeight = () => {
  // Use actual innerHeight, with fallback to 100vh if not available
  const height = window.innerHeight || window.visualViewport?.height || document.documentElement.clientHeight || window.screen.height;
  // Ensure we have a valid height (at least 100px)
  if (height > 0) {
    const vh = height * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
};

// Set immediately (synchronously if possible)
setViewportHeight();

// Set on DOM ready if not already set
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setViewportHeight);
} else {
  // DOM already ready, set again to be sure
  setTimeout(setViewportHeight, 0);
}

window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => {
  setTimeout(setViewportHeight, 100);
});
// Also listen to visual viewport changes (iOS Safari)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setViewportHeight);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);