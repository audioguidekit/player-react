import React from 'react';
import { motion } from 'framer-motion';
import tw from 'twin.macro';
import styled from 'styled-components';

interface SkipButtonProps {
    direction: 'forward' | 'backward';
    seconds?: number;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
}

const Container = styled(motion.div)`
  ${tw`relative z-10 flex items-center justify-center`}
`;

const Button = styled.button<{ $disabled: boolean }>(({ $disabled, theme }) => [
  tw`w-12 h-12 rounded-full flex items-center justify-center`,
  tw`active:scale-90 transition-transform duration-100 ease-in-out`,
  {
    backgroundColor: theme.miniPlayer.controls.otherButtonsBackground,
    color: theme.miniPlayer.controls.otherButtonsIcon,
  },
  $disabled && tw`opacity-40`,
]);

export const SkipButton = React.memo<SkipButtonProps>(({
    direction,
    seconds = 15,
    onClick,
    disabled = false,
    className = '',
    children
}) => {
    return (
        <Container layout>
            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) onClick();
                }}
                onPointerDownCapture={(e) => e.stopPropagation()}
                disabled={disabled}
                $disabled={disabled}
                className={className}
            >
                {children}
            </Button>
        </Container>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.direction === nextProps.direction &&
        prevProps.seconds === nextProps.seconds &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.className === nextProps.className &&
        prevProps.children === nextProps.children
    );
});