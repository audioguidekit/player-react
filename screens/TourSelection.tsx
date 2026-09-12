import React, { useMemo, useState, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { GB, CZ, DE, FR, IT, ES } from 'country-flag-icons/react/3x2';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import tw from 'twin.macro';
import styled from 'styled-components';
import { Language } from '../types';
import { MobileFrame } from '../components/shared/MobileFrame';
import { TourSelectionCard } from '../components/TourSelectionCard';
import { SplashScreen } from '../components/SplashScreen';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { GlobalStyles } from '../src/theme/GlobalStyles';
import { TranslationProvider, useTranslation } from '../src/translations';
import { LoadingScreen } from '../src/components/screens/LoadingScreen';
import { useLanguages } from '../hooks/useDataLoader';
import { useLanguageSelection } from '../hooks/useLanguageSelection';
import { getAllTours, getAppConfig, getAvailableTourIds, getTourWithFallback } from '../src/services/tourDiscovery';
import { defaultLanguage } from '../src/config/languages';
import { storageService } from '../src/services/storageService';
import { useHaptics } from '../src/hooks/useHaptics';

const LanguageSheet = lazy(() =>
  import('../components/sheets/LanguageSheet').then(m => ({ default: m.LanguageSheet }))
);

const flagComponents: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  GB, CZ, DE, FR, IT, ES,
};

const Screen = styled.div`
  ${tw`relative w-full h-full flex flex-col overflow-hidden`}
  background-color: ${({ theme }) => theme.mainContent.backgroundColor};
`;

const Header = styled.div`
  ${tw`relative flex items-start justify-between gap-3 px-5 pb-4`}
  z-index: 1;
  padding-top: calc(env(safe-area-inset-top, 0px) + 1.25rem);
`;

const Logo = styled.img<{ $clickable?: boolean }>`
  ${tw`block mb-3`}
  height: 32px;
  width: auto;
  object-fit: contain;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
`;

// Full-screen backdrop behind all content (lowest layer). pointer-events:none
// so it never intercepts taps meant for the cards above it.
const Hero = styled.img`
  ${tw`absolute inset-0 w-full h-full pointer-events-none`}
  object-fit: cover;
  z-index: 0;
`;

const TitleBlock = styled.div`
  ${tw`flex-1 min-w-0`}
`;

