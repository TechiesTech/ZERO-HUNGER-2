import React, { useEffect, useState } from 'react';
import { kitchenApi } from '../services/kitchenApi';
import type { KitchenProfile } from '../types';
import { useAuth } from '@core/auth/useAuth';
import {
  MapPin,
  Crosshair,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

export function Profile() {
  const { user, changePassword } = useAuth();
  const [profile, setProfile] = useState<KitchenProfile | null>(null);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Change password modal
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pwdSaving, setPwdSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await kitchenApi.getProfile();
      if (res.data) {
        setProfile(res.data);
        setAddress(res.data.address || '');
        setLatitude(res.data.location?.latitude ?? '');
        setLongitude(res.data.location?.longitude ?? '');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load profile details',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setDetectingGps(false);
      },
      (err) => {
        alert(`Failed to detect GPS location: ${err.message}`);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload: {
        address?: string;
        location?: { latitude: number; longitude: number };
      } = {
        address,
      };

      if (latitude !== '' && longitude !== '') {
        payload.location = {
          latitude: Number(latitude),
          longitude: Number(longitude),
        };
      }

      const res = await kitchenApi.updateProfile(payload);
      if (res.data) {
        setProfile(res.data);
      }
      setFeedback({
        type: 'success',
        message: 'Kitchen address and GPS coordinates updated successfully!',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update kitchen details',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (newPwd.length < 8) {
      setPwdFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPwd !== confirmPwd) {
      setPwdFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setPwdSaving(true);
    try {
      await changePassword(currPwd, newPwd);
      setPwdFeedback({ type: 'success', message: 'Password changed successfully!' });
      setCurrPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setTimeout(() => {
        setPwdModalOpen(false);
        setPwdFeedback(null);
      }, 1500);
    } catch (err) {
      setPwdFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update password',
      });
    } finally {
      setPwdSaving(false);
    }
  };

  const hasLocation = Boolean(latitude !== '' && longitude !== '');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Kitchen Profile & OSRM Location</span>
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Configure your commercial kitchen address and GPS coordinates for accurate dispatch routing.
          </p>
        </div>

        <button
          onClick={loadProfile}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer self-start sm:self-center"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Reload
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#49E619]/10 border border-[#49E619]/25 text-[#49E619]'
              : 'bg-red-500/10 border border-red-500/25 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Account Info Readonly Card */}
      <div className="p-6 rounded-2xl bg-[#0D1719] border border-white/8 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
          <Building2 size={16} className="text-[#49E619]" />
          <span>Account Credentials</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-white/40 uppercase text-[10px] block">Kitchen Name</span>
            <span className="text-white font-semibold text-sm mt-0.5 block">
              {profile?.name || user?.name || 'Kitchen Partner'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-white/40 uppercase text-[10px] block flex items-center gap-1">
              <Mail size={11} /> Registered Email
            </span>
            <span className="text-white font-medium text-xs mt-0.5 block">
              {profile?.email || user?.email}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-white/40 uppercase text-[10px] block flex items-center gap-1">
              <Phone size={11} /> Contact Phone
            </span>
            <span className="text-white font-medium text-xs mt-0.5 block">
              {profile?.phone || 'Not registered'}
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setPwdModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer"
          >
            <KeyRound size={13} />
            Change Password
          </button>
        </div>
      </div>

      {/* Address & GPS Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-[#0D1719] border border-white/8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
            <MapPin size={16} className="text-[#4EDBE2]" />
            <span>Kitchen Address & Road Routing Coordinates</span>
          </h2>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              hasLocation
                ? 'bg-[#49E619]/10 text-[#49E619] border border-[#49E619]/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {hasLocation ? 'GPS Configured' : 'GPS Required'}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
              Physical Street Address *
            </label>
            <textarea
              rows={3}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50 transition-colors leading-relaxed"
              placeholder="e.g. Shop No 4, Gandhi Road, T Nagar, Chennai - 600017"
            />
            <p className="text-[11px] text-white/40 mt-1">
              Used by delivery partners to locate the pickup point.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                Latitude (OSRM) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 font-mono-tabular focus:outline-none focus:border-[#49E619]/50 transition-colors"
                placeholder="e.g. 13.0418"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                Longitude (OSRM) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 font-mono-tabular focus:outline-none focus:border-[#49E619]/50 transition-colors"
                placeholder="e.g. 80.2341"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleAutoDetectLocation}
              disabled={detectingGps}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#4EDBE2] hover:text-white border border-[#4EDBE2]/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Crosshair size={14} className={detectingGps ? 'animate-spin' : ''} />
              {detectingGps ? 'Detecting GPS...' : 'Auto-Detect Current GPS Coordinates'}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <ShieldCheck size={15} className="text-[#49E619]" />
            <span>Synchronized with OSRM routing engine</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#49E619] hover:bg-[#3dd111] text-black text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-[#49E619]/10"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Profile & GPS'}
          </button>
        </div>
      </form>

      {/* CHANGE PASSWORD MODAL */}
      {pwdModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D1719] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound size={18} className="text-[#49E619]" />
              <span>Change Account Password</span>
            </h3>

            {pwdFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pwdFeedback.type === 'success'
                    ? 'bg-[#49E619]/10 border border-[#49E619]/25 text-[#49E619]'
                    : 'bg-red-500/10 border border-red-500/25 text-red-400'
                }`}
              >
                {pwdFeedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{pwdFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurr ? 'text' : 'password'}
                    required
                    value={currPwd}
                    onChange={(e) => setCurrPwd(e.target.value)}
                    className="w-full pl-9 pr-11 py-2 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50"
                  />
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowCurr(!showCurr)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#49E619] transition-colors rounded cursor-pointer"
                    title={showCurr ? 'Hide password' : 'Show password'}
                    aria-label={showCurr ? 'Hide password' : 'Show password'}
                  >
                    {showCurr ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  New Password (Min 8 chars)
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full pl-9 pr-11 py-2 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50"
                  />
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#49E619] transition-colors rounded cursor-pointer"
                    title={showNew ? 'Hide password' : 'Show password'}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full pl-9 pr-11 py-2 bg-[#080808] border border-white/10 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#49E619]/50"
                  />
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#49E619] transition-colors rounded cursor-pointer"
                    title={showConfirm ? 'Hide password' : 'Show password'}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPwdModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="px-5 py-2 rounded-xl bg-[#49E619] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#3dd111] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {pwdSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

