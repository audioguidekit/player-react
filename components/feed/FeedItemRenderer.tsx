import React from 'react';
import { FeedItem } from '../../types';
import { AudioStopCard } from './AudioStopCard';
import { TextCard } from './TextCard';
import { ImageTextCard } from './ImageTextCard';
import { ThreeDObjectCard } from './ThreeDObjectCard';
import { VideoCard } from './VideoCard';
import { HeadlineCard } from './HeadlineCard';

interface FeedItemRendererProps {
  item: FeedItem;
  index?: number;
  isActive?: boolean;
  isPlaying?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  onPlayPause?: () => void;
}

export const FeedItemRenderer: React.FC<FeedItemRendererProps> = ({
  item,
  index = 0,
  isActive = false,
  isPlaying = false,
  isCompleted = false,
  onClick,
  onPlayPause
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
      return <TextCard item={item} />;
    case 'image-text':
      return <ImageTextCard item={item} />;
    case '3d-object':
      return <ThreeDObjectCard item={item} />;
    case 'video':
      return <VideoCard item={item} />;
    case 'headline':
      return <HeadlineCard item={item} />;
    default:
      return null;
  }
};
