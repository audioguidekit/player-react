import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { VideoStop } from '../../types';
import { RichText } from '../RichText';
import { subtitlesNeedCors, usableSubtitles } from '../../src/video/subtitles';

interface VideoCardProps {
  item: VideoStop;
}

const Container = styled.div`
  ${tw`overflow-hidden mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const VideoContainer = styled.div`
  ${tw`w-full aspect-video`}
`;

const Video = styled.video`
  ${tw`w-full h-full`}
`;

const CaptionContainer = styled.div`
  ${tw`px-6 py-3`}
`;

const Caption = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.cards.textColor};
`;

export const VideoCard = memo<VideoCardProps>(({ item }) => {
  const subtitles = usableSubtitles(item.subtitles);
  const crossOrigin = subtitlesNeedCors(subtitles, window.location.href) ? 'anonymous' : undefined;

  return (
    <Container>
      <VideoContainer>
        <Video src={item.videoUrl} controls playsInline crossOrigin={crossOrigin}>
          {subtitles.map((track) => (
            <track key={`${track.srclang}-${track.src}`} kind="subtitles" src={track.src} srcLang={track.srclang} label={track.label} />
          ))}
          Your browser does not support the video tag.
        </Video>
      </VideoContainer>
      {item.caption && (
        <CaptionContainer>
          <Caption>
            <RichText content={item.caption} />
          </Caption>
        </CaptionContainer>
      )}
    </Container>
  );
});
