import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { QuoteStop } from '../../types';

interface QuoteCardProps {
  item: QuoteStop;
}

const Container = styled.div`
  ${tw`p-6 mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.cornerRadius};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const AvatarContainer = styled.div`
  ${tw`flex justify-center mb-6`}
`;

const Avatar = styled.div`
  ${tw`w-16 h-16 rounded-full`}
  background-color: ${({ theme }) => theme.cards.image.placeholderColor};
  border: 2px solid ${({ theme }) => theme.cards.borderColor};
`;

const QuoteMark = styled.div`
  ${tw`text-6xl leading-none mb-4 font-serif`}
  color: ${({ theme }) => theme.colors.border.dark};
`;

const QuoteText = styled.p`
  ${tw`text-lg leading-relaxed mb-6`}
  color: ${({ theme }) => theme.cards.textColor};
`;

const AuthorInfo = styled.div`
  ${tw`text-sm font-medium`}
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const QuoteCard = memo<QuoteCardProps>(({ item }) => {
  return (
    <Container>
      <AvatarContainer>
        <Avatar />
      </AvatarContainer>
      <QuoteMark>"</QuoteMark>
      <QuoteText>{item.quote}</QuoteText>
      <AuthorInfo>
        {item.author}{item.year && `, ${item.year}`}
      </AuthorInfo>
    </Container>
  );
});
