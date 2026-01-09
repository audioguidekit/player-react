import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon, CheckCircleIcon, AtIcon } from '@phosphor-icons/react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { BottomSheet } from '../BottomSheet';
import { useRating } from '../../context/RatingContext';
import { useTranslation } from '../../src/translations';

interface RatingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
}

type RatingStep = 'RATING' | 'EMAIL' | 'THANKS';

const Container = styled.div`
  ${tw`p-6 pb-8 flex flex-col items-center`}
`;

const StepContainer = styled(motion.div)`
  ${tw`w-full flex flex-col items-center`}
`;

const Header = styled.div`
  ${tw`text-center mb-6`}
`;

const Title = styled.h3`
  ${tw`text-xl font-semibold mb-2`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
`;

const Description = styled.p`
  ${tw`text-base max-w-[280px]`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StarsContainer = styled.div`
  ${tw`flex justify-center gap-3 mb-2`}
`;

const StarButton = styled.button`
  ${tw`transition-transform focus:outline-none active:scale-95`}
`;

const StyledStar = styled(StarIcon) <{ $isActive: boolean }>`
  color: ${({ $isActive, theme }) => $isActive ? theme.status.warning : theme.colors.border.dark};
`;

const ContentContainer = styled.div`
  ${tw`w-full flex flex-col items-center`}
`;

const HintContainer = styled.div`
  ${tw`h-6 mb-4 relative w-full flex justify-center overflow-visible`}
