import React from 'react';
import { ArrowUpToLine, Clock3, Headphones, WifiOff } from 'lucide-react';
import { TourData } from '../types';

interface StartCardProps {
  tour: TourData;
  hasStarted: boolean;
  onAction: () => void;
  isDownloading?: boolean;
  isDownloaded?: boolean;
  downloadProgress?: number;
  onDownload?: () => void;
  downloadError?: string | null;
}

export const StartCard: React.FC<StartCardProps> = ({
  tour,
  hasStarted,
  onAction,
  isDownloading = false,
  isDownloaded = false,
  downloadProgress = 0,
  onDownload,
  downloadError = null,
}) => {
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

      {/* Download Error Message */}
      {downloadError && (
        <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
          <p className="text-red-700 text-sm font-medium mb-1">Download Failed</p>
          <p className="text-red-600 text-xs leading-relaxed">{downloadError}</p>
          <p className="text-red-500 text-xs mt-2 italic">
            💡 Tip: Use HTTPS or access via localhost for offline downloads
          </p>
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();

          // If tour requires offline download and isn't downloaded yet, start download automatically
          if (tour.offlineAvailable && !isDownloaded && !isDownloading && onDownload) {
            onDownload();
          } else if (!isDownloading && (!tour.offlineAvailable || isDownloaded)) {
            // Start tour if not downloading AND (offline not required OR already downloaded)
            onAction();
          }
        }}
        disabled={isDownloading}
        className="w-full bg-black text-white py-4 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 relative overflow-hidden"
      >
        {/* Progress bar background */}
        {isDownloading && (
          <div
            className="absolute inset-0 bg-gray-700 transition-all duration-300"
            style={{ width: `${downloadProgress}%` }}
          />
        )}

        {/* Button content */}
        <span className="relative z-10 flex items-center gap-3">
          {isDownloading ? (
            <>
              <WifiOff size={20} strokeWidth={2.5} className="animate-pulse" />
              Preparing tour... {downloadProgress}%
            </>
          ) : hasStarted ? (
            <>
              <ArrowUpToLine size={20} strokeWidth={2.5} />
              Resume tour
            </>
          ) : tour.offlineAvailable && !isDownloaded ? (
            <>
              <WifiOff size={20} strokeWidth={2.5} />
              Start tour
            </>
          ) : (
            <>
              <Headphones size={20} strokeWidth={2.5} />
              Start tour
            </>
          )}
        </span>
      </button>
    </div>
  );
};