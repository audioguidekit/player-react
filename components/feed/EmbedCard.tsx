import React, { memo, useMemo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { EmbedStop } from '../../types';
import { RichText } from '../RichText';

interface EmbedCardProps {
  item: EmbedStop;
}

const Container = styled.div`
  ${tw`overflow-hidden mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const IframeWrapper = styled.div<{ $paddingTop: string }>`
  ${tw`relative w-full overflow-hidden`}
  padding-top: ${({ $paddingTop }) => $paddingTop};
`;

const StyledIframe = styled.iframe`
  ${tw`absolute inset-0 w-full h-full border-0`}
`;

const CaptionArea = styled.div`
  ${tw`px-6 py-3`}
`;

const Caption = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.imageCaption.textColor};
`;

function parseAspectRatio(ratio?: string): string {
  if (!ratio) return '56.25%'; // 16:9 default
  const parts = ratio.split(':');
  if (parts.length !== 2) return '56.25%';
  const w = parseFloat(parts[0]);
  const h = parseFloat(parts[1]);
  if (!w || !h) return '56.25%';
  return `${(h / w) * 100}%`;
}

function toPrivacyUrl(url: string): string {
  // YouTube → youtube-nocookie.com
  return url
    .replace('://www.youtube.com/', '://www.youtube-nocookie.com/')
    .replace('://youtube.com/', '://www.youtube-nocookie.com/');
}

function getAllowList(embedType?: string): string {
  if (embedType === 'youtube') return 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  if (embedType === 'spotify') return 'encrypted-media';
  return '';
}

export const EmbedCard = memo<EmbedCardProps>(({ item }) => {
  const isSpotify = item.embedType === 'spotify';

  const paddingTop = useMemo(() => {
    if (isSpotify) return '80px'; // Fixed compact height for Spotify
    return parseAspectRatio(item.aspectRatio);
  }, [item.aspectRatio, isSpotify]);

  const embedUrl = useMemo(() => {
    if (item.embedType === 'youtube') return toPrivacyUrl(item.embedUrl);
    return item.embedUrl;
  }, [item.embedUrl, item.embedType]);

  const wrapperStyle = isSpotify ? { paddingTop: 0, height: '80px' } : {};

  return (
    <Container>
      <IframeWrapper $paddingTop={isSpotify ? '0' : paddingTop} style={wrapperStyle}>
        <StyledIframe
          src={embedUrl}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          allow={getAllowList(item.embedType)}
          style={isSpotify ? { position: 'relative', height: '80px' } : undefined}
        />
      </IframeWrapper>

      {item.caption && (
        <CaptionArea>
          <Caption><RichText content={item.caption} /></Caption>
        </CaptionArea>
      )}
    </Container>
  );
});
