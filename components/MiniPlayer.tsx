import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { SkipBackIcon } from '@phosphor-icons/react/dist/csr/SkipBack';
import { SkipForwardIcon } from '@phosphor-icons/react/dist/csr/SkipForward';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { ClosedCaptioningIcon } from '@phosphor-icons/react/dist/csr/ClosedCaptioning';
import { motion, AnimatePresence, useAnimationControls, useMotionValue, useTransform, PanInfo, useMotionTemplate } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { AudioStop } from '../types';
import { ForwardIcon } from './icons/ForwardIcon';
import { BackwardIcon } from './icons/BackwardIcon';
import { SkipButton } from './player/SkipButton';
import { PlayPauseButton } from './player/PlayPauseButton';
import { RichText } from './RichText';
import { ProgressRing } from './player/ProgressRing';
import { iconVariants, iconTransition } from '../src/animations/variants';

const FullscreenPlayerContent = lazy(() => import('../screens/FullscreenPlayer').then(m => ({ default: m.FullscreenPlayerContent })));

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
  transcriptAvailable?: boolean;
  isTranscriptionExpanded?: boolean;
  onToggleTranscription?: (expanded: boolean) => void;
  // Fullscreen player
  isFullscreenOpen?: boolean;
  onFullscreenChange?: (open: boolean) => void;
  // Extra props needed for fullscreen content
  tourTitle?: string;
  stopNumber?: number;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  // Adjacent artwork for drag peek
  nextStopImage?: string;
  prevStopImage?: string;
}

// Root wrapper — display:contents so children position against the MobileFrame parent
const PlayerRoot = styled.div`
  display: contents;
`;

// Container — always the bottom bar, never morphs to fullscreen
const Container = styled(motion.div)`
  ${tw`absolute bottom-0 left-0 right-0 z-[70] overflow-hidden rounded-t-[2.5rem]`}
  background-color: ${({ theme }) => theme.miniPlayer.backgroundColor};
  box-shadow: ${({ theme }) => theme.miniPlayer.shadow || '0 -10px 40px rgba(0, 0, 0, 0.15)'};
  padding-bottom: 200px;
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

// ForegroundCard — no layout prop, no fullscreen state
const ForegroundCard = styled(motion.div)<{ $isExpanded: boolean }>(({ $isExpanded, theme }) => [
  tw`relative overflow-hidden rounded-t-[2.5rem]`,
  {
    backgroundColor: theme.miniPlayer.backgroundColor,
  },
  $isExpanded
    ? tw`w-full h-full`
    : tw`flex items-center justify-between gap-3`,
]);

const HandleContainer = styled(motion.div)`
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
  ${tw`pt-10 pb-2`}
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
  ${tw`whitespace-nowrap inline-block leading-none pb-0.5`}
  font-size: ${({ theme }) => theme.miniPlayer.titleFontSize};
  font-weight: ${({ theme }) => theme.miniPlayer.titleFontWeight};
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  color: ${({ theme }) => theme.miniPlayer.textColor};
`;

const MinimizedContent = styled(motion.div)`
  ${tw`flex items-center flex-1 min-w-0 px-8 pt-4 pb-1 gap-3 w-full`}
  height: 72px;
`;

const MinimizedInner = styled(motion.div)`
  ${tw`flex items-center flex-1 min-w-0 gap-3`}
`;

const MinimizedTitleSection = styled(motion.div)`
  ${tw`flex items-center flex-1 min-w-0 cursor-pointer`}
`;

const MinimizedTitleContainer = styled.div`
  ${tw`overflow-hidden flex-1 min-w-0`}
`;

const MinimizedTitle = styled(motion.span)`
  ${tw`whitespace-nowrap inline-block`}
  font-size: ${({ theme }) => theme.miniPlayer.titleFontSize};
  font-weight: ${({ theme }) => theme.miniPlayer.titleFontWeight};
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  color: ${({ theme }) => theme.miniPlayer.textColor};
`;

const TranscriptionButton = styled.button<{ $isExpanded: boolean }>(({ $isExpanded, theme }) => [
  tw`p-0 border-0 rounded-full flex items-center justify-center absolute right-8`,
  {
    width: '48px',
    height: '48px',
    backgroundColor: theme.buttons.transcription.backgroundColor,
    color: theme.buttons.transcription.iconColor,
    transformOrigin: 'center center',
    transition: 'background-color 100ms ease-in-out, transform 100ms ease-out',
    '@media (hover: hover)': {
      '&:hover': {
        backgroundColor: theme.miniPlayer.controls.otherButtonsHoverBackground || theme.buttons.transcription.backgroundColor,
      },
    },
    '&:active': {
      transform: 'scale(0.9)',
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
  ${tw`leading-relaxed`}
  font-size: ${({ theme }) => theme.miniPlayer.transcriptionFontSize};
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

// Fullscreen overlay — separate layer, slides up from bottom (like Spotify/Apple Music)
const FullscreenOverlay = styled(motion.div)`
  ${tw`absolute inset-0 z-[80] overflow-hidden`}
  background-color: ${({ theme }) => theme.miniPlayer.backgroundColor};
  touch-action: none;
