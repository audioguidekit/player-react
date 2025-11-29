import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Check } from 'lucide-react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { AudioStop } from '../types';
import { ForwardIcon } from './icons/ForwardIcon';
import { BackwardIcon } from './icons/BackwardIcon';
import { BottomSheet } from './BottomSheet';

interface MiniPlayerProps {
  currentStop: AudioStop | undefined;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onForward: () => void;
  onRewind: () => void;
  onClick: () => void;
  onEnd?: () => void;
  progress?: number;
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  isCompleting?: boolean;
}

const iconVariants = {
  initial: { scale: 0.5, opacity: 0, filter: 'blur(2px)' },
  animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
  exit: { scale: 0.5, opacity: 0, filter: 'blur(2px)' }
};

const iconTransition = { duration: 0.25, ease: 'easeOut' } as const;

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentStop,
  isPlaying,
  onTogglePlay,
  onForward,
  onRewind,
  onClick,
  onEnd,
  progress = 0,
  isExpanded: externalIsExpanded,
  onToggleExpanded,
  isCompleting = false
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
  const controls = useAnimationControls();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Check if title overflows and setup marquee animation
  useEffect(() => {
    // Reset position to start immediately when track changes
    controls.set({ x: 0 });

    if (!titleRef.current || !containerRef.current) return;

    // Wait for next frame to get accurate measurements
    const timeoutId = setTimeout(() => {
      if (!titleRef.current || !containerRef.current) return;

      const titleWidth = titleRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth;
      const overflow = titleWidth - containerWidth;

      // Add a small threshold (2px) to prevent animation when text fits perfectly but has sub-pixel differences
      if (overflow > 2) {
        setShouldAnimate(true);

        // Start animation sequence after 2 seconds
        const startAnimation = async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Infinite loop
          while (true) {
            // Scroll left to reveal full text
            await controls.start({
              x: -overflow - 10,
              transition: {
                duration: overflow / 30, // Speed based on overflow
                ease: "linear"
              }
            });

            // Pause at the end
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Scroll back to start
            await controls.start({
              x: 0,
              transition: {
                duration: overflow / 30,
                ease: "linear"
              }
            });

            // Pause at the start
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        };

        startAnimation();
      } else {
        setShouldAnimate(false);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      controls.stop();
    };
  }, [currentStop?.title, controls]);

  if (!currentStop) return null;

  // Progress ring calculations for the new 64x64 SVG
  const strokeWidth = 2.5;
  const svgSize = 64;
  const radius = 29.25; // (64 - 2.5 - 2.5) / 2 = 29.25
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (visualProgress / 100) * circumference;

  // Minimized bar when collapsed
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="absolute bottom-0 left-0 right-0 z-[60]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-2xl">
          {/* Expandable area - title */}
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center flex-1 min-w-0 cursor-pointer"
          >
            <span className="font-medium text-md text-gray-800 truncate">{currentStop.title}</span>
          </div>

          {/* Play/Pause button - functional */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shrink-0 hover:bg-gray-800 active:scale-95 transition-all relative overflow-hidden"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {isPlaying ? (
                <motion.div
                  key="pause-mini"
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={iconTransition}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Pause size={16} fill="currentColor" />
                </motion.div>
              ) : (
                <motion.div
                  key="play-mini"
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={iconTransition}
                  className="absolute inset-0 flex items-center justify-center pl-0.5"
                >
                  <Play size={16} fill="currentColor" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>
    );
  }

  // Expanded full player
  return (
    <BottomSheet
      isOpen={!!currentStop}
      onClose={() => setIsExpanded(false)}
      showBackdrop={false}
      allowDragClose={false}
    >
      <div className="px-6 pb-6 pt-2" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        {/* Controls Row */}
        <div className="flex items-center justify-center gap-4 mb-1">
          {/* Skip Back Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onRewind(); }}
            className="w-14 h-14 rounded-full text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-95 bg-gray-100"
          >
            <BackwardIcon size={32} className="ml-1 mb-0.5" />
          </button>

          {/* Main Play/Pause Button with Progress Ring */}
          <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
            {/* Progress Ring */}
            <svg className="absolute inset-0 rotate-[-90deg] pointer-events-none" width={64} height={64}>
              <motion.circle
                stroke="#dddddd"
                strokeWidth={3}
                fill="transparent"
                r={29.25}
                cx={32}
                cy={32}
              />
              <motion.circle
                stroke="#2dd482"
                strokeWidth={4}
                fill="transparent"
                r={29.25}
                cx={32}
                cy={32}
                strokeDasharray={radius * 2 * Math.PI}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.1, ease: "linear" }}
                strokeLinecap="round"
              />
            </svg>

            <button
              onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg z-10 overflow-hidden relative ${isCompleting ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {isCompleting ? (
                  <motion.div
                    key="check"
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={iconTransition}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check size={28} strokeWidth={5} />
                  </motion.div>
                ) : isPlaying ? (
                  <motion.div
                    key="pause"
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={iconTransition}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Pause size={24} fill="currentColor" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={iconTransition}
                    className="absolute inset-0 flex items-center justify-center pl-0.5"
                  >
                    <Play size={24} fill="currentColor" className="" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Skip Forward Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onForward(); }}
            className="w-14 h-14 rounded-full text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-95 bg-gray-100"
          >
            <ForwardIcon size={32} className="mr-1 mb-0.5" />
          </button>
        </div>

        {/* Object Name Label */}
        <div className="text-center cursor-pointer" onClick={onClick}>
          <div ref={containerRef} className="overflow-hidden leading-tight">
            <motion.span
              ref={titleRef}
              animate={controls}
              className="font text-lg text-gray-600 whitespace-nowrap inline-block border-b border-dashed border-gray-300 leading-none pb-0.5"
            >
              {currentStop.title}
            </motion.span>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};