import React from 'react';
import { Play, Pause } from 'lucide-react';
import { AudioStop } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCheckmark } from '../AnimatedCheckmark';

interface AudioStopCardProps {
  item: AudioStop;
  index?: number;
  isActive?: boolean;
  isPlaying?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  onPlayPause?: () => void;
}

const iconVariants = {
  initial: { scale: 0.5, opacity: 0, filter: 'blur(2px)' },
  animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
  exit: { scale: 0.5, opacity: 0, filter: 'blur(2px)' }
};

const iconTransition = { duration: 0.25, ease: 'easeOut' } as const;

export const AudioStopCard: React.FC<AudioStopCardProps> = ({
  item,
  index = 0,
  isActive = false,
  isPlaying = false,
  isCompleted = false,
  onClick,
  onPlayPause
}) => {
  return (
    <div className="w-full mb-6 last:mb-0 px-1">
      <div
        onClick={onClick}
        className="group relative rounded-2xl bg-white shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        {/* Top Section - Image */}
        <div className="h-40 w-full bg-gray-200 rounded-t-2xl relative overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {/* Top Right Status Circle with Animated Checkmark */}
          <AnimatedCheckmark
            isVisible={isCompleted}
            uniqueKey={item.id}
          />
        </div>

        {/* Play Button - Floating between sections */}
        {onPlayPause && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className={`absolute top-[136px] right-6 w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg z-10 overflow-hidden
            ${isActive && isPlaying
              ? 'bg-black text-white'
              : 'bg-white text-black border border-gray-100 hover:bg-gray-50'}`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {isActive && isPlaying ? (
                <motion.div
                  key="pause"
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={iconTransition}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Pause size={20} fill="currentColor" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={iconTransition}
                  className="absolute inset-0 flex items-center justify-center pl-1"
                >
                  <Play size={20} fill="currentColor" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}

        {/* Bottom Section - Info */}
        <div className="p-5 pt-7">
          <div className="flex items-start gap-4">
            {/* Number Circle */}
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-gray-500">{index + 1}</span>
            </div>

            {/* Text Content */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                {item.title}
              </h3>
              <p className="text-base font-medium text-gray-500">
                {item.duration}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
