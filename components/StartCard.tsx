import React from 'react';
import { ArrowLineUpIcon, ClockIcon, HeadphonesIcon, SparkleIcon, ArrowClockwiseIcon, CloudArrowDownIcon, CloudSlashIcon } from '@phosphor-icons/react';
import tw from 'twin.macro';
import styled, { useTheme } from 'styled-components';
import { TourData } from '../types';
import { ThemeConfig } from '../src/theme/types';
import { useTranslation } from '../src/translations';
import { getOfflineMode } from '../src/utils/offlineMode';

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
  ${tw`px-8 pt-10 flex flex-col items-center text-center w-full`}
  padding-bottom: calc(0.20rem + ${({ theme }) => theme.platform.safeArea.bottom});
`;

const IconContainer = styled.div<{ $showBorder?: boolean }>`
  ${tw`flex items-center justify-center mb-2`}
  ${({ $showBorder }) => $showBorder !== false && tw`w-20 h-20 rounded-2xl`}
  background-color: ${({ theme, $showBorder }) => $showBorder !== false ? theme.cards.backgroundColor : 'transparent'};
  box-shadow: ${({ $showBorder }) => $showBorder !== false ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' : 'none'};
  border: ${({ theme, $showBorder }) => $showBorder !== false ? `1px solid ${theme.colors.border.light}` : 'none'};
`;

const LogoImage = styled.img<{ $size?: 'fit' | 'original' }>`
  ${({ $size }) => $size === 'original' ? tw`max-w-full` : tw`w-12 h-12 object-contain`}
`;

const TitleSection = styled.div`
  ${tw`mb-0 mt-4`}
`;

const Title = styled.h1`
  ${tw`mb-2 tracking-tight`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  font-size: ${({ theme }) => theme.startCard.titleFontSize};
  font-weight: ${({ theme }) => theme.startCard.titleFontWeight};
  line-height: ${({ theme }) => theme.startCard.titleLineHeight};
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
  background-color: ${({ theme }) => theme.startCard.offlineMessage.backgroundColor};
  border: 1px solid ${({ theme }) => theme.startCard.offlineMessage.borderColor};
  border-radius: 16px;
`;

const OfflineMessage = styled.p`
  ${tw`text-sm leading-relaxed`}
  color: ${({ theme }) => theme.startCard.offlineMessage.textColor};
`;

const DownloadButton = styled.button<{ $disabled?: boolean }>(({ $disabled, theme }) => [
  tw`w-full py-4 mt-4 rounded-full flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-300 relative overflow-hidden`,
  {
    backgroundColor: theme.buttons.download.backgroundColor,
    color: theme.buttons.download.textColor,
    border: theme.buttons.download.borderColor ? `2px solid ${theme.buttons.download.borderColor}` : 'none',
    fontFamily: theme.buttons.download.fontFamily?.join(', ') || theme?.typography?.fontFamily?.sans?.join(', '),
    fontSize: theme.buttons.download.fontSize,
    fontWeight: theme.buttons.download.fontWeight,
    '& svg': {
      color: theme.buttons.download.iconColor || theme.buttons.download.textColor,
    },
    '&:hover': {
      backgroundColor: theme.buttons.download.hoverBackground || theme.buttons.download.backgroundColor,
    },
  },
  $disabled && tw`opacity-50 cursor-not-allowed active:scale-100`,
]);

const OfflineStatus = styled.div`
  ${tw`flex items-center justify-center gap-2 mt-4 py-2`}
  font-family: ${({ theme }) => theme?.typography?.fontFamily?.sans?.join(', ')};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
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
  const theme = useTheme() as ThemeConfig;
  const logoUrl = theme.branding.logoUrl;
  const showLogoBorder = theme.branding.showLogoBorder;
  const logoSize = theme.branding.logoSize;
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

  // Get offline mode for the tour (defaults to 'optional')
  const offlineMode = getOfflineMode(tour);

  return (
    // No fixed height. We let the content define the height, and the parent measures it.
    <Container>
      {/* Logo Container - only shown when logoUrl is set */}
      {logoUrl && (
        <IconContainer $showBorder={showLogoBorder}>
          <LogoImage src={logoUrl} alt="Logo" $size={logoSize} />
        </IconContainer>
      )}

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

          // If tour requires offline download (offline-only mode) and isn't downloaded yet, start download automatically
          if (offlineMode === 'offline-only' && !isDownloaded && !isDownloading && onDownload) {
            onDownload();
          } else if (!isDownloading && (offlineMode !== 'offline-only' || isDownloaded)) {
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
          ) : offlineMode === 'offline-only' && !isDownloaded ? (
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
      {/* Offline Download Message - Only shown for offline-only mode when not downloaded */}
      {offlineMode === 'offline-only' && !isDownloaded && !isDownloading && (
        <OfflineBox>
          <OfflineMessage>
            {t.startCard.offlineInfo}
          </OfflineMessage>
        </OfflineBox>
      )}

      {/* Download Option - For tours where offline is optional (hidden during download since primary button shows progress) */}
      {offlineMode === 'optional' && !isTourCompleted && !isDownloading && (
        <>
          {isDownloaded ? (
            <OfflineStatus>
              <CloudSlashIcon size={18} weight="bold" />
              {t.startCard.availableOffline}
            </OfflineStatus>
          ) : onDownload && (
            <DownloadButton onClick={(e) => { e.stopPropagation(); onDownload(); }}>
              <CloudArrowDownIcon size={20} weight="bold" />
              {t.startCard.downloadForOffline}
            </DownloadButton>
          )}
        </>
      )}

      {/* Offline status for offline-only mode when downloaded */}
      {offlineMode === 'offline-only' && isDownloaded && !isTourCompleted && (
        <OfflineStatus>
          <CloudSlashIcon size={18} weight="bold" />
          {t.startCard.availableOffline}
        </OfflineStatus>
      )}
    </Container>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.tour?.id === nextProps.tour?.id &&
    prevProps.tour?.language === nextProps.tour?.language &&
    prevProps.tour?.offlineMode === nextProps.tour?.offlineMode &&
    prevProps.hasStarted === nextProps.hasStarted &&
    prevProps.isDownloading === nextProps.isDownloading &&
    prevProps.isDownloaded === nextProps.isDownloaded &&
    prevProps.downloadProgress === nextProps.downloadProgress &&
    prevProps.tourProgress === nextProps.tourProgress &&
    prevProps.downloadError === nextProps.downloadError
  );
});