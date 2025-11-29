import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmailFeedItem } from '../../types';

interface EmailCardProps {
  item: EmailFeedItem;
}

export const EmailCard: React.FC<EmailCardProps> = ({ item }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = () => {
    if (!isEmailValid) return;

    // In a real app, send to API
    console.log('Email submitted:', email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-green-600" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">You're subscribed!</h3>
          <p className="text-gray-500">Check your inbox for updates.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-900">
          <Mail size={32} strokeWidth={1.5} />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {item.title || 'Stay in the loop?'}
          </h3>
          <p className="text-gray-500 text-base">
            {item.description || 'Enter your email to receive updates about new tours and exclusive offers.'}
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={item.placeholder || 'your@email.com'}
            className="w-full border border-gray-200 rounded-2xl p-4 text-base focus:outline-none focus:border-black bg-gray-50 text-gray-800 placeholder:text-gray-400 transition-colors"
          />

          <button
            onClick={handleSubmit}
            disabled={!isEmailValid}
            className={`w-full py-4 rounded-full font-bold text-base transition-all duration-300
              ${!isEmailValid
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-900 shadow-lg active:scale-[0.98]'
              }`}
          >
            {item.buttonText || 'Subscribe'}
          </button>
        </div>
      </div>
    </div>
  );
};
