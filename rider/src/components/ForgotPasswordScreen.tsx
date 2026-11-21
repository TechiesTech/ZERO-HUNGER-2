import React, { useState } from 'react';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { riderService } from '../services/riderService';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onCodeSent: (email: string) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBack, onCodeSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Swipe right to go back
  useSwipeGesture({ onSwipeRight: onBack });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await riderService.forgotPassword(email);
      onCodeSent(email);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-5 pt-safe pb-safe max-w-md mx-auto">
      <button
        onClick={onBack}
        className="self-start h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 flex items-center gap-1.5 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="my-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-[#49E619]/10 border border-[#49E619]/30 text-[#49E619] flex items-center justify-center mx-auto">
            <KeyRound className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Forgot Password</h1>
            <p className="text-xs text-zinc-400 mt-1">Enter your email to receive a reset code</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 bg-zinc-900 border-zinc-800 border focus:border-[#49E619] rounded-xl pl-10 pr-4 text-sm font-medium text-white placeholder-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-[#49E619] hover:bg-[#3ED016] active:scale-98 text-zinc-950 font-black text-sm rounded-xl transition-transform disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Otp'}
          </button>
        </form>
      </div>
    </div>
  );
};
