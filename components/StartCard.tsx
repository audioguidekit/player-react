import React from 'react';
import { ArrowUpToLine, Clock3, Headphones, Sparkles, RotateCw } from 'lucide-react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { TourData } from '../types';

interface StartCardProps {
  tour: TourData;
  hasStarted: boolean;
  onAction: () => void;
  isDownloading?: boolean;
  isDownloaded?: boolean;
  downloadProgress?: number;
  onDownload?: () => void;
  downloadError?: string | null;
  tourProgress?: number;
  onResetProgress?: () => void;
}

const Container = styled.div`
  ${tw`px-8 pt-8 flex flex-col items-center text-center w-full`}
  padding-bottom: calc(1rem + ${({ theme }) => theme.platform.safeArea.bottom});
`;

const IconContainer = styled.div`
  ${tw`w-20 h-20 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-center mb-6 border border-gray-50`}
`;

const TitleSection = styled.div`
  ${tw`mb-0`}
`;

const Title = styled.h1`
  ${tw`text-3xl font-bold text-gray-900 mb-2 tracking-tight`}
`;

const MetaContainer = styled.div`
  ${tw`flex items-center gap-6 mb-4 text-gray-500 text-sm font-semibold uppercase tracking-wider`}
`;

const MetaItem = styled.div`
  ${tw`flex items-center gap-2`}
`;

const Description = styled.p`
  ${tw`text-gray-500 text-base mb-6 leading-relaxed px-2`}
`;

const ErrorBox = styled.div`
  ${tw`w-full bg-red-50 border border-red-200 rounded-2xl p-4 mb-4`}
`;

const ErrorTitle = styled.p`
  ${tw`text-red-700 text-sm font-medium mb-1`}
`;

const ErrorMessage = styled.p`
  ${tw`text-red-600 text-xs leading-relaxed`}
`;

const ErrorTip = styled.p`
  ${tw`text-red-500 text-xs mt-2 italic`}
`;

const ActionButton = styled.button<{ $disabled: boolean }>(({ $disabled }) => [
  tw`w-full bg-black text-white py-4 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl relative overflow-hidden`,
  $disabled && tw`opacity-50 cursor-not-allowed active:scale-100`,
]);

const ProgressBar = styled.div<{ $progress: number }>`
  ${tw`absolute inset-0 bg-gray-700 transition-all duration-300`}
  width: ${({ $progress }) => $progress}%;
`;

const ButtonContent = styled.span`
  ${tw`relative z-10 flex items-center gap-3`}
`;

const OfflineBox = styled.div`
  ${tw`w-full bg-amber-50 border border-amber-200 rounded-2xl mt-4 p-4`}
`;

const OfflineMessage = styled.p`
  ${tw`text-amber-900 text-sm leading-relaxed`}
`;

export const StartCard: React.FC<StartCardProps> = ({
  tour,
  hasStarted,
  onAction,
  isDownloading = false,
  isDownloaded = false,
  downloadProgress = 0,
  onDownload,
  downloadError = null,
  tourProgress = 0,
  onResetProgress,
}) => {
  const [loadingDots, setLoadingDots] = React.useState('');

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isDownloading && downloadProgress === 0) {
      interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
    } else {
      setLoadingDots('');
    }

    // Always return cleanup function
    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [isDownloading, downloadProgress]);

  // Check if tour is completed
  const isTourCompleted = tourProgress >= 100;

  return (
    // No fixed height. We let the content define the height, and the parent measures it.
    <Container>
      {/* Icon Container */}
      <IconContainer>
        <Headphones size={32} className="text-black" strokeWidth={1.5} />
      </IconContainer>

      <TitleSection>
        <Title>{tour.title}</Title>
      </TitleSection>
      <MetaContainer>
        <MetaItem>
          <Clock3 size={18} className="text-gray-400" />
          <span>{tour.totalDuration}</span>
        </MetaItem>
      </MetaContainer>
      <Description>
        {tour.description}
      </Description>

      {/* Download Error Message */}
      {downloadError && (
        <ErrorBox>
          <ErrorTitle>Download Failed</ErrorTitle>
          <ErrorMessage>{downloadError}</ErrorMessage>
          <ErrorTip>
            💡 Tip: Use HTTPS or access via localhost for offline downloads
          </ErrorTip>
        </ErrorBox>
      )}

      <ActionButton
        onClick={(e) => {
          e.stopPropagation();

          // If tour is completed, reset progress
          if (isTourCompleted && onResetProgress) {
            onResetProgress();
            return;
          }

          // If tour requires offline download and isn't downloaded yet, start download automatically
          if (tour.offlineAvailable === true && !isDownloaded && !isDownloading && onDownload) {
            onDownload();
          } else if (!isDownloading && (tour.offlineAvailable !== true || isDownloaded)) {
            // Start tour if not downloading AND (offline not required OR already downloaded)
            onAction();
          }
        }}
        disabled={isDownloading}
        $disabled={isDownloading}
      >
        {/* Progress bar background */}
        {isDownloading && (
          <ProgressBar $progress={downloadProgress} />
        )}

        {/* Button content */}
        <ButtonContent>
          {isDownloading ? (
            <>
              <Sparkles size={20} strokeWidth={2.5} className="animate-pulse" />
              {downloadProgress === 0 ? (
                <span className="relative">
                  <span className="opacity-0">Preparing...</span>
                  <span className="absolute left-0 top-0">Preparing{loadingDots}</span>
                </span>
              ) : (
                `Loading tour... ${downloadProgress}%`
              )}
            </>
          ) : isTourCompleted ? (
            <>
              <RotateCw size={20} strokeWidth={2.5} />
              Replay tour
            </>
          ) : hasStarted ? (
            <>
              <ArrowUpToLine size={20} strokeWidth={2.5} />
              Resume tour
            </>
          ) : tour.offlineAvailable === true && !isDownloaded ? (
            <>
              <Sparkles size={20} strokeWidth={2.5} />
              Download tour
            </>
          ) : (
            <>
              <Headphones size={20} strokeWidth={2.5} />
              Start tour
            </>
          )}
        </ButtonContent>
      </ActionButton>
      {/* Offline Download Message - Only shown when offlineAvailable=true and not downloaded */}
      {tour.offlineAvailable === true && !isDownloaded && !isDownloading && (
        <OfflineBox>
          <OfflineMessage>
            Download this tour now to enjoy it offline in areas with limited connectivity.
          </OfflineMessage>
        </OfflineBox>
      )}
    </Container>
  );
};