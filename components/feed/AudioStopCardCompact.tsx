import React, { memo } from 'react';
import { AudioStop } from '../../types';
import { AnimatedCheckmark } from '../AnimatedCheckmark';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioStopCardCompactProps {
  item: AudioStop;
  index?: number;
  isActive?: boolean;
  isPlaying?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  id?: string;
}

export const AudioStopCardCompact = memo<AudioStopCardCompactProps>(({
  item,
  index = 0,
  isActive = false,
  isPlaying = false,
  isCompleted = false,
  onClick,
  id
}) => {
  return (
    <div className="w-full mb-4 last:mb-0" id={id}>
      <div
        onClick={onClick}
        className="group relative rounded-2xl bg-white shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] overflow-hidden"
      >
        {/* Image Section with Duration Overlay */}
        <div className="h-40 w-full bg-gray-200 relative overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />

          {/* Duration Badge - Top Right */}
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full flex items-center">
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ width: 0, opacity: 0, marginRight: 0 }}
                  animate={{ width: 24, opacity: 1, marginRight: 8 }}
                  exit={{ width: 0, opacity: 0, marginRight: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-center justify-center overflow-hidden"
                >
                  <span className="audio-playing-loader" />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-white text-sm font-regular">{item.duration}</span>
          </div>
        </div>

        {/* Bottom Section - Number and Title */}
        <div className="p-4 flex items-center gap-3">
          {/* Number + Checkmark combined */}
          <div
            className="relative flex items-center justify-center shrink-0"
            style={{ width: 28, height: 28 }} // same as checkmark circle
          >
            {/* Active Playing Spinner Ring */}
            {isPlaying && (
              <svg
                className="absolute inset-0 z-10 audio-spinner-ring"
                viewBox="0 0 28 28"
                style={{ transformOrigin: "center" }}
              >
                <circle
                  cx="14"
                  cy="14"
                  r="12.5"
                  fill="none"
                  stroke="#22BD53"
                  strokeWidth="3"
                  strokeDasharray="20 58.5"
                  strokeLinecap="round"
                  transform="rotate(-90 14 14)"
                />
              </svg>
            )}

            {/* Base number circle */}
            <div
              className={`absolute rounded-full bg-white flex items-center justify-center ${isPlaying ? 'inset-[1.5px]' : 'inset-0 border border-[#CBCBCB]'
                }`}
            >
              <span
                className="text-sm font-semibold text-gray-900"
                style={{ fontFamily: 'Inter' }}
              >
                {index + 1}
              </span>
            </div>

            {/* Overlay checkmark – covers number when completed */}
            <AnimatedCheckmark
              isVisible={isCompleted}
              size={8} // 28px circle
              uniqueKey={item.id}
              className="absolute inset-0"
            />
          </div>

          {/* Title */}
          <h3
            className="text-lg font-medium text-gray-900 leading-tight flex-1"
            style={{ fontFamily: 'Roboto Condensed, sans-serif' }}
          >
            {item.title}
          </h3>
        </div>

      </div>
    </div>
  );
});
