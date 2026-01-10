import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { AudioStop } from '../../types';
import { AnimatedCheckmark } from '../AnimatedCheckmark';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioStopCardCompactProps {
  item: AudioStop;
  index?: number;
  isActive?: boolean;
  isPlaying?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  id?: string;
}

const OuterContainer = styled.div`
  ${tw`w-full mb-4 last:mb-0`}
`;

const CardContainer = styled.div`
  ${tw`relative cursor-pointer overflow-hidden`}
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
  transition: transform 0.15s ease-out;
  transform-origin: center;

  &:active {
    transform: scale(0.98);
  }
`;

const ImageContainer = styled.div`
  ${tw`h-40 w-full relative overflow-hidden`}
  background-color: ${({ theme }) => theme.cards.image.placeholderColor};
`;

const Image = styled.img`
  ${tw`w-full h-full object-cover`}
`;

const DurationBadge = styled.div`
  ${tw`absolute top-3 right-3 backdrop-blur-sm px-3 py-1 rounded-full flex items-center`}
  background-color: ${({ theme }) => theme.cards.image.durationBadgeBackground};
`;

const LoaderContainer = styled(motion.div)`
  ${tw`flex items-center justify-center overflow-hidden`}
`;

const DurationText = styled.span`
  font-family: ${({ theme }) =>
    theme?.typography?.fontFamily?.numbers
      ? theme.typography.fontFamily.numbers.join(', ')
      : theme?.typography?.fontFamily?.sans?.join(', ') || 'Inter, sans-serif'
  };
  font-size: ${({ theme }) => theme.cards.durationBadgeFontSize};
  font-weight: 400;
  color: ${({ theme }) => theme.cards.image.durationBadgeText};
`;

const BottomSection = styled.div`
  ${tw`p-4 flex items-center gap-3`}
`;

const NumberContainer = styled.div`
  ${tw`relative flex items-center justify-center shrink-0`}
  width: 28px;
  height: 28px;
`;

const SpinnerRing = styled.svg<{ $isPlaying: boolean }>`
  ${tw`absolute inset-0 z-10`}
  transform-origin: center;
  animation-play-state: ${({ $isPlaying }) => $isPlaying ? 'running' : 'paused'};

  circle {
    stroke: ${({ theme }) => theme.stepIndicators.active.outlineColor};
  }
`;

const NumberCircle = styled.div<{ $isPlaying: boolean }>(({ $isPlaying, theme }) => [
  tw`absolute rounded-full flex items-center justify-center`,
  {
    backgroundColor: $isPlaying
      ? theme.stepIndicators.active.backgroundColor
      : theme.stepIndicators.inactive.backgroundColor,
  },
  $isPlaying ? tw`inset-[1.5px]` : [
    tw`inset-0`,
    {
      border: `1px solid ${theme.stepIndicators.inactive.borderColor}`,
    },
  ],
]);

const NumberText = styled.span<{ $isPlaying: boolean }>`
  font-family: ${({ theme }) =>
    theme?.typography?.fontFamily?.numbers
      ? theme.typography.fontFamily.numbers.join(', ')
      : theme?.typography?.fontFamily?.sans?.join(', ') || 'Inter, sans-serif'
  };
  font-size: ${({ theme }) => theme.cards.numberFontSize};
  font-weight: ${({ theme }) => theme.cards.numberFontWeight};
  color: ${({ $isPlaying, theme }) =>
    $isPlaying
      ? theme.stepIndicators.active.numberColor
      : theme.stepIndicators.inactive.numberColor
  };
`;

const Title = styled.h3`
  ${tw`leading-tight flex-1`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  font-size: ${({ theme }) => theme.cards.titleFontSize};
  font-weight: ${({ theme }) => theme.cards.titleFontWeight};
  color: ${({ theme }) => theme.cards.textColor};
`;

export const AudioStopCardCompact = memo<AudioStopCardCompactProps>(({
  item,
  index = 0,
  isActive = false,
  isPlaying = false,
  isCompleted = false,
  onClick,
  id
}) => {
  return (
    <OuterContainer id={id}>
      <CardContainer onClick={onClick} className="group">
        <ImageContainer>
          <Image src={item.image} alt={item.title} />
          <DurationBadge>
            <AnimatePresence mode="wait">
              {isPlaying && (
                <LoaderContainer
                  key="loader"
                  initial={{ width: 0, opacity: 0, marginRight: 0 }}
                  animate={{ width: 24, opacity: 1, marginRight: 8 }}
                  exit={{ width: 0, opacity: 0, marginRight: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                >
                  <span className="audio-playing-loader" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                </LoaderContainer>
              )}
            </AnimatePresence>
            <DurationText>{item.duration}</DurationText>
          </DurationBadge>
        </ImageContainer>

        <BottomSection>
          <NumberContainer>
            {isPlaying && !isCompleted && (
              <SpinnerRing 
                viewBox="0 0 28 28" 
                className="audio-spinner-ring"
                $isPlaying={isPlaying}
                key="spinner"
              >
                <circle
                  cx="14"
                  cy="14"
                  r="12.5"
                  fill="none"
                  strokeWidth="3"
                  strokeDasharray="20 58.5"
                  strokeLinecap="round"
                  transform="rotate(-90 14 14)"
                />
              </SpinnerRing>
            )}
            <NumberCircle $isPlaying={isPlaying}>
              <NumberText $isPlaying={isPlaying}>{index + 1}</NumberText>
            </NumberCircle>
            <AnimatedCheckmark
              isVisible={isCompleted}
              size={8}
              uniqueKey={item.id}
              className="absolute inset-0"
            />
          </NumberContainer>
          <Title>{item.title}</Title>
        </BottomSection>
      </CardContainer>
    </OuterContainer>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: re-render when isPlaying, isActive, or isCompleted changes
  // Also re-render if item id changes (different stop)
  // Note: onClick comparison is less strict since it's often recreated
  // Priority: isPlaying changes MUST trigger re-render for animations to stop
  if (prevProps.isPlaying !== nextProps.isPlaying) {
    return false; // Re-render if isPlaying changed
  }
  if (prevProps.isActive !== nextProps.isActive) {
    return false; // Re-render if isActive changed
  }
  if (prevProps.isCompleted !== nextProps.isCompleted) {
    return false; // Re-render if isCompleted changed
  }
  if (prevProps.item.id !== nextProps.item.id) {
    return false; // Re-render if different stop
  }
  // For other props, use shallow comparison
  return (
    prevProps.index === nextProps.index &&
    prevProps.id === nextProps.id
    // onClick is intentionally excluded from strict comparison
    // to prevent unnecessary re-renders when only onClick reference changes
  );
});