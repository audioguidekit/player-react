import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { SkipBackIcon } from '@phosphor-icons/react/dist/csr/SkipBack';
import { SkipForwardIcon } from '@phosphor-icons/react/dist/csr/SkipForward';
import { ClosedCaptioningIcon } from '@phosphor-icons/react/dist/csr/ClosedCaptioning';
import { InfoIcon } from '@phosphor-icons/react/dist/csr/Info';
import { motion, AnimatePresence, useAnimationControls, useMotionValue, animate, type PanInfo } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { AudioStop } from '../types';
import { RichText } from '../components/RichText';
import { PlayPauseButton } from '../components/player/PlayPauseButton';
import { ProgressRing } from '../components/player/ProgressRing';
import { ForwardIcon } from '../components/icons/ForwardIcon';
import { BackwardIcon } from '../components/icons/BackwardIcon';
import { SkipButton } from '../components/player/SkipButton';

export interface FullscreenPlayerContentProps {
  onClose: () => void;
  currentStop: AudioStop;
  tourTitle: string;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onForward: () => void;
  onRewind: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isCompleting?: boolean;
  isTransitioning?: boolean;
  // Transcription
  transcription?: string;
  transcriptAvailable?: boolean;
  isTranscriptionOpen?: boolean;
  onToggleTranscription?: (open: boolean) => void;
  // Stop number
  stopNumber?: number;
  // Adjacent artwork for drag peek
  nextStopImage?: string;
  prevStopImage?: string;
}

// Format seconds to mm:ss
const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ContentWrapper = styled.div`
  ${tw`flex flex-col h-full w-full`}
`;

const Header = styled.div`
  ${tw`flex items-center justify-between px-6 pb-1 shrink-0`}
  padding-top: calc(env(safe-area-inset-top, 0px) + 0.5rem);
`;

const HeaderButton = styled.button`
  ${tw`p-0 border-0 rounded-full flex items-center justify-center shrink-0`}
  width: 48px;
  height: 48px;
  color: ${({ theme }) => theme.miniPlayer.controls.otherButtonsIcon};
  transform-origin: center center;
  transition: background-color 100ms ease-in-out, transform 100ms ease-out;
  @media (hover: hover) {
    &:hover {
      background-color: ${({ theme }) => theme.miniPlayer.controls.otherButtonsHoverBackground || 'transparent'};
    }
  }
  &:active {
    transform: scale(0.9);
  }
`;

const TourTitle = styled.span`
  ${tw`text-xs font-normal tracking-wider opacity-60`}
  color: ${({ theme }) => theme.miniPlayer.textColor};
`;

const MiddleArea = styled.div`
  ${tw`flex-1 relative`}
  min-height: 0;
  overflow: hidden;
`;

const ArtworkInner = styled.div`
  ${tw`relative`}
  height: 100%;
`;

const ArtworkImage = styled.img`
  ${tw`object-cover`}
  border-radius: ${({ theme }) => theme.fullscreenPlayer?.artworkBorderRadius || '16px'};
  box-shadow: ${({ theme }) => theme.fullscreenPlayer?.artworkShadow || '0 20px 25px -5px rgba(0, 0, 0, 0.3)'};
  max-width: 100%;
  max-height: 100%;
  min-height: 0;
  flex-shrink: 1;
  aspect-ratio: 1;
`;

const ArtworkPlaceholder = styled.div`
  ${tw`flex items-center justify-center`}
  border-radius: ${({ theme }) => theme.fullscreenPlayer?.artworkBorderRadius || '16px'};
  max-width: 100%;
  max-height: 100%;
  min-height: 0;
  flex-shrink: 1;
  aspect-ratio: 1;
  background-color: ${({ theme }) => theme.cards.image.placeholderColor};
`;

const ArtworkWrapper = styled.div`
  ${tw`relative`}
  max-width: 100%;
  max-height: 100%;
  min-height: 0;
  flex-shrink: 1;
`;

const TrackSlide = styled(motion.div)`
  ${tw`absolute inset-0 flex flex-col items-center justify-center`}
`;

