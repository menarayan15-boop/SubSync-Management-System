import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Activity,
} from 'lucide-react';

const ProfileSettingsPage = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [emailAlerts, setEmailAlerts] = useState(user?.notificationPreferences?.email ?? true);
  const [quotaAlerts, setQuotaAlerts] = useState(user?.notificationPreferences?.quotaAlerts ?? true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setAlert(null);
    try {
      setProfileLoading(true);
      const res = await api.put('/auth/update-profile', {
        name,
        phone,
        avatar,
        notificationPreferences: {
          email: emailAlerts,
          quotaAlerts: quotaAlerts,
          inApp: true,
          billingAlerts: true,
        },
      });

      if (res.data.success) {
        setAlert({ type: 'success', text: 'Profile details updated successfully.' });
        await refreshUser();
      }
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (newPassword.length < 6) {
      setAlert({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setAlert({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.put('/auth/update-password', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        setAlert({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/auth/account');
        logout();
        navigate('/');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete account.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal information, security credentials, and system notifications.
        </p>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between shadow-soft ${
            alert.type === 'success'
              ? 'bg-teal-50 text-teal-800 border border-teal-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alert.text}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Profile Details Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-slate-100 rounded-xl text-navy-900">
            <User className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-900">Personal Information</h2>
            <p className="text-xs text-slate-500">Update your public identity and phone details</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs sm:text-sm cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Primary account identifier (verified)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Access</label>
              <input
                type="text"
                disabled
                value={user?.role?.toUpperCase() || 'USER'}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs sm:text-sm uppercase font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          {/* Notification Toggles */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Alert Preferences</h3>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-semibold text-navy-900">Email Notifications</p>
                <p className="text-[11px] text-slate-500">Receive receipts, renewals, and system alerts</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-semibold text-navy-900">Quota Limit Warnings</p>
                <p className="text-[11px] text-slate-500">Notify when daily download bandwidth hits 80% and 100%</p>
              </div>
              <input
                type="checkbox"
                checked={quotaAlerts}
                onChange={(e) => setQuotaAlerts(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow-soft transition-all"
            >
              {profileLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-slate-100 rounded-xl text-navy-900">
            <Lock className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-900">Security & Password</h2>
            <p className="text-xs text-slate-500">Ensure your account is protected with a strong passphrase</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-500 hover:text-slate-700 flex items-center space-x-1"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'Hide password' : 'Show password'}</span>
            </button>
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow-soft transition-all"
            >
              {passwordLoading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-rose-50/50 rounded-3xl border border-rose-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-rose-900">Danger Zone: Delete Account</h3>
          <p className="text-xs text-rose-700 mt-1 max-w-md leading-relaxed">
            Permanently delete your user profile, active memberships, and download history. This action cannot be reversed.
          </p>
        </div>
        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-soft transition-all shrink-0"
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
