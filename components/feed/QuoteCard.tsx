import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { QuotesIcon } from '@phosphor-icons/react/dist/csr/Quotes';
import { QuoteStop } from '../../types';
import { scaled } from '../../src/textSize/textSize';

interface QuoteCardProps {
  item: QuoteStop;
}

const Container = styled.div`
  ${tw`p-6 mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const QuoteMarkWrapper = styled.div`
  ${tw`mb-4`}
  color: ${({ theme }) => theme.colors.border.dark};
`;

const QuoteText = styled.p`
  ${tw`text-lg leading-relaxed mb-6`}
  font-size: ${scaled('1.125rem')};
  color: ${({ theme }) => theme.cards.textColor};
`;

const AuthorName = styled.div`
  ${tw`text-sm font-medium`}
  font-size: ${scaled('0.875rem')};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const AuthorYear = styled.div`
  ${tw`text-xs mt-0.5`}
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const QuoteCard = memo<QuoteCardProps>(({ item }) => {
  return (
    <Container>
<QuoteMarkWrapper>
        <QuotesIcon size={40} weight="fill" />
      </QuoteMarkWrapper>
      <QuoteText>{item.quote}</QuoteText>
      <AuthorName>{item.author}</AuthorName>
      {item.year && <AuthorYear>{item.year}</AuthorYear>}
    </Container>
  );
});
