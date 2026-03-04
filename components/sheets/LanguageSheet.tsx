import React from 'react';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
// Direct imports instead of wildcard to reduce bundle size (~80-120KB savings)
import { GB, CZ, DE, FR, IT, ES } from 'country-flag-icons/react/3x2';
import tw from 'twin.macro';
import styled from 'styled-components';
import { BottomSheet } from '../BottomSheet';
import { Language } from '../../types';
import { useHaptics } from '../../src/hooks/useHaptics';

// Map country codes to flag components
const flagComponents: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  GB, CZ, DE, FR, IT, ES
};

interface LanguageSheetProps {
  isOpen: boolean;
  selectedLanguage: Language;
  languages: Language[];
  onSelect: (lang: Language) => void;
  onClose: () => void;
}

const Container = styled.div`
  ${tw`p-4 pt-2`}
`;

const LanguageList = styled.div`
  ${tw`space-y-0.5`}
`;

const LanguageButton = styled.button<{ $isSelected: boolean }>(({ $isSelected, theme }) => [
  tw`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200`,
  $isSelected && {
    backgroundColor: theme.colors.background.secondary,
  },
  !$isSelected && tw`active:scale-[0.98]`,
]);

const LanguageContent = styled.div`
  ${tw`flex items-center gap-4`}
`;

const Flag = styled.div`
  ${tw`flex items-center justify-center`}
  width: 32px;
  height: 24px;
  border-radius: 6px;
  overflow: hidden;

  svg {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 6px;
  }
`;

const LanguageName = styled.span<{ $isSelected: boolean }>(({ $isSelected, theme }) => [
  tw`text-lg`,
  {
    fontFamily: theme?.typography?.fontFamily?.sans?.join(', '),
  },
  $isSelected && {
    fontSize: theme.buttons.secondary.fontSize,
    fontWeight: theme.buttons.secondary.fontWeight,
    color: theme.colors.text.primary,
  },
  !$isSelected && {
    fontSize: theme.buttons.secondary.fontSize,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
]);

export const LanguageSheet = React.memo<LanguageSheetProps>(({
  isOpen,
  selectedLanguage,
  languages,
  onSelect,
  onClose
}) => {
  const triggerHaptic = useHaptics();
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <Container>
        <LanguageList>
          {languages.map((lang) => {
            const FlagIcon = flagComponents[lang.countryCode] || GB;

            return (
              <LanguageButton
                key={lang.code}
                onClick={() => {
                  triggerHaptic();
                  onSelect(lang);
                }}
                $isSelected={selectedLanguage.code === lang.code}
              >
                <LanguageContent>
                  <Flag>
                    <FlagIcon />
                  </Flag>
                  <LanguageName $isSelected={selectedLanguage.code === lang.code}>
                    {lang.name}
                  </LanguageName>
                </LanguageContent>
                {selectedLanguage.code === lang.code && (
                  <CheckIcon size={24} weight="bold" style={{ color: 'inherit', opacity: 0.5 }} />
                )}
              </LanguageButton>
            );
          })}
        </LanguageList>
      </Container>
    </BottomSheet>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.selectedLanguage?.code === nextProps.selectedLanguage?.code &&
    prevProps.languages?.length === nextProps.languages?.length
  );
});