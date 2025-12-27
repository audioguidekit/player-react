import React from 'react';
import styled from 'styled-components';
import { MobileFrame } from '../../../components/shared/MobileFrame';
import { useTranslation } from '../../translations';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: ${({ theme }) => theme.loading.backgroundColor};
`;

const ContentWrapper = styled.div`
  text-align: center;
  padding: 2rem;
`;

const SpinnerWrapper = styled.div`
  margin-bottom: 1rem;
`;

const Spinner = styled.div`
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  border: 4px solid ${({ theme }) => theme.colors.border.medium};
  border-top-color: ${({ theme }) => theme.loading.spinnerColor};
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Title = styled.p`
  font-size: 1.125rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const AssetsLoadingScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MobileFrame>
      <Container>
        <ContentWrapper>
          <SpinnerWrapper>
            <Spinner />
          </SpinnerWrapper>
          <Title>{t.loading.preparing}</Title>
          <Subtitle>{t.loading.audio}</Subtitle>
        </ContentWrapper>
      </Container>
    </MobileFrame>
  );
};
