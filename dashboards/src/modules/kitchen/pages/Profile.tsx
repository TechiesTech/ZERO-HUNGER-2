import React, { useEffect, useState } from 'react';
import { kitchenApi } from '../services/kitchenApi';
import type { KitchenProfile } from '../types';
import { useAuth } from '@core/auth/useAuth';
import { formatDeliveryAddress } from '../components/formatDeliveryAddress';
import {
  MapPin,
  Crosshair,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  RefreshCw,
} from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<KitchenProfile | null>(null);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await kitchenApi.getProfile();
      if (res.data) {
        setProfile(res.data);
        setAddress(formatDeliveryAddress(res.data.address));
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
    if (!address.trim() || latitude === '' || longitude === '') {
      setFeedback({ type: 'error', message: 'Enter the kitchen address, latitude, and longitude.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        address,
        location: {
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
      };

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

  const hasLocation = Boolean(latitude !== '' && longitude !== '');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Kitchen Profile</span>
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Update your kitchen address and map coordinates so delivery partners can find your pickup location.
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
              {user?.name || 'Kitchen Partner'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-white/40 uppercase text-[10px] block flex items-center gap-1">
              <Mail size={11} /> Registered Email
            </span>
            <span className="text-white font-medium text-xs mt-0.5 block">
              {user?.email}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-white/40 uppercase text-[10px] block flex items-center gap-1">
              <Phone size={11} /> Contact Phone
            </span>
            <span className="text-white font-medium text-xs mt-0.5 block">
              {user?.phone || 'Not registered'}
            </span>
          </div>
        </div>
      </div>

      {/* Address & GPS Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-[#0D1719] border border-white/8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
            <MapPin size={16} className="text-[#49E619]" />
            <span>Kitchen Address & Location</span>
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
                Latitude
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
                Longitude
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#49E619] hover:text-white border border-[#49E619]/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Crosshair size={14} className={detectingGps ? 'animate-spin' : ''} />
              {detectingGps ? 'Detecting GPS...' : 'Auto-Detect Current GPS Coordinates'}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <MapPin size={15} className="text-[#49E619]" />
            <span>Shared with delivery partners for pickup</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#49E619] hover:bg-[#3dd111] text-black text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-[#49E619]/10"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Profile & Location'}
          </button>
        </div>
      </form>
    </div>
  );
}

