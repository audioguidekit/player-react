import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { EmailStop } from '../../types';

interface EmailCardProps {
  item: EmailStop;
}

const Container = styled.div`
  ${tw`p-6 mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.cornerRadius};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const SuccessContainer = styled(motion.div)`
  ${tw`p-6 mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.cornerRadius};
  box-shadow: ${({ theme }) => theme.shadows.sm};
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
  ${tw`w-full p-4 text-base focus:outline-none transition-colors`}
  border: 1px solid ${({ theme }) => theme.inputs.borderColor};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  background-color: ${({ theme }) => theme.inputs.backgroundColor};
  color: ${({ theme }) => theme.inputs.textColor};

  &::placeholder {
    color: ${({ theme }) => theme.inputs.placeholderColor};
  }

  &:focus {
    border-color: ${({ theme }) => theme.inputs.focusBorderColor};
  }
`;

const SubmitButton = styled.button<{ $isValid: boolean }>(({ $isValid, theme }) => [
  tw`w-full py-4 rounded-full font-bold text-base transition-all duration-300`,
  !$isValid && {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.tertiary,
    cursor: 'not-allowed',
  },
  $isValid && {
    backgroundColor: theme.buttons.primary.backgroundColor,
    color: theme.buttons.primary.textColor,
    boxShadow: theme.shadows.lg,
  },
  $isValid && tw`active:scale-[0.98]`,
]);

export const EmailCard: React.FC<EmailCardProps> = ({ item }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = () => {
    if (!isEmailValid) return;
    console.log('Email submitted:', email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <SuccessContainer
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CenterContent>
          <SuccessIconCircle>
            <Mail size={32} strokeWidth={1.5} />
          </SuccessIconCircle>
          <Title>You're subscribed!</Title>
          <Description>Check your inbox for updates.</Description>
        </CenterContent>
      </SuccessContainer>
    );
  }

  return (
    <Container>
      <FlexContent>
        <IconCircle>
          <Mail size={32} strokeWidth={1.5} />
        </IconCircle>
        <TextSection>
          <Title>{item.title || 'Stay in the loop?'}</Title>
          <Description>
            {item.description || 'Enter your email to receive updates about new tours and exclusive offers.'}
          </Description>
        </TextSection>
        <FormContainer>
          <EmailInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={item.placeholder || 'your@email.com'}
          />
          <SubmitButton
            onClick={handleSubmit}
            disabled={!isEmailValid}
            $isValid={isEmailValid}
          >
            {item.buttonText || 'Subscribe'}
          </SubmitButton>
        </FormContainer>
      </FlexContent>
    </Container>
  );
};