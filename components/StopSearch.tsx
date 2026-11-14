import React, { useRef } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { useTranslation } from '../src/translations';
import { fillText } from '../src/stopSearch/searchStops';

interface StopSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** How many stops match the current query, announced to screen readers. */
  resultCount: number;
}

const Field = styled.div`
  ${tw`relative flex-1 min-w-0 flex items-center`}
`;

const SearchIcon = styled.span`
  ${tw`absolute left-3 flex pointer-events-none`}
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const Input = styled.input`
  ${tw`w-full h-11 pl-10 pr-10 rounded-full border text-base outline-none`}
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-color: ${({ theme }) => theme.colors.border.light};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: inherit;
  appearance: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.text.secondary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.border.medium};
  }
  /* The browser's own clear button would duplicate ours. */
  &::-webkit-search-cancel-button,
  &::-webkit-search-decoration {
    -webkit-appearance: none;
  }
`;

const ClearButton = styled.button`
  ${tw`absolute right-1 w-9 h-9 p-0 border-0 rounded-full flex items-center justify-center bg-transparent`}
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Status = styled.p`
  ${tw`sr-only`}
`;

/**
 * The search field above a long stop list. A labelled `type="search"` input in a `search` landmark;
 * Escape or the clear button empties it and keeps focus; a polite status region says how many stops
 * are left, so a screen reader hears the effect of typing.
 */
export const StopSearch: React.FC<StopSearchProps> = ({ query, onQueryChange, resultCount }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const searching = query.trim().length > 0;

  const status = !searching
    ? ''
    : resultCount === 0
      ? t.stopSearch.noResults
      : resultCount === 1
        ? t.stopSearch.resultOne
        : fillText(t.stopSearch.resultMany, { count: resultCount });

  return (
    <Field role="search" data-testid="stop-search">
      <SearchIcon aria-hidden="true">
        <MagnifyingGlassIcon size={20} />
      </SearchIcon>
      <Input
        ref={inputRef}
        type="search"
        value={query}
        aria-label={t.stopSearch.label}
        placeholder={t.stopSearch.placeholder}
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && query) {
            e.preventDefault();
            e.stopPropagation();
            onQueryChange('');
          }
        }}
      />
      {query && (
        <ClearButton
          type="button"
          aria-label={t.stopSearch.clear}
          onClick={() => {
            onQueryChange('');
            inputRef.current?.focus();
          }}
        >
          <XIcon size={18} weight="bold" />
        </ClearButton>
      )}
      <Status role="status" aria-live="polite">{status}</Status>
    </Field>
  );
};
