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
  ${tw`bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100`}
`;

const SuccessContainer = styled(motion.div)`
  ${tw`bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100`}
`;

const CenterContent = styled.div`
  ${tw`text-center`}
`;

const FlexContent = styled.div`
  ${tw`flex flex-col items-center`}
`;

const IconCircle = styled.div`
  ${tw`w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-900`}
`;

const SuccessIconCircle = styled.div`
  ${tw`w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4`}
`;

const TextSection = styled.div`
  ${tw`text-center mb-6`}
`;

const Title = styled.h3`
  ${tw`text-xl font-bold text-gray-900 mb-2`}
`;

const Description = styled.p`
  ${tw`text-gray-500 text-base`}
`;

const FormContainer = styled.div`
  ${tw`w-full flex flex-col gap-4`}
`;

const EmailInput = styled.input`
  ${tw`w-full border border-gray-200 rounded-2xl p-4 text-base focus:outline-none focus:border-black bg-gray-50 text-gray-800 placeholder:text-gray-400 transition-colors`}
`;

const SubmitButton = styled.button<{ $isValid: boolean }>(({ $isValid }) => [
  tw`w-full py-4 rounded-full font-bold text-base transition-all duration-300`,
  !$isValid && tw`bg-gray-100 text-gray-400 cursor-not-allowed`,
  $isValid && tw`bg-black text-white shadow-lg active:scale-[0.98]`,
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
            <Mail size={32} className="text-green-600" strokeWidth={1.5} />
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