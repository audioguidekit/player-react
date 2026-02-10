import React, { useMemo, useState, useCallback } from 'react';
import Lightbox from 'yet-another-react-lightbox-lite';
import 'yet-another-react-lightbox-lite/styles.css';
import { RichText } from './RichText';

export interface GalleryItem {
  src: string;
  alt?: string;
  caption?: string;
  credit?: string;
}

interface ImageLightboxProps {
  isOpen: boolean;
  src?: string;
  alt?: string;
  caption?: string;
  credit?: string;
  images?: GalleryItem[];
  initialIndex?: number;
  onClose: () => void;
}

declare module 'yet-another-react-lightbox-lite' {
  interface GenericSlide {
    caption?: string;
    credit?: string;
  }
}

const slideFooter = ({ slide }: { slide: { caption?: string; credit?: string } }) =>
  (slide.caption || slide.credit) ? (
    <div style={{ width: '100%', padding: '12px 24px', textAlign: 'center' }}>
      {slide.caption && (
        <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
          <RichText content={slide.caption} />
        </p>
      )}
      {slide.credit && (
        <p style={{ fontSize: '0.75rem', fontStyle: 'italic', marginTop: 4, color: 'rgba(255,255,255,0.5)' }}>
          <RichText content={slide.credit} />
        </p>
      )}
    </div>
  ) : null;

const portalStyles = { '--yarll__backdrop_color': 'rgba(0, 0, 0, 0.92)' } as React.CSSProperties;
const styles = { portal: portalStyles };
const render = { slideFooter };

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  src,
  alt,
  caption,
  credit,
  images,
  initialIndex = 0,
  onClose,
}) => {
  const slides = useMemo(() => {
    if (images && images.length > 0) {
      return images.map((img) => ({
        src: img.src,
        alt: img.alt,
        caption: img.caption,
        credit: img.credit,
      }));
    }
    if (src) {
      return [{ src, alt, caption, credit }];
    }
    return [];
  }, [images, src, alt, caption, credit]);

  // Internal navigation index (for gallery swipe between slides)
  const [navIndex, setNavIndex] = useState(initialIndex);

  // Derive YARLL's index: number when open, undefined when closed
  const index = isOpen ? navIndex : undefined;

  // Reset navigation index when opening at a new position
  const prevOpenRef = React.useRef(false);
  if (isOpen && !prevOpenRef.current) {
    // Transitioning from closed → open: reset to initialIndex
    if (navIndex !== initialIndex) {
      setNavIndex(initialIndex);
    }
  }
  prevOpenRef.current = isOpen;

  const handleSetIndex = useCallback(
    (newIndex: number | undefined) => {
      if (newIndex == null || newIndex < 0) {
        onClose();
      } else {
        setNavIndex(newIndex);
      }
    },
    [onClose],
  );

  if (slides.length === 0) return null;

  return (
    <Lightbox
      slides={slides}
      index={index}
      setIndex={handleSetIndex}
      styles={styles}
      render={render}
    />
  );
};
