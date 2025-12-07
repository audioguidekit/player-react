import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
    value: number;
    className?: string;
}

/**
 * Smoothly animates number value changes with spring physics.
 * Used for displaying remaining minutes, progress percentages, etc.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    className = ''
}) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 35, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span className={className}>{display}</motion.span>;
};
