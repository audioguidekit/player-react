import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { PlayIcon, PauseIcon, CheckIcon } from '@phosphor-icons/react';
import tw from 'twin.macro';
import styled from 'styled-components';

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

interface StyledButtonProps {
    $size: 'sm' | 'md' | 'lg' | 'expanded';
    $variant: 'default' | 'mini';
    $showCheckmark: boolean;
}

const StyledButton = styled(motion.button)<StyledButtonProps>(({ $size, $variant, $showCheckmark, theme }) => [
  tw`rounded-full flex items-center justify-center transition-colors relative overflow-hidden`,

  // Size variants
  $size === 'sm' && tw`w-10 h-10`,
  $size === 'md' && tw`w-14 h-14`,
  $size === 'lg' && tw`w-16 h-16`,
  $size === 'expanded' && tw`w-14 h-14`,

  // Mini variant styling
  $variant === 'mini' && {
    color: theme.miniPlayer.minimized.playButtonIcon,
  },
  $variant === 'mini' && tw`shrink-0`,

  // Default variant styling
  $variant === 'default' && tw`shadow-lg z-10`,
  $variant === 'default' && $showCheckmark && {
    backgroundColor: theme.status.success,
    color: theme.colors.text.inverse,
  },
  $variant === 'default' && !$showCheckmark && {
    backgroundColor: theme.miniPlayer.controls.playButtonBackground,
    color: theme.miniPlayer.controls.playButtonIcon,
  },
]);

const IconContainer = styled(motion.div)`
  ${tw`absolute inset-0 flex items-center justify-center`}
`;

const PlayIconContainer = styled(motion.div)`
  ${tw`absolute inset-0 flex items-center justify-center pl-0.5`}
`;

const iconVariants = {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 }
};

const iconTransition = { duration: 0.25, ease: 'easeOut' } as const;

const sizeConfig = {
    sm: { icon: 16, checkSize: 16 },
    md: { icon: 24, checkSize: 28 },
    lg: { icon: 24, checkSize: 28 },
    expanded: { icon: 24, checkSize: 28 }
};

/**
 * Play/Pause button with animated icon transitions.
 * Supports checkmark state for track completion.
 */
export const PlayPauseButton = React.memo<PlayPauseButtonProps>(({
    isPlaying,
    isCompleting = false,
    isTransitioning = false,
    onClick,
    size = 'md',
    variant = 'default',
    className = '',
    buttonVariants
}) => {
    const { icon, checkSize } = sizeConfig[size];
    const showCheckmark = isCompleting || isTransitioning;
    const isMini = variant === 'mini';

    return (
        <StyledButton
            $size={size}
            $variant={variant}
            $showCheckmark={showCheckmark}
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
            className={className}
            onPointerDownCapture={(e) => e.stopPropagation()}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {showCheckmark && !isMini ? (
                    <IconContainer
                        key="check"
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={iconTransition}
                    >
                        <CheckIcon size={checkSize} weight="bold" />
                    </IconContainer>
                ) : isPlaying ? (
                    <IconContainer
                        key="pause"
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={iconTransition}
                    >
                        <PauseIcon size={isMini ? 20 : icon} weight="fill" />
                    </IconContainer>
                ) : (
                    <PlayIconContainer
                        key="play"
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={iconTransition}
                    >
                        <PlayIcon size={isMini ? 20 : icon} weight="fill" />
                    </PlayIconContainer>
                )}
            </AnimatePresence>
        </StyledButton>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.isPlaying === nextProps.isPlaying &&
        prevProps.isCompleting === nextProps.isCompleting &&
        prevProps.isTransitioning === nextProps.isTransitioning &&
        prevProps.size === nextProps.size &&
        prevProps.variant === nextProps.variant &&
        prevProps.className === nextProps.className
    );
});