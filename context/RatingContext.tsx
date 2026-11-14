import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { storageService } from '../src/services/storageService';
import { track, submitNow } from '../src/analytics';

interface RatingContextType {
    tourId: string | null;
    setTourId: (id: string) => void;
    rating: number;
    setRating: (rating: number) => void;
    feedback: string;
    setFeedback: (feedback: string) => void;
    email: string;
    setEmail: (email: string) => void;
    isSubmitted: boolean;
    /** `withEmail`: the visitor ticked the consent box and pressed subscribe; otherwise the typed address is discarded. */
    submitRating: (withEmail?: boolean) => void;
    resetRating: () => void;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export const RatingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tourId, setTourId] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Load persisted rating when tourId changes
    useEffect(() => {
        if (!tourId) return;

        const savedRating = storageService.getTourRating(tourId);
        if (savedRating) {
            setRating(savedRating.rating);
            setFeedback(savedRating.feedback);
            setEmail(savedRating.email);
            setIsSubmitted(true);
        } else {
            // Reset to initial state for new tour
            resetRating();
        }
    }, [tourId]);

    const submitRating = useCallback((withEmail = false) => {
        if (!tourId) {
            console.warn('Cannot submit rating: tourId is not set');
            return;
        }

        const ratingData = {
            tourId,
            rating,
            feedback,
            email: withEmail ? email : '',
            submittedAt: new Date().toISOString(),
        };

        // Count a rating once per device and tour: the localStorage guard is the saved rating.
        const alreadyRated = storageService.getTourRating(tourId) !== null;
        storageService.saveTourRating(tourId, ratingData);
        if (!alreadyRated && rating >= 1 && rating <= 5) {
            track('feedback_submit', { tourId, value: rating, comment: feedback });
            // Only a ticked consent box (the sheet's subscribe button) gets here with withEmail.
            if (withEmail && email) void submitNow('email_submit', { tourId, email, consent: true });
        }
        setIsSubmitted(true);
    }, [tourId, rating, feedback, email]);

    const resetRating = useCallback(() => {
        setRating(0);
        setFeedback('');
        setEmail('');
        setIsSubmitted(false);
    }, []);

    // Memoize context value to prevent unnecessary re-renders of consumers
    const value = useMemo(() => ({
        tourId,
        setTourId,
        rating,
        setRating,
        feedback,
        setFeedback,
        email,
        setEmail,
        isSubmitted,
        submitRating,
        resetRating,
    }), [tourId, rating, feedback, email, isSubmitted, submitRating, resetRating]);

    return (
        <RatingContext.Provider value={value}>
            {children}
        </RatingContext.Provider>
    );
};

export const useRating = () => {
    const context = useContext(RatingContext);
    if (context === undefined) {
        throw new Error('useRating must be used within a RatingProvider');
    }
    return context;
};
