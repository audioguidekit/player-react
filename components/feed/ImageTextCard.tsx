import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { ImageTextStop } from '../../types';

interface ImageTextCardProps {
  item: ImageTextStop;
}

const Container = styled.div`
  ${tw`bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100`}
`;

const ImageContainer = styled.div`
  ${tw`w-full h-64 overflow-hidden`}
`;

const Image = styled.img`
  ${tw`w-full h-full object-cover`}
`;

const ContentContainer = styled.div`
  ${tw`p-6`}
`;

const Text = styled.p`
  ${tw`text-gray-700 leading-relaxed`}
`;

export const ImageTextCard = memo<ImageTextCardProps>(({ item }) => {
  return (
    <Container>
      <ImageContainer>
        <Image src={item.image} alt="Content" />
      </ImageContainer>
      <ContentContainer>
        <Text>{item.content}</Text>
      </ContentContainer>
    </Container>
  );
});
