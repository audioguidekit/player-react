import React, { useEffect, useLayoutEffect, useCallback, useMemo, useState, lazy, Suspense } from 'react';
import { useSpring, useTransform } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { TourData } from '../types';
import { StopCardRenderer } from '../components/feed/StopCardRenderer';
import { TourHeader } from '../components/TourHeader';
import { AudioStopCard } from '../components/feed/AudioStopCard';
import { HeadphonesIcon } from '@phosphor-icons/react/dist/csr/Headphones';

const TourMapView = lazy(() =>
  import('../components/TourMapView').then(m => ({ default: m.TourMapView }))
);

const MapLoadingState = styled.div`
  ${tw`flex-1 flex items-center justify-center`}
  background-color: ${({ theme }) => theme.mainContent.backgroundColor};
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 14px;
`;

const Container = styled.div`
  ${tw`flex flex-col h-full relative w-full pb-12`}
  background-color: ${({ theme }) => theme.mainContent.backgroundColor};
`;

const ViewArea = styled.div`
  ${tw`flex-1 relative overflow-hidden`}
  display: flex;
  flex-direction: column;
`;

// The map stays mounted across view switches so Leaflet keeps its state
// (center / zoom / markers); it's hidden — not unmounted — while the list shows.
// visibility:hidden preserves the element's size, so no map.invalidateSize() is
// needed and returning to the map shows it exactly as left, with no re-fit or fade.
const MapLayer = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  visibility: ${({ $active }) => ($active ? 'visible' : 'hidden')};
`;

const ScrollableList = styled.div<{ $compact?: boolean }>`
  ${tw`flex-1 overflow-y-auto overflow-x-hidden px-4 pb-32`}
  padding-top: ${({ $compact }) => $compact ? '0px' : '1.5rem'};
`;

// Content visibility optimization for long lists - defers rendering of off-screen items
const StopItemWrapper = styled.div`
  content-visibility: auto;
  contain-intrinsic-size: 0 120px; /* Approximate height of a stop card */
`;

const Signature = styled.a`
  ${tw`flex items-center justify-center gap-1.5 py-1 mt-2`}
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.tertiary};
  text-decoration: none;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

// Target scrollTop that centers a stop's card in the area above the mini-player.
const computeStopScrollTop = (container: HTMLElement, element: HTMLElement, isFirstStop: boolean): number => {
  if (isFirstStop) return 0;
  const visibleHeight = container.clientHeight - 128; // 128 ≈ bottom padding behind the player
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
  return Math.max(0, relativeTop - visibleHeight / 2 + elementRect.height / 2);
};

interface TourDetailProps {
  tour: TourData;
  currentStopId: string | null;
  isPlaying: boolean;
  onStopClick: (stopId: string) => void;
  onTogglePlay: () => void;
  onStopPlayPause: (stopId: string) => void;
  onBack: () => void;
  hasMultipleTours?: boolean;
  tourProgress: number;
  consumedMinutes: number;
  totalMinutes: number;
  completedStopsCount: number;
  isStopCompleted: (stopId: string) => boolean;
  scrollToStopId?: string | null;
  scrollTrigger?: number | null;
  onScrollComplete?: () => void;
  onOpenRatingSheet?: () => void;
  showMapLocateButton?: boolean;
}

