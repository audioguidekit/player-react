import React from 'react';
import { ClockIcon } from '@phosphor-icons/react/dist/csr/Clock';
import { PathIcon } from '@phosphor-icons/react/dist/csr/Path';
import tw from 'twin.macro';
import styled from 'styled-components';
import { TourData } from '../types';
import { useTranslation } from '../src/translations';
import { useHaptics } from '../src/hooks/useHaptics';
import { getAppConfig } from '../src/services/tourDiscovery';

interface TourSelectionCardProps {
  tour: TourData;
  onClick: () => void;
}

const Card = styled.button`
  ${tw`w-full text-left flex flex-col overflow-hidden`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  /* Single press effect on the whole card: one transform, one GPU layer, scaled
     from the center so the cover and body move together (matches AudioStopCard). */
  transition: transform 0.15s ease-out;
  transform-origin: center;
  will-change: transform;

  &:active {
    transform: scale(0.98);
  }
`;

const Cover = styled.div<{ $fallback?: string }>`
  ${tw`relative w-full`}
  aspect-ratio: 16 / 9;
  background-color: ${({ theme, $fallback }) => $fallback || theme.cards.image.placeholderColor};
`;

const CoverImage = styled.img`
  ${tw`absolute inset-0 w-full h-full object-cover`}
`;

const Body = styled.div`
  ${tw`flex items-center gap-3 p-4`}
`;

const TextBlock = styled.div`
  ${tw`flex-1 min-w-0`}
`;

const Title = styled.h2`
  ${tw`mb-1 tracking-tight`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  font-size: ${({ theme }) => theme.cards.titleFontSize};
  font-weight: ${({ theme }) => theme.cards.titleFontWeight};
  color: ${({ theme }) => theme.cards.textColor};
`;

const Description = styled.p`
  ${tw`mb-3 leading-relaxed`}
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  font-size: ${({ theme }) => theme.startCard.descriptionFontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const MetaContainer = styled.div`
  ${tw`flex items-center gap-5 uppercase tracking-wider`}
  font-family: ${({ theme }) =>
    theme?.typography?.fontFamily?.numbers
      ? theme.typography.fontFamily.numbers.join(', ')
      : theme?.typography?.fontFamily?.sans?.join(', ') || 'Inter, sans-serif'};
  font-size: ${({ theme }) => theme.startCard.metaFontSize};
  font-weight: ${({ theme }) => theme.startCard.metaFontWeight};
  color: ${({ theme }) => theme.startCard.metaColor};
`;

const MetaItem = styled.div`
  ${tw`flex items-center gap-2`}
`;

export const TourSelectionCard = React.memo<TourSelectionCardProps>(({ tour, onClick }) => {
  const { t } = useTranslation();
  const triggerHaptic = useHaptics();

  const isVideo = tour.image?.match(/\.(mp4|webm|ogg)$/i);

  // App-level card display toggles (all tours, no per-tour override). Title is always shown.
  const { tourCard } = getAppConfig();
  const showImage = tourCard?.showImage !== false;
  const showDescription = tourCard?.showDescription !== false;
  const showMeta = tourCard?.showMeta !== false;
  const stopsCount = tour.stops.filter(item => item.type !== 'rating').length;

  return (
    <Card
      onClick={() => {
        triggerHaptic();
        onClick();
      }}
    >
      {showImage && (
        <Cover $fallback={tour.imageColor}>
          {tour.image && !isVideo && <CoverImage src={tour.image} alt={tour.title} loading="lazy" />}
        </Cover>
      )}
      <Body>
        <TextBlock>
          <Title>{tour.title}</Title>
          {showDescription && <Description>{tour.description}</Description>}
          {showMeta && (
            <MetaContainer>
              <MetaItem>
                <ClockIcon size={16} />
                <span>{tour.totalDuration}</span>
              </MetaItem>
              <MetaItem>
                <PathIcon size={16} />
                <span>{stopsCount} {t.startCard.stops}</span>
              </MetaItem>
            </MetaContainer>
          )}
        </TextBlock>
      </Body>
    </Card>
  );
}, (prev, next) => prev.tour.id === next.tour.id && prev.tour.language === next.tour.language);
