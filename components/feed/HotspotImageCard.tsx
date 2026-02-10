import React, { memo, useState, useCallback } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { HotspotImageStop } from '../../types';
import { RichText } from '../RichText';
import { HotspotPin } from '../HotspotPin';

interface HotspotImageCardProps {
  item: HotspotImageStop;
}

const Container = styled.div`
  ${tw`overflow-hidden mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const ImageWrapper = styled.div`
  ${tw`relative w-full`}
`;

const Image = styled.img`
  ${tw`w-full block`}
`;

const CaptionArea = styled.div`
  ${tw`px-6 py-3`}
`;

const Caption = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.imageCaption.textColor};
`;

export const HotspotImageCard = memo<HotspotImageCardProps>(({ item }) => {
  const [openPin, setOpenPin] = useState<number | null>(null);

  const handleToggle = useCallback((index: number) => {
    setOpenPin((prev) => (prev === index ? null : index));
  }, []);

  const handleClose = useCallback(() => {
    setOpenPin(null);
  }, []);

  return (
    <Container>
      <ImageWrapper>
        <Image src={item.image} alt={item.imageAlt || ''} />
        {item.hotspots.map((hotspot, i) => (
          <HotspotPin
            key={i}
            x={hotspot.x}
            y={hotspot.y}
            title={hotspot.title}
            description={hotspot.description}
            isOpen={openPin === i}
            onToggle={() => handleToggle(i)}
            onClose={handleClose}
          />
        ))}
      </ImageWrapper>

      {item.caption && (
        <CaptionArea>
          <Caption><RichText content={item.caption} /></Caption>
        </CaptionArea>
      )}
    </Container>
  );
});
