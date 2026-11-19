import React, { useState } from 'react';
import { Bike, KeyRound, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (identifier: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onLoginSuccess(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-5 pt-safe pb-safe max-w-md mx-auto">
      {/* Top Brand */}
      <div className="pt-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
          <Bike className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">ZERO HUNGER</h1>
          <p className="text-xs font-bold text-emerald-400 tracking-wider uppercase mt-0.5">
            Rider Delivery Partner
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
        <h2 className="text-lg font-black text-white">Rider Login</h2>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Email or Phone Number</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. 9876543210 or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full h-12 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 text-sm font-medium text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 text-sm font-medium text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-zinc-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform mt-2"
          >
            <span>{loading ? 'LOGGING IN...' : 'SIGN IN AS RIDER'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Switch to Register */}
      <div className="text-center pt-4">
        <p className="text-xs text-zinc-400">
          Want to become a delivery partner?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-emerald-400 font-bold underline ml-1 active:scale-95"
          >
            Register as Rider
          </button>
        </p>
      </div>
    </div>
  );
};

