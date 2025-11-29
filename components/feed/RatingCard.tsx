import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RatingFeedItem } from '../../types';

interface RatingCardProps {
  item: RatingFeedItem;
}

export const RatingCard: React.FC<RatingCardProps> = ({ item }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (feedback.trim().length === 0) return;

    // In a real app, send to API
    console.log('Rating submitted:', { rating, feedback });
    setIsSubmitted(true);
  };

  const isFeedbackButtonDisabled = feedback.trim().length === 0;

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
          <p className="text-gray-500">We appreciate your feedback.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {item.question || 'How did you like this tour?'}
        </h3>
        <p className="text-gray-500 text-base">{item.description || 'Your feedback is valuable for us!'}</p>
      </div>

      {/* Stars */}
      <div className="flex justify-center gap-3 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="transition-transform focus:outline-none hover:scale-110 active:scale-95"
          >
            <Star
              size={36}
              fill={rating >= star ? 'black' : 'transparent'}
              className={rating >= star ? 'text-black' : 'text-gray-300'}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>

      {/* Hint Text */}
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

      {/* Feedback Form */}
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
              className="w-full border border-gray-200 rounded-2xl p-4 text-base focus:outline-none focus:border-black resize-none h-28 bg-gray-50 text-gray-800 placeholder:text-gray-400 transition-colors"
            />

            <button
              onClick={handleSubmit}
              disabled={isFeedbackButtonDisabled}
              className={`w-full py-4 rounded-full font-bold text-base transition-all duration-300
                ${isFeedbackButtonDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-900 shadow-lg active:scale-[0.98]'
                }`}
            >
              Submit Feedback
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
