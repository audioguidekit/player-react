import React, { memo, useState, useRef, useCallback } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { ImageComparisonStop } from '../../types';
import { RichText } from '../RichText';

interface ImageComparisonCardProps {
  item: ImageComparisonStop;
}

const Container = styled.div`
  ${tw`overflow-hidden mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const ComparisonWrapper = styled.div`
  ${tw`relative w-full h-64 overflow-hidden select-none`}
  touch-action: none;
  cursor: ew-resize;
`;

const BaseImage = styled.img`
  ${tw`absolute inset-0 w-full h-full object-cover`}
  pointer-events: none;
  -webkit-user-drag: none;
`;

const OverlayImage = styled.img<{ $position: number }>`
  ${tw`absolute inset-0 w-full h-full object-cover`}
  clip-path: inset(0 0 0 ${({ $position }) => $position}%);
  pointer-events: none;
  -webkit-user-drag: none;
`;

const SliderLine = styled.div<{ $position: number }>`
  ${tw`absolute top-0 bottom-0 z-10`}
  left: ${({ $position }) => $position}%;
  width: 2px;
  background-color: #FFFFFF;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  transform: translateX(-1px);
`;

const SliderHandle = styled.div`
  ${tw`absolute top-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center`}
  transform: translate(-50%, -50%);
  background-color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const HandleArrows = styled.span`
  ${tw`text-xs font-bold select-none`}
  color: #333333;
  letter-spacing: 2px;
`;

const Label = styled.div<{ $side: 'left' | 'right' }>`
  ${tw`absolute bottom-3 z-10 px-2 py-1 rounded text-xs font-medium`}
  ${({ $side }) => $side === 'left' ? tw`left-3` : tw`right-3`}
  background-color: rgba(0, 0, 0, 0.6);
  color: #FFFFFF;
`;

const CaptionArea = styled.div`
  ${tw`px-6 py-3`}
`;

const Caption = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.imageCaption.textColor};
`;

export const ImageComparisonCard = memo<ImageComparisonCardProps>(({ item }) => {
  const [position, setPosition] = useState(50);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return (
    <Container>
      <ComparisonWrapper
        ref={wrapperRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <BaseImage src={item.before} alt={item.beforeLabel || 'Before'} />
        <OverlayImage src={item.after} alt={item.afterLabel || 'After'} $position={position} />

        <SliderLine $position={position}>
          <SliderHandle>
            <HandleArrows>&#x25C0;&#x25B6;</HandleArrows>
          </SliderHandle>
        </SliderLine>

        {item.beforeLabel && <Label $side="left">{item.beforeLabel}</Label>}
        {item.afterLabel && <Label $side="right">{item.afterLabel}</Label>}
      </ComparisonWrapper>

      {item.caption && (
        <CaptionArea>
          <Caption><RichText content={item.caption} /></Caption>
        </CaptionArea>
      )}
    </Container>
  );
});
