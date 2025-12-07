import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './src/routes';
import { swManager } from './src/utils/swManager';
import { ErrorBoundary } from './components/ErrorBoundary';
import './src/index.css';

// Service worker is now registered in index.html for better reliability
// swManager is still used for update handling within the app


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