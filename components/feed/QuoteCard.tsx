import React from 'react';
import { QuoteFeedItem } from '../../types';

interface QuoteCardProps {
  item: QuoteFeedItem;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ item }) => {
  return (
    <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100">
      {/* Avatar placeholder - centered at top */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-gray-300" />
      </div>

      {/* Quote mark */}
      <div className="text-6xl text-gray-300 leading-none mb-4 font-serif">"</div>

      {/* Quote text */}
      <p className="text-gray-900 text-lg leading-relaxed mb-6">
        {item.quote}
      </p>

      {/* Author and year */}
      <div className="text-gray-600 text-sm font-medium">
        {item.author}{item.year && `, ${item.year}`}
      </div>
    </div>
  );
};
