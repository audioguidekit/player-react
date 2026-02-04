import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';

interface MobileFrameProps {
    children: React.ReactNode;
    className?: string;
}

const OuterContainer = styled.div`
  ${tw`h-full min-h-screen bg-zinc-800 flex items-center justify-center p-0 md:p-8 font-sans`}
  min-height: ${({ theme }) => theme.platform.viewport.height};
`;

const InnerFrame = styled.div`
  ${tw`w-full max-w-[400px] h-full md:h-[844px] bg-white md:rounded-[2.5rem] relative overflow-hidden shadow-2xl flex flex-col`}
  /* Safe area handled by child components (MiniPlayer, MainSheet) */
`;

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
        <OuterContainer className={className}>
            <InnerFrame>
                {children}
            </InnerFrame>
        </OuterContainer>
    );
};
