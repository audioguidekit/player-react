import React from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import tw from 'twin.macro';
import styled from 'styled-components';
import { BottomSheet } from '../BottomSheet';

interface TourCompleteSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onRateTour: () => void;
}

const Container = styled.div`
  ${tw`p-6 pt-2 flex flex-col items-center text-center pb-10`}
`;

const IconCircle = styled.div`
  ${tw`w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6`}
`;

const Title = styled.h2`
  ${tw`text-2xl font-bold text-gray-900 mb-2`}
`;

const Description = styled.p`
  ${tw`text-gray-600 mb-8 max-w-xs`}
`;

const RateButton = styled.button`
  ${tw`w-full bg-black text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 mb-3 active:scale-[0.98] transition-transform`}
`;

const SkipButton = styled.button`
  ${tw`w-full bg-gray-100 text-gray-900 font-bold py-4 px-6 rounded-2xl active:scale-[0.98] transition-transform`}
`;

export const TourCompleteSheet: React.FC<TourCompleteSheetProps> = ({
    isOpen,
    onClose,
    onRateTour
}) => {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <Container>
                <IconCircle>
                    <CheckCircle2 size={40} className="text-green-600" strokeWidth={2.5} />
                </IconCircle>

                <Title>Tour completed!</Title>
                <Description>
                    You've listened to all the audio stops. We hope you enjoyed the tour.
                </Description>

                <RateButton
                    onClick={() => {
                        onClose();
                        onRateTour();
                    }}
                >
                    <Star size={20} className="fill-white" />
                    <span>Rate this tour</span>
                </RateButton>

                <SkipButton onClick={onClose}>
                    Skip rating
                </SkipButton>
            </Container>
        </BottomSheet>
    );
};
