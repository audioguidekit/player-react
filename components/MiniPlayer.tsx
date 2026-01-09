import React, { useEffect, useRef, useState } from 'react';
import { SkipBackIcon, SkipForwardIcon, XIcon, ClosedCaptioningIcon } from '@phosphor-icons/react';
import { motion, AnimatePresence, useAnimationControls, useMotionValue, useTransform, PanInfo, useMotionTemplate } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { AudioStop } from '../types';
import { ForwardIcon } from './icons/ForwardIcon';
import { BackwardIcon } from './icons/BackwardIcon';
import { SkipButton } from './player/SkipButton';
import { PlayPauseButton } from './player/PlayPauseButton';
import { ProgressRing } from './player/ProgressRing';
import { iconVariants, iconTransition } from '../src/animations/variants';

interface MiniPlayerProps {
  currentStop: AudioStop | undefined;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onForward: () => void;
  onRewind: () => void;
  onClick: () => void;
  progress?: number;
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  isCompleting?: boolean;
  isTransitioning?: boolean;
  // Track navigation (for swipe)
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  // Transcription
  transcription?: string;
  transcriptionAvailable?: boolean;
  isTranscriptionExpanded?: boolean;
  onToggleTranscription?: (expanded: boolean) => void;
}

const Container = styled(motion.div)`
  ${tw`absolute bottom-0 left-0 right-0 z-[70] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-[2.5rem] overflow-hidden`}
  background-color: ${({ theme }) => theme.miniPlayer.backgroundColor};
  padding-bottom: calc(200px + ${({ theme }) => theme.platform.safeArea.bottom});
  margin-bottom: -200px;
`;

const InnerContainer = styled.div`
  ${tw`relative w-full h-full`}
`;

const BackgroundLayer = styled.div`
  ${tw`absolute inset-0 rounded-t-[2.5rem] flex items-center justify-between px-4 h-full`}
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

const SwipeIcon = styled(motion.div)<{ $canNavigate: boolean }>(({ $canNavigate, theme }) => [
  tw`flex items-center`,
  {
    color: $canNavigate ? theme.miniPlayer.textColor : theme.colors.text.tertiary,
  },
]);

const ForegroundCard = styled(motion.div)<{ $isExpanded: boolean }>(({ $isExpanded, theme }) => [
  tw`relative rounded-t-[2.5rem] overflow-hidden`,
  {
    backgroundColor: theme.miniPlayer.backgroundColor,
  },
  $isExpanded ? tw`w-full h-full` : tw`flex items-center justify-between gap-3`,
]);

const HandleContainer = styled(motion.div)<{ $isExpanded: boolean }>`
  ${tw`absolute top-0 left-0 right-0 flex justify-center pt-3 cursor-grab active:cursor-grabbing touch-none z-30`}
`;

const Handle = styled.div`
  ${tw`w-10 h-1 rounded-full`}
  background-color: ${({ theme }) => theme.sheets.handleColor};
`;

const ExpandedContent = styled(motion.div)`
  ${tw`w-full h-full px-0 origin-center`}
`;

const ExpandedInner = styled(motion.div)`
  ${tw`pt-10 pb-6`}
`;

const ControlsRow = styled.div`
  ${tw`relative flex items-center justify-center gap-4 mb-1`}
`;

const ProgressContainer = styled.div`
  ${tw`relative flex items-center justify-center`}
  width: 64px;
  height: 64px;
`;

const TitleSection = styled(motion.div)`
  ${tw`text-center cursor-pointer mt-1`}
`;

const TitleContainer = styled.div`
  ${tw`overflow-hidden leading-tight px-8`}
