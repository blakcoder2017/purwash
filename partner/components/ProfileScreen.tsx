import React from 'react';
import { useAppContext } from '../context/AppContext';
import OnlineStatusToggle from './OnlineStatusToggle';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAppContext();

  if (!user) return null;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Profile</h1>
      
      <OnlineStatusToggle />
      
      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-bold text-primary mb-4">Earnings Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              ₵{user.wallet?.totalEarned || 0}
            </div>
            <div className="text-sm text-gray-600">Total Earned</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">
              ₵{user.wallet?.pendingBalance || 0}
            </div>
            <div className="text-sm text-gray-600">Pending Balance</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              ₵{(user.wallet?.totalEarned || 0) - (user.wallet?.pendingBalance || 0)}
            </div>
            <div className="text-sm text-gray-600">Paid Out</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-bold text-primary mb-4">Business Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Business Name:</span>
            <span className="font-bold text-primary">{user.businessName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Owner Name:</span>
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
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Location:</span>
            <span className="font-bold text-primary text-sm">{user.location?.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Operating Hours:</span>
            <span className="font-bold text-primary">
              {user.operatingHours?.open} - {user.operatingHours?.close}
            </span>
          </div>
          {user.bio && (
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Bio:</span>
              <span className="font-bold text-primary text-sm max-w-xs text-right">{user.bio}</span>
            </div>
          )}
        </div>
      </div>

      {user.momo && (
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-xl font-bold text-primary mb-4">Payment Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">MoMo Network:</span>
              <span className="font-bold text-primary uppercase">{user.momo.network}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">MoMo Number:</span>
              <span className="font-bold text-primary">{user.momo.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Verified Name:</span>
              <span className="font-bold text-primary">{user.momo.resolvedName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Verification Status:</span>
              <span className={`font-bold ${user.momo.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.momo.isVerified ? '✅ Verified' : '⏳ Pending'}
              </span>
            </div>
            {user.paystack?.subaccountCode && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Paystack Subaccount:</span>
                <span className="font-mono text-sm text-primary bg-gray-100 p-1 rounded">
                  {user.paystack.subaccountCode}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-bold text-primary mb-4">Account Status</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Account Status:</span>
            <span className={`font-bold ${
              user.accountStatus === 'active' ? 'text-green-600' : 
              user.accountStatus === 'suspended' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {user.accountStatus === 'active' ? '✅ Active' : 
               user.accountStatus === 'suspended' ? '⏸️ Suspended' : '🚫 Banned'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Online Status:</span>
            <span className={`font-bold ${user.isOnline ? 'text-green-600' : 'text-gray-600'}`}>
              {user.isOnline ? '🟢 Online' : '⚫ Offline'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Member Since:</span>
            <span className="font-bold text-primary">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          {user.lastLogin && (
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Last Login:</span>
              <span className="font-bold text-primary">
                {new Date(user.lastLogin).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={logout}
        className="w-full mt-4 flex items-center justify-center p-4 bg-red-500 text-white font-bold text-lg rounded-md active:scale-95 transition-transform"
      >
        <span className="mr-2">🚪</span>
        Logout
      </button>
    </div>
  );
};

export default ProfileScreen;
