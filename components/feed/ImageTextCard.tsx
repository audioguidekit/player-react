import React from 'react';
import { ImageTextStop } from '../../types';

interface ImageTextCardProps {
  item: ImageTextStop;
}

export const ImageTextCard: React.FC<ImageTextCardProps> = ({ item }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100">
      <div className="w-full h-64 overflow-hidden">
        <img
          src={item.image}
          alt="Content"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <p className="text-gray-700 leading-relaxed">{item.content}</p>
      </div>
    </div>
  );
};
