import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ViewportManager } from '../components/ViewportManager';
import { RatingProvider } from '../context/RatingContext';
import { getAppConfig } from './services/tourDiscovery';
import { initAnalytics } from './analytics';

// Module scope on purpose: this file loads after the data is installed, and the
// children's first effects (tour_open) run before any effect of this component.
initAnalytics(getAppConfig());

/**
 * The app proper. Loaded with a dynamic import AFTER the data is installed
 * (see index.tsx): the modules below derive state from the data when they load.
 */
export const AppRoot: React.FC = () => (
  <ErrorBoundary>
    <ViewportManager />
    <RatingProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </RatingProvider>
  </ErrorBoundary>
);
