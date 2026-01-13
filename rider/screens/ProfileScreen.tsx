
import React from 'react';
import { useAppContext } from '../context/AppContext';
import DutyToggle from '../components/DutyToggle';
import { LogoutIcon } from '../components/icons/ActionIcons';
import WalletCard from '../components/WalletCard';
import { WalletSummaryIcons } from '../components/icons/NavIcons';
import { WalletData } from '../types';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAppContext();

  if (!user) return null;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Profile</h1>

      <DutyToggle />
      
      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-bold text-primary mb-4">Earnings Summary</h2>
        <div className="flex space-x-3">
            <WalletCard title="Total Earned" amount={user.wallet.totalEarned} icon={<WalletSummaryIcons.Total />} />
            <WalletCard title="Pending Balance" amount={user.wallet.pendingBalance} icon={<WalletSummaryIcons.Pending />} />
            <WalletCard title="Paid Out" amount={user.wallet.totalEarned - user.wallet.pendingBalance} icon={<WalletSummaryIcons.Paid />} />
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-bold text-primary mb-4">Rider Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Name:</span>
            <span className="font-bold text-primary">
              {user.profile.firstName} {user.profile.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Email:</span>
            <span className="font-bold text-primary">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Phone:</span>
            <span className="font-bold text-primary">{user.profile.phone}</span>
          </div>
        </div>
      </div>

      {user.momo && (
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-xl font-bold text-primary mb-4">MoMo Details</h2>
          <div className="space-y-3">
              <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Network:</span>
                  <span className="font-bold text-primary uppercase">{user.momo.network}</span>
              </div>
              <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Number:</span>
                  <span className="font-bold text-primary">{user.momo.number}</span>
              </div>
              <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Verified Name:</span>
                  <span className="font-bold text-primary">{user.momo.resolvedName}</span>
              </div>
              {user.paystack?.subaccountCode && (
                <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Subaccount:</span>
                    <span className="font-mono text-sm text-primary bg-gray-100 p-1 rounded">{user.paystack.subaccountCode}</span>
                </div>
              )}
          </div>
        </div>
      )}
      
      <button 
        onClick={logout}
        className="w-full mt-4 flex items-center justify-center p-4 bg-red-500 text-white font-bold text-lg rounded-md active:scale-95 transition-transform"
      >
        <LogoutIcon />
        <span className="ml-2">Logout</span>
      </button>

    </div>
  );
};

export default ProfileScreen;
