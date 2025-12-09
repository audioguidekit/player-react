import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Play, Pause, Check } from 'lucide-react';

interface PlayPauseButtonProps {
    isPlaying: boolean;
    isCompleting?: boolean;
    isTransitioning?: boolean;
    onClick: () => void;
    size?: 'sm' | 'md' | 'lg' | 'expanded';
    variant?: 'default' | 'mini';
    className?: string;
    buttonVariants?: Variants;
}

const iconVariants = {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 }
};

const iconTransition = { duration: 0.25, ease: 'easeOut' } as const;

const sizeConfig = {
    sm: { button: 'w-10 h-10', icon: 16, checkSize: 16 },
    md: { button: 'w-14 h-14', icon: 24, checkSize: 28 },
    lg: { button: 'w-16 h-16', icon: 24, checkSize: 28 },
    expanded: { button: 'w-14 h-14', icon: 24, checkSize: 28 }
};

/**
 * Play/Pause button with animated icon transitions.
 * Supports checkmark state for track completion.
 */
export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
    isPlaying,
    isCompleting = false,
    isTransitioning = false,
    onClick,
    size = 'md',
    variant = 'default',
    className = '',
    buttonVariants
}) => {
    const { button, icon, checkSize } = sizeConfig[size];
    const showCheckmark = isCompleting || isTransitioning;

    // Mini variant (minimized player) has different styling
    const isMini = variant === 'mini';
    const baseClass = isMini
        ? `${button} rounded-full text-gray-950 flex items-center justify-center shrink-0 hover:bg-gray-100 transition-colors relative overflow-hidden`
        : `${button} rounded-full flex items-center justify-center transition-colors shadow-lg z-10 overflow-hidden relative ${showCheckmark ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'
        }`;

    return (
        <motion.button
            variants={buttonVariants}
            initial={buttonVariants ? 'initial' : undefined}
            animate={buttonVariants ? 'animate' : undefined}
            exit={buttonVariants ? 'exit' : undefined}
            transition={{ duration: 0.3 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`${baseClass} ${className}`}
            onPointerDownCapture={(e) => e.stopPropagation()}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {showCheckmark && !isMini ? (
                    <motion.div
                        key="check"
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={iconTransition}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Check size={checkSize} strokeWidth={5} />
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
                        <Pause size={isMini ? 16 : icon} fill="currentColor" />
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
                        <Play size={isMini ? 16 : icon} fill="currentColor" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};
