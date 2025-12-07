import React, { createContext, useContext, ReactNode } from 'react';
import { TourData, AudioStop } from '../types';

// Types for tour context
interface TourContextValue {
    // Tour data
    tour: TourData | null;
    tourLoading: boolean;
    tourError: Error | null;

    // Current state
    currentStopId: string | null;
    currentStop: AudioStop | undefined;
    isPlaying: boolean;
    hasStarted: boolean;

    // Progress
    tourProgress: number;
    consumedMinutes: number;
    totalMinutes: number;

    // Navigation
    canGoNext: boolean;
    canGoPrev: boolean;
}

// Create context with undefined default
const TourContext = createContext<TourContextValue | undefined>(undefined);

// Provider component
interface TourProviderProps {
    children: ReactNode;
    value: TourContextValue;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children, value }) => {
    return (
        <TourContext.Provider value={value}>
            {children}
        </TourContext.Provider>
    );
};

// Hook to use tour context
export const useTourContext = (): TourContextValue => {
    const context = useContext(TourContext);

    if (context === undefined) {
        throw new Error('useTourContext must be used within a TourProvider');
    }

    return context;
};

// Selective hooks for specific pieces of state (reduces unnecessary re-renders)
export const useTourData = () => {
    const { tour, tourLoading, tourError } = useTourContext();
    return { tour, tourLoading, tourError };
};

export const useTourPlayback = () => {
    const { currentStopId, currentStop, isPlaying, hasStarted } = useTourContext();
    return { currentStopId, currentStop, isPlaying, hasStarted };
};

export const useTourProgress = () => {
    const { tourProgress, consumedMinutes, totalMinutes } = useTourContext();
    return { tourProgress, consumedMinutes, totalMinutes };
};

export const useTourNavigation = () => {
    const { canGoNext, canGoPrev } = useTourContext();
    return { canGoNext, canGoPrev };
};