`;

const TitleText = styled(motion.span)`
  ${tw`text-base whitespace-nowrap inline-block leading-none pb-0.5`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  color: ${({ theme }) => theme.miniPlayer.textColor};
`;

const MinimizedContent = styled(motion.div)`
  ${tw`flex items-center flex-1 min-w-0 px-8 py-2 pt-4 gap-3 w-full`}
  height: 80px;
`;

const MinimizedInner = styled(motion.div)`
  ${tw`flex items-center flex-1 min-w-0 gap-3`}
`;

const MinimizedTitleSection = styled(motion.div)`
  ${tw`flex items-center flex-1 min-w-0 cursor-pointer`}
`;

const MinimizedTitle = styled.span`
  ${tw`text-base truncate`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  color: ${({ theme }) => theme.miniPlayer.textColor};
`;

const TranscriptionButton = styled.button<{ $isExpanded: boolean }>(({ $isExpanded, theme }) => [
  tw`w-12 h-12 rounded-full flex items-center justify-center`,
  tw`active:scale-90 transition-all duration-100 ease-in-out`,
  tw`absolute right-8`,
  {
    backgroundColor: theme.buttons.transcription.backgroundColor,
    color: theme.buttons.transcription.iconColor,
    '&:hover': {
      backgroundColor: theme.buttons.transcription.hoverBackground || theme.buttons.transcription.backgroundColor,
    },
  },
]);

const TranscriptionContainer = styled(motion.div)`
  ${tw`relative w-full overflow-hidden border-t mt-4`}
  border-color: ${({ theme }) => theme.colors.border?.light || 'rgba(0,0,0,0.1)'};
`;

const TranscriptionContent = styled.div`
  ${tw`px-6 py-4 overflow-y-auto`}
  max-height: 200px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.border?.medium || 'rgba(0,0,0,0.2)'};
    border-radius: 2px;
  }
`;

const TranscriptionText = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.miniPlayer.textColor};
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
`;

const EmptyStateText = styled.p`
  ${tw`text-sm text-center italic`}
  color: ${({ theme }) => theme.colors.text.tertiary};
  padding: 12px 0;
  margin: 0;
`;


