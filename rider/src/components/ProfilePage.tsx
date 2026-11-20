import React from 'react';
import { ArrowLeft, Edit3, User, Phone, Mail, Bike, Star, MapPin } from 'lucide-react';
import type { RiderUser } from '../types/rider';

interface ProfilePageProps {
  user: RiderUser | null;
  onBack: () => void;
  onEditProfile: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onEditProfile }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 pt-safe pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white">Profile</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-[#49E619] flex items-center justify-center text-zinc-950 text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'R'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <p className="text-sm text-zinc-400">{user?.vehicleType || 'N/A'} - {user?.vehicleNumber || 'N/A'}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-zinc-300">4.8 (156 reviews)</span>
              </div>
            </div>
            <button
              onClick={onEditProfile}
              className="h-10 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-2 transition-all active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-semibold">Edit</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#49E619]">156</p>
              <p className="text-xs text-zinc-400">Deliveries</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#49E619]">₹12,450</p>
              <p className="text-xs text-zinc-400">Earnings</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#49E619]">98%</p>
              <p className="text-xs text-zinc-400">Rating</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
              <User className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Name</p>
                <p className="text-sm font-semibold text-white">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
              <Phone className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Phone</p>
                <p className="text-sm font-semibold text-white">{user?.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
              <Mail className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Email</p>
                <p className="text-sm font-semibold text-white">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h3 className="text-lg font-bold text-white mb-4">Vehicle Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
              <Bike className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Vehicle Type</p>
                <p className="text-sm font-semibold text-white">{user?.vehicleType || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
              <MapPin className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-400">Vehicle Number</p>
                <p className="text-sm font-semibold text-white">{user?.vehicleNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Link */}
        <button className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Settings</span>
          <span className="text-zinc-400">→</span>
        </button>
      </div>
    </div>
  );
};
