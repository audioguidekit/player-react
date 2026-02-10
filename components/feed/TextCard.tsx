import React, { memo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { TextStop } from '../../types';
import { RichText } from '../RichText';

interface TextCardProps {
  item: TextStop;
  index?: number;
  showNumber?: boolean;
}

const Container = styled.div`
  ${tw`p-6 mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const HeaderRow = styled.div`
  ${tw`flex items-center gap-3 mb-3`}
`;

const NumberContainer = styled.div`
  ${tw`relative flex items-center justify-center shrink-0`}
  width: 28px;
  height: 28px;
`;

const NumberCircle = styled.div`
  ${tw`absolute inset-0 rounded-full flex items-center justify-center`}
  background-color: ${({ theme }) => theme.stepIndicators.inactive.backgroundColor};
  border: 1px solid ${({ theme }) => theme.stepIndicators.inactive.borderColor};
`;

const NumberText = styled.span`
  font-family: ${({ theme }) =>
    theme?.typography?.fontFamily?.numbers
      ? theme.typography.fontFamily.numbers.join(', ')
      : theme?.typography?.fontFamily?.sans?.join(', ') || 'Inter, sans-serif'};
  font-size: ${({ theme }) => theme.cards.numberFontSize};
  font-weight: ${({ theme }) => theme.cards.numberFontWeight};
  color: ${({ theme }) => theme.stepIndicators.inactive.numberColor};
`;

const Title = styled.h3`
  ${tw`leading-tight flex-1`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  font-size: ${({ theme }) => theme.cards.titleFontSize};
  font-weight: ${({ theme }) => theme.cards.titleFontWeight};
  color: ${({ theme }) => theme.cards.textColor};
`;

const Text = styled.p`
  ${tw`leading-relaxed`}
  color: ${({ theme }) => theme.cards.textColor};
`;

export const TextCard = memo<TextCardProps>(({ item, index = 0, showNumber }) => {
  const shouldShowNumber = showNumber !== false;
  const hasHeader = shouldShowNumber || item.title;

  return (
    <Container>
      {hasHeader && (
        <HeaderRow>
          {shouldShowNumber && (
            <NumberContainer>
              <NumberCircle>
                <NumberText>{index + 1}</NumberText>
              </NumberCircle>
            </NumberContainer>
          )}
          {item.title && <Title>{item.title}</Title>}
        </HeaderRow>
      )}
      {item.content && (
        <Text>
          <RichText content={item.content} />
        </Text>
      )}
    </Container>
  );
});
