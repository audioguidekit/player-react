import React from 'react';
import { HouseIcon } from '@phosphor-icons/react/dist/csr/House';
import { CloudSlashIcon } from '@phosphor-icons/react/dist/csr/CloudSlash';
import { MapPinIcon } from '@phosphor-icons/react/dist/csr/MapPin';
import { ListIcon } from '@phosphor-icons/react/dist/csr/List';
import { motion, MotionValue, AnimatePresence, LayoutGroup } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { AnimatedCounter } from './shared/AnimatedCounter';
import { useTranslation } from '../src/translations';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useHaptics } from '../src/hooks/useHaptics';

interface TourHeaderProps {
    onBack: () => void;
    progressWidth: MotionValue<string>;
    consumedMinutes: number;
    totalMinutes: number;
    showProgressBar?: boolean;
    showViewToggle?: boolean;
    viewMode?: 'map' | 'list';
    onViewModeChange?: (mode: 'map' | 'list') => void;
}

const Container = styled(motion.div)`
  ${tw`sticky top-0 z-30 px-3 backdrop-blur-md`}
  padding-top: calc(env(safe-area-inset-top, 0px) + 0.5rem);
  padding-bottom: 0.5rem;
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
    background-color: ${({ theme }) => theme.header.hoverBackground || 'rgba(0, 0, 0, 0.05)'};
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

const SegmentedControl = styled.div`
  ${tw`flex items-center h-10 rounded-full p-0.5 shrink-0 ml-auto relative overflow-hidden`}
  min-width: 88px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const SegmentButton = styled.button<{ $isActive: boolean }>`
  ${tw`flex-1 h-full rounded-full flex items-center justify-center transition-colors relative`}
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.header.iconColor : theme.colors.text.tertiary};
  background-color: transparent;
  box-shadow: none;
`;

const SegmentThumb = styled(motion.div)`
  ${tw`absolute inset-0 rounded-full`}
  background-color: ${({ theme }) => theme.colors.background.primary};
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  z-index: 0;
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
    showProgressBar = true,
    showViewToggle,
    viewMode,
    onViewModeChange,
}) => {
    const { t } = useTranslation();
    const isOnline = useOnlineStatus();
    const triggerHaptic = useHaptics();

    return (
        <Container
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.15, duration: 0.2 }}
        >
            <FlexContainer>
                {/* Home Button - Ghost Style */}
                <HomeButton
                    onClick={() => {
                        triggerHaptic();
                        onBack();
                    }}
                >
                    <HouseIcon size={24} weight="bold" />
                </HomeButton>

                {showProgressBar && (
                    <ProgressSection>
                        <ProgressBarContainer>
                            <ProgressBar style={{ width: progressWidth }} />
                        </ProgressBarContainer>

                        <TimeText>
                            <AnimatedCounter value={totalMinutes - consumedMinutes} /> {t.tourHeader.minLeft}
                        </TimeText>

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
                )}

                {showViewToggle && viewMode && (
                    <LayoutGroup>
                        <SegmentedControl>
                            <SegmentButton
                                $isActive={viewMode === 'map'}
                                onClick={() => {
                                    triggerHaptic();
                                    onViewModeChange?.('map');
                                }}
                                aria-label="Map view"
                            >
                                {viewMode === 'map' && (
                                    <SegmentThumb
                                        layoutId="tour-header-segment-thumb"
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    />
                                )}
                                <MapPinIcon
                                    size={24}
                                    weight={viewMode === 'map' ? 'fill' : 'regular'}
                                    style={{ position: 'relative', zIndex: 1 }}
                                />
                            </SegmentButton>
                            <SegmentButton
                                $isActive={viewMode === 'list'}
                                onClick={() => {
                                    triggerHaptic();
                                    onViewModeChange?.('list');
                                }}
                                aria-label="List view"
                            >
                                {viewMode === 'list' && (
                                    <SegmentThumb
                                        layoutId="tour-header-segment-thumb"
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    />
                                )}
                                <ListIcon
                                    size={24}
                                    weight={viewMode === 'list' ? 'bold' : 'regular'}
                                    style={{ position: 'relative', zIndex: 1 }}
                                />
                            </SegmentButton>
                        </SegmentedControl>
                    </LayoutGroup>
                )}
            </FlexContainer>
        </Container>
    );
};