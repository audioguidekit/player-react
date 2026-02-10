import React from 'react';
import { Stop } from '../../types';
import { AudioStopCard } from './AudioStopCard';
import { TextCard } from './TextCard';
import { ImageTextCard } from './ImageTextCard';
import { ThreeDObjectCard } from './ThreeDObjectCard';
import { VideoCard } from './VideoCard';
import { HeadlineCard } from './HeadlineCard';
import { RatingCard } from './RatingCard';
import { EmailCard } from './EmailCard';
import { QuoteCard } from './QuoteCard';
import { ImageGalleryCard } from './ImageGalleryCard';
import { ImageComparisonCard } from './ImageComparisonCard';
import { HotspotImageCard } from './HotspotImageCard';
import { EmbedCard } from './EmbedCard';

interface FeedItemRendererProps {
  item: Stop;
  index?: number;
  isActive?: boolean;
  isPlaying?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  onPlayPause?: () => void;
  onOpenRatingSheet?: () => void;
  compactLayout?: boolean;
  showNumber?: boolean;
}

export const FeedItemRenderer: React.FC<FeedItemRendererProps> = ({
  item,
  index = 0,
  isActive = false,
  isPlaying = false,
  isCompleted = false,
  onClick,
  onPlayPause,
  onOpenRatingSheet,
  compactLayout = false,
  showNumber
}) => {
  switch (item.type) {
    case 'audio':
      return (
        <AudioStopCard
          item={item}
          index={index}
          isActive={isActive}
          isPlaying={isPlaying}
          isCompleted={isCompleted}
          onClick={onClick}
          onPlayPause={onPlayPause}
        />
      );
    case 'text':
      return <TextCard item={item} index={index} showNumber={showNumber} />;
    case 'image-text':
      return <ImageTextCard item={item} index={index} showNumber={showNumber} />;
    case '3d-object':
      return <ThreeDObjectCard item={item} />;
    case 'video':
      return <VideoCard item={item} />;
    case 'headline':
      return <HeadlineCard item={item} />;
    case 'rating':
      return <RatingCard item={item} onOpenRatingSheet={onOpenRatingSheet} compactLayout={compactLayout} />;
    case 'email':
      return <EmailCard item={item} />;
    case 'quote':
      return <QuoteCard item={item} />;
    case 'image-gallery':
      return <ImageGalleryCard item={item} />;
    case 'image-comparison':
      return <ImageComparisonCard item={item} />;
    case 'hotspot-image':
      return <HotspotImageCard item={item} />;
    case 'embed':
      return <EmbedCard item={item} />;
    default:
      return null;
  }
};
