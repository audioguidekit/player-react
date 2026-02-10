import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { VideoStop } from '../../types';
import { RichText } from '../RichText';

interface VideoCardProps {
  item: VideoStop;
}

const Container = styled.div`
  ${tw`overflow-hidden mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const VideoContainer = styled.div`
  ${tw`w-full aspect-video`}
`;

const Video = styled.video`
  ${tw`w-full h-full`}
`;

const CaptionContainer = styled.div`
  ${tw`p-6`}
`;

const Caption = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.cards.textColor};
`;

export const VideoCard = memo<VideoCardProps>(({ item }) => {
  return (
    <Container>
      <VideoContainer>
        <Video src={item.videoUrl} controls playsInline>
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
