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
  /** True once the sheet has been opened — gates mounting the map (see mapReady). */
  sheetExpanded?: boolean;
}

// TourHeader needs tourProgress/consumedMinutes/totalMinutes fresh on every
// audio tick to keep the progress bar and countdown animating (they feed a
// spring/counter via effects that only run when this component actually
// re-renders with a new value — there's no other way for them to update).
// The stop list + map below are expensive and don't need to re-render on
// those ticks, so they're split into TourDetailBody, memoized separately with
// a comparator that ignores exactly those three props. Splitting the memo
// boundary here (instead of trying to skip re-rendering everything, header
// included) avoids the risk of freezing the header's own animations —
// see docs/multi-tour.md's history / DEVLOG for why a naive "skip whenever
// progress-only props change" comparator on the whole component would break.
export const TourDetail: React.FC<TourDetailProps> = ({
  tour,
  currentStopId,
  isPlaying,
  onStopClick,
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
  sheetExpanded = false,
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
  useEffect(() => {
    // Animate to the passed progress value whenever it changes
    progressSpring.set(tourProgress);
  }, [progressSpring, tourProgress]);
  const width = useTransform(progressSpring, (value) => `${value}%`);

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

      <TourDetailBody
        tour={tour}
        currentStopId={currentStopId}
        isPlaying={isPlaying}
        onStopClick={onStopClick}
        isStopCompleted={isStopCompleted}
        completedStopsCount={completedStopsCount}
        scrollToStopId={scrollToStopId}
        scrollTrigger={scrollTrigger}
        onScrollComplete={onScrollComplete}
        onOpenRatingSheet={onOpenRatingSheet}
        showMapLocateButton={showMapLocateButton}
        sheetExpanded={sheetExpanded}
        mapEnabled={mapEnabled}
        listEnabled={listEnabled}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    </Container>
  );
};

interface TourDetailBodyProps {
  tour: TourData;
  currentStopId: string | null;
  isPlaying: boolean;
  onStopClick: (stopId: string) => void;
  isStopCompleted: (stopId: string) => boolean;
  completedStopsCount: number;
  scrollToStopId?: string | null;
  scrollTrigger?: number | null;
  onScrollComplete?: () => void;
  onOpenRatingSheet?: () => void;
  showMapLocateButton: boolean;
  sheetExpanded: boolean;
  mapEnabled: boolean;
  listEnabled: boolean;
  viewMode: 'map' | 'list';
  setViewMode: (mode: 'map' | 'list') => void;
}

/** The map + stop list — the expensive part of the tour detail screen. */
const TourDetailBody = React.memo<TourDetailBodyProps>(({
  tour,
  currentStopId,
  isPlaying,
  onStopClick,
  isStopCompleted,
  scrollToStopId,
  scrollTrigger,
  onScrollComplete,
  onOpenRatingSheet,
  showMapLocateButton,
  sheetExpanded,
  mapEnabled,
  listEnabled,
  viewMode,
  setViewMode,
}) => {
  // Mount the map only once the sheet has actually been opened, then keep it
  // mounted. A WebGL/canvas map behind the collapsed start card promotes the
  // whole sheet to a composited layer, which drops subpixel antialiasing and
  // makes the start card's text render visibly softer than on a map-less tour.
  // It also avoids fetching tiles for a map nobody has looked at yet.
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => {
    if (sheetExpanded) setMapReady(true);
  }, [sheetExpanded]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const rafIdRef = React.useRef<number | null>(null);
  // Latest currentStopId, read inside the view-switch scroll effect without making it
  // a dep — so that effect fires only on a tab switch, not on every track change
  // (track changes while in the list are handled by the animated scrollTrigger effect).
  const currentStopIdRef = React.useRef(currentStopId);
  currentStopIdRef.current = currentStopId;

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

  // Memoize stop click handler to prevent unnecessary re-renders
  // Use a single handler that accepts stopId to maintain referential equality
  const handleStopClick = useCallback((stopId: string) => {
    onStopClick(stopId);
  }, [onStopClick]);

  return (
    <ViewArea>
      {mapEnabled && mapReady && (
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
              mapMarkerColors={tour.mapMarkerColors}
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
  );
}, (prevProps, nextProps) => {
  // Return true = skip re-render, Return false = do re-render.
  // tourProgress/consumedMinutes/totalMinutes aren't props here at all — that
  // churn stays up in TourDetail, driving only the header.
  if (prevProps.isPlaying !== nextProps.isPlaying) return false;
  if (prevProps.currentStopId !== nextProps.currentStopId) return false;
  if (prevProps.tour.id !== nextProps.tour.id) return false;
  if (prevProps.showMapLocateButton !== nextProps.showMapLocateButton) return false;
  if (prevProps.sheetExpanded !== nextProps.sheetExpanded) return false;
  if (prevProps.scrollTrigger !== nextProps.scrollTrigger) return false;
  if (prevProps.viewMode !== nextProps.viewMode) return false;

  // Re-render if completed state changes (affects checkmarks)
  if (prevProps.completedStopsCount !== nextProps.completedStopsCount) return false;

  // Skip re-render if only scroll target changes (but not trigger): App.tsx's
  // handleTrackChange always bumps scrollTrigger in the same update as
  // scrollToStopId, so a real scroll request is never missed by ignoring this.
  // (prevProps.scrollToStopId !== nextProps.scrollToStopId intentionally not checked)

  // All relevant props are the same, skip re-render
  // Note: Function props (other than isStopCompleted's completedStopsCount
  // proxy) and setViewMode/listEnabled/mapEnabled/onScrollComplete/
  // onOpenRatingSheet/onStopClick are intentionally excluded from comparison.
  return true;
});
