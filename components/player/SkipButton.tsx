import React from 'react';
import { motion } from 'framer-motion';

interface SkipButtonProps {
    direction: 'forward' | 'backward';
    seconds?: number;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
}

export const SkipButton: React.FC<SkipButtonProps> = ({
    direction,
    seconds = 15,
    onClick,
    disabled = false,
    className = '',
    children
}) => {
    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onClick();
            }}
            className={`w-12 h-12 rounded-full text-gray-950 flex items-center justify-center hover:bg-gray-100 transition-colors relative ${disabled ? 'opacity-40' : ''} ${className}`}
            onPointerDownCapture={(e) => e.stopPropagation()}
            disabled={disabled}
        >
            {children}
        </motion.button>
    );
};
