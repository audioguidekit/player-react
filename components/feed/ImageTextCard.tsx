import React, { memo, useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { ImageTextStop } from '../../types';
import { RichText } from '../RichText';
import { ImageLightbox } from '../ImageLightbox';

interface ImageTextCardProps {
  item: ImageTextStop;
  index?: number;
  showNumber?: boolean;
}

const Container = styled.div`
  ${tw`overflow-hidden mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const ImageContainer = styled.div`
  ${tw`w-full h-64 overflow-hidden cursor-pointer`}
`;

const Image = styled.img`
  ${tw`w-full h-full object-cover`}
`;

const ContentContainer = styled.div`
  ${tw`p-6`}
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

const CaptionArea = styled.div`
  ${tw`px-6 pt-2`}
`;

const Caption = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.imageCaption.textColor};
`;

const Credit = styled.p`
  ${tw`text-xs italic mt-0.5`}
  color: ${({ theme }) => theme.imageCaption.creditColor};
`;

export const ImageTextCard = memo<ImageTextCardProps>(({ item, index = 0, showNumber }) => {
  const shouldShowNumber = showNumber !== false;
  const hasHeader = shouldShowNumber || item.title;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <Container>
      <ImageContainer onClick={() => setLightboxOpen(true)}>
        <Image src={item.image} alt={item.imageAlt || item.title || 'Content'} />
      </ImageContainer>
      <ImageLightbox
        isOpen={lightboxOpen}
        src={item.image}
        alt={item.imageAlt || item.title}
        caption={item.imageCaption}
        credit={item.imageCredit}
        onClose={() => setLightboxOpen(false)}
      />
      {(item.imageCaption || item.imageCredit) && (
        <CaptionArea>
          {item.imageCaption && <Caption><RichText content={item.imageCaption} /></Caption>}
          {item.imageCredit && <Credit><RichText content={item.imageCredit} /></Credit>}
        </CaptionArea>
      )}
      <ContentContainer>
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
      </ContentContainer>
    </Container>
  );
});
