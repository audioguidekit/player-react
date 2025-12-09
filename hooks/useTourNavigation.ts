import { useState, useCallback, useRef, useEffect } from 'react';
import { Stop, TourData } from '../types';

interface UseTourNavigationOptions {
    tour: TourData | null;
    onTrackChange?: (stopId: string) => void;
    allowAutoPlay?: boolean;
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
    handleAdvanceToNextTrack: () => void;

    // Transition handling
    handleTrackTransition: () => void;
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
    onTrackChange,
    allowAutoPlay = true,
}: UseTourNavigationOptions): UseTourNavigationReturn => {
    const [currentStopId, setCurrentStopId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAudioCompleting, setIsAudioCompleting] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isSwitchingTracks, setIsSwitchingTracks] = useState(false);
    const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const nextStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const trackSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const allowAutoPlayRef = useRef<boolean>(allowAutoPlay);

    useEffect(() => {
        allowAutoPlayRef.current = allowAutoPlay;
    }, [allowAutoPlay]);

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

            // Clear any existing timeout
            if (nextStopTimeoutRef.current) {
                clearTimeout(nextStopTimeoutRef.current);
            }

            nextStopTimeoutRef.current = setTimeout(() => {
                setCurrentStopId(nextAudioStop.id);
                setIsPlaying(allowAutoPlayRef.current ? true : false);
                setIsSwitchingTracks(false);
                onTrackChange?.(nextAudioStop.id);
                nextStopTimeoutRef.current = null;
            }, 300);
        }
    }, [currentStopId, tour, onTrackChange]);

    const handlePrevStop = useCallback(() => {
        if (!currentStopId || !tour) return;

        const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
        const prevAudioStop = tour.stops.slice(0, currentIndex).reverse().find(s => s.type === 'audio');

        if (prevAudioStop) {
            setIsSwitchingTracks(true);

            // Clear any existing timeout
            if (prevStopTimeoutRef.current) {
                clearTimeout(prevStopTimeoutRef.current);
            }

            prevStopTimeoutRef.current = setTimeout(() => {
                setCurrentStopId(prevAudioStop.id);
                setIsPlaying(allowAutoPlayRef.current ? true : false);
                setIsSwitchingTracks(false);
                onTrackChange?.(prevAudioStop.id);
                prevStopTimeoutRef.current = null;
            }, 300);
        }
    }, [currentStopId, tour, onTrackChange]);

    const handleAdvanceToNextTrack = useCallback(() => {
        if (!currentStopId || !tour) return;

        const currentIndex = tour.stops.findIndex(s => s.id === currentStopId);
        const nextAudioStop = tour.stops.slice(currentIndex + 1).find(s => s.type === 'audio');

        setIsAudioCompleting(false);
        setIsTransitioning(false);

        if (nextAudioStop) {
            setCurrentStopId(nextAudioStop.id);
            setIsPlaying(allowAutoPlayRef.current);

            // Trigger track switch visual effect
            setIsSwitchingTracks(true);

            // Clear any existing timeout
            if (trackSwitchTimeoutRef.current) {
                clearTimeout(trackSwitchTimeoutRef.current);
            }

            trackSwitchTimeoutRef.current = setTimeout(() => {
                setIsSwitchingTracks(false);
                trackSwitchTimeoutRef.current = null;
            }, 150);

            onTrackChange?.(nextAudioStop.id);
        } else {
            // End of tour
            setIsPlaying(false);
        }
    }, [currentStopId, tour, onTrackChange]);

    const handleTrackTransition = useCallback(() => {
        if (!currentStopId || !tour) return;

        // If we're already transitioning, ignore
        if (isTransitioning) return;

        // Start completion animation (Checkmark)
        setIsAudioCompleting(true);

        // If we have transition audio, just set the state.
        // App.tsx's onEnded handler will call handleAdvanceToNextTrack.
        if (tour.transitionAudio) {
            setIsTransitioning(true);
        } else {
            // No transition audio, just use a timeout for the checkmark animation
            if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
            transitionTimeoutRef.current = setTimeout(handleAdvanceToNextTrack, 1500); // 1.5s duration for checkmark
        }
    }, [currentStopId, tour, isTransitioning, handleAdvanceToNextTrack]);

    const startCompletionAnimation = useCallback(() => {
        setIsAudioCompleting(true);
    }, []);

    const endCompletionAnimation = useCallback(() => {
        setIsAudioCompleting(false);
    }, []);

    // Cleanup all timeouts on unmount
    useEffect(() => {
        return () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
                transitionTimeoutRef.current = null;
            }
            if (nextStopTimeoutRef.current) {
                clearTimeout(nextStopTimeoutRef.current);
                nextStopTimeoutRef.current = null;
            }
            if (prevStopTimeoutRef.current) {
                clearTimeout(prevStopTimeoutRef.current);
                prevStopTimeoutRef.current = null;
            }
            if (trackSwitchTimeoutRef.current) {
                clearTimeout(trackSwitchTimeoutRef.current);
                trackSwitchTimeoutRef.current = null;
            }
        };
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
        handleTrackTransition,
        handleAdvanceToNextTrack,
        startCompletionAnimation,
        endCompletionAnimation,
        transitionTimeoutRef
    };
};
