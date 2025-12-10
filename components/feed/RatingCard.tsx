import React from 'react';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { RatingStop } from '../../types';
import { useRating } from '../../context/RatingContext';

interface RatingCardProps {
  item: RatingStop;
}

const Container = styled.div`
  ${tw`bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100`}
`;

const SuccessContainer = styled(motion.div)`
  ${tw`bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100`}
`;

const CenterContent = styled.div`
  ${tw`text-center`}
`;

const SuccessIconCircle = styled.div`
  ${tw`w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4`}
`;

const Checkmark = styled.span`
  ${tw`text-2xl`}
`;

const Title = styled.h3`
  ${tw`text-xl font-bold text-gray-900 mb-2`}
`;

const Description = styled.p`
  ${tw`text-gray-500 text-base`}
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

const HintContainer = styled.div`
  ${tw`h-6 mb-4 relative w-full flex justify-center overflow-visible`}
`;

const HintText = styled(motion.span)`
  ${tw`text-sm text-gray-400 font-medium absolute top-0`}
`;

const FeedbackForm = styled(motion.div)`
  ${tw`w-full overflow-hidden flex flex-col gap-4`}
`;

const Textarea = styled.textarea`
  ${tw`w-full border border-gray-200 rounded-2xl p-4 text-base focus:outline-none focus:border-black resize-none h-28 bg-gray-50 text-gray-800 placeholder:text-gray-400 transition-colors`}
`;

const SubmitButton = styled.button<{ $disabled: boolean }>(({ $disabled }) => [
  tw`w-full py-4 rounded-full font-bold text-base transition-all duration-300`,
  $disabled && tw`bg-gray-100 text-gray-400 cursor-not-allowed`,
  !$disabled && tw`bg-black text-white shadow-lg active:scale-[0.98]`,
]);

export const RatingCard: React.FC<RatingCardProps> = ({ item }) => {
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
            <Checkmark>✓</Checkmark>
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
            <Star
              size={36}
              fill={rating >= star ? 'black' : 'transparent'}
              className={rating >= star ? 'text-black' : 'text-gray-300'}
              strokeWidth={1.5}
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
              Submit Feedback
            </SubmitButton>
          </FeedbackForm>
        )}
      </AnimatePresence>
    </Container>
  );
};