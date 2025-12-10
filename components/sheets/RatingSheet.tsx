import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CircleCheckBig, Mail } from 'lucide-react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { BottomSheet } from '../BottomSheet';
import { useRating } from '../../context/RatingContext';

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
  ${tw`text-xl font-bold mb-2`}
`;

const Description = styled.p`
  ${tw`text-gray-500 text-base max-w-[280px]`}
`;

const StarsContainer = styled.div`
  ${tw`flex justify-center gap-3 mb-2`}
`;

const StarButton = styled.button`
  ${tw`transition-transform focus:outline-none active:scale-95`}
`;

const ContentContainer = styled.div`
  ${tw`w-full flex flex-col items-center`}
`;

const HintContainer = styled.div`
  ${tw`h-6 mb-4 relative w-full flex justify-center overflow-visible`}
`;

const HintText = styled(motion.span)`
  ${tw`text-sm text-gray-400 font-medium absolute top-0`}
`;

const FormArea = styled(motion.div)`
  ${tw`w-full overflow-hidden flex flex-col gap-4`}
`;

const Textarea = styled.textarea`
  ${tw`w-full border border-gray-200 rounded-2xl p-4 text-base focus:outline-none focus:border-black resize-none h-28 bg-gray-50 text-gray-800 placeholder:text-gray-400 transition-colors`}
`;

const Input = styled.input`
  ${tw`w-full border border-gray-200 rounded-2xl p-4 text-base focus:outline-none focus:border-black bg-gray-50 text-gray-800 placeholder:text-gray-400 transition-colors`}
`;

const Button = styled.button<{ $disabled?: boolean }>(({ $disabled }) => [
  tw`w-full py-4 rounded-3xl font-bold text-base transition-all duration-300`,
  $disabled && tw`bg-gray-100 text-gray-400 cursor-not-allowed`,
  !$disabled && tw`bg-black text-white shadow-lg active:scale-[0.98]`,
]);

const SkipButton = styled.button`
  ${tw`w-full py-2 text-base font-medium text-gray-400 transition-colors`}
`;

const IconCircle = styled.div`
  ${tw`w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-900`}
`;

const SuccessIconCircle = styled.div`
  ${tw`w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-600`}
`;

const SuccessTitle = styled.h3`
  ${tw`text-2xl font-bold mb-2`}
`;

const SuccessDescription = styled.p`
  ${tw`text-gray-500 text-base mb-8`}
`;

const ButtonGroup = styled.div`
  ${tw`flex flex-col gap-3 w-full mt-4`}
`;

export const RatingSheet: React.FC<RatingSheetProps> = ({ isOpen, onClose, onSubmit }) => {
  const {
    rating, setRating,
    feedback, setFeedback,
    email, setEmail,
    isSubmitted, submitRating
  } = useRating();

  const [step, setStep] = useState<RatingStep>('RATING');

  // Sync step with submission state
  useEffect(() => {
    if (isOpen) {
      if (isSubmitted) {
        setStep('THANKS');
      } else if (rating > 0 && feedback.length > 0) {
        // If they already rated and typed feedback (e.g. in the card), 
        // maybe we should start at EMAIL or keep them at RATING depending on UX.
        // Let's keep them at RATING so they can review, unless they submitted.
        setStep('RATING');
      } else {
        setStep('RATING');
      }
    }
  }, [isOpen, isSubmitted, rating, feedback.length]);

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
                <Title>How did you like this tour?</Title>
                <Description>Your feedback is valuable for us!</Description>
              </Header>

              {/* Stars Container */}
              <StarsContainer>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarButton
                    key={star}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      size={36}
                      fill={rating >= star ? "#FFD700" : "transparent"}
                      className={rating >= star ? "text-[#FFD700]" : "text-gray-300"}
                      strokeWidth={1.5}
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
                        placeholder="Describe what you liked or disliked..."
                      />

                      <Button
                        onClick={handleFeedbackSubmit}
                        disabled={isFeedbackButtonDisabled}
                        $disabled={isFeedbackButtonDisabled}
                      >
                        Next
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
                <Mail size={32} strokeWidth={1.5} />
              </IconCircle>

              <Header>
                <Title>Stay in the loop?</Title>
                <Description>
                  Enter your email to receive updates about new tours and exclusive offers from this property.
                </Description>
              </Header>

              <ContentContainer>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />

                <ButtonGroup>
                  <Button
                    onClick={handleEmailSubmit}
                    disabled={!isEmailValid}
                    $disabled={!isEmailValid}
                  >
                    Subscribe
                  </Button>

                  <SkipButton onClick={handleSkip}>
                    Skip
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
                <CircleCheckBig size={40} strokeWidth={1.5} />
              </SuccessIconCircle>

              <SuccessTitle>Thank you!</SuccessTitle>
              <SuccessDescription>We appreciate your feedback.</SuccessDescription>

              <Button onClick={handleFinalClose}>
                Close
              </Button>
            </StepContainer>
          )}

        </AnimatePresence>
      </Container>
    </BottomSheet>
  );
};