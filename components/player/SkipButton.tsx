import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { useHaptics } from '../../src/hooks/useHaptics';

interface SkipButtonProps {
    direction: 'forward' | 'backward';
    seconds?: number;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

const Button = styled.button<{ $disabled: boolean }>(({ $disabled, theme }) => [
  tw`w-12 h-12 p-0 border-0 rounded-full flex items-center justify-center shrink-0`,
  {
    backgroundColor: theme.miniPlayer.controls.otherButtonsBackground,
    color: theme.miniPlayer.controls.otherButtonsIcon,
    transformOrigin: 'center center',
    transition: 'background-color 100ms ease-in-out, transform 100ms ease-out',
    '@media (hover: hover)': {
      '&:hover': {
        backgroundColor: theme.miniPlayer.controls.otherButtonsHoverBackground || theme.miniPlayer.controls.otherButtonsBackground,
      },
    },
    '&:active': {
      transform: 'scale(0.9)',
    },
  },
  $disabled && tw`opacity-40`,
]);

export const SkipButton = React.memo<SkipButtonProps>(({
    direction,
    seconds = 15,
    onClick,
    disabled = false,
    children
}) => {
    const triggerHaptic = useHaptics();

    return (
        <Button
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) {
                    triggerHaptic();
                    onClick();
                }
            }}
            onPointerDownCapture={(e) => e.stopPropagation()}
            disabled={disabled}
            $disabled={disabled}
        >
            {children}
        </Button>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.direction === nextProps.direction &&
        prevProps.seconds === nextProps.seconds &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.children === nextProps.children
    );
});
