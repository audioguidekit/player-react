import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { BottomSheet } from '../BottomSheet';
import { Language } from '../../types';

interface LanguageSheetProps {
  isOpen: boolean;
  selectedLanguage: Language;
  languages: Language[];
  onSelect: (lang: Language) => void;
  onClose: () => void;
}

export const LanguageSheet: React.FC<LanguageSheetProps> = ({
  isOpen,
  selectedLanguage,
  languages,
  onSelect,
  onClose
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="p-4 pt-2">
        <div className="space-y-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onSelect(lang);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200
                ${selectedLanguage.code === lang.code 
                  ? 'bg-gray-100 shadow-inner' 
                  : 'hover:bg-gray-50 active:scale-[0.98]'}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{lang.flag}</span>
                {/* Increased text size to text-lg */}
                <span className={`text-lg ${selectedLanguage.code === lang.code ? 'font-bold text-black' : 'font-medium text-gray-600'}`}>
                  {lang.name}
                </span>
              </div>
              {selectedLanguage.code === lang.code && (
                <CheckCircle2 size={20} className="text-black" strokeWidth={2.5} />
              )}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};