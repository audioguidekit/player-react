import React from 'react';
import { StarIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { RatingStop } from '../../types';
import { useRating } from '../../context/RatingContext';

interface RatingCardProps {
  item: RatingStop;
}

const Container = styled.div`
  ${tw`relative p-6 mb-4 cursor-pointer transition-transform active:scale-[0.99] overflow-hidden`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const SuccessContainer = styled(motion.div)`
  ${tw`relative p-10 mb-4 cursor-pointer transition-transform active:scale-[0.99] overflow-hidden`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
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

const Checkmark = styled.span`
  ${tw`text-2xl`}
`;

const Title = styled.h3`
  ${tw`text-xl font-bold`}
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

const StyledStar = styled(StarIcon) <{ $isActive: boolean }>`
  color: ${({ $isActive, theme }) => $isActive ? theme.status.warning : theme.colors.border.dark};
`;

const HintContainer = styled.div`
  ${tw`h-6 mb-4 relative w-full flex justify-center overflow-visible`}
`;

const HintText = styled(motion.span)`
  ${tw`text-sm font-normal absolute top-0`}
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const FeedbackForm = styled(motion.div)`
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

const SubmitButton = styled.button<{ $disabled: boolean }>(({ $disabled, theme }) => [
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

export const RatingCard = React.memo<RatingCardProps>(({ item }) => {
  const { rating, setRating, feedback, setFeedback, isSubmitted, submitRating } = useRating();

  const handleSubmit = () => {
    if (feedback.trim().length === 0) return;
    submitRating();
  };

  const isFeedbackButtonDisabled = feedback.trim().length === 0;

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
          <Title>Thank you!</Title>
          <Description>We appreciate your feedback.</Description>
        </CenterContent>
      </SuccessContainer>
    );
  }

  return (
    <Container>
      <HeaderSection>
        <Title>
          {item.question || 'How did you like this tour?'}
        </Title>
        <Description>{item.description || 'Your feedback is valuable for us!'}</Description>
      </HeaderSection>

      {/* Stars */}
      <StarsContainer>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarButton
            key={star}
            onClick={() => setRating(star)}
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
        <AnimatePresence mode="wait">
          {rating === 0 ? (
            <HintText
              key="hint-start"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              Tap to rate
            </HintText>
          ) : (
            <HintText
              key="hint-details"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              Mind sharing more details?
            </HintText>
          )}
        </AnimatePresence>
      </HintContainer>

      {/* Feedback Form */}
      <AnimatePresence>
        {rating > 0 && (
          <FeedbackForm
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe what you liked or disliked..."
            />

            <SubmitButton
              onClick={handleSubmit}
              disabled={isFeedbackButtonDisabled}
              $disabled={isFeedbackButtonDisabled}
            >
              Submit feedback
            </SubmitButton>
          </FeedbackForm>
        )}
      </AnimatePresence>
    </Container>
  );
}, (prevProps, nextProps) => {
  return prevProps.item?.id === nextProps.item?.id;
});