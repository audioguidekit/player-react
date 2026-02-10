import React, { useCallback, useRef, useState } from 'react';
import { CaretDownIcon, SkipBackIcon, SkipForwardIcon, ClosedCaptioningIcon } from '@phosphor-icons/react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
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
  // Stop number
  stopNumber?: number;
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
  ${tw`flex items-center justify-between px-6 pt-4 pb-2 shrink-0`}
`;

const HeaderButton = styled.button`
  ${tw`w-12 h-12 flex items-center justify-center rounded-full`}
  color: ${({ theme }) => theme.miniPlayer.textColor};
`;

const TourTitle = styled.span`
  ${tw`text-xs font-normal tracking-wider opacity-60`}
  color: ${({ theme }) => theme.miniPlayer.textColor};
`;

const ArtworkContainer = styled.div`
  ${tw`flex-1 flex items-center justify-center px-8`}
  min-height: 0;
`;

const ArtworkImage = styled.img`
  ${tw`rounded-2xl object-cover shadow-xl`}
  width: 100%;
  max-width: 360px;
  aspect-ratio: 1;
`;

const ArtworkPlaceholder = styled.div`
  ${tw`rounded-2xl flex items-center justify-center`}
  width: 100%;
  max-width: 360px;
  aspect-ratio: 1;
  background-color: ${({ theme }) => theme.cards.image.placeholderColor};
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

const StopTitle = styled.h2`
  ${tw`text-xl font-bold leading-tight flex-1`}
  color: ${({ theme }) => theme.miniPlayer.textColor};
`;

const SeekBarContainer = styled.div`
  ${tw`mt-6 mb-6`}
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
  tw`w-12 h-12 flex items-center justify-center rounded-full`,
  tw`active:scale-90 transition-transform duration-100`,
  {
    color: theme.miniPlayer.controls.otherButtonsIcon,
  },
  $disabled && tw`opacity-30`,
]);

const ProgressContainer = styled.div`
  ${tw`relative flex items-center justify-center shrink-0`}
  width: 64px;
  height: 64px;
`;

const TranscriptionToggle = styled.button<{ $active: boolean }>(({ $active, theme }) => [
  tw`w-12 h-12 rounded-full flex items-center justify-center shrink-0`,
  tw`active:scale-90 transition-all duration-100 ease-in-out`,
  {
    backgroundColor: $active ? theme.buttons.transcription.backgroundColor : 'transparent',
    color: $active ? theme.buttons.transcription.iconColor : theme.miniPlayer.textColor,
    opacity: $active ? 1 : 0.6,
  },
]);

const TranscriptionPanel = styled(motion.div)`
  ${tw`overflow-hidden mt-3`}
`;

const TranscriptionScroll = styled.div`
  ${tw`overflow-y-auto py-2`}
  max-height: 160px;
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
  opacity: 0.8;
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

/**
 * Fullscreen player content — rendered inside the FullscreenOverlay.
 * Builds on the same components as the expanded MiniPlayer for consistency.
 */
export const FullscreenPlayerContent = React.memo<FullscreenPlayerContentProps>(({
  onClose,
  currentStop,
  tourTitle,
  isPlaying,
  progress,
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
  stopNumber,
}) => {
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const [isTranscriptionOpen, setIsTranscriptionOpen] = useState(false);
  const transcriptionRef = useRef<HTMLDivElement>(null);

  const hasTranscription = transcriptAvailable && transcription && transcription.trim().length > 0;

  // Horizontal swipe on artwork for track navigation
  const handleArtworkDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    if ((offset.x < -SWIPE_OFFSET_THRESHOLD || velocity.x < -SWIPE_VELOCITY_THRESHOLD) && canGoNext) {
      onNextTrack();
    } else if ((offset.x > SWIPE_OFFSET_THRESHOLD || velocity.x > SWIPE_VELOCITY_THRESHOLD) && canGoPrev) {
      onPrevTrack();
    }
  }, [canGoNext, canGoPrev, onNextTrack, onPrevTrack]);

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
        <TourTitle>{tourTitle}</TourTitle>
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

      {/* Artwork — swipe left/right for track navigation */}
      <ArtworkContainer>
        <motion.div
          key={currentStop.id}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleArtworkDragEnd}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          {currentStop.image ? (
            <ArtworkImage
              src={currentStop.image}
              alt={currentStop.title}
              draggable={false}
            />
          ) : (
            <ArtworkPlaceholder />
          )}
        </motion.div>
      </ArtworkContainer>

      {/* Bottom Section: Title, Transcription, Seek, Controls */}
      <BottomSection>
        <TitleArea>
          {stopNumber !== undefined && (
            <NumberContainer>
              <NumberCircle>
                <NumberText>{stopNumber}</NumberText>
              </NumberCircle>
            </NumberContainer>
          )}
          <StopTitle>{currentStop.title}</StopTitle>
        </TitleArea>

        {/* Transcription Panel */}
        <AnimatePresence>
          {hasTranscription && isTranscriptionOpen && (
            <TranscriptionPanel
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <TranscriptionScroll
                ref={transcriptionRef}
                onPointerDownCapture={(e) => e.stopPropagation()}
              >
                <TranscriptionText>
                  <RichText content={transcription!} />
                </TranscriptionText>
              </TranscriptionScroll>
            </TranscriptionPanel>
          )}
        </AnimatePresence>

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
            onClick={canGoPrev ? onPrevTrack : undefined}
            $disabled={!canGoPrev}
            disabled={!canGoPrev}
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <SkipBackIcon size={24} weight="fill" />
          </TrackButton>

          <SkipButton direction="backward" onClick={onRewind} seconds={15} className="w-14 h-14">
            <BackwardIcon size={32} className="ml-1 mb-0.5" />
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

          <SkipButton direction="forward" onClick={onForward} seconds={15} className="w-14 h-14">
            <ForwardIcon size={32} className="mr-1 mb-0.5" />
          </SkipButton>

          <TrackButton
            onClick={canGoNext ? onNextTrack : undefined}
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
    prevProps.progress === nextProps.progress &&
    prevProps.currentTime === nextProps.currentTime &&
    prevProps.duration === nextProps.duration &&
    prevProps.canGoNext === nextProps.canGoNext &&
    prevProps.canGoPrev === nextProps.canGoPrev &&
    prevProps.isCompleting === nextProps.isCompleting &&
    prevProps.isTransitioning === nextProps.isTransitioning &&
    prevProps.tourTitle === nextProps.tourTitle &&
    prevProps.transcription === nextProps.transcription &&
    prevProps.transcriptAvailable === nextProps.transcriptAvailable &&
    prevProps.stopNumber === nextProps.stopNumber
  );
});
