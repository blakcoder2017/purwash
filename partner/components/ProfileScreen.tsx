import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import OnlineStatusToggle from './OnlineStatusToggle';
import { changePassword, updateProfile, verifyMomo, getProfile } from '../services/api';

const ProfileScreen: React.FC = () => {
  const { user, logout, updateUser } = useAppContext();
  const [profileForm, setProfileForm] = useState({
    businessName: user?.businessName || '',
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phone: user?.profile?.phone || '',
    bio: user?.bio || '',
    operatingOpen: user?.operatingHours?.open || '',
    operatingClose: user?.operatingHours?.close || ''
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [momoForm, setMomoForm] = useState({ momoNumber: '', momoNetwork: 'mtn' });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!user) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const response = await updateProfile({
        profile: {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone
        },
        businessName: profileForm.businessName,
        bio: profileForm.bio,
        operatingHours: {
          open: profileForm.operatingOpen,
          close: profileForm.operatingClose
        }
      });
      updateUser(response.data.user);
      setStatusMessage('Profile updated successfully.');
    } catch (error: any) {
      setStatusMessage(error.message || 'Failed to update profile.');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage('New password and confirmation do not match.');
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setStatusMessage('Password changed successfully.');
    } catch (error: any) {
      setStatusMessage(error.message || 'Failed to change password.');
    }
  };

  const handleMomoVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await verifyMomo({
        momoNumber: momoForm.momoNumber,
        momoNetwork: momoForm.momoNetwork,
        businessName: profileForm.businessName || user.businessName
      });
      const refreshed = await getProfile();
      updateUser(refreshed.data.user);
      setStatusMessage('MoMo verified and payout recipient updated.');
    } catch (error: any) {
      setStatusMessage(error.message || 'MoMo verification failed.');
    }
  };

  // Log specific fields for debugging
  console.log('Account Status:', user.accountStatus);
  console.log('Is Online:', user.isOnline);
  console.log('Created At:', user.createdAt);
  console.log('Full user object:', user);

  const clearCacheAndRelogin = () => {
    localStorage.removeItem('PurWashPartnerToken');
    localStorage.removeItem('PurWashPartnerUser');
    window.location.href = '/login';
  };

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
              {user.profile?.firstName || ''} {user.profile?.lastName || ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Email:</span>
            <span className="font-bold text-primary">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Phone:</span>
            <span className="font-bold text-primary">{user.profile?.phone || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Location:</span>
            <span className="font-bold text-primary text-sm">{user.location?.address || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Operating Hours:</span>
            <span className="font-bold text-primary">
              {user.operatingHours?.open || 'Not set'} - {user.operatingHours?.close || 'Not set'}
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
              <span className="font-bold text-primary uppercase">{user.momo?.network || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">MoMo Number:</span>
              <span className="font-bold text-primary">{user.momo?.number || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Verified Name:</span>
              <span className="font-bold text-primary">{user.momo?.resolvedName || 'Not verified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Verification Status:</span>
              <span className={`font-bold ${user.momo?.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.momo?.isVerified ? '✅ Verified' : '⏳ Pending'}
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
        <h2 className="text-xl font-bold text-primary mb-4">Edit Profile</h2>
        <form className="space-y-3" onSubmit={handleProfileUpdate}>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Business name"
            value={profileForm.businessName}
            onChange={(e) => setProfileForm(prev => ({ ...prev, businessName: e.target.value }))}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="First name"
            value={profileForm.firstName}
            onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Last name"
            value={profileForm.lastName}
            onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Phone"
            value={profileForm.phone}
            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Operating hours open (e.g. 8:00 AM)"
            value={profileForm.operatingOpen}
            onChange={(e) => setProfileForm(prev => ({ ...prev, operatingOpen: e.target.value }))}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Operating hours close (e.g. 6:00 PM)"
            value={profileForm.operatingClose}
            onChange={(e) => setProfileForm(prev => ({ ...prev, operatingClose: e.target.value }))}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Short bio"
            value={profileForm.bio}
            onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
          />
          <button className="w-full bg-primary text-white py-2 rounded-lg font-bold" type="submit">
            Save Profile
          </button>
        </form>
      </div>

      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-bold text-primary mb-4">Change Password</h2>
        <form className="space-y-3" onSubmit={handlePasswordUpdate}>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Current password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="New password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Confirm new password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
          />
          <button className="w-full bg-primary text-white py-2 rounded-lg font-bold" type="submit">
            Update Password
          </button>
        </form>
      </div>

      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-bold text-primary mb-4">Verify MoMo</h2>
        <form className="space-y-3" onSubmit={handleMomoVerify}>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={momoForm.momoNetwork}
            onChange={(e) => setMomoForm(prev => ({ ...prev, momoNetwork: e.target.value }))}
          >
            <option value="mtn">MTN</option>
            <option value="vod">Vodafone</option>
            <option value="atl">AirtelTigo</option>
          </select>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="MoMo number"
            value={momoForm.momoNumber}
            onChange={(e) => setMomoForm(prev => ({ ...prev, momoNumber: e.target.value }))}
          />
          <button className="w-full bg-primary text-white py-2 rounded-lg font-bold" type="submit">
            Verify & Update Recipient
          </button>
        </form>
      </div>

      {statusMessage && (
        <div className="text-center text-sm text-slate-600">{statusMessage}</div>
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
               user.accountStatus === 'suspended' ? '⏸️ Suspended' : 
               user.accountStatus === 'banned' ? '🚫 Banned' : '📋 Unknown'}
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
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
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
        onClick={clearCacheAndRelogin}
        className="w-full mt-4 flex items-center justify-center p-4 bg-yellow-500 text-white font-bold text-lg rounded-md active:scale-95 transition-transform"
      >
        <span className="mr-2">🔄</span>
        Clear Cache & Re-login
      </button>
      
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