const AdjacentArtwork = styled.img<{ $side: 'left' | 'right' }>`
  ${tw`object-cover absolute`}
  border-radius: ${({ theme }) => theme.fullscreenPlayer?.artworkBorderRadius || '16px'};
  box-shadow: ${({ theme }) => theme.fullscreenPlayer?.artworkShadow || '0 20px 25px -5px rgba(0, 0, 0, 0.3)'};
  top: 50%;
  transform: translateY(-50%);
  ${({ $side }) => $side === 'left' ? 'right: calc(100% + 32px);' : 'left: calc(100% + 32px);'}
  width: 100%;
  aspect-ratio: 1;
  opacity: ${({ theme }) => theme.fullscreenPlayer?.adjacentArtworkOpacity ?? 0.6};
  pointer-events: none;
`;

const InfoButton = styled.button`
  ${tw`absolute border-0 rounded-full flex items-center justify-center`}
  bottom: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: ${({ theme }) => theme.fullscreenPlayer?.infoButton?.backgroundColor || 'rgba(0, 0, 0, 0.45)'};
  color: ${({ theme }) => theme.fullscreenPlayer?.infoButton?.iconColor || 'rgba(255, 255, 255, 0.55)'};
  backdrop-filter: blur(${({ theme }) => theme.fullscreenPlayer?.infoButton?.backdropBlur || '4px'});
  -webkit-backdrop-filter: blur(${({ theme }) => theme.fullscreenPlayer?.infoButton?.backdropBlur || '4px'});
  z-index: 2;
  cursor: pointer;
  transition: background-color 100ms ease-in-out, transform 100ms ease-out;
  &:active {
    transform: scale(0.9);
  }
`;

const CaptionOverlay = styled(motion.div)`
  ${tw`absolute px-4 py-3 text-center`}
  border-radius: ${({ theme }) => theme.fullscreenPlayer?.captionOverlay?.borderRadius || '12px'};
  bottom: 8px;
  left: 8px;
  right: 8px;
  background: ${({ theme }) => theme.fullscreenPlayer?.captionOverlay?.backgroundColor || 'rgba(0, 0, 0, 0.6)'};
  backdrop-filter: blur(${({ theme }) => theme.fullscreenPlayer?.captionOverlay?.backdropBlur || '12px'});
  -webkit-backdrop-filter: blur(${({ theme }) => theme.fullscreenPlayer?.captionOverlay?.backdropBlur || '12px'});
  z-index: 2;
  cursor: pointer;
`;

const Caption = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.imageCaption.textColor};
  text-wrap: pretty;
`;

const Credit = styled.p`
  ${tw`text-xs italic mt-1`}
  color: ${({ theme }) => theme.imageCaption.creditColor};
  text-wrap: pretty;
`;

const BottomSection = styled.div`
  ${tw`px-8 pb-8 shrink-0`}
`;

const TitleArea = styled.div`
  ${tw`flex items-center gap-3`}
`;

const NumberContainer = styled.div`
  ${tw`relative flex items-center justify-center shrink-0`}
  width: 28px;
  height: 28px;
`;

const NumberCircle = styled.div`
  ${tw`absolute inset-0 rounded-full flex items-center justify-center`}
  background-color: ${({ theme }) => theme.stepIndicators.inactive.backgroundColor};
  border: 1px solid ${({ theme }) => theme.stepIndicators.inactive.borderColor};
`;

const NumberText = styled.span`
  font-family: ${({ theme }) =>
    theme?.typography?.fontFamily?.numbers
      ? theme.typography.fontFamily.numbers.join(', ')
      : theme?.typography?.fontFamily?.sans?.join(', ') || 'Inter, sans-serif'};
  font-size: ${({ theme }) => theme.cards.numberFontSize};
  font-weight: ${({ theme }) => theme.cards.numberFontWeight};
  color: ${({ theme }) => theme.stepIndicators.inactive.numberColor};
`;

const StopTitleContainer = styled.div`
  ${tw`flex-1 overflow-hidden`}
  min-width: 0;
`;

const StopTitle = styled(motion.h2)`
  ${tw`text-xl font-bold leading-tight whitespace-nowrap inline-block`}
  color: ${({ theme }) => theme.miniPlayer.textColor};
`;

const SeekBarContainer = styled.div`
  ${tw`mt-2 mb-4`}
