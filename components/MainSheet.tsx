import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, MotionValue } from 'framer-motion';

interface MainSheetProps {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  startContent: React.ReactNode;
  detailContent: React.ReactNode;
  sheetY?: MotionValue<number>;
  onLayoutChange?: (collapsedY: number) => void;
}

export const MainSheet: React.FC<MainSheetProps> = ({
  isExpanded,
  onExpand,
  onCollapse,
  startContent,
  detailContent,
  sheetY,
  onLayoutChange
}) => {
  const controls = useAnimation();
  const internalY = useMotionValue(0);
  const y = sheetY || internalY;
  
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State to track the measured height of the StartCard content
  const [startContentHeight, setStartContentHeight] = useState(380); // Default fallback
  const [containerHeight, setContainerHeight] = useState(800);

  // Constants
  const EXPANDED_Y = 0; // Fully expanded (top of viewport)

  // Calculate Collapsed Position
  // Sheet should show only the start content height from the bottom
  const COLLAPSED_Y = containerHeight - startContentHeight;

  // Measure content on mount and resize
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) {
        setStartContentHeight(contentRef.current.offsetHeight);
      }
      if (containerRef.current) {
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };

    measure();
    
    const resizeObserver = new ResizeObserver(measure);
    if (contentRef.current) resizeObserver.observe(contentRef.current);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Report the calculated collapsed Y to parent (for TourStart animations)
  useEffect(() => {
    if (onLayoutChange) {
      onLayoutChange(COLLAPSED_Y);
    }
  }, [COLLAPSED_Y, onLayoutChange]);

  // Animate when state changes or dimensions change
  useEffect(() => {
    // Faster spring: Increased stiffness from 120 to 280 for snappier expansion
    if (isExpanded) {
      controls.start({ y: EXPANDED_Y, transition: { type: 'spring', damping: 32, stiffness: 280 } });
    } else {
      controls.start({ y: COLLAPSED_Y, transition: { type: 'spring', damping: 32, stiffness: 280 } });
    }
  }, [isExpanded, controls, COLLAPSED_Y, EXPANDED_Y]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (isExpanded) {
      // If expanded, drag down significantly to collapse
      if (info.offset.y > threshold || info.velocity.y > 500) {
        onCollapse();
      } else {
        controls.start({ y: EXPANDED_Y });
      }
    } else {
      // If collapsed, drag up to expand
      if (info.offset.y < -threshold || info.velocity.y < -500) {
        onExpand();
      } else {
        controls.start({ y: COLLAPSED_Y });
      }
    }
  };

  // Interpolations
  const inputRange = [EXPANDED_Y, COLLAPSED_Y];

  // Border radius: 0 when expanded (fullscreen), 40px when collapsed (bottom sheet)
  const topRadius = useTransform(y, inputRange, [0, 40]);

  const startOpacity = useTransform(y, inputRange, [0, 1]);
  const startPointerEvents = useTransform(y, (latest) => latest > (COLLAPSED_Y / 2) ? 'auto' : 'none');

  const detailOpacity = useTransform(y, inputRange, [1, 0]);
  const detailPointerEvents = useTransform(y, (latest) => latest < (COLLAPSED_Y / 2) ? 'auto' : 'none');

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      
      {/* Backdrop for Expanded State */}
      {isExpanded && (
        <div 
          className="absolute inset-0 bg-black/20 z-10 pointer-events-auto"
          onClick={onCollapse}
        />
      )}

      <motion.div
        drag={isExpanded ? false : "y"}
        dragConstraints={{ top: EXPANDED_Y, bottom: COLLAPSED_Y }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ y: containerHeight }} // Start off-screen at bottom
        style={{
          y,
          borderTopLeftRadius: topRadius,
          borderTopRightRadius: topRadius,
          top: isExpanded ? 'calc(-1 * env(safe-area-inset-top, 0px))' : '0',
        }}
        className="absolute inset-x-0 bottom-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] overflow-hidden z-20 flex flex-col pointer-events-auto"
      >
        {/* Content Area */}
        <div className="relative flex-1 w-full">
          
          {/* Start Content Layer - We wrap this in a ref to measure it */}
          <motion.div 
            style={{ opacity: startOpacity, pointerEvents: startPointerEvents }}
            className="absolute inset-x-0 top-0 z-10"
          >
            <div ref={contentRef}>
              {startContent}
            </div>
          </motion.div>

          {/* Detail Content Layer */}
          <motion.div 
            style={{ opacity: detailOpacity, pointerEvents: detailPointerEvents }}
            className="absolute inset-0 z-20 h-full flex flex-col"
          >
            {detailContent}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};