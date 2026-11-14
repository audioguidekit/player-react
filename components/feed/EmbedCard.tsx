import React, { memo, useMemo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { EmbedStop } from '../../types';
import { RichText } from '../RichText';
import { resolveEmbed } from './embedSecurity';
import { getAppConfig } from '../../src/services/tourDiscovery';
import { useTranslation } from '../../src/translations';

interface EmbedCardProps {
  item: EmbedStop;
}

const Container = styled.div`
  ${tw`overflow-hidden mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const IframeWrapper = styled.div<{ $paddingTop: string }>`
  ${tw`relative w-full overflow-hidden`}
  padding-top: ${({ $paddingTop }) => $paddingTop};
`;

const StyledIframe = styled.iframe`
  ${tw`absolute inset-0 w-full h-full border-0`}
`;

const Notice = styled.p`
  ${tw`px-6 py-8 text-sm text-center m-0`}
  color: ${({ theme }) => theme.imageCaption.textColor};
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

function getAllowList(embedType: string): string {
  if (embedType === 'youtube') return 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  if (embedType === 'spotify') return 'encrypted-media';
  return '';
}

export const EmbedCard = memo<EmbedCardProps>(({ item }) => {
  const { t } = useTranslation();
  const allowlist = getAppConfig().embedAllowlist;
  const resolution = useMemo(
    () => resolveEmbed(item.embedUrl, item.embedType, window.location.origin, allowlist),
    [item.embedUrl, item.embedType, allowlist],
  );

  // Not https, or on the player's own origin: show nothing rather than frame it.
  if (resolution.kind === 'invalid') return null;

  // The app limits embeds to certain websites and this one is not among them: a neutral notice,
  // without the address, instead of the content.
  if (resolution.kind === 'blocked') {
    return (
      <Container data-testid="embed-blocked">
        <Notice role="note">{t.embed.blocked}</Notice>
      </Container>
    );
  }
  const { frame } = resolution;
  // The type the embed was framed as: a "spotify" embed on another host is generic here too.
  const isSpotify = frame.type === 'spotify';
  const paddingTop = parseAspectRatio(item.aspectRatio);

  const wrapperStyle = isSpotify ? { paddingTop: 0, height: '80px' } : {};

  return (
    <Container>
      <IframeWrapper $paddingTop={isSpotify ? '0' : paddingTop} style={wrapperStyle}>
        <StyledIframe
          src={frame.src}
          loading="lazy"
          sandbox={frame.sandbox}
          allow={getAllowList(frame.type)}
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
