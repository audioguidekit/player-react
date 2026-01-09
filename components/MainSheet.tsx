import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, MotionValue } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';

interface MainSheetProps {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  startContent: React.ReactNode;
  detailContent: React.ReactNode;
  sheetY?: MotionValue<number>;
  onLayoutChange?: (collapsedY: number) => void;
}

const Container = styled.div`
  ${tw`absolute inset-0 pointer-events-none z-20 overflow-hidden`}
`;

const Backdrop = styled.div`
  ${tw`absolute inset-0 z-10 pointer-events-auto`}
  background-color: rgba(0, 0, 0, 0.2);
`;

const SheetContainer = styled(motion.div)<{ $isExpanded: boolean }>`
  ${tw`absolute inset-x-0 bottom-0 overflow-hidden z-20 flex flex-col pointer-events-auto`}
  background-color: ${({ theme }) => theme.sheets.backgroundColor};
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  padding-bottom: max(${({ theme }) => theme.platform.safeArea.bottom}, 0px);
  top: ${({ $isExpanded, theme }) => $isExpanded ? `calc(-1 * ${theme.platform.safeArea.top})` : '0'};
`;

const ContentArea = styled.div`
  ${tw`relative flex-1 w-full`}
`;

const StartContentLayer = styled(motion.div)`
  ${tw`absolute inset-x-0 top-0 z-10`}
`;

const DetailContentLayer = styled(motion.div)`
  ${tw`absolute inset-0 z-20 h-full flex flex-col`}
`;

export const MainSheet = React.memo<MainSheetProps>(({
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
  const [startContentHeight, setStartContentHeight] = useState(420); // Increased default from 380
  const [containerHeight, setContainerHeight] = useState(0);

  // Constants
  const EXPANDED_Y = 0; // Fully expanded (top of viewport)

  // Calculate Collapsed Position
  // Sheet should show only the start content height from the bottom
  // Add a small buffer to ensure content is not cut off at the bottom
  // Use window.innerHeight as fallback if containerHeight is not measured yet
  const effectiveContainerHeight = containerHeight > 0 ? containerHeight : (typeof window !== 'undefined' ? window.innerHeight : 800);
  const calculatedCollapsedY = effectiveContainerHeight - startContentHeight - 30; // Added a 30px buffer
  // Ensure COLLAPSED_Y is always reasonable (not negative, not too high)
  const COLLAPSED_Y = Math.max(100, Math.min(calculatedCollapsedY, effectiveContainerHeight - 100));

  // Measure content on mount and resize
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) {
        const height = contentRef.current.offsetHeight;
        if (height > 0) {
          setStartContentHeight(height);
        }
      }
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        if (height > 0) {
          setContainerHeight(height);
        } else {
          // Fallback to window height if container height is 0
          const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
          setContainerHeight(windowHeight);
        }
      }
    };

    // Measure immediately
    measure();
    
    // Also measure after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(measure, 100);
    
    const resizeObserver = new ResizeObserver(measure);
    if (contentRef.current) resizeObserver.observe(contentRef.current);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, []);

  // Report the calculated collapsed Y to parent (for TourStart animations)
  useEffect(() => {
    if (onLayoutChange) {
      onLayoutChange(COLLAPSED_Y);
    }
  }, [COLLAPSED_Y, onLayoutChange]);

  // Animate when state changes or dimensions change
  useEffect(() => {
    // Ensure we have valid dimensions before animating
    if (containerHeight > 0 && startContentHeight > 0) {
      // Faster spring: Increased stiffness from 120 to 280 for snappier expansion
      if (isExpanded) {
        controls.start({ y: EXPANDED_Y, transition: { type: 'spring', damping: 32, stiffness: 280 } });
      } else {
        controls.start({ y: COLLAPSED_Y, transition: { type: 'spring', damping: 32, stiffness: 280 } });
      }
    }
  }, [isExpanded, controls, COLLAPSED_Y, EXPANDED_Y, containerHeight, startContentHeight]);

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
    <Container ref={containerRef}>

      {/* Backdrop for Expanded State */}
      {isExpanded && (
        <Backdrop onClick={onCollapse} />
      )}

      <SheetContainer
        drag={isExpanded ? false : "y"}
        dragConstraints={{ top: EXPANDED_Y, bottom: COLLAPSED_Y }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ y: COLLAPSED_Y > 0 ? COLLAPSED_Y : 400 }}
        style={{
          y,
          borderTopLeftRadius: topRadius,
          borderTopRightRadius: topRadius,
        }}
        $isExpanded={isExpanded}
      >
        {/* Content Area */}
        <ContentArea>

          {/* Start Content Layer - We wrap this in a ref to measure it */}
          <StartContentLayer
            style={{ opacity: startOpacity, pointerEvents: startPointerEvents }}
          >
            <div ref={contentRef}>
              {startContent}
            </div>
          </StartContentLayer>

          {/* Detail Content Layer */}
          <DetailContentLayer
            style={{ opacity: detailOpacity, pointerEvents: detailPointerEvents }}
          >
            {detailContent}
          </DetailContentLayer>
        </ContentArea>
      </SheetContainer>
    </Container>
  );
}, (prevProps, nextProps) => {
  // Only re-render if isExpanded changes or callback references change
  // Note: We don't compare ReactNode content as it's typically recreated
  return (
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.onExpand === nextProps.onExpand &&
    prevProps.onCollapse === nextProps.onCollapse &&
    prevProps.onLayoutChange === nextProps.onLayoutChange
  );
});