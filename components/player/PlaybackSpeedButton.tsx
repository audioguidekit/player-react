import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useTranslation } from '../../src/translations';
import {
  formatPlaybackSpeed,
  nextPlaybackSpeed,
  setPlaybackSpeed,
  usePlaybackSpeed,
} from '../../src/playback/playbackSpeed';

interface PlaybackSpeedButtonProps {
  /** `filled` matches the mini player's round buttons, `plain` the fullscreen header's. */
  variant?: 'filled' | 'plain';
  className?: string;
}

const Button = styled.button<{ $variant: 'filled' | 'plain'; $changed: boolean }>(({ $variant, $changed, theme }) => [
  tw`p-0 border-0 rounded-full flex items-center justify-center shrink-0 font-semibold`,
  {
    width: '48px',
    height: '48px',
    fontSize: '0.875rem',
    fontVariantNumeric: 'tabular-nums',
    backgroundColor: $variant === 'filled' ? theme.buttons.transcription.backgroundColor : 'transparent',
    color: $variant === 'filled' ? theme.buttons.transcription.iconColor : theme.miniPlayer.textColor,
    opacity: $variant === 'plain' && !$changed ? 0.7 : 1,
    transformOrigin: 'center center',
    transition: 'background-color 100ms ease-in-out, opacity 100ms ease-in-out, transform 100ms ease-out',
    '@media (hover: hover)': {
      '&:hover': {
        backgroundColor: theme.miniPlayer.controls.otherButtonsHoverBackground || theme.buttons.transcription.backgroundColor,
      },
    },
    '&:active': {
      transform: 'scale(0.9)',
    },
  },
]);

const Announcement = styled.span`
  ${tw`sr-only`}
`;

/**
 * One button that steps through 0.75x, 1x, 1.25x, 1.5x and 2x. The speed is the visitor's own,
 * remembered on the device (see `src/playback/playbackSpeed.ts`). The label names the control and
 * its current value; a polite live region announces each change to a screen reader.
 */
export const PlaybackSpeedButton: React.FC<PlaybackSpeedButtonProps> = ({ variant = 'filled', className }) => {
  const speed = usePlaybackSpeed();
  const { t } = useTranslation();
  const triggerHaptic = useHaptics();
  const label = formatPlaybackSpeed(speed);

  return (
    <>
      <Button
        type="button"
        data-testid="playback-speed"
        className={className}
        $variant={variant}
        $changed={speed !== 1}
        aria-label={`${t.playback.speed}: ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          triggerHaptic();
          setPlaybackSpeed(nextPlaybackSpeed(speed));
        }}
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        {label}
      </Button>
      <Announcement role="status" aria-live="polite">{`${t.playback.speed}: ${label}`}</Announcement>
    </>
  );
};
