import React from 'react';
import { motion, useTransform, MotionValue, useMotionTemplate } from 'framer-motion';
import { ChatCircleDotsIcon, CaretDownIcon } from '@phosphor-icons/react';
// Direct imports instead of wildcard to reduce bundle size (~80-120KB savings)
import { GB, CZ, DE, FR, IT, ES } from 'country-flag-icons/react/3x2';
import tw from 'twin.macro';
import styled from 'styled-components';
import { TourData, Language } from '../types';

// Map country codes to flag components
const flagComponents: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  GB, CZ, DE, FR, IT, ES
};

const Container = styled.div`
  ${tw`absolute inset-0 w-full h-full z-0 overflow-hidden`}
  background-color: ${({ theme }) => theme.mainContent.backgroundColor};
`;

const MediaContainer = styled(motion.div)`
  ${tw`relative w-full h-full origin-center`}
`;

const Video = styled.video`
  ${tw`w-full h-full object-cover`}
`;

const Image = styled.img`
  ${tw`w-full h-full object-cover`}
`;

const TopGradient = styled.div`
  ${tw`absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10`}
`;

const BottomGradient = styled.div`
  ${tw`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80`}
`;

const DarkOverlay = styled(motion.div)`
  ${tw`absolute inset-0 bg-black`}
`;

const TopButtonsContainer = styled.div`
  ${tw`absolute left-6 right-6 flex justify-between z-10`}
  top: calc(env(safe-area-inset-top, 0px) + 1rem);
`;

const ActionButton = styled.button`
  ${tw`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center transition-colors`}
  background-color: rgba(0, 0, 0, 0.4);
  color: #FFFFFF;
`;

const LanguageButton = styled.button<{ $iconOnly?: boolean }>`
  ${tw`backdrop-blur-md rounded-full flex items-center gap-2 transition-all active:scale-95`}
  height: 48px;
  padding: ${({ $iconOnly }) => $iconOnly ? '0 12px' : '0 12px'};
  background-color: rgba(0, 0, 0, 0.4);
  color: #FFFFFF;
  margin-left: auto; /* Stay on right side even when rating button is hidden */
`;

const LanguageFlag = styled.div`
  ${tw`flex items-center justify-center`}
  width: 36px;
  height: 24px;
  border-radius: 10px;
  overflow: hidden;

  svg {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 10px;
  }
`;

const LanguageName = styled.span`
  ${tw`font-normal`}
  font-family: ${({ theme }) =>
    theme?.typography?.fontFamily?.heading?.join(', ') ||
    theme?.typography?.fontFamily?.sans?.join(', ')
  };
  font-size: 15px;
`;

const ChevronIcon = styled(CaretDownIcon)`
  opacity: 0.8;
`;

interface TourStartProps {
  tour: TourData;
  selectedLanguage: Language;
  languages: Language[];
  onOpenRating: () => void;
  onOpenLanguage: () => void;
  sheetY?: MotionValue<number>;
  collapsedY?: number;
  isVisible?: boolean;
}

export const TourStart: React.FC<TourStartProps> = ({
  tour,
  selectedLanguage,
  languages,
  onOpenRating,
  onOpenLanguage,
  sheetY,
  collapsedY = 0,
  isVisible = true
}) => {
  // Check if the media is a video
  const isVideo = tour.image.match(/\.(mp4|webm|ogg)$/i);

  // Get the flag component dynamically
  const FlagIcon = flagComponents[selectedLanguage.countryCode] || GB;

  // Check if language label should be shown (default: true)
  const showLanguageLabel = tour.showLanguageLabel !== false;

  // Animation Transforms

  // 1. Scale image up to 110% when dragging down
  const scale = useTransform(
    sheetY || new MotionValue(0),
    [collapsedY, collapsedY + 200],
    [1, 1.1]
  );

  // 2. Parallax move (Image follows finger slightly when dragging down)
  const y = useTransform(
    sheetY || new MotionValue(0),
    [collapsedY, collapsedY + 200],
    [0, 50]
  );

  // 3. Overlay Opacity
  // Dragging Up (0 to collapsedY): Darkens (0.8 -> 0.3)
  // Dragging Down (collapsedY to +200): Fades out (0.3 -> 0)
  const overlayOpacity = useTransform(
    sheetY || new MotionValue(0),
    [0, collapsedY, collapsedY + 200],
    [0.8, 0.3, 0]
  );

  // 4. Blur Effect
  // Dragging Up (0 to collapsedY): Blurs (8px -> 0px)
  // Dragging Down: Remains 0px (clamped by default)
  const blurAmount = useTransform(
    sheetY || new MotionValue(0),
    [0, collapsedY],
    [8, 0]
  );

  const blurFilter = useMotionTemplate`blur(${blurAmount}px)`;

  return (
    <Container>
      {/* Background Image Area */}
      <MediaContainer style={{ scale, y, filter: blurFilter }}>
        {isVideo ? (
          <Video
            src={tour.image}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <Image
            src={tour.image}
            alt={tour.title}
          />
        )}

        {/* Existing Gradients for text readability (always present) */}
        <TopGradient />
        <BottomGradient />

        {/* Dynamic Dark Backdrop Overlay - Changes intensity based on drag */}
        <DarkOverlay style={{ opacity: overlayOpacity }} />

        {/* Top Buttons */}
        <TopButtonsContainer>
          {tour.collectFeedback !== false && (
            <ActionButton onClick={onOpenRating}>
              <ChatCircleDotsIcon size={28} weight="regular" />
            </ActionButton>
          )}
          {languages.length > 1 && (
            <LanguageButton onClick={onOpenLanguage} $iconOnly={!showLanguageLabel}>
              <LanguageFlag>
                <FlagIcon />
              </LanguageFlag>
              {showLanguageLabel && (
                <LanguageName>{selectedLanguage.name}</LanguageName>
              )}
              <ChevronIcon size={16} weight="bold" />
            </LanguageButton>
          )}
        </TopButtonsContainer>
      </MediaContainer>
    </Container>
  );
};