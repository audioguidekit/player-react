import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { TourData } from '../types';
import { FeedItemRenderer } from '../components/feed/FeedItemRenderer';
import { TourHeaderAlt } from '../components/TourHeaderAlt';
import { AudioStopCardCompact } from '../components/feed/AudioStopCardCompact';

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
  onScrollComplete?: () => void;
}

export const TourDetail: React.FC<TourDetailProps> = ({
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
  onScrollComplete
}) => {
  // Slower spring: reduced stiffness from 75 to 35 to match counter
  const progressSpring = useSpring(0, { mass: 0.8, stiffness: 35, damping: 15 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lastScrolledIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Animate to the passed progress value whenever it changes
    progressSpring.set(tourProgress);
  }, [progressSpring, tourProgress]);

  // Handle scrolling to specific stop
  useEffect(() => {
    if (scrollToStopId && containerRef.current && scrollToStopId !== lastScrolledIdRef.current) {
      lastScrolledIdRef.current = scrollToStopId;
      const element = document.getElementById(`stop-${scrollToStopId}`);
      if (element) {
        // Calculate scroll position to center the element in the VISIBLE area
        // The container has pb-32 (128px) padding at the bottom which we should exclude from "center"
        const container = containerRef.current;
        const containerHeight = container.clientHeight;
        const paddingBottom = 128; // pb-32
        const visibleHeight = containerHeight - paddingBottom;

        // Get element position relative to container
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + container.scrollTop;

        // Calculate target scroll top
        // We want the element center to be at the visible area center
        const targetScrollTop = Math.max(0, relativeTop - (visibleHeight / 2) + (elementRect.height / 2));

        // Custom smooth scroll implementation using requestAnimationFrame
        const startScrollTop = container.scrollTop;
        const distance = targetScrollTop - startScrollTop;
        const duration = 800; // 800ms
        const startTime = performance.now();

        // Ease In Out Cubic function - slower at the ends
        const easeInOutCubic = (t: number) => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };

        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;

          if (elapsed < duration) {
            const t = elapsed / duration;
            const easedT = easeInOutCubic(t);
            container.scrollTop = startScrollTop + (distance * easedT);
            requestAnimationFrame(animateScroll);
          } else {
            container.scrollTop = targetScrollTop;
            onScrollComplete?.();
            lastScrolledIdRef.current = null;
          }
        };

        requestAnimationFrame(animateScroll);
      }
    }
  }, [scrollToStopId, onScrollComplete]);

  const width = useTransform(progressSpring, (value) => `${value}%`);

  return (
    <div className="flex flex-col h-full relative w-full bg-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>

      <TourHeaderAlt
        onBack={onBack}
        progressWidth={width}
        consumedMinutes={consumedMinutes}
        totalMinutes={totalMinutes}
      />

      {/* Scrollable List */}
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.2, duration: 0.25, type: "spring" }}
        className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-32 no-scrollbar"
      >
        {tour.stops.map((stop, index) => {
          // Render audio stops with compact card
          if (stop.type === 'audio') {
            return (
              <AudioStopCardCompact
                key={stop.id}
                id={`stop-${stop.id}`}
                item={stop}
                index={index}
                isActive={stop.id === currentStopId}
                isPlaying={stop.id === currentStopId && isPlaying}
                isCompleted={isStopCompleted(stop.id)}
                onClick={() => onStopClick(stop.id)}
              />
            );
          }

          // Render other content types with FeedItemRenderer
          return <FeedItemRenderer key={stop.id} item={stop} />;
        })}
      </motion.div>
    </div>
  );
};