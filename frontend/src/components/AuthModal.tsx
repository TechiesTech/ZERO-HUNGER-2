import React, { useEffect, useState } from 'react';
import { AlertCircle, Lock, Mail, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from './Button';

type AuthView = 'signin' | 'signup' | 'forgot' | 'verify';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void | Promise<void>;
  initialNotice?: string;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  onVerifyEmail: (email: string, code: string) => Promise<void>;
  onResendVerificationCode: (email: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  onResetPassword: (email: string, code: string, password: string) => Promise<void>;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;
const inputClass =
  'w-full rounded-[8px] border border-[#122023]/20 bg-white px-3 py-2.5 text-sm text-[#080808] focus:border-[#122023] focus:outline-none';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  initialNotice = '',
  onSignIn,
  onSignUp,
  onVerifyEmail,
  onResendVerificationCode,
  onForgotPassword,
  onResetPassword,
}) => {
  const [view, setView] = useState<AuthView>('signin');
  const [forgotReset, setForgotReset] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setView('signin');
    setForgotReset(false);
    setNotice(initialNotice);
    setError('');
    setCode('');
    setVerificationEmail('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  const switchView = (next: AuthView) => {
    setView(next);
    setForgotReset(false);
    setPassword('');
    setConfirmation('');
    setCode('');
    setNotice('');
    setError('');
  };

  const run = async (action: () => Promise<void>) => {
    setLoading(true);
    setError('');
    try {
      await action();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const finishAuthentication = async () => {
    await onAuthenticated();
    onClose();
  };

  const submitSignIn = (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailPattern.test(email.trim()) && !phonePattern.test(email.trim())) {
      setError('Enter a valid email address or Indian mobile number.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    void run(async () => {
      const authenticated = await onSignIn(email.trim(), password);
      if (authenticated) {
        await finishAuthentication();
      } else {
        setVerificationEmail(emailPattern.test(email.trim()) ? email.trim() : '');
        setView('verify');
        setNotice(
          emailPattern.test(email.trim())
            ? 'We sent a verification code to your email.'
            : 'We sent a verification code to the email address on your account.'
        );
      }
    });
  };

  const submitSignUp = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError('Enter your full name.');
      return;
    }
    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (phone.trim() && !phonePattern.test(phone.trim())) {
      setError('Enter a valid Indian mobile number or leave the field blank.');
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError('Use a password between 8 and 72 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    void run(async () => {
      setVerificationEmail(email.trim());
      await onSignUp(name.trim(), email.trim(), password, phone.trim() || undefined);
      setView('verify');
      setNotice('We sent a verification code to your email.');
    });
  };

  const submitForgot = (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!forgotReset) {
      void run(async () => {
        await onForgotPassword(email.trim());
        setForgotReset(true);
        setNotice('If your account exists, a reset code has been sent to your email.');
      });
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit reset code.');
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError('Use a password between 8 and 72 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    void run(async () => {
      await onResetPassword(email.trim(), code, password);
      switchView('signin');
      setNotice('Password reset. Sign in with your new password.');
    });
  };

  const submitVerification = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit verification code.');
      return;
    }
    void run(async () => {
      if (!emailPattern.test(verificationEmail.trim())) {
        setError('Enter the email address associated with this account.');
        return;
      }
      await onVerifyEmail(verificationEmail.trim(), code);
      await finishAuthentication();
    });
  };

  const title =
    view === 'signup'
      ? 'Create Account'
      : view === 'forgot'
        ? forgotReset
          ? 'Reset Password'
          : 'Forgot Password'
        : view === 'verify'
          ? 'Verify Email'
          : 'Sign In';
  const subtitle =
    view === 'signup'
      ? 'Create an account to order and track meals.'
      : view === 'forgot'
        ? 'Recover access to your account.'
        : view === 'verify'
          ? verificationEmail
            ? `Enter the 6-digit code sent to ${verificationEmail}.`
            : 'Enter the email address associated with your account and the 6-digit code.'
          : 'Sign in to continue to checkout.';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) onClose();
          }}
        >
          <div className="fixed inset-0 bg-[#080808]/80 backdrop-blur-xs" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="relative z-10 my-8 w-full max-w-md overflow-hidden rounded-[18px] border border-[#122023]/15 bg-white shadow-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <header className="flex items-start justify-between border-b border-white/10 bg-[#122023] px-6 py-5 text-white sm:px-8">
              <div>
                <span className="block text-[11px] font-mono-tabular font-bold uppercase tracking-[0.2em] text-[#49E619]">
                  {view === 'signup' ? 'JOIN THE MISSION' : view === 'forgot' || view === 'verify' ? 'ACCOUNT RECOVERY' : 'WELCOME BACK'}
                </span>
                <h2 id="auth-modal-title" className="mt-1 font-display-sans text-2xl font-black uppercase">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="Close sign in"
                className="flex h-9 w-9 items-center justify-center rounded-[8px] text-white/70 transition-colors hover:bg-[#49E619] hover:text-[#080808] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="p-6 sm:p-8">
              <p className="mb-5 text-sm leading-relaxed text-[#6F6F6F]">{subtitle}</p>
              {notice && (
                <p role="status" className="mb-4 rounded-[10px] border border-[#188D44]/30 bg-[#B9FF2C]/30 p-3 text-sm text-[#122023]">
                  {notice}
                </p>
              )}
              {error && (
                <p role="alert" className="mb-4 flex items-start gap-2 rounded-[10px] border border-[#D7262F]/30 bg-[#D7262F]/10 p-3 text-sm text-[#D7262F]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              {view === 'signin' && (
                <form onSubmit={submitSignIn} className="space-y-4">
                  <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Email or phone
                    <span className="relative block">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#122023]/50" />
                      <input className={`${inputClass} pl-10`} type="text" autoComplete="username" placeholder="you@example.com or 9876543210" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </span>
                  </label>
                  <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Password
                    <span className="relative block">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#122023]/50" />
                      <input className={`${inputClass} pl-10`} type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                    </span>
                  </label>
                  <button type="button" onClick={() => switchView('forgot')} className="text-xs font-bold text-[#188D44] hover:text-[#080808]">
                    Forgot password?
                  </button>
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Please wait...' : 'Sign In'}
                  </Button>
                </form>
              )}

              {view === 'signup' && (
                <form onSubmit={submitSignUp} className="space-y-4">
                  <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Full name
                    <span className="relative block">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#122023]/50" />
                      <input className={`${inputClass} pl-10`} type="text" autoComplete="name" placeholder="Your full name" value={name} onChange={(event) => setName(event.target.value)} required />
                    </span>
                  </label>
                  <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Email address
                    <span className="relative block">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#122023]/50" />
                      <input className={`${inputClass} pl-10`} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </span>
                  </label>
                  <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Phone number <span className="font-normal normal-case">(optional)</span>
                    <input className={inputClass} type="tel" autoComplete="tel" placeholder="9876543210" value={phone} onChange={(event) => setPhone(event.target.value)} />
                  </label>
                  <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Password
                    <input className={inputClass} type="password" autoComplete="new-password" placeholder="8 to 72 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={72} required />
                  </label>
                  <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Confirm password
                    <input className={inputClass} type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
                  </label>
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Please wait...' : 'Create Account'}
                  </Button>
                </form>
              )}

              {view === 'verify' && (
                <form onSubmit={submitVerification} className="space-y-4">
                  {!verificationEmail && (
                    <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                      Account email address
                      <input className={inputClass} type="email" autoComplete="email" placeholder="you@example.com" value={verificationEmail} onChange={(event) => setVerificationEmail(event.target.value)} required />
                    </label>
                  )}
                  <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    6-digit verification code
                    <input className={`${inputClass} font-mono-tabular tracking-[0.4em]`} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} required />
                  </label>
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Please wait...' : 'Verify Email'}
                  </Button>
                  <button type="button" disabled={loading} onClick={() => void run(async () => {
                    if (!emailPattern.test(verificationEmail.trim())) {
                      throw new Error('Enter the email address associated with this account first.');
                    }
                    await onResendVerificationCode(verificationEmail.trim());
                    setNotice('A new verification code has been sent.');
                  })} className="w-full text-center text-xs font-bold text-[#188D44] disabled:opacity-50">
                    Resend verification code
                  </button>
                </form>
              )}

              {view === 'forgot' && (
                <form onSubmit={submitForgot} className="space-y-4">
                  <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                    Email address
                    <span className="relative block">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#122023]/50" />
                      <input className={`${inputClass} pl-10`} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </span>
                  </label>
                  {forgotReset && (
                    <>
                      <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                        6-digit reset code
                        <input className={`${inputClass} font-mono-tabular tracking-[0.4em]`} type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} required />
                      </label>
                      <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                        New password
                        <input className={inputClass} type="password" autoComplete="new-password" placeholder="8 to 72 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={72} required />
                      </label>
                      <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
                        Confirm new password
                        <input className={inputClass} type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
                      </label>
                    </>
                  )}
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Please wait...' : forgotReset ? 'Update Password' : 'Send Reset Code'}
                  </Button>
                </form>
              )}
            </div>

            <footer className="border-t border-[#122023]/10 bg-[#F2F4F3] px-6 py-4 text-center text-sm text-[#6F6F6F] sm:px-8">
              {view === 'signin' && (
                <>New to Zero Hunger? <button type="button" onClick={() => switchView('signup')} className="font-bold text-[#080808] underline decoration-[#49E619] decoration-2 underline-offset-4">Create an account</button></>
              )}
              {view === 'signup' && (
                <>Already have an account? <button type="button" onClick={() => switchView('signin')} className="font-bold text-[#080808] underline decoration-[#49E619] decoration-2 underline-offset-4">Sign in</button></>
              )}
              {(view === 'forgot' || view === 'verify') && (
                <button type="button" onClick={() => switchView('signin')} className="font-bold text-[#080808] underline decoration-[#49E619] decoration-2 underline-offset-4">Back to Sign In</button>
              )}
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
