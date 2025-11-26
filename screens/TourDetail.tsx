import React, { useEffect, useState } from 'react';
import { Clock3, MapPin } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { TourData } from '../types';
import { TourListItem } from '../components/TourListItem';
import { FeedItemRenderer } from '../components/feed/FeedItemRenderer';

interface TourDetailProps {
  tour: TourData;
  currentStopId: string | null;
  isPlaying: boolean;
  onStopClick: (stopId: string) => void;
  onTogglePlay: () => void;
  onStopPlayPause: (stopId: string) => void;
  tourProgress: number;
  consumedMinutes: number;
  totalMinutes: number;
  completedStopsCount: number;
  isStopCompleted: (stopId: string) => boolean;
}

// Helper component for animating numbers smoothly
const AnimatedCounter = ({ value }: { value: number }) => {
  // Slower spring: reduced stiffness from 75 to 35
  const spring = useSpring(0, { mass: 0.8, stiffness: 35, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};

export const TourDetail: React.FC<TourDetailProps> = ({
  tour,
  currentStopId,
  isPlaying,
  onStopClick,
  onTogglePlay,
  onStopPlayPause,
  tourProgress,
  consumedMinutes,
  totalMinutes,
  completedStopsCount,
  isStopCompleted
}) => {
  // Slower spring: reduced stiffness from 75 to 35 to match counter
  const progressSpring = useSpring(0, { mass: 0.8, stiffness: 35, damping: 15 });

  useEffect(() => {
    // Animate to the passed progress value whenever it changes
    progressSpring.set(tourProgress);
  }, [progressSpring, tourProgress]);

  const width = useTransform(progressSpring, (value) => `${value}%`);

  // Count only audio stops for progress display
  const audioStopsCount = tour.stops.filter(stop => stop.type === 'audio').length;

  return (
    <div className="flex flex-col h-full relative w-full bg-white">
      {/* Sticky Header */}
      <div className="px-6 pt-2 pb-4 border-b border-gray-50 bg-white sticky top-0 z-20">
        <div className="flex justify-between items-start mb-4 mt-2">
          <h2 className="text-3xl font-bold text-gray-900 w-2/3 leading-tight">{tour.title}</h2>
          <div className="text-right">
             <span className="text-3xl font-bold text-gray-900">
               <AnimatedCounter value={tourProgress} />
             </span>
             <span className="text-sm font-medium text-gray-400 ml-0.5">%</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full mb-4 overflow-hidden">
          <motion.div 
            style={{ width }}
            className="bg-black h-full rounded-full" 
          />
        </div>

        {/* Increased text size from text-xs to text-sm for better legibility */}
        <div className="flex justify-between text-sm font-semibold text-gray-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Clock3 size={16} />
            <span className="text-gray-900">
              <AnimatedCounter value={consumedMinutes} />
            </span>
            <span>/ {totalMinutes} mins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={16} />
            <span className="text-gray-900">{completedStopsCount}</span>
            <span>/ {audioStopsCount}</span>
          </div>
        </div>
      </div>

      {/* Scrollable List */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-32 no-scrollbar"
        // Stop propagation of drag events on the list to allow scrolling
        onPointerDown={(e) => e.stopPropagation()}
      >
        {tour.stops.map((stop, index) => {
          // Render audio stops with TourListItem
          if (stop.type === 'audio') {
            return (
              <TourListItem
                key={stop.id}
                stop={stop}
                index={index}
                isLast={index === tour.stops.length - 1}
                isActive={stop.id === currentStopId}
                isPlaying={isPlaying}
                isCompleted={isStopCompleted(stop.id)}
                onClick={() => onStopClick(stop.id)}
                onPlayPause={() => onStopPlayPause(stop.id)}
              />
            );
          }

          // Render other content types with FeedItemRenderer
          return <FeedItemRenderer key={stop.id} item={stop} />;
        })}
      </div>
    </div>
  );
};