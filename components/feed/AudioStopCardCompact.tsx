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
  border-radius: ${({ theme }) => theme.cards.cornerRadius};
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  box-shadow: 0 2px 15px ${({ theme }) => theme.cards.shadowColor};
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
  ${tw`text-sm font-normal`}
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

const NumberText = styled.span`
  ${tw`text-sm font-sans`}
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.stepIndicators.inactive.numberColor};
`;

const Title = styled.h3`
  ${tw`text-lg leading-tight flex-1 font-sans`}
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
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
            <AnimatePresence>
              {isPlaying && (
                <LoaderContainer
                  initial={{ width: 0, opacity: 0, marginRight: 0 }}
                  animate={{ width: 24, opacity: 1, marginRight: 8 }}
                  exit={{ width: 0, opacity: 0, marginRight: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <span className="audio-playing-loader" />
                </LoaderContainer>
              )}
            </AnimatePresence>
            <DurationText>{item.duration}</DurationText>
          </DurationBadge>
        </ImageContainer>

        <BottomSection>
          <NumberContainer>
            {isPlaying && !isCompleted && (
              <SpinnerRing viewBox="0 0 28 28" className="audio-spinner-ring">
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
              <NumberText>{index + 1}</NumberText>
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
});