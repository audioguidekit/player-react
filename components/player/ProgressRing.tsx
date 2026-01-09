import React from 'react';
import { motion } from 'framer-motion';
import tw from 'twin.macro';
import styled, { useTheme } from 'styled-components';

interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    backgroundColor?: string;
    className?: string;
    animated?: boolean;
}

const StyledProgressSvg = styled(motion.svg)`
  ${tw`absolute inset-0 pointer-events-none`}
`;

/**
 * SVG circular progress ring component.
 * Used in MiniPlayer to show audio playback progress.
 */
export const ProgressRing = React.memo<ProgressRingProps>(({
    progress,
    size = 64,
    strokeWidth = 3,
    color,
    backgroundColor,
    className = '',
    animated = true
}) => {
    const theme = useTheme();
    const progressColor = color || theme.miniPlayer.progressBar.highlightColor;
    const bgColor = backgroundColor || theme.miniPlayer.progressBar.backgroundColor;
    const radius = (size - strokeWidth) / 2 - 1; // -1 for padding
    const circumference = 2 * Math.PI * radius;
    const visualProgress = Math.max(0, Math.min(100, progress));
    const strokeDashoffset = circumference * (1 - visualProgress / 100);

    return (
        <StyledProgressSvg
            initial={animated ? { opacity: 0 } : false}
            animate={animated ? { opacity: 1 } : false}
            exit={animated ? { opacity: 0 } : false}
            transition={{ duration: 0.3 }}
            style={{ rotate: -90 }}
            className={className}
            width={size}
            height={size}
        >
            {/* Background circle */}
            <circle
                stroke={bgColor}
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            {/* Progress circle */}
            <motion.circle
                stroke={progressColor}
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.1, ease: 'linear' }}
                strokeLinecap="round"
            />
        </StyledProgressSvg>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.progress === nextProps.progress &&
        prevProps.size === nextProps.size &&
        prevProps.strokeWidth === nextProps.strokeWidth &&
        prevProps.color === nextProps.color &&
        prevProps.backgroundColor === nextProps.backgroundColor &&
        prevProps.className === nextProps.className &&
        prevProps.animated === nextProps.animated
    );
});
