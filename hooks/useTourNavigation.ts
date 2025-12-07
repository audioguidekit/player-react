import { useState, useCallback, useRef } from 'react';
import { Stop, TourData } from '../types';

interface UseTourNavigationOptions {
    tour: TourData | null;
    onTrackChange?: (stopId: string) => void;
}

interface UseTourNavigationReturn {
    currentStopId: string | null;
    isPlaying: boolean;
    isAudioCompleting: boolean;
    isTransitioning: boolean;
    isSwitchingTracks: boolean;

    // Actions
    setCurrentStopId: (id: string | null) => void;
    setIsPlaying: (playing: boolean) => void;
    handlePlayPause: () => void;
    handleStopClick: (stopId: string) => void;
    handleStopPlayPause: (stopId: string) => void;
    handleNextStop: () => void;
    handlePrevStop: () => void;

    // Transition handling
    startCompletionAnimation: () => void;
    endCompletionAnimation: () => void;
    transitionTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Custom hook for managing tour navigation state and actions.
 * Extracted from App.tsx to reduce component complexity.
 */
export const useTourNavigation = ({
    tour,
    onTrackChange
}: UseTourNavigationOptions): UseTourNavigationReturn => {
    const [currentStopId, setCurrentStopId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAudioCompleting, setIsAudioCompleting] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isSwitchingTracks, setIsSwitchingTracks] = useState(false);
    const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handlePlayPause = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    const handleStopClick = useCallback((clickedStopId: string) => {
        setIsTransitioning(false);
        if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
        }
        setCurrentStopId(clickedStopId);
        setIsPlaying(true);
        onTrackChange?.(clickedStopId);
    }, [onTrackChange]);

    const handleStopPlayPause = useCallback((stopId: string) => {
        if (currentStopId === stopId) {
            setIsPlaying(!isPlaying);
        } else {
            setCurrentStopId(stopId);
            setIsPlaying(true);
            onTrackChange?.(stopId);
        }
    }, [currentStopId, isPlaying, onTrackChange]);

    const handleNextStop = useCallback(() => {
        if (!currentStopId || !tour) return;

        const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
        const nextAudioStop = tour.stops.slice(currentIndex + 1).find(s => s.type === 'audio');

        if (nextAudioStop) {
            setIsSwitchingTracks(true);
            setTimeout(() => {
                setCurrentStopId(nextAudioStop.id);
                setIsPlaying(true);
                setIsSwitchingTracks(false);
                onTrackChange?.(nextAudioStop.id);
            }, 300);
        }
    }, [currentStopId, tour, onTrackChange]);

    const handlePrevStop = useCallback(() => {
        if (!currentStopId || !tour) return;

        const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
        const prevAudioStop = tour.stops.slice(0, currentIndex).reverse().find(s => s.type === 'audio');

        if (prevAudioStop) {
            setIsSwitchingTracks(true);
            setTimeout(() => {
                setCurrentStopId(prevAudioStop.id);
                setIsPlaying(true);
                setIsSwitchingTracks(false);
                onTrackChange?.(prevAudioStop.id);
            }, 300);
        }
    }, [currentStopId, tour, onTrackChange]);

    const startCompletionAnimation = useCallback(() => {
        setIsAudioCompleting(true);
    }, []);

    const endCompletionAnimation = useCallback(() => {
        setIsAudioCompleting(false);
    }, []);

    return {
        currentStopId,
        isPlaying,
        isAudioCompleting,
        isTransitioning,
        isSwitchingTracks,
        setCurrentStopId,
        setIsPlaying,
        handlePlayPause,
        handleStopClick,
        handleStopPlayPause,
        handleNextStop,
        handlePrevStop,
        startCompletionAnimation,
        endCompletionAnimation,
        transitionTimeoutRef
    };
};
