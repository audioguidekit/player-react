import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { QuoteStop } from '../../types';

interface QuoteCardProps {
  item: QuoteStop;
}

const Container = styled.div`
  ${tw`bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100`}
`;

const AvatarContainer = styled.div`
  ${tw`flex justify-center mb-6`}
`;

const Avatar = styled.div`
  ${tw`w-16 h-16 rounded-full bg-gray-200 border-2 border-gray-300`}
`;

const QuoteMark = styled.div`
  ${tw`text-6xl text-gray-300 leading-none mb-4 font-serif`}
`;

const QuoteText = styled.p`
  ${tw`text-gray-900 text-lg leading-relaxed mb-6`}
`;

const AuthorInfo = styled.div`
  ${tw`text-gray-600 text-sm font-medium`}
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
