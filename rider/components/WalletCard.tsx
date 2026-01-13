
import React from 'react';

interface WalletCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
}

const WalletCard: React.FC<WalletCardProps> = ({ title, amount, icon }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow flex-1 flex flex-col items-center justify-center text-center">
      <div className="text-primary mb-2">{icon}</div>
      <h3 className="text-gray-500 font-semibold">{title}</h3>
      <p className="text-primary text-2xl font-bold">
        ₵{amount.toFixed(2)}
      </p>
    </div>
  );
};

export default WalletCard;
