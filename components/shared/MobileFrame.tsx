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
        <div className={`h-full min-h-screen bg-zinc-800 flex items-center justify-center p-0 md:p-8 font-sans ${className}`} style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
            <div className="w-full max-w-[400px] h-full md:h-[844px] bg-white md:rounded-[2.5rem] relative overflow-hidden shadow-2xl safe-area-insets flex flex-col" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
                {children}
            </div>
        </div>
    );
};
