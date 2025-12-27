import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import tw from 'twin.macro';
import styled, { useTheme } from 'styled-components';

interface AnimatedCheckmarkProps {
  isVisible: boolean;
  size?: number;
  uniqueKey?: string;
  className?: string;
}

interface CheckmarkContainerProps {
  $isVisible: boolean;
  $circleSize: number;
}

const CheckmarkContainer = styled.div<CheckmarkContainerProps>(({ $isVisible, $circleSize, theme }) => [
  tw`rounded-full flex items-center justify-center`,
  $isVisible ? {
    backgroundColor: theme.status.success,
    border: '0',
  } : {
    backgroundColor: 'transparent',
    border: `1px solid ${theme.colors.border.medium}`,
  },
  {
    width: `${$circleSize}px`,
    height: `${$circleSize}px`,
  }
]);

export const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({
  isVisible,
  size = 8,
  uniqueKey = 'checkmark',
  className = ''
}) => {
  const theme = useTheme();
  const circleSize = size * 3.5; // 28px for size 8
  const svgSize = size * 1.75;   // 14px for size 8

  return (
    <CheckmarkContainer
      $isVisible={isVisible}
      $circleSize={circleSize}
      className={className}
    >
      <AnimatePresence mode="wait">
        {isVisible && (
          <svg
            key={`checkmark-svg-${uniqueKey}`}
            width={svgSize}
            height={svgSize}
            viewBox="0 0 10 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M1 4L3.5 6.5L9 1"
              stroke={theme.colors.text.inverse}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { type: 'spring', duration: 0.35, bounce: 0 },
                opacity: { duration: 0.01 }
              }}
            />
          </svg>
        )}
      </AnimatePresence>
    </CheckmarkContainer>
  );
};