export const TourDetail = React.memo<TourDetailProps>(({
  tour,
  currentStopId,
  isPlaying,
  onStopClick,
  onTogglePlay,
  onStopPlayPause,
  onBack,
  hasMultipleTours,
  tourProgress,
  consumedMinutes,
  totalMinutes,
  completedStopsCount,
  isStopCompleted,
  scrollToStopId,
  scrollTrigger,
  onScrollComplete,
  onOpenRatingSheet,
  showMapLocateButton = true,
}) => {
  // Which views are available. List is on unless explicitly disabled (backward-compatible);
  // map is off unless explicitly enabled.
  const mapEnabled = tour.mapView === true;
  const listEnabled = tour.listView !== false;
  // The toggle only makes sense when both views are available.
  const showViewToggle = mapEnabled && listEnabled;

  // Prefer map when it's enabled (preserves prior behavior); otherwise fall back to list.
  const [viewMode, setViewMode] = useState<'map' | 'list'>(
    mapEnabled ? 'map' : 'list'
  );

  // Slower spring: reduced stiffness from 75 to 35 to match counter
  const progressSpring = useSpring(0, { mass: 0.8, stiffness: 35, damping: 15 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rafIdRef = React.useRef<number | null>(null);
  // Latest currentStopId, read inside the view-switch scroll effect without making it
  // a dep — so that effect fires only on a tab switch, not on every track change
  // (track changes while in the list are handled by the animated scrollTrigger effect).
  const currentStopIdRef = React.useRef(currentStopId);
  currentStopIdRef.current = currentStopId;

  useEffect(() => {
    // Animate to the passed progress value whenever it changes
    progressSpring.set(tourProgress);
  }, [progressSpring, tourProgress]);

  // Handle scrolling to specific stop
  useEffect(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (!scrollToStopId || !containerRef.current) {
      return;
    }

    const elementId = `stop-${scrollToStopId}`;
    const element = document.getElementById(elementId);

    if (!element) {
      onScrollComplete?.();
      return;
    }

    const container = containerRef.current;
    const stopIndex = tour.stops.findIndex(s => s.id === scrollToStopId);
    const targetScrollTop = computeStopScrollTop(container, element, stopIndex === 0);

    const startScrollTop = container.scrollTop;
    const distance = targetScrollTop - startScrollTop;

    if (Math.abs(distance) < 1) {
      onScrollComplete?.();
      return;
    }

    const duration = 400;
    const startTime = performance.now();
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (elapsed < duration) {
        const t = elapsed / duration;
        const easedT = easeOutQuart(t);
        container.scrollTop = startScrollTop + (distance * easedT);
        rafIdRef.current = requestAnimationFrame(animateScroll);
      } else {
        container.scrollTop = targetScrollTop;
        rafIdRef.current = null;
        onScrollComplete?.();
      }
    };

    rafIdRef.current = requestAnimationFrame(animateScroll);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [scrollTrigger]);

  // When switching to the list, jump straight to the active stop so it's in view.
  // The list re-mounts at scrollTop 0 on each switch, and the animated scroll above
  // only fires on scrollTrigger changes — so position it here, without animation.
  useLayoutEffect(() => {
    if (viewMode !== 'list') return;
    const stopId = currentStopIdRef.current;
    if (!stopId) return;
    const container = containerRef.current;
    const element = document.getElementById(`stop-${stopId}`);
    if (!container || !element) return;
    const stopIndex = tour.stops.findIndex(s => s.id === stopId);
    container.scrollTop = computeStopScrollTop(container, element, stopIndex === 0);
  }, [viewMode, tour.stops]);

  const width = useTransform(progressSpring, (value) => `${value}%`);

  // Memoize stop click handler to prevent unnecessary re-renders
  // Use a single handler that accepts stopId to maintain referential equality
  const handleStopClick = useCallback((stopId: string) => {
    onStopClick(stopId);
  }, [onStopClick]);

  return (
    <Container>

      <TourHeader
        onBack={onBack}
        hasMultipleTours={hasMultipleTours}
        progressWidth={width}
        consumedMinutes={consumedMinutes}
        totalMinutes={totalMinutes}
        showProgressBar={tour.showProgressBar}
        showViewToggle={showViewToggle}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <ViewArea>
        {mapEnabled && (
          <MapLayer $active={viewMode === 'map'}>
            <Suspense fallback={<MapLoadingState>Loading map…</MapLoadingState>}>
              <TourMapView
                stops={tour.stops}
                currentStopId={currentStopId}
                isStopCompleted={isStopCompleted}
                onStopClick={handleStopClick}
                mapProvider={tour.mapProvider}
                mapStyle={tour.mapStyle}
                mapApiKey={tour.mapApiKey}
                mapStyleId={tour.mapStyleId}
                mapCenter={tour.mapCenter}
                mapZoom={tour.mapZoom}
                mapMarker={tour.mapMarker}
                mapMarkerIcon={tour.mapMarkerIcon}
                mapCluster={tour.mapCluster}
                mapRoute={tour.mapRoute}
                active={viewMode === 'map'}
                onRequestListView={listEnabled ? () => setViewMode('list') : undefined}
                showLocateButton={showMapLocateButton && tour.mapLocateButton !== false}
              />
            </Suspense>
          </MapLayer>
        )}
        {viewMode === 'list' && (
        // Scrollable List (matches pre-map layout)
        <ScrollableList
          ref={containerRef}
          className="no-scrollbar"
          data-testid="stop-feed"
          $compact={tour.showStopImage !== true}
        >
          {tour.stops
            .filter(stop => !(stop.type === 'rating' && tour.collectFeedback === false))
            .map((stop, index) => {
            // Render audio stops with compact card
            if (stop.type === 'audio') {
              const stopIsPlaying = stop.id === currentStopId && isPlaying;
              return (
                <StopItemWrapper key={stop.id}>
                  <AudioStopCard
                    id={`stop-${stop.id}`}
                    item={stop}
                    index={index}
                    isActive={stop.id === currentStopId}
                    isPlaying={stopIsPlaying}
                    isCompleted={isStopCompleted(stop.id)}
                    onClick={() => handleStopClick(stop.id)}
                    showImage={tour.showStopImage}
                    showDuration={tour.showStopDuration}
                    showNumber={tour.showStopNumber}
                  />
                </StopItemWrapper>
              );
            }

            // Render other content types with StopCardRenderer
            return (
              <StopItemWrapper key={stop.id}>
                <StopCardRenderer
                  item={stop}
                  index={index}
                  showNumber={tour.showStopNumber}
                  onOpenRatingSheet={onOpenRatingSheet}
                  compactLayout={tour.showStopImage !== true}
                />
              </StopItemWrapper>
            );
          })}

          <Signature
            href="https://audioguidekit.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HeadphonesIcon weight="bold" />
            AudioGuideKit · open-source audio player
          </Signature>
        </ScrollableList>
        )}
      </ViewArea>
    </Container>
  );
  }, (prevProps, nextProps) => {
    // CRITICAL: isPlaying changes MUST trigger re-render for animations to stop
    // Return true = skip re-render, Return false = do re-render

    // Always re-render if these critical props change
    if (prevProps.isPlaying !== nextProps.isPlaying) {
      return false;
    }
    if (prevProps.currentStopId !== nextProps.currentStopId) {
      return false;
    }
    if (prevProps.tour.id !== nextProps.tour.id) {
      return false;
    }
    if (prevProps.showMapLocateButton !== nextProps.showMapLocateButton) {
      return false;
    }
    if (prevProps.scrollTrigger !== nextProps.scrollTrigger) {
      return false;
    }

    // Re-render if completed state changes (affects checkmarks)
    if (prevProps.completedStopsCount !== nextProps.completedStopsCount) {
      return false;
    }

    // Skip re-render if only progress/time updates (these animate smoothly via springs)
    if (prevProps.tourProgress !== nextProps.tourProgress) return false;
    if (prevProps.consumedMinutes !== nextProps.consumedMinutes) return false;
    if (prevProps.totalMinutes !== nextProps.totalMinutes) return false;

    // Skip re-render if only scroll target changes (but not trigger)
    if (prevProps.scrollToStopId !== nextProps.scrollToStopId) return false;

    // All relevant props are the same, skip re-render
    // Note: Function props intentionally excluded from comparison
    return true;
  });
