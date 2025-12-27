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
`;

const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  border-radius: 9999px;
  border: 2px solid transparent;
  border-bottom-color: ${({ theme }) => theme.loading.spinnerColor};
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MobileFrame>
      <Container>
        <ContentWrapper>
          <Spinner />
          <LoadingText>{t.loading.tourData}</LoadingText>
        </ContentWrapper>
      </Container>
    </MobileFrame>
  );
};
