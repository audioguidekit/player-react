import React, { useEffect } from 'react';
import { ArrowDownFromLine, Grid, Search } from 'lucide-react';
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion';

interface TourHeaderProps {
  onBack: () => void;
  progressWidth: MotionValue<string>;
  consumedMinutes: number;
  totalMinutes: number;
}

// Helper component for animating numbers smoothly
const AnimatedCounter = ({ value }: { value: number }) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 35, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};

export const TourHeader: React.FC<TourHeaderProps> = ({
  onBack,
  progressWidth,
  consumedMinutes,
  totalMinutes,
}) => {
  return (
    <>
      {/* Floating Action Buttons - Clear of Dynamic Island */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ delay: 0.15, duration: 0.2 }}
        className="absolute top-0 left-0 right-0 z-30 px-6 pt-4 pb-2"
      >
        <div className="flex items-center justify-between">
          {/* Left: Back Button */}
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600 transition-colors shadow-lg active:scale-95"
          >
            <ArrowDownFromLine size={20} />
          </button>

          {/* Right: Grid and Search Buttons */}
          <div className="flex items-center gap-2">
            <button className="w-11 h-11 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600 transition-colors shadow-lg active:scale-95">
              <Grid size={20} />
            </button>
            <button className="w-11 h-11 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600 transition-colors shadow-lg active:scale-95">
              <Search size={20} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Sticky Header with Progress Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.2, duration: 0.2 }}
        className="px-6 pt-20 pb-4 bg-white sticky top-0 z-20"
      >
        {/* Progress Indicator Row */}
        <div className="flex items-center gap-3">
          {/* Progress Bar (70% width) */}
          <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <motion.div
              style={{ width: progressWidth }}
              className="bg-black h-full rounded-full"
            />
          </div>

          {/* Time Remaining Text */}
          <div className="text-sm text-gray-500 whitespace-nowrap">
            <AnimatedCounter value={totalMinutes - consumedMinutes} /> mins left
          </div>
        </div>
      </motion.div>
    </>
  );
};
