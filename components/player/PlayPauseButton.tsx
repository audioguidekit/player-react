import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { PlayIcon } from '@phosphor-icons/react/dist/csr/Play';
import { PauseIcon } from '@phosphor-icons/react/dist/csr/Pause';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import tw from 'twin.macro';
import styled from 'styled-components';
import { useHaptics } from '../../src/hooks/useHaptics';

interface PlayPauseButtonProps {
    isPlaying: boolean;
    isCompleting?: boolean;
    isTransitioning?: boolean;
    onClick: () => void;
    size?: 'sm' | 'md' | 'lg' | 'expanded';
    variant?: 'default' | 'mini';
    className?: string;
    buttonVariants?: Variants;
    /**
     * Element to scale on press instead of the button itself — pass the wrapper
     * that also holds the progress ring so the two scale as one unit. Without it
     * the ring stays static while the button shrinks.
     */
    pressTargetRef?: React.RefObject<HTMLElement | null>;
}

interface StyledButtonProps {
    $size: 'sm' | 'md' | 'lg' | 'expanded';
    $variant: 'default' | 'mini';
    $showCheckmark: boolean;
}

const StyledButton = styled(motion.button)<StyledButtonProps>(({ $size, $variant, $showCheckmark, theme }) => [
  tw`rounded-full flex items-center justify-center relative overflow-hidden`,

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

  // Tap scale transition (CSS-based, not whileTap which uses invisible WAAPI)
  {
    transformOrigin: 'center center',
    transition: 'color 150ms, background-color 150ms, transform 100ms ease-out',
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
    buttonVariants,
    pressTargetRef
}) => {
    const triggerHaptic = useHaptics();
    const { icon, checkSize } = sizeConfig[size];
    const showCheckmark = isCompleting || isTransitioning;
    const isMini = variant === 'mini';

    // The press scale is driven from pointer events rather than :active, which
    // iOS Safari does not apply reliably, or framer's whileTap, which animates
    // through WAAPI and is invisible here.
    const pressTarget = (e: React.PointerEvent) =>
        pressTargetRef?.current ?? (e.currentTarget as HTMLElement);
    const press = (e: React.PointerEvent, value: string) => {
        const el = pressTarget(e);
        if (el) el.style.transform = value;
    };

    return (
        <StyledButton
            $size={size}
            $variant={variant}
            $showCheckmark={showCheckmark}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            variants={buttonVariants}
            initial={buttonVariants ? 'initial' : undefined}
            animate={buttonVariants ? 'animate' : undefined}
            exit={buttonVariants ? 'exit' : undefined}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
                e.stopPropagation();
                triggerHaptic();
                onClick();
            }}
            className={className}
            onPointerDownCapture={(e) => {
                e.stopPropagation();
                press(e, 'scale(0.9)');
            }}
            onPointerUp={(e) => press(e, '')}
            onPointerLeave={(e) => press(e, '')}
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
        prevProps.className === nextProps.className &&
        prevProps.pressTargetRef === nextProps.pressTargetRef
    );
});