`;

const SeekBarInput = styled.input<{ $progress: number }>`
  ${tw`w-full`}
  -webkit-appearance: none;
  appearance: none;
  height: 44px;
  outline: none;
  background: transparent;
  touch-action: pan-x;

  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 9999px;
    background: ${({ theme, $progress }) =>
      `linear-gradient(to right, ${theme.miniPlayer.progressBar.highlightColor} ${$progress}%, ${theme.miniPlayer.progressBar.backgroundColor} ${$progress}%)`};
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${({ theme }) => theme.miniPlayer.progressBar.highlightColor};
    cursor: pointer;
    margin-top: -5px;
  }

  &::-moz-range-track {
    height: 4px;
    border-radius: 9999px;
    background: ${({ theme, $progress }) =>
      `linear-gradient(to right, ${theme.miniPlayer.progressBar.highlightColor} ${$progress}%, ${theme.miniPlayer.progressBar.backgroundColor} ${$progress}%)`};
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${({ theme }) => theme.miniPlayer.progressBar.highlightColor};
    border: none;
    cursor: pointer;
  }
`;

const TimeLabels = styled.div`
  ${tw`flex justify-between mt-2`}
`;

const TimeLabel = styled.span`
  ${tw`text-xs`}
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-family: ${({ theme }) => theme.typography?.fontFamily?.numbers?.join(', ') || theme.typography?.fontFamily?.sans?.join(', ')};
`;

const FSControlsRow = styled.div`
  ${tw`flex items-center justify-center gap-6`}
`;

const TrackButton = styled.button<{ $disabled: boolean }>(({ $disabled, theme }) => [
  tw`p-0 border-0 rounded-full flex items-center justify-center shrink-0`,
  {
    width: '48px',
    height: '48px',
    color: theme.miniPlayer.controls.otherButtonsIcon,
    transformOrigin: 'center center',
    transition: 'background-color 100ms ease-in-out, transform 100ms ease-out',
    '@media (hover: hover)': {
      '&:hover': {
        backgroundColor: theme.miniPlayer.controls.otherButtonsHoverBackground || 'transparent',
      },
    },
    '&:active': {
      transform: 'scale(0.9)',
    },
  },
  $disabled && tw`opacity-30`,
]);

const ProgressContainer = styled.div`
  ${tw`relative flex items-center justify-center shrink-0`}
  width: 64px;
  height: 64px;
`;

const TranscriptionToggle = styled.button<{ $active: boolean }>(({ $active, theme }) => [
  tw`p-0 border-0 rounded-full flex items-center justify-center shrink-0`,
  {
    width: '48px',
    height: '48px',
    backgroundColor: $active ? theme.buttons.transcription.backgroundColor : 'transparent',
    color: $active ? theme.buttons.transcription.iconColor : theme.miniPlayer.textColor,
    opacity: $active ? 1 : (theme.fullscreenPlayer?.transcriptionTextOpacity ?? 0.6),
    transformOrigin: 'center center',
    transition: 'background-color 100ms ease-in-out, opacity 100ms ease-in-out, transform 100ms ease-out',
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

const TranscriptionScroll = styled.div`
  ${tw`overflow-y-auto py-2 h-full`}
  background-color: transparent;

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
  opacity: ${({ theme }) => theme.fullscreenPlayer?.transcriptionTextOpacity ?? 0.8};
