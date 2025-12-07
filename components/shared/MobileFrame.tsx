import React from 'react';

interface MobileFrameProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Container that provides mobile device frame styling.
 * - Full height on mobile
 * - Rounded corners with shadow on desktop
 * - Max width of 400px on desktop
 */
export const MobileFrame: React.FC<MobileFrameProps> = ({
    children,
    className = ''
}) => {
    return (
        <div className={`min-h-screen bg-zinc-800 flex items-center justify-center p-0 md:p-8 font-sans ${className}`}>
            <div className="w-full max-w-[400px] h-[100dvh] md:h-[844px] bg-white md:rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                {children}
            </div>
        </div>
    );
};
