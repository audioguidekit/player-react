import React from 'react';
import { motion, useTransform, MotionValue, useMotionTemplate } from 'framer-motion';
import { MessageCircleMore, Languages } from 'lucide-react';
import { TourData } from '../types';

interface TourStartProps {
  tour: TourData;
  onOpenRating: () => void;
  onOpenLanguage: () => void;
  sheetY?: MotionValue<number>;
  collapsedY?: number;
  isVisible?: boolean;
}

export const TourStart: React.FC<TourStartProps> = ({
  tour,
  onOpenRating,
  onOpenLanguage,
  sheetY,
  collapsedY = 0,
  isVisible = true
}) => {
  // Check if the media is a video
  const isVideo = tour.image.match(/\.(mp4|webm|ogg)$/i);

  // Animation Transforms

  // 1. Scale image up to 110% when dragging down
  const scale = useTransform(
    sheetY || new MotionValue(0),
    [collapsedY, collapsedY + 200],
    [1, 1.1]
  );

  // 2. Parallax move (Image follows finger slightly when dragging down)
  const y = useTransform(
    sheetY || new MotionValue(0),
    [collapsedY, collapsedY + 200],
    [0, 50]
  );

  // 3. Overlay Opacity
  // Dragging Up (0 to collapsedY): Darkens (0.8 -> 0.3)
  // Dragging Down (collapsedY to +200): Fades out (0.3 -> 0)
  const overlayOpacity = useTransform(
    sheetY || new MotionValue(0),
    [0, collapsedY, collapsedY + 200],
    [0.8, 0.3, 0]
  );

  // 4. Blur Effect
  // Dragging Up (0 to collapsedY): Blurs (8px -> 0px)
  // Dragging Down: Remains 0px (clamped by default)
  const blurAmount = useTransform(
    sheetY || new MotionValue(0),
    [0, collapsedY],
    [8, 0]
  );

  const blurFilter = useMotionTemplate`blur(${blurAmount}px)`;

  return (
    <div className="absolute inset-0 w-full h-full bg-black z-0 overflow-hidden">
      {/* Background Image Area */}
      <motion.div
        style={{ scale, y, filter: blurFilter }}
        className="relative w-full h-full origin-center"
      >
        {isVideo ? (
          <video
            src={tour.image}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={tour.image}
            alt={tour.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Existing Gradients for text readability (always present) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Dynamic Dark Backdrop Overlay - Changes intensity based on drag */}
        <motion.div
          style={{ opacity: overlayOpacity }}
          className="absolute inset-0 bg-black"
        />

        {/* Top Buttons */}
        <div className="absolute left-6 right-6 flex justify-between z-10" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
          <button
            onClick={onOpenRating}
            className="w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <MessageCircleMore size={24} />
          </button>
          <button
            onClick={onOpenLanguage}
            className="w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <Languages size={24} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};