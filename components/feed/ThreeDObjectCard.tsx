import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { ThreeDObjectStop } from '../../types';
import '@google/model-viewer';

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
  ${tw`bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100`}
`;

const ViewerContainer = styled.div`
  ${tw`w-full h-80 bg-gradient-to-br from-gray-50 to-gray-100 relative`}
`;

const SafariFallback = styled.div`
  ${tw`w-full h-full flex items-center justify-center px-6 text-center text-sm text-gray-600`}
`;

const CaptionContainer = styled.div`
  ${tw`p-6`}
`;

const Caption = styled.p`
  ${tw`text-gray-700 text-sm leading-relaxed`}
`;

export const ThreeDObjectCard: React.FC<ThreeDObjectCardProps> = ({ item }) => {
  // Safari (especially iOS) can lose the WebGL context and crash the page when
  // model-viewer initializes heavy GLB files. Detect Safari and render a safe
  // fallback to avoid the repeated page reload loop the user reported.
  const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <Container>
      <ViewerContainer>
        {isSafari ? (
          <SafariFallback>
            3D preview is not available on Safari yet. Please open in Chrome or use the offline guide.
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
          <Caption>{item.caption}</Caption>
        </CaptionContainer>
      )}
    </Container>
  );
};
