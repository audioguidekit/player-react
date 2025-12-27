import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import tw from 'twin.macro';
import styled from 'styled-components';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  showBackdrop?: boolean;
  allowDragClose?: boolean; // Allow closing via drag gesture
  hideHandle?: boolean; // Hide the built-in handle when content provides its own
}

const Backdrop = styled(motion.div)`
  ${tw`absolute inset-0 bg-black z-[60]`}
`;

const SheetContainer = styled(motion.div)`
  ${tw`absolute bottom-0 left-0 right-0 z-[70] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col h-auto max-h-[90%]`}
  background-color: ${({ theme }) => theme.sheets.backgroundColor};
  border-top: 1px solid ${({ theme }) => theme.sheets.borderColor || theme.colors.border.light};
  will-change: transform;
`;

const HandleArea = styled.div`
  ${tw`w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0`}
`;

const Handle = styled.div`
  ${tw`w-12 h-1.5 rounded-full`}
  background-color: ${({ theme }) => theme.sheets.handleColor};
`;

const Header = styled.div`
  ${tw`px-6 pb-2 pt-1 flex justify-between items-center shrink-0`}
`;

const Title = styled.h3`
  ${tw`text-lg`}
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.sheets.textColor};
`;

const CloseButton = styled.button`
  ${tw`p-2 -mr-2 rounded-full transition-colors`}
  color: ${({ theme }) => theme.colors.text.tertiary};

  &:hover {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const Content = styled.div`
  ${tw`flex-1 overflow-auto relative`}
`;

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className = "",
  showBackdrop = true,
  allowDragClose = true,
  hideHandle = false
}) => {
  useEffect(() => {
    // Body scroll lock logic could go here
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <Backdrop
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
            />
          )}

          {/* Sheet */}
          <SheetContainer
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            // Responsive spring for quick gestures
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.5 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              // Snap behavior: if dragged down beyond threshold, minimize (call onClose)
              // Otherwise, snap back to expanded
              const shouldMinimize = info.offset.y > 50 || info.velocity.y > 300;

              if (shouldMinimize) {
                onClose(); // This will minimize, not close completely
              }
              // If not minimizing, spring will automatically snap back to position 0
            }}
            className={className}
          >
            {/* Handle Area */}
            {!hideHandle && (
              <HandleArea onClick={onClose}>
                <Handle />
              </HandleArea>
            )}

            {/* Header (Optional) */}
            {title && (
              <Header>
                <Title>{title}</Title>
                <CloseButton onClick={onClose}>
                  <X size={20} />
                </CloseButton>
              </Header>
            )}

            {/* Content */}
            <Content>
              {children}
            </Content>
          </SheetContainer>
        </>
      )}
    </AnimatePresence>
  );
};