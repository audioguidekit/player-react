import React from 'react';
import { HouseIcon, CloudSlashIcon } from '@phosphor-icons/react';
import { motion, MotionValue, AnimatePresence } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { AnimatedCounter } from './shared/AnimatedCounter';
import { useTranslation } from '../src/translations';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface TourHeaderProps {
    onBack: () => void;
    progressWidth: MotionValue<string>;
    consumedMinutes: number;
    totalMinutes: number;
}

const Container = styled(motion.div)`
  ${tw`sticky top-0 z-30 px-6 py-2 backdrop-blur-md`}
  background-color: ${({ theme }) => theme.header.backgroundColor};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const FlexContainer = styled.div`
  ${tw`flex items-center gap-4`}
`;

const HomeButton = styled.button`
  ${tw`w-11 h-11 rounded-full flex items-center justify-center transition-colors active:scale-95 shrink-0`}
  color: ${({ theme }) => theme.header.iconColor};
  background-color: transparent;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const ProgressSection = styled.div`
  ${tw`flex-1 flex items-center gap-3`}
`;

const ProgressBarContainer = styled.div`
  ${tw`flex-1 h-2.5 rounded-full overflow-hidden`}
  background-color: ${({ theme }) => theme.header.progressBar.backgroundColor};
`;

const ProgressBar = styled(motion.div)`
  ${tw`h-full rounded-full`}
  background-color: ${({ theme }) => theme.header.progressBar.highlightColor};
`;

const TimeText = styled.div`
  ${tw`whitespace-nowrap tabular-nums`}
  font-size: ${({ theme }) => theme.header.timeFontSize};
  font-weight: ${({ theme }) => theme.header.timeFontWeight};
  font-family: ${({ theme }) =>
    theme?.typography?.fontFamily?.numbers
      ? theme.typography.fontFamily.numbers.join(', ')
      : theme?.typography?.fontFamily?.sans?.join(', ') || 'Inter, sans-serif'
  };
  color: ${({ theme }) => theme.header.textColor};
`;

const OfflineBadge = styled(motion.div)`
  ${tw`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium`}
  background-color: ${({ theme }) => `${theme.status.warning}20`};
  color: ${({ theme }) => theme.status.warning};
  filter: brightness(0.8);
`;


export const TourHeader: React.FC<TourHeaderProps> = ({
    onBack,
    progressWidth,
    consumedMinutes,
    totalMinutes,
}) => {
    const { t } = useTranslation();
    const isOnline = useOnlineStatus();

    return (
        <Container
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.15, duration: 0.2 }}
        >
            <FlexContainer>
                {/* Home Button - Ghost Style */}
                <HomeButton onClick={onBack}>
                    <HouseIcon size={24} weight="bold" />
                </HomeButton>

                {/* Progress Section (Inline) - No Container */}
                <ProgressSection>
                    {/* Progress Bar */}
                    <ProgressBarContainer>
                        <ProgressBar style={{ width: progressWidth }} />
                    </ProgressBarContainer>

                    {/* Time Remaining Text - always shown */}
                    <TimeText>
                        <AnimatedCounter value={totalMinutes - consumedMinutes} /> {t.tourHeader.minLeft}
                    </TimeText>

                    {/* Offline Badge - shown when offline */}
                    <AnimatePresence>
                        {!isOnline && (
                            <OfflineBadge
                                key="offline"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CloudSlashIcon size={14} weight="bold" />
                            </OfflineBadge>
                        )}
                    </AnimatePresence>
                </ProgressSection>
            </FlexContainer>
        </Container>
    );
};