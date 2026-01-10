import React, { useEffect, useCallback, useMemo } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { TourData } from '../types';
import { FeedItemRenderer } from '../components/feed/FeedItemRenderer';
import { TourHeaderAlt } from '../components/TourHeaderAlt';
import { AudioStopCardCompact } from '../components/feed/AudioStopCardCompact';

const Container = styled.div`
  ${tw`flex flex-col h-full relative w-full pb-12`}
  background-color: ${({ theme }) => theme.mainContent.backgroundColor};
  padding-top: env(safe-area-inset-top, 0px);
`;

const ScrollableList = styled(motion.div)`
  ${tw`flex-1 overflow-y-auto overflow-x-hidden px-4 pt-6 pb-32`}
`;

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
  onScrollComplete
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

      <TourHeaderAlt
        onBack={onBack}
        progressWidth={width}
        consumedMinutes={consumedMinutes}
        totalMinutes={totalMinutes}
      />

      {/* Scrollable List */}
      <ScrollableList
        ref={containerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.2, duration: 0.25, type: "spring" }}
        className="no-scrollbar"
      >
        {tour.stops.map((stop, index) => {
          // Render audio stops with compact card
          if (stop.type === 'audio') {
            const stopIsPlaying = stop.id === currentStopId && isPlaying;
            return (
              <AudioStopCardCompact
                key={stop.id}
                id={`stop-${stop.id}`}
                item={stop}
                index={index}
                isActive={stop.id === currentStopId}
                isPlaying={stopIsPlaying}
                isCompleted={isStopCompleted(stop.id)}
                onClick={() => handleStopClick(stop.id)}
              />
            );
          }

          // Render other content types with FeedItemRenderer
          return <FeedItemRenderer key={stop.id} item={stop} />;
        })}
      </ScrollableList>
    </Container>
  );
  }, (prevProps, nextProps) => {
    // Custom comparison: only re-render if relevant props change
    return (
      prevProps.tour.id === nextProps.tour.id &&
      prevProps.currentStopId === nextProps.currentStopId &&
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.tourProgress === nextProps.tourProgress &&
      prevProps.consumedMinutes === nextProps.consumedMinutes &&
      prevProps.totalMinutes === nextProps.totalMinutes &&
      prevProps.completedStopsCount === nextProps.completedStopsCount &&
      prevProps.scrollToStopId === nextProps.scrollToStopId &&
      prevProps.scrollTrigger === nextProps.scrollTrigger &&
      // Compare function references for stability
      prevProps.onStopClick === nextProps.onStopClick &&
      prevProps.onTogglePlay === nextProps.onTogglePlay &&
      prevProps.onStopPlayPause === nextProps.onStopPlayPause &&
      prevProps.onBack === nextProps.onBack &&
      prevProps.isStopCompleted === nextProps.isStopCompleted &&
      prevProps.onScrollComplete === nextProps.onScrollComplete
    );
  });