`;

// Swipe thresholds for track navigation
const SWIPE_OFFSET_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 500;

// Button variants matching MiniPlayer's expanded view
const buttonVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
} as const;

// Crossfade variants for artwork ↔ transcription
const artworkVariants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
} as const;

const transcriptionVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
} as const;

const crossfadeTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] } as const;

// Spring config for track slide animations
const slideSpring = { type: 'spring' as const, stiffness: 260, damping: 26, mass: 1 };
const snapBackSpring = { type: 'spring' as const, stiffness: 500, damping: 35 };
// Gap between current and adjacent artwork (matches parent padding)
const ARTWORK_GAP = 32;

// Caption overlay fade
const captionFadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

const captionFadeTransition = { duration: 0.2 } as const;

/**
 * Fullscreen player content — rendered inside the FullscreenOverlay.
 * Builds on the same components as the expanded MiniPlayer for consistency.
 */
export const FullscreenPlayerContent = React.memo<FullscreenPlayerContentProps>(({
  onClose,
  currentStop,
  tourTitle,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onForward,
  onRewind,
  onNextTrack,
  onPrevTrack,
  canGoNext,
  canGoPrev,
  isCompleting = false,
  isTransitioning = false,
  transcription,
  transcriptAvailable,
  isTranscriptionOpen: externalIsTranscriptionOpen,
  onToggleTranscription,
  stopNumber,
  nextStopImage,
  prevStopImage,
}) => {
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const [localIsTranscriptionOpen, setLocalIsTranscriptionOpen] = useState(false);
  const [showCaption, setShowCaption] = useState(false);

  // Marquee animation for long titles
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleControls = useAnimationControls();
  const isTranscriptionOpen = externalIsTranscriptionOpen !== undefined
    ? externalIsTranscriptionOpen
    : localIsTranscriptionOpen;
  const setIsTranscriptionOpen = onToggleTranscription || setLocalIsTranscriptionOpen;
  const transcriptionRef = useRef<HTMLDivElement>(null);

  const hasTranscription = transcriptAvailable && transcription && transcription.trim().length > 0;
  const hasCaption = !!(currentStop.imageCaption || currentStop.imageCredit);

  // Pan-driven carousel for track navigation
  const dragX = useMotionValue(0);
  const artworkRef = useRef<HTMLDivElement>(null);
  const isSliding = useRef(false);
  const panAxis = useRef<'x' | 'y' | null>(null);

  // Reset drag position and caption when track changes
  useLayoutEffect(() => {
    dragX.jump(0);
    setShowCaption(false);
  }, [currentStop.id, dragX]);

  // Marquee: measure overflow and auto-scroll if title is too long
  useEffect(() => {
    const el = titleRef.current;
    const container = titleContainerRef.current;
    if (!el || !container) return;

    titleControls.set({ x: 0 });

    const raf = requestAnimationFrame(() => {
      const textWidth = el.scrollWidth;
      const containerWidth = container.clientWidth;
      const overflow = textWidth - containerWidth;

      if (overflow <= 0) return;

      const scrollDuration = Math.max(3, overflow / 25);
      const pauseDuration = 2;
      const totalDuration = scrollDuration * 2 + pauseDuration * 2;

      titleControls.start({
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
      titleControls.stop();
    };
  }, [currentStop.id, titleControls]);

  // Animate artwork off-screen then navigate (used by both swipe and buttons)
  const slideToTrack = useCallback((direction: 1 | -1, velocity?: number) => {
    if (isSliding.current) return;
    isSliding.current = true;
    const width = artworkRef.current?.offsetWidth || 300;
    const target = direction > 0 ? -(width + ARTWORK_GAP) : (width + ARTWORK_GAP);
    animate(dragX, target, { ...slideSpring, velocity }).then(() => {
      if (direction > 0) onNextTrack();
      else onPrevTrack();
      isSliding.current = false;
    });
  }, [onNextTrack, onPrevTrack, dragX]);

  const goNext = useCallback(() => slideToTrack(1), [slideToTrack]);
  const goPrev = useCallback(() => slideToTrack(-1), [slideToTrack]);

  // Pan gesture handlers for artwork swipe
  const handlePanStart = useCallback(() => { panAxis.current = null; }, []);

  const handlePan = useCallback((_: PointerEvent, info: PanInfo) => {
    if (isSliding.current) return;
    if (!panAxis.current) {
      if (Math.abs(info.offset.x) < 5 && Math.abs(info.offset.y) < 5) return;
      panAxis.current = Math.abs(info.offset.x) > Math.abs(info.offset.y) ? 'x' : 'y';
    }
    if (panAxis.current === 'x') dragX.set(info.offset.x);
  }, [dragX]);

  const handlePanEnd = useCallback((_: PointerEvent, info: PanInfo) => {
    if (isSliding.current || panAxis.current !== 'x') return;
    const { offset, velocity } = info;
    if ((offset.x < -SWIPE_OFFSET_THRESHOLD || velocity.x < -SWIPE_VELOCITY_THRESHOLD) && canGoNext) {
      slideToTrack(1, velocity.x);
    } else if ((offset.x > SWIPE_OFFSET_THRESHOLD || velocity.x > SWIPE_VELOCITY_THRESHOLD) && canGoPrev) {
      slideToTrack(-1, velocity.x);
    } else {
      animate(dragX, 0, snapBackSpring);
    }
  }, [canGoNext, canGoPrev, slideToTrack, dragX]);

  // Seek bar: show seek value while dragging, actual time otherwise
  const displayTime = seekValue !== null ? seekValue : currentTime;
  const displayProgress = duration > 0 ? (displayTime / duration) * 100 : 0;

  const handleSeekInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value));
  }, []);

  const handleSeekCommit = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    onSeek(time);
    setSeekValue(null);
  }, [onSeek]);

  return (
    <ContentWrapper>
      {/* Header */}
      <Header>
        <HeaderButton
          onClick={onClose}
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <CaretDownIcon size={28} weight="bold" />
        </HeaderButton>
        <div />
        {hasTranscription ? (
          <TranscriptionToggle
            $active={isTranscriptionOpen}
            onClick={() => {
              setIsTranscriptionOpen(!isTranscriptionOpen);
              // Scroll to top when opening
              if (!isTranscriptionOpen && transcriptionRef.current) {
                transcriptionRef.current.scrollTop = 0;
              }
            }}
            onPointerDownCapture={(e) => e.stopPropagation()}
            aria-label={isTranscriptionOpen ? "Hide transcription" : "Show transcription"}
          >
            <ClosedCaptioningIcon size={28} weight={isTranscriptionOpen ? "fill" : "duotone"} />
          </TranscriptionToggle>
        ) : (
          <div style={{ width: 48, height: 48 }} />
        )}
      </Header>

      {/* Middle area: crossfade between artwork and transcription */}
      <MiddleArea>
        <AnimatePresence mode="wait" initial={false}>
          {!isTranscriptionOpen ? (
            <motion.div
              key="artwork"
              variants={artworkVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={crossfadeTransition}
              style={{
                position: 'absolute',
                inset: 0,
                padding: '0 32px',
              }}
            >
              <ArtworkInner>
                <TrackSlide
                  ref={artworkRef}
                  style={{ x: dragX }}
                  onPanStart={handlePanStart}
                  onPan={handlePan}
                  onPanEnd={handlePanEnd}
                >
                  <ArtworkWrapper>
                    {prevStopImage && (
                      <AdjacentArtwork src={prevStopImage} $side="left" draggable={false} />
                    )}
                    {currentStop.image ? (
                      <ArtworkImage
                        src={currentStop.image}
                        alt={currentStop.imageAlt || currentStop.title}
                        draggable={false}
                      />
                    ) : (
                      <ArtworkPlaceholder />
                    )}
                    {nextStopImage && (
                      <AdjacentArtwork src={nextStopImage} $side="right" draggable={false} />
                    )}
                    {hasCaption && !showCaption && (
                      <InfoButton
                        onClick={(e) => { e.stopPropagation(); setShowCaption(true); }}
                        onPointerDownCapture={(e) => e.stopPropagation()}
                        aria-label="Show image info"
                      >
                        <InfoIcon size={18} weight="bold" />
                      </InfoButton>
                    )}
                    <AnimatePresence>
                      {showCaption && (
                        <CaptionOverlay
                          variants={captionFadeVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={captionFadeTransition}
                          onClick={(e) => { e.stopPropagation(); setShowCaption(false); }}
                          onPointerDownCapture={(e) => e.stopPropagation()}
                        >
                          {currentStop.imageCaption && <Caption><RichText content={currentStop.imageCaption} /></Caption>}
                          {currentStop.imageCredit && <Credit><RichText content={currentStop.imageCredit} /></Credit>}
                        </CaptionOverlay>
                      )}
                    </AnimatePresence>
                  </ArtworkWrapper>
                </TrackSlide>
              </ArtworkInner>
            </motion.div>
          ) : (
            <motion.div
              key="transcription"
              variants={transcriptionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={crossfadeTransition}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                padding: '0 32px',
              }}
            >
              <TitleArea style={{ marginBottom: 12, flexShrink: 0 }}>
                {stopNumber !== undefined && (
                  <NumberContainer>
                    <NumberCircle>
                      <NumberText>{stopNumber}</NumberText>
                    </NumberCircle>
                  </NumberContainer>
                )}
                <StopTitle as="h2" style={{ whiteSpace: 'normal', display: 'block', overflow: 'visible', textWrap: 'pretty' }}>
                  {currentStop.title}
                </StopTitle>
              </TitleArea>
              <TranscriptionScroll
                ref={transcriptionRef}
                onPointerDownCapture={(e) => e.stopPropagation()}
              >
                <TranscriptionText>
                  <RichText content={transcription!} />
                </TranscriptionText>
              </TranscriptionScroll>
            </motion.div>
          )}
        </AnimatePresence>
      </MiddleArea>

      {/* Bottom Section: Title (hidden when transcription open), Seek, Controls */}
      <BottomSection>
        {!isTranscriptionOpen && (
          <TitleArea>
            {stopNumber !== undefined && (
              <NumberContainer>
                <NumberCircle>
                  <NumberText>{stopNumber}</NumberText>
                </NumberCircle>
              </NumberContainer>
            )}
            <StopTitleContainer ref={titleContainerRef}>
              <StopTitle ref={titleRef} animate={titleControls}>
                {currentStop.title}
              </StopTitle>
            </StopTitleContainer>
          </TitleArea>
        )}

        {/* Seek Bar */}
        <SeekBarContainer>
          <SeekBarInput
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={displayTime}
            $progress={displayProgress}
            onInput={handleSeekInput}
            onChange={handleSeekCommit}
            onPointerDownCapture={(e) => e.stopPropagation()}
          />
          <TimeLabels>
            <TimeLabel>{formatTime(displayTime)}</TimeLabel>
            <TimeLabel>{formatTime(duration)}</TimeLabel>
          </TimeLabels>
        </SeekBarContainer>

        {/* Controls — same components as expanded MiniPlayer */}
        <FSControlsRow>
          <TrackButton
            onClick={canGoPrev ? goPrev : undefined}
            $disabled={!canGoPrev}
            disabled={!canGoPrev}
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <SkipBackIcon size={24} weight="fill" />
          </TrackButton>

          <SkipButton direction="backward" onClick={onRewind} seconds={15}>
            <BackwardIcon size={32} />
          </SkipButton>

          <ProgressContainer>
            <ProgressRing progress={0} size={64} strokeWidth={3} animated={false} />
            <PlayPauseButton
              isPlaying={isPlaying}
              isCompleting={isCompleting}
              isTransitioning={isTransitioning}
              onClick={onTogglePlay}
              size="expanded"
              buttonVariants={buttonVariants}
            />
          </ProgressContainer>

          <SkipButton direction="forward" onClick={onForward} seconds={15}>
            <ForwardIcon size={32} />
          </SkipButton>

          <TrackButton
            onClick={canGoNext ? goNext : undefined}
            $disabled={!canGoNext}
            disabled={!canGoNext}
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <SkipForwardIcon size={24} weight="fill" />
          </TrackButton>
        </FSControlsRow>
      </BottomSection>
    </ContentWrapper>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.currentStop?.id === nextProps.currentStop?.id &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.currentTime === nextProps.currentTime &&
    prevProps.duration === nextProps.duration &&
    prevProps.canGoNext === nextProps.canGoNext &&
    prevProps.canGoPrev === nextProps.canGoPrev &&
    prevProps.isCompleting === nextProps.isCompleting &&
    prevProps.isTransitioning === nextProps.isTransitioning &&
    prevProps.tourTitle === nextProps.tourTitle &&
    prevProps.transcription === nextProps.transcription &&
    prevProps.transcriptAvailable === nextProps.transcriptAvailable &&
    prevProps.isTranscriptionOpen === nextProps.isTranscriptionOpen &&
    prevProps.stopNumber === nextProps.stopNumber &&
    prevProps.nextStopImage === nextProps.nextStopImage &&
    prevProps.prevStopImage === nextProps.prevStopImage
  );
});
