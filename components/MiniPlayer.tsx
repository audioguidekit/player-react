import React, { useEffect, useRef, useState } from 'react';
import { SkipBack, SkipForward, X } from 'lucide-react';
import { motion, AnimatePresence, useAnimationControls, useMotionValue, useTransform, PanInfo, useMotionTemplate } from 'framer-motion';
import { AudioStop } from '../types';
import { ForwardIcon } from './icons/ForwardIcon';
import { BackwardIcon } from './icons/BackwardIcon';
import { SkipButton } from './player/SkipButton';
import { PlayPauseButton } from './player/PlayPauseButton';
import { ProgressRing } from './player/ProgressRing';
import { iconVariants, iconTransition } from '../src/animations/variants';

interface MiniPlayerProps {
  currentStop: AudioStop | undefined;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onForward: () => void;
  onRewind: () => void;
  onClick: () => void;
  progress?: number;
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  isCompleting?: boolean;
  isTransitioning?: boolean;
  // Track navigation (for swipe)
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
}


export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentStop,
  isPlaying,
  onTogglePlay,
  onForward,
  onRewind,
  onClick,
  progress = 0,
  isExpanded: externalIsExpanded,
  onToggleExpanded,
  isCompleting = false,
  isTransitioning = false,
  onNextTrack,
  onPrevTrack,
  canGoNext = true,
  canGoPrev = true
}) => {
  // Use external state if provided, otherwise fall back to local state
  const [localIsExpanded, setLocalIsExpanded] = useState(true);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : localIsExpanded;
  const setIsExpanded = onToggleExpanded || setLocalIsExpanded;

  // Use real progress from audio player
  const visualProgress = Math.max(0, Math.min(100, progress || 0));

  // Marquee animation for title
  const titleRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Advanced content transition variants (Blur + Scale + Fade)
  const contentVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  // Button variants without scale (so whileTap can control scale)
  const buttonVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const controls = useAnimationControls();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Unified swipe logic
  const dragX = useMotionValue(0);
  const dragXHandle = useTransform(dragX, (value) => -value);

  // Swipe logic for Next/Prev
  const opacityNext = useTransform(dragX, [-75, -25], [1, 0]);
  const scaleNext = useTransform(dragX, [-75, -25], [1.2, 0.8]);
  const opacityPrev = useTransform(dragX, [25, 75], [0, 1]);
  const scalePrev = useTransform(dragX, [25, 75], [0.8, 1.2]);

  // Shadow only on drag
  const shadowOpacity = useTransform(dragX, [-20, 0, 20], [0.1, 0, 0.1]);
  const boxShadow = useMotionTemplate`0 0 15px rgba(0,0,0,${shadowOpacity})`;

  // Ref to track if we've already vibrated for this drag
  const hasVibratedRef = useRef(false);

  const handleDragStart = () => {
    hasVibratedRef.current = false;
  };

  const handleHorizontalDrag = (_: any, info: PanInfo) => {
    if (hasVibratedRef.current) return;
    const threshold = 50;

    if (info.offset.x < -threshold && !canGoNext) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
        hasVibratedRef.current = true;
      }
    }
    if (info.offset.x > threshold && !canGoPrev) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
        hasVibratedRef.current = true;
      }
    }
  };

  const handleHorizontalDragEnd = (_: any, info: PanInfo) => {
    const swipedLeft = info.offset.x < -75;
    const swipedRight = info.offset.x > 75;

    if (swipedLeft && canGoNext && onNextTrack) {
      onNextTrack();
    } else if (swipedRight && canGoPrev && onPrevTrack) {
      onPrevTrack();
    }
  };

  // Vertical Drag Logic
  const yDrag = useMotionValue(0);
  // Expanded: Drag Down -> Hint Minimize


  const handleVerticalDragEnd = (_: any, info: PanInfo) => {
    if (isExpanded) {
      if (info.offset.y > 50 || info.velocity.y > 300) {
        setIsExpanded(false);
      }
    } else {
      if (info.offset.y < -30 || info.velocity.y < -200) {
        setIsExpanded(true);
      }
    }
  };

  return (
    <motion.div
      layout
      transition={{
        layout: { type: 'spring', damping: 30, stiffness: 400, mass: 0.5 }
      }}
      drag="y"
      dragDirectionLock
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={handleVerticalDragEnd}
      className="absolute bottom-0 left-0 right-0 z-[70] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-[2.5rem] overflow-hidden"
      style={{
        y: yDrag,
        // The container needs to hold space for the minimized player at least
        paddingBottom: 'calc(200px + env(safe-area-inset-bottom, 0px))',
        marginBottom: '-200px',
        // Pointer events through to children
      }}
    >
      {/* 
        PERSISTENT STRUCTURE:
        1. Background Layer (Actions) - Always rendered
        2. Foreground Card (Content) - Always rendered, layout morphs
      */}

      <div className="relative w-full h-full">
        {/* Persistent Background Swipe Actions */}
        <div className="absolute inset-0 bg-gray-100 rounded-t-[2.5rem] flex items-center justify-between px-4 h-full">
          {/* Left Icon (Previous) */}
          <motion.div
            style={{ opacity: opacityPrev, scale: scalePrev }}
            className={`flex items-center ${canGoPrev ? 'text-gray-800' : 'text-gray-400'}`}
          >
            {canGoPrev ? (
              <SkipBack size={28} fill="currentColor" className="opacity-90" />
            ) : (
              <X size={28} className="opacity-40" />
            )}
          </motion.div>

          {/* Right Icon (Next) */}
          <motion.div
            style={{ opacity: opacityNext, scale: scaleNext }}
            className={`flex items-center ${canGoNext ? 'text-gray-800' : 'text-gray-400'}`}
          >
            {canGoNext ? (
              <SkipForward size={28} fill="currentColor" className="opacity-90" />
            ) : (
              <X size={28} className="opacity-40" />
            )}
          </motion.div>
        </div>

        {/* Persistent Foreground Card */}
        <motion.div
          layout
          style={{ x: dragX, boxShadow }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragStart={handleDragStart}
          onDrag={(e, info) => handleHorizontalDrag(e, info)}
          onDragEnd={handleHorizontalDragEnd}
          className={`bg-white relative rounded-t-[2.5rem] overflow-hidden ${isExpanded ? 'w-full h-full' : 'flex items-center justify-between gap-3'
            }`}
        >
          {/* Handle (Visual only, always at top) */}
          <motion.div
            layout="position"
            style={{ x: dragXHandle }}
            className={`absolute top-0 left-0 right-0 flex justify-center pt-3 cursor-grab active:cursor-grabbing touch-none z-30 ${isExpanded ? '' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </motion.div>

          {/* Content Switcher */}
          <AnimatePresence mode="popLayout" initial={false}>
            {isExpanded ? (
              <motion.div
                layout
                key="expanded-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full px-0 origin-center"
              >
                <motion.div
                  className="pt-10 pb-6"
                >
                  {/* Controls Row */}
                  <div className="flex items-center justify-center gap-4 mb-1">
                    <SkipButton direction="backward" onClick={onRewind} seconds={15} className="w-14 h-14">
                      <BackwardIcon size={32} className="ml-1 mb-0.5 text-gray-600" />
                    </SkipButton>

                    <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
                      {!isTransitioning && (
                        <ProgressRing
                          progress={visualProgress}
                          size={64}
                          strokeWidth={3}
                          color="#22BD53"
                          backgroundColor="#dddddd"
                        />
                      )}
                      <PlayPauseButton
                        isPlaying={isPlaying}
                        isCompleting={isCompleting}
                        onClick={onTogglePlay}
                        size="expanded"
                        buttonVariants={buttonVariants}
                      />
                    </div>

                    <SkipButton direction="forward" onClick={onForward} seconds={15} className="w-14 h-14">
                      <ForwardIcon size={32} className="mr-1 mb-0.5 text-gray-600" />
                    </SkipButton>
                  </div>

                  {/* Title */}
                  <div
                    className="text-center cursor-pointer mt-1"
                    onClick={onClick}
                  >
                    <div ref={containerRef} className="overflow-hidden leading-tight px-8">
                      <motion.span
                        ref={titleRef}
                        animate={controls}
                        className="font text-md text-gray-800 whitespace-nowrap inline-block leading-none pb-0.5"
                      >
                        {currentStop.title}
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                layout
                key="minimized-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center flex-1 min-w-0 px-8 py-2 pt-4 gap-3 w-full"
                style={{ height: '80px' }}
              >
                <motion.div className="flex items-center flex-1 min-w-0 gap-3">
                  <div
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="font text-md text-gray-800 truncate">{currentStop.title}</span>
                  </div>

                  <PlayPauseButton
                    isPlaying={isPlaying}
                    onClick={onTogglePlay}
                    size="sm"
                    variant="mini"
                    buttonVariants={buttonVariants}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};