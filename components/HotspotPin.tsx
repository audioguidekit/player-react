import React, { useRef, useEffect, useState, useCallback } from 'react';
import tw from 'twin.macro';
import styled, { keyframes } from 'styled-components';
import { RichText } from './RichText';

interface HotspotPinProps {
  x: number;
  y: number;
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const pulse = keyframes`
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
`;

const PinContainer = styled.div<{ $x: number; $y: number }>`
  ${tw`absolute z-10`}
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
`;

const PinDot = styled.button`
  ${tw`w-5 h-5 rounded-full border-2 cursor-pointer relative`}
  transform: translate(-50%, -50%);
  background-color: ${({ theme }) => theme.hotspot.pinColor};
  border-color: rgba(0, 0, 0, 0.3);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);

  &::after {
    content: '';
    ${tw`absolute inset-0 rounded-full`}
    background-color: ${({ theme }) => theme.hotspot.pinPulseColor};
    animation: ${pulse} 2s ease-out infinite;
  }
`;

const Popover = styled.div<{ $openUp: boolean; $openLeft: boolean }>`
  ${tw`absolute z-20 p-3 rounded-lg`}
  width: 200px;
  ${({ $openUp }) => $openUp ? 'bottom: 16px;' : 'top: 16px;'}
  ${({ $openLeft }) => $openLeft ? 'right: -10px;' : 'left: -10px;'}
  transform: translateX(0);
  background-color: ${({ theme }) => theme.tooltip.backgroundColor};
  border: 1px solid ${({ theme }) => theme.tooltip.borderColor};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const PopoverTitle = styled.div`
  ${tw`text-sm font-semibold mb-1`}
  color: ${({ theme }) => theme.tooltip.textColor};
`;

const PopoverDescription = styled.div`
  ${tw`text-xs leading-relaxed`}
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const HotspotPin: React.FC<HotspotPinProps> = ({
  x, y, title, description, isOpen, onToggle, onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);

  // Determine popover direction based on pin position
  useEffect(() => {
    setOpenUp(y > 60);
    setOpenLeft(x > 60);
  }, [x, y]);

  // Click outside to close
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
      return () => document.removeEventListener('pointerdown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  return (
    <PinContainer ref={containerRef} $x={x} $y={y}>
      <PinDot onClick={(e) => { e.stopPropagation(); onToggle(); }} aria-label={title} />
      {isOpen && (
        <Popover $openUp={openUp} $openLeft={openLeft}>
          <PopoverTitle>{title}</PopoverTitle>
          {description && (
            <PopoverDescription><RichText content={description} /></PopoverDescription>
          )}
        </Popover>
      )}
    </PinContainer>
  );
};
