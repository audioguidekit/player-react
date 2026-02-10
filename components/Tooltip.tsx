import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import tw from 'twin.macro';
import styled from 'styled-components';

interface TooltipProps {
  title: string;
  children: React.ReactNode;
}

const Trigger = styled.span`
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
  cursor: pointer;
`;

const Popover = styled.div<{ $x: number; $y: number }>`
  ${tw`fixed z-50 px-3 py-2 text-sm rounded-lg shadow-lg max-w-xs`}
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  background-color: ${({ theme }) => theme.tooltip.backgroundColor};
  color: ${({ theme }) => theme.tooltip.textColor};
  border: 1px solid ${({ theme }) => theme.tooltip.borderColor};
  line-height: 1.4;
`;

// Global state: only one tooltip open at a time
let globalCloseCallback: (() => void) | null = null;

export const Tooltip: React.FC<TooltipProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    if (globalCloseCallback === close) {
      globalCloseCallback = null;
    }
  }, []);

  const toggle = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOpen) {
      close();
      return;
    }

    // Close any other open tooltip
    if (globalCloseCallback) {
      globalCloseCallback();
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 256; // max-w-xs = 20rem = ~320px, but content is usually smaller

      // Position below the trigger word, centered
      let x = rect.left + rect.width / 2 - popoverWidth / 2;
      const y = rect.bottom + 6;

      // Keep within viewport
      x = Math.max(8, Math.min(x, window.innerWidth - popoverWidth - 8));

      setPosition({ x, y });
    }

    setIsOpen(true);
    globalCloseCallback = close;
  }, [isOpen, close]);

  // Close on outside click/tap
  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [isOpen, close]);

  return (
    <>
      <Trigger ref={triggerRef} onClick={toggle} role="button" tabIndex={0}>
        {children}
      </Trigger>
      {isOpen && createPortal(
        <Popover ref={popoverRef} $x={position.x} $y={position.y}>
          {title}
        </Popover>,
        document.body
      )}
    </>
  );
};