const Title = styled.h1`
  ${tw`tracking-tight`}
  font-family: ${({ theme }) =>
    theme?.typography?.fontFamily?.heading?.join(', ') ||
    theme?.typography?.fontFamily?.sans?.join(', ')};
  font-size: ${({ theme }) => theme.startCard.titleFontSize};
  font-weight: ${({ theme }) => theme.startCard.titleFontWeight};
  line-height: ${({ theme }) => theme.startCard.titleLineHeight};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Subtitle = styled.p`
  ${tw`mt-1`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  font-size: ${({ theme }) => theme.startCard.descriptionFontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LanguageButton = styled.button`
  ${tw`shrink-0 rounded-full flex items-center gap-2 transition-all active:scale-95`}
  height: 44px;
  padding: 0 12px;
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const LanguageFlag = styled.div`
  ${tw`flex items-center justify-center`}
  width: 28px;
  height: 19px;
  border-radius: 6px;
  overflow: hidden;

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

const ScrollArea = styled.div`
  ${tw`relative flex-1 overflow-y-auto px-5 pt-1`}
  z-index: 1;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 2rem);
`;

const List = styled.div`
  ${tw`flex flex-col gap-4`}
`;

/**
 * Keeps the picker's status-bar color (the theme header color) re-asserted while
 * the list is the active route. The picker stays mounted under the push/pop
 * stack, so a tour overwrites `theme-color` and a plain mount-only sync would
 * leave the tour's color on return. Gated on the route and placed before
 * <Screen> so the splash's own override still wins while the splash is shown.
 */
const PickerStatusBar: React.FC = () => {
  const location = useLocation();
  const { currentTheme } = useTheme();
  const isPickerActive = !location.pathname.startsWith('/tour/');

  React.useEffect(() => {
    if (!isPickerActive) return;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', currentTheme.header.backgroundColor);
  }, [isPickerActive, currentTheme.header.backgroundColor]);

  return null;
};

interface TourSelectionContentProps {
  languages: Language[];
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  frameless?: boolean;
}

const TourSelectionContent: React.FC<TourSelectionContentProps> = ({
  languages,
  selectedLanguage,
  onSelectLanguage,
  frameless = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const triggerHaptic = useHaptics();
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  // Branding splash shown once over the picker (until tapped). Stays dismissed
  // on push/pop back since this screen remains mounted.
  const [splashDismissed, setSplashDismissed] = useState(false);
  // First appearance is instant; re-opening via the logo slides in from the left
  // (the reverse of the slide-left dismiss).
  const splashReopenedRef = React.useRef(false);

  const tours = useMemo(() => getAllTours(selectedLanguage.code), [selectedLanguage.code]);

  // App-level landing config; localized strings fall back to the built-in translations.
  const appConfig = getAppConfig();
  const title = appConfig.title?.[selectedLanguage.code] ?? t.tourSelection.title;
  const subtitle = appConfig.subtitle?.[selectedLanguage.code] ?? t.tourSelection.subtitle;

  const FlagIcon = flagComponents[selectedLanguage.countryCode] || GB;

  const handleSelectTour = (tourId: string) => {
    navigate(`/tour/${tourId}?lang=${selectedLanguage.code}`);
  };

  // Inside the push/pop stack the device frame is shared (owned by RootNavigator).
  const Frame = frameless ? React.Fragment : MobileFrame;

  return (
    <Frame>
      {/* Picker uses the theme header color for the status bar (re-asserted on
          return from a tour); the splash overrides it with app.json
          statusBarColor while shown (see SplashScreen). */}
      <PickerStatusBar />
      <Screen>
        {appConfig.hero && <Hero src={appConfig.hero} alt="" />}
        <Header>
          <TitleBlock>
            {appConfig.logo && (
              <Logo
                src={appConfig.logo}
                alt=""
                $clickable={!!appConfig.splash}
                onClick={
                  appConfig.splash
                    ? () => {
                        triggerHaptic();
                        splashReopenedRef.current = true;
                        setSplashDismissed(false);
                      }
                    : undefined
                }
              />
            )}
            <Title>{title}</Title>
            <Subtitle>{subtitle}</Subtitle>
          </TitleBlock>
          {languages.length > 1 && (
            <LanguageButton
              onClick={() => {
                triggerHaptic();
                setIsLanguageSheetOpen(true);
              }}
            >
              <LanguageFlag>
                <FlagIcon />
              </LanguageFlag>
              <CaretDownIcon size={14} weight="bold" />
            </LanguageButton>
          )}
        </Header>

        <ScrollArea className="no-scrollbar">
          <List>
            {tours.map(tour => (
              <TourSelectionCard
                key={tour.id}
                tour={tour}
                onClick={() => handleSelectTour(tour.id)}
              />
            ))}
          </List>
        </ScrollArea>

        <AnimatePresence>
          {appConfig.splash && !splashDismissed && (
            <SplashScreen
              key="splash"
              media={appConfig.splash}
              statusBarColor={appConfig.statusBarColor}
              arrowColor={appConfig.splashArrowColor}
              slideIn={splashReopenedRef.current}
              onDismiss={() => {
                triggerHaptic();
                setSplashDismissed(true);
              }}
            />
          )}
        </AnimatePresence>
      </Screen>

      <Suspense fallback={null}>
        <LanguageSheet
          isOpen={isLanguageSheetOpen}
          onClose={() => setIsLanguageSheetOpen(false)}
          selectedLanguage={selectedLanguage}
          languages={languages}
          onSelect={lang => {
            onSelectLanguage(lang);
            setIsLanguageSheetOpen(false);
          }}
        />
      </Suspense>
    </Frame>
  );
};

/**
 * Tour selection landing screen.
 *
 * Lists every tour discovered in src/data/tour/ as a card. Selecting a card
 * routes to /tour/:tourId (the existing single-tour experience). When only one
 * tour exists the screen is skipped entirely and we redirect straight into it,
 * preserving the original single-tour behavior.
 */
export const TourSelection: React.FC<{ frameless?: boolean }> = ({ frameless = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: languages, loading } = useLanguages();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  useLanguageSelection({ languages, selectedLanguage, setSelectedLanguage });

  const tourIds = getAvailableTourIds();
  const lang = selectedLanguage?.code || defaultLanguage;
  const firstTourId = tourIds[0];
  // Prefer the app-level theme; otherwise borrow the first tour's (only that tour
  // is needed, not all of them).
  const themeId = useMemo(
    () =>
      getAppConfig().themeId ||
      getTourWithFallback(firstTourId, lang)?.themeId ||
      'default-light',
    [firstTourId, lang]
  );

  const handleSelectLanguage = (language: Language) => {
    storageService.setPreferences({ selectedLanguage: language.code });
    setSelectedLanguage(language);
  };

  // Single-tour deployments skip the picker and open the tour directly.
  // Only redirect when we're actually sitting on the picker path ("/"): this
  // component doubles as RootNavigator's always-mounted base layer, so it keeps
  // rendering underneath an already-open tour (including a deep link straight to
  // /tour/:tourId/:stopId). Redirecting unconditionally there would stomp the
  // stop id right back off the URL.
  if (tourIds.length <= 1) {
    if (location.pathname.startsWith('/tour/')) return null;
    return <RedirectToTour tourId={tourIds[0]} navigate={navigate} />;
  }

  if (loading || !languages || !selectedLanguage) {
    return (
      <ThemeProvider themeId={themeId}>
        <GlobalStyles />
        <TranslationProvider language={lang}>
          <LoadingScreen />
        </TranslationProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider themeId={themeId}>
      <GlobalStyles />
      <TranslationProvider language={selectedLanguage.code}>
        <TourSelectionContent
          languages={languages}
          selectedLanguage={selectedLanguage}
          frameless={frameless}
          onSelectLanguage={handleSelectLanguage}
        />
      </TranslationProvider>
    </ThemeProvider>
  );
};

// Tiny helper so the redirect runs as an effect (avoids navigating during render).
const RedirectToTour: React.FC<{ tourId?: string; navigate: ReturnType<typeof useNavigate> }> = ({
  tourId,
  navigate,
}) => {
  // Run the redirect exactly once. `navigate` is not referentially stable across
  // route changes (react-router hands out a new function on every navigation),
  // so depending on it directly would re-fire this effect — and re-issue the
  // redirect, stomping the URL back to the bare tour path — every time anything
  // else navigates (e.g. useStopUrlSync adding a stop id to the URL). Since
  // TourSelection stays mounted as RootNavigator's base layer even while a tour
  // is open, that turned into an infinite redirect/re-sync loop as soon as any
  // stop started playing in a single-tour deployment.
  const hasRedirectedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    navigate(`/tour/${tourId ?? ''}`, { replace: true });
  }, [tourId, navigate]);
  return null;
};
