
import React from 'react';
import PlusIcon from './icons/PlusIcon';
import MinusIcon from './icons/MinusIcon';

interface StepperProps {
  value: number;
  onChange: (newValue: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ value, onChange }) => {
  const handleIncrement = () => onChange(value + 1);
  const handleDecrement = () => onChange(Math.max(0, value - 1));

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleDecrement}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 text-primary active:scale-95 transition-transform disabled:opacity-50"
        disabled={value === 0}
      >
        <MinusIcon className="w-5 h-5" />
      </button>
      <span className="text-xl font-bold text-primary w-8 text-center">{value}</span>
      <button
        onClick={handleIncrement}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white active:scale-95 transition-transform"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Stepper;
