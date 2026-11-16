import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Lock, LogOut } from 'lucide-react';
import { useAuth } from '@core/auth/useAuth';

export function ChangePassword() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current temporary password');
      return;
    }
    setIsLoading(true);
    try {
      setSuccess(await changePassword(currentPassword, newPassword));
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const passwordInput = (
    label: string,
    value: string,
    setValue: (value: string) => void,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    placeholder: string
  ) => (
    <label className="block text-xs font-medium uppercase tracking-wider text-white/70">
      {label}
      <span className="relative mt-1.5 block">
        <input type={visible ? 'text' : 'password'} value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#080808] py-2.5 pl-10 pr-12 text-sm text-white focus:border-[#49E619]/50 focus:outline-none" placeholder={placeholder} required />
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <button type="button" onClick={() => setVisible(!visible)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#49E619]" aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-[#0D1719] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400"><KeyRound size={22} /></div>
          <h1 className="text-xl font-bold tracking-wide text-white">Update Temporary Password</h1>
          <p className="mt-2 text-xs leading-relaxed text-white/60">
            Welcome, <strong className="text-white">{user?.name || 'Kitchen Partner'}</strong>.{' '}
            {user?.role === 'kitchen'
              ? 'For your security, you must replace your temporary password before accessing your kitchen operations.'
              : 'For your security, you must replace your temporary password before accessing the admin dashboard.'}
          </p>
        </div>
        {error && <div role="alert" className="mb-5 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-xs text-red-400"><AlertCircle size={16} />{error}</div>}
        {success && <div role="status" className="mb-5 flex gap-2 rounded-xl border border-[#49E619]/25 bg-[#49E619]/10 p-3.5 text-xs text-[#49E619]"><CheckCircle2 size={16} />{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {passwordInput('Current Temporary Password', currentPassword, setCurrentPassword, showCurrentPassword, setShowCurrentPassword, 'Temporary password from admin')}
          {passwordInput('New Permanent Password (Min 8 chars)', newPassword, setNewPassword, showNewPassword, setShowNewPassword, 'Choose a strong password')}
          {passwordInput('Confirm New Password', confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword, 'Re-enter new password')}
          <button type="submit" disabled={isLoading} className="mt-4 w-full rounded-xl bg-[#49E619] py-3 text-sm font-bold uppercase tracking-wider text-[#080808] shadow-lg shadow-[#49E619]/10 hover:bg-[#3dd111] disabled:opacity-50">
            {isLoading ? 'Updating Password...' : 'Save Password & Continue'}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/40">
          <span>{user?.role === 'kitchen' ? 'Zero Hunger Kitchen' : 'Zero Hunger Admin'}</span>
          <button onClick={handleLogout} className="inline-flex items-center gap-1.5 hover:text-white"><LogOut size={13} /> Sign out</button>
        </div>
      </div>
    </div>
  );
}
