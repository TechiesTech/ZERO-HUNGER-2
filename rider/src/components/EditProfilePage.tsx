import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import type { RiderUser, VehicleType } from '../types/rider';

interface EditProfilePageProps {
  user: RiderUser | null;
  onBack: () => void;
  onSave: (data: Partial<RiderUser>) => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ user, onBack, onSave }) => {
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
  }>({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    vehicleType: user?.vehicleType || 'bike',
    vehicleNumber: user?.vehicleNumber || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData as Partial<RiderUser>);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 pt-safe pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="h-10 w-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-white">Edit Profile</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 px-4 rounded-xl bg-[#49E619] hover:bg-[#3ED016] text-zinc-950 font-bold text-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#49E619] focus:outline-none transition-all"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#49E619] focus:outline-none transition-all"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#49E619] focus:outline-none transition-all"
          />
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2">Vehicle Type</label>
          <select
            value={formData.vehicleType}
            onChange={(e) => handleChange('vehicleType', e.target.value as VehicleType)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#49E619] focus:outline-none transition-all"
          >
            <option value="bike">Bike</option>
            <option value="scooty">Scooty</option>
          </select>
        </div>

        {/* Vehicle Number */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2">Vehicle Number</label>
          <input
            type="text"
            value={formData.vehicleNumber}
            onChange={(e) => handleChange('vehicleNumber', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#49E619] focus:outline-none transition-all"
            placeholder="e.g., AP09AB1234"
          />
        </div>
      </div>
    </div>
  );
};
