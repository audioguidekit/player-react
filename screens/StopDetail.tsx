import React, { useEffect, useRef } from 'react';
import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Check
} from 'lucide-react';
import { TourData } from '../types';

interface StopDetailProps {
  tour: TourData;
  currentStopId: string | null;
  isPlaying: boolean;
  isStopCompleted: boolean;
  onPlayPause: () => void;
  onMinimize: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StopDetail: React.FC<StopDetailProps> = ({
  tour,
  currentStopId,
  isPlaying,
  isStopCompleted,
  onPlayPause,
  onMinimize,
  onNext,
  onPrev
}) => {
  const dragControls = useDragControls();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentStopIndex = tour.stops.findIndex(s => s.id === currentStopId);
  const currentStop = tour.stops[currentStopIndex];
  const hasNext = currentStopIndex !== -1 && currentStopIndex < tour.stops.length - 1;
  const hasPrev = currentStopIndex > 0;

  // Reset scroll position when stop changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStopId]);

  // Mock long description text
  const longDescription = "The Colosseum, also known as the Flavian Amphitheatre, is an oval amphitheatre in the centre of the city of Rome, Italy. Built of travertine limestone, tuff, and brick-faced concrete, it was the largest amphitheatre ever built at the time and held 50,000 to 80,000 spectators. It is situated just east of the Roman Forum. Construction began under the emperor Vespasian in AD 72 and was completed in AD 80 under his successor and heir, Titus. Further modifications were made during the reign of Domitian. These three emperors are known as the Flavian dynasty, and the amphitheatre was named in Latin for its association with their family name (Flavius).";

  const iconVariants = {
    initial: { scale: 0.5, opacity: 0, filter: 'blur(2px)' },
    animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
    exit: { scale: 0.5, opacity: 0, filter: 'blur(2px)' }
  };

  const iconTransition = { duration: 0.25, ease: 'easeOut' } as const;

  return (
    <div className="absolute inset-0 z-50 flex flex-col isolate pointer-events-auto">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-md z-0"
        onClick={onMinimize}
      />

      {/* Sheet Container */}
      <motion.div 
        key="player-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragListener={false} // Disable default drag to allow scrolling
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onMinimize();
          }
        }}
        className="absolute top-[80px] bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] overflow-hidden flex flex-col z-10 shadow-none"
      >
        {/* Fixed Header Layer (Handle + Navigation) - Stays on top */}
        <div className="absolute top-0 left-0 right-0 h-20 z-50 pointer-events-none">
          {/* Drag Handle - Draggable Zone */}
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/40 backdrop-blur-md rounded-full cursor-grab active:cursor-grabbing pointer-events-auto touch-none" 
          />
          
          {/* Left Button */}
          {hasPrev && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute top-5 left-6 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-colors text-white pointer-events-auto"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Button */}
          {hasNext && (
            <button 
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute top-5 right-6 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-colors text-white pointer-events-auto"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Scrollable Content Container */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto no-scrollbar rounded-t-[2.5rem]"
        >
           
           {/* Top Image Part */}
           <div className="relative h-[45vh] w-full bg-gray-900 shrink-0 rounded-b-[2.5rem] overflow-hidden">
             <img
               src={currentStop?.image || tour.image}
               alt="Active Stop"
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-black/10" />

             {/* Top Right Status Circle */}
             <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
               {isStopCompleted && <Check size={14} className="text-black" strokeWidth={3} />}
             </div>

             {/* Play/Pause Button - Floating */}
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 onPlayPause();
               }}
               className={`absolute bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg z-10 overflow-hidden
               ${isPlaying
                 ? 'bg-black text-white'
                 : 'bg-white text-black border border-gray-100 hover:bg-gray-50'}`}
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
                     className="absolute inset-0 flex items-center justify-center pl-1"
                   >
                     <Play size={24} fill="currentColor" />
                   </motion.div>
                 )}
               </AnimatePresence>
             </button>
           </div>

           {/* Content Part */}
           <div className="bg-white px-8 pt-8 pb-32">
             {/* Info Header */}
             <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                    #{currentStopIndex + 1}
                  </div>
                  {/* Metadata text size increased */}
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{tour.title}</span>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                  {currentStop?.title || "Select a stop"}
                </h2>
                
                {/* Intro description size increased to xl */}
                <p className="text-gray-500 font-medium text-xl leading-snug">
                  {tour.description}
                </p>
             </div>

             {/* Long Description Text - Increased from text-base to text-lg for reading comfort */}
             <div className="text-gray-600 leading-relaxed text-lg text-left">
               <p>{longDescription}</p>
               <p className="mt-4">
                  The Colosseum is built of travertine limestone, tuff (volcanic rock), and brick-faced concrete. It could hold an estimated 50,000 to 80,000 spectators at various points in its history, having an average audience of some 65,000; it was used for gladiatorial contests and public spectacles including animal hunts, executions, re-enactments of famous battles, and dramas based on Classical mythology.
               </p>
               <p className="mt-4">
                  The building ceased to be used for entertainment in the early medieval era. It was later reused for such purposes as housing, workshops, quarters for a religious order, a fortress, a quarry, and a Christian shrine. Although substantially ruined because of earthquakes and stone-robbers, the Colosseum is still an iconic symbol of Imperial Rome and is listed as one of the New7Wonders of the World. It is one of Rome's most popular tourist attractions and also has links to the Roman Catholic Church, as each Good Friday the Pope leads a torchlit "Way of the Cross" procession that starts in the area around the Colosseum.
               </p>
             </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};