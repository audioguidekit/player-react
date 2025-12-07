import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 96,
    strokeWidth = 4,
    className = ''
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const visualProgress = Math.max(0, Math.min(100, progress));

    // Start from 12 o'clock position (-90 degrees)
    const strokeDashoffset = circumference * (1 - visualProgress / 100);

    return (
        <svg
            width={size}
            height={size}
            className={`absolute inset-0 -rotate-90 ${className}`}
        >
            {/* Background circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#1f2937"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            />
        </svg>
    );
};
