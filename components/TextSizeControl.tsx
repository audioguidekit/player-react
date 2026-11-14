import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { useHaptics } from '../src/hooks/useHaptics';
import { useTranslation } from '../src/translations';
import { TEXT_SIZES, setTextSize, useTextSize, type TextSize } from '../src/textSize/textSize';

const Group = styled.div`
  ${tw`flex items-center shrink-0 rounded-full border p-0.5`}
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-color: ${({ theme }) => theme.colors.border.light};
`;

const Step = styled.button<{ $pressed: boolean; $glyph: number }>(({ $pressed, $glyph, theme }) => [
  tw`flex items-center justify-center rounded-full border-0 p-0 font-semibold leading-none`,
  {
    width: '40px',
    height: '40px',
    fontSize: `${$glyph}px`,
    backgroundColor: $pressed ? theme.buttons.primary.backgroundColor : 'transparent',
    color: $pressed ? theme.buttons.primary.textColor : theme.colors.text.secondary,
    transition: 'background-color 100ms ease-in-out, color 100ms ease-in-out',
    '&:focus-visible': { outline: `2px solid ${theme.colors.text.secondary}`, outlineOffset: '1px' },
  },
]);

const GLYPH: Record<TextSize, number> = { default: 14, large: 18, larger: 22 };

/**
 * Three "A"s of growing size, as toggle buttons in a labelled group: Tab reaches each one and
 * Space or Enter picks it; the pressed one is exposed through `aria-pressed`. The visible letters
 * are decoration, each button has a spoken name ("Large text").
 */
export const TextSizeControl: React.FC = () => {
  const size = useTextSize();
  const { t } = useTranslation();
  const triggerHaptic = useHaptics();
  const names: Record<TextSize, string> = { default: t.textSize.default, large: t.textSize.large, larger: t.textSize.larger };

  return (
    <Group role="group" aria-label={t.textSize.label} data-testid="text-size">
      {TEXT_SIZES.map((step) => (
        <Step
          key={step}
          type="button"
          data-text-size={step}
          $pressed={size === step}
          $glyph={GLYPH[step]}
          aria-pressed={size === step}
          aria-label={names[step]}
          onClick={() => {
            if (size !== step) triggerHaptic();
            setTextSize(step);
          }}
        >
          <span aria-hidden="true">A</span>
        </Step>
      ))}
    </Group>
  );
};
