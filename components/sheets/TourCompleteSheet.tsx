import React from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import { BottomSheet } from '../BottomSheet';

interface TourCompleteSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onRateTour: () => void;
}

export const TourCompleteSheet: React.FC<TourCompleteSheetProps> = ({
    isOpen,
    onClose,
    onRateTour
}) => {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <div className="p-6 pt-2 flex flex-col items-center text-center pb-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-green-600" strokeWidth={2.5} />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tour completed!</h2>
                <p className="text-gray-600 mb-8 max-w-xs">
                    You've listened to all the audio stops. We hope you enjoyed the tour.
                </p>

                <button
                    onClick={() => {
                        onClose();
                        onRateTour();
                    }}
                    className="w-full bg-black text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 mb-3 active:scale-[0.98] transition-transform"
                >
                    <Star size={20} className="fill-white" />
                    <span>Rate this Tour</span>
                </button>

                <button
                    onClick={onClose}
                    className="w-full bg-gray-100 text-gray-900 font-bold py-4 px-6 rounded-2xl active:scale-[0.98] transition-transform"
                >
                    Skip rating
                </button>
            </div>
        </BottomSheet>
    );
};
