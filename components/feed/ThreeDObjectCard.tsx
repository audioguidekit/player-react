import React, { Suspense, lazy, useEffect, useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { ThreeDObjectStop } from '../../types';
import { RichText } from '../RichText';

// Lazy load model-viewer only when needed (saves ~150-200KB from initial bundle)
const loadModelViewer = () => import('@google/model-viewer');

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerJSX & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface ModelViewerJSX {
  src?: string;
  alt?: string;
  ar?: boolean;
  'camera-controls'?: boolean;
  'auto-rotate'?: boolean;
  'rotation-per-second'?: string;
  'shadow-intensity'?: string;
  'exposure'?: string;
  loading?: 'auto' | 'lazy' | 'eager';
  'interaction-prompt'?: 'auto' | 'none';
  style?: React.CSSProperties;
}

interface ThreeDObjectCardProps {
  item: ThreeDObjectStop;
}

const Container = styled.div`
  ${tw`overflow-hidden mb-4`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  border-radius: ${({ theme }) => theme.cards.borderRadius};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.cards.borderColor};
`;

const ViewerContainer = styled.div`
  ${tw`w-full h-80 bg-gradient-to-br relative`}
  background-image: linear-gradient(to bottom right,
    ${({ theme }) => theme.colors.background.secondary},
    ${({ theme }) => theme.colors.background.tertiary}
  );
`;

const SafariFallback = styled.div`
  ${tw`w-full h-full flex items-center justify-center px-6 text-center text-sm`}
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const CaptionContainer = styled.div`
  ${tw`p-6`}
`;

const Caption = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.cards.textColor};
`;

export const ThreeDObjectCard = React.memo<ThreeDObjectCardProps>(({ item }) => {
  // Safari (especially iOS) can lose the WebGL context and crash the page when
  // model-viewer initializes heavy GLB files. Detect Safari and render a safe
  // fallback to avoid the repeated page reload loop the user reported.
  const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Lazy load model-viewer only when component mounts and not on Safari
  const [isModelViewerLoaded, setIsModelViewerLoaded] = useState(false);

  useEffect(() => {
    if (!isSafari && !isModelViewerLoaded) {
      loadModelViewer().then(() => setIsModelViewerLoaded(true));
    }
  }, [isSafari, isModelViewerLoaded]);

  return (
    <Container>
      <ViewerContainer>
        {isSafari ? (
          <SafariFallback>
            3D preview is not available on Safari yet. Please open in Chrome or use the offline guide.
          </SafariFallback>
        ) : !isModelViewerLoaded ? (
          <SafariFallback>
            Loading 3D viewer...
          </SafariFallback>
        ) : (
          <model-viewer
            src={item.modelUrl}
            alt="3D model"
            camera-controls
            auto-rotate
            rotation-per-second="30deg"
            shadow-intensity="1"
            exposure="1"
            loading="eager"
            interaction-prompt="auto"
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent'
            }}
          />
        )}
      </ViewerContainer>
      {item.caption && (
        <CaptionContainer>
          <Caption>
            <RichText content={item.caption} />
          </Caption>
        </CaptionContainer>
      )}
    </Container>
  );
}, (prevProps, nextProps) => {
  return prevProps.item?.id === nextProps.item?.id;
});