`;

// Animation variants hoisted outside component to prevent recreation on each render
const contentVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
} as const;

// Button variants without scale (so whileTap can control scale)
const buttonVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
} as const;

// Spring config for fullscreen slide transition
const fullscreenSpring = {
  type: 'spring' as const,
  damping: 32,
  stiffness: 300,
  mass: 0.8,
};

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
  transcriptAvailable,
  isTranscriptionExpanded: externalIsTranscriptionExpanded,
  onToggleTranscription,
  isFullscreenOpen = false,
  onFullscreenChange,
  tourTitle,
  stopNumber,
  currentTime = 0,
  duration = 0,
  onSeek,
  nextStopImage,
  prevStopImage,
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

  // Fullscreen state
  const isFullscreen = isFullscreenOpen;
  const setIsFullscreen = (open: boolean) => onFullscreenChange?.(open);

  // Only show transcription if both flag and text exist
  const hasTranscription = transcriptAvailable && transcription && transcription.trim().length > 0;

  // Use real progress from audio player
  const visualProgress = Math.max(0, Math.min(100, progress || 0));

  // Marquee animation for expanded title
  const titleRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Marquee animation for minimized title
  const miniTitleRef = useRef<HTMLSpanElement>(null);
  const miniContainerRef = useRef<HTMLDivElement>(null);
  const miniControls = useAnimationControls();

  // Ref for transcription scroll container
  const transcriptionRef = useRef<HTMLDivElement>(null);

  // Scroll transcription to top when stop changes
  useEffect(() => {
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop = 0;
    }
  }, [currentStop?.id]);

  const controls = useAnimationControls();

  // Marquee: measure overflow and auto-scroll if title is too long
  useEffect(() => {
    const el = titleRef.current;
    const container = containerRef.current;
    if (!el || !container || !isExpanded) return;

    controls.set({ x: 0 });

    const raf = requestAnimationFrame(() => {
      const textWidth = el.scrollWidth;
      const containerWidth = container.clientWidth;
      const overflow = textWidth - containerWidth;

      if (overflow <= 0) return;

      const scrollDuration = Math.max(3, overflow / 25);
      const pauseDuration = 2;
      const totalDuration = scrollDuration * 2 + pauseDuration * 2;

      controls.start({
        x: [0, 0, -overflow, -overflow, 0],
        transition: {
          duration: totalDuration,
          times: [
            0,
            pauseDuration / totalDuration,
            (pauseDuration + scrollDuration) / totalDuration,
            (pauseDuration * 2 + scrollDuration) / totalDuration,
            1,
          ],
          ease: 'linear',
          repeat: Infinity,
        },
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      controls.stop();
    };
  }, [currentStop?.id, controls, isExpanded]);

  // Marquee for minimized title
  useEffect(() => {
    const el = miniTitleRef.current;
    const container = miniContainerRef.current;
    if (!el || !container || isExpanded) return;

    miniControls.set({ x: 0 });

    const raf = requestAnimationFrame(() => {
      const textWidth = el.scrollWidth;
      const containerWidth = container.clientWidth;
      const overflow = textWidth - containerWidth;

      if (overflow <= 0) return;

      const scrollDuration = Math.max(3, overflow / 25);
      const pauseDuration = 2;
      const totalDuration = scrollDuration * 2 + pauseDuration * 2;

      miniControls.start({
        x: [0, 0, -overflow, -overflow, 0],
        transition: {
          duration: totalDuration,
          times: [
            0,
            pauseDuration / totalDuration,
            (pauseDuration + scrollDuration) / totalDuration,
            (pauseDuration * 2 + scrollDuration) / totalDuration,
            1,
          ],
          ease: 'linear',
          repeat: Infinity,
        },
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      miniControls.stop();
    };
  }, [currentStop?.id, miniControls, isExpanded]);

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

  // Vertical Drag Logic (Container — minimized ↔ expanded, drag-up → fullscreen)
  const yDrag = useMotionValue(0);

  const handleVerticalDragEnd = (_: any, info: PanInfo) => {
    if (isExpanded) {
      if (info.offset.y > 50 || info.velocity.y > 300) {
        // Drag down → minimize
        setIsExpanded(false);
      } else if (onFullscreenChange && (info.offset.y < -60 || info.velocity.y < -300)) {
        // Drag up → open fullscreen overlay
        setIsFullscreen(true);
      }
    } else {
      if (info.offset.y < -30 || info.velocity.y < -200) {
        setIsExpanded(true);
      }
    }
  };

  // Fullscreen overlay drag-to-dismiss
  const handleFullscreenDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 400) {
      setIsFullscreen(false);
    }
  };

  return (
    <PlayerRoot>
      {/* ── Mini/Expanded Player (bottom bar) ── */}
      <Container
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={handleVerticalDragEnd}
        style={{ y: yDrag }}
      >
        <InnerContainer>
          {/* Background Swipe Actions */}
          <BackgroundLayer>
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

          {/* Foreground Card */}
          <ForegroundCard
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
            {/* Handle */}
            <HandleContainer
              style={{ x: dragXHandle }}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Handle />
            </HandleContainer>

            {/* Content Switcher — minimized ↔ expanded only */}
            <AnimatePresence mode="popLayout" initial={false}>
              {isExpanded ? (
                /* ── Expanded Content ── */
                <ExpandedContent
                  key="expanded-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, opacity: { duration: 0.15 } }}
                >
                  <ExpandedInner>
                    {/* Controls Row */}
                    <ControlsRow>
                      <SkipButton direction="backward" onClick={onRewind} seconds={15}>
                        <BackwardIcon size={32} />
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

                      <SkipButton direction="forward" onClick={onForward} seconds={15}>
                        <ForwardIcon size={32} />
                      </SkipButton>

                      {hasTranscription && (
                        <TranscriptionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsTranscriptionExpanded(!isTranscriptionExpanded);
                          }}
                          onPointerDownCapture={(e) => e.stopPropagation()}
                          $isExpanded={isTranscriptionExpanded}
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
                          <TranscriptionContent ref={transcriptionRef}>
                            {transcription ? (
                              <TranscriptionText><RichText content={transcription} /></TranscriptionText>
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
                /* ── Minimized Content ── */
                <MinimizedContent
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
                      <MinimizedTitleContainer ref={miniContainerRef}>
                        <MinimizedTitle ref={miniTitleRef} animate={miniControls}>
                          {currentStop.title}
                        </MinimizedTitle>
                      </MinimizedTitleContainer>
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

      {/* ── Fullscreen Overlay (separate layer, slides up like Spotify/Apple Music) ── */}
      <AnimatePresence>
        {isFullscreen && (
          <FullscreenOverlay
            key="fullscreen-overlay"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={fullscreenSpring}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleFullscreenDragEnd}
          >
            <Suspense fallback={null}>
              <FullscreenPlayerContent
                onClose={() => setIsFullscreen(false)}
                currentStop={currentStop!}
                tourTitle={tourTitle || ''}
                isPlaying={isPlaying}
                progress={visualProgress}
                currentTime={currentTime}
                duration={duration}
                onTogglePlay={onTogglePlay}
                onSeek={onSeek || (() => {})}
                onForward={onForward}
                onRewind={onRewind}
                onNextTrack={onNextTrack || (() => {})}
                onPrevTrack={onPrevTrack || (() => {})}
                canGoNext={canGoNext}
                canGoPrev={canGoPrev}
                isCompleting={isCompleting}
                isTransitioning={isTransitioning}
                transcription={transcription}
                transcriptAvailable={transcriptAvailable}
                isTranscriptionOpen={isTranscriptionExpanded}
                onToggleTranscription={setIsTranscriptionExpanded}
                stopNumber={stopNumber}
                nextStopImage={nextStopImage}
                prevStopImage={prevStopImage}
              />
            </Suspense>
          </FullscreenOverlay>
        )}
      </AnimatePresence>
    </PlayerRoot>
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
    prevProps.transcriptAvailable === nextProps.transcriptAvailable &&
    prevProps.isFullscreenOpen === nextProps.isFullscreenOpen &&
    prevProps.currentTime === nextProps.currentTime &&
    prevProps.duration === nextProps.duration &&
    prevProps.tourTitle === nextProps.tourTitle
  );
});