export const MiniPlayer = React.memo<MiniPlayerProps>(({
  currentStop,
  isPlaying,
  onTogglePlay,
  onForward,
  onRewind,
  onClick,
  progress = 0,
  isExpanded: externalIsExpanded,
  onToggleExpanded,
  isCompleting = false,
  isTransitioning = false,
  onNextTrack,
  onPrevTrack,
  canGoNext = true,
  canGoPrev = true,
  transcription,
  transcriptionAvailable,
  isTranscriptionExpanded: externalIsTranscriptionExpanded,
  onToggleTranscription
}) => {
  // Use external state if provided, otherwise fall back to local state
  const [localIsExpanded, setLocalIsExpanded] = useState(true);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : localIsExpanded;
  const setIsExpanded = onToggleExpanded || setLocalIsExpanded;

  // Transcription state (dual-mode: external or local)
  const [localIsTranscriptionExpanded, setLocalIsTranscriptionExpanded] = useState(false);
  const isTranscriptionExpanded = externalIsTranscriptionExpanded !== undefined
    ? externalIsTranscriptionExpanded
    : localIsTranscriptionExpanded;
  const setIsTranscriptionExpanded = onToggleTranscription || setLocalIsTranscriptionExpanded;

  // Only show transcription if both flag and text exist
  const hasTranscription = transcriptionAvailable && transcription && transcription.trim().length > 0;

  // Use real progress from audio player
  const visualProgress = Math.max(0, Math.min(100, progress || 0));

  // Marquee animation for title
  const titleRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Advanced content transition variants (Blur + Scale + Fade)
  const contentVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  // Button variants without scale (so whileTap can control scale)
  const buttonVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const controls = useAnimationControls();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Unified swipe logic
  const dragX = useMotionValue(0);
  const dragXHandle = useTransform(dragX, (value) => -value);

  // Swipe logic for Next/Prev
  const opacityNext = useTransform(dragX, [-75, -25], [1, 0]);
  const scaleNext = useTransform(dragX, [-75, -25], [1.2, 0.8]);
  const opacityPrev = useTransform(dragX, [25, 75], [0, 1]);
  const scalePrev = useTransform(dragX, [25, 75], [0.8, 1.2]);

  // Shadow only on drag
  const shadowOpacity = useTransform(dragX, [-20, 0, 20], [0.1, 0, 0.1]);
  const boxShadow = useMotionTemplate`0 0 15px rgba(0,0,0,${shadowOpacity})`;

  // Ref to track if we've already vibrated for this drag
  const hasVibratedRef = useRef(false);

  const handleDragStart = () => {
    hasVibratedRef.current = false;
  };

  const handleHorizontalDrag = (_: any, info: PanInfo) => {
    if (hasVibratedRef.current) return;
    const threshold = 50;

    if (info.offset.x < -threshold && !canGoNext) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
        hasVibratedRef.current = true;
      }
    }
    if (info.offset.x > threshold && !canGoPrev) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
        hasVibratedRef.current = true;
      }
    }
  };

  const handleHorizontalDragEnd = (_: any, info: PanInfo) => {
    const swipedLeft = info.offset.x < -75;
    const swipedRight = info.offset.x > 75;

    if (swipedLeft && canGoNext && onNextTrack) {
      onNextTrack();
    } else if (swipedRight && canGoPrev && onPrevTrack) {
      onPrevTrack();
    }
  };

  // Vertical Drag Logic
  const yDrag = useMotionValue(0);
  // Expanded: Drag Down -> Hint Minimize


  const handleVerticalDragEnd = (_: any, info: PanInfo) => {
    if (isExpanded) {
      if (info.offset.y > 50 || info.velocity.y > 300) {
        setIsExpanded(false);
      }
    } else {
      if (info.offset.y < -30 || info.velocity.y < -200) {
        setIsExpanded(true);
      }
    }
  };

  return (
    <Container
      layout
      transition={{
        layout: { type: 'spring', damping: 30, stiffness: 400, mass: 0.5 }
      }}
      drag="y"
      dragDirectionLock
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={handleVerticalDragEnd}
      style={{ y: yDrag }}
    >
      {/* 
        PERSISTENT STRUCTURE:
        1. Background Layer (Actions) - Always rendered
        2. Foreground Card (Content) - Always rendered, layout morphs
      */}

      <InnerContainer>
        {/* Persistent Background Swipe Actions */}
        <BackgroundLayer>
          {/* Left Icon (Previous) */}
          <SwipeIcon
            style={{ opacity: opacityPrev, scale: scalePrev }}
            $canNavigate={canGoPrev}
          >
            {canGoPrev ? (
              <SkipBackIcon size={24} weight="bold" className="opacity-90" />
            ) : (
              <XIcon size={28} className="opacity-40" weight="bold" />
            )}
          </SwipeIcon>

          {/* Right Icon (Next) */}
          <SwipeIcon
            style={{ opacity: opacityNext, scale: scaleNext }}
            $canNavigate={canGoNext}
          >
            {canGoNext ? (
              <SkipForwardIcon size={24} weight="bold" className="opacity-90" />
            ) : (
              <XIcon size={28} className="opacity-40" weight="bold" />
            )}
          </SwipeIcon>
        </BackgroundLayer>

        {/* Persistent Foreground Card */}
        <ForegroundCard
          layout
          style={{ x: dragX, boxShadow }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragStart={handleDragStart}
          onDrag={(e, info) => handleHorizontalDrag(e, info)}
          onDragEnd={handleHorizontalDragEnd}
          $isExpanded={isExpanded}
        >
          {/* Handle (Visual only, always at top) */}
          <HandleContainer
            layout="position"
            style={{ x: dragXHandle }}
            $isExpanded={isExpanded}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Handle />
          </HandleContainer>

          {/* Content Switcher */}
          <AnimatePresence mode="popLayout" initial={false}>
            {isExpanded ? (
              <ExpandedContent
                layout
                key="expanded-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, opacity: { duration: 0.15 } }}
              >
                <ExpandedInner>
                  {/* Controls Row */}
                  <ControlsRow>
                    <SkipButton direction="backward" onClick={onRewind} seconds={15} className="w-14 h-14">
                      <BackwardIcon size={32} className="ml-1 mb-0.5" />
                    </SkipButton>

                    <ProgressContainer>
                      {!isTransitioning && (
                        <ProgressRing
                          progress={visualProgress}
                          size={64}
                          strokeWidth={3}
                        />
                      )}
                      <PlayPauseButton
                        isPlaying={isPlaying}
                        isCompleting={isCompleting}
                        onClick={onTogglePlay}
                        size="expanded"
                        buttonVariants={buttonVariants}
                      />
                    </ProgressContainer>

                    <SkipButton direction="forward" onClick={onForward} seconds={15} className="w-14 h-14">
                      <ForwardIcon size={32} className="mr-1 mb-0.5" />
                    </SkipButton>

                    {hasTranscription && (
                      <TranscriptionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTranscriptionExpanded(!isTranscriptionExpanded);
                        }}
                        onPointerDownCapture={(e) => e.stopPropagation()}
                        $isExpanded={isTranscriptionExpanded}
                        className="w-14 h-14"
                        aria-label={isTranscriptionExpanded ? "Hide transcription" : "Show transcription"}
                      >
                        {isTranscriptionExpanded ? (
                          <ClosedCaptioningIcon size={28} weight="fill" />
                        ) : (
                          <ClosedCaptioningIcon size={28} weight="duotone" />
                        )}
                      </TranscriptionButton>
                    )}
                  </ControlsRow>

                  {/* Title */}
                  <TitleSection
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                    dragListener={false}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <TitleContainer ref={containerRef}>
                      <TitleText
                        ref={titleRef}
                        animate={controls}
                      >
                        {currentStop.title}
                      </TitleText>
                    </TitleContainer>
                  </TitleSection>

                  {/* Transcription Panel */}
                  <AnimatePresence>
                    {hasTranscription && isTranscriptionExpanded && (
                      <TranscriptionContainer
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <TranscriptionContent>
                          {transcription ? (
                            <TranscriptionText>{transcription}</TranscriptionText>
                          ) : (
                            <EmptyStateText>No transcription available for this stop</EmptyStateText>
                          )}
                        </TranscriptionContent>
                      </TranscriptionContainer>
                    )}
                  </AnimatePresence>
                </ExpandedInner>
              </ExpandedContent>
            ) : (
              <MinimizedContent
                layout
                key="minimized-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.2,
                  exit: { duration: 0.1, ease: "easeOut" }
                }}
              >
                <MinimizedInner>
                  <MinimizedTitleSection
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(true);
                    }}
                    dragListener={false}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <MinimizedTitle>{currentStop.title}</MinimizedTitle>
                  </MinimizedTitleSection>

                  <PlayPauseButton
                    isPlaying={isPlaying}
                    onClick={onTogglePlay}
                    size="sm"
                    variant="mini"
                    buttonVariants={buttonVariants}
                  />
                </MinimizedInner>
              </MinimizedContent>
            )}
          </AnimatePresence>
        </ForegroundCard>
      </InnerContainer>
    </Container>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if relevant props change
  return (
    prevProps.currentStop?.id === nextProps.currentStop?.id &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.progress === nextProps.progress &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isCompleting === nextProps.isCompleting &&
    prevProps.isTransitioning === nextProps.isTransitioning &&
    prevProps.canGoNext === nextProps.canGoNext &&
    prevProps.canGoPrev === nextProps.canGoPrev &&
    prevProps.isTranscriptionExpanded === nextProps.isTranscriptionExpanded &&
    prevProps.transcription === nextProps.transcription &&
    prevProps.transcriptionAvailable === nextProps.transcriptionAvailable
  );
});