`;

const HintText = styled(motion.span)`
  ${tw`text-sm font-normal absolute top-0`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const FormArea = styled(motion.div)`
  ${tw`w-full overflow-hidden flex flex-col gap-4`}
`;

const Textarea = styled.textarea`
  ${tw`w-full p-4 text-base focus:outline-none resize-none h-28 transition-colors`}
  border: 1px solid ${({ theme }) => theme.inputs.borderColor};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.inputs.backgroundColor};
  color: ${({ theme }) => theme.inputs.textColor};

  &::placeholder {
    color: ${({ theme }) => theme.inputs.placeholderColor};
  }

  &:focus {
    border-color: ${({ theme }) => theme.inputs.focusBorderColor};
  }
`;

const Input = styled.input`
  ${tw`w-full p-4 text-base focus:outline-none transition-colors`}
  border: 1px solid ${({ theme }) => theme.inputs.borderColor};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.inputs.backgroundColor};
  color: ${({ theme }) => theme.inputs.textColor};

  &::placeholder {
    color: ${({ theme }) => theme.inputs.placeholderColor};
  }

  &:focus {
    border-color: ${({ theme }) => theme.inputs.focusBorderColor};
  }
`;

const Button = styled.button<{ $disabled?: boolean }>(({ $disabled, theme }) => [
  tw`w-full py-4 rounded-full font-semibold text-base transition-all duration-300`,
  $disabled && {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.tertiary,
    cursor: 'not-allowed',
  },
  !$disabled && {
    backgroundColor: theme.buttons.primary.backgroundColor,
    color: theme.buttons.primary.textColor,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },
  !$disabled && tw`active:scale-[0.98]`,
]);

const SkipButton = styled.button`
  ${tw`w-full py-2 text-base font-medium transition-colors`}
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const IconCircle = styled.div`
  ${tw`w-16 h-16 rounded-full flex items-center justify-center mb-6`}
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SuccessIconCircle = styled.div`
  ${tw`w-20 h-20 rounded-full flex items-center justify-center mb-6`}
  background-color: ${({ theme }) => `${theme.status.success}20`};
  color: ${({ theme }) => theme.status.success};
`;

const SuccessTitle = styled.h3`
  ${tw`text-2xl font-semibold mb-2`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
`;

const SuccessDescription = styled.p`
  ${tw`text-base mb-8`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ButtonGroup = styled.div`
  ${tw`flex flex-col gap-3 w-full mt-4`}
`;

export const RatingSheet = React.memo<RatingSheetProps>(({ isOpen, onClose, onSubmit }) => {
  const {
    rating, setRating,
    feedback, setFeedback,
    email, setEmail,
    isSubmitted, submitRating
  } = useRating();

  const { t } = useTranslation();

  const [step, setStep] = useState<RatingStep>('RATING');

  // Sync step with submission state
  useEffect(() => {
    if (isOpen) {
      // Always start at RATING step to allow users to see/edit their previous submission
      setStep('RATING');
    }
  }, [isOpen]);

  const handleFeedbackSubmit = () => {
    // Proceed to email step
    setStep('EMAIL');
  };

  const handleEmailSubmit = () => {
    submitRating(); // Use context submit
    setStep('THANKS');
  };

  const handleSkip = () => {
    submitRating(); // Submit without email
    setStep('THANKS');
  };

  const handleFinalClose = () => {
    onClose();
  };

  // Button is disabled if no feedback text
  const isFeedbackButtonDisabled = feedback.trim().length === 0;

  // Email validation (simple check)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <Container>
        <AnimatePresence mode="wait" initial={false}>

          {/* STEP 1: RATING & FEEDBACK */}
          {step === 'RATING' && (
            <StepContainer
              key="rating-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <Header>
                <Title>{t.rating.title}</Title>
                <Description>{t.rating.subtitle}</Description>
              </Header>

              {/* Stars Container */}
              <StarsContainer>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarButton
                    key={star}
                    onClick={() => setRating(star)}
                  >
                    <StyledStar
                      size={36}
                      weight={rating >= star ? "fill" : "regular"}
                      $isActive={rating >= star}
                    />
                  </StarButton>
                ))}
              </StarsContainer>

              {/* Dynamic Content Container */}
              <ContentContainer>

                {/* Animated Hint Text */}
                <HintContainer>
                  <AnimatePresence mode="wait">
                    {rating === 0 ? (
                      <HintText
                        key="hint-start"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {t.rating.tapToRate}
                      </HintText>
                    ) : (
                      <HintText
                        key="hint-details"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {t.rating.shareDetails}
                      </HintText>
                    )}
                  </AnimatePresence>
                </HintContainer>

                {/* Form Area (Expands when rated) */}
                <AnimatePresence>
                  {rating > 0 && (
                    <FormArea
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    >
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={t.rating.feedbackPlaceholder}
                      />

                      <Button
                        onClick={handleFeedbackSubmit}
                        disabled={isFeedbackButtonDisabled}
                        $disabled={isFeedbackButtonDisabled}
                      >
                        {t.rating.next}
                      </Button>
                    </FormArea>
                  )}
                </AnimatePresence>
              </ContentContainer>
            </StepContainer>
          )}

          {/* STEP 2: EMAIL COLLECTION */}
          {step === 'EMAIL' && (
            <StepContainer
              key="email-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <IconCircle>
                <AtIcon size={32} weight="bold" />
              </IconCircle>

              <Header>
                <Title>{t.rating.stayInLoop}</Title>
                <Description>
                  {t.rating.emailInfo}
                </Description>
              </Header>

              <ContentContainer>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.rating.emailPlaceholder}
                />

                <ButtonGroup>
                  <Button
                    onClick={handleEmailSubmit}
                    disabled={!isEmailValid}
                    $disabled={!isEmailValid}
                  >
                    {t.rating.subscribe}
                  </Button>

                  <SkipButton onClick={handleSkip}>
                    {t.rating.skip}
                  </SkipButton>
                </ButtonGroup>
              </ContentContainer>
            </StepContainer>
          )}

          {/* STEP 3: THANKS */}
          {step === 'THANKS' && (
            <StepContainer
              key="thanks-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SuccessIconCircle>
                <CheckCircleIcon size={40} weight="bold" />
              </SuccessIconCircle>

              <SuccessTitle>{t.rating.thankYou}</SuccessTitle>
              <SuccessDescription>{t.rating.appreciateFeedback}</SuccessDescription>

              <Button onClick={handleFinalClose}>
                {t.rating.close}
              </Button>
            </StepContainer>
          )}

        </AnimatePresence>
      </Container>
    </BottomSheet>
  );
}, (prevProps, nextProps) => {
  return prevProps.isOpen === nextProps.isOpen;
});