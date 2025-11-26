import React from 'react';
import { ArrowUpToLine, Clock3, MapPin, Headphones } from 'lucide-react';
import { TourData } from '../types';

interface StartCardProps {
  tour: TourData;
  hasStarted: boolean;
  onAction: () => void;
}

export const StartCard: React.FC<StartCardProps> = ({ tour, hasStarted, onAction }) => {
  return (
    // No fixed height. We let the content define the height, and the parent measures it.
    <div className="px-8 pt-8 flex flex-col items-center text-center w-full" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Icon Container */}
      <div className="w-20 h-20 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-center mb-6 border border-gray-50">
        <Headphones size={32} className="text-black" strokeWidth={1.5} />
      </div>

      <div className="mb-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{tour.title}</h1>
      </div>
      <div className="flex items-center gap-6 mb-4 text-gray-500 text-sm font-semibold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <Clock3 size={18} className="text-gray-400" />
          <span>{tour.totalDuration}</span>
        </div>
      </div>
      <p className="text-gray-500 text-base mb-6 leading-relaxed px-2">
        {tour.description}
      </p>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onAction();
        }}
        className="w-full bg-black text-white py-4 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl"
      >
        {hasStarted ? (
          <>
            <ArrowUpToLine size={20} strokeWidth={2.5} />
            Resume tour
          </>
        ) : (
          <>
            <Headphones size={20} strokeWidth={2.5} />
            Start tour
          </>
        )}
      </button>
    </div>
  );
};