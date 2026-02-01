import React from 'react';
import { CheckCircleIcon } from '@phosphor-icons/react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { BottomSheet } from '../BottomSheet';
import { useTranslation } from '../../src/translations';

interface TourCompleteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRateTour: () => void;
}

const Container = styled.div`
  ${tw`p-6 pt-2 flex flex-col items-center text-center pb-10`}
`;

const IconCircle = styled.div`
  ${tw`w-20 h-20 rounded-full flex items-center justify-center mb-6`}
  background-color: ${({ theme }) => `${theme.status.success}20`};
  color: ${({ theme }) => theme.status.success};
`;

const Title = styled.h2`
  ${tw`text-2xl font-bold mb-2`}
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Description = styled.p`
  ${tw`mb-8 max-w-xs`}
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const RateButton = styled.button`
  ${tw`w-full py-4 px-6 rounded-full flex items-center justify-center gap-2 mb-3 active:scale-[0.98] transition-transform`}
  background-color: ${({ theme }) => theme.buttons.primary.backgroundColor};
  color: ${({ theme }) => theme.buttons.primary.textColor};
  font-size: ${({ theme }) => theme.buttons.primary.fontSize};
  font-weight: ${({ theme }) => theme.buttons.primary.fontWeight};
  font-family: ${({ theme }) => theme.buttons.primary.fontFamily?.join(', ') || theme.typography?.fontFamily?.sans?.join(', ')};
`;

const SkipButton = styled.button`
  ${tw`w-full py-4 px-6 rounded-full active:scale-[0.98] transition-all`}
  background-color: ${({ theme }) => theme.buttons.secondary.backgroundColor};
  color: ${({ theme }) => theme.buttons.secondary.textColor};
  font-size: ${({ theme }) => theme.buttons.secondary.fontSize};
  font-weight: ${({ theme }) => theme.buttons.secondary.fontWeight};
  font-family: ${({ theme }) => theme.buttons.secondary.fontFamily?.join(', ') || theme.typography?.fontFamily?.sans?.join(', ')};
  border: 1px solid ${({ theme }) => theme.buttons.secondary.borderColor || 'transparent'};

  &:hover {
    background-color: ${({ theme }) => theme.buttons.secondary.hoverBackground || theme.buttons.secondary.backgroundColor};
  }
`;

export const TourCompleteSheet = React.memo<TourCompleteSheetProps>(({
  isOpen,
  onClose,
  onRateTour
}) => {
  const { t } = useTranslation();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <Container>
        <IconCircle>
          <CheckCircleIcon size={40} weight="bold" />
        </IconCircle>

        <Title>{t.tourComplete.title}</Title>
        <Description>
          {t.tourComplete.message}
        </Description>

        <RateButton
          onClick={() => {
            onClose();
            onRateTour();
          }}
        >
          <span>{t.tourComplete.rateTour}</span>
        </RateButton>

        <SkipButton onClick={onClose}>
          {t.tourComplete.skipRating}
        </SkipButton>
      </Container>
    </BottomSheet>
  );
}, (prevProps, nextProps) => {
  return prevProps.isOpen === nextProps.isOpen;
});
