import { Page, APIRequestContext } from '@playwright/test';

export interface TourMetadata {
  id: string;
  defaultLanguage?: string;
  [key: string]: unknown;
}

export interface TourData {
  id: string;
  language: string;
  title?: string;
  [key: string]: unknown;
}

/**
 * Fetches tour metadata from the app
 */
export async function getTourMetadata(request: APIRequestContext): Promise<TourMetadata | null> {
  try {
    const response = await request.get('/data/tour/metadata.json');
    if (response.ok()) {
      return await response.json();
    }
  } catch {
    // Metadata might not exist
  }
  return null;
}

/**
 * Discovers available tour languages by checking common language codes
 */
export async function discoverTourLanguages(request: APIRequestContext): Promise<string[]> {
  const possibleLanguages = ['en', 'de', 'fr', 'es', 'it', 'cs', 'pl', 'pt', 'nl', 'ja', 'zh', 'ko'];
  const availableLanguages: string[] = [];

  for (const lang of possibleLanguages) {
    try {
      const response = await request.get(`/data/tour/${lang}.json`);
      if (response.ok()) {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          availableLanguages.push(lang);
        }
      }
    } catch {
      // Language file doesn't exist
    }
  }

  return availableLanguages;
}

/**
 * Gets the first available tour language data
 */
export async function getFirstTourData(request: APIRequestContext): Promise<TourData | null> {
  const languages = await discoverTourLanguages(request);

  if (languages.length === 0) {
    return null;
  }

  try {
    const response = await request.get(`/data/tour/${languages[0]}.json`);
    if (response.ok()) {
      return await response.json();
    }
  } catch {
    // Failed to load tour data
  }

  return null;
}

/**
 * Gets the tour ID from metadata or first available tour
 */
export async function getTourId(request: APIRequestContext): Promise<string> {
  const metadata = await getTourMetadata(request);
  if (metadata?.id) {
    return metadata.id;
  }

  const tourData = await getFirstTourData(request);
  if (tourData?.id) {
    return tourData.id;
  }

  // Fallback - most apps will have at least one tour
  return 'tour';
}

/**
 * Waits for the app to finish loading (loading screen to disappear)
 */
export async function waitForAppLoad(page: Page, timeout = 30000): Promise<void> {
  // Common loading indicators to wait for
  const loadingSelectors = [
    'text=Preparing your tour',
    'text=Loading',
    '[data-testid="loading"]',
    '.loading-spinner'
  ];

  for (const selector of loadingSelectors) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: 1000 })) {
        await element.waitFor({ state: 'hidden', timeout });
        return;
      }
    } catch {
      // Selector not found or already hidden
    }
  }

  // Fallback: wait for network idle
  await page.waitForLoadState('networkidle');
}

/**
 * Checks if the app has multiple languages available
 */
export async function hasMultipleLanguages(request: APIRequestContext): Promise<boolean> {
  const languages = await discoverTourLanguages(request);
  return languages.length > 1;
}
