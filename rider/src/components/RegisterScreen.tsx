import React, { useState } from 'react';
import { Bike, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { riderService } from '../services/riderService';
import type { VehicleType } from '../types/rider';

interface RegisterScreenProps {
  onBackToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'bike' as VehicleType,
    vehicleNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await riderService.registerRider(formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-[#49E619]/10 border border-[#49E619]/30 text-[#49E619] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">Application Submitted!</h2>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          Your rider application has been received and is waiting for administrator approval. You will receive an update once activated.
        </p>
        <button
          onClick={onBackToLogin}
          className="w-full h-14 bg-zinc-800 text-white font-bold text-sm rounded-xl mt-6 active:scale-95"
        >
          BACK TO LOGIN
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col p-5 pt-safe pb-safe max-w-md mx-auto">
      <button
        onClick={onBackToLogin}
        className="self-start h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 flex items-center gap-1.5 active:scale-95 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-xl font-black text-white">Become a Rider Partner</h1>
      <p className="text-xs text-zinc-400 mb-5">Deliver meals, support Zero Hunger, and earn daily.</p>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-semibold text-rose-300 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-300">Full Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Ravi Kumar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 text-sm text-white outline-none focus:border-[#49E619]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-300">Email Address</label>
          <input
            type="email"
            required
            placeholder="ravi@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 text-sm text-white outline-none focus:border-[#49E619]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-300">Mobile Phone (10 digits)</label>
          <input
            type="tel"
            required
            placeholder="9876543210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 text-sm text-white outline-none focus:border-[#49E619]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-300">Password (min 8 chars)</label>
          <input
            type="password"
            required
            placeholder="Create password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 text-sm text-white outline-none focus:border-[#49E619]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-300">Vehicle Type</label>
            <select
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleType })}
              className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-sm text-white outline-none focus:border-[#49E619]"
            >
              <option value="bike">Bike (Motorcycle)</option>
              <option value="scooty">Scooty / Scooter</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-300">Vehicle Number</label>
            <input
              type="text"
              required
              placeholder="TN09AB1234"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
              className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-sm text-white outline-none focus:border-[#49E619] font-mono"
            >
            </input>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-[#49E619] hover:bg-[#3ED016] active:scale-98 text-zinc-950 font-black text-sm rounded-xl mt-4 shadow-lg shadow-[#49E619]/20"
        >
          {loading ? 'SUBMITTING...' : 'SUBMIT REGISTRATION'}
        </button>
      </form>
    </div>
  );
};

