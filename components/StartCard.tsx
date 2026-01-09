import React from 'react';
import { ArrowLineUpIcon, ClockIcon, HeadphonesIcon, SparkleIcon, ArrowClockwiseIcon } from '@phosphor-icons/react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { TourData } from '../types';
import { useTranslation } from '../src/translations';

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
  ${tw`w-20 h-20 rounded-2xl flex items-center justify-center mb-6`}
  background-color: ${({ theme }) => theme.cards.backgroundColor};
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  color: ${({ theme }) => theme.branding.iconColor};
`;

const TitleSection = styled.div`
  ${tw`mb-0`}
`;

const Title = styled.h1`
  ${tw`mb-2 tracking-tight`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  font-size: ${({ theme }) => theme.startCard.titleFontSize};
  font-weight: ${({ theme }) => theme.startCard.titleFontWeight};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const MetaContainer = styled.div`
  ${tw`flex items-center gap-6 mb-4 uppercase tracking-wider`}
  font-family: ${({ theme }) =>
    theme?.typography?.fontFamily?.numbers
      ? theme.typography.fontFamily.numbers.join(', ')
      : theme?.typography?.fontFamily?.sans?.join(', ') || 'Inter, sans-serif'
  };
  font-size: ${({ theme }) => theme.startCard.metaFontSize};
  font-weight: ${({ theme }) => theme.startCard.metaFontWeight};
  color: ${({ theme }) => theme.startCard.metaColor};
`;

const MetaItem = styled.div`
  ${tw`flex items-center gap-2`}
`;

const Description = styled.p`
  ${tw`mb-6 leading-relaxed px-2`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  font-size: ${({ theme }) => theme.startCard.descriptionFontSize};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ErrorBox = styled.div`
  ${tw`w-full p-4 mb-4`}
  background-color: ${({ theme }) => `${theme.status.error}15`};
  border: 1px solid ${({ theme }) => `${theme.status.error}40`};
  border-radius: 16px;
`;

const ErrorTitle = styled.p`
  ${tw`text-sm font-medium mb-1`}
  color: ${({ theme }) => theme.status.error};
`;

const ErrorMessage = styled.p`
  ${tw`text-xs leading-relaxed`}
  color: ${({ theme }) => theme.status.error};
  opacity: 0.9;
`;

const ErrorTip = styled.p`
  ${tw`text-xs mt-2 italic`}
  color: ${({ theme }) => theme.status.error};
  opacity: 0.8;
`;

const ActionButton = styled.button<{ $disabled: boolean }>(({ $disabled, theme }) => [
  tw`w-full py-4 rounded-full flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-300 relative overflow-hidden`,
  {
    backgroundColor: theme.buttons.primary.backgroundColor,
    color: theme.buttons.primary.textColor,
    fontFamily: theme.buttons.primary.fontFamily?.join(', ') || theme?.typography?.fontFamily?.sans?.join(', '),
    fontSize: theme.buttons.primary.fontSize,
    fontWeight: theme.buttons.primary.fontWeight,
    '& svg': {
      color: theme.buttons.primary.iconColor || theme.buttons.primary.textColor,
    },
  },
  $disabled && tw`opacity-50 cursor-not-allowed active:scale-100`,
]);

const ProgressBar = styled.div<{ $progress: number }>`
  ${tw`absolute inset-0 transition-all duration-300`}
  background-color: ${({ theme }) => theme.buttons.primary.hoverBackground || theme.buttons.primary.backgroundColor};
  opacity: 0.8;
  width: ${({ $progress }) => $progress}%;
`;

const ButtonContent = styled.span`
  ${tw`relative z-10 flex items-center gap-2`}
`;

const OfflineBox = styled.div`
  ${tw`w-full mt-4 p-4`}
  background-color: ${({ theme }) => `${theme.status.warning}15`};
  border: 1px solid ${({ theme }) => `${theme.status.warning}40`};
  border-radius: 16px;
`;

const OfflineMessage = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.status.warning};
  filter: brightness(0.6);
`;

export const StartCard = React.memo<StartCardProps>(({
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
  const { t } = useTranslation();
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
        <HeadphonesIcon size={32} style={{ color: 'currentColor' }} weight="duotone" />
      </IconContainer>

      <TitleSection>
        <Title>{tour.title}</Title>
      </TitleSection>
      <MetaContainer>
        <MetaItem>
          <ClockIcon size={18} />
          <span>{tour.totalDuration}</span>
        </MetaItem>
      </MetaContainer>
      <Description>
        {tour.description}
      </Description>

      {/* Download Error Message */}
      {downloadError && (
        <ErrorBox>
          <ErrorTitle>{t.errors.downloadFailed}</ErrorTitle>
          <ErrorMessage>{downloadError}</ErrorMessage>
          <ErrorTip>
            {t.errors.httpsTooltip}
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
              <SparkleIcon size={20} weight="bold" className="animate-pulse" />
              {downloadProgress === 0 ? (
                <span className="relative">
                  <span className="opacity-0">{t.startCard.preparing}</span>
                  <span className="absolute left-0 top-0">{t.startCard.preparing.replace('...', '')}{loadingDots}</span>
                </span>
              ) : (
                `${t.startCard.loadingTour} ${downloadProgress}%`
              )}
            </>
          ) : isTourCompleted ? (
            <>
              <ArrowClockwiseIcon size={20} weight="bold" />
              {t.startCard.replayTour}
            </>
          ) : hasStarted ? (
            <>
              <ArrowLineUpIcon size={20} weight="bold" />
              {t.startCard.resumeTour}
            </>
          ) : tour.offlineAvailable === true && !isDownloaded ? (
            <>
              <SparkleIcon size={20} weight="bold" />
              {t.startCard.downloadTour}
            </>
          ) : (
            <>
              <HeadphonesIcon size={20} weight="bold" />
              {t.startCard.startTour}
            </>
          )}
        </ButtonContent>
      </ActionButton>
      {/* Offline Download Message - Only shown when offlineAvailable=true and not downloaded */}
      {tour.offlineAvailable === true && !isDownloaded && !isDownloading && (
        <OfflineBox>
          <OfflineMessage>
            {t.startCard.offlineInfo}
          </OfflineMessage>
        </OfflineBox>
      )}
    </Container>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.tour?.id === nextProps.tour?.id &&
    prevProps.hasStarted === nextProps.hasStarted &&
    prevProps.isDownloading === nextProps.isDownloading &&
    prevProps.isDownloaded === nextProps.isDownloaded &&
    prevProps.downloadProgress === nextProps.downloadProgress &&
    prevProps.tourProgress === nextProps.tourProgress &&
    prevProps.downloadError === nextProps.downloadError
  );
});