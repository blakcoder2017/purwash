
import React from 'react';

interface PricingFooterProps {
  total: number;
  onNext: () => void;
  buttonText?: string;
  disabled?: boolean;
}

const PricingFooter: React.FC<PricingFooterProps> = ({ total, onNext, buttonText = 'Next', disabled = false }) => (
  <div className="fixed bottom-0 left-0 w-full bg-white p-6 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border-t border-slate-100 rounded-t-3xl">
    <div className="flex justify-between items-center max-w-md mx-auto">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Total</p>
        <p className="text-3xl font-black text-primary">₵{total.toFixed(2)}</p>
      </div>
      <button
        onClick={onNext}
        disabled={disabled}
        className="bg-primary text-white px-8 h-[56px] rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-indigo-200 disabled:bg-slate-300 disabled:shadow-none"
      >
        {buttonText}
      </button>
    </div>
  </div>
);

export default PricingFooter;
