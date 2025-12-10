import React from 'react';
import { Home } from 'lucide-react';
import { motion, MotionValue } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';
import { AnimatedCounter } from './shared/AnimatedCounter';

interface TourHeaderAltProps {
    onBack: () => void;
    progressWidth: MotionValue<string>;
    consumedMinutes: number;
    totalMinutes: number;
}

const Container = styled(motion.div)`
  ${tw`sticky top-0 z-30 px-6 py-2 bg-white/80 backdrop-blur-md border-b border-gray-100`}
`;

const FlexContainer = styled.div`
  ${tw`flex items-center gap-4`}
`;

const HomeButton = styled.button`
  ${tw`w-11 h-11 rounded-full flex items-center justify-center text-gray-600 transition-colors active:scale-95 shrink-0`}
`;

const ProgressSection = styled.div`
  ${tw`flex-1 flex items-center gap-3`}
`;

const ProgressBarContainer = styled.div`
  ${tw`flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden`}
`;

const ProgressBar = styled(motion.div)`
  ${tw`bg-green-500 h-full rounded-full`}
`;

const TimeText = styled.div`
  ${tw`text-sm font-normal text-gray-600 whitespace-nowrap tabular-nums`}
`;


export const TourHeaderAlt: React.FC<TourHeaderAltProps> = ({
    onBack,
    progressWidth,
    consumedMinutes,
    totalMinutes,
}) => {
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
                    <Home size={24} />
                </HomeButton>

                {/* Progress Section (Inline) - No Container */}
                <ProgressSection>
                    {/* Progress Bar */}
                    <ProgressBarContainer>
                        <ProgressBar style={{ width: progressWidth }} />
                    </ProgressBarContainer>

                    {/* Time Remaining Text */}
                    <TimeText>
                        <AnimatedCounter value={totalMinutes - consumedMinutes} /> min left
                    </TimeText>
                </ProgressSection>
            </FlexContainer>
        </Container>
    );
};