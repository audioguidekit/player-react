import React, { memo, useState } from 'react';
import { PlayIcon, PauseIcon } from '@phosphor-icons/react';
import { AudioStop } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { AnimatedCheckmark } from '../AnimatedCheckmark';
import { iconVariants, iconTransition } from '../../src/animations/variants';
import { RichText } from '../RichText';
import { ImageLightbox } from '../ImageLightbox';

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
  ${tw`relative cursor-pointer transition-transform active:scale-[0.99]`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const ImageContainer = styled.div`
  ${tw`h-40 w-full relative overflow-hidden`}
  background-color: ${({ theme }) => theme.cards.image.placeholderColor};
  border-top-left-radius: ${({ theme }) => theme.cards.borderRadius};
  border-top-right-radius: ${({ theme }) => theme.cards.borderRadius};
`;

const Image = styled.img`
  ${tw`w-full h-full object-cover`}
`;

const PlayButton = styled.button<{ $isPlaying: boolean }>(({ $isPlaying, theme }) => [
  tw`absolute top-[136px] right-6 w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg z-10 overflow-hidden`,
  $isPlaying && {
    backgroundColor: theme.miniPlayer.controls.playButtonBackground,
    color: theme.miniPlayer.controls.playButtonIcon,
  },
  !$isPlaying && {
    backgroundColor: theme.cards.backgroundColor,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.cards.borderColor}`,
  },
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
  ${tw`w-9 h-9 rounded-full flex items-center justify-center shrink-0`}
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

const NumberText = styled.span`
  ${tw`text-sm font-bold`}
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const TextContent = styled.div`
  ${tw`flex-1`}
`;

const Title = styled.h3`
  ${tw`text-xl font-bold mb-1 leading-tight`}
  color: ${({ theme }) => theme.cards.textColor};
`;

const Duration = styled.p`
  ${tw`text-base font-medium`}
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const CaptionArea = styled.div`
  ${tw`px-5 pt-2`}
`;

const Caption = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.imageCaption.textColor};
`;

const Credit = styled.p`
  ${tw`text-xs italic mt-0.5`}
  color: ${({ theme }) => theme.imageCaption.creditColor};
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <OuterContainer>
      <CardContainer onClick={onClick} className="group">
        <ImageContainer
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          style={{ cursor: 'pointer' }}
        >
          <Image src={item.image} alt={item.imageAlt || item.title} />
          <AnimatedCheckmark
            isVisible={isCompleted}
            uniqueKey={item.id}
          />
        </ImageContainer>

        {(item.imageCaption || item.imageCredit) && (
          <CaptionArea>
            {item.imageCaption && <Caption><RichText content={item.imageCaption} /></Caption>}
            {item.imageCredit && <Credit><RichText content={item.imageCredit} /></Credit>}
          </CaptionArea>
        )}

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
                  <PauseIcon size={20} weight="fill" />
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
                  <PlayIcon size={20} weight="fill" />
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
      <ImageLightbox
        isOpen={lightboxOpen}
        src={item.image}
        alt={item.imageAlt || item.title}
        caption={item.imageCaption}
        credit={item.imageCredit}
        onClose={() => setLightboxOpen(false)}
      />
    </OuterContainer>
  );
});