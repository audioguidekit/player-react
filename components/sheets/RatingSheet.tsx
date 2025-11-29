import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CircleCheckBig, Mail } from 'lucide-react';
import { BottomSheet } from '../BottomSheet';

interface RatingSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type RatingStep = 'RATING' | 'EMAIL' | 'THANKS';

export const RatingSheet: React.FC<RatingSheetProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<RatingStep>('RATING');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setStep('RATING');
      setRating(0);
      setFeedback('');
      setEmail('');
    }
  }, [isOpen]);

  const handleFeedbackSubmit = () => {
    // Proceed to email step
    setStep('EMAIL');
  };

  const handleEmailSubmit = () => {
    // In a real app, send email API call here
    setStep('THANKS');
  };

  const handleSkip = () => {
    setStep('THANKS');
  };

  const handleFinalClose = () => {
    onClose();
  };

  // Button is disabled if no feedback text
  const isFeedbackButtonDisabled = feedback.trim().length === 0;
  
  // Email validation (simple check)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="p-6 pb-8 flex flex-col items-center">
        <AnimatePresence mode="wait" initial={false}>
          
          {/* STEP 1: RATING & FEEDBACK */}
          {step === 'RATING' && (
            <motion.div
              key="rating-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">How did you like this tour?</h3>
                <p className="text-gray-500 text-base">Your feedback is valuable for us!</p>
              </div>

              {/* Stars Container */}
              <div className="flex justify-center gap-3 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform focus:outline-none hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={36} // Slightly larger stars
                      fill={rating >= star ? "black" : "transparent"}
                      className={rating >= star ? "text-black" : "text-gray-300"}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              {/* Dynamic Content Container */}
              <div className="w-full flex flex-col items-center">
                
                {/* Animated Hint Text - Increased to text-sm */}
                <div className="h-6 mb-4 relative w-full flex justify-center overflow-visible">
                   <AnimatePresence mode="wait">
                     {rating === 0 ? (
                       <motion.span
                         key="hint-start"
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -5 }}
                         transition={{ duration: 0.2 }}
                         className="text-sm text-gray-400 font-medium absolute top-0"
                       >
                         Tap to rate
                       </motion.span>
                     ) : (
                       <motion.span
                         key="hint-details"
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -5 }}
                         transition={{ duration: 0.2 }}
                         className="text-sm text-gray-400 font-medium absolute top-0"
                       >
                         Mind sharing more details?
                       </motion.span>
                     )}
                   </AnimatePresence>
                </div>

                {/* Form Area (Expands when rated) */}
                <AnimatePresence>
                  {rating > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                      className="w-full overflow-hidden flex flex-col gap-4"
                    >
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Describe what you liked or disliked..."
                        // text-base prevents auto-zoom on iOS
                        className="w-full border border-gray-200 rounded-2xl p-4 text-base focus:outline-none focus:border-black resize-none h-28 bg-gray-50 text-gray-800 placeholder:text-gray-400 transition-colors"
                      />

                      <button
                        onClick={handleFeedbackSubmit}
                        disabled={isFeedbackButtonDisabled}
                        className={`w-full py-4 rounded-full font-bold text-base transition-all duration-300
                          ${isFeedbackButtonDisabled 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-black text-white hover:bg-gray-900 shadow-lg active:scale-[0.98]'
                          }`}
                      >
                        Next
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* STEP 2: EMAIL COLLECTION */}
          {step === 'EMAIL' && (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-900">
                <Mail size={32} strokeWidth={1.5} />
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Stay in the loop?</h3>
                <p className="text-gray-500 text-base max-w-[280px]">
                  Enter your email to receive updates about new tours and exclusive offers from this property.
                </p>
              </div>

              <div className="w-full flex flex-col gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  // text-base prevents auto-zoom on iOS
                  className="w-full border border-gray-200 rounded-2xl p-4 text-base focus:outline-none focus:border-black bg-gray-50 text-gray-800 placeholder:text-gray-400 transition-colors"
                />

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleEmailSubmit}
                    disabled={!isEmailValid}
                    className={`w-full py-4 rounded-full font-bold text-base transition-all duration-300
                      ${!isEmailValid
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-black text-white hover:bg-gray-900 shadow-lg active:scale-[0.98]'
                      }`}
                  >
                    Subscribe
                  </button>
                  
                  <button
                    onClick={handleSkip}
                    className="w-full py-2 text-base font-medium text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: THANKS */}
          {step === 'THANKS' && (
             <motion.div
               key="thanks-step"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.3 }}
               className="w-full flex flex-col items-center justify-center py-8"
             >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-600">
                   <CircleCheckBig size={40} strokeWidth={1.5} />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">Thank you!</h3>
                <p className="text-gray-500 text-base mb-8">We appreciate your feedback.</p>

                <button
                  onClick={handleFinalClose}
                  className="w-full py-4 rounded-full font-bold text-base bg-black text-white hover:bg-gray-900 shadow-lg active:scale-[0.98] transition-all"
                >
                  Close
                </button>
             </motion.div>
          )}

        </AnimatePresence>
      </div>
    </BottomSheet>
  );
};