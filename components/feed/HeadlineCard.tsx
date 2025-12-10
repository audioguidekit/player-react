import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { HeadlineStop } from '../../types';

interface HeadlineCardProps {
  item: HeadlineStop;
}

const Container = styled.div`
  ${tw`py-4 mb-2`}
`;

const Headline = styled.h3`
  ${tw`text-2xl font-bold text-gray-900 uppercase tracking-wide`}
`;

const Underline = styled.div`
  ${tw`h-1 w-16 bg-black mt-2 rounded-full`}
`;

export const HeadlineCard = memo<HeadlineCardProps>(({ item }) => {
  return (
    <Container>
      <Headline>{item.text}</Headline>
      <Underline />
    </Container>
  );
});
