import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { TextStop } from '../../types';

interface TextCardProps {
  item: TextStop;
}

const Container = styled.div`
  ${tw`bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100`}
`;

const Text = styled.p`
  ${tw`text-gray-700 leading-relaxed`}
`;

export const TextCard = memo<TextCardProps>(({ item }) => {
  return (
    <Container>
      <Text>{item.content}</Text>
    </Container>
  );
});
