import React from 'react';
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
  showImage?: boolean | 'thumbnail';
  showDuration?: boolean;
  showNumber?: boolean;
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

const SpinnerRing = styled.svg`
  ${tw`absolute inset-0 z-10`}
  transform-origin: center;

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

// List item layout components (when showImage is false)
const ListItemContainer = styled.div`
  ${tw`flex items-center gap-3 py-3 cursor-pointer`}
  border-bottom: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const ListItemDuration = styled.span`
  ${tw`shrink-0`}
  font-family: ${({ theme }) =>
    theme?.typography?.fontFamily?.numbers
      ? theme.typography.fontFamily.numbers.join(', ')
      : theme?.typography?.fontFamily?.sans?.join(', ') || 'Inter, sans-serif'
  };
  font-size: ${({ theme }) => theme.cards.durationBadgeFontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

// Thumbnail list layout components (when showImage is 'thumbnail')
const ThumbnailOuterContainer = styled.div`
  ${tw`w-full`}
`;

const ThumbnailListContainer = styled.div`
  ${tw`flex items-center gap-3 py-3 cursor-pointer`}
  border-bottom: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const ThumbnailImage = styled.img`
  ${tw`shrink-0 object-cover`}
  width: ${({ theme }) => theme.cards.thumbnail.size};
  height: ${({ theme }) => theme.cards.thumbnail.size};
  border-radius: ${({ theme }) => theme.cards.thumbnail.borderRadius};
  background-color: ${({ theme }) => theme.cards.image.placeholderColor};
`;

// Remove React.memo - let parent (TourDetail) control re-renders
// This ensures the component always gets fresh isPlaying prop
export const AudioStopCardCompact: React.FC<AudioStopCardCompactProps> = ({
  item,
  index = 0,
  isActive = false,
  isPlaying = false,
  isCompleted = false,
  onClick,
  id,
  showImage,
  showDuration,
  showNumber
}) => {
  // Use !== false pattern for defaults (same as showLanguageLabel in TourStart.tsx)
  const shouldShowImage = showImage !== false;
  const isThumbnail = showImage === 'thumbnail';
  const shouldShowDuration = showDuration !== false;
  const shouldShowNumber = showNumber !== false;

  // Thumbnail list layout
  if (isThumbnail) {
    return (
      <ThumbnailOuterContainer id={id}>
        <ThumbnailListContainer onClick={onClick}>
          {shouldShowNumber && (
            <NumberContainer>
              <AnimatePresence>
                {isPlaying && !isCompleted && (
                  <SpinnerRing
                    as={motion.svg}
                    key={`spinner-${item.id}`}
                    viewBox="0 0 28 28"
                    className="audio-spinner-ring"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
              </AnimatePresence>
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
          )}
          <ThumbnailImage src={item.image} alt={item.imageAlt || item.title} />
          <Title style={{ flex: 1 }}>{item.title}</Title>
          {shouldShowDuration && <ListItemDuration>{item.duration}</ListItemDuration>}
        </ThumbnailListContainer>
      </ThumbnailOuterContainer>
    );
  }

  // List item layout when image is hidden
  if (!shouldShowImage) {
    return (
      <OuterContainer id={id}>
        <ListItemContainer onClick={onClick}>
          {shouldShowNumber && (
            <NumberContainer>
              <AnimatePresence>
                {isPlaying && !isCompleted && (
                  <SpinnerRing
                    as={motion.svg}
                    key={`spinner-${item.id}`}
                    viewBox="0 0 28 28"
                    className="audio-spinner-ring"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
              </AnimatePresence>
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
          )}
          <Title style={{ flex: 1 }}>{item.title}</Title>
          {shouldShowDuration && <ListItemDuration>{item.duration}</ListItemDuration>}
        </ListItemContainer>
      </OuterContainer>
    );
  }

  // Full card layout (existing code with conditional elements)
  return (
    <OuterContainer id={id}>
      <CardContainer onClick={onClick} className="group">
        <ImageContainer>
          <Image src={item.image} alt={item.imageAlt || item.title} />
          {shouldShowDuration && (
            <DurationBadge>
              <AnimatePresence mode="wait">
                {isPlaying && (
                  <LoaderContainer
                    key={`loader-${item.id}`}
                    initial={{ width: 0, opacity: 0, marginRight: 0 }}
                    animate={{ width: 24, opacity: 1, marginRight: 8 }}
                    exit={{ width: 0, opacity: 0, marginRight: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <span className="audio-playing-loader" />
                  </LoaderContainer>
                )}
              </AnimatePresence>
              <DurationText>{item.duration}</DurationText>
            </DurationBadge>
          )}
        </ImageContainer>

        <BottomSection>
          {shouldShowNumber && (
            <NumberContainer>
              <AnimatePresence>
                {isPlaying && !isCompleted && (
                  <SpinnerRing
                    as={motion.svg}
                    key={`spinner-${item.id}`}
                    viewBox="0 0 28 28"
                    className="audio-spinner-ring"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
              </AnimatePresence>
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
          )}
          <Title>{item.title}</Title>
        </BottomSection>
      </CardContainer>
    </OuterContainer>
  );
};