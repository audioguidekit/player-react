import React from 'react';
import { Check } from 'lucide-react';
import * as flags from 'country-flag-icons/react/3x2';
import tw from 'twin.macro';
import styled from 'styled-components';
import { BottomSheet } from '../BottomSheet';
import { Language } from '../../types';

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
  $isSelected && {
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  !$isSelected && {
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.text.secondary,
  },
]);

export const LanguageSheet: React.FC<LanguageSheetProps> = ({
  isOpen,
  selectedLanguage,
  languages,
  onSelect,
  onClose
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <Container>
        <LanguageList>
          {languages.map((lang) => {
            const FlagIcon = flags[lang.countryCode as keyof typeof flags] as React.ComponentType<React.SVGProps<SVGSVGElement>>;

            return (
              <LanguageButton
                key={lang.code}
                onClick={() => onSelect(lang)}
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
                  <Check size={20} strokeWidth={4} style={{ color: 'inherit', opacity: 0.5 }} />
                )}
              </LanguageButton>
            );
          })}
        </LanguageList>
      </Container>
    </BottomSheet>
  );
};