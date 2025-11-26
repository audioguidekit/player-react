import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useAnimationControls } from 'framer-motion';
import { AudioStop } from '../types';
import { ForwardIcon } from './icons/ForwardIcon';
import { BackwardIcon } from './icons/BackwardIcon';

interface MiniPlayerProps {
  currentStop: AudioStop | undefined;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onForward: () => void;
  onRewind: () => void;
  onClick: () => void;
  onEnd?: () => void;
  progress?: number;
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
  progress = 0
}) => {
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

      if (overflow > 0) {
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

  const strokeWidth = 2.5;
  const size = 46;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (visualProgress / 100) * circumference;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="absolute bottom-6 left-4 right-4 z-[60]"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 pl-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-between gap-3">
        
        {/* Info Section - Clickable to open full player */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0 shadow-sm">
               <img src={currentStop.image} alt="" className="w-full h-full object-cover" />
             </div>
             <div className="overflow-hidden flex-1">
                {/* Increased title to text-base for better legibility */}
                <div ref={containerRef} className="overflow-hidden leading-tight">
                  <motion.span
                    ref={titleRef}
                    animate={controls}
                    className="font-bold text-base text-gray-900 whitespace-nowrap inline-block"
                  >
                    {currentStop.title}
                  </motion.span>
                </div>
                {/* Increased subtitle to text-sm */}
                <p className="text-sm font-medium truncate mt-0.5 flex items-center overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isPlaying && (
                      <motion.span
                        key="playing-text"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                          mass: 0.8
                        }}
                        className="text-[#2dd482] mr-1.5"
                        layout
                      >
                        Playing
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="popLayout" initial={false}>
                    {isPlaying && (
                      <motion.span
                        key="dot"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                          mass: 0.8,
                          delay: 0.05
                        }}
                        className="text-[#2dd482] mr-1.5"
                        layout
                      >
                        •
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <motion.span
                    layout
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      mass: 0.8
                    }}
                    className="text-[#2dd482]"
                  >
                    {currentStop.duration}
                  </motion.span>
                </p>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRewind(); }}
            className="p-2 text-gray-400 hover:text-gray-900 transition-all active:scale-90"
          >
            <BackwardIcon size={24} />
          </button>
          
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
             {/* Progress Ring */}
             <svg className="absolute inset-0 rotate-[-90deg] pointer-events-none" width={size} height={size}>
               <circle
                 stroke="#d1d5db" // gray-300 - more visible background
                 strokeWidth={strokeWidth}
                 fill="transparent"
                 r={radius}
                 cx={size / 2}
                 cy={size / 2}
               />
               <circle
                 stroke="#2dd482" // green progress indicator
                 strokeWidth={strokeWidth}
                 fill="transparent"
                 r={radius}
                 cx={size / 2}
                 cy={size / 2}
                 strokeDasharray={circumference}
                 strokeDashoffset={offset}
                 strokeLinecap="round"
                 style={{ transition: 'stroke-dashoffset 0.1s linear' }}
               />
             </svg>

            <button
              onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
              className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm z-10 overflow-hidden relative"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {isPlaying ? (
                   <motion.div
                     key="pause"
                     variants={iconVariants}
                     initial="initial"
                     animate="animate"
                     exit="exit"
                     transition={iconTransition}
                     className="absolute inset-0 flex items-center justify-center"
                   >
                     <Pause size={18} fill="currentColor" />
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
                    <Play size={18} fill="currentColor" className="" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <button
             onClick={(e) => { e.stopPropagation(); onForward(); }}
             className="p-2 text-gray-400 hover:text-gray-900 transition-all active:scale-90"
          >
            <ForwardIcon size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};