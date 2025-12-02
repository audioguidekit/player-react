import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './src/routes';
import { swManager } from './src/utils/swManager';
import './src/index.css';

// Register service worker first (production only)
// This ensures SW is active before fetching external dependencies
if (import.meta.env.PROD) {
  swManager.register().catch((error) => {
    console.error('Service Worker registration failed:', error);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
);