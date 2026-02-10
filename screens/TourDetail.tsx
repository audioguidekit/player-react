import React, { useEffect, useCallback, useMemo } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { TourData } from '../types';
import { FeedItemRenderer } from '../components/feed/FeedItemRenderer';
import { TourHeader } from '../components/TourHeader';
import { AudioStopCardCompact } from '../components/feed/AudioStopCardCompact';
import { HeadphonesIcon } from '@phosphor-icons/react';

const Container = styled.div`
  ${tw`flex flex-col h-full relative w-full pb-12`}
  background-color: ${({ theme }) => theme.mainContent.backgroundColor};
`;

const ScrollableList = styled(motion.div)`
  ${tw`flex-1 overflow-y-auto overflow-x-hidden px-4 pt-6 pb-32`}
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

// Animation variants hoisted outside component to prevent recreation on each render
const scrollableListAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
} as const;

const scrollableListTransition = {
  delay: 0.2,
  duration: 0.25,
  type: "spring"
} as const;

interface TourDetailProps {
  tour: TourData;
  currentStopId: string | null;
  isPlaying: boolean;
  onStopClick: (stopId: string) => void;
  onTogglePlay: () => void;
  onStopPlayPause: (stopId: string) => void;
  onBack: () => void;
  tourProgress: number;
  consumedMinutes: number;
  totalMinutes: number;
  completedStopsCount: number;
  isStopCompleted: (stopId: string) => boolean;
  scrollToStopId?: string | null;
  scrollTrigger?: number | null;
  onScrollComplete?: () => void;
  onOpenRatingSheet?: () => void;
}

export const TourDetail = React.memo<TourDetailProps>(({
  tour,
  currentStopId,
  isPlaying,
  onStopClick,
  onTogglePlay,
  onStopPlayPause,
  onBack,
  tourProgress,
  consumedMinutes,
  totalMinutes,
  completedStopsCount,
  isStopCompleted,
  scrollToStopId,
  scrollTrigger,
  onScrollComplete,
  onOpenRatingSheet
}) => {
  // Slower spring: reduced stiffness from 75 to 35 to match counter
  const progressSpring = useSpring(0, { mass: 0.8, stiffness: 35, damping: 15 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rafIdRef = React.useRef<number | null>(null);

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
    const isFirstStop = stopIndex === 0;
    
    let targetScrollTop: number;
    
    if (isFirstStop) {
      targetScrollTop = 0;
    } else {
      const containerHeight = container.clientHeight;
      const paddingBottom = 128;
      const visibleHeight = containerHeight - paddingBottom;

      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top + container.scrollTop;

      targetScrollTop = Math.max(0, relativeTop - (visibleHeight / 2) + (elementRect.height / 2));
    }

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
        progressWidth={width}
        consumedMinutes={consumedMinutes}
        totalMinutes={totalMinutes}
      />

      {/* Scrollable List */}
      <ScrollableList
        ref={containerRef}
        {...scrollableListAnimation}
        transition={scrollableListTransition}
        className="no-scrollbar"
      >
        {tour.stops
          .filter(stop => !(stop.type === 'rating' && tour.collectFeedback === false))
          .map((stop, index) => {
          // Render audio stops with compact card
          if (stop.type === 'audio') {
            const stopIsPlaying = stop.id === currentStopId && isPlaying;
            return (
              <StopItemWrapper key={stop.id}>
                <AudioStopCardCompact
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

          // Render other content types with FeedItemRenderer
          return (
            <StopItemWrapper key={stop.id}>
              <FeedItemRenderer item={stop} index={index} showNumber={tour.showStopNumber} onOpenRatingSheet={onOpenRatingSheet} compactLayout={tour.showStopImage !== true} />
            </StopItemWrapper>
          );
        })}

        <Signature
          href="https://github.com/audioguidekit"
          target="_blank"
          rel="noopener noreferrer"
        >
          <HeadphonesIcon weight="bold" />
          AudioGuideKit · open-source audio player
        </Signature>
      </ScrollableList>
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