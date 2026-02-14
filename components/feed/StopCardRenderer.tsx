import React, { lazy, Suspense } from 'react';
import { Stop } from '../../types';
import { TextCard } from './TextCard';
import { ImageTextCard } from './ImageTextCard';

const ThreeDObjectCard = lazy(() => import('./ThreeDObjectCard').then(m => ({ default: m.ThreeDObjectCard })));
const VideoCard = lazy(() => import('./VideoCard').then(m => ({ default: m.VideoCard })));
const HeadlineCard = lazy(() => import('./HeadlineCard').then(m => ({ default: m.HeadlineCard })));
const RatingCard = lazy(() => import('./RatingCard').then(m => ({ default: m.RatingCard })));
const EmailCard = lazy(() => import('./EmailCard').then(m => ({ default: m.EmailCard })));
const QuoteCard = lazy(() => import('./QuoteCard').then(m => ({ default: m.QuoteCard })));
const ImageGalleryCard = lazy(() => import('./ImageGalleryCard').then(m => ({ default: m.ImageGalleryCard })));
const ImageComparisonCard = lazy(() => import('./ImageComparisonCard').then(m => ({ default: m.ImageComparisonCard })));
const HotspotImageCard = lazy(() => import('./HotspotImageCard').then(m => ({ default: m.HotspotImageCard })));
const EmbedCard = lazy(() => import('./EmbedCard').then(m => ({ default: m.EmbedCard })));

interface StopCardRendererProps {
  item: Stop;
  index?: number;
  onOpenRatingSheet?: () => void;
  compactLayout?: boolean;
  showNumber?: boolean;
}

export const StopCardRenderer: React.FC<StopCardRendererProps> = ({
  item,
  index = 0,
  onOpenRatingSheet,
  compactLayout = false,
  showNumber
}) => {
  switch (item.type) {
    case 'text':
      return <TextCard item={item} index={index} showNumber={showNumber} />;
    case 'image-text':
      return <ImageTextCard item={item} index={index} showNumber={showNumber} />;
    case '3d-object':
      return <Suspense fallback={null}><ThreeDObjectCard item={item} /></Suspense>;
    case 'video':
      return <Suspense fallback={null}><VideoCard item={item} /></Suspense>;
    case 'headline':
      return <Suspense fallback={null}><HeadlineCard item={item} /></Suspense>;
    case 'rating':
      return <Suspense fallback={null}><RatingCard item={item} onOpenRatingSheet={onOpenRatingSheet} compactLayout={compactLayout} /></Suspense>;
    case 'email':
      return <Suspense fallback={null}><EmailCard item={item} /></Suspense>;
    case 'quote':
      return <Suspense fallback={null}><QuoteCard item={item} /></Suspense>;
    case 'image-gallery':
      return <Suspense fallback={null}><ImageGalleryCard item={item} /></Suspense>;
    case 'image-comparison':
      return <Suspense fallback={null}><ImageComparisonCard item={item} /></Suspense>;
    case 'hotspot-image':
      return <Suspense fallback={null}><HotspotImageCard item={item} /></Suspense>;
    case 'embed':
      return <Suspense fallback={null}><EmbedCard item={item} /></Suspense>;
    default:
      return null;
  }
};
