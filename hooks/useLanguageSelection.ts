import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Language } from '../types';
import { storageService } from '../src/services/storageService';

export interface UseLanguageSelectionProps {
  languages: Language[] | null;
  selectedLanguage: Language | null;
  setSelectedLanguage: (lang: Language) => void;
}

/**
 * Hook to handle language selection based on:
 * 1. URL parameter (?lang=es) - highest priority, for venue QR codes
 * 2. Saved user preference
 * 3. Browser/device language
 * 4. English fallback
 * 5. First available language
 */
export const useLanguageSelection = ({
  languages,
  selectedLanguage,
  setSelectedLanguage,
}: UseLanguageSelectionProps) => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (languages && languages.length > 0 && !selectedLanguage) {
      let languageToUse: Language | undefined;

      // 1. Check for URL parameter (?lang=es) - highest priority for venue QR codes
      const urlLangCode = searchParams.get('lang');
      if (urlLangCode) {
        languageToUse = languages.find(l => l.code === urlLangCode.toLowerCase());
        if (languageToUse) {
          console.log(`[LANGUAGE] Using URL parameter: ${urlLangCode}`);
          // Save to preferences so it persists during the session
          storageService.setPreferences({ selectedLanguage: languageToUse.code });
        } else {
          console.warn(`[LANGUAGE] URL parameter '${urlLangCode}' not available, falling back`);
        }
      }

      // 2. Check for saved user preference (user explicitly chose a language)
      if (!languageToUse) {
        const preferences = storageService.getPreferences();
        const savedLanguageCode = preferences.selectedLanguage;

        if (savedLanguageCode) {
          languageToUse = languages.find(l => l.code === savedLanguageCode);
        }
      }

      // 3. If no saved preference, detect browser/device language
      if (!languageToUse) {
        const browserLanguage = navigator.language || navigator.languages?.[0];
        if (browserLanguage) {
          // Extract language code (e.g., "cs-CZ" -> "cs", "en-US" -> "en")
          const browserLangCode = browserLanguage.split('-')[0].toLowerCase();
          languageToUse = languages.find(l => l.code === browserLangCode);

          if (languageToUse) {
            console.log(`[LANGUAGE] Detected browser language: ${browserLanguage}, using: ${languageToUse.code}`);
          }
        }
      }

      // 4. Fall back to English
      if (!languageToUse) {
        languageToUse = languages.find(l => l.code === 'en');
      }

      // 5. Fall back to first available language
      if (!languageToUse) {
        languageToUse = languages[0];
      }

      setSelectedLanguage(languageToUse);
    }
  }, [languages, selectedLanguage, setSelectedLanguage, searchParams]);
};
