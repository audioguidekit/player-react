import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Check } from 'lucide-react';

interface PlayPauseButtonProps {
    isPlaying: boolean;
    isCompleting?: boolean;
    isTransitioning?: boolean;
    onClick: () => void;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const iconVariants = {
    initial: { scale: 0.5, opacity: 0, filter: 'blur(2px)' },
    animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
    exit: { scale: 0.5, opacity: 0, filter: 'blur(2px)' }
};

const iconTransition = { duration: 0.25, ease: 'easeOut' } as const;

const sizeConfig = {
    sm: { button: 'w-10 h-10', icon: 16 },
    md: { button: 'w-16 h-16', icon: 24 },
    lg: { button: 'w-20 h-20', icon: 32 }
};

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
    isPlaying,
    isCompleting = false,
    isTransitioning = false,
    onClick,
    size = 'md',
    className = ''
}) => {
    const { button, icon } = sizeConfig[size];
    const showCheckmark = isCompleting || isTransitioning;

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`${button} rounded-full bg-gray-950 text-white flex items-center justify-center shrink-0 relative overflow-hidden ${className}`}
            onPointerDownCapture={(e) => e.stopPropagation()}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {showCheckmark ? (
                    <motion.div
                        key="checkmark"
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={iconTransition}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Check size={icon} strokeWidth={3} />
                    </motion.div>
                ) : isPlaying ? (
                    <motion.div
                        key="pause"
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={iconTransition}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Pause size={icon} fill="currentColor" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="play"
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={iconTransition}
                        className="absolute inset-0 flex items-center justify-center pl-0.5"
                    >
                        <Play size={icon} fill="currentColor" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};
