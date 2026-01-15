
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import DutyToggle from '../components/DutyToggle';
import { LogoutIcon } from '../components/icons/ActionIcons';
import WalletCard from '../components/WalletCard';
import { WalletSummaryIcons } from '../components/icons/NavIcons';
import { riderApi } from '../services/api';

const ProfileScreen: React.FC = () => {
  const { user, logout, updateUser } = useAppContext();
  const [profileForm, setProfileForm] = useState({
    firstName: user?.profile.firstName || '',
    lastName: user?.profile.lastName || '',
    phone: user?.profile.phone || ''
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [momoForm, setMomoForm] = useState({ momoNumber: '', momoNetwork: 'mtn' });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!user) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const response = await riderApi.updateProfile({
        profile: {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone
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
      await riderApi.changePassword({
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
      await riderApi.verifyMomo({
        momoNumber: momoForm.momoNumber,
        momoNetwork: momoForm.momoNetwork as any
      });
      const refreshed = await riderApi.getProfile();
      updateUser(refreshed.data.user);
      setStatusMessage('MoMo verified and payout recipient updated.');
    } catch (error: any) {
      setStatusMessage(error.message || 'MoMo verification failed.');
    }
  };

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

      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-bold text-primary mb-4">Edit Profile</h2>
        <form className="space-y-3" onSubmit={handleProfileUpdate}>
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
