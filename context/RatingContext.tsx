import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storageService } from '../src/services/storageService';

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
    submitRating: () => void;
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

    const submitRating = () => {
        if (!tourId) {
            console.warn('Cannot submit rating: tourId is not set');
            return;
        }

        const ratingData = {
            tourId,
            rating,
            feedback,
            email,
            submittedAt: new Date().toISOString(),
        };

        storageService.saveTourRating(tourId, ratingData);
        setIsSubmitted(true);
        console.log('Rating saved to localStorage:', ratingData);
    };

    const resetRating = () => {
        setRating(0);
        setFeedback('');
        setEmail('');
        setIsSubmitted(false);
    };

    return (
        <RatingContext.Provider
            value={{
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
            }}
        >
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
