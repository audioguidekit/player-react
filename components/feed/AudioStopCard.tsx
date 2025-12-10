import React, { memo } from 'react';
import { Play, Pause } from 'lucide-react';
import { AudioStop } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { AnimatedCheckmark } from '../AnimatedCheckmark';
import { iconVariants, iconTransition } from '../../src/animations/variants';

interface AudioStopCardProps {
  item: AudioStop;
  index?: number;
  isActive?: boolean;
  isPlaying?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  onPlayPause?: () => void;
}

const OuterContainer = styled.div`
  ${tw`w-full mb-6 last:mb-0 px-1`}
`;

const CardContainer = styled.div`
  ${tw`relative rounded-2xl bg-white shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-gray-100 cursor-pointer transition-transform active:scale-[0.99]`}
`;

const ImageContainer = styled.div`
  ${tw`h-40 w-full bg-gray-200 rounded-t-2xl relative overflow-hidden`}
`;

const Image = styled.img`
  ${tw`w-full h-full object-cover`}
`;

const PlayButton = styled.button<{ $isPlaying: boolean }>(({ $isPlaying }) => [
  tw`absolute top-[136px] right-6 w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg z-10 overflow-hidden`,
  $isPlaying ? tw`bg-black text-white` : tw`bg-white text-black border border-gray-100`,
]);

const IconContainer = styled(motion.div)`
  ${tw`absolute inset-0 flex items-center justify-center`}
`;

const PlayIconContainer = styled(motion.div)`
  ${tw`absolute inset-0 flex items-center justify-center pl-1`}
`;

const InfoContainer = styled.div`
  ${tw`p-5 pt-7`}
`;

const InfoContent = styled.div`
  ${tw`flex items-start gap-4`}
`;

const NumberCircle = styled.div`
  ${tw`w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0`}
`;

const NumberText = styled.span`
  ${tw`text-sm font-bold text-gray-500`}
`;

const TextContent = styled.div`
  ${tw`flex-1`}
`;

const Title = styled.h3`
  ${tw`text-xl font-bold text-gray-900 mb-1 leading-tight`}
`;

const Duration = styled.p`
  ${tw`text-base font-medium text-gray-500`}
`;

export const AudioStopCard = memo<AudioStopCardProps>(({
  item,
  index = 0,
  isActive = false,
  isPlaying = false,
  isCompleted = false,
  onClick,
  onPlayPause
}) => {
  return (
    <OuterContainer>
      <CardContainer onClick={onClick} className="group">
        <ImageContainer>
          <Image src={item.image} alt={item.title} />
          <AnimatedCheckmark
            isVisible={isCompleted}
            uniqueKey={item.id}
          />
        </ImageContainer>

        {onPlayPause && (
          <PlayButton
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            $isPlaying={isActive && isPlaying}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {isActive && isPlaying ? (
                <IconContainer
                  key="pause"
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={iconTransition}
                >
                  <Pause size={20} fill="currentColor" />
                </IconContainer>
              ) : (
                <PlayIconContainer
                  key="play"
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={iconTransition}
                >
                  <Play size={20} fill="currentColor" />
                </PlayIconContainer>
              )}
            </AnimatePresence>
          </PlayButton>
        )}

        <InfoContainer>
          <InfoContent>
            <NumberCircle>
              <NumberText>{index + 1}</NumberText>
            </NumberCircle>
            <TextContent>
              <Title>{item.title}</Title>
              <Duration>{item.duration}</Duration>
            </TextContent>
          </InfoContent>
        </InfoContainer>
      </CardContainer>
    </OuterContainer>
  );
});