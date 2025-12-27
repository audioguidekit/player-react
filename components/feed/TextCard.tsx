import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { TextStop } from '../../types';

interface TextCardProps {
  item: TextStop;
}

const Container = styled.div`
  ${tw`p-6 mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.cornerRadius};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const Text = styled.p`
  ${tw`leading-relaxed`}
  color: ${({ theme }) => theme.cards.textColor};
`;

export const TextCard = memo<TextCardProps>(({ item }) => {
  return (
    <Container>
      <Text>{item.content}</Text>
    </Container>
  );
});
