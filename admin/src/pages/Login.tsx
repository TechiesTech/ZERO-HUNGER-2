import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { KeyRound, Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

type AuthView = 'LOGIN' | 'FORGOT_REQUEST' | 'FORGOT_VERIFY';

export function Login() {
  const [view, setView] = useState<AuthView>('LOGIN');

  // Login form state
  const [identifier, setIdentifier] = useState('admin@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  /* ── 1. Admin Login ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── 4. Forgot Password (Request OTP) ── */
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    try {
      const msg = await forgotPassword(forgotEmail);
      setSuccess(msg);
      setView('FORGOT_VERIFY');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── 5. Reset Password (Submit OTP) ── */
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

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
      const msg = await resetPassword(forgotEmail, resetCode, newPassword);
      setSuccess(msg);
      setIdentifier(forgotEmail);
      setPassword('');
      setView('LOGIN');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0D1719] border border-white/8 rounded-2xl p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#49E619]/10 border border-[#49E619]/20 text-[#49E619] mb-3">
            <KeyRound size={22} />
          </div>
          <h1 className="text-[#49E619] font-bold text-2xl tracking-wider uppercase">
            ZeroHunger
          </h1>
          <p className="text-white/40 text-xs tracking-widest uppercase mt-1">Admin Portal</p>
        </div>

        {/* Global Feedback Banners */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-[#49E619]/10 border border-[#49E619]/25 rounded-xl text-[#49E619] text-xs leading-relaxed">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* ── VIEW 1: LOGIN FORM ── */}
        {view === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-2">
                Email or Mobile Number
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#080808] border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                  placeholder="admin@gmail.com"
                  required
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-medium text-white/70 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setForgotEmail(identifier.includes('@') ? identifier : '');
                    setView('FORGOT_REQUEST');
                  }}
                  className="text-xs text-[#49E619] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-[#080808] border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#49E619] text-[#080808] font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-[#3dd111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-[#49E619]/10"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── VIEW 2: FORGOT PASSWORD (REQUEST OTP) ── */}
        {view === 'FORGOT_REQUEST' && (
          <form onSubmit={handleForgotRequest} className="space-y-5">
            <div>
              <p className="text-xs text-white/60 mb-4 leading-relaxed">
                Enter your registered admin email address. We will send a 6-digit OTP code to reset your password.
              </p>
              <label htmlFor="forgotEmail" className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-2">
                Registered Admin Email
              </label>
              <div className="relative">
                <input
                  id="forgotEmail"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#080808] border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#49E619]/50 transition-colors"
                  placeholder="admin@gmail.com"
                  required
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#49E619] text-[#080808] font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-[#3dd111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-[#49E619]/10"
            >
              {isLoading ? 'Sending Code...' : 'Send Reset Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                resetMessages();
                setView('LOGIN');
              }}
              className="w-full flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white transition-colors cursor-pointer py-1"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </form>
        )}

        {/* ── VIEW 3: RESET PASSWORD (SUBMIT OTP) ── */}
        {view === 'FORGOT_VERIFY' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <p className="text-xs text-white/60 mb-2 leading-relaxed">
              Enter the 6-digit verification code sent to <strong className="text-white">{forgotEmail}</strong> and your new password.
            </p>

            <div>
              <label htmlFor="resetCode" className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                id="resetCode"
                type="text"
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-[#080808] border border-white/10 rounded-xl text-white text-center tracking-[0.3em] font-mono-tabular text-lg focus:outline-none focus:border-[#49E619]/50 transition-colors"
                placeholder="123456"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                New Password (Min 8 chars)
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#49E619]/50 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#080808] border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#49E619]/50 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-[#49E619] text-[#080808] font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-[#3dd111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-[#49E619]/10"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                resetMessages();
                setView('FORGOT_REQUEST');
              }}
              className="w-full flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white transition-colors cursor-pointer py-1"
            >
              <ArrowLeft size={14} /> Back to email input
            </button>
          </form>
        )}

        <p className="text-center text-white/20 text-[11px] mt-8">
          Zero Hunger Admin Portal &copy; 2026
        </p>
      </div>
    </div>
  );
}
