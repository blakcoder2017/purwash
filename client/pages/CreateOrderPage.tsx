
import React, { useState } from 'react';
import SelectionStep from './order_steps/SelectionStep';
import LocationStep from './order_steps/LocationStep';
import ReviewStep from './order_steps/ReviewStep';

type Step = 'selection' | 'location' | 'review';

const CreateOrderPage: React.FC = () => {
  const [step, setStep] = useState<Step>('selection');

  const handleNext = () => {
    if (step === 'selection') setStep('location');
    if (step === 'location') setStep('review');
  };

  const handleBack = () => {
    if (step === 'review') setStep('location');
    if (step === 'location') setStep('selection');
  };

  const renderStep = () => {
    switch (step) {
      case 'selection':
        return <SelectionStep onNext={handleNext} />;
      case 'location':
        return <LocationStep onNext={handleNext} onBack={handleBack} />;
      case 'review':
        return <ReviewStep onBack={handleBack} />;
      default:
        return <SelectionStep onNext={handleNext} />;
    }
  };

  return <div className="max-w-md mx-auto bg-background min-h-screen">{renderStep()}</div>;
};

export default CreateOrderPage;
