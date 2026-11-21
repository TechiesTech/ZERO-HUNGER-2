import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Lock, Mail } from 'lucide-react';
import { useAuth } from '@core/auth/useAuth';

export function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      setSuccess(await forgotPassword(email));
      setCodeSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      setSuccess(await resetPassword(email, code, newPassword));
      setCodeSent(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/8 bg-[#0D1719] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#49E619]/20 bg-[#49E619]/10 text-[#49E619]">
            <KeyRound size={22} />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-[#49E619]">Reset Password</h1>
        </div>

        {error && <div role="alert" className="mb-5 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-xs text-red-400"><AlertCircle size={16} />{error}</div>}
        {success && <div role="status" className="mb-5 flex gap-2 rounded-xl border border-[#49E619]/25 bg-[#49E619]/10 p-3.5 text-xs text-[#49E619]"><CheckCircle2 size={16} />{success}</div>}

        {!codeSent ? (
          <form onSubmit={handleRequestCode} className="space-y-5">
            <p className="text-xs leading-relaxed text-white/60">Enter your registered email address. We will send a 6-digit reset code.</p>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/70">
              Registered Email
              <span className="relative mt-2 block">
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#080808] py-3 pl-10 pr-4 text-sm text-white focus:border-[#49E619]/50 focus:outline-none" required />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </span>
            </label>
            <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#49E619] py-3.5 text-sm font-bold uppercase tracking-wider text-[#080808] disabled:opacity-50">
              {isLoading ? 'Sending Code...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-xs leading-relaxed text-white/60">Enter the 6-digit code sent to <strong className="text-white">{email}</strong> and choose a new password.</p>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/70">
              6-Digit Code
              <input type="text" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-center font-mono-tabular text-lg tracking-[0.3em] text-white focus:border-[#49E619]/50 focus:outline-none" required />
            </label>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/70">
              New Password
              <span className="relative mt-2 block">
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#080808] py-3 pl-10 pr-4 text-sm text-white focus:border-[#49E619]/50 focus:outline-none" required />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </span>
            </label>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/70">
              Confirm New Password
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-sm text-white focus:border-[#49E619]/50 focus:outline-none" required />
            </label>
            <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#49E619] py-3.5 text-sm font-bold uppercase tracking-wider text-[#080808] disabled:opacity-50">
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white">
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
