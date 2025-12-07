import React from 'react';
import { VideoStop } from '../../types';

interface VideoCardProps {
  item: VideoStop;
}

export const VideoCard: React.FC<VideoCardProps> = ({ item }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100">
      <div className="w-full aspect-video">
        <video
          src={item.videoUrl}
          controls
          className="w-full h-full"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
      {item.caption && (
        <div className="p-6">
          <p className="text-gray-700 text-sm leading-relaxed">{item.caption}</p>
        </div>
      )}
    </div>
  );
};
