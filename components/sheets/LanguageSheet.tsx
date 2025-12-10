import React from 'react';
import { CheckCircle2 } from 'lucide-react';
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
  ${tw`space-y-2`}
`;

const LanguageButton = styled.button<{ $isSelected: boolean }>(({ $isSelected }) => [
  tw`w-full flex items-center justify-between p-4 rounded-3xl transition-all duration-200`,
  $isSelected ? tw`bg-gray-100` : tw`active:scale-[0.98]`,
]);

const LanguageContent = styled.div`
  ${tw`flex items-center gap-4`}
`;

const Flag = styled.span`
  ${tw`text-2xl`}
`;

const LanguageName = styled.span<{ $isSelected: boolean }>(({ $isSelected }) => [
  tw`text-lg`,
  $isSelected ? tw`font-bold text-black` : tw`font-medium text-gray-600`,
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
          {languages.map((lang) => (
            <LanguageButton
              key={lang.code}
              onClick={() => onSelect(lang)}
              $isSelected={selectedLanguage.code === lang.code}
            >
              <LanguageContent>
                <Flag>{lang.flag}</Flag>
                <LanguageName $isSelected={selectedLanguage.code === lang.code}>
                  {lang.name}
                </LanguageName>
              </LanguageContent>
              {selectedLanguage.code === lang.code && (
                <CheckCircle2 size={20} className="text-green-500" strokeWidth={2.5} />
              )}
            </LanguageButton>
          ))}
        </LanguageList>
      </Container>
    </BottomSheet>
  );
};