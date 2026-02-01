import React from 'react';
import { StarIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { RatingStop } from '../../types';
import { useRating } from '../../context/RatingContext';
import { useTranslation } from '../../src/translations';

interface RatingCardProps {
  item: RatingStop;
  onOpenRatingSheet?: () => void;
}

const Container = styled.div`
  ${tw`relative p-6 mb-4 cursor-pointer transition-transform active:scale-[0.99] overflow-hidden`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const SuccessContainer = styled(motion.div)`
  ${tw`relative p-10 mb-4 cursor-pointer transition-transform active:scale-[0.99] overflow-hidden`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const CenterContent = styled.div`
  ${tw`text-center`}
`;

const SuccessIconCircle = styled.div`
  ${tw`w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto`}
  background-color: ${({ theme }) => `${theme.status.success}20`};
  color: ${({ theme }) => theme.status.success};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.cards.titleFontSize};
  font-weight: ${({ theme }) => theme.cards.titleFontWeight};
  color: ${({ theme }) => theme.cards.textColor};
`;

const Description = styled.p`
  ${tw`text-base`}
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const HeaderSection = styled.div`
  ${tw`text-center mb-6`}
`;

const StarsContainer = styled.div`
  ${tw`flex justify-center gap-3 mb-2`}
`;

const StarButton = styled.button`
  ${tw`transition-transform focus:outline-none active:scale-95`}
`;

const StyledStar = styled(StarIcon)<{ $isActive: boolean }>`
  color: ${({ $isActive, theme }) => $isActive ? theme.status.warning : theme.colors.border.dark};
`;

const HintContainer = styled.div`
  ${tw`h-6 mb-4 relative w-full flex justify-center overflow-visible`}
`;

const HintText = styled(motion.span)`
  ${tw`text-sm font-normal absolute top-0`}
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const RatingCard: React.FC<RatingCardProps> = ({ item, onOpenRatingSheet }) => {
  const { rating, setRating, isSubmitted } = useRating();
  const { t } = useTranslation();

  const handleStarClick = (star: number) => {
    setRating(star);
    // Open the rating sheet to continue with feedback and email
    if (onOpenRatingSheet) {
      onOpenRatingSheet();
    }
  };

  if (isSubmitted) {
    return (
      <SuccessContainer
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CenterContent>
          <SuccessIconCircle>
            <CheckCircleIcon size={40} weight="bold" />
          </SuccessIconCircle>
          <Title>{t.rating.thankYou}</Title>
          <Description>{t.rating.appreciateFeedback}</Description>
        </CenterContent>
      </SuccessContainer>
    );
  }

  return (
    <Container>
      <HeaderSection>
        <Title>
          {item.question || t.rating.title}
        </Title>
        <Description>{item.description || t.rating.subtitle}</Description>
      </HeaderSection>

      {/* Stars */}
      <StarsContainer>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarButton
            key={star}
            onClick={() => handleStarClick(star)}
          >
            <StyledStar
              size={36}
              weight={rating >= star ? 'fill' : 'regular'}
              $isActive={rating >= star}
            />
          </StarButton>
        ))}
      </StarsContainer>

      {/* Hint Text */}
      <HintContainer>
        <HintText
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {t.rating.tapToRate}
        </HintText>
      </HintContainer>
    </Container>
  );
};
