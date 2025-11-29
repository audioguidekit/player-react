import React, { useEffect } from 'react';
import { Home } from 'lucide-react';
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion';

interface TourHeaderAltProps {
    onBack: () => void;
    progressWidth: MotionValue<string>;
    consumedMinutes: number;
    totalMinutes: number;
}

// Helper component for animating numbers smoothly
const AnimatedCounter = ({ value }: { value: number }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 35, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
};

export const TourHeaderAlt: React.FC<TourHeaderAltProps> = ({
    onBack,
    progressWidth,
    consumedMinutes,
    totalMinutes,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.15, duration: 0.2 }}
            className="sticky top-0 z-30 px-6 py-2 bg-white/80 backdrop-blur-md border-b border-gray-100"
        >
            <div className="flex items-center gap-4">
                {/* Home Button - Ghost Style */}
                <button
                    onClick={onBack}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-black hover:bg-gray-100 transition-colors active:scale-95 shrink-0"
                >
                    <Home size={24} />
                </button>

                {/* Progress Section (Inline) - No Container */}
                <div className="flex-1 flex items-center gap-3">
                    {/* Progress Bar */}
                    <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <motion.div
                            style={{ width: progressWidth }}
                            className="bg-black h-full rounded-full"
                        />
                    </div>

                    {/* Time Remaining Text */}
                    <div className="text-sm font-medium text-gray-500 whitespace-nowrap tabular-nums">
                        <AnimatedCounter value={totalMinutes - consumedMinutes} /> min left
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
