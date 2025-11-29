import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  showBackdrop?: boolean;
  allowDragClose?: boolean; // Allow closing via drag gesture
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className = "",
  showBackdrop = true,
  allowDragClose = true
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
              className="absolute inset-0 bg-black z-[60]"
            />
          )}

          {/* Sheet */}
          <motion.div
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
            // h-auto to hug content, max-h-[90%] to fit screen
            className={`absolute bottom-0 left-0 right-0 bg-white z-[70] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col h-auto max-h-[90%] ${className}`}
            style={{ willChange: 'transform' }}
          >
            {/* Handle Area */}
            <div className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0" onClick={onClose}>
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header (Optional) */}
            {title && (
              <div className="px-6 pb-2 pt-1 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <button 
                  onClick={onClose} 
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto rounded-t-[2.5rem] relative">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};