import React, { useEffect, useRef, useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { NavigationArrowIcon } from '@phosphor-icons/react/dist/csr/NavigationArrow';
import type { StopLocation } from '../types';
import { useTranslation } from '../src/translations';
import { fillText } from '../src/stopSearch/searchStops';
import { directionsLinks, type DirectionsApp } from '../src/directions/links';

interface DirectionsActionProps {
  location: StopLocation;
  /** The stop's name, so the button says where it leads ("Directions to Park Güell"). */
  stopName?: string;
  /** Used to make element ids unique per stop. */
  stopId: string;
}

const Wrapper = styled.div`
  ${tw`flex flex-col items-start gap-1 px-1 pb-3`}
`;

const Trigger = styled.button`
  ${tw`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium bg-transparent`}
  min-height: 36px;
  border-color: ${({ theme }) => theme.colors.border.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.text.secondary};
    outline-offset: 2px;
  }
`;

const List = styled.ul`
  ${tw`flex flex-wrap gap-2 m-0 p-0 list-none`}
`;

const Hint = styled.span`
  ${tw`text-xs w-full`}
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const AppLink = styled.a`
  ${tw`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium no-underline`}
  min-height: 36px;
  background-color: ${({ theme }) => theme.buttons.primary.backgroundColor};
  color: ${({ theme }) => theme.buttons.primary.textColor};
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.text.secondary};
    outline-offset: 2px;
  }
`;

/**
 * A "Directions" button under a stop that has a location. It opens a short list of links, one per
 * maps app, right below the button (no floating layer to position inside the scrolling list).
 * Escape or choosing an app closes the list and returns focus to the button.
 */
export const DirectionsAction: React.FC<DirectionsActionProps> = ({ location, stopName, stopId }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = `directions-${stopId}`;
  const names: Record<DirectionsApp, string> = { google: t.directions.googleMaps, apple: t.directions.appleMaps, waze: t.directions.waze };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <Wrapper data-testid="directions">
      <Trigger
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={stopName ? fillText(t.directions.to, { name: stopName }) : t.directions.label}
        onClick={() => setOpen((value) => !value)}
      >
        <NavigationArrowIcon size={16} weight="bold" aria-hidden="true" />
        {t.directions.label}
      </Trigger>
      {open && (
        <List id={listId} aria-label={t.directions.openIn}>
          {directionsLinks(location).map(({ app, url }) => (
            <li key={app}>
              <AppLink
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                data-app={app}
                onClick={() => setOpen(false)}
              >
                {names[app]}
              </AppLink>
            </li>
          ))}
        </List>
      )}
    </Wrapper>
  );
};
