import React from 'react';
import { ThreeDObjectStop } from '../../types';
import '@google/model-viewer';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerJSX & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface ModelViewerJSX {
  src?: string;
  alt?: string;
  ar?: boolean;
  'camera-controls'?: boolean;
  'auto-rotate'?: boolean;
  'rotation-per-second'?: string;
  'shadow-intensity'?: string;
  'exposure'?: string;
  loading?: 'auto' | 'lazy' | 'eager';
  'interaction-prompt'?: 'auto' | 'none';
  style?: React.CSSProperties;
}

interface ThreeDObjectCardProps {
  item: ThreeDObjectStop;
}

export const ThreeDObjectCard: React.FC<ThreeDObjectCardProps> = ({ item }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100">
      <div className="w-full h-80 bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <model-viewer
          src={item.modelUrl}
          alt="3D model"
          camera-controls
          auto-rotate
          rotation-per-second="30deg"
          shadow-intensity="1"
          exposure="1"
          loading="eager"
          interaction-prompt="auto"
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent'
          }}
        />
      </div>
      {item.caption && (
        <div className="p-6">
          <p className="text-gray-700 text-sm leading-relaxed">{item.caption}</p>
        </div>
      )}
    </div>
  );
};
