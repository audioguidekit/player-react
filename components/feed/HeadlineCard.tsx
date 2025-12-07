import React from 'react';
import { HeadlineStop } from '../../types';

interface HeadlineCardProps {
  item: HeadlineStop;
}

export const HeadlineCard: React.FC<HeadlineCardProps> = ({ item }) => {
  return (
    <div className="py-4 mb-2">
      <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
        {item.text}
      </h3>
      <div className="h-1 w-16 bg-black mt-2 rounded-full"></div>
    </div>
  );
};
