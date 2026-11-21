import React, { useState } from 'react';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { riderService } from '../services/riderService';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface VerifyEmailScreenProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ email, onVerified, onBack }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Swipe right to go back
  useSwipeGesture({ onSwipeRight: onBack });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await riderService.verifyEmail(email, code);
      onVerified();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await riderService.resendCode(email);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
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
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Verify Email</h1>
            <p className="text-xs text-zinc-400 mt-1">
              We sent a verification code to <span className="text-[#49E619] font-semibold">{email}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Verification Code</label>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={code[index] || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value) {
                      const newCode = code.split('');
                      newCode[index] = value;
                      setCode(newCode.join('').slice(0, 6));
                      // Auto-focus next input
                      if (index < 5) {
                        const inputs = e.currentTarget.parentElement?.querySelectorAll('input');
                        (inputs?.[index + 1] as HTMLInputElement)?.focus();
                      }
                    } else {
                      const newCode = code.split('');
                      newCode[index] = '';
                      setCode(newCode.join(''));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !code[index] && index > 0) {
                      const inputs = e.currentTarget.parentElement?.querySelectorAll('input');
                      (inputs?.[index - 1] as HTMLInputElement)?.focus();
                    }
                  }}
                  className="w-12 h-14 bg-zinc-900 border-zinc-800 border focus:border-[#49E619] rounded-xl text-center text-2xl font-bold text-white outline-none transition-colors"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full h-14 bg-[#49E619] hover:bg-[#3ED016] active:scale-98 text-zinc-950 font-black text-sm rounded-xl transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-xs text-zinc-400 hover:text-[#49E619] flex items-center gap-1.5 mx-auto transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
};
