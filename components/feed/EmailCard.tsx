import React, { useState } from 'react';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { motion } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { EmailStop } from '../../types';
import { useTranslation } from '../../src/translations';
import { RichText } from '../RichText';
import { useRating } from '../../context/RatingContext';
import { submitNow } from '../../src/analytics';

interface EmailCardProps {
  item: EmailStop;
}

const Container = styled.div`
  ${tw`p-6 mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const SuccessContainer = styled(motion.div)`
  ${tw`p-6 mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: ${({ theme }) => theme.cards.shadow};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const CenterContent = styled.div`
  ${tw`text-center`}
`;

const FlexContent = styled.div`
  ${tw`flex flex-col items-center`}
`;

const IconCircle = styled.div`
  ${tw`w-16 h-16 rounded-full flex items-center justify-center mb-4`}
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SuccessIconCircle = styled.div`
  ${tw`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}
  background-color: ${({ theme }) => `${theme.status.success}20`};
  color: ${({ theme }) => theme.status.success};
`;

const TextSection = styled.div`
  ${tw`text-center mb-6`}
`;

const Title = styled.h3`
  ${tw`text-xl font-bold mb-2`}
  color: ${({ theme }) => theme.cards.textColor};
`;

const Description = styled.p`
  ${tw`text-base`}
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const FormContainer = styled.div`
  ${tw`w-full flex flex-col gap-4`}
`;

const EmailInput = styled.input`
  ${tw`w-full p-4 text-base transition-colors`}
  border: 2px solid ${({ theme }) => theme.inputs.borderColor};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.inputs.backgroundColor};
  color: ${({ theme }) => theme.inputs.textColor};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.inputs.placeholderColor};
  }

  &:focus {
    border-color: ${({ theme }) => theme.inputs.focusBorderColor};
  }
`;

const ConsentLabel = styled.label`
  ${tw`flex items-start gap-3 text-sm text-left cursor-pointer`}
  color: ${({ theme }) => theme.colors.text.secondary};

  input {
    ${tw`mt-1 w-4 h-4 shrink-0`}
    accent-color: ${({ theme }) => theme.buttons.primary.backgroundColor};
  }
`;

const ErrorText = styled.p`
  ${tw`text-sm text-center`}
  color: ${({ theme }) => theme.status.error};
`;

const SubmitButton = styled.button<{ $isValid: boolean }>(({ $isValid, theme }) => [
  tw`w-full py-4 rounded-full font-semibold text-base transition-all duration-300`,
  !$isValid && {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.tertiary,
    cursor: 'not-allowed',
  },
  $isValid && {
    backgroundColor: theme.buttons.primary.backgroundColor,
    color: theme.buttons.primary.textColor,
    boxShadow: theme.cards.shadow,
  },
  $isValid && tw`active:scale-[0.98]`,
]);

export const EmailCard = React.memo<EmailCardProps>(({ item }) => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const { t, currentLanguage } = useTranslation();
  const { tourId } = useRating();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // A consent line in the stop config adds a checkbox that must be ticked first.
  const needsConsent = !!item.consentText;
  const canSubmit = isEmailValid && (!needsConsent || consent) && status !== 'sending';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus('sending');
    const result = await submitNow('email_submit', {
      email,
      consent: needsConsent ? consent : true, // no checkbox: the form itself is the opt-in
      tourId: tourId ?? undefined,
      stopId: item.id,
      language: currentLanguage,
    });
    // 'unavailable': this build has no endpoint to send to. It behaves as before analytics existed.
    setStatus(result === 'failed' ? 'error' : 'sent');
  };

  if (status === 'sent') {
    return (
      <SuccessContainer
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CenterContent>
          <SuccessIconCircle>
            <EnvelopeSimpleIcon size={32} weight="light" />
          </SuccessIconCircle>
          <Title>{t.rating.subscribed}</Title>
          <Description>{t.rating.checkInbox}</Description>
        </CenterContent>
      </SuccessContainer>
    );
  }

  return (
    <Container>
      <FlexContent>
        <IconCircle>
          <EnvelopeSimpleIcon size={32} weight="light" />
        </IconCircle>
        <TextSection>
          <Title>{item.title || t.rating.stayInLoop}</Title>
          <Description>
            {item.description ? <RichText content={item.description} /> : t.rating.emailInfo}
          </Description>
        </TextSection>
        <FormContainer>
          <EmailInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={item.placeholder || t.rating.emailPlaceholder}
            aria-label={item.placeholder || t.rating.emailPlaceholder}
          />
          {needsConsent && (
            <ConsentLabel>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>{item.consentText}</span>
            </ConsentLabel>
          )}
          {status === 'error' && <ErrorText role="alert">{t.rating.emailError}</ErrorText>}
          <SubmitButton
            onClick={handleSubmit}
            disabled={!canSubmit}
            $isValid={canSubmit}
          >
            {item.buttonText || t.rating.subscribe}
          </SubmitButton>
        </FormContainer>
      </FlexContent>
    </Container>
  );
}, (prevProps, nextProps) => {
  return prevProps.item?.id === nextProps.item?.id;
});