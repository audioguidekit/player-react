import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { VideoStop } from '../../types';

interface VideoCardProps {
  item: VideoStop;
}

const Container = styled.div`
  ${tw`bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100`}
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
  ${tw`text-gray-700 text-sm leading-relaxed`}
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
          <Caption>{item.caption}</Caption>
        </CaptionContainer>
      )}
    </Container>
  );
});
